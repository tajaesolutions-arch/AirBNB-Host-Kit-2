import { Camera, CheckCircle, ClipboardList, AlertTriangle, Clock3 } from 'lucide-react';
import { DashboardHeader, DataTable, KpiCard, StatusBadge } from '../../components/opsDashboard.jsx';

const noop = (label) => () => console.info(`${label} clicked`);

export default function CleanerDashboard() {
  const columns = [{ key: 'property', label: 'Property' }, { key: 'unit', label: 'Unit / Room' }, { key: 'checkout', label: 'Check-out' }, { key: 'checkin', label: 'Next Check-in' }, { key: 'window', label: 'Cleaning Window' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'action', label: 'Action', align: 'right' }];
  const rows = [
    { property: 'Ocean View Villa', unit: 'Main Suite', checkout: '11:00 AM', checkin: '4:00 PM', window: '11:30 AM – 3:00 PM', priority: <StatusBadge status='Same-Day Turnover' />, status: <StatusBadge status='In Progress' />, action: <button className='btn-primary' onClick={noop('Continue')}>Continue</button> },
    { property: 'Palm Studio', unit: 'Unit 2', checkout: '10:00 AM', checkin: '3:00 PM', window: '10:30 AM – 2:30 PM', priority: <StatusBadge status='Urgent' />, status: <StatusBadge status='Not Started' />, action: <button className='btn-primary' onClick={noop('Start')}>Start</button> },
    { property: 'Blue Haven Apartment', unit: 'Unit 5B', checkout: '12:00 PM', checkin: 'Tomorrow', window: '12:30 PM – 4:00 PM', priority: <StatusBadge status='Normal' />, status: <StatusBadge status='Pending' />, action: <button className='btn-secondary' onClick={noop('View')}>View</button> }
  ];
  return <div className='page ops-page'><DashboardHeader title='Cleaner Dashboard' subtitle="Today’s assigned turnovers and property readiness" searchPlaceholder='Search properties, tasks…' controls={['May 12, 2024']} userName='Maria Lopez' userRole='Cleaner' notificationCount={2} />
    <section className='ops-kpi-grid'>{[['Today’s Cleanings', 6, '6 assigned for today', ClipboardList, 'blue'], ['Pending', 3, '3 awaiting start', Clock3, 'orange'], ['In Progress', 1, '1 currently in progress', Clock3, 'blue'], ['Completed Today', 2, '2 completed so far', CheckCircle, 'green'], ['Issues Reported', 1, '1 requires attention', AlertTriangle, 'red']].map(([l, v, s, i, t]) => <KpiCard key={l} label={l} value={v} subtitle={s} icon={i} tone={t} />)}</section>
    <section className='split'><article className='ops-card'><h3>Today’s Cleaning Queue</h3><DataTable columns={columns} rows={rows} /></article><article className='ops-card'><h3>Active Cleaning Job</h3><p><strong>Ocean View Villa</strong></p><p>Status: <StatusBadge status='Cleaning in Progress' /></p><p>Deadline: 3:00 PM</p><p>Next Check-in: 4:00 PM</p><div className='btn-row'><button className='btn-primary' onClick={noop('Ready for inspection')}>Mark Ready for Inspection</button><button className='btn-secondary' onClick={noop('Report issue')}>Report Issue</button><button className='btn-secondary' onClick={noop('Upload photos')}><Camera size={14} /> Upload Photos</button></div></article></section>
  </div>;
}
