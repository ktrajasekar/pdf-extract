// Groups text items by y-position into rows; useful for table-like layouts.
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

async function extractRows(buffer, { yTolerance = 3 } = {}) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true }).promise;
  const rows = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lines = [];

    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      let line = lines.find((l) => Math.abs(l.y - y) <= yTolerance);
      if (!line) {
        line = { y, cells: [] };
        lines.push(line);
      }
      line.cells.push({ x, text: item.str.trim() });
    }

    lines
      .sort((a, b) => b.y - a.y)
      .forEach((l) => rows.push(l.cells.sort((a, b) => a.x - b.x).map((c) => c.text)));
  }

  await doc.destroy();
  return rows;
}

module.exports = extractRows;
