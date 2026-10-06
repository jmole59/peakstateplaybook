import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../assets/lesson-signup.js',import.meta.url),'utf8');
function fixture(hostname,search='',signupEnabled='true'){
 const fields={disabled:true},button={disabled:true},status={textContent:''},scripts=[],calls=[],handlers={};
 const elements=Object.fromEntries(['email','firstName','marketingConsent','website'].map(name=>[name,{value:name==='email'?'other@example.com':'',checked:false,disabled:false}]));
 const form={dataset:{signupEnabled},elements,querySelector:s=>s==='fieldset'?fields:button,addEventListener:(name,handler)=>handlers[name]=handler,reportValidity:()=>true};
 const window={turnstile:{render(_selector,options){options.callback('test-token');return 1;},reset(){}}};
 runInNewContext(code,{document:{getElementById:id=>id==='lessonPreviewForm'?form:status,createElement:()=>({}),head:{append:script=>scripts.push(script)}},location:{hostname,search},window,URLSearchParams,crypto,AbortController,setTimeout,clearTimeout,fetch:async(_url,options)=>{calls.push(options);return Response.json({ok:true,saved:true},{status:202});}});
 return {fields,scripts,calls,handlers,elements,window,status};
}
test('both production hostnames enable the widget without test access',()=>{for(const host of ['peakstateplaybook.com','www.peakstateplaybook.com']){const f=fixture(host);assert.equal(f.scripts.length,1);assert.equal(f.elements.email.readOnly,undefined);assert.equal(f.elements.marketingConsent.checked,false);}});
test('public submission preserves entered email and optional consent without test header',async()=>{const f=fixture('peakstateplaybook.com','?lesson-test=1');f.window.pspLessonTurnstileReady();f.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.calls.length,1);assert.equal(f.calls[0].headers['X-PSP-Release-Test'],undefined);const body=JSON.parse(f.calls[0].body);assert.equal(body.email,'other@example.com');assert.equal(body.marketingConsent,false);assert.match(f.status.textContent,/request is saved/);});
test('old test query never activates preview or unrelated hosts',()=>{for(const host of ['example.com','deploy-preview-7--cool-cajeta-ad120e.netlify.app']){const f=fixture(host,'?lesson-test=1');assert.equal(f.scripts.length,0);assert.equal(f.fields.disabled,true);f.handlers.submit({preventDefault(){}});assert.equal(f.calls.length,0);}});
test('disabled production gate cannot be bypassed using old test query',()=>{const f=fixture('peakstateplaybook.com','?lesson-test=1','false');assert.equal(f.scripts.length,0);assert.equal(f.fields.disabled,true);});
