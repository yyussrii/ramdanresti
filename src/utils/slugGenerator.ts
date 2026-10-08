/**
 * Human-readable URL Slug Generator for Guest Invitations
 * 
 * Rules:
 * - lowercase
 * - trim whitespace
 * - spaces & delimiters become "-"
 * - remove unnecessary special characters
 * - retain letters and numbers
 * - no random strings, fully readable by humans
 * 
 * Examples:
 * "Pak Yanto" -> "pak-yanto"
 * "Nelly Selvatiany" -> "nelly-selvatiany"
 * "Ibu Atalia Praratya" -> "ibu-atalia-praratya"
 * "Sindy setiawati(pembina jbz)" -> "sindy-setiawati-pembina-jbz"
 */

export function generateSlug(name: string): string {
  if (!name || typeof name !== 'string') return 'tamu';

  const slug = name
    .toLowerCase()
    .trim()
    // Replace parentheses, brackets, slashes, ampersands, underscores, commas, periods with hyphens
    .replace(/[()[\]{}_/.,+&~=:#@!?]+/g, '-')
    // Replace remaining non-alphanumeric characters (except hyphen)
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')
    // Collapse multiple consecutive hyphens into a single hyphen
    .replace(/-+/g, '-')
    // Trim hyphens from ends
    .replace(/^-+|-+$/g, '');

  return slug || 'tamu';
}

/**
 * Generates a unique slug among an existing array of slugs.
 * If a duplicate exists, appends numeric suffix: -2, -3, etc.
 * 
 * Example:
 * "Rizky Anugrah" -> "rizky-anugrah"
 * "Rizky Anugrah" -> "rizky-anugrah-2"
 * "Rizky Anugrah" -> "rizky-anugrah-3"
 */
export function generateUniqueSlug(
  nameOrSlug: string,
  existingSlugs: string[],
  excludeCurrentSlug?: string
): string {
  const baseSlug = generateSlug(nameOrSlug);
  const existingSet = new Set(
    existingSlugs
      .map((s) => s?.trim().toLowerCase())
      .filter((s) => s && s !== excludeCurrentSlug?.trim().toLowerCase())
  );

  if (!existingSet.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existingSet.has(`${baseSlug}-${suffix}`)) {
    suffix++;
  }

  return `${baseSlug}-${suffix}`;
}

/**
 * Validates whether a slug is properly formatted
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed);
}
