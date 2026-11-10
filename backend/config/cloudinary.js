import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Initialize Cloudinary configuration
export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
);

if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload an image file to Cloudinary.
 * If Cloudinary is configured: uploads to Cloudinary, deletes local temp file, returns permanent HTTPS URL.
 * If not configured: gracefully falls back to local uploads/ directory and returns filename.
 */
export async function uploadToCloudinary(filePath, folder = "aura") {
  if (!filePath) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: "auto",
      });

      // Remove local temporary file
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }

      return result.secure_url;
    } catch (error) {
      console.error("[Cloudinary Error] Upload failed, falling back to local file:", error.message);
      const filename = filePath.replace(/\\/g, "/").split("/").pop();
      return filename;
    }
  }

  // Not configured: fallback to local filename
  const filename = filePath.replace(/\\/g, "/").split("/").pop();
  return filename;
}

/**
 * Delete an image from Cloudinary (or local disk if stored locally)
 */
export async function deleteFromCloudinary(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return;

  // Local file
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    const localPath = `uploads/${imageUrl}`;
    if (fs.existsSync(localPath)) {
      fs.unlink(localPath, () => {});
    }
    return;
  }

  // Cloudinary image
  if (isCloudinaryConfigured && imageUrl.includes("cloudinary.com")) {
    try {
      const uploadIndex = imageUrl.indexOf("/upload/");
      if (uploadIndex !== -1) {
        const afterUpload = imageUrl.substring(uploadIndex + 8);
        // Remove version segment e.g. v1723456789/
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        // Remove extension
        const dotIndex = withoutVersion.lastIndexOf(".");
        const publicId = dotIndex !== -1 ? withoutVersion.substring(0, dotIndex) : withoutVersion;
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.warn("[Cloudinary Warning] Cleanup failed:", err.message);
    }
  }
}

export { cloudinary };

