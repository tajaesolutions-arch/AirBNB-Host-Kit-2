import { useMemo, useState } from "react";

export function useActiveWorkspace({ profile, workspaceMemberships = [] }) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => {
    try {
      return localStorage.getItem("activeWorkspaceId") || profile?.default_workspace_id || null;
    } catch {
      return profile?.default_workspace_id || null;
    }
  });

  const approvedMemberships = useMemo(
    () => workspaceMemberships.filter((m) => m?.account_status === "approved" && m?.workspace?.status !== "archived"),
    [workspaceMemberships],
  );

  const activeMembership = useMemo(() => approvedMemberships.find((m) => m.workspace_id === selectedWorkspaceId) || approvedMemberships[0] || null, [approvedMemberships, selectedWorkspaceId]);

  const switchWorkspace = (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    try { localStorage.setItem("activeWorkspaceId", workspaceId); } catch {}
  };

  return { activeWorkspaceId: activeMembership?.workspace_id || null, activeWorkspace: activeMembership?.workspace || null, activeMembership, workspaceMemberships: approvedMemberships, switchWorkspace };
}
