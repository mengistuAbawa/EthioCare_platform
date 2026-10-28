const { randomUUID } = require("crypto");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

let client;

const getStorageConfig = () => {
  const { S3_BUCKET, S3_REGION, S3_ENDPOINT } = process.env;
  if (!S3_BUCKET || !S3_REGION) {
    const error = new Error("Secure file storage is not configured. Set S3_BUCKET and S3_REGION.");
    error.status = 503;
    throw error;
  }
  return { bucket: S3_BUCKET, region: S3_REGION, endpoint: S3_ENDPOINT };
};

const getClient = () => {
  if (!client) {
    const config = getStorageConfig();
    client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: Boolean(config.endpoint),
    });
  }
  return client;
};

const safeOriginalFilename = (filename) => {
  const safeFilename = typeof filename === "string" ? filename.trim() : "";
  if (!safeFilename || safeFilename.length > 255 || /[\/\\\u0000-\u001f]/.test(safeFilename)) {
    throw new Error("Filename must be a plain name no longer than 255 characters.");
  }
  return safeFilename;
};

const validateFileSignature = (file) => {
  const buffer = file.buffer;
  const type = String(file.mimetype || "").toLowerCase();
  const valid = type === "application/pdf"
    ? buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    : type === "image/png"
      ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : type === "image/jpeg"
        ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
        : type === "image/webp"
          ? buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
            buffer.subarray(8, 12).toString("ascii") === "WEBP"
          : false;
  if (!MIME_TYPES.has(type) || !valid) {
    throw new Error("The selected file type does not match a supported PDF or image format.");
  }
};

const validateAssessmentFile = (file) => {
  if (!file || !Buffer.isBuffer(file.buffer) || file.size < 1 || file.size > MAX_FILE_SIZE) {
    throw new Error("Each file must be between 1 byte and 8 MB.");
  }
  const filename = safeOriginalFilename(file.originalname);
  validateFileSignature(file);
  return filename;
};

const prepareAssessmentFile = (assessmentId, file) => {
  const filename = validateAssessmentFile(file);
  return {
    objectKey: `patient-assessments/${assessmentId}/${randomUUID()}`,
    filename,
    contentType: file.mimetype,
    size: file.size,
  };
};

const storeAssessmentFile = async (prepared, file) => {
  const config = getStorageConfig();
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: prepared.objectKey,
      Body: file.buffer,
      ContentLength: file.size,
      ContentType: file.mimetype,
      ServerSideEncryption: "AES256",
    })
  );
};

const deleteAssessmentFile = async (objectKey) => {
  const config = getStorageConfig();
  await getClient().send(new DeleteObjectCommand({ Bucket: config.bucket, Key: objectKey }));
};

const createDownloadUrl = async (objectKey) => {
  const config = getStorageConfig();
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ResponseContentDisposition: "attachment",
  });
  return getSignedUrl(getClient(), command, { expiresIn: 60 });
};

module.exports = {
  MAX_FILE_SIZE,
  MIME_TYPES,
  validateAssessmentFile,
  prepareAssessmentFile,
  storeAssessmentFile,
  deleteAssessmentFile,
  createDownloadUrl,
};
