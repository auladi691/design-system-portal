import type { TokenImport, TokenLibrarySummary } from "@/types/content";
import { parseTokenLibrary, type TokenLeaf, type TokenLibrary } from "@/lib/tokens";

export type ResolvedToken = {
  path: string;
  type: string;
  value: unknown;
  ref?: string;
  resolvedValue: unknown;
  description?: string;
};

function collectTokenMap(library: TokenLibrary): Map<string, TokenLeaf> {
  const map = new Map<string, TokenLeaf>();
  for (const t of library.tokens) map.set(t.path, t);
  return map;
}

function extractAliasRefs(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const refs: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    refs.push(m[1].trim());
  }
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
        brokenAliases.add(ref);
        errors.push(`Token "${token.path}" references "${ref}" which does not exist`);
      }
    }
  }
  return { ok: brokenAliases.size === 0, brokenAliases: [...brokenAliases], errors };
}

export function resolveTokenLibrary(source: unknown, fileName: string): { library: TokenLibrary; resolved: ResolvedToken[]; validation: ReturnType<typeof validateTokenAliases> } {
  const library = parseTokenLibrary(source, fileName);
  const map = collectTokenMap(library);
  const resolved: ResolvedToken[] = [];

  function resolveValue(path: string, visited: Set<string>): unknown {
    const leaf = map.get(path);
    if (!leaf) return undefined;
    if (visited.has(path)) return leaf.value;
    visited.add(path);
    const raw = leaf.value;
    if (typeof raw !== "string") return raw;
    const refs = extractAliasRefs(raw);
    if (!refs.length) return raw;
    const ref = refs[0];
    const candidate = ref.startsWith("$") ? ref.slice(1).replace(/\[/g, ".").replace(/\]/g, "") : ref;
    const targetPath = map.has(candidate) ? candidate : ref;
    const value = map.get(targetPath)?.value;
    if (value === undefined) return raw;
    if (typeof value === "string" && value.includes("{")) {
      return resolveValue(targetPath, visited);
    }
    return value;
  }

  for (const token of library.tokens) {
    const refs = extractAliasRefs(token.value);
    const rv = resolveValue(token.path, new Set());
    resolved.push({
      path: token.path,
      type: token.type,
      value: token.value,
      ref: refs[0],
      resolvedValue: rv ?? token.value,
      description: token.description,
    });
  }

  const validation = validateTokenAliases(source);
  return { library, resolved, validation };
}

export function buildTokenSummary(library: TokenLibrary, validation: ReturnType<typeof validateTokenAliases>): TokenLibrarySummary & { validationErrors: string[]; validationBrokenAliases: string[] } {
  return {
    fileName: library.fileName,
    total: library.total,
    references: library.references,
    uniqueReferences: library.uniqueReferences,
    withDescription: library.withDescription,
    groups: library.groups,
    validationErrors: validation.errors,
    validationBrokenAliases: validation.brokenAliases,
  } as never;
}

export function getPublishedTokenImport(tokenImports: TokenImport[]): TokenImport | null {
  return tokenImports.filter((t) => t.status === "published").sort((a, b) => {
    const pa = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const pb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return pb - pa;
  })[0] ?? null;
}

export function getResolvedTokensFromImport(tokenImport: TokenImport | null | undefined): ResolvedToken[] {
  if (!tokenImport) return [];
  try {
    const { resolved } = resolveTokenLibrary(tokenImport.sourceJson, tokenImport.fileName);
    return resolved;
  } catch {
    return [];
  }
}
