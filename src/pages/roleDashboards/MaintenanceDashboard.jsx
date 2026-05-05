import { Wrench, AlertTriangle, Clock3, CheckCircle2 } from 'lucide-react';
import { DashboardHeader, DataTable, KpiCard, StatusBadge } from '../../components/opsDashboard.jsx';

const noop = (label) => () => console.info(`${label} clicked`);

export default function MaintenanceDashboard() {
  const columns = [{ key: 'issue', label: 'Issue' }, { key: 'property', label: 'Property' }, { key: 'area', label: 'Area' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'reportedBy', label: 'Reported By' }, { key: 'assignedTo', label: 'Assigned To' }, { key: 'due', label: 'Due Date' }, { key: 'action', label: 'Action', align: 'right' }];
  const rows = [
    { issue: 'AC not cooling', property: 'Ocean View Villa', area: 'Bedroom', priority: <StatusBadge status='Urgent' />, status: <StatusBadge status='Assigned' />, reportedBy: 'Host', assignedTo: 'Mike Repairs', due: 'Today', action: <button className='btn-secondary' onClick={noop('View')}>View</button> },
    { issue: 'Bathroom sink leaking', property: 'Palm Studio', area: 'Bathroom', priority: <StatusBadge status='High' />, status: <StatusBadge status='In Progress' />, reportedBy: 'Cleaner', assignedTo: 'Internal Crew', due: 'Today', action: <button className='btn-secondary' onClick={noop('Update')}>Update</button> },
    { issue: 'Front door lock issue', property: 'Blue Haven Apartment', area: 'Entry', priority: <StatusBadge status='Urgent' />, status: <StatusBadge status='Waiting on Parts' />, reportedBy: 'Guest', assignedTo: 'SecureLock JA', due: 'Tomorrow', action: <button className='btn-secondary' onClick={noop('View')}>View</button> },
    { issue: 'Wi-Fi router offline', property: 'Sunset Loft', area: 'Living Room', priority: <StatusBadge status='Medium' />, status: <StatusBadge status='Open' />, reportedBy: 'Host', assignedTo: 'Unassigned', due: 'May 7', action: <button className='btn-secondary' onClick={noop('Assign')}>Assign</button> }
  ];
  return <div className='page ops-page'><DashboardHeader title='Maintenance Dashboard' subtitle='Track urgent repairs, work orders, costs, and completion status' searchPlaceholder='Search work orders…' controls={['All Priorities', 'May 1 – May 7, 2025']} userName='Carlos Martinez' userRole='Maintenance Crew' notificationCount={8} />
    <section className='ops-kpi-grid'>{[['Open Work Orders', 12, 'Needs attention', Wrench, 'orange'], ['Urgent Issues', 3, 'Require immediate action', AlertTriangle, 'red'], ['In Progress', 5, 'Currently being worked on', Clock3, 'blue'], ['Overdue Repairs', 2, 'Past due date', AlertTriangle, 'red'], ['Completed This Month', 18, 'Great job this month!', CheckCircle2, 'green']].map(([l, v, s, i, t]) => <KpiCard key={l} label={l} value={v} subtitle={s} icon={i} tone={t} />)}</section>
    <article className='ops-card'><h3>Priority Work Queue</h3><DataTable columns={columns} rows={rows} /></article>
  </div>;
}
