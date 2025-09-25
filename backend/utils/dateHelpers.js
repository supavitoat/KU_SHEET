// Centralized date & time helpers
const THAI_MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function dayRange(date) {
  const d = new Date(date);
  return [new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0), new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23,59,59,999)];
}

function lastNDaysRanges(n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d);
  }
  return arr;
}

function weekWindowOffsets(days = 7) {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - (days - 1));
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - (days - 1));
  return { currentStart, previousStart, previousEnd };
}

function growthPercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

module.exports = {
  THAI_MONTH_SHORT,
  startOfMonth,
  endOfMonth,
  dayRange,
  lastNDaysRanges,
  weekWindowOffsets,
  growthPercent
};
