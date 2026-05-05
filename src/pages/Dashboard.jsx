import { useMemo, useState } from 'react';
import { ClipboardList, DollarSign, FileText, Home, LayoutList, Download } from 'lucide-react';
import { DashboardHeader, DataTable, KpiCard, StatusBadge } from '../components/opsDashboard.jsx';
import { useApp } from '../context/AppContext.jsx';

const noop = (label) => () => console.info(`${label} clicked`);
const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

const toRange = (preset) => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  if (preset === 'today') return { start, end };
  if (preset === 'last7') start.setDate(now.getDate() - 6);
  if (preset === 'last30') start.setDate(now.getDate() - 29);
  if (preset === 'thisMonth') start.setDate(1);
  if (preset === 'lastMonth') { start.setMonth(now.getMonth() - 1, 1); end.setMonth(now.getMonth(), 0); }
  if (preset === 'thisYear') { start.setMonth(0, 1); }
  return { start, end };
};

const inRange = (value, range) => {
  if (!value) return false;
  const d = new Date(value);
  return d >= new Date(range.start.toDateString()) && d <= new Date(`${range.end.toDateString()} 23:59:59`);
};

export default function Dashboard({ setPage }) {
  const { properties = [], bookings = [], cleaning = [], maintenance = [], expenses = [] } = useApp();
  const [selectedPropertyId, setSelectedPropertyId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDatePreset, setSelectedDatePreset] = useState('last30');
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const dateRange = useMemo(() => toRange(selectedDatePreset), [selectedDatePreset]);
  const propertyMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.property_id, p.property_name])), [properties]);
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return properties.filter((p) => p.property_name.toLowerCase().includes(q));
  }, [properties, searchQuery]);

  const byProperty = (items) => items.filter((item) => selectedPropertyId === 'ALL' || item.property_id === selectedPropertyId);
  const filteredBookings = useMemo(() => byProperty(bookings).filter((b) => inRange(b.checkin_date, dateRange) || inRange(b.checkout_date, dateRange)), [bookings, selectedPropertyId, dateRange]);
  const filteredCleaning = useMemo(() => byProperty(cleaning).filter((c) => inRange(c.checkout_date, dateRange) || inRange(c.time_completed, dateRange)), [cleaning, selectedPropertyId, dateRange]);
  const filteredMaintenance = useMemo(() => byProperty(maintenance).filter((m) => inRange(m.reported_date || m.created_at || m.updated_at, dateRange)), [maintenance, selectedPropertyId, dateRange]);
  const filteredExpenses = useMemo(() => byProperty(expenses).filter((e) => inRange(e.expense_date, dateRange)), [expenses, selectedPropertyId, dateRange]);

  const revenue = filteredBookings.reduce((sum, b) => sum + Number(b.nightly_rate || 0) + Number(b.cleaning_fee || 0) + Number(b.extra_fees || 0) - Number(b.discounts || 0), 0);
  const expenseTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);


  const upcomingBookings = filteredBookings
    .filter((b) => new Date(b.checkin_date) >= new Date())
    .sort((a, b) => String(a.checkin_date).localeCompare(String(b.checkin_date)))
    .slice(0, 5);
  const openMaintenanceCount = filteredMaintenance.filter((m) => String(m.status || '').toLowerCase() !== 'completed').length;
  const completionRate = filteredCleaning.length ? Math.round((filteredCleaning.filter((c) => String(c.cleaning_status).toLowerCase() === 'completed').length / filteredCleaning.length) * 100) : 0;

  const kpis = [
    ['Active Properties', String(selectedPropertyId === 'ALL' ? properties.length : 1), 'Filtered selection', '↑ 0%', Home, 'blue'],
    ['Gross Revenue', `JMD $${Math.round(revenue).toLocaleString()}`, 'Selected date period', '↑ 0%', DollarSign, 'green'],
    ['Open Tasks', String(filteredCleaning.filter((c) => c.cleaning_status !== 'Completed').length), 'Cleaning + operations', '↑ 0%', ClipboardList, 'orange'],
    ['Net Profit', `JMD $${Math.round(revenue - expenseTotal).toLocaleString()}`, 'Revenue - expenses', '↑ 0%', FileText, 'red'],
  ];

  const rows = filteredBookings.map((b) => ({
    property: propertyMap[b.property_id] || b.property_id,
    occupancy: b.booking_status || 'Booked',
    revenue: `JMD $${(Number(b.nightly_rate || 0) + Number(b.cleaning_fee || 0)).toLocaleString()}`,
    cleaning: <StatusBadge status={filteredCleaning.find((c) => c.booking_id === b.booking_id)?.cleaning_status || 'Scheduled'} />,
    maintenance: <StatusBadge status={filteredMaintenance.find((m) => m.property_id === b.property_id)?.status || 'Up to date'} />,
    owner: <StatusBadge status={b.payment_status || 'Pending'} />,
    health: `${Math.max(0, 100 - filteredMaintenance.length * 10)} / 100`,
  }));

  const onSuggestionSelect = (property) => {
    setSelectedPropertyId(property.property_id);
    setSearchQuery(property.property_name);
    setActiveSuggestionIndex(-1);
  };

  return <div className='page ops-page'>
    <DashboardHeader title='Property Manager Dashboard' subtitle='Portfolio analytics and operations health' propertyOptions={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={(id) => { setSelectedPropertyId(id); if (id === 'ALL') setSearchQuery(''); else setSearchQuery(propertyMap[id] || ''); }} dateOptions={DATE_PRESETS} selectedDatePreset={selectedDatePreset} onDateChange={setSelectedDatePreset} searchPlaceholder='Search properties…' searchValue={searchQuery} onSearchChange={(v) => { setSearchQuery(v); setActiveSuggestionIndex(0); }} suggestions={suggestions} suggestionsOpen={Boolean(searchQuery)} onSuggestionSelect={onSuggestionSelect} onSearchKeyDown={(e) => { if (!suggestions.length) return; if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestionIndex((i) => Math.max(i - 1, 0)); } if (e.key === 'Enter' && activeSuggestionIndex >= 0) { e.preventDefault(); onSuggestionSelect(suggestions[activeSuggestionIndex]); } if (e.key === 'Escape') setActiveSuggestionIndex(-1); }} userName='Mark Anderson' userRole='Property Manager' notificationCount={4} onNavigate={(k) => { if (k === 'account' || k === 'profile') setPage?.('account'); if (k === 'users') setPage?.('users-access'); }} />
    <section className='ops-kpi-grid ops-kpi-grid-4'>{kpis.map(([l, v, s, t, i, tone]) => <KpiCard key={l} label={l} value={v} subtitle={s} trend={t} icon={i} tone={tone} />)}</section>
    <section className='ops-card health-strip'><div><p>Upcoming bookings</p><strong>{upcomingBookings.length}</strong></div><div><p>Open maintenance</p><strong>{openMaintenanceCount}</strong></div><div><p>Cleaning completion</p><strong>{completionRate}%</strong></div><div><p>Alerts</p><strong>{openMaintenanceCount + filteredCleaning.filter((c) => String(c.cleaning_status || '').toLowerCase() !== 'completed').length}</strong></div></section>
    {rows.length === 0 ? <section className='ops-card'><p className='dashboard-empty'>No records found for this property and date period.</p></section> : null}
    <article className='ops-card'>
      <div className='card-head'><h3>Property Operations</h3><div className='btn-row'><button className='btn-secondary' onClick={noop('Columns')}><LayoutList size={14} />Columns</button><button className='btn-secondary' onClick={noop('Export')}><Download size={14} />Export</button></div></div>
      <DataTable columns={[{ key: 'property', label: 'Property' }, { key: 'occupancy', label: 'Occupancy' }, { key: 'revenue', label: 'Revenue', align: 'right' }, { key: 'cleaning', label: 'Open Cleaning' }, { key: 'maintenance', label: 'Maintenance' }, { key: 'owner', label: 'Owner Report' }, { key: 'health', label: 'Health Score', align: 'right' }]} rows={rows} />
    </article>
  </div>;
}
