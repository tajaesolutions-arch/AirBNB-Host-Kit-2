import React from "react";
import { Database, PlusCircle } from "lucide-react";

export default function FirstTimeSetup({ onStartFresh, onUseSampleData, loadingChoice = "", error = "" }) {
  const isLoading = Boolean(loadingChoice);

  return (
    <div className="first-setup-shell">
      <div className="first-setup-card card">
        <div className="first-setup-header">
          <p className="first-setup-kicker">First-time setup</p>
          <h1>Set up your Host Kit</h1>
          <p>Choose how you want to start managing your properties.</p>
        </div>

        {error ? <p className="first-setup-error">{error}</p> : null}

        <div className="first-setup-options">
          <section className="first-setup-option" aria-labelledby="setup-fresh-title">
            <div className="first-setup-icon" aria-hidden="true">
              <PlusCircle size={22} />
            </div>
            <h2 id="setup-fresh-title">Start Fresh</h2>
            <p>
              Begin with a blank workspace and add your own properties, bookings, guests, cleaning tasks,
              and expenses.
            </p>
            <div className="first-setup-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={isLoading}
                onClick={onStartFresh}
              >
                {loadingChoice === "fresh" ? "Setting up…" : "Start Fresh"}
              </button>
            </div>
          </section>

          <section className="first-setup-option" aria-labelledby="setup-sample-title">
            <div className="first-setup-icon teal" aria-hidden="true">
              <Database size={22} />
            </div>
            <h2 id="setup-sample-title">Use Sample Data</h2>
            <p>
              Explore every dashboard page with realistic sample properties, bookings, guests, and financial data.
            </p>
            <div className="first-setup-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={isLoading}
                onClick={onUseSampleData}
              >
                {loadingChoice === "sample" ? "Loading sample data…" : "Load Sample Data"}
              </button>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
