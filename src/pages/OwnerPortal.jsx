import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function OwnerPortal() {
  const { properties = [], bookings = [], maintenance = [] } = useApp();
  const [propertyId, setPropertyId] = useState(properties[0]?.property_id || "ALL");
  const scopedBookings = useMemo(() => bookings.filter((b) => propertyId === "ALL" || b.property_id === propertyId), [bookings, propertyId]);
  const scopedMaintenance = useMemo(() => maintenance.filter((m) => propertyId === "ALL" || m.property_id === propertyId), [maintenance, propertyId]);
  return <div className="page"><h1 className="page-title">Owner Dashboard</h1><select value={propertyId} onChange={(e)=>setPropertyId(e.target.value)}><option value="ALL">All Properties</option>{properties.map((p)=><option key={p.property_id} value={p.property_id}>{p.property_name || p.property_id}</option>)}</select><div className="card">Upcoming bookings: {scopedBookings.length}</div><div className="card">Open maintenance: {scopedMaintenance.filter((m)=>m.status!=="Resolved").length}</div></div>;
}
