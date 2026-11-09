const multer = require("multer");

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `File is too large. Maximum size is ${process.env.MAX_FILE_MB || 10} MB.`
        : err.message;
    return res.status(400).json({ error: message });
  }
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
};
