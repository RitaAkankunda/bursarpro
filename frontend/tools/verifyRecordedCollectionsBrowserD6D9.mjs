/** Guided, non-destructive real-browser checks using an existing Chrome installation.
 * Requires npm install --no-save playwright (if not already present).
 * Run from frontend with node tools/verifyRecordedCollectionsBrowserD6D9.mjs.
 * No credentials, cookies or page content are saved; screenshots should be reviewed before sharing.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { assessPanel, makeEvidenceFilename } from '../src/features/finance/browserVerificationD6D9.mjs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Missing Playwright. From frontend run: npm install --no-save playwright'); process.exit(2); }
const origin = process.env.BURSARPRO_WEB_ORIGIN || 'http://localhost:5173';
if (!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?$/.test(origin)) {
  console.error('BLOCKED: Only localhost URLs accepted. Set BURSARPRO_WEB_ORIGIN=http://localhost:5173'); process.exit(2);
}
const rl = readline.createInterface({input: stdin, output: stdout});
const evidenceDir = path.resolve('browser-evidence-d6d9');
await fs.mkdir(evidenceDir, {recursive:true});
let browser;
try {
  browser = await chromium.launch({headless:false, channel:'chrome'});
  const ctx = await browser.newContext({acceptDownloads:false});
  const page = await ctx.newPage();
  await page.goto(origin, {waitUntil:'domcontentloaded'});
  console.log('\nIn Chrome, sign in using a TEST bursar or headmaster account and navigate to Overview.');
  console.log('Do not use real student data for screenshots. Test no write operations.');
  const steps = [
    'Authorized bursar or headmaster, with a term selected',
    'Change to another school term and verify displayed term and totals update',
    'Click Refresh collections and verify loading then valid totals',
    'Select no term or unavailable term: verified figures must disappear',
    'Test access-denied or failed report (if you have a safe test account/scenario)'
  ];
  let failures = 0;
  for (let i=0; i<steps.length; i++) {
    const response = await rl.question(`\nSTEP ${i+1}/${steps.length}: ${steps[i]}\nPerform in browser and press Enter to capture; type skip to skip: `);
    if (response.trim().toLowerCase() === 'skip') { console.log('SKIPPED'); continue; }
    const panel = page.getByRole('region', {name:'Verified recorded collections'});
    const present = await panel.count() > 0;
    const text = present ? await panel.innerText() : '';
    const alerts = present ? await panel.getByRole('alert').allTextContents() : [];
    const totalPresent = present && await panel.getByLabel('Validated recorded collections totals').count() > 0;
    const refresh = present && await panel.getByRole('button', {name:/Refresh collections|Refreshing/}).count() > 0;
    const termText = text.match(/Selected term #[0-9]+|No valid term selected/)?.[0] || '';
    const result = assessPanel({panelPresent:present, selectedTermText:termText, totalsVisible:totalPresent, alerts, refreshVisible:refresh});
    const expectedErrorState = i===3 || i===4;
    const expectedValidState = i<3;
    const statePass = (expectedErrorState && !totalPresent) || (expectedValidState && totalPresent);
    const passed = result.pass && statePass;
    if (!passed) failures++;
    const filename = makeEvidenceFilename(`step-${i+1}`, new Date().toISOString().replace(/[:.]/g,'-'));
    if (present) await panel.screenshot({path:path.join(evidenceDir,filename)});
    else await page.screenshot({path:path.join(evidenceDir,filename)});
    console.log(`${passed?'PASS':'CHECK REQUIRED'}: ${result.reason}; totals ${totalPresent?'visible':'hidden'}. Saved ${filename}`);
  }
  console.log(`\nBrowser checks complete: ${failures} failed/check-required. Screenshots stored locally under ${evidenceDir}`);
  if (failures) process.exitCode=1;
} catch (err) {
  console.error('Browser verification could not complete:',err.message);
  process.exitCode=1;
} finally { await browser?.close(); rl.close(); }
