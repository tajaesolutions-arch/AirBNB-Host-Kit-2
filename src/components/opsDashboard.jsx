import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Search, Settings, UserCircle, Users } from 'lucide-react';

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

export function DashboardHeader({ title, subtitle, propertyOptions = [], selectedPropertyId = 'ALL', onPropertyChange, dateOptions = [], selectedDatePreset, onDateChange, searchPlaceholder='Search...', searchValue = '', onSearchChange, suggestions = [], suggestionsOpen, onSearchKeyDown, onSuggestionSelect, notificationCount=0, userName, userRole, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchFocused(false);
    };
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const accountItems = useMemo(() => ([
    { key: 'account', label: 'Account Settings', icon: Settings },
    { key: 'profile', label: 'Profile', icon: UserCircle },
    { key: 'users', label: 'Team / Users', icon: Users },
    { key: 'signout', label: 'Sign Out', icon: LogOut },
  ]), []);

  return <header className="ops-header"><div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div><div className="ops-header-right">
    <div ref={searchRef} className="header-search">
      <label className="search-wrap"><Search size={14} /><input aria-label="Search properties" placeholder={searchPlaceholder} value={searchValue} onFocus={() => setSearchFocused(true)} onChange={(e) => onSearchChange?.(e.target.value)} onKeyDown={onSearchKeyDown} /></label>
      {(searchFocused && suggestionsOpen) ? <div className="ops-card" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20, padding: 6, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>{suggestions.length ? suggestions.map((s, i) => <button key={s.property_id} type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: i === suggestions.length - 1 ? 0 : 4 }} onClick={() => { onSuggestionSelect?.(s); setSearchFocused(false); }}>{s.property_name}</button>) : <p style={{ margin: '4px 8px', color: '#6b7280', fontSize: 12 }}>No matching properties found</p>}</div> : null}
    </div>
    <select className="btn-filter property-filter" value={selectedPropertyId} onChange={(e) => onPropertyChange?.(e.target.value)}>
      <option value="ALL">All Properties</option>
      {propertyOptions.map((p) => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}
    </select>
    <select className="btn-filter date-filter" value={selectedDatePreset} onChange={(e) => onDateChange?.(e.target.value)}>
      {dateOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <button type="button" className="icon-btn" aria-label="Notifications"><Bell size={16} />{notificationCount ? <span className="notif">{notificationCount}</span> : null}</button>
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button type="button" className="user-chip" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}><div className="avatar" /> <div><strong>{userName}</strong><span>{userRole}</span></div><ChevronDown size={14} /></button>
      {menuOpen ? <div className="ops-card" role="menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 2px 8px rgba(15,23,42,.08)', padding: 8, zIndex: 30 }}>{accountItems.map((item) => <button key={item.key} type="button" className="btn-secondary" role="menuitem" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }} onClick={() => { setMenuOpen(false); onNavigate?.(item.key); }}><item.icon size={14} />{item.label}</button>)}</div> : null}
    </div>
  </div></header>;
}

export function DataTable({ columns, rows }) {
  return <div className="table-scroll"><table className="ops-table"><thead><tr>{columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'align-r' : ''}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c.key} className={c.align === 'right' ? 'align-r' : ''}>{r[c.key]}</td>)}</tr>)}</tbody></table></div>;
}
