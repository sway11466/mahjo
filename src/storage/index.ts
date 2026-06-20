import type {
  RuleSettings,
  AppSettings,
  ProgressByCharacter,
} from '../types/index.ts';
import { read, write, type StorageBackend } from './envelope.ts';
import {
  defaultRuleSettings,
  defaultAppSettings,
  defaultProgressByCharacter,
} from './defaults.ts';
import {
  validateRuleSettings,
  validateAppSettings,
  validateProgressByCharacter,
} from './validate.ts';

/**
 * localStorage 永続化の公開口（storage.md §6）。load/save の素の関数だけを出す。
 * backend は注入可能（既定 globalThis.localStorage、テストはインメモリ）。
 *
 * キー設計（storage.md §3）：名前空間接頭辞 `mahjo:` を全キーに付ける。
 */
export const STORAGE_KEYS = {
  rules: 'mahjo:rules',
  app: 'mahjo:app',
  progress: 'mahjo:progress',
} as const;

export function createStorage(backend: StorageBackend = globalThis.localStorage) {
  return {
    loadRules: (): RuleSettings =>
      read(backend, STORAGE_KEYS.rules, validateRuleSettings, defaultRuleSettings),
    saveRules: (r: RuleSettings): void => write(backend, STORAGE_KEYS.rules, r),

    loadAppSettings: (): AppSettings =>
      read(backend, STORAGE_KEYS.app, validateAppSettings, defaultAppSettings),
    saveAppSettings: (s: AppSettings): void => write(backend, STORAGE_KEYS.app, s),

    loadProgress: (): ProgressByCharacter =>
      read(backend, STORAGE_KEYS.progress, validateProgressByCharacter, defaultProgressByCharacter),
    saveProgress: (p: ProgressByCharacter): void =>
      write(backend, STORAGE_KEYS.progress, p),
  };
}

/** createStorage の返り値（load/save の束）。DOM の Storage 型と区別するため別名で公開。 */
export type AppStorage = ReturnType<typeof createStorage>;

export type { StorageBackend } from './envelope.ts';
export {
  defaultRuleSettings,
  defaultAppSettings,
  defaultProgress,
  defaultProgressByCharacter,
} from './defaults.ts';
