const path = require('path');
const dotenvPath = process.env.DOTENV_PATH || path.join(__dirname, '../config/Mail.env');
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
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_shipment_app';
const sendPasswordResetEmail = process.env.SEND_PASSWORD_RESET_EMAIL === 'true';
const passwordResetTokens = {};

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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const pool = new Pool({
    user: 'postgres.gwbdzlicmoewikklrtcv',
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Jaswanth2003M*',
    port: 6543,
    ssl: { rejectUnauthorized: false }
});

function normalizeMaterialTypeName(raw) {
    if (raw == null || raw === '') return '';
    return String(raw).trim().toUpperCase();
}
function normalizeUom(raw) {
    if (raw == null || raw === '') return '';
    return String(raw).trim().toUpperCase();
}

// SSR AUTH MIDDLEWARE
async function authenticate(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/?error=Please%20log%20in%20to%20continue');
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        
        // Fetch full user details for views
        const email = String(req.user.email).toLowerCase();
        const profile = await pool.query('SELECT id, name, email, role FROM users WHERE email=$1 LIMIT 1', [email]);
        if(profile.rows.length > 0) {
            req.userDetails = profile.rows[0];
        } else {
            req.userDetails = { id: '', name: 'Unknown', email: email, role: 'Unknown' };
        }
        
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/?error=Session%20expired,%20please%20log%20in%20again');
    }
}

// JSON API Fallbacks or Utilities
app.get('/material-types', async (req, res) => {
    try {
        const r = await pool.query('SELECT id, name FROM material_types ORDER BY name ASC');
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching material types' });
    }
});

const REPORT_UOM_EXPR = `COALESCE(NULLIF(trim(both FROM COALESCE(uom::text, '')), ''), 'N/A')`;

// SSR ROUTES
app.get('/', (req, res) => {
    if(req.cookies.token) {
        try {
            jwt.verify(req.cookies.token, JWT_SECRET);
            return res.redirect('/dashboard');
        } catch(e) {}
    }
    const error = req.query.error;
    const success = req.query.success;
    res.render('pages/auth', { error, success });
});

app.get('/dashboard', authenticate, async (req, res) => {
    try {
        const typesRow = await pool.query('SELECT id, name FROM material_types ORDER BY name ASC');
        const error = req.query.error;
        const success = req.query.success;
        res.render('pages/dashboard', { 
            user: req.userDetails, 
            materialTypes: typesRow.rows,
            error,
            success
        });
    } catch (e) {
        res.render('pages/dashboard', { user: req.userDetails, materialTypes: [], error: 'Failed to load data', success: null });
    }
});

app.get('/reports', authenticate, async (req, res) => {
    try {
        // Stats
        let breakdown;
        let totals;
        let needFallback = false;
        try {
            breakdown = await pool.query(`SELECT uom, material_grade, total_kgs FROM report ORDER BY material_grade ASC, uom ASC`);
            totals = await pool.query(`
                SELECT (SELECT COUNT(*)::bigint FROM shipments) AS total_entries,
                       COALESCE((SELECT SUM(total_kgs) FROM report), 0) AS total_kgs
            `);
            if (breakdown.rows.length === 0) needFallback = true;
        } catch (innerErr) { needFallback = true; }

        if (needFallback) {
            totals = await pool.query(`SELECT COUNT(*)::bigint AS total_entries, COALESCE(SUM(kgs), 0) AS total_kgs FROM shipments`);
            breakdown = await pool.query(`
                SELECT ${REPORT_UOM_EXPR} AS uom, material_grade, COALESCE(SUM(kgs), 0) AS total_kgs
                FROM shipments GROUP BY material_grade, ${REPORT_UOM_EXPR} ORDER BY material_grade ASC, uom ASC
            `);
        }

        // Pagination for shipments list
        const page = Math.max(0, Number(req.query.page) || 0);
        const limit = 10;
        const offset = page * limit;
        const shipments = await pool.query('SELECT * FROM shipments ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
        
        res.render('pages/reports', { 
            user: req.userDetails, 
            totals: totals.rows[0], 
            breakdown: breakdown.rows, 
            shipments: shipments.rows,
            page
        });
    } catch (e) {
        console.error(e);
        res.send("Error loading reports");
    }
});

app.get('/machines', authenticate, (req, res) => {
    res.render('pages/machines', { 
        user: req.userDetails, 
        selected: req.query.selected || null 
    });
});

// FORM ACTIONS
app.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.redirect('/?error=Missing%20fields');
    try {
        const normalizedEmail = email.toLowerCase();
        const existing = await pool.query('SELECT id FROM auth_users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length > 0) return res.redirect('/?error=Email%20already%20registered');
        
        const roleValue = role ? String(role).trim() : '';
        const password_hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO auth_users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
            [name, normalizedEmail, password_hash, roleValue]
        );
        try {
            await pool.query('INSERT INTO users (name, role, email) VALUES ($1,$2,$3)', [name, roleValue, normalizedEmail]);
        } catch (e) {
            await pool.query('UPDATE users SET name=$1, role=$2 WHERE email=$3', [name, roleValue, normalizedEmail]);
        }
        res.redirect('/?success=Registration%20successful!%20Please%20log%20in.');
    } catch (err) {
        res.redirect('/?error=Server%20Error');
    }
});

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.redirect('/?error=Missing%20credentials');
    try {
        const normalizedEmail = email.toLowerCase();
        const result = await pool.query('SELECT id, name, email, password_hash, role FROM auth_users WHERE email = $1', [normalizedEmail]);
        if (result.rows.length === 0) return res.redirect('/?error=Invalid%20credentials');
        
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.redirect('/?error=Invalid%20credentials');
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '4h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.redirect('/dashboard');
    } catch (err) {
        res.redirect('/?error=Sign%20in%20failed');
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/?success=Logged%20out%20successfully');
});

// ADD RAW MATERIAL
app.post('/add', authenticate, async (req, res) => {
    const { raw_material_dimensions, material_grade, material_type, new_material_type, uom, kgs, shipment_date } = req.body;
    try {
        let typeNorm = normalizeMaterialTypeName(material_type === '__new__' ? new_material_type : material_type);
        if (!typeNorm) return res.redirect('/dashboard?error=Missing%20material%20type');
        
        const uomNorm = normalizeUom(uom);
        const kgsNum = kgs != null ? Number(kgs) : NaN;
        if (!uomNorm || !Number.isFinite(kgsNum)) return res.redirect('/dashboard?error=Invalid%20units');
        
        const inserted = await pool.query(
            `INSERT INTO shipments (raw_material_dimensions, material_grade, material_type, uom, kgs, shipment_date)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [raw_material_dimensions, material_grade, typeNorm, uomNorm, kgsNum, shipment_date || null]
        );
        
        await pool.query('INSERT INTO material_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [typeNorm]);
        res.redirect('/dashboard?success=Data%20inserted%20successfully!');
    } catch (err) {
        res.redirect('/dashboard?error=Error%20inserting%20data');
    }
});

app.post('/reports/refresh', authenticate, async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE report');
        await pool.query(`
            INSERT INTO report (material_grade, uom, total_kgs)
            SELECT material_grade, ${REPORT_UOM_EXPR}, COALESCE(SUM(kgs), 0)
            FROM shipments GROUP BY material_grade, ${REPORT_UOM_EXPR}
        `);
        res.redirect('/reports');
    } catch (err) {
        res.status(500).send('Error refreshing reports');
    }
});

app.get('/download', authenticate, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, raw_material_dimensions, material_grade, material_type, uom, kgs, shipment_date FROM shipments ORDER BY id ASC LIMIT 20000");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Raw material");
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Rm Dimensions', key: 'raw_material_dimensions', width: 26 },
            { header: 'Material Grade', key: 'material_grade', width: 18 },
            { header: 'Material', key: 'material_type', width: 16 },
            { header: 'UOM', key: 'uom', width: 12 },
            { header: 'Kgs', key: 'kgs', width: 14 },
            { header: 'Date', key: 'shipment_date', width: 20 }
        ];
        
        for (let row of result.rows) {
            sheet.addRow({
                id: row.id,
                raw_material_dimensions: row.raw_material_dimensions || '',
                material_grade: row.material_grade || '',
                material_type: row.material_type || '',
                uom: row.uom || '',
                kgs: row.kgs != null ? Number(row.kgs) : 0,
                shipment_date: row.shipment_date ? new Date(row.shipment_date) : ''
            });
        }
        
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=RawMaterial_Details.xlsx');
        res.send(buffer);
    } catch (err) {
        res.status(500).send("Error downloading Excel");
    }
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
server.on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
