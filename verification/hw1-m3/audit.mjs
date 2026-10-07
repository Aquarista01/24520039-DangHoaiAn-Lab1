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
const config=fs.existsSync(path.join(root,'vercel.json'))?JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8')):null;
const headers=config?.headers?.find(rule=>rule.source==='/(.*)')?.headers||[];
const headerPolicy=headers.find(h=>h.key.toLowerCase()==='content-security-policy')?.value||null;
const cases=[];
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
function serverFor(port,headerEnabled) {
  const server=http.createServer((req,res)=>{
    if(req.url==='/__frame-probe') {res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><title>Frame probe</title><iframe title="Protected portfolio" src="http://127.0.0.1:5500/"></iframe></html>');return;}
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(file!==root&&!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    try {
      if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
      if(headerEnabled) for(const h of headers) res.setHeader(h.key,h.value);
      res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    } catch {res.writeHead(404).end();}
  });
  return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
const servers=[await serverFor(5500,true),await serverFor(5501,false)];
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
for(const width of [375,1440]) for(const theme of ['light','dark']) for(const delivery of ['header-and-meta','meta-only']) {
  const url=`http://127.0.0.1:${delivery==='meta-only'?5501:5500}/`;
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  const record={width,theme,delivery,url,checks:[],pageErrors:[],consoleErrors:[],requests:[]};
  cases.push(record);
  const check=(name,passed,actual)=>record.checks.push({name,passed,actual});
  page.on('pageerror',e=>record.pageErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')record.consoleErrors.push(m.text());});
  page.on('request',r=>record.requests.push({url:r.url(),type:r.resourceType()}));
  await page.addInitScript(()=>{window.__cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__cspViolations.push({directive:e.effectiveDirective,blockedURI:e.blockedURI,disposition:e.disposition}));});
  try {
    const response=await page.goto(url);await page.waitForTimeout(1000);
    record.responseCSP=response.headers()['content-security-policy']||null;
    const structure=await page.evaluate(()=>{
      const meta=document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      const inlineHandlers=[...document.querySelectorAll('*')].flatMap(e=>[...e.attributes].filter(a=>/^on/i.test(a.name)).map(a=>({tag:e.tagName,attribute:a.name})));
      return {meta:meta?.content||null,inlineScripts:document.querySelectorAll('script:not([src])').length,inlineStyles:document.querySelectorAll('style,[style]').length,inlineHandlers};
    });
    record.structure=structure;
    check('no inline scripts/styles/event handlers',structure.inlineScripts===0&&structure.inlineStyles===0&&structure.inlineHandlers.length===0,structure);
    check('CSP meta exists before stylesheet/script/image resources',await page.evaluate(()=>{
      const meta=document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return !!meta&&[...document.querySelectorAll('link[rel="stylesheet"],script,img')].every(e=>Boolean(meta.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING));
    }),Boolean(structure.meta));
    const metaPolicy=structure.meta;
    check('meta omits frame-ancestors and matches supported header directives',!!metaPolicy&&!!headerPolicy&&!metaPolicy.includes('frame-ancestors')&&metaPolicy===headerPolicy.replace("; frame-ancestors 'none'",''),metaPolicy);
    if(delivery==='header-and-meta') check('actual HTTP response enforces the configured CSP including frame-ancestors',record.responseCSP===headerPolicy&&!!record.responseCSP?.includes("frame-ancestors 'none'"),record.responseCSP);
    const policies=[metaPolicy,...(delivery==='header-and-meta'?[record.responseCSP]:[])];
    check('policies restrict scripts/styles to self without unsafe-inline/eval',policies.every(p=>!!p&&p.includes("script-src 'self'")&&p.includes("script-src-attr 'none'")&&p.includes("style-src 'self'")&&p.includes("style-src-attr 'none'")&&!/unsafe-inline|unsafe-eval|\*/.test(p)),policies);
    const image=await page.locator('.hero-portrait img').evaluate(e=>({loaded:e.complete&&e.naturalWidth>0,width:e.naturalWidth}));
    const styles=await page.evaluate(()=>({display:getComputedStyle(document.querySelector('.hero')).display,button:getComputedStyle(document.querySelector('.theme-toggle')).borderRadius}));
    check('local image and external stylesheet load',image.loaded&&styles.display==='grid',{image,styles});
    const firstEvents=await page.locator('#event-status').innerText();
    check('local ES modules initialize event hub',firstEvents.includes('3 upcoming events'),firstEvents);
    await page.locator('#theme-toggle').focus();await page.keyboard.press('Enter');
    const selected=await page.locator('#theme-toggle').getAttribute('aria-pressed');
    check('theme event listener works under enforced CSP',selected===String(theme!=='dark'),selected);
    for(const state of ['loading','ready','empty','error']) {await page.locator(`[data-state="${state}"]`).click();}
    await page.locator('.retry-button').focus();await page.keyboard.press('Enter');await page.waitForTimeout(1000);
    check('all demo state actions and Retry work', (await page.locator('#event-status').innerText()).includes('3 upcoming events'),await page.locator('#event-status').innerText());
    await page.locator('#contact-name').fill('Hoai An');await page.locator('#contact-email').fill('an@example.com');await page.locator('#contact-message').fill('CSP M3 local form test.');
    await page.locator('#contact-form button[type="submit"]').focus();await page.keyboard.press('Enter');
    check('form listener works under enforced CSP',(await page.locator('#form-feedback').innerText()).includes('Form validated'),await page.locator('#form-feedback').innerText());
    const firstViolations=await page.evaluate(()=>window.__cspViolations);
    await page.reload();await page.waitForTimeout(1000);
    check('reload initializes modules normally',(await page.locator('#event-status').innerText()).includes('3 upcoming events'),await page.locator('#event-status').innerText());
    record.violations=[...firstViolations,...await page.evaluate(()=>window.__cspViolations)];
    check('zero application CSP violations',record.violations.length===0,record.violations);
    check('all observed requests are same-origin',record.requests.every(r=>new URL(r.url).origin===new URL(url).origin),record.requests);
    check('zero application page/console errors',record.pageErrors.length===0&&record.consoleErrors.length===0,{page:record.pageErrors,console:record.consoleErrors});
  } catch(e) {check('scenario completed',false,e.message);}
  console.error(`${phase}: ${width}px ${theme} ${delivery}: ${record.checks.filter(c=>!c.passed).length} failed checks`);
  await context.close();
}

// Deliberate policy probes run on a separate page, not among normal application violations.
const probePage=await browser.newPage();
await probePage.addInitScript(()=>{window.__probeViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__probeViolations.push({directive:e.effectiveDirective,blockedURI:e.blockedURI,disposition:e.disposition}));});
await probePage.goto('http://127.0.0.1:5500/');await probePage.waitForTimeout(1000);
await probePage.evaluate(()=>{
  const script=document.createElement('script');script.textContent='window.__inlineProbeExecuted=true';document.body.append(script);
  const button=document.createElement('button');button.textContent='Security probe';button.setAttribute('onclick','window.__handlerProbeExecuted=true');document.body.append(button);button.click();
  const style=document.createElement('style');style.textContent='body { --probe-inline-style: blocked; }';document.head.append(style);
  const remote=document.createElement('script');remote.src='https://example.com/csp-probe.js';document.head.append(remote);
});
await probePage.waitForTimeout(300);
const probe=await probePage.evaluate(()=>({inlineExecuted:window.__inlineProbeExecuted===true,handlerExecuted:window.__handlerProbeExecuted===true,inlineStyleApplied:getComputedStyle(document.body).getPropertyValue('--probe-inline-style').trim()==='blocked',violations:window.__probeViolations}));
probe.passed=!probe.inlineExecuted&&!probe.handlerExecuted&&!probe.inlineStyleApplied&&['script-src-elem','script-src-attr','style-src-elem'].every(d=>probe.violations.some(v=>v.directive===d&&v.disposition==='enforce'))&&probe.violations.some(v=>v.blockedURI.startsWith('https://example.com'));
await probePage.close();
const framePage=await browser.newPage();
const frameErrors=[];framePage.on('console',m=>{if(m.type()==='error')frameErrors.push(m.text());});
await framePage.goto('http://127.0.0.1:5501/__frame-probe');await framePage.waitForTimeout(1000);
const frame={errors:frameErrors,protectedContentPresent:await framePage.frameLocator('iframe').locator('h1').count()};
frame.passed=frame.errors.some(e=>e.includes('frame-ancestors'))&&!frame.protectedContentPresent;
await framePage.close();
const failures=cases.flatMap(c=>c.checks.filter(t=>!t.passed).map(t=>({width:c.width,theme:c.theme,delivery:c.delivery,...t})));
const report={date:new Date().toISOString(),phase,baselineCommit:'42bd2f6',tester:'Assistant automated browser checks; no student checks recorded',browser:browser.version(),headerPolicy,cases,securityProbes:probe,frameProbe:frame,passed:failures.length===0&&probe.passed&&frame.passed,failures};
fs.mkdirSync(path.join(root,'verification/hw1-m3'),{recursive:true});fs.writeFileSync(path.join(root,`verification/hw1-m3/${phase}.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({phase,cases:cases.length,checks:cases.reduce((n,c)=>n+c.checks.length,0),passed:report.passed,failures,securityProbes:probe,frameProbe:frame},null,2));
if(phase==='after'&&!report.passed) process.exitCode=1;
await browser.close();servers.forEach(s=>s.close());
