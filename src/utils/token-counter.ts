/**
 * Token counter utility for estimating token usage for Gemini AI model
 *
 * This is a simplified implementation based on common tokenization patterns.
 * For production use, consider using a more accurate tokenizer like tiktoken.
 */

// Average tokens per character for different languages/scripts
const TOKENS_PER_CHAR = {
  latin: 0.25, // English, Spanish, French, etc.
  cjk: 0.5, // Chinese, Japanese, Korean
  other: 0.33, // Other scripts
};

// Average tokens per word for English text
const AVG_TOKENS_PER_WORD = 1.3;

/**
 * Estimates the number of tokens in a text string
 * @param text The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Simple word-based estimation (works well for English/Latin scripts)
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Character-based estimation (better for mixed scripts)
  const charCount = text.length;

  // Detect if text contains significant CJK characters
  const cjkRegex =
    /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
  const hasCJK = cjkRegex.test(text);

  // Use appropriate tokens per character ratio
  const tokensPerChar = hasCJK ? TOKENS_PER_CHAR.cjk : TOKENS_PER_CHAR.latin;

  // For short texts, character-based estimation is more accurate
  // For longer texts, a hybrid approach works better
  if (charCount < 100) {
    return Math.ceil(charCount * tokensPerChar);
  } else {
    // Hybrid approach
    const wordBasedEstimate = wordCount * AVG_TOKENS_PER_WORD;
    const charBasedEstimate = charCount * tokensPerChar;

    // Return the average of both methods
    return Math.ceil((wordBasedEstimate + charBasedEstimate) / 2);
  }
}

/**
 * Estimates tokens for PDF content based on page count and average content density
 * @param pageCount Number of pages in the PDF
 * @param contentDensity Density factor (1 = normal text, 2 = dense text/tables)
 * @returns Estimated token count
 */
export function estimatePdfTokens(
  pageCount: number,
  contentDensity: number = 1,
): number {
  // Average tokens per page for a standard text document
  const AVG_TOKENS_PER_PAGE = 500;
  return Math.ceil(pageCount * AVG_TOKENS_PER_PAGE * contentDensity);
}

/**
 * Estimates tokens for common document types
 * @param fileType MIME type of the document
 * @param fileSize Size in bytes
 * @param metadata Additional metadata like page count
 * @returns Estimated token count
 */
export function estimateDocumentTokens(
  fileType: string,
  fileSize: number,
  metadata?: { pageCount?: number; contentDensity?: number },
): number {
  // Default estimates based on file size
  const bytesPerToken = 4; // Very rough approximation
  let estimatedTokens = Math.ceil(fileSize / bytesPerToken);

  // Adjust based on file type
  if (fileType.includes("pdf")) {
    if (metadata?.pageCount) {
      return estimatePdfTokens(
        metadata.pageCount,
        metadata.contentDensity || 1,
      );
    }
    // Rough estimate based on file size if page count is unknown
    const estimatedPages = Math.max(1, Math.ceil(fileSize / (100 * 1024))); // ~100KB per page
    return estimatePdfTokens(estimatedPages);
  }

  if (fileType.includes("word") || fileType.includes("document")) {
    // Word documents typically have more tokens per byte than plain text
    estimatedTokens = Math.ceil(estimatedTokens * 0.8);
  }

  if (
    fileType.includes("csv") ||
    fileType.includes("excel") ||
    fileType.includes("spreadsheet")
  ) {
    // Spreadsheets are more token-efficient when represented as text
    estimatedTokens = Math.ceil(estimatedTokens * 0.5);
  }

  return Math.max(1, estimatedTokens);
}
