import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyWebhook(raw,headers,secret,now=Date.now()){
 const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signatures=headers.get('svix-signature');
 if(!secret?.startsWith('whsec_')||!id||!timestamp||!/^\d+$/.test(timestamp)||!signatures||Math.abs(now/1000-Number(timestamp))>300)throw Error('INVALID_SIGNATURE');
 const key=Buffer.from(secret.slice(6),'base64');if(!key.length)throw Error('INVALID_SIGNATURE');
 const expected=createHmac('sha256',key).update(`${id}.${timestamp}.${raw}`).digest();
 const valid=signatures.split(' ').some(s=>{const [version,value]=s.split(',');if(version!=='v1'||!value)return false;const received=Buffer.from(value,'base64');return received.length===expected.length&&timingSafeEqual(received,expected);});
 if(!valid)throw Error('INVALID_SIGNATURE');return {id,event:JSON.parse(raw)};
}
