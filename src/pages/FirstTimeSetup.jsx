import React, { useState } from "react";

export default function FirstTimeSetup({ onStartFresh, onUseSampleData, loading }) {
  const [choice, setChoice] = useState("");
  return (
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f7f8fa",padding:"24px"}}>
      <div style={{maxWidth:900,width:"100%",background:"#fff",borderRadius:16,padding:32,boxShadow:"0 10px 30px rgba(0,0,0,.08)"}}>
        <h1 style={{marginTop:0}}>Set up your Host Kit</h1>
        <p style={{color:"#5b6472"}}>Choose how you want to start managing your properties.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginTop:18}}>
          <div style={{border:"1px solid #e5e7eb",borderRadius:12,padding:18}}>
            <h3>Start Fresh</h3>
            <p>Begin with an empty workspace and add your own properties, bookings, guests, expenses, cleaning tasks, and supplies.</p>
            <button disabled={loading} onClick={async()=>{setChoice("fresh");await onStartFresh?.();}}>{loading&&choice==='fresh'?"Saving...":"Start Fresh"}</button>
          </div>
          <div style={{border:"1px solid #e5e7eb",borderRadius:12,padding:18}}>
            <h3>Use Sample Data</h3>
            <p>Explore the dashboard with pre-filled demo properties, bookings, guests, cleaning tasks, expenses, supplies, and reports.</p>
            <button disabled={loading} onClick={async()=>{setChoice("sample");await onUseSampleData?.();}}>{loading&&choice==='sample'?"Loading...":"Load Sample Data"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
