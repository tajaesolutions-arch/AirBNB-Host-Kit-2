import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ClipboardCheck,
  Clock,
  Code,
  DollarSign,
  FileBarChart,
  MessageSquare,
  Rocket,
  Sparkles,
  Wrench,
} from "lucide-react";

const featureCards = [
  {
    title: "Direct Booking Quotes",
    description:
      "Create branded, shareable quotes and convert leads into bookings with ease.",
    icon: DollarSign,
  },
  {
    title: "Smart Message Assistant",
    description:
      "Generate polished messages for guests, owners, reviews, payments, and more.",
    icon: MessageSquare,
  },
  {
    title: "Cleaner Task View",
    description:
      "A mobile-friendly board that keeps your cleaning team organized and on track.",
    icon: ClipboardCheck,
  },
  {
    title: "Owner Report Export",
    description:
      "Automated monthly reports with key performance metrics ready to share.",
    icon: FileBarChart,
  },
];

export default function SmartTools({ setPage }) {
  const [notifyMessage, setNotifyMessage] = useState("");

  const handleNotifyClick = () => {
    setNotifyMessage("Notification requests will be available soon.");
  };

  return (
    <div className="page smart-tools-page">
      <section className="smart-tools-header">
        <div className="smart-tools-title-row">
          <h1 className="page-title">Smart Tools</h1>
          <span className="smart-coming-pill">
            <Clock size={14} aria-hidden="true" />
            Coming Soon
          </span>
        </div>
        <p className="page-subtitle smart-tools-subtitle">
          Advanced automation tools for Airbnb hosts are in development. We’re
          building features that save you time and grow your business.
        </p>
      </section>

      <section className="smart-hero-card card">
        <div className="smart-hero-copy">
          <span className="smart-hero-icon" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <h2>Powerful host automations are on the way</h2>
          <p>
            We’re building a suite of intelligent tools designed to automate
            your workflows, delight your guests, and help your business grow.
            Stay tuned—exciting things are coming soon.
          </p>

          <div className="smart-hero-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleNotifyClick}
              aria-label="Notify me when Smart Tools launches"
            >
              <Bell size={16} aria-hidden="true" />
              Notify Me
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPage?.("dashboard")}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Dashboard
            </button>
          </div>

          {notifyMessage && <p className="smart-notify-note">{notifyMessage}</p>}
        </div>

        <div className="smart-hero-visual" aria-hidden="true">
          <div className="smart-orbit" />
          <div className="smart-browser-mockup">
            <div className="smart-browser-top">
              <span />
              <span />
              <span />
            </div>
            <div className="smart-browser-body">
              <div className="smart-browser-line" />
              <div className="smart-browser-line short" />
              <div className="smart-browser-grid">
                <div />
                <div />
              </div>
            </div>
          </div>
          <div className="smart-doc-card">
            <FileBarChart size={16} />
          </div>
          <div className="smart-tool-tile">
            <Wrench size={24} />
          </div>
          <span className="smart-sparkle one">
            <Sparkles size={14} />
          </span>
          <span className="smart-sparkle two">
            <Sparkles size={18} />
          </span>
        </div>
      </section>

      <section className="smart-feature-grid">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="smart-feature-card card">
              <div className="smart-feature-header">
                <span className="smart-feature-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="smart-coming-pill small">Coming Soon</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="smart-feature-mockup" aria-hidden="true">
                <div className="mock-line" />
                <div className="mock-line short" />
                <div className="mock-bars">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="smart-roadmap card">
        <div className="smart-roadmap-copy">
          <span className="smart-roadmap-icon" aria-hidden="true">
            <Rocket size={18} />
          </span>
          <h3>Our Roadmap</h3>
          <p>
            We’re working hard behind the scenes to deliver tools that make
            hosting effortless.
          </p>
        </div>

        <div className="smart-roadmap-steps" aria-label="Smart tools roadmap">
          <div className="smart-roadmap-step complete">
            <span className="step-icon" aria-hidden="true">
              <Check size={16} />
            </span>
            <div>
              <h4>Design finalized</h4>
              <p>Complete</p>
            </div>
          </div>
          <div className="smart-roadmap-step in-progress">
            <span className="step-icon" aria-hidden="true">
              <Code size={16} />
            </span>
            <div>
              <h4>Core workflows in development</h4>
              <p>In progress</p>
            </div>
          </div>
          <div className="smart-roadmap-step upcoming">
            <span className="step-icon" aria-hidden="true">
              <Rocket size={16} />
            </span>
            <div>
              <h4>Launching soon</h4>
              <p>Stay tuned!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
