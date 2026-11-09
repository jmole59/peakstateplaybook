export const GROUPS=[{id:'u12-u14',label:'U12 & U14',time:'9:00–11:00 AM'},{id:'u16-u18',label:'U16 & U18',time:'11:30 AM–1:30 PM'}];
export const CAMPS=[{id:'christmas',number:'01',name:'Pre-Christmas Tune-Up',dates:['2026-12-21','2026-12-22'],price:15000},{id:'refresh',number:'02',name:'New Year Refresh',dates:['2027-01-11','2027-01-12','2027-01-13'],price:25000},{id:'tournament',number:'03',name:'Ultimate Tournament Prep',dates:['2027-01-18','2027-01-19','2027-01-20'],price:25000}];
export const money=cents=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(cents/100);
export const dateLabel=date=>new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short',timeZone:'Australia/Melbourne'}).format(new Date(date+'T12:00:00+11:00'));
export function quote(input){
 if(!input||!GROUPS.some(g=>g.id===input.group)||!Array.isArray(input.selections)||input.selections.length<1||input.selections.length>3)throw Error('INVALID_SELECTION');
 const seen=new Set(),items=[],dates=[];
 for(const s of input.selections){const c=CAMPS.find(c=>c.id===s.camp);if(!c||seen.has(s.camp)||!['full','days'].includes(s.mode))throw Error('INVALID_SELECTION');seen.add(s.camp);
 let chosen;if(s.mode==='full')chosen=c.dates;else{if(!Array.isArray(s.days)||!s.days.length||new Set(s.days).size!==s.days.length||s.days.some(d=>!c.dates.includes(d)))throw Error('INVALID_DAYS');chosen=[...s.days].sort();}
 const mode=chosen.length===c.dates.length?'full':s.mode;
 items.push({camp:c.id,name:c.name,mode,dates:chosen,amount:mode==='full'?c.price:chosen.length*10000});dates.push(...chosen);
 }
 items.sort((a,b)=>CAMPS.findIndex(c=>c.id===a.camp)-CAMPS.findIndex(c=>c.id===b.camp));
 const summerPass=items.length===3&&items.every(i=>i.mode==='full'),subtotal=items.reduce((n,i)=>n+i.amount,0);
 return {group:input.group,items,dates:dates.sort(),subtotal,total:summerPass?60000:subtotal,summerPass,saving:summerPass?5000:0};
}
export function availabilityFor(camp,group,remaining){const days=Object.fromEntries(camp.dates.map(d=>[d,remaining[`${group}:${d}`]??null]));return {days,full:Object.values(days).every(n=>Number.isInteger(n)&&n>0),known:Object.values(days).every(n=>Number.isInteger(n))};}
