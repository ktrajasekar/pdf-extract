// Add or change patterns to match your documents.
const patterns = {
  invoiceNumber: /Invoice\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9\-\/]+)/i,
  date: /Date\s*:?\s*(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4})/i,
  total: /(?:Grand\s+)?Total\s*(?:Amount)?\s*:?\s*(?:Rs\.?|INR|₹|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  email: /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i,
  phone: /(\+?\d[\d\s\-()]{8,}\d)/,
  gstin: /\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d])\b/,
};

function extractFields(text) {
  const fields = {};
  for (const [key, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    fields[key] = match ? match[1].trim() : null;
  }
  return fields;
}

module.exports = extractFields;
