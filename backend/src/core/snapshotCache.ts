/**
 * Snapshot- and version-aware in-memory cache for immutable snapshot queries.
 * Invariant: Cache keys MUST include snapshot/version identifiers so data from
 * different snapshot dates or methodology versions is never mixed.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SnapshotVersionCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(options?: { maxEntries?: number; defaultTtlMs?: number }) {
    this.maxEntries = options?.maxEntries ?? 250;
    this.defaultTtlMs = options?.defaultTtlMs ?? 5 * 60_000;
  }

  public static buildKey(parts: {
    namespace: string;
    snapshotVersion: string;
    params: Record<string, string | number | null | undefined>;
  }): string {
    const sortedParams = Object.entries(parts.params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v ?? ""}`)
      .join("&");
    return `${parts.namespace}::${parts.snapshotVersion}::${sortedParams}`;
  }

  public get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  public set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }
}

export async function withBoundedTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms: ${label}`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
