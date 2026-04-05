const path = require('path');
const dotenvPath = process.env.DOTENV_PATH || path.join(__dirname, 'Mail.env');
require('dotenv').config({ path: dotenvPath });

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_shipment_app';

// Set SEND_PASSWORD_RESET_EMAIL=true in Mail.env when SMTP is configured and you want real emails.
const sendPasswordResetEmail = process.env.SEND_PASSWORD_RESET_EMAIL === 'true';

// In-memory password reset tokens for demo (replace with DB-backed tokens in production)
const passwordResetTokens = {};

// Email transporter setup (configure in environment variables)
// Example using Gmail (app password) or SMTP service
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'your-email@example.com',
        pass: process.env.SMTP_PASS || 'your-smtp-password'
    }
});

const app = express();

app.use(cors());
app.use(express.json());

// DB CONNECTION
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Shipment_db',
    password: 'Jaswanth2003M',
    port: 5432,
});

/** Material type codes (e.g. AL, SS) stored in UPPERCASE. */
function normalizeMaterialTypeName(raw) {
    if (raw == null || raw === '') return '';
    return String(raw).trim().toUpperCase();
}

function normalizeUom(raw) {
    if (raw == null || raw === '') return '';
    return String(raw).trim().toUpperCase();
}

// AUTH_DEBUG=true in Mail.env → GET /debug/auth-emails (list registered emails; dev only)
if (process.env.AUTH_DEBUG === 'true') {
    app.get('/debug/auth-emails', async (req, res) => {
        try {
            const r = await pool.query('SELECT id, name, email FROM auth_users ORDER BY id');
            res.json({ emails: r.rows });
        } catch (err) {
            console.error('debug/auth-emails:', err);
            res.status(500).json({ error: err.message });
        }
    });
}

// MATERIAL TYPES (dropdown: AL, SS, etc.)
app.get('/material-types', async (req, res) => {
    try {
        const r = await pool.query('SELECT id, name FROM material_types ORDER BY name ASC');
        res.json(r.rows);
    } catch (err) {
        console.error('GET /material-types error:', err);
        res.status(500).json({ error: 'Error fetching material types' });
    }
});

app.post('/material-types', async (req, res) => {
    const nameRaw = req.body && req.body.name;
    const name = normalizeMaterialTypeName(nameRaw);
    if (!name) return res.status(400).json({ error: 'Material type is required' });

    try {
        const inserted = await pool.query(
            'INSERT INTO material_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
            [name]
        );
        if (inserted.rows.length > 0) {
            return res.json({ ...inserted.rows[0], alreadyExists: false });
        }

        const existing = await pool.query('SELECT id, name FROM material_types WHERE name=$1', [name]);
        if (existing.rows.length > 0) {
            return res.json({ ...existing.rows[0], alreadyExists: true });
        }

        res.status(500).json({ error: 'Could not create material type' });
    } catch (err) {
        console.error('POST /material-types error:', err);
        res.status(500).json({ error: 'Error creating material type' });
    }
});

// INSERT raw material row (tracks actor in shipment_audit)
app.post('/add', authenticate, async (req, res) => {
    const {
        raw_material_dimensions,
        material_grade,
        material_type,
        uom,
        kgs,
        shipment_date,
    } = req.body;

    try {
        const actorEmail = req.user && req.user.email ? String(req.user.email).toLowerCase() : null;
        if (!actorEmail) return res.status(401).json({ error: 'Invalid token payload' });

        const typeNorm = normalizeMaterialTypeName(material_type);
        const typeForDb = typeNorm || null;
        const uomNorm = normalizeUom(uom);
        const uomForDb = uomNorm || null;
        const kgsNum = kgs != null && kgs !== '' ? Number(kgs) : NaN;
        const dims = raw_material_dimensions != null ? String(raw_material_dimensions).trim() : '';
        const grade = material_grade != null ? String(material_grade).trim() : '';

        if (!dims) return res.status(400).json({ error: 'Raw material dimensions are required' });
        if (!grade) return res.status(400).json({ error: 'Material grade is required' });
        if (!typeForDb) return res.status(400).json({ error: 'Material type is required' });
        if (!uomForDb) return res.status(400).json({ error: 'UOM is required' });
        if (!Number.isFinite(kgsNum)) return res.status(400).json({ error: 'Valid kgs is required' });

        const inserted = await pool.query(
            `INSERT INTO shipments (raw_material_dimensions, material_grade, material_type, uom, kgs, shipment_date)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, raw_material_dimensions, material_grade, material_type, uom, kgs, shipment_date`,
            [dims, grade, typeForDb, uomForDb, kgsNum, shipment_date || null]
        );

        const row = inserted.rows[0];

        const typeName = row.material_type ? String(row.material_type).trim() : '';
        if (typeName) {
            await pool.query(
                'INSERT INTO material_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [typeName]
            );
        }

        // Write audit row (expects shipment_audit table already created)
        await pool.query(
            `INSERT INTO shipment_audit (shipment_id, action, actor_email, new_row)
             VALUES ($1, 'INSERT', $2, $3::jsonb)`,
            [row.id, actorEmail, JSON.stringify(row)]
        );

        res.json({ message: "✅ Data inserted!", shipment_id: row.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "❌ Error inserting data" });
    }
});

// GET SHIPMENTS (supports pagination)
app.get('/data', async (req, res) => {
    try {
        const limit = Number(req.query.limit || 10);
        const offset = Number(req.query.offset || 0);
        const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 2000)) : 10;
        const safeOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

        const result = await pool.query(
            'SELECT * FROM shipments ORDER BY id DESC LIMIT $1 OFFSET $2',
            [safeLimit, safeOffset]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data");
    }
});

app.get('/shipments/count', async (req, res) => {
    try {
        const r = await pool.query('SELECT COUNT(*) AS total FROM shipments');
        res.json({ total: Number(r.rows[0]?.total || 0) });
    } catch (err) {
        console.error('shipments/count error:', err);
        res.status(500).json({ error: 'Error fetching count' });
    }
});

// Get one shipment row (used by Excel QR codes)
app.get('/shipments/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    try {
        const r = await pool.query(
            'SELECT id, raw_material_dimensions, material_grade, material_type, uom, kgs, shipment_date FROM shipments WHERE id=$1',
            [id]
        );
        if (r.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
        res.json(r.rows[0]);
    } catch (err) {
        console.error('GET /shipments/:id error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
console.log("Download route loaded");
// ✅ DOWNLOAD EXCEL (FIXED + STREAM)
app.get('/download', async (req, res) => {
    try {
        console.log("Download triggered"); // 👈 DEBUG

        const result = await pool.query(
            "SELECT id, raw_material_dimensions, material_grade, material_type, uom, kgs, shipment_date FROM shipments ORDER BY id ASC LIMIT 20000"
        );

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Raw material");

        const includeQr = String(req.query.qr || 'true').toLowerCase() !== 'false';
        const qrLimit = Math.min(Number(req.query.qrLimit || 100) || 100, 250); // safety cap
        // QR payload mode:
        // - text (default): QR contains the row details as text
        // - url: QR contains a link to GET /shipments/:id
        const qrMode = String(req.query.qrMode || 'text').toLowerCase(); // 'text' | 'url'
        const publicPort = Number(process.env.PORT) || 3000;
        const publicHost = process.env.HOST || '127.0.0.1';
        const baseUrl = `http://${publicHost}:${publicPort}`;

        // QR sizing (pixels)
        // Defaults requested: row height 140px, column width 155px
        const qrRowPx = Math.min(Math.max(Number(req.query.qrRowPx || 140) || 140, 80), 240);
        const qrColPx = Math.min(Math.max(Number(req.query.qrColPx || 155) || 155, 80), 300);
        const qrSizePx = Math.min(qrRowPx, qrColPx) - 10; // leave padding inside the cell

        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Rm Dimensions', key: 'raw_material_dimensions', width: 26 },
            { header: 'Material Grade', key: 'material_grade', width: 18 },
            { header: 'Material', key: 'material_type', width: 16 },
            { header: 'UOM', key: 'uom', width: 12 },
            { header: 'Kgs', key: 'kgs', width: 14 },
            { header: 'Date', key: 'shipment_date', width: 20 },
            { header: 'QR', key: 'qr', width: Math.ceil(qrColPx / 7) }
        ];

        // Header styling
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        sheet.autoFilter = { from: 'A1', to: 'H1' };
        const headerRow = sheet.getRow(1);
        headerRow.height = 18;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1F2937' }
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
            };
        });

        // Column formats
        sheet.getColumn('id').numFmt = '0';
        sheet.getColumn('kgs').numFmt = '#,##0.00';
        sheet.getColumn('shipment_date').numFmt = 'dd-mmm-yyyy';

        for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows[i];
            const excelRowIndex = i + 2; // header is row 1

            sheet.addRow({
                id: row.id,
                raw_material_dimensions: row.raw_material_dimensions || '',
                material_grade: row.material_grade || '',
                material_type: row.material_type || '',
                uom: row.uom || '',
                kgs: row.kgs != null ? Number(row.kgs) : 0,
                shipment_date: row.shipment_date ? new Date(row.shipment_date) : '',
                qr: ''
            });

            if (includeQr && i < qrLimit) {
                const dateText = row.shipment_date ? new Date(row.shipment_date).toISOString().slice(0, 10) : '';
                const payload =
                    qrMode === 'url'
                        ? `${baseUrl}/shipments/${row.id}`
                        : `Raw material details
ID: ${row.id}
Rm Dimensions: ${row.raw_material_dimensions || ''}
Material Grade: ${row.material_grade || ''}
Material: ${row.material_type || ''}
UOM: ${row.uom ?? ''}
Kgs: ${row.kgs ?? ''}
Date: ${dateText}`;

                const png = await QRCode.toBuffer(payload, {
                    type: 'png',
                    errorCorrectionLevel: 'M',
                    margin: 1,
                    width: 120
                });
                const imageId = workbook.addImage({ buffer: png, extension: 'png' });

                // Put the image into the QR column (G) of this row.
                // Excel row height is in points; ~0.75 points per pixel is a decent approximation.
                const qrRowHeight = Math.ceil(qrRowPx * 0.75);
                sheet.getRow(excelRowIndex).height = Math.max(sheet.getRow(excelRowIndex).height || 0, qrRowHeight);

                // Center QR cell contents
                const qrCell = sheet.getCell(excelRowIndex, 8); // H column, 1-based
                qrCell.alignment = { vertical: 'middle', horizontal: 'center' };

                sheet.addImage(imageId, {
                    // col/row are 0-based; H column = index 7 (QR)
                    tl: { col: 7.15, row: (excelRowIndex - 1) + 0.15 },
                    ext: { width: qrSizePx, height: qrSizePx }
                });
            }
        }

        // Data row styling (borders around filled cells / grid look)
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return;

            // Don't shrink rows that were expanded for QR codes
            row.height = Math.max(row.height || 0, 16);

            // Ensure borders for the expected columns (A..H)
            for (let col = 1; col <= 8; col++) {
                const cell = row.getCell(col);
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFF1F5F9' } },
                    left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
                    bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
                    right: { style: 'thin', color: { argb: 'FFF1F5F9' } }
                };

                if (col === 8) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                }
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=RawMaterial_Details.xlsx'
        );

        res.send(buffer);

    } catch (err) {
        console.error("🔥 DOWNLOAD ERROR:", err); // 👈 IMPORTANT
        res.status(500).send("Error downloading Excel");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// GET SINGLE USER DETAILS
app.get('/user', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users LIMIT 1");
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching user");
    }
});

// GET ALL USERS
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching users");
    }
});

// SIGNUP
app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const existing = await pool.query('SELECT id FROM auth_users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const roleValue = role ? String(role).trim() : '';
        if (!roleValue) {
            return res.status(400).json({ error: 'Designation is required' });
        }
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO auth_users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
            [name, normalizedEmail, password_hash, roleValue]
        );

        // Store user display data in `users` table (name, designation/role, email)
        // Use best-effort upsert by email (works even if there's no unique constraint by falling back to UPDATE).
        try {
            await pool.query(
                'INSERT INTO users (name, role, email) VALUES ($1,$2,$3)',
                [name, roleValue, normalizedEmail]
            );
        } catch (e) {
            // If insert fails (likely duplicate), update existing row by email
            await pool.query('UPDATE users SET name=$1, role=$2 WHERE email=$3', [name, roleValue, normalizedEmail]);
        }

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '4h' });

        res.json({ user: { id: user.id, name: name, email: normalizedEmail, role: roleValue }, token });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error on signup' });
    }
});

// SIGNIN
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const result = await pool.query('SELECT id, name, email, password_hash, role FROM auth_users WHERE email = $1', [normalizedEmail]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Sign-in blocked: login credentials are missing in the auth_users table for this email.',
                missingTable: 'auth_users',
            });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const u = await pool.query('SELECT id, name, email, role FROM users WHERE email=$1 LIMIT 1', [normalizedEmail]);
        if (u.rows.length === 0) {
            return res.status(401).json({
                error: 'Sign-in blocked: user profile is missing in the users table for this email. Restore the row or sign up again.',
                missingTable: 'users',
            });
        }

        const display = { id: user.id, ...u.rows[0] };

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '4h' });
        res.json({ user: display, token });
    } catch (err) {
        console.error('Signin error:', err);
        res.status(500).json({ error: 'Server error on signin' });
    }
});

// FORGOT PASSWORD
app.post('/forgot-password', async (req, res) => {
    // Browsers send "email"; PowerShell may send "Email"
    const raw = req.body && (req.body.email || req.body.Email);
    const email = typeof raw === 'string' ? raw.trim() : '';
    console.log('[forgot-password] body:', req.body == null ? null : JSON.stringify(req.body), '→ email:', email || '(missing)');
    if (!email) {
        return res.status(400).json({
            error: 'Email is required',
            hint: 'Send JSON body: {"email":"you@example.com"} with Content-Type: application/json'
        });
    }

    try {
        const result = await pool.query('SELECT id, email FROM auth_users WHERE email=$1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.json({
                message:
                    'No account was found for this email address. Please check for typos, try another address you may have used, or sign up to create a new account.',
                token: null
            });
        }

        const user = result.rows[0];
        const token = crypto.randomBytes(24).toString('hex');
        const expires = Date.now() + 3600 * 1000; // 1 hour

        passwordResetTokens[token] = { userId: user.id, expires };

        const publicPort = Number(process.env.PORT) || 3000;
        const resetLink = `http://127.0.0.1:${publicPort}/reset-password-form?token=${token}`;

        let emailSent = false;
        if (sendPasswordResetEmail) {
            try {
                await emailTransporter.sendMail({
                    from: process.env.SMTP_FROM || 'no-reply@example.com',
                    to: user.email,
                    subject: 'Shipment App Password Reset',
                    text: `Use this token to reset your password: ${token}\nOr click: ${resetLink}`,
                    html: `<p>Use this token to reset your password: <b>${token}</b></p><p>Or click: <a href="${resetLink}">${resetLink}</a></p>`
                });
                emailSent = true;
            } catch (mailErr) {
                console.warn('Email send failed, token returned in API response and logged:', mailErr);
            }
        }

        console.log(`Password reset token for ${user.email}: ${token}`);

        // Always return token in JSON so tools like PowerShell can read it (also logged above).
        const message = emailSent
            ? 'Password reset email sent. Token is also in this response for local/PowerShell use.'
            : 'Reset token issued (email not sent). Copy the token field for PowerShell or the form below.';
        res.json({ message, token });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error on forgot password' });
    }
});

// RESET PASSWORD
app.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });

    const entry = passwordResetTokens[token];
    if (!entry || entry.expires < Date.now()) {
        return res.status(400).json({ error: 'Reset token is invalid or expired' });
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE auth_users SET password_hash=$1 WHERE id=$2', [password_hash, entry.userId]);

        delete passwordResetTokens[token];

        res.json({ message: 'Your password has been updated. Please sign in with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error on reset password' });
    }
});

// AUTH MIDDLEWARE
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

app.get('/profile', authenticate, async (req, res) => {
    try {
        const email = (req.user && req.user.email) ? String(req.user.email).toLowerCase() : '';
        if (!email) return res.status(401).json({ error: 'Invalid token payload' });

        const authRow = await pool.query('SELECT 1 FROM auth_users WHERE email=$1 LIMIT 1', [email]);
        if (authRow.rows.length === 0) {
            return res.status(403).json({
                error: 'Profile unavailable: no row in auth_users for this account.',
                missingTable: 'auth_users',
            });
        }

        const result = await pool.query('SELECT id, name, email, role FROM users WHERE email=$1 LIMIT 1', [email]);
        if (result.rows.length === 0) {
            return res.status(403).json({
                error: 'Profile unavailable: no row in users for this account.',
                missingTable: 'users',
            });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Server error on profile' });
    }
});

// Normalized UOM for grouping (matches refresh INSERT)
const REPORT_UOM_EXPR = `COALESCE(NULLIF(trim(both FROM COALESCE(uom::text, '')), ''), 'N/A')`;

// GET REPORTS — report table: uom, material_grade, total_kgs only (one row per grade + UOM)
app.get('/reports', async (req, res) => {
    try {
        let breakdown;
        let totals;
        let needFallback = false;

        try {
            breakdown = await pool.query(
                `SELECT uom, material_grade, total_kgs FROM report ORDER BY material_grade ASC, uom ASC`
            );
            totals = await pool.query(`
                SELECT
                    (SELECT COUNT(*)::bigint FROM shipments) AS total_entries,
                    COALESCE((SELECT SUM(total_kgs) FROM report), 0) AS total_kgs
            `);

            if (breakdown.rows.length === 0) {
                needFallback = true;
            }
        } catch (innerErr) {
            console.warn('Report table query failed, falling back to shipments.', innerErr);
            needFallback = true;
        }

        if (needFallback) {
            const fallbackTotals = await pool.query(`
                SELECT COUNT(*)::bigint AS total_entries, COALESCE(SUM(kgs), 0) AS total_kgs
                FROM shipments
            `);
            const fallbackBreakdown = await pool.query(`
                SELECT ${REPORT_UOM_EXPR} AS uom,
                       material_grade,
                       COALESCE(SUM(kgs), 0) AS total_kgs
                FROM shipments
                GROUP BY material_grade, ${REPORT_UOM_EXPR}
                ORDER BY material_grade ASC, uom ASC
            `);
            totals = fallbackTotals;
            breakdown = fallbackBreakdown;
        }

        res.json({
            totals: totals.rows[0],
            breakdown: breakdown.rows
        });
    } catch (err) {
        console.error('Error in /reports:', err);
        res.status(500).json({ error: 'Error fetching report' });
    }
});

// REFRESH report table from shipments (material_grade + uom → total_kgs)
app.post('/reports/refresh', async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE report');
        await pool.query(`
            INSERT INTO report (material_grade, uom, total_kgs)
            SELECT material_grade,
                   ${REPORT_UOM_EXPR},
                   COALESCE(SUM(kgs), 0)
            FROM shipments
            GROUP BY material_grade, ${REPORT_UOM_EXPR}
        `);
        res.json({ message: 'Report refreshed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error refreshing reports');
    }
});
// START SERVER (IMPORTANT: ALWAYS LAST)
const PORT = Number(process.env.PORT) || 3000;
// Bind to 127.0.0.1 so Windows does not hit IPv4/IPv6 dual-stack quirks that can emit a bogus EADDRINUSE after listen.
const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log('Keep this terminal open while you use the app. Press Ctrl+C to stop the server.');
});

server.on('error', (err) => {
    // If we are already listening, ignore stray errors (Windows can emit a spurious EADDRINUSE after a successful bind).
    if (server.listening) {
        if (err.code !== 'EADDRINUSE') {
            console.warn('Server warning (ignored while running):', err.message || err);
        }
        return;
    }
    if (err.code === 'EADDRINUSE') {
        console.error(
            `Port ${PORT} is already in use. Another copy of this server may still be running, or another app is using that port.`
        );
        console.error('Close the other process, or set PORT=3001 in the environment and try again.');
    } else {
        console.error('Server failed to start:', err);
    }
    process.exit(1);
});

// On some Windows setups the terminal closes stdin; without active handles Node can exit.
// The HTTP server normally keeps the process alive; this is a safeguard for odd environments.
process.stdin.resume();

process.on('uncaughtException', (e) => {
    console.error('Uncaught exception:', e);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

