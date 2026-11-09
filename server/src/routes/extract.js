const express = require("express");
const upload = require("../middleware/upload");
const extractText = require("../extractors/text");
const extractRows = require("../extractors/rows");
const extractFields = require("../extractors/fields");

const router = express.Router();

router.post("/extract", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded. Use the field name 'file'." });

    const { text, pages, info } = await extractText(req.file.buffer);

    let rows = [];
    try {
      rows = await extractRows(req.file.buffer);
    } catch (e) {
      console.warn("Row extraction failed:", e.message);
    }

    const charsPerPage = text.replace(/\s/g, "").length / Math.max(pages, 1);

    res.json({
      fileName: req.file.originalname,
      pages,
      info,
      fields: extractFields(text),
      rows,
      text,
      isLikelyScanned: charsPerPage < 20,
    });
  } catch (err) {
    err.status = 422;
    err.message = `Could not read this PDF: ${err.message}`;
    next(err);
  }
});

module.exports = router;
