/**
 * Generate a URL-friendly slug from a product name.
 * Supports Arabic and English text.
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')  // keep letters, digits, Arabic, hyphens
    .replace(/[\s_]+/g, '-')                  // spaces/underscores → hyphens
    .replace(/-+/g, '-')                      // collapse multiple hyphens
    .replace(/^-|-$/g, '');                   // trim leading/trailing hyphens
}

module.exports = { generateSlug };
