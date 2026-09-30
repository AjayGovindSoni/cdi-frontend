import{useState,useEffect,useCallback}from"react";
import{Doughnut}from"react-chartjs-2";
import{call,icon,label,fmt}from"./api.js";
const ST=["open","in_progress","resolved","rejected"],COL={open:"#c2410c",in_progress:"#b8860b",resolved:"#2f7d4f",rejected:"#6b6f7d"};
const PER=20,ago=t=>t?new Date(t).toLocaleString([],{dateStyle:"medium",timeStyle:"short"}):"–";
const H=k=>({"X-Admin-Key":k});

export default function Admin({cats}){
 const[key,setKey]=useState(()=>sessionStorage.getItem("cdi_admin_key")||""),[name,setName]=useState(()=>sessionStorage.getItem("cdi_admin_name")||"");
 const[ok,setOk]=useState(false),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 const login=async e=>{e?.preventDefault();setErr("");if(!key||!name.trim())return setErr("Enter the admin key and your name.");setBusy(true);
  try{await call("/admin/complaints?limit=1",{headers:H(key)});sessionStorage.setItem("cdi_admin_key",key);sessionStorage.setItem("cdi_admin_name",name.trim());setOk(true)}
  catch(x){setErr(x.code==="admin_disabled"?"Admin is disabled on the server (ADMIN_KEY not set).":x.code==="unauthorized"?"Wrong admin key.":x.detail||"Login failed.")}setBusy(false)};
 useEffect(()=>{if(key&&name)login()},[]);
 const out=()=>{sessionStorage.clear();setOk(false);setKey("")};
 if(!ok)return<><div className="hero fx"><h1>Officials <em>admin panel</em></h1><p>Review citizen requests and update their status. Access requires the admin key.</p></div>
  <form className="card fx" onSubmit={login} style={{maxWidth:440,marginBottom:40}}><label style={{marginTop:0}}>Your name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Officer name (recorded in history)"/>
  <label>Admin key</label><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="X-Admin-Key"/>{err&&<div className="err">{err}</div>}<button className="btn" disabled={busy}>{busy?"Checking…":"Sign in"}</button></form></>;
 return<Panel k={key} name={name} out={out} cats={cats}/>}

function Panel({k,name,out,cats}){
 const[st,setSt]=useState(""),[cat,setCat]=useState(""),[q,setQ]=useState(""),[qq,setQq]=useState(""),[pg,setPg]=useState(0),[d,setD]=useState(null),[err,setErr]=useState(""),[open,setOpen]=useState(null),[msg,setMsg]=useState("");
 useEffect(()=>{const t=setTimeout(()=>{setQq(q);setPg(0)},350);return()=>clearTimeout(t)},[q]);
 const load=useCallback(async()=>{const p=new URLSearchParams({limit:PER,offset:pg*PER});st&&p.set("status",st);cat&&p.set("category",cat);qq&&p.set("q",qq);
  try{const{body}=await call("/admin/complaints?"+p,{headers:H(k)});setD(body);setErr("")}catch(x){setErr(x.code==="unauthorized"?"Session expired — sign in again.":x.detail||"Failed to load")}},[k,st,cat,qq,pg]);
 useEffect(()=>{load();const t=setInterval(load,20000);return()=>clearInterval(t)},[load]);
 const bs=d?.by_status||{},total=ST.reduce((a,s)=>a+(bs[s]||0),0);
 const recompute=async()=>{setMsg("Recomputing…");try{await call("/admin/recompute",{method:"POST",headers:H(k)});setMsg("Hotspots recomputed ✓")}catch(x){setMsg(x.detail||"Failed")}setTimeout(()=>setMsg(""),3500)};
 return<><div className="hero fx" style={{paddingBottom:6}}><h1>Complaint <em>management</em></h1><p>Signed in as {name}. Status changes are logged with your name and re-rank the leaderboard automatically.</p></div>
 <div className="filters fx"><button className="btn ghost" onClick={load}>↻ Refresh</button><button className="btn ghost" onClick={recompute}>Recompute hotspots</button><button className="btn ghost" onClick={out}>Sign out</button><span className="hint" style={{margin:0}}>{msg}</span></div>
 {err&&<div className="err">{err}</div>}
 <div className="charts b" style={{gridTemplateColumns:"1fr 1.6fr"}}>
  <div className="card fx"><h3>Status overview</h3><div className="ch" style={{height:200}}><Doughnut data={{labels:ST.map(label),datasets:[{data:ST.map(s=>bs[s]||0),backgroundColor:ST.map(s=>COL[s]),borderWidth:0}]}} options={{responsive:true,maintainAspectRatio:false,cutout:"65%",animation:{duration:1000},plugins:{legend:{position:"right"}}}}/></div></div>
  <div className="stats" style={{gridTemplateColumns:"1fr 1fr",margin:0}}>{[["Total",total,null],...ST.slice(0,3).map(s=>[label(s),bs[s]||0,s])].map(([t,v,s],i)=><div className="stat fx" key={t} style={{animationDelay:i*70+"ms",borderLeft:`4px solid ${s?COL[s]:"var(--acc2)"}`}}><b>{fmt(v)}</b><span>{t}</span></div>)}</div></div>
 <div className="card fx" style={{marginBottom:40}}>
  <div className="tabs">{[["","All"],...ST.map(s=>[s,label(s)])].map(([s,t])=><button key={s} className={st===s?"on":""} onClick={()=>{setSt(s);setPg(0)}}>{t} <span className="pill">{s?bs[s]||0:total}</span></button>)}</div>
  <div className="filters" style={{marginTop:14}}><input style={{maxWidth:260}} placeholder="Search ID or description…" value={q} onChange={e=>setQ(e.target.value)}/>
   <select value={cat} onChange={e=>{setCat(e.target.value);setPg(0)}}><option value="">All issues</option>{cats.map(c=><option key={c} value={c}>{icon(c)} {label(c)}</option>)}</select></div>
  <div className="tw"><table><thead><tr><th>ID</th><th>Issue</th><th>Description</th><th>Location</th><th>Sev.</th><th>Status</th><th>Filed</th></tr></thead><tbody>
  {!d?<tr><td colSpan={7} className="empty">Loading…</td></tr>:!d.complaints.length?<tr><td colSpan={7} className="empty">No complaints match.</td></tr>:
  d.complaints.flatMap(c=>[<tr key={c.id} className={"r"+(open===c.id?" sel":"")} onClick={()=>setOpen(open===c.id?null:c.id)}><td><b>{c.id}</b></td><td><span className="tag">{icon(c.category)} {label(c.category)}</span></td>
   <td style={{maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.description||"—"}</td><td>{c.location_name}<div className="hint" style={{margin:0}}>{c.district}</div></td>
   <td><b>{c.severity}</b> <span className={"tag "+c.urgency}>{c.urgency}</span></td><td><span className="tag" style={{background:COL[c.status]+"22",color:COL[c.status]}}>{label(c.status)}</span></td><td>{ago(c.created_at)}</td></tr>,
   open===c.id&&<tr key={c.id+"d"} className="det"><td colSpan={7}><Editor c={c} name={name} onDone={()=>{setOpen(null);load()}}/></td></tr>])}
  </tbody></table></div>
  <div className="filters" style={{marginTop:14,justifyContent:"space-between"}}><span className="hint" style={{margin:0}}>{d?`Showing ${d.complaints.length?pg*PER+1:0}–${pg*PER+d.complaints.length} of ${fmt(d.total)}`:""}</span>
   <span><button className="btn ghost" disabled={!pg} onClick={()=>setPg(pg-1)}>← Prev</button> <button className="btn ghost" disabled={!d||(pg+1)*PER>=d.total} onClick={()=>setPg(pg+1)}>Next →</button></span></div></div></>}

function Editor({c,name,onDone}){
 const[s,setS]=useState(c.status),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[e,setE]=useState("");
 const save=async()=>{setBusy(true);setE("");try{await call(`/complaints/${encodeURIComponent(c.id)}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:s,updated_by:name,...(note.trim()&&{note:note.trim()})})});onDone()}catch(x){setE(x.errors?x.errors.map(q=>q.message).join("; "):x.detail||"Update failed")}setBusy(false)};
 return<div className="fx"><p style={{margin:"0 0 10px"}}>{c.description||"No description."}</p>
 <div className="hint">{c.precision} match · {c.severity_source==="fallback"?"default severity (AI unavailable)":"AI-rated"}{c.status_updated_at&&` · last changed ${ago(c.status_updated_at)} by ${c.status_updated_by}`}</div>
 <div className="seg" style={{margin:"12px 0",maxWidth:560}}>{ST.map(x=><button type="button" key={x} className={s===x?"on":""} onClick={()=>setS(x)}>{label(x)}</button>)}</div>
 <textarea style={{minHeight:60,maxWidth:560}} placeholder="Optional note (visible in the citizen's status history)" value={note} onChange={x=>setNote(x.target.value)}/>
 {e&&<div className="err">{e}</div>}<div style={{marginTop:10,display:"flex",gap:8}}><button className="btn ghost" disabled={busy||s===c.status} onClick={save} style={{background:"var(--acc)",color:"#fff",borderColor:"var(--acc)"}}>{busy?"Saving…":"Update status"}</button><button className="btn ghost" onClick={onDone}>Cancel</button></div></div>}
