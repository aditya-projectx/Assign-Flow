import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary environment variables are missing.");
  }
}

function configureCloudinary() {
  ensureCloudinaryConfig();

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function normalizeUploadError(error) {
  if (error instanceof Error && error.message) {
    return error;
  }

  const nestedMessage =
    error?.message ||
    error?.error?.message ||
    error?.error?.description ||
    error?.http_message ||
    error?.name;

  if (nestedMessage) {
    const normalizedError = new Error(nestedMessage);
    normalizedError.cause = error;
    return normalizedError;
  }

  const serializedError =
    typeof error === "string" ? error : JSON.stringify(error, null, 2);

  const fallbackError = new Error(
    serializedError || "Unknown Cloudinary upload error."
  );
  fallbackError.cause = error;
  return fallbackError;
}

function isPdfFile(file, options) {
  return (
    options.resource_type === "raw" ||
    file?.mimetype === "application/pdf" ||
    file?.originalname?.toLowerCase().endsWith(".pdf")
  );
}

export function normalizeCloudinaryFileUrl(url) {
  if (!url || typeof url !== "string") {
    return url;
  }

  if (
    url.includes("/image/upload/") &&
    url.toLowerCase().includes(".pdf")
  ) {
    return url.replace("/image/upload/", "/raw/upload/");
  }

  return url;
}

function buildDeliveryUrl(result, file, resourceType) {
  const normalizedSecureUrl = normalizeCloudinaryFileUrl(result?.secure_url);
  const normalizedUrl = normalizeCloudinaryFileUrl(result?.url);

  if (resourceType !== "raw") {
    return normalizedSecureUrl || normalizedUrl;
  }

  const fileExtension =
    result?.format ||
    file?.originalname?.split(".").pop()?.toLowerCase();

  if (!result?.public_id) {
    return normalizedSecureUrl || normalizedUrl;
  }

  const publicIdAlreadyHasExtension =
    fileExtension &&
    result.public_id.toLowerCase().endsWith(`.${fileExtension}`);

  const publicIdWithExtension =
    fileExtension && !publicIdAlreadyHasExtension
      ? `${result.public_id}.${fileExtension}`
      : result.public_id;

  return cloudinary.url(publicIdWithExtension, {
    resource_type: "raw",
    type: "upload",
    secure: true,
  });
}

export async function uploadBufferToCloudinary(file, options = {}) {
  configureCloudinary();

  if (!file?.buffer) {
    throw new Error("No file buffer found for Cloudinary upload.");
  }

  const folder = options.folder || "assignflow";
  const resourceType = isPdfFile(file, options)
    ? "raw"
    : options.resource_type || "auto";
  const publicId = options.public_id;
  const originalName = file.originalname?.replace(/\.[^/.]+$/, "");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error) {
          reject(normalizeUploadError(error));
          return;
        }

        if (!result?.secure_url && !result?.url) {
          reject(new Error("Cloudinary upload succeeded but no file URL was returned."));
          return;
        }

        const deliveryUrl = buildDeliveryUrl(result, file, resourceType);

        resolve({
          ...result,
          secure_url: deliveryUrl,
          url: deliveryUrl,
        });
      }
    );

    stream.end(file.buffer);
  });
}

export { cloudinary };
