
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const prisma = new PrismaClient();

// Load schema.json from frontend public folder (adjust FRONTEND_PUBLIC if needed)
const FRONTEND_PUBLIC = process.env.FRONTEND_PUBLIC || path.resolve(__dirname, '../../frontend-react-ts/public');
const schemaPath = path.join(FRONTEND_PUBLIC, 'schema.json');

function getSchema() {
  const raw = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(raw);
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/schema', (req, res) => {
  try {
    return res.json(getSchema());
  } catch (e) {
    return res.status(500).json({ error: 'Schema not found' });
  }
});

// Build zod schema dynamically from regex/required
function buildZodFromSchema(s) {
  const shape = {};
  s.steps.forEach(step => {
    step.fields.forEach(f => {
      let zf = z.string().optional();
      if (f.required) zf = z.string().min(1, `${f.label} is required`);
      if (f.maxlength) zf = zf.max(f.maxlength, `${f.label} too long`);
      if (f.pattern) zf = zf.regex(new RegExp(f.pattern), `${f.label} invalid`);
      shape[f.name] = zf;
    });
  });
  return z.object(shape);
}

app.post('/api/validate', (req, res) => {
  try {
    const s = getSchema();
    const shape = buildZodFromSchema(s);
    const parsed = shape.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Validation failed' });
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const s = getSchema();
    const shape = buildZodFromSchema(s);
    const parsed = shape.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }
    const data = parsed.data;
    const created = await prisma.submission.create({
      data: {
        aadhaar: data.aadhaarNumber || null,
        aadhaarName: data.aadhaarName || null,
        mobile: data.mobile || null,
        captcha: data.captcha || null,
        otp: data.otp || null,
        panNumber: data.panNumber || null,
        panName: data.panName || null,
        pinCode: data.pinCode || null,
        district: data.district || null,
        state: data.state || null,
        orgType: data.orgType || null,
        payload: data
      }
    });
    return res.json({ ok: true, id: created.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Submit failed' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('API listening on :' + PORT));
