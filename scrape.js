import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const URL = 'https://udyamregistration.gov.in/UdyamRegistration.aspx';

function normalizeField($, el) {
  const id = el.attribs.id || el.attribs.name || '';
  const label = id ? $(`label[for="${id}"]`).text().trim() || $(el).attr('aria-label') || null : null;
  const tag = el.tagName.toLowerCase();
  let type = $(el).attr('type') || (tag === 'select' ? 'select' : 'text');
  const placeholder = $(el).attr('placeholder') || null;
  const required = $(el).is('[required]') || false;
  const pattern = $(el).attr('pattern') || null;
  const maxlength = $(el).attr('maxlength') ? parseInt($(el).attr('maxlength'), 10) : null;

  const field = { id, name: $(el).attr('name') || id, label, tag, type, placeholder, required, pattern, maxlength };
  if (tag === 'select') {
    field.options = [];
    $(el).find('option').each((i, opt) => {
      const text = $(opt).text().trim();
      const value = $(opt).attr('value') || text;
      if (text) field.options.push({ label: text, value });
    });
  }
  return field;
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });

  // STEP 1 (initial render before OTP)
  const html1 = await page.content();
  let $ = cheerio.load(html1);
  const step1Fields = [];
  $('input, select, textarea').each((_, el) => {
    const f = normalizeField($, el);
    if (f.id || f.name) step1Fields.push(f);
  });

  // Try to click OTP button if present to reveal OTP field(s)
  const otpSelectors = ['#btnValidateAadhaar', 'input[id*="btnGenerateOTP"]', 'button:contains("OTP")'];
  for (const sel of otpSelectors) {
    try {
      await page.click(sel);
      await page.waitForTimeout(1500);
      break;
    } catch {}
  }

  // STEP 2 (PAN area may be separate section; capture after interaction as well)
  const html2 = await page.content();
  $ = cheerio.load(html2);
  const step2Fields = [];
  $('input, select, textarea').each((_, el) => {
    const f = normalizeField($, el);
    if (f.id || f.name) step2Fields.push(f);
  });

  // Add known validation rules (PAN/Aadhaar) if missing
  const ensureRule = (arr, key, regex) => {
    const i = arr.findIndex(x => (x.id||'').toLowerCase().includes(key) || (x.name||'').toLowerCase().includes(key));
    if (i !== -1 && !arr[i].pattern) arr[i].pattern = regex;
  };
  ensureRule(step1Fields, 'aadhaar', '^\\d{12}$');
  ensureRule(step2Fields, 'pan', '^[A-Z]{5}[0-9]{4}[A-Z]{1}$');

  const schema = {
    generatedAt: new Date().toISOString(),
    source: URL,
    steps: [
      { title: "Step 1 – Aadhaar & OTP", fields: step1Fields },
      { title: "Step 2 – PAN Validation", fields: step2Fields }
    ]
  };

  const outDir = process.env.OUT_DIR || '../frontend-react-ts/public';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'schema.json'), JSON.stringify(schema, null, 2));
  console.log('Saved schema to', path.join(outDir, 'schema.json'));

  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
