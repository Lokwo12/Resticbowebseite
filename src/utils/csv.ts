export const exportToCSV = (rows: Record<string, any>[], filename: string) => {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
