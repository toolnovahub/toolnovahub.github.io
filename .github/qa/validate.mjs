import assert from 'node:assert/strict';
import {readFileSync, existsSync, mkdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {createRequire} from 'node:module';
import {chromium} from 'playwright-core';
const require=createRequire(import.meta.url);
const {PDFDocument}=require('../../libs/pdf/pdf-lib.min.js');
const origin='http://127.0.0.1:8765';
const results=[],issues=[];
let browser;
function check(name,fn){return Promise.resolve().then(fn).then(()=>{results.push({name,status:'PASS'});console.log('QA PASS '+name)}).catch(e=>{results.push({name,status:'FAIL',error:String(e.message||e)});issues.push({name,error:String(e.message||e)});console.error('QA FAIL '+name+': '+(e.stack||e))})}
function fileHref(path){const p=path.split(/[?#]/)[0].replace(/^\/+/,'');return resolve(p.endsWith('/')||!p?p+'index.html':p)}
function metadata(path){const html=readFileSync(fileHref(path),'utf8');const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();const desc=html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];const can=html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];assert(title&&title.length>10,'missing title');assert(desc&&desc.length>35,'missing description');assert(can==='https://toolsnova.online'+path,'wrong canonical: '+can);if(path!=='/about/')assert(html.includes('application/ld+json'),'missing schema');return {title,desc,can}}
async function pdfBytes(pages){const d=await PDFDocument.create();for(let i=0;i<pages;i++){const pg=d.addPage([300,400]);pg.drawText('ToolsNova QA page '+(i+1),{x:30,y:320})}return Buffer.from(await d.save())}
async function awaitDownload(p,click){const [d]=await Promise.all([p.waitForEvent('download',{timeout:25000}),click()]);return d}
async function fresh(p,path){await p.goto(origin+path,{waitUntil:'domcontentloaded'});await p.waitForTimeout(250);if(await p.locator('#tnh-reject').count())await p.locator('#tnh-reject').click().catch(()=>{})}
try{
 const chrome=process.env.CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
 assert(chrome,'No installed Chrome/Chromium');
 browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await check('homepage: 30 native card links and targets',async()=>{
  await fresh(page,'/');
  const cards=page.locator('.tool-card');assert.equal(await cards.count(),30);
  assert.equal(await page.locator('button.tool-card').count(),0);
  const hrefs=await cards.evaluateAll(elements=>elements.map(e=>e.getAttribute('href')));
  assert.equal(new Set(hrefs).size,30);
  for(const href of hrefs){assert(href?.startsWith('/tools/'));assert(existsSync(fileHref(href)),'dead tool link '+href)}
 });
 await check('homepage: search and empty state',async()=>{
  const input=page.locator('#tool-search');
  await input.fill('json');
  assert(await page.locator('.tool-card[href="/tools/json-formatter/"]').isVisible());
  assert(!(await page.locator('.tool-card[href="/tools/merge-pdf/"]').isVisible()));
  await input.fill('nomatchqaxyz123');
  assert(await page.locator('#empty-results').isVisible());
  await input.fill('');
 });
 await check('homepage: filters and all tools',async()=>{
  await page.locator('.filter-tab[data-filter="pdf"]').click();
  const shown=await page.locator('.tool-card:visible').count();assert(shown>=4,'pdf tools invisible');
  const categories=await page.locator('.tool-card:visible').evaluateAll(els=>els.map(e=>e.dataset.category));assert(categories.every(c=>c==='pdf'));
  await page.locator('.filter-tab[data-filter="all"]').click();
  await page.locator('#show-all-tools').click();assert.equal(await page.locator('.tool-card:visible').count(),30);
 });
 await check('homepage: keyboard Enter follows real link',async()=>{
  const card=page.locator('.tool-card[href="/tools/password-generator/"]');
  await card.focus();assert(await card.evaluate(e=>document.activeElement===e));
  await page.locator('#tool-search').focus();await page.keyboard.press('Tab');
  assert(await page.locator('.filter-tab').first().evaluate(el=>document.activeElement===el),'Tab did not focus first category button');
  await card.focus();
  await page.keyboard.press('Enter');await page.waitForURL('**/tools/password-generator/');
  assert(await page.locator('h1').first().isVisible());
 });
 await check('Password Generator: random length, settings and copy',async()=>{
  await fresh(page,'/tools/password-generator/');
  const out=page.locator('#result');assert.equal((await out.textContent()).length,20);
  await page.locator('#length').evaluate(el=>{el.value='16';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#generate').click();assert.equal((await out.textContent()).length,16);
  await page.locator('#copy').click();
  assert((await page.locator('#status').innerText()).includes('Copied'));
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await out.textContent());
 });
 await check('JSON Formatter: valid formatting, minify, invalid error',async()=>{
  await fresh(page,'/tools/json-formatter/');
  const x=page.locator('#json');await x.fill('{"name":"Ada","ok":true}');
  await page.locator('#format').click();assert((await x.inputValue()).includes('\n'));
  await page.locator('#minify').click();assert.equal(await x.inputValue(),'{"name":"Ada","ok":true}');
  await x.fill('{bad json');await page.locator('#format').click();
  assert((await page.locator('#status').innerText()).includes('Invalid JSON'));
 });
 await check('Merge PDF: validates short selection and downloads combined PDF',async()=>{
  await fresh(page,'/tools/merge-pdf/');
  await page.locator('#pdf-merge').click();assert((await page.locator('#status').innerText()).includes('at least two'));
  await page.locator('#pdf-files').setInputFiles([
   {name:'first.pdf',mimeType:'application/pdf',buffer:await pdfBytes(1)},
   {name:'second.pdf',mimeType:'application/pdf',buffer:await pdfBytes(2)}]);
  const download=await awaitDownload(page,()=>page.locator('#pdf-merge').click());
  assert.equal(download.suggestedFilename(),'merged.pdf');
  assert.equal((await PDFDocument.load(readFileSync(await download.path()))).getPageCount(),3);
  assert((await page.locator('#status').innerText()).includes('3 pages merged'));
 });
 await check('Split PDF: invalid range, then 2-page download',async()=>{
  await fresh(page,'/tools/split-pdf/');
  await page.locator('#pdf-file').setInputFiles({name:'source.pdf',mimeType:'application/pdf',buffer:await pdfBytes(3)});
  await page.locator('#page-info').getByText(/PDF loaded/).waitFor({timeout:15000}).catch(async()=>{assert((await page.locator('#page-info').innerText()).includes('PDF loaded'))});
  await page.locator('#page-ranges').fill('5');
  await page.locator('#split-btn').click();
  await page.waitForFunction(()=>document.getElementById('status')?.textContent?.includes('Could not split'),null,{timeout:10000});
  assert((await page.locator('#status').innerText()).includes('Could not split'));
  await page.locator('#page-ranges').fill('1,3');
  const dl=await awaitDownload(page,()=>page.locator('#split-btn').click());
  assert(dl.suggestedFilename().includes('selected-pages.pdf'));
  assert.equal((await PDFDocument.load(readFileSync(await dl.path()))).getPageCount(),2);
  assert((await page.locator('#status').innerText()).includes('Extracted 2'));
 });
 await check('Compress PDF: validates missing input and handles valid PDF',async()=>{
  await fresh(page,'/tools/compress-pdf/');
  await page.locator('#pdf-compress').click();assert((await page.locator('#status').innerText()).includes('Choose a PDF'));
  await page.locator('#pdf-file').setInputFiles({name:'small.pdf',mimeType:'application/pdf',buffer:await pdfBytes(1)});
  await page.locator('#pdf-compress').click();await page.waitForFunction(()=>{
   const t=document.getElementById('status')?.textContent||'';
   return t.includes('did not reduce')||t.includes('Done! Reduced')||t.includes('Could not compress PDF');
  },null,{timeout:35000});
  const result=await page.locator('#status').innerText();assert(!result.includes('Could not compress PDF'),result);
 });
 await check('QR Generator: image preview and PNG download',async()=>{
  await fresh(page,'/tools/qr-code-generator/');
  await page.locator('#qr-input').fill('https://toolsnova.online/');
  await page.locator('#qr-generate').click();assert(await page.locator('#qr-preview img').isVisible());
  const dl=await awaitDownload(page,()=>page.locator('#qr-download').click());
  assert.equal(dl.suggestedFilename(),'toolsnova-qr.png');
 });
 await check('Word Counter: characters, words, lines and clear',async()=>{
  await fresh(page,'/tools/word-counter/');
  await page.locator('#text').fill('Hello world\nAnother line');
  assert.equal(await page.locator('#wc').innerText(),'4');
  assert.equal(await page.locator('#lc').innerText(),'2');
  await page.locator('#clear').click();assert.equal(await page.locator('#wc').innerText(),'0');
 });
 await check('mobile: new sections, FAQ, related tools, About, no overflow',async()=>{
  mkdirSync('qa-screens',{recursive:true});
  await page.setViewportSize({width:390,height:844});
  for(const path of ['/tools/password-generator/','/tools/json-formatter/','/tools/merge-pdf/','/about/']){
   await fresh(page,path);
   assert(await page.locator('h1').first().isVisible(),'missing heading '+path);
   const width=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert(width<3,'horizontal overflow '+path+': '+width);
   if(path.startsWith('/tools/')){
    assert(await page.getByText('How it works',{exact:true}).first().count(),'missing static help '+path);
    assert.equal(await page.locator('.related-grid a.related-card').count(),3);
    const faq=page.locator('.tn-tool-faq details').first();await faq.locator('summary').click();assert(await faq.evaluate(e=>e.open));
   }
   const shotName=path==='/'?'home':path.replace(/^\/+|\/+$/g,'').replaceAll('/','-');
   await page.screenshot({path:'qa-screens/mobile-'+shotName+'.png',fullPage:true});
  }
 });
 await check('desktop screenshot capture',async()=>{
  await page.setViewportSize({width:1365,height:850});
  await fresh(page,'/');
  await page.screenshot({path:'qa-screens/desktop-homepage.png',fullPage:true});
 });
 await check('SEO: all 30 tool pages + homepage + About canonical, description, schema',async()=>{
  const paths=[...readFileSync('sitemap.xml','utf8').matchAll(/<loc>https:\/\/toolsnova\.online(\/tools\/[^<]+\/)<\/loc>/g)].map(x=>x[1]);
  for(const path of ['/', '/about/', ...paths])metadata(path);
 });
 await check('SEO: sitemap and robots, link integrity',async()=>{
  const xml=readFileSync('sitemap.xml','utf8');
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.equal(urls.length,45);assert.equal(new Set(urls).size,45);
  assert(urls.includes('https://toolsnova.online/about/'));
  for(const u of urls){const p=u.replace('https://toolsnova.online','');assert(existsSync(fileHref(p)),'sitemap URL missing '+u)}
  assert(readFileSync('robots.txt','utf8').includes('Sitemap: https://toolsnova.online/sitemap.xml'));
  const htmlPaths=['index.html','about/index.html',...urls.map(u=>u.replace('https://toolsnova.online/','')).filter(Boolean).map(x=>x+'index.html')];
  for(const path of new Set(htmlPaths)){if(!existsSync(path))continue;const html=readFileSync(path,'utf8');for(const m of html.matchAll(/<a\b[^>]+href="(\/[^"]+)"/g)){const dest=m[1].split(/[?#]/)[0];if(dest)assert(existsSync(fileHref(dest)),'broken link in '+path+': '+dest)}}
 });
 await check('JS: no regressions from script parsing',async()=>{
  const {spawnSync}=await import('node:child_process');
  for(const file of ['script.js','site-nav.js','tool-help.js','tool-finder.js','tools/compress-pdf/tool.js','tools/merge-pdf/tool.js','tools/split-pdf/tool.js']){
   const result=spawnSync('node',['--check',file],{encoding:'utf8'});
   assert.equal(result.status,0,file+' '+result.stderr);
  }
  assert(!readFileSync('site-nav.js','utf8').includes('script.src="/tool-help.js'));
  assert(readFileSync('index.html','utf8').includes('href="/about/"'));
 });
 await check('Browser: no uncaught JavaScript errors',async()=>{assert.equal(errors.length,0,errors.join('; '))});
 await context.close();
} catch(err){issues.push({name:'QA harness',error:String(err.stack||err)});console.error('QA HARNESS FAIL '+(err.stack||err))}
finally{if(browser)await browser.close()}
console.log('QA SUMMARY '+JSON.stringify({total:results.length,pass:results.filter(x=>x.status==='PASS').length,fail:issues.length,issues}));
if(issues.length)process.exitCode=1;
