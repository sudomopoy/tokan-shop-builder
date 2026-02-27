type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function parseSlice(spec: string): { start?: number; end?: number } | null {
  // "0:5", ":5", "2:", "3:3"
  const m = spec.match(/^(-?\d*)\s*:\s*(-?\d*)$/);
  if (!m) return null;
  const startRaw = m[1];
  const endRaw = m[2];
  const start = startRaw === "" ? undefined : Number(startRaw);
  const end = endRaw === "" ? undefined : Number(endRaw);
  return {
    start: start !== undefined && !Number.isNaN(start) ? start : undefined,
    end: end !== undefined && !Number.isNaN(end) ? end : undefined,
  };
}

function applyAccessor(value: unknown, accessor: string): unknown {
  // accessor: ".foo" or "[0]" or "[0:5]"
  if (!accessor) return value;
  if (accessor.startsWith(".")) {
    const key = accessor.slice(1);
    if (Array.isArray(value)) {
      // map property over array (e.g. items.title)
      return value.map((item) => (isRecord(item) ? item[key] : undefined));
    }
    if (isRecord(value)) return value[key];
    return undefined;
  }
  if (accessor.startsWith("[") && accessor.endsWith("]")) {
    const inside = accessor.slice(1, -1).trim();
    const slice = parseSlice(inside);
    if (slice) {
      if (Array.isArray(value)) return value.slice(slice.start, slice.end);
      if (typeof value === "string") return value.slice(slice.start, slice.end);
      return undefined;
    }
    const idx = Number(inside);
    if (Number.isNaN(idx)) return undefined;
    if (Array.isArray(value)) return value[idx];
    if (typeof value === "string") return value[idx];
    return undefined;
  }
  return undefined;
}

export function evalDataExpression(expr: string, data: UnknownRecord): unknown {
  // Supports: data.foo.bar[0:5].title
  const raw = expr.trim();
  if (!raw.startsWith("data.")) return undefined;

  // Split pipeline filters: "data.x | join ','"
  // Also accept postfix " join ','" when no pipe is used (common typo).
  let baseExpr = raw;
  let joinSep: string | undefined;

  if (raw.includes("|")) {
    const [left, ...rest] = raw.split("|").map((s) => s.trim()).filter(Boolean);
    baseExpr = left ?? raw;
    for (const f of rest) {
      const m = f.match(/^join(?:\s+('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"))?$/);
      if (m) {
        const lit = m[1];
        if (!lit) joinSep = ",";
        else joinSep = lit.slice(1, -1);
      }
    }
  } else {
    const m = raw.match(/^(.*)\s+join\s+('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")\s*$/);
    if (m) {
      baseExpr = m[1].trim();
      joinSep = m[2].slice(1, -1);
    }
  }

  // Tokenize base expression into accessors: .foo, [0:5], .bar ...
  const base = baseExpr.trim();
  if (!base.startsWith("data.")) return undefined;
  const access = base.slice("data".length); // keep leading "."

  const tokens: string[] = [];
  let i = 0;
  while (i < access.length) {
    const ch = access[i];
    if (ch === ".") {
      let j = i + 1;
      while (j < access.length && /[A-Za-z0-9_]/.test(access[j]!)) j++;
      tokens.push(access.slice(i, j));
      i = j;
      continue;
    }
    if (ch === "[") {
      let j = i + 1;
      while (j < access.length && access[j] !== "]") j++;
      if (j < access.length) j++;
      tokens.push(access.slice(i, j));
      i = j;
      continue;
    }
    // Unknown char -> stop
    break;
  }

  let current: unknown = data;
  for (const t of tokens) current = applyAccessor(current, t);

  // Default join behavior for arrays (comma) unless explicit join provided.
  if (Array.isArray(current)) {
    const sep = joinSep ?? ",";
    return current
      .filter((v) => v !== undefined && v !== null && v !== "")
      .map((v) => String(v))
      .join(sep);
  }

  return current;
}

export function resolveTemplateString(template: string, data: UnknownRecord): string {
  // Replace all {{ ... }} occurrences
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, expr) => {
    const v = evalDataExpression(String(expr), data);
    if (v === undefined || v === null) return "";
    if (Array.isArray(v)) return v.join(",");
    return String(v);
  });
}

