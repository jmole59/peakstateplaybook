import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const script = await readFile(new URL('../assets/assessment-enquiry.js', import.meta.url), 'utf8');

function setup({ok=true,valid=true,networkError=false}={}) {
  let handler,resetCount=0;
  const requests=[];
  const fields=new Map(Object.entries({
    'parent-name':'Parent Example',email:'parent@example.test',mobile:'0400000000',
    'athlete-name':'Sample Athlete','age-group':'U14',team:'Sample team',
    competition:'Domestic','game-date':'2026-12-05','tip-off':'09:00',
    venue:'Sample stadium',suburb:'Boronia','assessment-service':'bundle',
    'guardian-consent':'yes',website:''
  }));
  const form={reportValidity:()=>valid,reset:()=>resetCount++,addEventListener:(_,fn)=>handler=fn};
  const service={selectedOptions:[{textContent:'Assessment + Three Film Room Reviews — $499 AUD'}]};
  const status={textContent:''},button={disabled:false};
  const elements={assessmentEnquiry:form,assessmentService:service,assessmentStatus:status,assessmentSubmit:button};
  vm.runInNewContext(script,{
    document:{getElementById:id=>elements[id],querySelectorAll:()=>[]},
    FormData:class {get(key){return fields.get(key)}},
    URLSearchParams,
    fetch:async(url,options)=>{requests.push({url,options});if(networkError)throw Error('offline');return {ok}}
  });
  return {submit:()=>handler({preventDefault(){}}),requests,status,button,get resetCount(){return resetCount}};
}
test('routes consented assessment details through the existing contact form only',async()=>{
  const app=setup();await app.submit();
  assert.equal(app.requests.length,1);
  const request=app.requests[0],body=new URLSearchParams(request.options.body);
  assert.equal(request.url,'/');
  assert.equal(request.options.method,'POST');
  assert.equal(body.get('form-name'),'contact');
  assert.equal(body.get('email'),'parent@example.test');
  assert.match(body.get('message'),/Service: Assessment \+ Three Film Room Reviews/);
  assert.match(body.get('message'),/Parent\/guardian consent: Yes/);
  assert.match(body.get('message'),/Enquiry only/);
  assert.equal(app.resetCount,1);
  assert.equal(app.button.disabled,false);
  assert.match(app.status.textContent,/confirm availability/);
});
test('invalid forms never submit',async()=>{
  const app=setup({valid:false});await app.submit();
  assert.equal(app.requests.length,0);assert.equal(app.resetCount,0);
});
for(const options of [{ok:false},{networkError:true}]) {
  test('failed delivery preserves details and does not claim success '+JSON.stringify(options),async()=>{
    const app=setup(options);await app.submit();
    assert.equal(app.resetCount,0);assert.equal(app.button.disabled,false);
    assert.match(app.status.textContent,/could not be sent/);
  });
}
