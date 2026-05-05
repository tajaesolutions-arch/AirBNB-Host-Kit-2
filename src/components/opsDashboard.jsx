import { Bell, ChevronDown, Search } from 'lucide-react';

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  let tone = 'gray';
  if (/(on track|completed|guest ready|up to date|ok|excellent|very good|good)/.test(s)) tone = 'green';
  else if (/(due soon|review|pending|medium|today|fair|needs refill)/.test(s)) tone = 'orange';
  else if (/(overdue|urgent|critical|missing|issue found|needs attention|low)/.test(s)) tone = 'red';
  else if (/(in progress|assigned|open)/.test(s)) tone = 'blue';
  else if (/(ready for inspection|waiting on parts)/.test(s)) tone = 'purple';
  return <span className={`status-badge ${tone}`}>{status}</span>;
}

export function KpiCard({ label, value, subtitle, trend, icon: Icon, tone='blue' }) {
  return <article className="ops-card kpi-card"><div><p className="kpi-label">{label}</p><h3>{value}</h3><p className="kpi-sub">{subtitle}</p></div><div className={`kpi-icon ${tone}`}>{Icon ? <Icon size={16} /> : null}</div><p className="kpi-trend">{trend}</p></article>;
}

export function DashboardHeader({ title, subtitle, controls, userName, userRole, notificationCount=0, searchPlaceholder='Search...' }) {
  return <header className="ops-header"><div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div><div className="ops-header-right"><label className="search-wrap"><Search size={14} /><input aria-label="Search" placeholder={searchPlaceholder} /></label>{controls?.map((c) => <button key={c} type="button" className="btn-filter">{c}<ChevronDown size={14} /></button>)}<button type="button" className="icon-btn" aria-label="Notifications"><Bell size={16} />{notificationCount ? <span className="notif">{notificationCount}</span> : null}</button><div className="user-chip"><div className="avatar" /> <div><strong>{userName}</strong><span>{userRole}</span></div></div></div></header>;
}

export function DataTable({ columns, rows }) {
  return <div className="table-scroll"><table className="ops-table"><thead><tr>{columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'align-r' : ''}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c.key} className={c.align === 'right' ? 'align-r' : ''}>{r[c.key]}</td>)}</tr>)}</tbody></table></div>;
}
