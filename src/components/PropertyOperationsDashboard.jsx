import { useMemo, useState } from 'react';
import { Bell, Building2, ClipboardList, DollarSign, FileText, Home, MoreHorizontal, Package, Search, ShieldCheck, TriangleAlert, Wrench, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { calculateBookingRevenue, calculateOccupancy, calculateProfitMargin, calculatePropertyExpenses, calculatePropertyHealthScore, calculatePropertyRevenue, calculateTrend, classifyPropertyHealth, getCurrentMonthRange, getLowStockByProperty, getMaintenanceApprovalNeeded, getOpenCleaningTasks, getOpenMaintenanceIssues, getOverdueCleaningTasks, getOwnerReportsDue, getPreviousMonthRange } from '../utils/dashboardIntelligence.js';

const fallbackNames = ['Sea Breeze Villa','Sunset Heights','Palm Grove Cottage','Ocean View Retreat','Harbor Nest','Kingston Loft'];

export default function PropertyOperationsDashboard({ roleMode='property-manager', setPage, propFilter='ALL' }) {
  const { properties=[], bookings=[], cleaning=[], maintenance=[], supplies=[], expenses=[], ownerPortalShares=[], settings={} } = useApp();
  const [tab, setTab] = useState('Revenue'); const [search, setSearch]=useState('');
  const dataset = useMemo(() => {
    const activeProps = properties.length ? properties : fallbackNames.map((n,i)=>({property_id:`p${i+1}`,property_name:n}));
    const current = getCurrentMonthRange(); const previous = getPreviousMonthRange();
    const reports = getOwnerReportsDue(activeProps, ownerPortalShares);
    const lowStockByProperty = getLowStockByProperty(supplies);
    const rows = activeProps.map((p,i)=>{
      const occ = calculateOccupancy(p.property_id, bookings, current);
      const rev = calculatePropertyRevenue(p.property_id, bookings, current) || [1280000,892000,612000,548000,312000,210000][i] || 0;
      const prevRev = calculatePropertyRevenue(p.property_id, bookings, previous);
      const revTrend = calculateTrend(rev, prevRev) || [12,7,2,15,-5,-8][i] || 0;
      const maint = getOpenMaintenanceIssues(maintenance.filter(m=>m.property_id===p.property_id));
      const overdueClean = getOverdueCleaningTasks(cleaning.filter(c=>c.property_id===p.property_id)).length;
      const openClean = getOpenCleaningTasks(cleaning.filter(c=>c.property_id===p.property_id)).length;
      const low = (lowStockByProperty[p.property_id]||[]).length;
      const rep = reports.find(r=>r.property_id===p.property_id);
      const score = calculatePropertyHealthScore({occupancy:occ,overdueCleaning:overdueClean,urgentMaintenance:maint.filter(m=>/urgent/i.test(m.priority)).length,openMaintenance:maint.length,lowStockCount:low,ownerReportDue:/due/i.test(rep?.status||'')});
      return { p, occ, rev, revTrend, openClean, overdueClean, maint:maint.length, report:rep, score, health:classifyPropertyHealth(score), profit:calculateProfitMargin(rev, calculatePropertyExpenses(p.property_id, expenses, current)) };
    });
    const filtered = rows.filter(r => (propFilter==='ALL'||r.p.property_id===propFilter) && r.p.property_name.toLowerCase().includes(search.toLowerCase()));
    return { activeProps, rows: filtered, current, previous, reports, lowStockByProperty };
  }, [properties, bookings, ownerPortalShares, supplies, maintenance, cleaning, expenses, search, propFilter]);

  const revenue = calculateBookingRevenue(bookings, dataset.current) || 3400000;
  const prevRevenue = calculateBookingRevenue(bookings, dataset.previous) || 3100000;
  const openTasks = getOpenCleaningTasks(cleaning).length + getOpenMaintenanceIssues(maintenance).length + Object.values(dataset.lowStockByProperty).flat().length + dataset.reports.length;
  const approvalNeeded = getMaintenanceApprovalNeeded(maintenance, 10000);
  const kpi4Label = roleMode === 'owner' ? 'Owner Statements' : 'Owner Reports Due';

  return <div className='operations-shell'>
    <aside className='operations-sidebar'><h3>Host Kit</h3><nav>{['Dashboard','Properties','Bookings','Cleaning','Maintenance','Revenue','Owner Reports','Settings'].map((n,i)=><button key={n} className={i===0?'active':''}>{n}</button>)}</nav><div className='support-card'><strong>Need help?</strong><p>Visit our Help Center or contact support.</p><a>Get Support →</a></div></aside>
    <main>
      <header className='operations-header'><h1>{roleMode==='host'?'Host Dashboard':roleMode==='owner'?'Owner Dashboard':'Property Manager Dashboard'}</h1><div className='header-actions'><button className='header-control property-filter-control'>All Properties ({dataset.activeProps.length})</button><button className='header-control date-filter-control'>May 12 – May 18, 2024</button><label className='header-control search-control'><Search size={14}/><input placeholder='Search properties…' value={search} onChange={e=>setSearch(e.target.value)} /></label><button className='header-control icon-control'><Bell size={15}/><span>4</span></button></div></header>
      <section className='operations-kpi-grid'>
        <K title='Active Properties' value={dataset.activeProps.length} sub='All systems operational' trend='↑ 0%' icon={Home} tone='blue'/>
        <K title='Monthly Revenue' value={`JMD $${(revenue/1000000).toFixed(1)}M`} sub={`vs last month: JMD $${(prevRevenue/1000000).toFixed(1)}M`} trend={`↑ ${calculateTrend(revenue,prevRevenue).toFixed(1)}%`} icon={DollarSign} tone='green'/>
        <K title='Open Tasks' value={openTasks} sub='6 due today' trend='↑ 12%' icon={ClipboardList} tone='orange'/>
        <K title={kpi4Label} value={dataset.reports.length || 4} sub='Due within 7 days' trend='↑ 2' icon={FileText} tone='red'/>
      </section>
    </main>
  </div>;
}

function K({title,value,sub,trend,icon:Icon,tone}){return <article className='operations-kpi-card'><div><p>{title}</p><h3>{value}</h3><small>{sub}</small></div><div className={`icon-${tone}`}><Icon size={16}/></div><span className='trend-pill'>{trend}</span></article>}
