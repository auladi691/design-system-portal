export type TokenLeaf = {
  path: string;
  type: string;
  value: unknown;
  description?: string;
  referenced: boolean;
};

export type TokenLibrary = {
  fileName: string;
  total: number;
  references: number;
  uniqueReferences: number;
  withDescription: number;
  groups: { name: string; count: number }[];
  tokens: TokenLeaf[];
};

function isTokenLeaf(node: unknown): node is { type: string; value: unknown; description?: string } {
  return Boolean(node && typeof node === "object" && "type" in node && "value" in node);
}

function walk(node: unknown, path: string[], out: TokenLeaf[]) {
  if (!node || typeof node !== "object") return;
  if (isTokenLeaf(node)) {
    const value = node.value;
    const referenced = typeof value === "string" && value.includes("{");
    out.push({
      path: path.join("."),
      type: String(node.type),
      value,
      description: typeof node.description === "string" ? node.description : undefined,
      referenced,
    });
    return;
  }
  for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
    if (key === "extensions" || key === "$extensions") continue;
    walk(child, [...path, key], out);
  }
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseTokenLibrary(source: unknown, fileName: string): TokenLibrary {
  const tokens: TokenLeaf[] = [];
  walk(source, [], tokens);
  const groupCounts = new Map<string, number>();
  const refs = new Set<string>();
  let references = 0;
  let withDescription = 0;

  for (const token of tokens) {
    const group = titleCase(token.path.split(".")[0] || "Other");
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
    if (token.referenced) {
      references += 1;
      if (typeof token.value === "string") refs.add(token.value);
    }
    if (token.description?.trim()) withDescription += 1;
  }

  const groups = [...groupCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    fileName,
    total: tokens.length,
    references,
    uniqueReferences: refs.size,
    withDescription,
    groups,
    tokens,
  };
}

export function emptyTokenLibrary(fileName = ""): TokenLibrary {
  return {
    fileName,
    total: 0,
    references: 0,
    uniqueReferences: 0,
    withDescription: 0,
    groups: [],
    tokens: [],
  };
}

export function validateTokenStructure(source: unknown): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return { ok: false, errors: ["Token JSON must be an object with collections"] };
  }
  const obj = source as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (!keys.length) return { ok: false, errors: ["Token JSON is empty"] };
  let hasLeaf = false;
  function hasLeafNode(node: unknown): boolean {
    if (!node || typeof node !== "object") return false;
    if (isTokenLeaf(node)) return true;
    for (const v of Object.values(node as Record<string, unknown>)) {
      if (hasLeafNode(v)) return true;
    }
    return false;
  }
  for (const k of keys) {
    if (hasLeafNode(obj[k])) hasLeaf = true;
  }
  if (!hasLeaf) errors.push("No token with { type, value } found. Check the Figma Tokens export format.");
  return { ok: errors.length === 0, errors };
}

function extractAliasRefs(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const refs: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) refs.push(m[1].trim());
  return refs;
}

export function validateTokenAliases(source: unknown): { ok: boolean; brokenAliases: string[]; errors: string[] } {
  let library: TokenLibrary;
  try {
    library = parseTokenLibrary(source, "import");
  } catch (error) {
    return { ok: false, brokenAliases: [], errors: [error instanceof Error ? error.message : "Could not parse token JSON"] };
  }
  const pathSet = new Set(library.tokens.map((t) => t.path));
  const brokenAliases = new Set<string>();
  const errors: string[] = [];
  for (const token of library.tokens) {
    const refs = extractAliasRefs(token.value);
    for (const ref of refs) {
      const candidate = ref.startsWith("$") ? ref.slice(1).replace(/\[/g, ".").replace(/\]/g, "") : ref;
      if (!pathSet.has(candidate) && !pathSet.has(ref)) {
        if (!brokenAliases.has(ref)) {
          brokenAliases.add(ref);
          errors.push(`Token "${token.path}" references "${ref}" which does not exist`);
        }
      }
    }
  }
  return { ok: brokenAliases.size === 0, brokenAliases: [...brokenAliases], errors };
}

export type TokenValidationResult = {
  structureOk: boolean;
  structureErrors: string[];
  aliasesOk: boolean;
  brokenAliases: string[];
  aliasErrors: string[];
};
