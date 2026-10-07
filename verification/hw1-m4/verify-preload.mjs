import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const roots=[process.env.QA_NODE_MODULES,process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const playwright=roots.map(r=>path.join(r,'playwright')).find(p=>fs.existsSync(p))||'playwright';
const {chromium}=require(playwright);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const headers=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8')).headers[0].headers;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {
    if(fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    for(const h of headers) res.setHeader(h.key,h.value);
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  } catch {res.writeHead(404).end();}
});
await new Promise(r=>server.listen(5520,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const cases=[];
try {
  for(const width of [375,1440]) for(const theme of ['light','dark']) {
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
    const page=await context.newPage();const errors=[],moduleRequests=[],initiators=[];
    const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
    cdp.on('Network.requestWillBeSent',e=>{if(new URL(e.request.url).pathname==='/events.js')initiators.push(e.initiator);});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('request',r=>{if(new URL(r.url()).pathname==='/events.js')moduleRequests.push(r.url());});
    await page.addInitScript(()=>{window.__violations=[];document.addEventListener('securitypolicyviolation',e=>window.__violations.push(e.effectiveDirective));});
    await page.goto('http://127.0.0.1:5520/');await page.waitForTimeout(1000);
    const metrics=await page.evaluate(()=>({resources:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('/events.js')).map(r=>({name:r.name,initiatorType:r.initiatorType,startTime:r.startTime,responseEnd:r.responseEnd})),appResource:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('/app.js')).map(r=>({name:r.name,startTime:r.startTime,responseEnd:r.responseEnd})),events:document.querySelector('#event-status').textContent,violations:window.__violations,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,divs:document.querySelectorAll('div').length}));
    const record={width,theme,moduleRequests,initiators,errors,...metrics};
    record.earlyDiscovery=metrics.resources.length===1&&metrics.appResource.length===1&&metrics.resources[0].startTime<=metrics.appResource[0].responseEnd;
    record.passed=moduleRequests.length===1&&record.earlyDiscovery&&metrics.events.includes('3 upcoming events')&&errors.length===0&&metrics.violations.length===0&&!metrics.overflow&&metrics.h1===1&&metrics.divs===0;
    cases.push(record);await context.close();
  }
  const report={date:new Date().toISOString(),tester:'Assistant browser regression checks for the added modulepreload',browser:browser.version(),cases,passed:cases.every(c=>c.passed)};
  fs.writeFileSync(path.join(root,'verification/hw1-m4/preload-check.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(!report.passed) process.exitCode=1;
} finally {await browser.close();server.close();}
