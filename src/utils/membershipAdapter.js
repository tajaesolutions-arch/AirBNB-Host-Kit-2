function isMembershipLike(entry) {
  return Boolean(entry && typeof entry === "object" && (entry.property_id || entry.property_record_id));
}

export function resolveMemberships(profile) {
  if (!profile || typeof profile !== "object") return [];
  const candidates = [
    profile.memberships,
    profile.property_memberships,
    profile.propertyMemberships,
    profile.member_assignments,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.every(isMembershipLike)) return c;
  }
  return [];
}
