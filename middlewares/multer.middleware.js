import multer from "multer";

// Memory storage for AI check (buffer needed)
const memoryStorage = multer.memoryStorage();

// PDF file filter (existing)
function fileFilter(req, file, cb) {
  if (!file.mimetype.includes("pdf")) {
    return cb(new Error("Only PDF files allowed"));
  }
  cb(null, true);
}

// Image filter for signatures (existing)
function imageFilter(req, file, cb) {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg, and .jpeg formats allowed for signatures"), false);
  }
}

// Single PDF upload (assignments)
export const uploadSingle = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
}).single("file");

// Multiple PDFs (bulk)
export const uploadMultiple = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter,
}).array("files", 5); // Max 5 files

// Signature upload (images)
export const uploadSignature = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for signatures
  fileFilter: imageFilter,
}).single("signatureImage");
