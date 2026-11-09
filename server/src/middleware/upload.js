const multer = require("multer");

const maxMb = Number(process.env.MAX_FILE_MB || 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    const err = new Error("Only PDF files are allowed");
    err.status = 400;
    cb(err);
  },
});

module.exports = upload;
