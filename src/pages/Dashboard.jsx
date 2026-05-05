import { ClipboardList, DollarSign, FileText, Home, LayoutList, Download } from 'lucide-react';
import { DashboardHeader, DataTable, KpiCard, StatusBadge } from '../components/opsDashboard.jsx';

const noop = (label) => () => console.info(`${label} clicked`);

export default function Dashboard() {
  const kpis = [
    ['Active Properties', '12', 'All systems operational', '↑ 0%', Home, 'blue'],
    ['Monthly Revenue', 'JMD $3.4M', 'vs last month: JMD $3.1M', '↑ 9.7%', DollarSign, 'green'],
    ['Open Tasks', '18', '6 due today', '↑ 12%', ClipboardList, 'orange'],
    ['Owner Reports Due', '4', 'Due within 7 days', '↑ 2', FileText, 'red'],
  ];
  const columns = [{ key: 'property', label: 'Property' }, { key: 'occupancy', label: 'Occupancy' }, { key: 'revenue', label: 'Revenue', align: 'right' }, { key: 'cleaning', label: 'Open Cleaning' }, { key: 'maintenance', label: 'Maintenance' }, { key: 'owner', label: 'Owner Report' }, { key: 'health', label: 'Health Score', align: 'right' }];
  const rows = [
    ['Sea Breeze Villa', '78%, ↑ 8%', 'JMD $1.28M, ↑ 12%', '0, On Track', '1, Review', 'Due in 2 days', '92, Excellent'],
    ['Sunset Heights', '71%, ↑ 5%', 'JMD $892K, ↑ 7%', '1, Overdue', '0, Up to date', 'Due in 3 days', '86, Very Good'],
    ['Palm Grove Cottage', '62%, ↓ 3%', 'JMD $612K, ↑ 2%', '0, On Track', '1, Review', 'Due in 4 days', '74, Good'],
    ['Ocean View Retreat', '85%, ↑ 10%', 'JMD $548K, ↑ 15%', '1, Overdue', '2, Review', 'On Track', '68, Fair'],
    ['Harbor Nest', '53%, ↓ 7%', 'JMD $312K, ↓ 5%', '1, Today', '0, Up to date', 'Due in 6 days', '62, Fair'],
    ['Kingston Loft', '46%, ↓ 10%', 'JMD $210K, ↓ 8%', '2, Overdue', '1, Review', 'Due in 1 day', '45, Needs Attention'],
  ].map((r) => ({ property: r[0], occupancy: r[1], revenue: r[2], cleaning: <StatusBadge status={r[3]} />, maintenance: <StatusBadge status={r[4]} />, owner: <StatusBadge status={r[5]} />, health: r[6] }));

  return <div className='page ops-page'>
    <DashboardHeader title='Property Manager Dashboard' controls={['All Properties (12)', 'May 12 – May 18, 2024']} searchPlaceholder='Search properties…' userName='Mark Anderson' userRole='Property Manager' notificationCount={4} />
    <section className='ops-kpi-grid ops-kpi-grid-4'>{kpis.map(([l, v, s, t, i, tone]) => <KpiCard key={l} label={l} value={v} subtitle={s} trend={t} icon={i} tone={tone} />)}</section>
    <section className='ops-card health-strip'><div><p>Healthy Properties</p><strong>8 / 67%</strong></div><div><p>Attention Needed</p><strong>3 / 25%</strong></div><div><p>Critical Issues</p><strong>1 / 8%</strong></div><div><p>Tasks Completed</p><strong>28 This Week</strong></div></section>
    <article className='ops-card'>
      <div className='card-head'><h3>Property Operations</h3><div className='btn-row'><button className='btn-secondary' onClick={noop('Columns')}><LayoutList size={14} />Columns</button><button className='btn-secondary' onClick={noop('Export')}><Download size={14} />Export</button></div></div>
      <DataTable columns={columns} rows={rows} />
    </article>
  </div>;
}
