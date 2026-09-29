import{useState,useEffect,useRef,useCallback,useMemo}from"react";
import{Chart as C,CategoryScale,LinearScale,BarElement,PointElement,LineElement,ArcElement,RadialLinearScale,Filler,Tooltip,Legend}from"chart.js";
import{Bar,Line,Doughnut,Radar}from"react-chartjs-2";
import{get,post,call,health,icon,label,fmt}from"./api.js";
C.register(CategoryScale,LinearScale,BarElement,PointElement,LineElement,ArcElement,RadialLinearScale,Filler,Tooltip,Legend);
const PAL=["#c2410c","#1f3a5f","#2f7d4f","#b8860b","#7c3aed","#0e7490","#be185d"];
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||"#888";
function useTheme(){const[k,setK]=useState(0);useEffect(()=>{const m=matchMedia("(prefers-color-scheme:dark)"),f=()=>setK(x=>x+1);m.addEventListener("change",f);return()=>m.removeEventListener("change",f)},[]);
 const ink=css("--mut"),line=css("--line");C.defaults.color=ink;C.defaults.font.family="Instrument Sans, sans-serif";C.defaults.borderColor=line;return{k}}
const opt=(x={})=>({responsive:true,maintainAspectRatio:false,animation:{duration:900,easing:"easeOutQuart"},plugins:{legend:{display:false}},...x});
function usePoll(fn,ms,deps){const[s,set]=useState({data:null,err:null,at:null});const f=useRef(fn);f.current=fn;
 useEffect(()=>{let on=true;const run=async()=>{try{const d=await f.current();on&&set({data:d,err:null,at:new Date()})}catch(e){on&&set(p=>({...p,err:e.detail||"Failed to load"}))}};run();const t=setInterval(run,ms);return()=>{on=false;clearInterval(t)}},deps);return s}
function Count({v,d=0}){const[n,setN]=useState(0);const from=useRef(0);
 useEffect(()=>{const a=from.current,b=+v||0,t0=performance.now();let r;const step=t=>{const p=Math.min(1,(t-t0)/800),e=1-Math.pow(1-p,3);setN(a+(b-a)*e);if(p<1)r=requestAnimationFrame(step);else from.current=b};r=requestAnimationFrame(step);return()=>cancelAnimationFrame(r)},[v]);
 return<>{n.toLocaleString("en-IN",{maximumFractionDigits:d,minimumFractionDigits:d})}</>}
function useCategories(){const[c,setC]=useState(["water","roads"]);useEffect(()=>{get("/categories").then(d=>d.categories?.length&&setC(d.categories)).catch(()=>{})},[]);return c}

export default function App(){
 const[view,setView]=useState("report"),[api,setApi]=useState(null),cats=useCategories(),[done,setDone]=useState(null);
 useEffect(()=>{health().then(j=>setApi({ok:true,t:"API live"+(j.ai_mode?" · AI "+j.ai_mode:"")})).catch(()=>setApi({ok:false,t:"API unreachable"}))},[]);
 return<>
 <header><div className="wrap bar"><div className="logo">Jan<b>Vikas</b><span>CDI</span></div>
  <span className={"pill hide "+(api?(api.ok?"up":"down"):"")}><i/>{api?api.t:"connecting…"}</span>
  <nav>{[["report","Report"],["board","Live dashboard"],["track","Track"]].map(([k,t])=><button key={k} className={view===k?"on":""} onClick={()=>{setView(k);scrollTo(0,0)}}>{t}</button>)}</nav></div></header>
 <main className="wrap">
  {view==="report"&&<Report cats={cats} done={done} setDone={setDone} goBoard={()=>setView("board")}/>}
  {view==="board"&&<Dashboard cats={cats}/>}
  {view==="track"&&<Track/>}
 </main>
 <footer><div className="wrap">Citizen Development Intelligence · a Digital Public Good prototype · Hack2Skill</div></footer></>}

/* ---------------- Report ---------------- */
function Report({cats,done,setDone,goBoard}){
 const[cat,setCat]=useState("");const[mode,setMode]=useState("text"),[lm,setLm]=useState("pin"),[text,setText]=useState(""),[lang,setLang]=useState("");
 const[pin,setPin]=useState(""),[pd,setPd]=useState(null),[pinHint,setPinHint]=useState("Pilot coverage: Rajasthan."),[pv,setPv]=useState(""),[pdist,setPdist]=useState("");
 const[dists,setDists]=useState([]),[blocks,setBlocks]=useState([]),[vils,setVils]=useState([]),[d,setD]=useState(""),[b,setB]=useState(""),[v,setV]=useState("");
 const[blob,setBlob]=useState(null),[rec,setRec]=useState(false),mr=useRef(null),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{get("/locations?state=Rajasthan").then(x=>setDists(x.items)).catch(()=>{})},[]);
 useEffect(()=>{setPd(null);setPv("");setPdist("");if(pin.length!==6){setPinHint("Pilot coverage: Rajasthan.");return}setPinHint("Looking up…");
  get("/locations/pincode/"+pin).then(x=>{setPd(x);setPinHint(`${x.village_count} villages found in ${x.districts.map(y=>y.name).join(" / ")}, ${x.state}.`)}).catch(x=>setPinHint(x.code==="unknown_pincode"?"PIN code not found in the pilot area.":x.detail||"Lookup failed."))},[pin]);
 const pickD=async val=>{setD(val);setB("");setV("");setVils([]);setBlocks(val?(await get("/locations?district="+encodeURIComponent(val))).items:[])};
 const pickB=async val=>{setB(val);setV("");setVils(val?(await get("/locations?block="+encodeURIComponent(val))).items:[])};
 const toggleRec=async()=>{if(rec){mr.current.stop();return}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true}),ch=[];const m=new MediaRecorder(st);mr.current=m;m.ondataavailable=e=>ch.push(e.data);
   m.onstop=()=>{st.getTracks().forEach(t=>t.stop());setBlob(new Blob(ch,{type:m.mimeType}));setRec(false)};m.start();setRec(true)}catch{setErr("Microphone unavailable. Please type instead.")}};
 const b64=x=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(x)});
 const submit=async e=>{e.preventDefault();setErr("");let location;
  if(!cat)return setErr("Select an issue type.");
  if(lm==="pin"){if(!pd)return setErr("Enter a valid PIN code.");if(!pv)return setErr("Select your village, or choose “not listed”.");
   location={method:"pincode",pincode:pd.pincode};if(pv!=="__none")location.lgd_code=pv;else if(pd.requires_district_choice){if(!pdist)return setErr("Select your district.");location.district_lgd_code=pdist}}
  else{if(!v)return setErr("Select district, block and village.");location={method:"manual",lgd_code:v}}
  const body={category:cat,location,channel:mode==="voice"?"voice":"web",timestamp:new Date().toISOString()};if(lang)body.language=lang;
  if(mode==="text"){if(text.trim().length<5)return setErr("Please describe the problem in a few words.");body.input_type="text";body.text=text.trim()}
  else{if(!blob)return setErr("Record your request first.");body.input_type="voice";body.audio_file=await b64(blob)}
  setBusy(true);try{const{body:r}=await post("/complaints",body);setDone(r);setText("");setBlob(null)}catch(x){setErr(x.errors?x.errors.map(q=>q.message).join("; "):x.detail||"Submission failed.")}setBusy(false)};
 const l=done?.location||{};
 return<><div className="hero fx"><h1>Tell your government what your <em>village</em> needs.</h1><p>Write or speak in any Indian language. AI understands your request, maps it to your village, and weighs it against infrastructure gaps and population to help decide which projects come first.</p></div>
 <div className="grid">
 <form className="card fx" onSubmit={submit} autoComplete="off"><h2>Submit a development request</h2>
  <label>Issue type</label>
  <select value={cat} onChange={e=>setCat(e.target.value)}><option value="">Select an issue…</option>{cats.map(c=><option key={c} value={c}>{icon(c)} {label(c)}</option>)}</select>
  <label>Your request</label>
  <div className="tabs">{[["text","Type"],["voice","Speak"]].map(([k,t])=><button type="button" key={k} className={mode===k?"on":""} onClick={()=>setMode(k)}>{t}</button>)}</div>
  {mode==="text"?<textarea value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. हमारे गांव में तीन महीने से पानी नहीं आया"/>:
   <div className="rec" style={{marginTop:12}}><button type="button" className="btn" onClick={toggleRec}>{rec?"■ Stop":blob?"● Record again":"● Start recording"}</button>{rec&&<span className="dot"/>}{blob&&!rec&&<audio controls src={URL.createObjectURL(blob)} style={{flex:1}}/>}</div>}
  <label>Language</label>
  <select value={lang} onChange={e=>setLang(e.target.value)}><option value="">Auto-detect</option>{[["hi","हिन्दी"],["en","English"],["mwr","मारवाड़ी / Rajasthani"],["gu","ગુજરાતી"],["mr","मराठी"],["pa","ਪੰਜਾਬੀ"],["bn","বাংলা"],["ta","தமிழ்"],["te","తెలుగు"]].map(([k,t])=><option key={k} value={k}>{t}</option>)}</select>
  <label>Location</label>
  <div className="tabs">{[["pin","By PIN code"],["man","Choose from list"]].map(([k,t])=><button type="button" key={k} className={lm===k?"on":""} onClick={()=>setLm(k)}>{t}</button>)}</div>
  {lm==="pin"?<div style={{marginTop:12}}><input value={pin} inputMode="numeric" maxLength={6} placeholder="6-digit PIN code" onChange={e=>setPin(e.target.value.replace(/\D/g,""))}/>
   {pd?.requires_district_choice&&<select style={{marginTop:10}} value={pdist} onChange={e=>setPdist(e.target.value)}><option value="">District…</option>{pd.districts.map(x=><option key={x.lgd_code} value={x.lgd_code}>{x.name}</option>)}</select>}
   {pd&&<select style={{marginTop:10}} value={pv} onChange={e=>setPv(e.target.value)}><option value="">Select your village…</option>{pd.villages.map(x=><option key={x.lgd_code} value={x.lgd_code}>{x.village} ({x.block})</option>)}<option value="__none">My village is not listed</option></select>}
   <div className="hint">{pinHint}</div></div>:
   <div style={{marginTop:12,display:"grid",gap:10}}><select value={d} onChange={e=>pickD(e.target.value)}><option value="">District</option>{dists.map(x=><option key={x.lgd_code} value={x.lgd_code}>{x.name}</option>)}</select>
    <select value={b} disabled={!blocks.length} onChange={e=>pickB(e.target.value)}><option value="">Block</option>{blocks.map(x=><option key={x.lgd_code} value={x.lgd_code}>{x.name}</option>)}</select>
    <select value={v} disabled={!vils.length} onChange={e=>setV(e.target.value)}><option value="">Village</option>{vils.map(x=><option key={x.lgd_code} value={x.lgd_code}>{x.name}</option>)}</select></div>}
  {err&&<div className="err">{err}</div>}
  <button className="btn" disabled={busy}>{busy?"Analysing your request…":"Submit request"}</button></form>
 <aside>{done?<div className="card ok fx"><h2>✓ Request received</h2><div className="hint">Save this ID to track progress</div><div style={{font:"700 26px Fraunces,serif",margin:"4px 0 8px"}}>{done.id}</div>
  <dl className="kv"><dt>Issue</dt><dd><span className="tag">{icon(done.category)} {label(done.category)}</span></dd><dt>Severity</dt><dd>{done.severity} / 5</dd><dt>Urgency</dt><dd><span className={"tag "+done.urgency}>{done.urgency}</span></dd><dt>Location</dt><dd>{[l.village,l.block,l.district].filter(Boolean).join(", ")}</dd></dl>
  {done.severity_source==="fallback"&&<div className="hint">AI was busy, so a default severity was applied.</div>}
  {done.location_resolution_status==="low_confidence"&&<div className="hint">Matched at district level only.</div>}
  <div style={{display:"flex",gap:8,marginTop:14}}><button className="btn ghost" onClick={goBoard}>View live dashboard →</button><button className="btn ghost" onClick={()=>setDone(null)}>New request</button></div></div>:
  <div className="card fx"><h2>What happens next</h2><ol className="steps"><li><b>AI reads your request</b> and rates severity and urgency.</li><li><b>Location is resolved</b> to your village via official LGD codes.</li><li><b>Evidence is fused</b>: demand × infrastructure gap × population × urgency × funding gap.</li><li><b>Live dashboard updates</b> within seconds for policymakers.</li></ol></div>}</aside></div></>}

/* ---------------- Dashboard ---------------- */
function Dashboard({cats}){
 useTheme();const[lv,setLv]=useState("district"),[cat,setCat]=useState(""),[sel,setSel]=useState(null),hist=useRef([]),[,tick]=useState(0);
 const{data,err,at}=usePoll(async()=>{const d=await get(`/hotspots?level=${lv}&limit=100`);const h=(Array.isArray(d)?d:d.hotspots||d.items||[]);
  hist.current=[...hist.current.slice(-19),{t:new Date().toLocaleTimeString([],{minute:"2-digit",second:"2-digit"}),n:h.reduce((a,x)=>a+(x.complaint_count||0),0)}];return h},15000,[lv]);
 const all=data||[],rows=useMemo(()=>all.filter(x=>!cat||x.category===cat).sort((a,b)=>(b.priority_score||0)-(a.priority_score||0)),[all,cat]);
 const pop=rows.reduce((a,x)=>a+(x.affected_population||0),0),reqs=rows.reduce((a,x)=>a+(x.complaint_count||0),0);
 const top=rows.slice(0,8),byCat=cats.map(c=>all.filter(x=>x.category===c).reduce((a,x)=>a+(x.complaint_count||0),0));
 const maxPop=Math.max(1,...rows.map(x=>x.affected_population||0)),s=sel&&rows.find(x=>x.id===sel.id&&x.category===sel.category);
 const nm=x=>x.name+(cat?"":" · "+label(x.category));
 return<><div className="hero fx" style={{paddingBottom:6}}><h1>Live priority <em>dashboard</em></h1><p>Ranked by transparent priority score from active requests. Refreshes every 15 seconds.</p></div>
 <div className="filters fx"><select value={lv} onChange={e=>{setLv(e.target.value);setSel(null)}}><option value="district">Districts</option><option value="village">Villages</option></select>
  <select value={cat} onChange={e=>setCat(e.target.value)}><option value="">All issues</option>{cats.map(c=><option key={c} value={c}>{icon(c)} {label(c)}</option>)}</select>
  <span className="live"><i/>LIVE{at&&<span className="hint" style={{margin:0}}> · {at.toLocaleTimeString()}</span>}</span></div>
 {err&&<div className="err">{err}</div>}
 <div className="stats">{[["Places ranked",rows.length,0],["Active requests",reqs,0],["People affected",pop,0],["Top priority score",rows[0]?.priority_score||0,1]].map(([t,v,d],i)=><div className="stat fx" style={{animationDelay:i*80+"ms"}} key={t}><b><Count v={v} d={d}/></b><span>{t}</span></div>)}</div>
 {!data&&!err?<div className="card empty">Loading live data…</div>:!rows.length?<div className="card empty">No active requests yet. Be the first to report.</div>:<>
 <div className="charts">
  <div className="card fx"><h3>Top priority places <span className="live"><i/>live</span></h3><div className="ch"><Bar data={{labels:top.map(nm),datasets:[{data:top.map(x=>x.priority_score),backgroundColor:top.map((x,i)=>PAL[cats.indexOf(x.category)%PAL.length]),borderRadius:6}]}} options={opt({indexAxis:"y",scales:{x:{min:0,max:100},y:{grid:{display:false}}},onClick:(_,e)=>e[0]&&setSel(top[e[0].index])})}/></div></div>
  <div className="card fx"><h3>Requests by issue</h3><div className="ch"><Doughnut data={{labels:cats.map(label),datasets:[{data:byCat,backgroundColor:PAL,borderWidth:0}]}} options={opt({cutout:"62%",plugins:{legend:{display:true,position:"bottom"}},animation:{animateRotate:true,duration:1100}})}/></div></div></div>
 <div className="charts b">
  <div className="card fx"><h3>Total active requests (live feed)</h3><div className="ch"><Line data={{labels:hist.current.map(x=>x.t),datasets:[{data:hist.current.map(x=>x.n),borderColor:PAL[0],backgroundColor:"#c2410c22",fill:true,tension:.35,pointRadius:3}]}} options={opt({scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}})}/></div></div>
  <div className="card fx"><h3>{s?`Evidence profile · ${s.name}`:"Evidence profile"}</h3>{s?<div className="ch"><Radar data={{labels:["Demand","Infra gap","Population","Urgency","Funding gap"],datasets:[{data:[s.demand_score,s.infrastructure_gap,(s.affected_population||0)/maxPop*100,s.urgency_score,s.funding_gap_score],backgroundColor:"#c2410c33",borderColor:PAL[0],pointBackgroundColor:PAL[0]}]}} options={opt({scales:{r:{min:0,max:100,ticks:{display:false}}}})}/></div>:<div className="empty">Click a bar or table row to compare its five priority factors.</div>}</div></div>
 <div className="card fx"><h2>Leaderboard</h2><div className="tw"><table><thead><tr><th>#</th><th>Place</th><th>Issue</th><th>Priority score</th><th>Requests</th><th>Infra gap</th><th>Population</th></tr></thead><tbody>
 {rows.slice(0,50).map((x,i)=>{const k=x.id+x.category,sc=Number(x.priority_score||0);return[
  <tr key={k} className={"r"+(s&&s===x?" sel":"")} onClick={()=>setSel(sel?.id===x.id&&sel?.category===x.category?null:x)}><td className={"rank "+(i<3?"t":"")}>{i+1}</td><td><b>{x.name}</b><div className="hint" style={{margin:0}}>{lv==="village"?[x.block,x.district].filter(Boolean).join(", "):x.state}</div></td><td><span className="tag">{icon(x.category)} {label(x.category)}</span></td>
   <td><div className="sc"><div className="meter"><i style={{width:Math.min(100,sc)+"%"}}/></div><b>{sc.toFixed(1)}</b></div></td><td>{fmt(x.complaint_count)}</td><td>{x.infrastructure_gap==null?"–":Number(x.infrastructure_gap).toFixed(0)}</td><td>{fmt(x.affected_population)}{x.population_imputed?" *":""}</td></tr>,
  s&&s.id===x.id&&s.category===x.category&&<tr key={k+"d"} className="det"><td colSpan={7}><Rec item={x}/></td></tr>]})}
 </tbody></table></div><div className="hint" style={{marginTop:12}}>* population estimated. Weights are prototype assumptions, not official policy. Low-connectivity areas may under-report.</div></div></>}</>}

function Rec({item}){
 const[r,setR]=useState(null),[m,setM]=useState("Generating recommendation…");
 useEffect(()=>{let on=true;(async()=>{for(let t=0;t<6&&on;t++){try{const{status,body}=await call(`/recommendations/${encodeURIComponent(item.id)}?category=${item.category}`);
  if(status===202){setM("AI is analysing this place…");await new Promise(z=>setTimeout(z,(body.retry_after_seconds||3)*1000));continue}on&&setR(body);return}catch(e){on&&setM(e.detail||"No recommendation available.");return}}on&&setM("Still computing — try again shortly.")})();return()=>{on=false}},[item.id,item.category]);
 if(!r)return<span className="hint">{m}</span>;
 return<div className="fx"><h3>Recommended: {r.recommended_intervention||"Pending narration"} {r.is_mock&&<span className="mock">demo AI</span>}</h3><p style={{margin:"8px 0"}}>{r.complaint_summary}</p>
 <ul className="ev">{(r.evidence||[]).map((e,i)=><li key={i}><b>{label(e.factor)}</b> ({String(e.value)}){e.description&&" — "+e.description}{e.is_synthetic&&<> <span className="mock">synthetic</span></>}</li>)}</ul></div>}

/* ---------------- Track ---------------- */
function Track(){
 const[id,setId]=useState(""),[r,setR]=useState(null),[e,setE]=useState("");
 const go=async()=>{setE("");setR(null);try{setR(await get("/complaints/"+encodeURIComponent(id.trim().toUpperCase())))}catch(x){setE(x.code==="not_found"?"No request with that ID.":x.detail||"Not found.")}};
 const l=r?.location||{};
 return<><div className="hero fx"><h1>Track your <em>request</em></h1></div><div className="card fx" style={{maxWidth:520,marginBottom:40}}>
 <label style={{marginTop:0}}>Request ID</label><input value={id} onChange={x=>setId(x.target.value)} placeholder="REQ-000001" onKeyDown={x=>x.key==="Enter"&&go()}/><button className="btn" onClick={go}>Check status</button>
 {e&&<div className="err">{e}</div>}
 {r&&<><dl className="kv" style={{marginTop:16}}><dt>Status</dt><dd><span className="tag">{String(r.status).replace("_"," ")}</span></dd><dt>Issue</dt><dd>{icon(r.category)} {label(r.category)}</dd><dt>Location</dt><dd>{[l.village,l.district].filter(Boolean).join(", ")}</dd><dt>Filed</dt><dd>{new Date(r.created_at).toLocaleString()}</dd></dl>
 {(r.history||[]).map((h,i)=><div className="hint" key={i}>{new Date(h.changed_at).toLocaleDateString()} · {h.status}{h.note&&" — "+h.note}</div>)}</>}</div></>}
