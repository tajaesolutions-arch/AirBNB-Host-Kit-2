import { AlertTriangle, CheckCircle, ClipboardList, Clock3 } from 'lucide-react';
import { cleanerQueue } from '../../data/dashboardData.js';
import { DashboardLayout, DataTable, Header, MetricCard, StatusBadge } from '../../components/dashboard/ui.jsx';

export default function CleanerDashboard(){
  const cols=[{key:'p',label:'Property'},{key:'u',label:'Unit / Room'},{key:'co',label:'Check-out'},{key:'ci',label:'Next Check-in'},{key:'w',label:'Cleaning Window'},{key:'pr',label:'Priority'},{key:'st',label:'Status'},{key:'a',label:'Action',align:'right'}];
  const rows=cleanerQueue.map(r=>({p:r[0],u:r[1],co:r[2],ci:r[3],w:r[4],pr:<StatusBadge tone='blue'>{r[5]}</StatusBadge>,st:<StatusBadge tone='green'>{r[6]}</StatusBadge>,a:<button className='btn'>{r[7]}</button>}));
  return <DashboardLayout sidebar={<><h3>Host Kit</h3><nav>{['Cleaner Dashboard','My Cleanings','Cleaning Checklist','Report Issue','Supplies','Completed Jobs','Settings'].map((n,i)=><button key={n} className={i===0?'active':''}>{n}</button>)}</nav></>}><div className='page'>
    <Header title='Cleaner Dashboard' subtitle="Today’s assigned turnovers and property readiness" controls={[<div className='search-suggest' key='s'><input placeholder='Search properties, tasks...'/></div>,<button className='btn' key='d'>May 12, 2024</button>]} user='Maria Lopez · Cleaner' />
    <section className='kpi-grid five'>{[['Today’s Cleanings',6,'6 assigned for today',ClipboardList],['Pending',3,'3 awaiting start',Clock3],['In Progress',1,'1 currently in progress',Clock3],['Completed Today',2,'2 completed so far',CheckCircle],['Issues Reported',1,'1 requires attention',AlertTriangle]].map(k=><MetricCard key={k[0]} title={k[0]} value={k[1]} subtitle={k[2]} icon={k[3]} trend='' />)}</section>
    <article className='hk-card'><h3>Today’s Cleaning Queue</h3><DataTable columns={cols} rows={rows} /></article>
  </div></DashboardLayout>
}
