/**
 * Utility to resize and compress user avatar images into lightweight Data URLs (JPEG/WebP)
 * to ensure fast loading, optimal memory usage, and 100% reliable persistence in Firestore.
 */
export async function compressAvatarImage(
  file: File,
  maxDimension = 256,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Crop to square from center
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          // Target output square dimension (e.g., 256x256)
          const targetSize = Math.min(minDim, maxDimension);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Draw high-quality cropped and scaled image
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

          // Convert to compressed WebP or JPEG
          let compressedDataUrl = canvas.toDataURL("image/webp", quality);
          // Fallback to JPEG if WebP is not supported
          if (!compressedDataUrl.startsWith("data:image/webp")) {
            compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(compressedDataUrl);
        } catch (err) {
          // Fallback to raw data url if canvas processing encounters any edge case
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
