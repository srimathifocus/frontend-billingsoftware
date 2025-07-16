export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim(); // Remove leading/trailing whitespace
};

export const createProductSlug = (name: string, id: string): string => {
  const nameSlug = createSlug(name);
  // Store the full ID but encode it to make it less obvious
  const encodedId = btoa(id).replace(/[+=\/]/g, ""); // Base64 encode and remove special chars
  return `${nameSlug}-${encodedId}`;
};

export const extractIdFromSlug = (slug: string): string => {
  try {
    // Extract the encoded ID from the end of the slug (after the last hyphen)
    const parts = slug.split("-");
    const encodedId = parts[parts.length - 1];
    // Decode the ID
    return atob(encodedId);
  } catch (error) {
    // If decoding fails, try to extract as plain ID (backward compatibility)
    const parts = slug.split("-");
    return parts[parts.length - 1];
  }
};
