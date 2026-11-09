const pdfParse = require("pdf-parse");

async function extractText(buffer) {
  const data = await pdfParse(buffer);
  return { text: data.text || "", pages: data.numpages, info: data.info || {} };
}

module.exports = extractText;
