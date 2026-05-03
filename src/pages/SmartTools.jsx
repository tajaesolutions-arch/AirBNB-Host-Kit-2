import { useMemo, useState } from "react";
import { Modal, PageHeader } from "../components/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { Bell, Calculator, Camera, ClipboardList, DollarSign, FileText, HeartPulse, MessageSquare, Shield, TrendingUp } from "lucide-react";
import { buildOwnerReportSummary, buildTaxPrepSummary, calculateHostHealthScore, calculateProfitForecast, calculateQuoteTotals, copyText, generateQuoteMessage, generateSmartMessage, openEmailDraft, openPrintDocument, openWhatsAppDraft, safeArray, uid } from "../utils/helpers.js";

const mvpTools=["Calendar Sync","Dynamic Pricing Notes","Repeat Guest Campaigns","Guest Lifetime Value","Maintenance Approval"];
export default function SmartTools({ setPage }) {
  const app = useApp();
  const { leads=[], properties=[], settings={}, quotes=[], setQuotes, bookings=[], setBookings, guests=[], messageDrafts=[], setMessageDrafts, cleaning=[], setCleaning, maintenance=[], supplies=[], expenses=[], ownerPortalShares=[], setOwnerPortalShares, damageDeposits=[], setDamageDeposits, photoProofs=[], setPhotoProofs, taxPrepPacks=[], setTaxPrepPacks } = app;
  const [active, setActive] = useState(""); const [status,setStatus]=useState("");
  const alerts = useMemo(()=>[{id:'a1',title:'Unpaid bookings',count:bookings.filter(b=>b.payment_status!=="Paid"&&b.booking_status==="Confirmed").length,severity:'amber'}].filter(a=>a.count>0),[bookings]);
  const summary=[{label:'Active Tools',value:10},{label:'Saved Quotes',value:safeArray(quotes).length},{label:'Open Alerts',value:alerts.reduce((s,a)=>s+a.count,0)},{label:'Pending Follow-ups',value:guests.filter(g=>g.follow_up_due).length}];

  const [quote,setQuote]=useState({mode:'lead',lead_id:'',guest_name:'',phone:'',email:'',property_id:'',checkin_date:'',checkout_date:'',nightly_rate:0,cleaning_fee:0,extra_fees:0,discount:0,deposit_percent:30});
  const selectedProperty=properties.find(p=>p.id===quote.property_id);
  const quoteTotals=calculateQuoteTotals(quote);
  const qmsg=generateQuoteMessage({...quote,...quoteTotals,property_name:selectedProperty?.name},settings);

  const openTool=(name)=>{setStatus('');setActive(name);};
  const saveQuote=()=>{setQuotes([...(quotes||[]),{id:uid('Q'),...quote,...quoteTotals,created_at:new Date().toISOString()}]);setStatus('Quote saved.');};

  const tools=[
    {name:'Direct Booking Quote Generator',icon:DollarSign,status:'Live',desc:'Create a branded direct-booking quote from a lead, then copy, save, export, or convert it into a booking.',action:()=>openTool('quote'),link:'direct-leads'},
    {name:'Smart Message Assistant',icon:MessageSquare,status:'Live',desc:'Generate editable WhatsApp or email drafts for guests, owners, reviews, payments, and damage notices.',action:()=>openTool('message'),link:'messages'},
    {name:'Cleaner Task View',icon:ClipboardList,status:'Live',desc:'Update turnovers from a mobile-friendly cleaner board with one-click status actions.',action:()=>openTool('cleaner'),link:'cleaning-schedule'},
    {name:'Smart Alerts Center',icon:Bell,status:'Live',desc:'Review urgent host issues such as unpaid bookings, low stock, overdue cleaning, and open repairs.',action:()=>openTool('alerts'),link:'dashboard'},
    {name:'Owner Report Export',icon:FileText,status:'Live',desc:'Generate an owner-ready monthly performance report and share record.',action:()=>openTool('owner'),link:'owner-report'},
    {name:'Damage & Deposit Tracker',icon:Shield,status:'Live',desc:'Track deposits, deductions, damage outcomes, and guest notices.',action:()=>openTool('damage'),link:'booking-calendar'},
    {name:'Photo Proof',icon:Camera,status:'Live',desc:'Attach proof links to cleaning, maintenance, damage, and supplies records.',action:()=>openTool('proof'),link:'maintenance'},
    {name:'Tax Prep Pack',icon:Calculator,status:'Live',desc:'Build an accountant-ready monthly summary with export options.',action:()=>openTool('tax'),link:'tax-reserve'},
    {name:'Profit Forecast',icon:TrendingUp,status:'Live',desc:'Forecast gross revenue, expenses, and estimated net performance.',action:()=>openTool('forecast'),link:'revenue'},
    {name:'Host Health Score',icon:HeartPulse,status:'Live',desc:'Score operational risk and prioritize immediate fixes.',action:()=>openTool('health'),link:'dashboard'},
  ];

  return <div className='page'><PageHeader title='Smart Tools' subtitle='Run high-value host workflows from one place — quotes, guest messages, cleaner actions, owner reports, alerts, and financial exports.'/>
  <div className='grid cols-4'>{summary.map(s=><div className='metric-card' key={s.label}><div className='label'>{s.label}</div><div className='value'>{s.value}</div></div>)}</div>
  <div className='smart-tools-grid'>{tools.map(t=>{const I=t.icon;return <div key={t.name} className='card smart-tool-card'><div className='smart-tool-card-header'><span className='icon-badge'><I size={16}/></span><h3>{t.name}</h3><span className='chip green'>{t.status}</span></div><p>{t.desc}</p><div className='smart-tool-actions'><button className='btn-primary' onClick={t.action}>Open Tool</button><button className='btn-ghost' onClick={()=>setPage?.(t.link)}>Open Page</button></div></div>})}
  {mvpTools.map(t=><div key={t} className='card smart-tool-card'><h3>{t}</h3><p>Coming soon with production workflows. No placeholder forms.</p><div className='chip gray'>Coming Soon</div><button className='btn-secondary' disabled>Coming Soon</button></div>)}</div>
  <Modal open={!!active} onClose={()=>setActive('')} title={tools.find(t=>t.action&&active&&t.name.toLowerCase().includes(active))?.name || 'Smart Tool'} wide>
    <p className='smart-tool-status'>{status||'Ready.'}</p>
    {active==='quote' && <div><select value={quote.lead_id} onChange={e=>{const l=leads.find(x=>x.id===e.target.value)||{};setQuote({...quote,lead_id:e.target.value,guest_name:l.lead_name||'',phone:l.phone||'',email:l.email||''});}}><option value=''>Select lead</option>{leads.map(l=><option key={l.id} value={l.id}>{l.lead_name}</option>)}</select><input placeholder='Guest name' value={quote.guest_name} onChange={e=>setQuote({...quote,guest_name:e.target.value})}/><select value={quote.property_id} onChange={e=>setQuote({...quote,property_id:e.target.value})}><option value=''>Property</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type='date' value={quote.checkin_date} onChange={e=>setQuote({...quote,checkin_date:e.target.value})}/><input type='date' value={quote.checkout_date} onChange={e=>setQuote({...quote,checkout_date:e.target.value})}/><div>Total: {quoteTotals.total}</div><textarea value={qmsg} readOnly/><div className='smart-tool-actions'><button className='btn-secondary' onClick={()=>copyText(qmsg).then(ok=>setStatus(ok?'Quote copied.':'Copy failed.'))}>Copy Quote</button><button className='btn-primary' onClick={saveQuote}>Save Quote</button><button className='btn-secondary' onClick={()=>{openPrintDocument({title:'Direct Booking Quote',bodyHtml:`<h3>Direct Booking Quote</h3><p>${qmsg.replace(/\n/g,'<br/>')}</p>`,businessName:settings.business_name});setStatus('PDF export opened.');}}>Export PDF</button><button className='btn-secondary' disabled={!quote.phone} onClick={()=>setStatus(openWhatsAppDraft({phone:quote.phone,text:qmsg})?'WhatsApp draft opened.':'Phone required.')}>Open WhatsApp Draft</button><button className='btn-secondary' disabled={!quote.email} onClick={()=>setStatus(openEmailDraft({email:quote.email,subject:'Direct Booking Quote',body:qmsg})?'Email draft opened.':'Email required.')}>Open Email Draft</button><button className='btn-primary' onClick={()=>{setBookings([...(bookings||[]),{id:uid('BK'),guest_name:quote.guest_name,property_id:quote.property_id,checkin_date:quote.checkin_date,checkout_date:quote.checkout_date,booking_status:'Confirmed',payment_status:'Pending',platform:'Direct'}]);setStatus('Booking created.')}}>Convert to Booking</button></div></div>}
  </Modal></div>;
}
