import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CAMPS,GROUPS} from '../assets/camp-model.mjs';
import {spotsFor,spotLabel,showAvailability} from '../assets/camp-public.mjs';

const inventory=()=>Object.fromEntries(GROUPS.flatMap(g=>CAMPS.flatMap(c=>c.dates.map(d=>[`${g.id}:${d}`,8]))));

test('a single-day booking limits its full block and Summer Pass, only in its age group',()=>{
 const remaining=inventory();remaining['u12-u14:2027-01-12']=2;
 assert.equal(spotsFor('refresh','u12-u14',remaining),2);
 assert.equal(spotsFor('summer','u12-u14',remaining),2);
 assert.equal(spotsFor('christmas','u12-u14',remaining),8);
 assert.equal(spotsFor('refresh','u16-u18',remaining),8);
 remaining['u12-u14:2027-01-12']=0;
 assert.equal(spotsFor('refresh','u12-u14',remaining),0);
 assert.equal(spotsFor('summer','u12-u14',remaining),0);
});

test('missing or invalid inventory never becomes an advertised spot count',()=>{
 for(const value of [undefined,null,'3',-1,9,2.5]){
  const remaining=inventory();remaining['u12-u14:2026-12-19']=value;
  assert.equal(spotsFor('christmas','u12-u14',remaining),null);
 }
 assert.equal(spotsFor('unknown','u12-u14',inventory()),null);
 assert.equal(spotLabel(null),'Check availability when booking');
 assert.equal(spotLabel(1),'Only 1 spot left');
 assert.equal(spotLabel(3),'Only 3 spots left');
 assert.equal(spotLabel(8),'8 spots left');
});

test('refresh replaces counts from the Hub and clears stale counts after failure',()=>{
 const el={dataset:{campAvailability:'refresh',campGroup:'u12-u14'},textContent:''};
 const root={querySelectorAll:()=>[el]};const remaining=inventory();
 showAvailability(root,{ok:true,checkoutEnabled:true,remaining});
 assert.equal(el.textContent,'8 spots left');
 remaining['u12-u14:2027-01-12']=1;
 showAvailability(root,{ok:true,checkoutEnabled:true,remaining});
 assert.equal(el.textContent,'Only 1 spot left');assert.equal(el.dataset.availabilityState,'low');
 showAvailability(root,null);assert.equal(el.textContent,'Check availability when booking');
 showAvailability(root,{ok:true,checkoutEnabled:false,remaining});assert.equal(el.textContent,'Bookings opening soon');
 remaining['u12-u14:2027-01-12']=0;
 showAvailability(root,{ok:true,checkoutEnabled:true,remaining});assert.equal(el.textContent,'Full block sold out');
 el.dataset.campAvailability='summer';
 showAvailability(root,{ok:true,checkoutEnabled:true,remaining});assert.equal(el.textContent,'Summer Pass sold out');
});

test('each public camp and Summer Pass has one availability label per age group',async()=>{
 const html=await readFile(new URL('../camps/index.html',import.meta.url),'utf8');
 for(const camp of [...CAMPS.map(c=>c.id),'summer'])for(const group of GROUPS){
  assert.equal(html.split(`data-camp-availability="${camp}" data-camp-group="${group.id}"`).length-1,1);
 }
});
