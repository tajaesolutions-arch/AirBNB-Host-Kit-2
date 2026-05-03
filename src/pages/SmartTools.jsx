import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Field, PageHeader, Chip } from "../components/index.jsx";
import { calculateGuestLTVScore, calculateQuoteTotal, calculateTaxPrepPack, fmtCurrency, generateQuoteMessage, generateSmartGuestMessage, getRepeatGuestCandidates, parseICSCalendar, uid } from "../utils/helpers.js";

const sectionStyle={marginBottom:16};

export default function SmartTools(){
  const app=useApp();
  const {properties=[],bookings=[],guests=[],cleaning=[],maintenance=[],supplies=[],expenses=[],quotes=[],setQuotes,messageDrafts=[],setMessageDrafts,calendarFeeds=[],setCalendarFeeds,importedCalendarEvents=[],setImportedCalendarEvents,photoProofs=[],setPhotoProofs,damageDeposits=[],setDamageDeposits,repeatCampaigns=[],setRepeatCampaigns,pricingNotes=[],setPricingNotes,taxPrepPacks=[],setTaxPrepPacks,ownerPortalShares=[],setOwnerPortalShares,maintenanceApprovals=[],setMaintenanceApprovals}=app;
  const [ics,setIcs]=useState("");
  const [q,setQ]=useState({property_id:properties[0]?.property_id||"",guest_name:"",checkin_date:"",checkout_date:"",number_of_guests:2,nightly_rate:0,cleaning_fee:0,extra_fees:0,discount:0,deposit_amount:0,payment_deadline:"",quote_status:"Draft"});
  const [m,setM]=useState({template_type:"Check-in instructions",tone:"Friendly",guest_name:"Guest"});
  const [proof,setProof]=useState({linked_type:"cleaning",linked_id:"",property_id:properties[0]?.property_id||"",proof_title:"",proof_url:"",proof_note:""});
  const totals=useMemo(()=>calculateQuoteTotal(q),[q]);
  const ltv=useMemo(()=>guests.map(g=>({guest:g,...calculateGuestLTVScore(g,bookings)})).sort((a,b)=>b.score-a.score),[guests,bookings]);
  const candidates=useMemo(()=>getRepeatGuestCandidates(guests,bookings),[guests,bookings]);
  const month=new Date().toISOString().slice(0,7);

  return <div className="page"><PageHeader title="Smart Tools" subtitle="Modular premium features" />

  <div className="card" style={sectionStyle}><h3 className="section-title">1) Smart Alerts Center / Host Health / Forecast (Dashboard cards enabled)</h3><p className="page-subtitle">See dashboard for computed alerts, health score and forecasting widgets.</p></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">4) Direct Booking Quote Generator</h3><div className="form-grid">
    <Field label="Property"><select value={q.property_id} onChange={e=>{const p=properties.find(x=>x.property_id===e.target.value);setQ({...q,property_id:e.target.value,nightly_rate:p?.default_nightly_rate||0,cleaning_fee:p?.default_cleaning_fee||0});}}>{properties.map(p=><option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}</select></Field>
    <Field label="Guest"><input value={q.guest_name} onChange={e=>setQ({...q,guest_name:e.target.value})}/></Field><Field label="Check-in"><input type="date" value={q.checkin_date} onChange={e=>setQ({...q,checkin_date:e.target.value})}/></Field><Field label="Check-out"><input type="date" value={q.checkout_date} onChange={e=>setQ({...q,checkout_date:e.target.value})}/></Field>
    <Field label="Nightly"><input type="number" value={q.nightly_rate} onChange={e=>setQ({...q,nightly_rate:Number(e.target.value)})}/></Field><Field label="Cleaning"><input type="number" value={q.cleaning_fee} onChange={e=>setQ({...q,cleaning_fee:Number(e.target.value)})}/></Field>
  </div><p>{totals.nights} nights · Total {fmtCurrency(totals.total)}</p><textarea value={generateQuoteMessage(q)} readOnly />
  <button className="btn-primary" onClick={()=>setQuotes(v=>[{quote_id:uid('QTE'),...q,quote_message:generateQuoteMessage(q),created_at:new Date().toISOString()},...v])}>Save Quote</button>
  <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Status</th><th>Total</th></tr></thead><tbody>{quotes.map(x=><tr key={x.quote_id}><td>{x.guest_name}</td><td>{x.quote_status||'Draft'}</td><td>{fmtCurrency(calculateQuoteTotal(x).total)}</td></tr>)}</tbody></table></div>
  </div>

  <div className="card" style={sectionStyle}><h3 className="section-title">5) AI Guest Message Assistant</h3><div className="form-grid"><Field label="Type"><input value={m.template_type} onChange={e=>setM({...m,template_type:e.target.value})}/></Field><Field label="Tone"><input value={m.tone} onChange={e=>setM({...m,tone:e.target.value})}/></Field></div><textarea value={generateSmartGuestMessage(m)} onChange={()=>{}} readOnly /><button className="btn-secondary" onClick={()=>setMessageDrafts(v=>[{draft_id:uid('DRF'),...m,message_body:generateSmartGuestMessage(m),created_at:new Date().toISOString()},...v])}>Save Smart Draft</button><div>{messageDrafts.length} drafts saved</div></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">6) Cleaner Mobile Task View</h3><p className="page-subtitle">Use page alias <code>cleaning</code> with mobile cards (existing cleaning data source).</p><button className="btn-secondary" onClick={()=>navigator.clipboard?.writeText('cleaner-link-placeholder')}>Copy Cleaner Link</button><div className="grid-2">{cleaning.slice(0,4).map(c=><div className="card" key={c.cleaning_id}><strong>{properties.find(p=>p.property_id===c.property_id)?.property_name}</strong><div>Status: {c.cleaning_status}</div><button className="btn-ghost" onClick={()=>app.setCleaning(v=>v.map(i=>i.cleaning_id===c.cleaning_id?{...i,cleaning_status:'In Progress'}:i))}>Start</button></div>)}</div></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">7) Photo Proof</h3><div className="form-grid"><Field label="Type"><select value={proof.linked_type} onChange={e=>setProof({...proof,linked_type:e.target.value})}><option>cleaning</option><option>maintenance</option><option>damage</option><option>supply</option></select></Field><Field label="Linked ID"><input value={proof.linked_id} onChange={e=>setProof({...proof,linked_id:e.target.value})}/></Field><Field label="URL"><input value={proof.proof_url} onChange={e=>setProof({...proof,proof_url:e.target.value})}/></Field></div><button className="btn-primary" onClick={()=>setPhotoProofs(v=>[{proof_id:uid('PRF'),...proof,uploaded_at:new Date().toISOString()},...v])}>Add Proof</button><p>Proofs: {photoProofs.length}</p></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">8) Damage Deposit Tracker</h3><button className="btn-secondary" onClick={()=>setDamageDeposits(v=>[{deposit_id:uid('DEP'),booking_id:bookings[0]?.booking_id||'',guest_id:guests[0]?.guest_id||'',property_id:properties[0]?.property_id||'',deposit_required:true,deposit_amount:50000,deposit_collected:false,damage_reported:false,refund_status:'Pending',guest_notified:false},...v])}>Add Sample Deposit Case</button><div>{damageDeposits.length} records</div></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">9-10) Guest LTV & Repeat Campaigns</h3><div className="table-wrap"><table><thead><tr><th>Guest</th><th>Score</th><th>Badge</th><th></th></tr></thead><tbody>{ltv.map(({guest,score})=><tr key={guest.guest_id}><td>{guest.guest_name}</td><td>{score}</td><td><Chip tone={score>=75?'teal':'blue'}>{score>=75?'VIP':'Repeat Potential'}</Chip></td><td><button className="btn-ghost" onClick={()=>setRepeatCampaigns(v=>[{campaign_id:uid('RPC'),guest_id:guest.guest_id,guest_name:guest.guest_name,last_stay_date:'',campaign_type:'Follow-up',status:'Draft',message:`Hi ${guest.guest_name}, welcome back!`,created_at:new Date().toISOString()},...v])}>Create Campaign</button></td></tr>)}</tbody></table></div><p>{candidates.length} eligible candidates · {repeatCampaigns.length} campaigns</p></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">11) Maintenance Approval Workflow</h3><button className="btn-secondary" onClick={()=>setMaintenanceApprovals(v=>[{approval_id:uid('APR'),issue_id:maintenance[0]?.maintenance_id||'',property_id:properties[0]?.property_id||'',owner_name:properties[0]?.owner_name||'',estimated_cost:25000,approval_status:'Pending',vendor_assigned:''},...v])}>Create Approval</button><p>{maintenanceApprovals.length} approvals</p></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">12) Tax/GCT Preparation Pack</h3><button className="btn-primary" onClick={()=>setTaxPrepPacks(v=>[{pack_id:uid('TXP'),month,property_id:properties[0]?.property_id||'',...calculateTaxPrepPack({bookings,expenses,month}),exported_at:new Date().toISOString()},...v])}>Generate Pack</button><p>{taxPrepPacks.length} packs saved</p></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">13) Dynamic Pricing Notes</h3><button className="btn-secondary" onClick={()=>setPricingNotes(v=>[{note_id:uid('PRN'),property_id:properties[0]?.property_id||'',start_date:month+'-10',end_date:month+'-15',note_type:'High Demand',title:'Festival window',recommendation:'Raise by 15%',suggested_rate:65000,minimum_stay:2,created_at:new Date().toISOString()},...v])}>Add Pricing Note</button><p>{pricingNotes.length} notes</p></div>

  <div className="card" style={sectionStyle}><h3 className="section-title">14) iCal Calendar Sync</h3><button className="btn-secondary" onClick={()=>setCalendarFeeds(v=>[{feed_id:uid('FED'),property_id:properties[0]?.property_id||'',platform:'Airbnb',feed_name:'Manual',feed_url:'',notes:''},...v])}>Add Feed</button><textarea value={ics} onChange={e=>setIcs(e.target.value)} placeholder="Paste ICS"/><button className="btn-primary" onClick={()=>setImportedCalendarEvents(v=>[...parseICSCalendar(ics).map(x=>({event_id:uid('ICE'),...x,source_status:'Imported'}),),...v])}>Import ICS</button><p>{calendarFeeds.length} feeds · {importedCalendarEvents.length} events</p></div>

  <div className="card"><h3 className="section-title">15) Owner Portal Preview</h3><button className="btn-secondary" onClick={()=>setOwnerPortalShares(v=>[{share_id:uid('OWN'),owner_name:properties[0]?.owner_name||'',owner_email:properties[0]?.owner_email||'',property_id:properties[0]?.property_id||'',month,access_token:uid('TOK'),enabled:true,created_at:new Date().toISOString()},...v])}>Save Owner Share</button><p>{ownerPortalShares.length} shares</p></div>

  </div>;
}
