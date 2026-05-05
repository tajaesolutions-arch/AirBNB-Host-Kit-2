import { AlertTriangle, CheckCircle2, Clock3, Wrench } from 'lucide-react';
import { maintenanceQueue } from '../../data/dashboardData.js';
import { DashboardLayout, DataTable, Header, MetricCard, StatusBadge } from '../../components/dashboard/ui.jsx';

export default function MaintenanceDashboard(){
  const columns=[{key:'i',label:'Issue'},{key:'p',label:'Property'},{key:'a',label:'Area'},{key:'pr',label:'Priority'},{key:'st',label:'Status'},{key:'rb',label:'Reported By'},{key:'as',label:'Assigned To'},{key:'d',label:'Due Date'},{key:'ac',label:'Action',align:'right'}];
  const rows=maintenanceQueue.map(r=>({i:r[0],p:r[1],a:r[2],pr:<StatusBadge tone='amber'>{r[3]}</StatusBadge>,st:<StatusBadge>{r[4]}</StatusBadge>,rb:r[5],as:r[6],d:r[7],ac:<button className='btn'>{r[8]}</button>}));
  return <DashboardLayout sidebar={<><h3>Host Kit</h3><nav>{['Maintenance Dashboard','Work Orders','Urgent Issues','Properties','Vendors','Costs','Reports','Settings'].map((n,i)=><button key={n} className={i===0?'active':''}>{n}</button>)}</nav></>}><div className='page'>
    <Header title='Maintenance Dashboard' subtitle='Track urgent repairs, work orders, costs, and completion status' controls={[<div className='search-suggest' key='s'><input placeholder='Search work orders...'/></div>,<button className='btn' key='p'>All Priorities</button>,<button className='btn' key='d'>May 1 – May 7, 2025</button>]} user='Carlos Martinez · Maintenance Crew' />
    <section className='kpi-grid five'>{[['Open Work Orders',12,'Needs attention',Wrench],['Urgent Issues',3,'Require immediate action',AlertTriangle],['In Progress',5,'Currently being worked on',Clock3],['Overdue Repairs',2,'Past due date',AlertTriangle],['Completed This Month',18,'Great job this month!',CheckCircle2]].map(k=><MetricCard key={k[0]} title={k[0]} value={k[1]} subtitle={k[2]} icon={k[3]} trend='' />)}</section>
    <article className='hk-card'><h3>Priority Work Queue</h3><DataTable columns={columns} rows={rows} /></article>
  </div></DashboardLayout>
}
