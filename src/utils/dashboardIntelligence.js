const ONE_DAY_MS = 86400000;

export const normalizeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const isWithinRange = (date, startDate, endDate) => {
  const d = normalizeDate(date);
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  if (!d || !start || !end) return false;
  return d >= start && d <= end;
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
};
export const getPreviousMonthRange = () => {
  const now = new Date();
  return { startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1), endDate: new Date(now.getFullYear(), now.getMonth(), 0) };
};

const num = (v) => Number(v) || 0;
const openStatus = (s) => !/(completed|cancelled|resolved|guest ready)/i.test(String(s || ''));

export const calculateBookingRevenue = (bookings = [], range) => bookings.reduce((sum, b) => {
  const d = b.checkin_date || b.checkout_date || b.created_at;
  if (!isWithinRange(d, range.startDate, range.endDate)) return sum;
  return sum + num(b.total_amount) + num(b.total_price) + num(b.nightly_rate) + num(b.cleaning_fee) + num(b.extra_fees) - num(b.discounts);
}, 0);
export const calculatePropertyRevenue = (propertyId, bookings = [], range) => calculateBookingRevenue(bookings.filter((b) => b.property_id === propertyId), range);
export const calculatePropertyExpenses = (propertyId, expenses = [], range) => expenses.filter((e) => e.property_id === propertyId && isWithinRange(e.expense_date || e.created_at, range.startDate, range.endDate)).reduce((s, e) => s + num(e.amount), 0);
export const calculateOccupancy = (propertyId, bookings = [], range, totalUnits = 1) => {
  const monthDays = Math.max(1, Math.round((normalizeDate(range.endDate) - normalizeDate(range.startDate)) / ONE_DAY_MS) + 1);
  const booked = bookings.filter((b) => b.property_id === propertyId && (isWithinRange(b.checkin_date, range.startDate, range.endDate) || isWithinRange(b.checkout_date, range.startDate, range.endDate))).length;
  return Math.min(100, Math.round((booked / (monthDays * Math.max(1, totalUnits))) * 100));
};
export const calculateProfitMargin = (revenue, expenses) => (revenue <= 0 ? 0 : Math.round(((revenue - expenses) / revenue) * 100));
export const calculateTrend = (current, previous) => (previous <= 0 ? 0 : ((current - previous) / previous) * 100);
export const getOpenCleaningTasks = (cleaning = []) => cleaning.filter((c) => openStatus(c.cleaning_status || c.status));
export const getOverdueCleaningTasks = (cleaning = [], today = new Date()) => getOpenCleaningTasks(cleaning).filter((c) => normalizeDate(c.due_date || c.deadline || c.checkout_date) < normalizeDate(today));
export const getOpenMaintenanceIssues = (maintenance = []) => maintenance.filter((m) => openStatus(m.status));
export const getMaintenanceApprovalNeeded = (maintenance = [], threshold = 10000) => getOpenMaintenanceIssues(maintenance).filter((m) => /(review|approval|waiting owner approval)/i.test(String(m.status || '')) || num(m.estimated_cost) > threshold || num(m.actual_cost) > threshold);
export const getLowStockByProperty = (supplies = []) => supplies.filter((s) => num(s.current_quantity) <= num(s.reorder_level)).reduce((acc, s) => {
  const key = s.property_id || 'unknown';
  if (!acc[key]) acc[key] = [];
  acc[key].push(s);
  return acc;
}, {});

export const getOwnerReportsDue = (properties = [], ownerReports = [], today = new Date()) => {
  if (ownerReports.length) return ownerReports.map((r) => ({ property_id: r.property_id, dueDate: r.due_date || r.next_due_date, status: r.status || 'Due' }));
  return properties.map((p, i) => {
    const due = new Date(normalizeDate(today));
    due.setDate(due.getDate() + 2 + i);
    return { property_id: p.property_id, dueDate: due.toISOString().slice(0, 10), status: i < 4 ? 'Due' : 'On Track' };
  });
};

export const calculatePropertyHealthScore = ({ occupancy = 0, overdueCleaning = 0, urgentMaintenance = 0, openMaintenance = 0, lowStockCount = 0, ownerReportDue = false }) => {
  const maintenanceApproval = Math.max(0, openMaintenance - urgentMaintenance);
  const score = 100 - overdueCleaning * 12 - urgentMaintenance * 10 - maintenanceApproval * 7 - lowStockCount * 5 - (ownerReportDue ? 5 : 0) - (occupancy < 50 ? 3 : 0);
  return Math.max(0, Math.min(100, score));
};
export const classifyPropertyHealth = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Attention';
};
export const generateOperationsAlerts = (data) => [
  ...(data.overdueCleaning > 0 ? ['Overdue cleaning before next check-in'] : []),
  ...(data.urgentMaintenance > 0 ? ['Urgent maintenance before occupied dates'] : []),
  ...(data.lowStock > 0 ? ['Low stock risk for upcoming check-ins'] : []),
];
export const generateNextBestActions = (data) => {
  const actions = [];
  if (data.overdueCleaning > 0) actions.push('Resolve overdue cleaning before next check-in.');
  if (data.urgentMaintenance > 0) actions.push('Prioritize urgent maintenance on occupied properties.');
  if (data.lowStock > 0) actions.push('Restock critical supplies for high-turnover units.');
  if (data.reportsDueSoon > 0) actions.push('Send owner reports due within 3 days.');
  if (data.maintenanceApprovalNeeded > 0) actions.push('Review high-cost maintenance approvals.');
  if (data.underperforming > 0) actions.push('Investigate occupancy and revenue underperformance.');
  return actions;
};
