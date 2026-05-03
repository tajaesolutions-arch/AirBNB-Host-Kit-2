import { PageHeader } from "../components/index.jsx";
import {
  CalendarDays,
  MessageSquare,
  FileText,
  Shield,
  DollarSign,
  Repeat,
  Calculator,
  Sparkles,
} from "lucide-react";

const TOOLS = [
  { title: "Calendar Sync", desc: "iCal multi-channel sync for booking calendar.", page: "bookings", icon: CalendarDays },
  { title: "Quote Generator", desc: "Generate direct booking quotes from leads.", page: "leads", icon: DollarSign },
  { title: "AI Message Assistant", desc: "Compose AI-style guest replies and templates.", page: "messages", icon: MessageSquare },
  { title: "Owner Portal", desc: "Shareable owner report and monthly summaries.", page: "owner", icon: FileText },
  { title: "Damage Deposits", desc: "Track damage/security deposits and release status.", page: "bookings", icon: Shield },
  { title: "Pricing Notes", desc: "Dynamic pricing notes tied to calendar periods.", page: "bookings", icon: Sparkles },
  { title: "Repeat Campaigns", desc: "Repeat guest campaigns and direct follow-up queue.", page: "guests", icon: Repeat },
  { title: "Tax Prep Pack", desc: "Tax/GCT preparation pack and exports.", page: "tax", icon: Calculator },
];

export function SmartTools({ setPage }) {
  return (
    <div className="page">
      <PageHeader
        title="Smart Tools"
        subtitle="Premium SaaS tools for automation, insights, and owner operations."
        helper="Open a tool card to jump into the existing workflow page."
      />
      <div className="grid-2" style={{ alignItems: "stretch" }}>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.title} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Icon size={18} />
                <h3 className="section-title" style={{ margin: 0 }}>{tool.title}</h3>
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{tool.desc}</p>
              <div>
                <button className="btn-primary" onClick={() => setPage?.(tool.page)}>
                  Open
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SmartTools;
