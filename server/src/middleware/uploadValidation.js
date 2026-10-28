const multer = require("multer");
const {
  MAX_FILE_SIZE,
  MIME_TYPES,
  validateAssessmentFile,
} = require("../services/fileStorageService");

const parseAssessmentFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 0, parts: 1 },
  fileFilter: (req, file, callback) => {
    if (!MIME_TYPES.has(String(file.mimetype).toLowerCase())) {
      return callback(new Error("Only PDF, JPEG, PNG, and WebP files are allowed."));
    }
    return callback(null, true);
  },
}).single("file");

const validateAssessmentUpload = (req, res, next) => {
  parseAssessmentFile(req, res, (uploadError) => {
    if (uploadError) {
      const message = uploadError.code === "LIMIT_FILE_SIZE"
        ? "Each file must be no larger than 8 MB."
        : uploadError.message;
      return res.status(400).json({ success: false, message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose a file to upload." });
    }
    try {
      validateAssessmentFile(req.file);
      return next();
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  });
};

module.exports = {
  MAX_FILE_SIZE,
  MIME_TYPES,
  validateAssessmentUpload,
};
