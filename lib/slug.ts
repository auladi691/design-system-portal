export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(base: string, existing: string[]): string {
  const slug = slugify(base) || "asset";
  if (!existing.includes(slug)) return slug;
  let counter = 2;
  while (existing.includes(`${slug}-${counter}`)) counter += 1;
  return `${slug}-${counter}`;
}
