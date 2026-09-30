import React,{lazy,Suspense}from"react";import{createRoot}from"react-dom/client";import App from"./App.jsx";import"./styles.css";
const ADMIN=("/"+(import.meta.env.VITE_ADMIN_PATH||"officials")).replace(/\/+/g,"/").toLowerCase();
const Admin=lazy(()=>import("./AdminPage.jsx"));
const isAdmin=location.pathname.replace(/\/$/,"").toLowerCase()===ADMIN;
createRoot(document.getElementById("root")).render(isAdmin?<Suspense fallback={null}><Admin/></Suspense>:<App/>);
