import{useState,useEffect}from"react";
import{Chart as C,ArcElement,Tooltip,Legend}from"chart.js";
import Admin from"./Admin.jsx";import{get}from"./api.js";
C.register(ArcElement,Tooltip,Legend);
export default function AdminPage(){
 const[cats,setCats]=useState(["water","roads"]);
 useEffect(()=>{document.title="Officials · Jan Vikas";const m=document.createElement("meta");m.name="robots";m.content="noindex,nofollow";document.head.appendChild(m);
  get("/categories").then(d=>d.categories?.length&&setCats(d.categories)).catch(()=>{})},[]);
 return<><header><div className="wrap bar"><div className="logo">Jan<b>Vikas</b><span>Officials portal</span></div><nav><a href="/" style={{color:"var(--mut)",fontSize:14,textDecoration:"none"}}>← Public site</a></nav></div></header>
 <main className="wrap"><Admin cats={cats}/></main>
 <footer><div className="wrap">Restricted area · authorised officials only</div></footer></>}
