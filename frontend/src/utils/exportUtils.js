export function downloadCSV(filename, rows) {
  const esc = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
  save(new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }), filename);
}
export async function downloadPDF(filename, title, lines) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text(title, 14, 18);
  doc.setFontSize(10);
  let y = 28;
  for (const l of lines) {
    for (const part of doc.splitTextToSize(l, 180)) {
      if (y > 280) { doc.addPage(); y = 18; }
      doc.text(part, 14, y); y += 6;
    }
  }
  doc.save(filename);
}
function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
