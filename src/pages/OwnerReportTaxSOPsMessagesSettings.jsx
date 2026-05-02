// ============================================================
//  OWNER REPORT PAGE
// ============================================================
import { useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { PageHeader, Disclaimer, Modal, ConfirmBar } from "../components/index.jsx";
import { bookingTotal, calcNights, fmtCurrency, fmtPct, fmtDateShort, inSelectedMonth, daysInMonth, uid as uidHelper, todayISO } from "../utils/helpers.js";
import { Copy, CheckCircle2, Plus, Trash2, Download, Upload } from "lucide-react";

export function OwnerReport({ monthFilter }) {
  const { properties, bookings, expenses, maintenance, cleaning, settings } = useApp();
  const [selectedProp, setSelectedProp] = useState(properties[0]?.property_id || "");
  const [reportMonth, setReportMonth] = useState(monthFilter);
  const [extraNotes, setExtraNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const cur = settings.default_currency;

  const prop = properties.find(p => p.property_id === selectedProp);
  const propBookings = bookings.filter(b => b.property_id === selectedProp && b.booking_status !== "Cancelled" && (inSelectedMonth(b.checkin_date, reportMonth) || inSelectedMonth(b.checkout_date, reportMonth)));
  const propExpenses = expenses.filter(e => (e.property_id === selectedProp || !e.property_id) && inSelectedMonth(e.expense_date, reportMonth));
  const propMaint = maintenance.filter(m => m.property_id === selectedProp);
  const propCleaning = cleaning.filter(c => c.property_id === selectedProp && inSelectedMonth(c.checkout_date, reportMonth));

  const grossRevenue = propBookings.reduce((s, b) => s + bookingTotal(b), 0);
  const airbnbRev = propBookings.filter(b => b.platform === "Airbnb").reduce((s, b) => s + bookingTotal(b), 0);
  const directRev = propBookings.filter(b => ["Direct","WhatsApp","Instagram","Google","Referral"].includes(b.platform)).reduce((s, b) => s + bookingTotal(b), 0);
  const cleaningCost = propExpenses.filter(e => e.category === "Cleaning").reduce((s, e) => s + Number(e.amount || 0), 0);
  const utilityCost = propExpenses.filter(e => ["JPS","NWC","Internet","Utilities"].includes(e.category)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const repairsCost = propExpenses.filter(e => ["Repairs","Maintenance"].includes(e.category)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const suppliesCost = propExpenses.filter(e => ["Supplies","Linen","Guest Amenity"].includes(e.category)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const otherCost = propExpenses.filter(e => !["Cleaning","JPS","NWC","Internet","Utilities","Repairs","Maintenance","Supplies","Linen","Guest Amenity"].includes(e.category)).reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalExpenses = cleaningCost + utilityCost + repairsCost + suppliesCost + otherCost;
  const managementFee = grossRevenue * Number(settings.management_fee_percentage || 0);
  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);
  const ownerPayout = grossRevenue - totalExpenses - managementFee - taxReserve;
  const bookedNights = propBookings.reduce((s, b) => s + calcNights(b.checkin_date, b.checkout_date), 0);
  const occupancy = bookedNights / daysInMonth(reportMonth);
  const avgNightly = bookedNights > 0 ? propBookings.reduce((s, b) => s + (Number(b.nightly_rate) || 0) * calcNights(b.checkin_date, b.checkout_date), 0) / bookedNights : 0;
  const openMaint = propMaint.filter(m => m.status !== "Completed" && m.status !== "Cancelled");
  const completedMaint = propMaint.filter(m => m.status === "Completed" && inSelectedMonth(m.completion_date, reportMonth));

  const reportText = `MONTHLY OWNER REPORT
${prop?.property_name || ""} — ${prop?.parish_town || ""}
Period: ${reportMonth}
Prepared by: ${settings.business_name || settings.host_name}
Date: ${new Date().toLocaleDateString("en-JM")}

═══════════════════════════════════
REVENUE SUMMARY
═══════════════════════════════════
Gross revenue:        ${fmtCurrency(grossRevenue, cur)}
Airbnb revenue:       ${fmtCurrency(airbnbRev, cur)}
Direct booking:       ${fmtCurrency(directRev, cur)}
Total bookings:       ${propBookings.length}
Booked nights:        ${bookedNights}
Occupancy:            ${fmtPct(occupancy)}
Avg nightly rate:     ${fmtCurrency(avgNightly, cur)}

═══════════════════════════════════
EXPENSES
═══════════════════════════════════
Cleaning:             ${fmtCurrency(cleaningCost, cur)}
Utilities:            ${fmtCurrency(utilityCost, cur)}
Repairs:              ${fmtCurrency(repairsCost, cur)}
Supplies:             ${fmtCurrency(suppliesCost, cur)}
Other:                ${fmtCurrency(otherCost, cur)}
Total expenses:       ${fmtCurrency(totalExpenses, cur)}

═══════════════════════════════════
OWNER PAYOUT (ESTIMATED)
═══════════════════════════════════
Gross revenue:        ${fmtCurrency(grossRevenue, cur)}
Less expenses:       −${fmtCurrency(totalExpenses, cur)}
Less mgmt fee:       −${fmtCurrency(managementFee, cur)} (${fmtPct(settings.management_fee_percentage)})
Less tax reserve:    −${fmtCurrency(taxReserve, cur)} (${fmtPct(settings.tax_reserve_percentage)})
─────────────────────────────────
Est. owner payout:    ${fmtCurrency(ownerPayout, cur)}

═══════════════════════════════════
MAINTENANCE
═══════════════════════════════════
Open issues: ${openMaint.length}
${openMaint.map(m => `  • ${m.issue_title} (${m.priority}) — ${m.status}`).join("\n") || "  None"}

Completed this month: ${completedMaint.length}
${completedMaint.map(m => `  • ${m.issue_title} — ${fmtCurrency(m.actual_cost, cur)}`).join("\n") || "  None"}

═══════════════════════════════════
CLEANING
═══════════════════════════════════
Turnovers completed:  ${propCleaning.filter(c => c.cleaning_status === "Completed").length}
Turnovers scheduled:  ${propCleaning.filter(c => c.cleaning_status === "Scheduled").length}

═══════════════════════════════════
NOTES
═══════════════════════════════════
${extraNotes || "(None)"}

── End of Report ──`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page">
      <PageHeader title="Owner Report" subtitle="Generate a clean monthly summary for the property owner."
        helper="If you manage a property for someone else — especially diaspora owners — this gives them a clear monthly summary of income, costs, repairs, and payout." />
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <h3 className="section-title">Report Settings</h3>
            <div className="field"><label className="field-label">Property</label>
              <select value={selectedProp} onChange={e => setSelectedProp(e.target.value)}>{properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}</select>
            </div>
            <div className="field"><label className="field-label">Report Month</label><input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} /></div>
            <div className="field"><label className="field-label">Notes / Recommendations</label><textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)} rows={4} placeholder="Recommended actions for next month..." /></div>
            <button className="btn-primary" style={{ width: "100%" }} onClick={handleCopy}>
              {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy Report to Clipboard</>}
            </button>
          </div>
          {/* Summary cards */}
          <div className="card" style={{ padding: 18 }}>
            <h3 className="section-title">Payout Summary</h3>
            {[
              ["Gross Revenue", fmtCurrency(grossRevenue, cur), "fw-bold"],
              ["Occupancy", fmtPct(occupancy), ""],
              ["Total Expenses", `−${fmtCurrency(totalExpenses, cur)}`, ""],
              ["Mgmt Fee", `−${fmtCurrency(managementFee, cur)}`, ""],
              ["Tax Reserve", `−${fmtCurrency(taxReserve, cur)}`, ""],
            ].map(([label, val, cls]) => (
              <div key={label} className="profit-row">
                <span className="profit-label">{label}</span>
                <span className={`profit-value ${cls}`}>{val}</span>
              </div>
            ))}
            <div className="profit-row total">
              <span style={{ color: "var(--teal)", fontWeight: 700 }}>Est. Owner Payout</span>
              <span className="profit-value teal">{fmtCurrency(ownerPayout, cur)}</span>
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>Report Preview</h3>
            <button className="btn-ghost" onClick={handleCopy}><Copy size={13} /> {copied ? "Copied!" : "Copy"}</button>
          </div>
          <div className="report-preview">{reportText}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAX RESERVE PAGE
// ============================================================
export function TaxReserve({ monthFilter }) {
  const { settings, setSettings, bookings } = useApp();
  const [rate, setRate] = useState(() => Number(settings.tax_reserve_percentage ?? 0));
  const [notes, setNotes] = useState("");
  const cur = settings.default_currency;

  const months = [...Array(12)].map((_, i) => {
    const d = new Date(monthFilter + "-01");
    d.setMonth(d.getMonth() - 11 + i);
    return d.toISOString().slice(0, 7);
  });

  const checklist = [
    "Export monthly bookings summary from Airbnb",
    "Export platform payout statement",
    "Compile direct booking income records",
    "Collect all expense receipts for the period",
    "Prepare summary of cleaning staff payments",
    "Gather maintenance vendor invoices",
    "Print or export bank statements",
    "Confirm tax reserve amount with accountant",
    "Book appointment with Jamaican accountant",
    "Submit all documents to accountant",
    "Confirm filing is complete",
  ];
  const [checked, setChecked] = useState(() => checklist.map(() => false));
  const toggle = i => setChecked(c => { const n = [...c]; n[i] = !n[i]; return n; });

  return (
    <div className="page">
      <PageHeader title="Tax / GCT Reserve Tracker" subtitle="Set aside money from rental revenue for possible tax obligations."
        helper={`Currently reserving ${(rate * 100).toFixed(1)}% of gross revenue. Edit the percentage in Settings → Tax Reserve %.`} />
      <Disclaimer text="This tool is for planning and organisation only. It is NOT legal, accounting, or tax advice. Tax rules may change and obligations vary by host, property, platform, and business structure. Confirm requirements with a qualified Jamaican accountant or tax professional." />

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <h3 className="section-title">Reserve Percentage</h3>
            <div className="field">
              <label className="field-label">Tax Reserve % (editable planning estimate)</label>
              <input type="number" min={0} max={100} step={0.5} value={(rate * 100).toFixed(1)}
                onChange={e => { const v = Number(e.target.value) / 100; setRate(v); setSettings({ ...settings, tax_reserve_percentage: v }); }}
              />
              <p className="field-helper">This percentage applies to gross booking revenue. It is a planning estimate only.</p>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 className="section-title">Monthly Revenue & Reserve</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Month</th><th className="td-right">Bookings Revenue</th><th className="td-right">Est. Reserve</th></tr></thead>
                <tbody>
                  {months.map(m => {
                    const mb = bookings.filter(b => b.booking_status !== "Cancelled" && (inSelectedMonth(b.checkin_date, m) || inSelectedMonth(b.checkout_date, m)));
                    const rev = mb.reduce((s, b) => s + bookingTotal(b), 0);
                    const res = rev * rate;
                    return (
                      <tr key={m}>
                        <td className="num">{m}</td>
                        <td className="td-right num">{fmtCurrency(rev, cur)}</td>
                        <td className="td-right num" style={{ color: "var(--amber)", fontWeight: 600 }}>{fmtCurrency(res, cur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Accountant Handoff Checklist</h3>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>Use this list when preparing documents for your accountant or tax professional.</p>
          <div className="sop-items" style={{ border: "none" }}>
            {checklist.map((item, i) => (
              <div key={i} className={`sop-item ${checked[i] ? "checked" : ""}`} onClick={() => toggle(i)}>
                <div className={`sop-checkbox ${checked[i] ? "checked" : ""}`}>
                  {checked[i] && <CheckCircle2 size={13} color="#fff" />}
                </div>
                <span className="sop-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SOP CHECKLISTS PAGE
// ============================================================
export function SOPs() {
  const SOPS = [
    { title: "1. New Booking Checklist", items: ["Send booking confirmation message to guest","Add booking to Booking Calendar","Add guest to Guest CRM","Create cleaning task for checkout date","Check supplies stock — reorder if needed","Block calendar on other platforms","Confirm payment status","Set 48-hour pre-arrival reminder"] },
    { title: "2. Pre-Arrival Checklist (48h before)", items: ["Confirm arrival time and number of guests","Send check-in instructions message","Confirm cleaner is scheduled and briefed","Check all supplies are stocked","Confirm lockbox / key handover method","Test Wi-Fi password is working","Test AC, fans, hot water, lights","Confirm pool is clean (if applicable)","Ensure welcome basket / amenities are ready","Print or post house rules if needed"] },
    { title: "3. Check-In Day Checklist", items: ["Confirm guest arrived and has access","Send welcome message (Wi-Fi, parking, house rules)","Update booking status to Checked In","Note any special guest requests","Confirm payment received if not pre-paid"] },
    { title: "4. Checkout Checklist", items: ["Send checkout reminder message night before","Confirm checkout time with guest","Receive keys / lockbox access back","Update booking status to Checked Out","Schedule cleaning task","Send review request message to guest","Add guest to direct booking follow-up list"] },
    { title: "5. Cleaning Turnover Checklist", items: ["Remove all guest belongings and rubbish","Strip all linens — wash and dry","Clean all bathrooms (toilets, sinks, shower, mirrors)","Mop and sweep all floors","Clean kitchen — fridge, stovetop, counters, microwave","Replace fresh towels and linens","Restock bathroom supplies (soap, tissue, shampoo)","Restock kitchen supplies (coffee, tea, water, condiments)","Empty all rubbish bins — replace bags","Wipe all surfaces and dust","Check for damage or missing items","Test all appliances — AC, TV, Wi-Fi, hot water","Take property photos after cleaning","Update Cleaning Schedule — mark Completed"] },
    { title: "6. Damage Inspection Checklist", items: ["Take clear photos of all areas","Record date, time, and booking ID","Describe the damage clearly","Estimate repair or replacement cost","Contact vendor if repair is needed","Notify guest politely if appropriate","Escalate through booking platform if needed","Add issue to Maintenance Tracker","Update Owner Report if needed"] },
    { title: "7. Monthly Maintenance Checklist", items: ["Test smoke detectors","Check AC filters — clean if needed","Inspect plumbing for drips or leaks","Check all light bulbs — replace as needed","Inspect doors and windows — locks working?","Check pool equipment and chemical levels","Review pest control schedule","Inspect outdoor areas — gutters, garden, fence","Review supplies inventory — reorder as needed","Review Maintenance Tracker — follow up on open issues"] },
    { title: "8. Monthly Owner Report Checklist", items: ["Total up revenue from Bookings for the month","Total up all expenses from Revenue & Profit","Calculate management fee","Calculate tax reserve amount","List all open maintenance issues","Note any cleaning or inspection findings","Fill in Owner Report template","Send report to owner by end of month","Archive a copy of the report"] },
    { title: "9. Tax Document Handoff Checklist", items: ["Compile annual gross revenue from Airbnb","Compile direct booking income records","Collect all expense receipts for the year","Prepare summary of cleaning staff payments","Gather maintenance vendor invoices","Print or export bank statements","Complete Tax Reserve tracker annual summary","Book appointment with Jamaican accountant","Submit all documents to accountant","Confirm tax filing is complete"] },
  ];

  const [open, setOpen] = useState({});
  const [checked, setChecked] = useState(() => {
    const init = {};
    SOPS.forEach((s, si) => s.items.forEach((_, ii) => { init[`${si}-${ii}`] = false; }));
    return init;
  });
  const toggle = key => setChecked(c => ({ ...c, [key]: !c[key] }));
  const toggleSection = i => setOpen(o => ({ ...o, [i]: !o[i] }));
  const resetSection = i => {
    setChecked(c => {
      const n = { ...c };
      SOPS[i].items.forEach((_, ii) => { n[`${i}-${ii}`] = false; });
      return n;
    });
  };

  return (
    <div className="page">
      <PageHeader title="SOP Checklist Library" subtitle="9 standard operating procedures for every part of your hosting operation."
        helper="Click any checklist item to mark it done. Click the section title to expand/collapse. Use the Reset button to start a fresh checklist for a new booking." />
      {SOPS.map((sop, si) => (
        <div key={si} className="sop-section">
          <div className="sop-section-title" onClick={() => toggleSection(si)}>
            <span style={{ flex: 1 }}>{sop.title}</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {sop.items.filter((_, ii) => checked[`${si}-${ii}`]).length}/{sop.items.length}
            </span>
            <button onClick={e => { e.stopPropagation(); resetSection(si); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, color: "rgba(255,255,255,0.8)", fontSize: 11, padding: "2px 8px", cursor: "pointer", marginLeft: 8 }}>Reset</button>
            <span style={{ marginLeft: 8 }}>{open[si] ? "▲" : "▼"}</span>
          </div>
          {open[si] !== false && (
            <div className="sop-items">
              {sop.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                return (
                  <div key={ii} className={`sop-item ${checked[key] ? "checked" : ""}`} onClick={() => toggle(key)}>
                    <div className={`sop-checkbox ${checked[key] ? "checked" : ""}`}>
                      {checked[key] && <CheckCircle2 size={13} color="#fff" />}
                    </div>
                    <span className="sop-text">{item}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
//  MESSAGE TEMPLATES PAGE
// ============================================================
const TEMPLATES = [
  { id: "booking-confirm", cat: "Pre-Stay", title: "Booking Confirmation", body: "Hi {{guest_name}}, thanks for booking {{property_name}}!\n\nYour stay is confirmed:\n• Check-in: {{checkin_date}} at {{checkin_time}}\n• Checkout: {{checkout_date}} at {{checkout_time}}\n\nI'll send your full check-in instructions 48 hours before arrival. Feel free to message me with any questions.\n\nLooking forward to hosting you! 🇯🇲\n{{host_name}}" },
  { id: "pre-arrival", cat: "Pre-Stay", title: "Pre-Arrival Message", body: "Hi {{guest_name}}, we're looking forward to hosting you at {{property_name}}!\n\nHere are your arrival details:\n📍 Address: {{property_address}}\n🕒 Check-in: {{checkin_date}} at {{checkin_time}}\n\nPlease let me know your estimated arrival time so we can make sure everything is ready." },
  { id: "checkin-instructions", cat: "Pre-Stay", title: "Check-in Instructions", body: "Hi {{guest_name}}, here are your check-in instructions for {{property_name}}.\n\n📍 Address: {{property_address}}\n🕒 Check-in time: {{checkin_time}}\n🔑 Access: [Insert lockbox/smart lock/key instructions here]\n\n📶 Wi-Fi:\nNetwork: {{wifi_name}}\nPassword: {{wifi_password}}\n\n📞 Host: {{host_name}} — {{phone_number}}\n\nPlease message me once you've checked in safely. Enjoy your stay! 🌴" },
  { id: "mid-stay", cat: "During Stay", title: "Mid-Stay Check-in", body: "Hi {{guest_name}}, just checking in to make sure everything is going well at {{property_name}}!\n\nIs the Wi-Fi, AC, hot water, and everything else working comfortably?\n\nLet me know if there's anything I can help with. Enjoy Jamaica! 🌊" },
  { id: "checkout-reminder", cat: "Checkout", title: "Checkout Reminder", body: "Hi {{guest_name}}, just a friendly reminder that checkout at {{property_name}} is tomorrow at {{checkout_time}}.\n\nBefore you leave:\n✅ Leave keys in {{key_return_location}}\n✅ Close all windows and lock all doors\n✅ Turn off the AC and all lights\n✅ Collect all your belongings\n\nThank you for staying with us! Safe travels home. 🙏" },
  { id: "review-request", cat: "Post-Stay", title: "Review Request", body: "Hi {{guest_name}}, thank you so much for staying at {{property_name}} — we hope you had an amazing time in Jamaica! 🇯🇲\n\nIf you have a moment, we'd really appreciate a review on Airbnb. It takes less than 2 minutes and helps future guests find us.\n\nFor your next visit, ask me about booking direct — no platform fees means a better rate for you.\n\nWarm regards,\n{{host_name}}" },
  { id: "direct-invite", cat: "Post-Stay", title: "Direct Booking Invite", body: "Hi {{guest_name}}, it was such a pleasure hosting you at {{property_name}}!\n\nFor your next visit to Jamaica, you can book directly with me — no Airbnb fees, which means a better rate for you and a better deal for both of us.\n\nJust WhatsApp me at {{phone_number}} or email {{host_email}} to check availability.\n\nWe'd love to have you back! 🌴" },
  { id: "inquiry-reply", cat: "Direct Booking", title: "Direct Booking Inquiry Reply", body: "Hi {{guest_name}}, thank you for reaching out about {{property_name}}!\n\n{{property_name}} is available for your requested dates: {{dates_requested}}.\n\nHere's a quick summary:\n🏡 Property: {{property_name}}\n📍 Location: {{location}}\n🛏 Sleeps: {{max_guests}} guests\n💰 Rate: {{rate}} per night (direct booking)\n🧹 Cleaning fee: {{cleaning_fee}}\n\nYour estimated total: {{total_estimate}}\n\nTo confirm, I'll need a deposit to hold the dates. Let me know if you'd like to proceed! 🙂" },
  { id: "quote-followup", cat: "Direct Booking", title: "Quote Follow-up", body: "Hi {{guest_name}}, just following up on the quote I sent for {{property_name}} for {{dates_requested}}.\n\nAre you still interested? The dates are still available, but I want to make sure I don't miss you.\n\nFeel free to reply here or WhatsApp me at {{phone_number}}.\n\nLooking forward to hearing from you! 😊" },
  { id: "payment-request", cat: "Direct Booking", title: "Payment / Deposit Request", body: "Hi {{guest_name}}, great news — your booking for {{property_name}} is almost confirmed!\n\nTo secure your dates ({{checkin_date}} to {{checkout_date}}), please send the deposit via:\n\n[Insert payment instructions here]\n\nOnce payment is received, I'll send your full confirmation and check-in details.\n\nThank you! 🙏" },
  { id: "maintenance-update", cat: "Issues", title: "Maintenance / Issue Update", body: "Hi {{guest_name}}, thank you for letting me know about the issue at {{property_name}}.\n\nI've arranged for [vendor] to attend to [issue] on [date]. I apologise for the inconvenience and appreciate your patience.\n\nPlease don't hesitate to reach out if you need anything else." },
  { id: "damage-claim", cat: "Issues", title: "Damage Claim Notice", body: "Hi {{guest_name}}, I'm reaching out regarding an issue found after checkout at {{property_name}}.\n\nDuring the post-checkout inspection, we noted: [describe damage clearly].\n\nWe've documented the issue with photos and will follow up regarding the repair/replacement cost. I wanted to notify you before proceeding.\n\nThank you for your understanding." },
  { id: "apology", cat: "Issues", title: "Service Recovery / Apology", body: "Hi {{guest_name}}, I sincerely apologise for the inconvenience you experienced at {{property_name}}.\n\nThank you for bringing this to my attention — your comfort is our priority. I'm working to resolve this immediately and will update you as soon as possible.\n\nI truly appreciate your patience." },
  { id: "owner-update", cat: "Owner", title: "Owner Quick Update", body: "Hi {{owner_name}}, here's a quick update for {{property_name}}:\n\n📊 Bookings this month: [number]\n💰 Revenue: [amount]\n🧹 Cleaning turnovers completed: [number]\n🔧 Open maintenance: [issues]\n📦 Low stock items: [items]\n\nFull monthly report coming at end of month.\n\nBest regards,\n{{manager_name}}" },
  { id: "cleaner-assign", cat: "Cleaning Staff", title: "Cleaner Assignment", body: "Hi {{cleaner_name}}, you're confirmed for a cleaning at {{property_name}}.\n\n📅 Date: {{cleaning_date}}\n🕐 From: {{start_time}}\n\nGuest checking out: {{guest_name}}\nNext guest arrives: {{next_checkin}}\n\nPlease complete:\n✅ Full turnover clean\n✅ Fresh linens and towels\n✅ Restock supplies\n✅ Damage check\n✅ Photos when done\n\nLet me know if there are any issues. Thank you! 🙏" },
  { id: "restock-request", cat: "Cleaning Staff", title: "Supplies Restock Request", body: "Hi {{cleaner_name}}, please note the following items need restocking at {{property_name}}:\n\n[List of items needed]\n\nPlease pick these up before the next cleaning on {{next_clean_date}}. Keep your receipt for reimbursement.\n\nThank you! 🙏" },
  { id: "repeat-guest", cat: "Post-Stay", title: "Repeat Guest Offer", body: "Hi {{guest_name}}, hope you've been well!\n\nWe have upcoming availability at {{property_name}}. Since you've stayed with us before, feel free to message me directly if you're planning another trip to Jamaica.\n\nI can check the calendar and send you our best available rate — and as a returning guest, we always look after you.\n\n{{host_name}} 🌴" },
];

const MSG_CATS = ["All", "Pre-Stay", "During Stay", "Checkout", "Post-Stay", "Direct Booking", "Issues", "Owner", "Cleaning Staff"];

export function Messages() {
  const [activeCat, setActiveCat] = useState("All");
  const [openId, setOpenId] = useState(null);
  const [edits, setEdits] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const visible = activeCat === "All" ? TEMPLATES : TEMPLATES.filter(t => t.cat === activeCat);

  const handleCopy = (t) => {
    const text = edits[t.id] ?? t.body;
    navigator.clipboard?.writeText(text);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="page">
      <PageHeader title="Message Templates" subtitle={`${TEMPLATES.length} ready-to-send templates for every guest interaction.`}
        helper={`Replace placeholders like {{guest_name}} and {{property_name}} with real details before sending. Click "Edit" to customise, then "Copy" to paste into Airbnb, WhatsApp, or email.`} />
      <div className="tab-row">{MSG_CATS.map(c => <button key={c} className={`tab-btn ${activeCat === c ? "active" : ""}`} onClick={() => setActiveCat(c)}>{c}</button>)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((t, i) => {
          const isOpen = openId === t.id;
          return (
            <div key={t.id} className="msg-card">
              <div className="msg-card-header" onClick={() => setOpenId(isOpen ? null : t.id)}>
                <div className="msg-card-meta">
                  <div className="msg-num">{TEMPLATES.indexOf(t) + 1}</div>
                  <div><div className="msg-title">{t.title}</div><div className="msg-cat">{t.cat}</div></div>
                </div>
                <div className="msg-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setOpenId(isOpen ? null : t.id)}>{isOpen ? "Hide" : "View"}</button>
                  <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => handleCopy(t)}>
                    <Copy size={12} /> {copiedId === t.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="msg-body-wrap">
                  <textarea className="msg-textarea" value={edits[t.id] ?? t.body} onChange={e => setEdits(p => ({ ...p, [t.id]: e.target.value }))} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Edit freely — changes are saved locally in this session.</span>
                    <button className="btn-ghost" style={{ fontSize: 11.5 }} onClick={() => setEdits(p => { const n = { ...p }; delete n[t.id]; return n; })}>Reset to original</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
//  SETTINGS PAGE
// ============================================================

export function Settings() {
  const { properties, setProperties, settings, setSettings } = useApp();
  const [editingProp, setEditingProp] = useState(null);
  const [propForm, setPropForm] = useState(null);
  const [newCleaner, setNewCleaner] = useState({ name: "", phone: "" });
  const [newVendor, setNewVendor] = useState({ name: "", category: "" });
  const updateSetting = (k, v) => setSettings(s => ({ ...s, [k]: v }));

  const startNewProp = () => { setEditingProp("new"); setPropForm({ property_name: "", parish_town: "", property_type: "Apartment", bedrooms: 2, bathrooms: 1, max_guests: 4, owner_name: "", owner_email: "", default_nightly_rate: 0, default_cleaning_fee: 0, default_checkin_time: "15:00", default_checkout_time: "11:00", wifi_name: "", wifi_password: "", address: "", notes: "", active: true }); };
  const startEditProp = p => { setEditingProp(p.property_id); setPropForm({ ...p }); };
  const saveProp = () => {
    if (!propForm?.property_name) return;
    if (editingProp === "new") setProperties([...properties, { ...propForm, property_id: uidHelper("PROP") }]);
    else setProperties(properties.map(p => p.property_id === editingProp ? propForm : p));
    setEditingProp(null); setPropForm(null);
  };
  const deleteProp = id => { setProperties(properties.filter(p => p.property_id !== id)); setEditingProp(null); setPropForm(null); };
  const addCleaner = () => { if (!newCleaner.name) return; updateSetting("cleaners", [...(settings.cleaners || []), newCleaner]); setNewCleaner({ name: "", phone: "" }); };
  const removeCleaner = i => updateSetting("cleaners", settings.cleaners.filter((_, idx) => idx !== i));
  const addVendor = () => { if (!newVendor.name) return; updateSetting("vendors", [...(settings.vendors || []), newVendor]); setNewVendor({ name: "", category: "" }); };
  const removeVendor = i => updateSetting("vendors", settings.vendors.filter((_, idx) => idx !== i));

  const SectionTitle = ({ children }) => <div style={{ padding: "14px 0 10px", fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 600, borderBottom: "2px solid var(--navy)", marginBottom: 14, color: "var(--navy)" }}>{children}</div>;

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Configure your properties, fees, and team. These settings feed into all calculations." helper="Start here before adding bookings. Set your property details, default fees, and cleaner names first." />

      {/* Business info */}
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <SectionTitle>Business Information</SectionTitle>
        <div className="form-grid-2">
          <div className="field"><label className="field-label">Business / Host Name</label><input value={settings.business_name || ""} onChange={e => updateSetting("business_name", e.target.value)} /></div>
          <div className="field"><label className="field-label">Default Currency</label><select value={settings.default_currency} onChange={e => updateSetting("default_currency", e.target.value)}>{["JMD","USD","GBP","CAD","EUR"].map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label className="field-label">Host Phone</label><input value={settings.host_phone || ""} onChange={e => updateSetting("host_phone", e.target.value)} /></div>
          <div className="field"><label className="field-label">Host Email</label><input value={settings.host_email || ""} onChange={e => updateSetting("host_email", e.target.value)} /></div>
        </div>
      </div>

      {/* Fee percentages */}
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <SectionTitle>Fee & Reserve Percentages</SectionTitle>
        <div className="form-grid-2">
          <div className="field"><label className="field-label">Platform Fee %</label><p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 6px" }}>Airbnb / Booking.com fee. Typical: 3%</p><input type="number" min={0} max={100} step={0.5} value={+(Number(settings.platform_fee_percentage || 0) * 100).toFixed(2)} onChange={e => updateSetting("platform_fee_percentage", Number(e.target.value) / 100)} /></div>
          <div className="field"><label className="field-label">Management Fee %</label><p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 6px" }}>Co-host/manager fee. Typical: 10–25%</p><input type="number" min={0} max={100} step={0.5} value={+(Number(settings.management_fee_percentage || 0) * 100).toFixed(2)} onChange={e => updateSetting("management_fee_percentage", Number(e.target.value) / 100)} /></div>
          <div className="field"><label className="field-label">Tax Reserve %</label><p style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 6px" }}>Planning reserve. Confirm with your accountant.</p><input type="number" min={0} max={100} step={0.5} value={+(Number(settings.tax_reserve_percentage || 0) * 100).toFixed(2)} onChange={e => updateSetting("tax_reserve_percentage", Number(e.target.value) / 100)} /></div>
          <div className="field"><label className="field-label">Default Check-in Time</label><input type="time" value={settings.default_checkin_time ?? ""} onChange={e => updateSetting("default_checkin_time", e.target.value)} /></div>
        </div>
      </div>

      {/* Properties */}
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionTitle style={{ margin: 0 }}>Properties</SectionTitle>
          <button className="btn-primary" onClick={startNewProp}><Plus size={14} /> Add Property</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {properties.map(p => (
            <div key={p.property_id} style={{ padding: "14px 16px", border: "1px solid var(--line)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.property_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{p.parish_town} · {p.property_type} · {p.bedrooms} BR · Sleeps {p.max_guests}</div>
              </div>
              <button className="btn-ghost" onClick={() => startEditProp(p)} style={{ fontSize: 12 }}>Edit</button>
            </div>
          ))}
          {properties.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No properties yet. Add your first property to start tracking.</p>}
        </div>
      </div>

      {/* Cleaners */}
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <SectionTitle>Cleaning Staff</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {(settings.cleaners || []).map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 8 }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>{c.phone && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.phone}</div>}</div>
              <button className="btn-ghost" onClick={() => removeCleaner(i)} style={{ color: "var(--red)" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input placeholder="Cleaner name" value={newCleaner.name} onChange={e => setNewCleaner(c => ({ ...c, name: e.target.value }))} />
          <input placeholder="Phone (optional)" value={newCleaner.phone} onChange={e => setNewCleaner(c => ({ ...c, phone: e.target.value }))} />
          <button className="btn-primary" onClick={addCleaner}><Plus size={14} /> Add</button>
        </div>
      </div>

      {/* Vendors */}
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <SectionTitle>Vendors / Service Providers</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {(settings.vendors || []).map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 8 }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{v.category}</div></div>
              <button className="btn-ghost" onClick={() => removeVendor(i)} style={{ color: "var(--red)" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input placeholder="Vendor name" value={newVendor.name} onChange={e => setNewVendor(v => ({ ...v, name: e.target.value }))} />
          <input placeholder="Category (e.g. Pool, AC)" value={newVendor.category} onChange={e => setNewVendor(v => ({ ...v, category: e.target.value }))} />
          <button className="btn-primary" onClick={addVendor}><Plus size={14} /> Add</button>
        </div>
      </div>

      {/* Backup, import, and export tools */}
      <BackupDataCard />

      {/* Reset dashboard data */}
      <ResetDashboardDataCard />

      {/* Property modal */}
      {editingProp && propForm && (
        <Modal open onClose={() => { setEditingProp(null); setPropForm(null); }} title={editingProp === "new" ? "Add Property" : "Edit Property"} wide
          footer={<>
            {editingProp !== "new" && <button className="btn-danger" onClick={() => deleteProp(editingProp)}><Trash2 size={13} /> Delete</button>}
            <div className="modal-footer-spacer" />
            <ConfirmBar onCancel={() => { setEditingProp(null); setPropForm(null); }} onSave={saveProp} saveLabel={editingProp === "new" ? "Add Property" : "Save Changes"} />
          </>}>
          <div className="form-grid-2">
            <div className="field" style={{ gridColumn: "span 2" }}><label className="field-label">Property Name *</label><input value={propForm.property_name} onChange={e => setPropForm(p => ({ ...p, property_name: e.target.value }))} placeholder="e.g. Sunset Villa Montego Bay" /></div>
            <div className="field"><label className="field-label">Parish / Town</label><input value={propForm.parish_town || ""} onChange={e => setPropForm(p => ({ ...p, parish_town: e.target.value }))} placeholder="e.g. Montego Bay, St. James" /></div>
            <div className="field"><label className="field-label">Property Type</label><select value={propForm.property_type || "Apartment"} onChange={e => setPropForm(p => ({ ...p, property_type: e.target.value }))}>{["Apartment","Villa","Condo","House","Studio","Cottage","Guesthouse","Other"].map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label className="field-label">Bedrooms</label><input type="number" min={0} value={propForm.bedrooms || 0} onChange={e => setPropForm(p => ({ ...p, bedrooms: Number(e.target.value) }))} /></div>
            <div className="field"><label className="field-label">Bathrooms</label><input type="number" min={0} step={0.5} value={propForm.bathrooms || 0} onChange={e => setPropForm(p => ({ ...p, bathrooms: Number(e.target.value) }))} /></div>
            <div className="field"><label className="field-label">Max Guests</label><input type="number" min={1} value={propForm.max_guests || 2} onChange={e => setPropForm(p => ({ ...p, max_guests: Number(e.target.value) }))} /></div>
            <div className="field"><label className="field-label">Default Nightly Rate (JMD)</label><input type="number" min={0} value={propForm.default_nightly_rate || 0} onChange={e => setPropForm(p => ({ ...p, default_nightly_rate: Number(e.target.value) }))} /></div>
            <div className="field"><label className="field-label">Default Cleaning Fee (JMD)</label><input type="number" min={0} value={propForm.default_cleaning_fee || 0} onChange={e => setPropForm(p => ({ ...p, default_cleaning_fee: Number(e.target.value) }))} /></div>
            <div className="field"><label className="field-label">Owner Name</label><input value={propForm.owner_name || ""} onChange={e => setPropForm(p => ({ ...p, owner_name: e.target.value }))} /></div>
            <div className="field"><label className="field-label">Owner Email</label><input value={propForm.owner_email || ""} onChange={e => setPropForm(p => ({ ...p, owner_email: e.target.value }))} /></div>
            <div className="field"><label className="field-label">Wi-Fi Network</label><input value={propForm.wifi_name || ""} onChange={e => setPropForm(p => ({ ...p, wifi_name: e.target.value }))} /></div>
            <div className="field"><label className="field-label">Wi-Fi Password</label><input value={propForm.wifi_password || ""} onChange={e => setPropForm(p => ({ ...p, wifi_password: e.target.value }))} /></div>
          </div>
          <div className="field"><label className="field-label">Address</label><input value={propForm.address || ""} onChange={e => setPropForm(p => ({ ...p, address: e.target.value }))} /></div>
          <div className="field"><label className="field-label">Notes</label><textarea value={propForm.notes || ""} onChange={e => setPropForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
        </Modal>
      )}
    </div>
  );
}

function BackupDataCard() {
  const { getBackupData, importBackupData } = useApp();
  const importInputRef = useRef(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");

  const handleExportBackup = () => {
    setBackupMessage("");
    setBackupError("");

    try {
      const backupData = getBackupData();
      const prettyJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([prettyJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dateStamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");

      link.href = url;
      link.download = `airbnb-host-kit-backup-${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setBackupMessage("Backup exported successfully. Keep the file somewhere safe.");
    } catch (err) {
      setBackupError(err?.message || "Could not export backup file.");
    }
  };

  const handleImportClick = () => {
    setBackupMessage("");
    setBackupError("");
    importInputRef.current?.click();
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmed = window.confirm(
      "Importing this backup will replace your current dashboard records. Continue?"
    );

    if (!confirmed) {
      event.target.value = "";
      return;
    }

    setBackupLoading(true);
    setBackupMessage("");
    setBackupError("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = importBackupData(parsed);

      setBackupMessage(
        `Backup imported successfully. Restored ${imported.properties.length} properties, ${imported.bookings.length} bookings, ${imported.guests.length} guests, ${imported.expenses.length} expenses, ${imported.supplies.length} supplies, ${imported.maintenance.length} maintenance records, and ${imported.leads.length} leads.`
      );
    } catch (err) {
      setBackupError(
        err?.message ||
          "Could not import backup. Make sure you selected a valid JSON backup file."
      );
    } finally {
      setBackupLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="card settings-reset-card">
      <div className="settings-reset-header">
        <div>
          <h2>Backup, Export & Import</h2>
          <p>
            Download a full JSON backup of this dashboard or restore a previous
            backup file. This protects users from losing browser-stored data.
          </p>
        </div>
      </div>

      {backupMessage && (
        <div className="account-alert success">
          <span>{backupMessage}</span>
        </div>
      )}

      {backupError && (
        <div className="account-alert error">
          <span>{backupError}</span>
        </div>
      )}

      <div className="settings-reset-grid">
        <div className="settings-reset-option">
          <h3>Export Backup</h3>
          <p>
            Downloads all properties, bookings, guests, cleaning tasks,
            maintenance records, supplies, expenses, leads, and settings into
            one JSON backup file.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={handleExportBackup}
            disabled={backupLoading}
          >
            <Download size={14} />
            Export Backup
          </button>
        </div>

        <div className="settings-reset-option">
          <h3>Import Backup</h3>
          <p>
            Restores a previously exported JSON backup. This replaces the
            current dashboard records with the data inside the file.
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportBackup}
            style={{ display: "none" }}
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={handleImportClick}
            disabled={backupLoading}
          >
            <Upload size={14} />
            {backupLoading ? "Importing..." : "Import Backup"}
          </button>
        </div>
      </div>

      <div className="settings-reset-warning">
        Export a backup before resetting, importing, or testing new changes.
        Browser storage is convenient, but a downloaded backup file is safer for
        real customer data.
      </div>
    </div>
  );
}

function ResetDashboardDataCard() {
  const { resetToBlankData, restoreSampleData } = useApp();
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const handleResetBlank = () => {
    const confirmed = window.confirm(
      "This will permanently clear all dashboard records and blank out the workspace for this account. Your login account will not be deleted. Continue?"
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      resetToBlankData();
      setResetMessage(
        "Your dashboard is now blank. You can start by adding your first property, booking, guest, expense, supply, maintenance item, or lead."
      );
    } catch (err) {
      setResetError(err?.message || "Could not reset account data.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetSample = () => {
    const confirmed = window.confirm(
      "This will replace your current dashboard records with sample data. Your current records will be deleted. Continue?"
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      restoreSampleData();
      setResetMessage("Sample data has been reloaded.");
    } catch (err) {
      setResetError(err?.message || "Could not reload sample data.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="card settings-reset-card">
      <div className="settings-reset-header">
        <div>
          <h2>Reset Dashboard Data</h2>
          <p>
            Start over with a blank workspace or reload the sample data for demo
            and testing purposes.
          </p>
        </div>
      </div>

      {resetMessage && (
        <div className="account-alert success">
          <span>{resetMessage}</span>
        </div>
      )}

      {resetError && (
        <div className="account-alert error">
          <span>{resetError}</span>
        </div>
      )}

      <div className="settings-reset-grid">
        <div className="settings-reset-option">
          <h3>Blank Template</h3>
          <p>
            Clears your properties, bookings, guests, expenses, supplies,
            maintenance, leads, owner reports, tax reserve records, cleaners,
            vendors, and business profile fields.
          </p>

          <button
            type="button"
            className="btn-danger"
            onClick={handleResetBlank}
            disabled={resetLoading}
          >
            {resetLoading ? "Resetting..." : "Reset to Blank Template"}
          </button>
        </div>

        <div className="settings-reset-option">
          <h3>Sample Data</h3>
          <p>
            Replaces your current records with sample Jamaica Airbnb host data so
            you can test the dashboard again.
          </p>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetSample}
            disabled={resetLoading}
          >
            {resetLoading ? "Loading..." : "Reset to Sample Data"}
          </button>
        </div>
      </div>

      <div className="settings-reset-warning">
        This only resets dashboard records for the logged-in account. It does not
        delete the user login, email, password, or Supabase authentication
        account.
      </div>
    </div>
  );
}
