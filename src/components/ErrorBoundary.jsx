import React from "react";

function isDev() {
  try {
    return Boolean(import.meta?.env?.DEV);
  } catch {
    return false;
  }
}

function clearHostKitLocalData() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("jak_") || key === "hostSidebarCollapsed") {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage issues and continue reload.
  }

  window.location.reload();
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard render crash:", error, errorInfo?.componentStack || "");
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="page">
        <div className="card" style={{ padding: 16 }}>
          <h2>Something went wrong loading your dashboard.</h2>
          {isDev() && this.state.error?.message ? (
            <p style={{ marginTop: 8 }}><strong>Error:</strong> {this.state.error.message}</p>
          ) : null}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button type="button" className="btn-secondary" onClick={this.handleRetry}>Try again</button>
            <button type="button" className="btn-danger" onClick={clearHostKitLocalData}>Reset local app data</button>
          </div>
        </div>
      </div>
    );
  }
}
