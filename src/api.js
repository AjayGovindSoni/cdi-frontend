export const BASE=(import.meta.env.VITE_API_BASE||"https://cdi-backend-ygef.onrender.com").replace(/\/$/,"");
export async function call(p,o){let r;try{r=await fetch(BASE+"/api/v1"+p,o)}catch{throw{detail:"Cannot reach the server. It may be waking up — try again in 30 seconds."}}
 let j=null;try{j=await r.json()}catch{}if(!r.ok&&r.status!==202)throw j||{detail:"Server error "+r.status};return{status:r.status,body:j}}
export const get=async p=>(await call(p)).body;
export const post=(p,b)=>call(p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});
export const health=()=>fetch(BASE+"/health").then(r=>r.json());
const ICON={water:"💧",roads:"🛣️",health:"🏥",healthcare:"🏥",education:"🎓",electricity:"⚡",sanitation:"🚰"};
export const icon=c=>ICON[c]||"📌";
export const label=c=>String(c).replace(/_/g," ").replace(/^./,x=>x.toUpperCase());
export const fmt=n=>n==null?"–":Number(n).toLocaleString("en-IN");
