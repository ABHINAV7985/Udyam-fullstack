// Keep this for numeric fields only
export const onlyDigits = (s: string) => s.replace(/\D+/g, '');

// Generic validation function
export function validateBySchema(value: string, field: any): string | null {
  if (field.required && !value) return `${field.label} is required.`;

  if (value && field.maxlength && value.length > field.maxlength) {
    return `${field.label} must be at most ${field.maxlength} characters.`;
  }

  // Check pattern only if defined
  if (value && field.pattern) {
    try {
      const re = new RegExp(field.pattern);
      if (!re.test(value)) return `${field.label} format is invalid.`;
    } catch {
      console.warn(`Invalid regex for ${field.label}`);
    }
  }

  return null;
}
