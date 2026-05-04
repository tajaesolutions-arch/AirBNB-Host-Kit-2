import { useState } from "react";

export default function TeamAccess() {
  const [state, setState] = useState({ message: "" });
  return <div className="page"><h1 className="page-title">Team Access</h1><div className="card"><p>Invite and manage team members.</p><p>{state.message}</p></div></div>;
}
