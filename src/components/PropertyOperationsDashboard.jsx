import { ClipboardList, DollarSign, FileText, Home } from 'lucide-react';
import { managerProperties } from '../data/dashboardData.js';
import { DashboardLayout, DataTable, DotMenu, Header, MetricCard, PropertySearchFilter, StatusBadge } from './dashboard/ui.jsx';
import { useMemo, useState } from 'react';

const fmt=(n)=>`JMD $${(n/1000000).toFixed(2)}M`;
export default function PropertyOperationsDashboard({ roleMode='property-manager' }) {
  const [selected,setSelected]=useState('ALL');
  const rows=useMemo(()=>selected==='ALL'?managerProperties:managerProperties.filter(p=>p.id===selected),[selected]);
  const roleTitle = roleMode==='owner' ? 'Owner Dashboard' : roleMode==='host' ? 'Host Dashboard' : 'Property Manager Dashboard';
  return <DashboardLayout sidebar={<><h3>Host Kit</h3><nav>{['Dashboard','Properties','Bookings','Cleaning','Maintenance','Revenue','Owner Reports','Settings'].map((n,i)=><button className={i===0?'active':''} key={n}>{n}</button>)}</nav><div className='help'>Need help? Contact support.</div></>}>
    <div className='page'>
    <Header title={roleTitle} controls={[<button className='btn' key='p'>All Properties (12)</button>,<button className='btn' key='d'>May 12 – May 18, 2024</button>,<PropertySearchFilter key='s' properties={managerProperties} onSelect={setSelected}/>]} user='Mark Anderson · Property Manager' />
    <section className='kpi-grid'>{[['Active Properties','12','All systems operational',Home,'0%'],['Monthly Revenue','JMD $3.4M','vs last month: JMD $3.1M',DollarSign,'+9.7%'],['Open Tasks','18','6 due today',ClipboardList,'+12%'],['Owner Reports Due','4','Due within 7 days',FileText,'+2']].map(k=><MetricCard key={k[0]} title={k[0]} value={k[1]} subtitle={k[2]} icon={k[3]} trend={k[4]} />)}</section>
    <article className='hk-card'><div className='row'><h3>Property Operations</h3><div><button className='btn'>Columns</button><button className='btn'>Export</button></div></div><DataTable columns={[{key:'property',label:'Property'},{key:'occupancy',label:'Occupancy'},{key:'revenue',label:'Revenue',align:'right'},{key:'cleaning',label:'Open Cleaning'},{key:'maintenance',label:'Maintenance'},{key:'owner',label:'Owner Report'},{key:'health',label:'Health Score'},{key:'actions',label:'Actions',align:'right'}]} rows={rows.map(r=>({property:r.name,occupancy:<>{r.occupancy}% <small>{r.occupancyTrend>0?'+':''}{r.occupancyTrend}%</small></>,revenue:fmt(r.revenue),cleaning:<>{r.cleaningOpen} <StatusBadge tone='green'>{r.cleaningStatus}</StatusBadge></>,maintenance:<>{r.maintenance} <StatusBadge tone='amber'>{r.maintenanceStatus}</StatusBadge></>,owner:r.ownerReport,health:<>{r.health} <StatusBadge>{r.healthLabel}</StatusBadge></>,actions:<DotMenu/>}))} /></article>
    </div></DashboardLayout>;
}
