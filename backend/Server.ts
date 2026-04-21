import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { Pool, QueryResult } from 'pg';
import cors from 'cors';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';

// Resolve dotenv early
import dotenv from 'dotenv';
const dotenvPath = process.env.DOTENV_PATH || path.join(__dirname, '../config/Mail.env');
dotenv.config({ path: dotenvPath });

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_shipment_app';
const sendPasswordResetEmail = process.env.SEND_PASSWORD_RESET_EMAIL === 'true';

interface TokenEntry {
    userId: number;
    expires: number;
}
const passwordResetTokens: Record<string, TokenEntry> = {};

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

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
    credentials: true
}));
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

// Extend Express Request object
interface JwtPayload {
    id: number;
    email: string;
}

interface UserProfile {
    id: string | number;
    name: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            userDetails?: UserProfile;
        }
    }
}

function normalizeMaterialTypeName(raw: any): string {
    if (raw == null || raw === '') return '';
    return String(raw).trim().toUpperCase();
}

function normalizeUom(raw: any): string {
    if (raw == null || raw === '') return '';
    return String(raw).trim().toUpperCase();
}

// JSON API Fallbacks or Utilities
app.get('/api/material-types', async (req: Request, res: Response) => {
    try {
        const r = await pool.query(`
            SELECT mt.id, mt.name, mt.category_id, rc.name AS category_name
            FROM material_types mt
            LEFT JOIN rm_categories rc ON mt.category_id = rc.id
            ORDER BY mt.name ASC
        `);
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching material types' });
    }
});

app.get('/api/rm-categories', async (req: Request, res: Response) => {
    try {
        const r = await pool.query('SELECT id, name FROM rm_categories ORDER BY name ASC');
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching categories' });
    }
});

app.get('/api/rm-shapes', authenticate, async (req: Request, res: Response) => {
    try {
        const { category_id } = req.query;
        if (!category_id) {
            const r = await pool.query('SELECT * FROM rm_shapes ORDER BY category_id, shape_name ASC');
            res.json(r.rows);
            return;
        }
        const r = await pool.query(
            'SELECT * FROM rm_shapes WHERE category_id = $1 ORDER BY shape_name ASC',
            [Number(category_id)]
        );
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching shapes' });
    }
});

app.get('/api/material-grades', authenticate, async (req: Request, res: Response) => {
    try {
        const { material_type_id } = req.query;
        if (!material_type_id) {
            res.json([]);
            return;
        }
        const r = await pool.query(
            'SELECT id, grade FROM material_grades WHERE material_type_id = $1 ORDER BY grade ASC',
            [Number(material_type_id)]
        );
        res.json(r.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching grades' });
    }
});

// SSR AUTH MIDDLEWARE -> changed to pure JSON middleware
async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = payload;

        const email = String(req.user.email).toLowerCase();
        const profile = await pool.query('SELECT id, name, email, role FROM users WHERE email=$1 LIMIT 1', [email]);
        if (profile.rows.length > 0) {
            req.userDetails = profile.rows[0];
        } else {
            req.userDetails = { id: '', name: 'Unknown', email: email, role: 'Unknown' };
        }

        next();
    } catch (err) {
        res.clearCookie('token');
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return;
    }
}

const REPORT_UOM_EXPR = `COALESCE(NULLIF(trim(both FROM COALESCE(uom::text, '')), ''), 'N/A')`;

app.get('/api/me', authenticate, (req: Request, res: Response) => {
    res.json({ user: req.userDetails });
});

app.get('/api/dashboard', authenticate, async (req: Request, res: Response) => {
    try {
        const typesRow = await pool.query('SELECT id, name FROM material_types ORDER BY name ASC');
        res.json({ materialTypes: typesRow.rows });
    } catch (e) {
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

app.get('/api/reports', authenticate, async (req: Request, res: Response) => {
    try {
        const totals = await pool.query(`SELECT COUNT(*)::bigint AS total_entries, COALESCE(SUM(kgs), 0) AS total_kgs FROM shipments`);
        const breakdown = await pool.query(`
            SELECT material_type, COALESCE(SUM(kgs), 0) AS total_kgs
            FROM shipments
            GROUP BY material_type
            ORDER BY total_kgs DESC
        `);

        const page = Math.max(0, Number(req.query.page) || 0);
        const limit = 10;
        const offset = page * limit;
        const shipments = await pool.query('SELECT rm_code, raw_material_dimensions, material_shape, material_grade, material_type, uom, kgs, shipment_date FROM shipments ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);

        res.json({
            totals: totals.rows[0] || { total_entries: 0, total_kgs: 0 },
            breakdown: breakdown.rows || [],
            shipments: shipments.rows,
            page
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error loading reports" });
    }
});


// FORM ACTIONS
app.post('/api/signup', async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const existing = await pool.query('SELECT id FROM auth_users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

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
        res.json({ success: true, message: 'Registration successful! Please log in.' });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

app.post('/api/signin', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Missing credentials' });
        return;
    }
    try {
        const normalizedEmail = email.toLowerCase();
        const result = await pool.query('SELECT id, name, email, password_hash, role FROM auth_users WHERE email = $1', [normalizedEmail]);
        if (result.rows.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '4h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (err) {
        res.status(500).json({ error: 'Sign in failed' });
    }
});

app.post('/api/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.post('/api/add', authenticate, async (req: Request, res: Response): Promise<void> => {
    const {
        raw_material_dimensions, material_shape, material_grade, material_type,
        new_material_type, uom, kgs, shipment_date,
        // FK IDs from the dynamic form
        category_id, material_type_id, material_shape_id, material_grade_id
    } = req.body;
    try {
        let typeNorm = normalizeMaterialTypeName(material_type === '__new__' ? new_material_type : material_type);
        if (!typeNorm) {
            res.status(400).json({ error: 'Missing material type' });
            return;
        }

        const uomNorm = normalizeUom(uom);
        const kgsNum = kgs != null ? Number(kgs) : NaN;
        if (!uomNorm || !Number.isFinite(kgsNum)) {
            res.status(400).json({ error: 'Invalid units' });
            return;
        }

        // Insert into material_types FIRST to satisfy foreign key constraints
        await pool.query('INSERT INTO material_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [typeNorm]);

        // If adding a new material type with a category, set its category_id
        const newMatCatId = req.body.new_material_category_id;
        if (newMatCatId) {
            await pool.query(
                'UPDATE material_types SET category_id = $1 WHERE name = $2 AND category_id IS NULL',
                [Number(newMatCatId), typeNorm]
            );
        }

        // Resolve material_type_id if not provided
        let resolvedTypeId = material_type_id ? Number(material_type_id) : null;
        if (!resolvedTypeId) {
            const typeRow = await pool.query('SELECT id FROM material_types WHERE name = $1', [typeNorm]);
            resolvedTypeId = typeRow.rows[0]?.id || null;
        }

        // Resolve grade_id if grade string provided but no ID
        let resolvedGradeId = material_grade_id ? Number(material_grade_id) : null;
        if (!resolvedGradeId && material_grade && resolvedTypeId) {
            const gradeRow = await pool.query(
                'SELECT id FROM material_grades WHERE material_type_id = $1 AND grade = $2',
                [resolvedTypeId, material_grade]
            );
            resolvedGradeId = gradeRow.rows[0]?.id || null;
        }

        const inserted = await pool.query(
            `INSERT INTO shipments
               (raw_material_dimensions, material_shape, material_grade, material_type,
                uom, kgs, shipment_date,
                material_type_id, material_shape_id, material_grade_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING id`,
            [
                raw_material_dimensions,
                material_shape || null,
                material_grade || null,
                typeNorm,
                uomNorm,
                kgsNum,
                shipment_date || null,
                resolvedTypeId,
                material_shape_id ? Number(material_shape_id) : null,
                resolvedGradeId
            ]
        );

        const newShipmentId = inserted.rows[0].id;
        const rmCode = `RM-${String(newShipmentId).padStart(5, '0')}`;
        await pool.query('UPDATE shipments SET rm_code = $1 WHERE id = $2', [rmCode, newShipmentId]);

        const actorEmail = req.user?.email || 'unknown';
        const newRow = {
            rm_code: rmCode,
            raw_material_dimensions,
            material_shape: material_shape || null,
            material_grade: material_grade || null,
            material_type: typeNorm,
            uom: uomNorm,
            kgs: kgsNum,
            shipment_date: shipment_date || null,
            material_type_id: resolvedTypeId,
            material_shape_id: material_shape_id || null,
            material_grade_id: resolvedGradeId
        };

        await pool.query(
            `INSERT INTO shipment_audit (shipment_id, action, actor_email, new_row)
             VALUES ($1, 'INSERT', $2, $3)`,
            [newShipmentId, actorEmail, JSON.stringify(newRow)]
        );

        res.json({ success: true, rm_code: rmCode });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error inserting data' });
    }
});

app.get('/api/download', authenticate, async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT rm_code, raw_material_dimensions, material_shape, material_grade, material_type, uom, kgs, shipment_date FROM shipments ORDER BY id ASC LIMIT 20000");
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Raw material");
        sheet.columns = [
            { header: 'RM Code', key: 'rm_code', width: 14 },
            { header: 'Rm Dimensions', key: 'raw_material_dimensions', width: 26 },
            { header: 'Shape', key: 'material_shape', width: 15 },
            { header: 'Material Grade', key: 'material_grade', width: 18 },
            { header: 'Material', key: 'material_type', width: 16 },
            { header: 'UOM', key: 'uom', width: 12 },
            { header: 'Kgs', key: 'kgs', width: 14 },
            { header: 'Date', key: 'shipment_date', width: 20 }
        ];

        for (let row of result.rows) {
            sheet.addRow({
                rm_code: row.rm_code || '',
                raw_material_dimensions: row.raw_material_dimensions || '',
                material_shape: row.material_shape || '',
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
        res.status(500).json({ error: "Error downloading Excel" });
    }
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 TypeScript API Server running on http://${HOST}:${PORT}`);
});
server.on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});
