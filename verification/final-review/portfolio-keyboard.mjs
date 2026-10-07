// Final review copy of verification/hw1-m2/audit.mjs; adaptations documented in prepare.py.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
function resolveModule(name) {
  for(const base of [process.env.QA_NODE_MODULES,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)) {
    try { return require.resolve(path.join(base,name)); } catch {}
  }
  return require.resolve(name);
}
const {chromium}=require(resolveModule('playwright'));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const phase=process.argv[2]||'after';
if(!['before','after'].includes(phase)) throw new Error('Expected before or after');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {
    if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(5500,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const cases=[];
const order=['.skip-link','.brand',...['about','skills','projects','homework','events','contact'].map(id=>`.nav-links a[href="#${id}"]`),'#theme-toggle','.hero-actions a[href="#projects"]','.hero-actions a[href="#contact"]',...['about','skills','events'].map(id=>`.card-footer a[href="#${id}"]`),'#homework a[href="homework/drum-kit/"]','#homework a[href="homework/event-hub/"]',...['loading','ready','empty','error'].map(state=>`button[data-state="${state}"]`),'#contact-name','#contact-email','#contact-message','#contact-form button[type="submit"]','.site-footer a'];

for(const width of [375,1440]) for(const theme of ['light','dark']) for(const mode of ['normal','storage-property-denied','storage-read-denied','storage-write-denied','invalid-stored-theme']) {
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  const record={width,theme,mode,checks:[],errors:[]};
  cases.push(record);
  const check=(name,passed,actual)=>record.checks.push({name,passed,actual});
  page.on('pageerror',e=>record.errors.push(e.message));
  await page.addInitScript(mode=>{
    if(mode==='storage-property-denied') Object.defineProperty(window,'localStorage',{get(){throw new DOMException('M2 test: storage access denied','SecurityError');}});
    if(mode==='storage-read-denied') Storage.prototype.getItem=function(){throw new DOMException('M2 test: storage read denied','SecurityError');};
    if(mode==='storage-write-denied') Storage.prototype.setItem=function(){throw new DOMException('M2 test: storage write denied','QuotaExceededError');};
    if(mode==='invalid-stored-theme') localStorage.setItem('theme','unexpected-theme');
  },mode);
  try {
    await page.goto('http://127.0.0.1:5500/');
    await page.waitForTimeout(1000);
    const initial=await page.locator('#theme-toggle').getAttribute('aria-pressed');
    check('initial theme matches system fallback',initial===String(theme==='dark'),initial);
    const events=await page.locator('#event-status').innerText();
    check('event hub initializes despite optional storage failures',events.includes('3 upcoming events'),events);

    if(mode==='normal') {
      const traces=[];
      for(const selector of order) {
        await page.keyboard.press('Tab');
        const focus=await page.evaluate(selector=>{
          const e=document.activeElement,s=getComputedStyle(e);
          return {matches:e.matches(selector),element:e.id||e.textContent.trim(),visible:e.matches(':focus-visible')&&s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2};
        },selector);
        traces.push({selector,...focus});
      }
      check('Tab reaches all 25 targets in document order with visible focus',traces.every(t=>t.matches&&t.visible),traces);
      const reverse=[];
      for(const selector of order.slice(0,-1).reverse()) {
        await page.keyboard.press('Shift+Tab');
        reverse.push({selector,matches:await page.evaluate(s=>document.activeElement.matches(s),selector)});
      }
      check('Shift+Tab returns from footer to skip link without a trap',reverse.every(t=>t.matches),reverse);
      const skip=[];
      for(let n=0;n<2;n++) {
        if(n) for(let i=0;i<9;i++) await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Enter');
        const mainFocused=await page.evaluate(()=>document.activeElement.id==='main');
        await page.keyboard.press('Tab');
        const nextLink=await page.evaluate(()=>document.activeElement.matches('.hero-actions a[href="#projects"]'));
        skip.push({mainFocused,nextLink,hash:await page.evaluate(()=>location.hash)});
      }
      check('repeated skip-link activation focuses main and bypasses header',skip.every(t=>t.mainFocused&&t.nextLink&&t.hash==='#main'),skip);

      await page.goto('http://127.0.0.1:5500/');
      await page.waitForTimeout(1000);
      for(let i=0;i<8;i++) await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      check('Contact navigation activates with Enter',await page.evaluate(()=>location.hash==='#contact'),await page.evaluate(()=>location.hash));
      await page.keyboard.press('Tab');
      check('contact anchor leads into first form field',await page.evaluate(()=>document.activeElement.id==='contact-name'),await page.evaluate(()=>document.activeElement.id));
      await page.keyboard.type('Hoai An');await page.keyboard.press('Tab');
      await page.keyboard.type('an@example.com');await page.keyboard.press('Tab');
      await page.keyboard.type('Keyboard test for HW1 M2.');await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      const feedback=await page.locator('#form-feedback').innerText();
      check('valid contact form submits with keyboard and local feedback',feedback.includes('Form validated'),feedback);
      await page.keyboard.press('Tab');
      check('Tab exits form to footer',await page.evaluate(()=>document.activeElement.matches('.site-footer a')),await page.evaluate(()=>document.activeElement.textContent.trim()));

      await page.goto('http://127.0.0.1:5500/');await page.waitForTimeout(1000);
      for(let i=0;i<20;i++) await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');await page.keyboard.press('Tab');
      const retryFocused=await page.evaluate(()=>document.activeElement.matches('.retry-button'));
      check('Error and Retry reachable using only keyboard',retryFocused,await page.evaluate(()=>document.activeElement.textContent.trim()));
      if(retryFocused) {await page.keyboard.press('Enter');await page.waitForTimeout(1000);}
      check('Retry activates with Enter and loads events',(await page.locator('#event-status').innerText()).includes('3 upcoming events'),await page.locator('#event-status').innerText());
    }

    // Native focus() establishes a starting point; activation below is real keyboard input.
    await page.locator('#theme-toggle').focus();
    await page.keyboard.press('Enter');
    const first=await page.evaluate(()=>({value:document.documentElement.dataset.theme,pressed:document.querySelector('#theme-toggle').getAttribute('aria-pressed'),name:document.querySelector('#theme-toggle').getAttribute('aria-label'),focused:document.activeElement.id}));
    const next=theme==='dark'?'light':'dark';
    check('Enter toggles theme, updates accessibility state and retains focus',first.value===next&&first.pressed===String(next==='dark')&&first.name.toLowerCase().includes('theme')&&first.focused==='theme-toggle',first);
    await page.keyboard.press('Space');
    const second=await page.evaluate(()=>({value:document.documentElement.dataset.theme,pressed:document.querySelector('#theme-toggle').getAttribute('aria-pressed'),focused:document.activeElement.id}));
    check('Space toggles back even when storage is unavailable',second.value===theme&&second.pressed===String(theme==='dark')&&second.focused==='theme-toggle',second);
    if(mode==='normal') {
      await page.keyboard.press('Enter');await page.reload();await page.waitForTimeout(1000);
      const persisted=await page.evaluate(()=>({stored:localStorage.getItem('theme'),value:document.documentElement.dataset.theme,pressed:document.querySelector('#theme-toggle').getAttribute('aria-pressed')}));
      check('valid theme persists on reload when storage is available',persisted.stored===next&&persisted.value===next&&persisted.pressed===String(next==='dark'),persisted);
    }
    check('no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width);
  } catch(e) {check('scenario completed',false,e.message);}
  check('zero uncaught page errors',record.errors.length===0,record.errors);
  console.error(`${phase}: ${width}px ${theme} ${mode}: ${record.checks.filter(t=>!t.passed).length} failed checks`);
  await context.close();
}
const failures=cases.flatMap(c=>c.checks.filter(t=>!t.passed).map(t=>({width:c.width,theme:c.theme,mode:c.mode,...t})));
const report={date:new Date().toISOString(),phase,baselineCommit: '7ac14abdd9be04d2fa80b0ac4b65a5fbf37a8e00',tester:'Assistant automated browser checks; no student checks recorded',url:'http://127.0.0.1:5500/',browser:browser.version(),playwright:require(resolveModule('playwright/package.json')).version,cases,passed:failures.length===0,failures};
fs.mkdirSync(path.join(root,'verification/final-review'),{recursive:true});
fs.writeFileSync(path.join(root,`verification/final-review/portfolio-keyboard.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({phase,cases:cases.length,checks:cases.reduce((n,c)=>n+c.checks.length,0),passed:report.passed,failures},null,2));
if(phase==='after'&&!report.passed) process.exitCode=1;
await browser.close();server.close();
