/**
 * 永続化の共通土台（storage.md §3,4,5）：version エンベロープでの包み・防御的読込・ベストエフォート書込。
 * キー別の load/save（index.ts）はこの read/write を薄く呼ぶだけ。React/DOM 非依存（backend 注入）。
 */

/** 注入できる localStorage 互換 backend（テストはインメモリ実装を渡す＝storage.md §6）。 */
export type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** 保存値の包み。キー名に version を埋めず、ここに持たせる（移行時に旧キーが孤児化しない）。 */
export interface StoredEnvelope<T> {
  schemaVersion: number;
  data: T;
}

/** 現行スキーマ version。形を変えたら上げ、migrate を足す（storage.md §4）。 */
export const SCHEMA_VERSION = 1;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isEnvelope(v: unknown): v is StoredEnvelope<unknown> {
  return isObject(v) && typeof v.schemaVersion === 'number' && 'data' in v;
}

/**
 * 防御的読込（storage.md §5）。キー無し・JSON 破損・エンベロープ不正・version 不一致は、
 * 例外を ui へ漏らさず fallback() を返す。validate は欠けたフィールドを既定で補完する責務。
 * 正確性最優先のため、解釈できないデータで動くより既定で復旧する（storage.md §4）。
 */
export function read<T>(
  backend: StorageBackend,
  key: string,
  validate: (raw: unknown) => T,
  fallback: () => T,
): T {
  let raw: string | null;
  try {
    raw = backend.getItem(key);
  } catch {
    return fallback();
  }
  if (raw === null) return fallback();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[storage] ${key}: JSON パースに失敗。既定値で復旧します。`);
    return fallback();
  }

  if (!isEnvelope(parsed)) {
    console.warn(`[storage] ${key}: エンベロープが不正。既定値で復旧します。`);
    return fallback();
  }

  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    // 現行は v1 のみ。旧 version はここで段階マイグレーション（1→2→…）を適用する（storage.md §4）。
    // 未知／新しい version は無理に解釈せず既定へ（データ消失より誤状態回避を優先）。
    console.warn(
      `[storage] ${key}: 未対応の schemaVersion=${parsed.schemaVersion}。既定値で復旧します。`,
    );
    return fallback();
  }

  return validate(parsed.data);
}

/** ベストエフォート書込（storage.md §5）。容量超過・プライベートモード等で失敗しても落とさない。 */
export function write<T>(backend: StorageBackend, key: string, data: T): void {
  const envelope: StoredEnvelope<T> = { schemaVersion: SCHEMA_VERSION, data };
  try {
    backend.setItem(key, JSON.stringify(envelope));
  } catch {
    console.warn(`[storage] ${key}: 書込に失敗。メモリ上の state は維持します。`);
  }
}
