export function formatDate(iso: string) {
  const [y, m, d] = (iso ?? '').split('-');
  return d && m && y ? `${d}.${m}.${y}` : (iso ?? '');
}

export function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} — ${formatDate(endDate)}`;
}
