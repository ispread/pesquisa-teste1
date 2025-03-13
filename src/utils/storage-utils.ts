import { createClient } from "../../supabase/client";

/**
 * Calculates the total storage used in bytes
 * @returns The total storage used in bytes
 */
export async function calculateStorageUsed(): Promise<number> {
  const supabase = createClient();

  try {
    // Get all documents to calculate total size
    const { data: documents, error } = await supabase
      .from("documents")
      .select("file_size");

    if (error) throw error;

    // Sum up all file sizes
    const totalBytes =
      documents?.reduce((total, doc) => total + (doc.file_size || 0), 0) || 0;

    return totalBytes;
  } catch (error) {
    console.error("Error calculating storage used:", error);
    return 0;
  }
}

/**
 * Formats bytes into a human-readable format (KB, MB, GB)
 * @param bytes The number of bytes
 * @param decimals The number of decimal places to show
 * @returns Formatted string with appropriate unit
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
}
