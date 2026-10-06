import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../assets/lesson-signup.js',import.meta.url),'utf8');
function fixture(hostname,search=''){
 const fields={disabled:true},button={disabled:true},status={textContent:''},scripts=[],calls=[],handlers={};
 const elements=Object.fromEntries(['email','firstName','marketingConsent','website'].map(name=>[name,{value:name==='email'?'other@example.com':'',checked:name==='marketingConsent',disabled:false}]));
 const form={dataset:{signupEnabled:'false',signupTestEnabled:'true'},elements,querySelector:s=>s==='fieldset'?fields:button,addEventListener:(name,handler)=>handlers[name]=handler,reportValidity:()=>true};
 const window={turnstile:{render(_selector,options){options.callback('test-token');return 1;},reset(){}}};
 runInNewContext(code,{document:{getElementById:id=>id==='lessonPreviewForm'?form:status,createElement:()=>({}),head:{append:script=>scripts.push(script)}},location:{hostname,search},window,URLSearchParams,crypto,AbortController,setTimeout,clearTimeout,fetch:async(_url,options)=>{calls.push(options);return Response.json({ok:true,saved:true},{status:202});}});
 return {fields,scripts,calls,handlers,elements,window,status};
}
test('normal production page stays disabled with no widget or request',()=>{const f=fixture('www.peakstateplaybook.com');assert.equal(f.fields.disabled,true);assert.equal(f.scripts.length,0);f.handlers.submit({preventDefault(){}});assert.equal(f.calls.length,0);});
test('production test locks nominated recipient and sends explicit test header without consent',async()=>{const f=fixture('www.peakstateplaybook.com','?lesson-test=1');assert.equal(f.scripts.length,1);assert.equal(f.elements.email.value,'info@peakstateplaybook.com');assert.equal(f.elements.email.readOnly,true);assert.equal(f.elements.marketingConsent.checked,false);assert.equal(f.elements.marketingConsent.disabled,true);f.window.pspLessonTurnstileReady();f.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.calls.length,1);assert.equal(f.calls[0].headers['X-PSP-Release-Test'],'production');assert.equal(JSON.parse(f.calls[0].body).marketingConsent,false);assert.match(f.status.textContent,/request is saved/);});
test('production test query cannot activate unrelated hosts',()=>{for(const host of ['example.com','deploy-preview-6--cool-cajeta-ad120e.netlify.app']){const f=fixture(host,'?lesson-test=1');assert.equal(f.scripts.length,0);assert.equal(f.fields.disabled,true);}});
