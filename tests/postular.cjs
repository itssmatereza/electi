// Run with Node.js and Playwright installed: node tests/postular.cjs
// Every Firestore request is intercepted. No real lead is written.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
const KEY='electi_postulacion_v1';
const COURSE='Bachiller graduado (aún no inicio la universidad)';
let browser, server, base, passed=0;
function jsonResponse(request,status=200,error){
  const id=new URL(request.url()).searchParams.get('documentId');
  return {status,contentType:'application/json',body:JSON.stringify(error ? {error:{status:error}} : {name:'projects/portal-electi/databases/(default)/documents/postulaciones/'+id})};
}
async function setup(handle,options={}){
  const context=await browser.newContext({viewport:{width:options.width||390,height:900}});
  const page=await context.newPage();
  const requests=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Accelerate only application retry/deadline timers; leave Playwright waits alone.
  await page.addInitScript(()=>{
    const timeout=window.setTimeout;
    window.setTimeout=(fn,ms,...args)=>timeout(fn,ms===1500||ms===4000?20:ms===10000?300:ms,...args);
  });
  if(options.storageBlocked) await page.addInitScript(()=>{
    Storage.prototype.setItem=()=>{throw new Error('Storage blocked');};
  });
  await page.route('https://**/*',async route=>{
    if(!route.request().url().includes('firestore.googleapis.com')) return route.abort();
    requests.push({url:route.request().url(),body:route.request().postDataJSON()});
    return handle(route,requests.length);
  });
  await page.goto(base+'/postular/');
  return {page,requests,errors};
}
async function fill(page){
  await page.locator('[name=nombre]').fill('Prueba de recuperación');
  await page.locator('[name=whatsapp]').fill('0991234567');
  await page.locator('[name=quien][value=Estudiante]').check();
  await page.locator('[name=curso]').selectOption({label:COURSE});
  await page.locator('[name=modalidad][value="En línea"]').check();
  await page.locator('[name=recomendado]').fill('Persona de prueba');
}
async function settled(page){
  await page.waitForFunction(()=>!document.getElementById('pf-btn').disabled);
}
async function test(name,run){
  await run(); passed++; console.log('OK '+name);
}
(async()=>{
  server=http.createServer((req,res)=>{
    let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));
    if(file.endsWith('/'))file+='index.html';
    const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.jpg':'image/jpeg','.webp':'image/webp'};
    try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
    catch{res.statusCode=404;res.end();}
  }).listen(0,'127.0.0.1');
  await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  try{
    await test('required fields prevent an incomplete submission',async()=>{
      const {page,requests}=await setup(r=>r.fulfill(jsonResponse(r.request())));
      await page.locator('#pf-btn').click();assert.equal(requests.length,0);
      assert.match(await page.locator('#pf-err').textContent(),/nombre completo/);
      assert.equal(await page.locator('[name=empresa]').count(),0);await page.close();
    });
    await test('the hidden trap field blocks bots without saving or thanking',async()=>{
      const {page,requests}=await setup(r=>r.fulfill(jsonResponse(r.request())));
      await fill(page);await page.evaluate(()=>{document.querySelector('[name=hp_web]').value='spam';});
      await page.locator('#pf-btn').click();await page.waitForTimeout(300);
      assert.equal(requests.length,0);assert.match(page.url(),/postular/);
      assert.match(await page.locator('#pf-err a').getAttribute('href'),/^https:\/\/wa\.me\//);await page.close();
    });
    await test('success persists the full payload, removes the draft, and redirects',async()=>{
      const {page,requests,errors}=await setup(r=>r.fulfill(jsonResponse(r.request())));
      await fill(page);await page.locator('#pf-btn').click();await page.waitForURL('**/gracias/');
      assert.equal(requests.length,1);assert.match(new URL(requests[0].url).searchParams.get('documentId'),/^web_[a-f0-9]{32}$/);
      assert.equal(requests[0].body.fields.curso.stringValue,COURSE);
      assert.equal(requests[0].body.fields.whatsapp.stringValue,'+593991234567');
      assert.match(requests[0].body.fields.origen.stringValue,/Recomendado por: Persona de prueba/);
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),null);assert.deepEqual(errors,[]);await page.close();
    });
    await test('a successful HTTP response without a document receipt never shows thanks',async()=>{
      const {page,requests}=await setup(r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      assert.equal(requests.length,3);assert.match(page.url(),/postular/);await page.close();
    });
    await test('a saved draft survives a closed tab without sending automatically',async()=>{
      const {page}=await setup(r=>r.fulfill(jsonResponse(r.request(),403,'PERMISSION_DENIED')));
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      const context=page.context(), next=await context.newPage();let requests=0;
      await next.route('https://**/*',r=>{if(r.request().url().includes('firestore.googleapis.com'))requests++;return r.abort();});
      await page.close();await next.goto(base+'/postular/');
      assert.equal(await next.locator('[name=nombre]').inputValue(),'Prueba de recuperación');
      assert.equal(await next.locator('[name=recomendado]').inputValue(),'Persona de prueba');
      assert.equal(await next.locator('#pf-btn').textContent(),'Reintentar envío');assert.equal(requests,0);await next.close();
    });
    await test('transient errors retry the identical ID and payload, with no duplicate clicks',async()=>{
      const {page,requests}=await setup((r,n)=>r.fulfill(n===1?jsonResponse(r.request(),503,'UNAVAILABLE'):jsonResponse(r.request())));
      await fill(page);
      await page.locator('form').evaluate(f=>{f.requestSubmit();f.requestSubmit();});
      await page.waitForURL('**/gracias/');assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);await page.close();
    });
    await test('lost acknowledgement followed by ALREADY_EXISTS confirms the same lead',async()=>{
      const {page,requests}=await setup((r,n)=>n===1?r.abort():r.fulfill(jsonResponse(r.request(),409,'ALREADY_EXISTS')));
      await fill(page);await page.locator('#pf-btn').click();await page.waitForURL('**/gracias/');
      assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);await page.close();
    });
    await test('a stalled request times out and retries without creating a new ID',async()=>{
      const {page,requests}=await setup(async(r,n)=>{
        if(n===1){await new Promise(r=>setTimeout(r,600));try{await r.abort();}catch{}return;}
        return r.fulfill(jsonResponse(r.request()));
      });
      await fill(page);await page.locator('#pf-btn').click();await page.waitForURL('**/gracias/');
      assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);await page.close();
    });
    await test('permission errors never show success; reload and manual retry keep the same request',async()=>{
      let allow=false;
      const {page,requests,errors}=await setup(r=>r.fulfill(allow?jsonResponse(r.request()):jsonResponse(r.request(),403,'PERMISSION_DENIED')));
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      assert.equal(requests.length,1);assert.match(page.url(),/postular/);
      const link=await page.locator('#pf-err a').getAttribute('href');
      assert.match(decodeURIComponent(link),/WhatsApp: \+593991234567/);assert.match(decodeURIComponent(link),/Recomendado por: Persona de prueba/);
      await page.reload();assert.equal(requests.length,1);
      assert.equal(await page.locator('[name=nombre]').inputValue(),'Prueba de recuperación');
      assert.equal(await page.locator('#pf-btn').textContent(),'Reintentar envío');
      allow=true;await page.locator('#pf-btn').click();await page.waitForURL('**/gracias/');
      assert.deepEqual(requests[0],requests[1]);assert.deepEqual(errors,[]);await page.close();
    });
    await test('offline form resumes automatically when connection returns',async()=>{
      const {page,requests}=await setup(r=>r.fulfill(jsonResponse(r.request())));
      await page.evaluate(()=>Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false}));
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      assert.equal(requests.length,0);assert.match(await page.locator('#pf-err').textContent(),/no tienes conexión/);
      await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{get:()=>true});window.dispatchEvent(new Event('online'));});
      await page.waitForURL('**/gracias/');assert.equal(requests.length,1);await page.close();
    });
    await test('retries stop after three attempts, and WhatsApp remains available',async()=>{
      const {page,requests}=await setup(r=>r.fulfill(jsonResponse(r.request(),503,'UNAVAILABLE')));
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      assert.equal(requests.length,3);assert.deepEqual(requests[0],requests[2]);
      assert.equal(await page.locator('#pf-err a').count(),1);
      assert.equal(await page.locator('[name=nombre]').isEnabled(),true);
      assert.match(await page.locator('#pf-status').textContent(),/Conservamos tus datos/);await page.close();
    });
    await test('blocked storage does not prevent retries or WhatsApp fallback',async()=>{
      const {page,requests,errors}=await setup(r=>r.fulfill(jsonResponse(r.request(),503,'UNAVAILABLE')),{storageBlocked:true});
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      assert.equal(requests.length,3);assert.match(await page.locator('#pf-status').textContent(),/no pudimos guardar un borrador/);
      assert.deepEqual(errors,[]);await page.close();
    });
    await test('editing a failed request updates the WhatsApp fallback and submission payload',async()=>{
      let allow=false;
      const {page,requests}=await setup(r=>r.fulfill(allow?jsonResponse(r.request()):jsonResponse(r.request(),403,'PERMISSION_DENIED')));
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      await page.locator('[name=recomendado]').fill('Otra persona');allow=true;
      await page.locator('#pf-btn').click();await page.waitForURL('**/gracias/');
      assert.match(requests[1].body.fields.origen.stringValue,/Otra persona/);await page.close();
    });
    await test('expired and malformed drafts are ignored',async()=>{
      const {page,errors}=await setup(r=>r.fulfill(jsonResponse(r.request())));
      for(const value of ['{broken',JSON.stringify({version:1,expires:Date.now()-1,data:{nombre:'Dato vencido'}}),JSON.stringify({version:1,expires:Date.now()+10000,data:{nombre:'Dato válido'},pending:{id:'web_'+('a'.repeat(32)),data:{},body:{fields:{}}}})]){
        await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key:KEY,value});await page.reload();
        assert.match(page.url(),/postular/);assert.equal(await page.locator('#pf-btn').isEnabled(),true);
      }
      assert.deepEqual(errors,[]);await page.close();
    });
    for(const width of [1440,390,320]) await test('form and failure layout fit '+width+'px',async()=>{
      const {page}=await setup(r=>r.fulfill(jsonResponse(r.request(),403,'PERMISSION_DENIED')),{width});
      await fill(page);await page.locator('#pf-btn').click();await settled(page);
      if(process.env.SCREENSHOTS_DIR) await page.locator('.pos').screenshot({path:path.join(process.env.SCREENSHOTS_DIR,'postular-fallo-'+width+'.png')});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.close();
    });
    console.log(passed+' checks passed; no production requests were sent.');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);if(server)server.close();process.exitCode=1;});
