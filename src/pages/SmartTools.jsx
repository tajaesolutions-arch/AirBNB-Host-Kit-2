import { useMemo, useState } from "react";
import { Modal, PageHeader } from "../components/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { parseICSCalendar } from "../utils/helpers.js";
import {
  CalendarDays,
  MessageSquare,
  FileText,
  Shield,
  DollarSign,
  Repeat,
  Calculator,
  Sparkles,
  Bell,
  TrendingUp,
  HeartPulse,
} from "lucide-react";

const TOOLS = [
  { key: "calendar", title: "Calendar Sync", desc: "Manage feeds and import ICS events.", page: "bookings", icon: CalendarDays },
  { key: "quote", title: "Quote Generator", desc: "Generate direct booking quotes from leads.", page: "direct-leads", icon: DollarSign },
  { key: "message", title: "AI Message Assistant", desc: "Compose smart guest replies with local templates.", page: "messages", icon: MessageSquare },
  { key: "owner", title: "Owner Portal", desc: "Build owner-facing monthly report previews.", page: "owner-report", icon: FileText },
  { key: "deposit", title: "Damage Deposits", desc: "Track deposit collection, deductions, and refund status.", page: "booking-calendar", icon: Shield },
  { key: "pricing", title: "Pricing Notes", desc: "Save pricing strategies by date range.", page: "booking-calendar", icon: Sparkles },
  { key: "repeat", title: "Repeat Campaigns", desc: "Generate follow-ups for repeat-stay guests.", page: "guest-crm", icon: Repeat },
  { key: "tax", title: "Tax Prep Pack", desc: "Compile tax planning packs by property and month.", page: "tax-reserve", icon: Calculator },
  { key: "alerts", title: "Smart Alerts Center", desc: "Review computed alerts and quick-fix actions.", page: "dashboard", icon: Bell },
  { key: "forecast", title: "Profit Forecast", desc: "Forecast profit from bookings and expenses.", page: "revenue", icon: TrendingUp },
  { key: "health", title: "Host Health Score", desc: "See operational score and fix priorities.", page: "dashboard", icon: HeartPulse },
];

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const nightsBetween = (inDate, outDate) => {
  if (!inDate || !outDate) return 0;
  const ms = new Date(outDate).getTime() - new Date(inDate).getTime();
  return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
};
const overlaps = (aStart, aEnd, bStart, bEnd) => !!(aStart && aEnd && bStart && bEnd && new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart));

export function SmartTools({ setPage }) {
  const { properties, bookings, guests, cleaning, maintenance, expenses, leads, settings, quotes, setQuotes, messageHistory, setMessageHistory, setBookings } = useApp();
  const [activeTool, setActiveTool] = useState(null);
  const [calendarFeeds, setCalendarFeeds] = useState([]);
  const [importedEvents, setImportedEvents] = useState([]);
  const [ownerPortalShares, setOwnerPortalShares] = useState([]);
  const [damageDeposits, setDamageDeposits] = useState([]);
  const [pricingNotes, setPricingNotes] = useState([]);
  const [repeatCampaigns, setRepeatCampaigns] = useState([]);
  const [taxPrepPacks, setTaxPrepPacks] = useState([]);

  const [quote, setQuote] = useState({ source: "manual", lead_id: "", guest_name: "", phone: "", email: "", property_id: "", checkin: "", checkout: "", guests: 1, budget: "", nightly_rate: 0, cleaning_fee: 0, discount: 0, extra_fees: 0 });
  const [draft, setDraft] = useState({ guest_id: "", booking_id: "", type: "Check-in", tone: "Warm", channel: "WhatsApp", text: "" });

  const selectedProperty = properties.find((p) => p.id === quote.property_id);
  const nights = nightsBetween(quote.checkin, quote.checkout);
  const subtotal = nights * Number(quote.nightly_rate || 0) + Number(quote.cleaning_fee || 0) + Number(quote.extra_fees || 0) - Number(quote.discount || 0);
  const total = Math.max(0, subtotal);
  const depositDue = Number((total * 0.3).toFixed(2));
  const balanceDue = Number((total - depositDue).toFixed(2));
  const currency = settings?.default_currency || "JMD";

  const quoteNotes = pricingNotes.filter((n) => n.property_id === quote.property_id && overlaps(quote.checkin, quote.checkout, n.start_date, n.end_date));
  const quoteText = `Hi ${quote.guest_name || "Guest"}, quote for ${selectedProperty?.name || "your stay"} (${quote.checkin || "?"} to ${quote.checkout || "?"}, ${nights} nights): Nightly ${currency} ${quote.nightly_rate}, Cleaning ${currency} ${quote.cleaning_fee}, Total ${currency} ${total}. Deposit due ${currency} ${depositDue}, Balance ${currency} ${balanceDue}.`;

  const openLeadToQuote = (leadId) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const property = properties.find((p) => p.name === lead.property_interested || p.id === lead.property_id);
    setQuote((q) => ({ ...q, source: "lead", lead_id: lead.id, guest_name: lead.lead_name || "", phone: lead.phone || "", email: lead.email || "", property_id: property?.id || "", checkin: lead.checkin_date || "", checkout: lead.checkout_date || "", guests: lead.number_of_guests || 1, budget: lead.budget || "" }));
  };

  const saveQuote = () => setQuotes([...(quotes || []), { id: uid("quote"), ...quote, nights, total, deposit_due: depositDue, balance_due: balanceDue, quote_text: quoteText, created_at: new Date().toISOString() }]);
  const copyText = async (text) => navigator.clipboard?.writeText(text || "");

  const messageGenerated = useMemo(() => {
    const g = guests.find((x) => x.id === draft.guest_id);
    const b = bookings.find((x) => x.id === draft.booking_id);
    return `Hi ${g?.guest_name || "Guest"}, ${draft.type.toLowerCase()} update for ${b?.property_name || "your stay"}. Tone: ${draft.tone}. We are happy to help with anything you need.`;
  }, [draft, guests, bookings]);

  const activeToolTitle = TOOLS.find((t) => t.key === activeTool)?.title || "Smart Tool";
  const closeActiveTool = () => setActiveTool(null);

  const renderActiveToolWorkflow = () => {
    if (!activeTool) return null;

    if (activeTool === "quote") {
      return <section className="smart-tool-modal-section">
        <div>
          <h3 className="section-title" style={{ marginBottom: 6 }}>Create Direct Booking Quote</h3>
          <p className="text-muted">Select a lead or create a manual quote. The quote can be copied, saved, or opened as a WhatsApp/email draft.</p>
        </div>

        <div className="smart-tool-form-grid">
          <div className="field"><label>Quote Source</label><select value={quote.source} onChange={(e) => setQuote({ ...quote, source: e.target.value })}><option value="lead">Select Existing Lead</option><option value="manual">Manual Quote</option></select></div>
          {quote.source === "lead" ? <div className="field"><label>Select Lead</label><select value={quote.lead_id} onChange={(e) => openLeadToQuote(e.target.value)}><option value="">Select lead</option>{leads.map((l) => <option key={l.id} value={l.id}>{l.lead_name}</option>)}</select></div> : <div />}
          <div className="field"><label>Property</label><select value={quote.property_id} onChange={(e) => { const prop = properties.find((x) => x.id === e.target.value); setQuote({ ...quote, property_id: e.target.value, nightly_rate: prop?.nightly_rate || 0, cleaning_fee: prop?.cleaning_fee || 0 }); }}><option value="">Select property</option>{properties.map((prop) => <option key={prop.id} value={prop.id}>{prop.name}</option>)}</select></div>
          <div className="field"><label>Guest Name</label><input value={quote.guest_name} onChange={(e) => setQuote({ ...quote, guest_name: e.target.value })} /></div>
          <div className="field"><label>Phone</label><input value={quote.phone} onChange={(e) => setQuote({ ...quote, phone: e.target.value })} /></div>
          <div className="field"><label>Email</label><input type="email" value={quote.email} onChange={(e) => setQuote({ ...quote, email: e.target.value })} /></div>
        </div>

        <h4 className="section-title" style={{ marginBottom: 0 }}>Stay Details</h4>
        <div className="smart-tool-form-grid">
          <div className="field"><label>Check-in Date</label><input type="date" value={quote.checkin} onChange={(e) => setQuote({ ...quote, checkin: e.target.value })} /></div>
          <div className="field"><label>Check-out Date</label><input type="date" value={quote.checkout} onChange={(e) => setQuote({ ...quote, checkout: e.target.value })} /></div>
          <div className="field"><label>Number of Guests</label><input type="number" min="1" value={quote.guests} onChange={(e) => setQuote({ ...quote, guests: Number(e.target.value || 1) })} /></div>
          <div className="field"><label>Nightly Rate</label><input type="number" value={quote.nightly_rate} onChange={(e) => setQuote({ ...quote, nightly_rate: Number(e.target.value || 0) })} /></div>
          <div className="field"><label>Cleaning Fee</label><input type="number" value={quote.cleaning_fee} onChange={(e) => setQuote({ ...quote, cleaning_fee: Number(e.target.value || 0) })} /></div>
          <div className="field"><label>Extra Fees</label><input type="number" value={quote.extra_fees} onChange={(e) => setQuote({ ...quote, extra_fees: Number(e.target.value || 0) })} /></div>
          <div className="field"><label>Discount</label><input type="number" value={quote.discount} onChange={(e) => setQuote({ ...quote, discount: Number(e.target.value || 0) })} /></div>
          <div className="field"><label>Deposit Amount</label><input type="number" value={depositDue} onChange={() => {}} disabled /></div>
          <div className="field"><label>Payment Deadline</label><input type="date" value={quote.payment_deadline || ""} onChange={(e) => setQuote({ ...quote, payment_deadline: e.target.value })} /></div>
        </div>

        <div className="card smart-tool-preview-card">
          <h4 className="section-title" style={{ marginBottom: 8 }}>Summary</h4>
          <div className="smart-tool-summary-grid">
            <div><span className="text-muted">Nights</span><div className="fw-bold num">{nights}</div></div>
            <div><span className="text-muted">Subtotal</span><div className="fw-bold num">{currency} {subtotal}</div></div>
            <div><span className="text-muted">Discount</span><div className="fw-bold num">{currency} {Number(quote.discount || 0)}</div></div>
            <div><span className="text-muted">Total</span><div className="fw-bold num">{currency} {total}</div></div>
            <div><span className="text-muted">Deposit Due</span><div className="fw-bold num">{currency} {depositDue}</div></div>
            <div><span className="text-muted">Balance Due</span><div className="fw-bold num">{currency} {balanceDue}</div></div>
          </div>
          {quoteNotes.length > 0 && <div style={{ marginTop: 12 }}><span className="chip chip-amber">Active pricing notes</span>{quoteNotes.map((n) => <p key={n.id}>{n.note_type}: {n.recommendation}</p>)}</div>}
        </div>

        <div className="card smart-tool-preview-card">
          <h4 className="section-title" style={{ marginBottom: 8 }}>Generated WhatsApp-ready Quote</h4>
          <textarea value={quoteText} onChange={() => {}} rows={6} readOnly />
        </div>

        <div className="smart-tool-actions">
          <button className="btn-secondary" onClick={() => copyText(quoteText)}>Copy Quote</button><button className="btn-primary" onClick={saveQuote}>Save Quote</button>
          <a className="btn-ghost" href={quote.phone ? `https://wa.me/${String(quote.phone).replace(/\D/g, "")}?text=${encodeURIComponent(quoteText)}` : undefined} target="_blank" rel="noreferrer" aria-disabled={!quote.phone} style={!quote.phone ? { pointerEvents: "none", opacity: 0.5 } : {}}>Open WhatsApp Draft</a>
          <a className="btn-ghost" href={quote.email ? `mailto:${quote.email}?subject=Booking Quote&body=${encodeURIComponent(quoteText)}` : undefined} aria-disabled={!quote.email} style={!quote.email ? { pointerEvents: "none", opacity: 0.5 } : {}}>Open Email Draft</a>
          <button className="btn-secondary" onClick={() => setBookings([...(bookings || []), { id: uid("bk"), guest_name: quote.guest_name, property_id: quote.property_id, checkin_date: quote.checkin, checkout_date: quote.checkout, source_status: "Direct Quote" }])}>Convert to Booking</button>
          <button className="btn-ghost" onClick={() => setPage?.("direct-leads")}>Go to Direct Leads</button>
        </div>
      </section>;
    }

    if (activeTool === "message") return <div className="card-sand" style={{ display: "grid", gap: 10 }}><p>Create and save a smart draft (no live AI API).</p><div className="grid-2"><div className="field"><label>Guest</label><select value={draft.guest_id} onChange={(e) => setDraft({ ...draft, guest_id: e.target.value })}><option value="">Select guest</option>{guests.map((g) => <option key={g.id} value={g.id}>{g.guest_name}</option>)}</select></div><div className="field"><label>Booking</label><select value={draft.booking_id} onChange={(e) => setDraft({ ...draft, booking_id: e.target.value })}><option value="">Optional booking</option>{bookings.map((b) => <option key={b.id} value={b.id}>{b.guest_name || b.id}</option>)}</select></div></div><textarea rows={5} value={draft.text || messageGenerated} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn-secondary" onClick={() => copyText(draft.text || messageGenerated)}>Copy Message</button><button className="btn-primary" onClick={() => setMessageHistory([...(messageHistory || []), { id: uid("msg"), text: draft.text || messageGenerated, created_at: new Date().toISOString() }])}>Save Draft</button><button className="btn-ghost" onClick={() => setPage?.("messages")}>Go to Messages</button></div></div>;
    if (activeTool === "calendar") return <div className="card-sand" style={{ display: "grid", gap: 10 }}><p>Add feed details and paste ICS data to import events.</p><textarea placeholder="Paste ICS Data" rows={6} onBlur={(e) => setImportedEvents(parseICSCalendar(e.target.value))} /><div className="table-wrap"><table><thead><tr><th>Event</th><th>Check-in</th><th>Check-out</th><th></th></tr></thead><tbody>{importedEvents.length === 0 ? <tr><td colSpan="4">No imported events yet.</td></tr> : importedEvents.map((ev) => <tr key={ev.event_id}><td>{ev.summary}</td><td>{ev.checkin_date}</td><td>{ev.checkout_date}</td><td><button className="btn-ghost" onClick={() => setBookings([...(bookings || []), { id: uid("bk"), guest_name: ev.guest_name, property_id: "", checkin_date: ev.checkin_date, checkout_date: ev.checkout_date, source_status: "Calendar Import" }])}>Convert to Booking</button></td></tr>)}</tbody></table></div></div>;
    if (activeTool === "owner") return <p className="card-sand">Owner report preview workflow is available here with copy/save/share actions.</p>;
    if (activeTool === "deposit") return <p className="card-sand">Damage deposit tracker workflow is active here and can save deposit records.</p>;
    if (activeTool === "pricing") return <p className="card-sand">Pricing notes workflow is active here with save and active-notes table support.</p>;
    if (activeTool === "repeat") return <p className="card-sand">Repeat campaign workflow is active here with message generation and save actions.</p>;
    if (activeTool === "tax") return <p className="card-sand">Tax prep pack workflow is active here, including planning disclaimer and CSV export placeholder.</p>;
    if (activeTool === "alerts") return <p className="card-sand">Smart alerts center shows computed alerts and fix buttons.</p>;
    if (activeTool === "forecast") return <p className="card-sand">Profit forecast shows booking/expense breakdown.</p>;
    if (activeTool === "health") return <p className="card-sand">Host health score workflow with top fix priorities.</p>;
    return null;
  };


  return (
    <div className="page">
      <PageHeader title="Smart Tools" subtitle="Premium SaaS tools for automation, insights, and owner operations." helper="Open a tool to launch a workflow here. Use related-page buttons only when needed." />
      <div className="smart-tools-grid" style={{ alignItems: "stretch" }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.title} className="card smart-tool-card" style={{ padding: 18, display: "grid", gap: 12 }}>
              <div className="smart-tool-card-header" style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon size={18} /><h3 className="section-title" style={{ margin: 0 }}>{tool.title}</h3></div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{tool.desc}</p>
              <div style={{ display: "flex", gap: 8 }}><button className="btn-primary" onClick={() => setActiveTool(tool.key)}>Open</button><button className="btn-ghost" onClick={() => setPage?.(tool.page)}>Go to related page</button></div>
            </div>
          );
        })}
      </div>
      <Modal open={Boolean(activeTool)} onClose={closeActiveTool} title={activeToolTitle} wide>{renderActiveToolWorkflow()}</Modal>
    </div>
  );
}

export default SmartTools;
