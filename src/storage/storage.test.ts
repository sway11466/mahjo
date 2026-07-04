import { createStorage, STORAGE_KEYS, type StorageBackend } from './index.ts';
import {
  defaultRuleSettings,
  defaultAppSettings,
  defaultProgressByCharacter,
} from './defaults.ts';
import { SCHEMA_VERSION } from './envelope.ts';
import type { RuleSettings, AppSettings, ProgressByCharacter } from '../types/index.ts';

/** テスト用インメモリ backend（storage.md §6,8）。 */
function memoryBackend(seed: Record<string, string> = {}): StorageBackend & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...seed };
  return {
    store,
    getItem: (k) => (k in store ? store[k]! : null),
    setItem: (k, v) => {
      store[k] = v;
    },
    removeItem: (k) => {
      delete store[k];
    },
  };
}

function envelope(data: unknown, version = SCHEMA_VERSION): string {
  return JSON.stringify({ schemaVersion: version, data });
}

describe('storage — ラウンドトリップ', () => {
  it('rules を save → load で同値', () => {
    const s = createStorage(memoryBackend());
    const rules: RuleSettings = {
      ...defaultRuleSettings(),
      kuitan: false,
      kiriageMangan: true,
      akaDoraCount: 3,
      enabledYaku: { tanyao: false, pinfu: true },
    };
    s.saveRules(rules);
    expect(s.loadRules()).toEqual(rules);
  });

  it('appSettings を save → load で同値', () => {
    const s = createStorage(memoryBackend());
    const app: AppSettings = {
      ...defaultAppSettings(),
      playerName: 'りん',
      se: false,
      randomTileOrder: true,
    };
    s.saveAppSettings(app);
    expect(s.loadAppSettings()).toEqual(app);
  });

  it('progress を save → load で同値', () => {
    const s = createStorage(memoryBackend());
    const p: ProgressByCharacter = {
      mao: { correctTotal: 12, correctByMode: { yaku: 12 } },
    };
    s.saveProgress(p);
    expect(s.loadProgress()).toEqual(p);
  });

  it('progress（byTarget 付き）を save → load で同値', () => {
    const s = createStorage(memoryBackend());
    const p: ProgressByCharacter = {
      mao: {
        correctTotal: 5,
        correctByMode: { yaku: 5 },
        byTarget: { han: { seen: 8, correct: 5 }, score: { seen: 3, correct: 1 } },
      },
    };
    s.saveProgress(p);
    expect(s.loadProgress()).toEqual(p);
  });
});

describe('storage — 防御的読込', () => {
  it('キー無しは既定値', () => {
    const s = createStorage(memoryBackend());
    expect(s.loadRules()).toEqual(defaultRuleSettings());
    expect(s.loadAppSettings()).toEqual(defaultAppSettings());
    expect(s.loadProgress()).toEqual(defaultProgressByCharacter());
  });

  it('壊れた JSON は既定値', () => {
    const s = createStorage(memoryBackend({ [STORAGE_KEYS.rules]: '{ broken' }));
    expect(s.loadRules()).toEqual(defaultRuleSettings());
  });

  it('エンベロープでない（生データ）は既定値', () => {
    const s = createStorage(
      memoryBackend({ [STORAGE_KEYS.app]: JSON.stringify({ se: false }) }),
    );
    expect(s.loadAppSettings()).toEqual(defaultAppSettings());
  });

  it('未対応の schemaVersion は既定値', () => {
    const s = createStorage(
      memoryBackend({ [STORAGE_KEYS.rules]: envelope(defaultRuleSettings(), 999) }),
    );
    expect(s.loadRules()).toEqual(defaultRuleSettings());
  });
});

describe('storage — 欠けたフィールドの補完', () => {
  it('rules の一部欠けは既定で埋まる', () => {
    const s = createStorage(
      memoryBackend({ [STORAGE_KEYS.rules]: envelope({ kuitan: false }) }),
    );
    expect(s.loadRules()).toEqual({ ...defaultRuleSettings(), kuitan: false });
  });

  it('rules の不正な型は既定で埋まる', () => {
    const s = createStorage(
      memoryBackend({
        [STORAGE_KEYS.rules]: envelope({
          akaDoraCount: 'three',
          round: 'bogus',
          enabledYaku: { tanyao: 'no', pinfu: false },
        }),
      }),
    );
    const loaded = s.loadRules();
    expect(loaded.akaDoraCount).toBe(0);
    expect(loaded.round).toBe('random');
    // boolean でない enabledYaku エントリは捨て、boolean のみ残る
    expect(loaded.enabledYaku).toEqual({ pinfu: false });
  });

  it('akaDoraCount の範囲外・非整数は既定へ（有効域は 0〜12 の整数）', () => {
    // 上限12＝5の牌の物理枚数（各色4枚×3色）。負数・巨大値・小数は壊れた保存データとして既定に落とす。
    const load = (v: unknown) =>
      createStorage(
        memoryBackend({ [STORAGE_KEYS.rules]: envelope({ akaDoraCount: v }) }),
      ).loadRules().akaDoraCount;
    expect(load(-1)).toBe(0);
    expect(load(999)).toBe(0);
    expect(load(1.5)).toBe(0);
    expect(load(3)).toBe(3); // 有効値はそのまま
    expect(load(12)).toBe(12); // 上限ちょうどは有効
  });

  it('appSettings の空 selectedCharacterId は既定キャラへ', () => {
    const s = createStorage(
      memoryBackend({ [STORAGE_KEYS.app]: envelope({ selectedCharacterId: '' }) }),
    );
    expect(s.loadAppSettings().selectedCharacterId).toBe(
      defaultAppSettings().selectedCharacterId,
    );
  });

  it('progress の不正な correctByMode は捨てる', () => {
    const s = createStorage(
      memoryBackend({
        [STORAGE_KEYS.progress]: envelope({
          mao: { correctTotal: 5, correctByMode: { yaku: 5, bogus: 9 } },
        }),
      }),
    );
    expect(s.loadProgress()).toEqual({
      mao: { correctTotal: 5, correctByMode: { yaku: 5 } },
    });
  });

  it('progress の byTarget は型の合う種類だけ残し、空ならキーを付けない', () => {
    const s = createStorage(
      memoryBackend({
        [STORAGE_KEYS.progress]: envelope({
          mao: {
            correctTotal: 3,
            correctByMode: { yaku: 3 },
            byTarget: {
              han: { seen: 4, correct: 3 }, // 正常＝採用
              score: { seen: 'x' }, // 不正＝捨てる
              yaku: { seen: 1, correct: 1 }, // 廃止した種類（旧4値時代の保存）＝無視
            },
          },
          rin: { correctTotal: 0, correctByMode: {}, byTarget: {} }, // 空 byTarget はキーを付けない
        }),
      }),
    );
    expect(s.loadProgress()).toEqual({
      mao: {
        correctTotal: 3,
        correctByMode: { yaku: 3 },
        byTarget: { han: { seen: 4, correct: 3 } },
      },
      rin: { correctTotal: 0, correctByMode: {} },
    });
  });
});

describe('storage — 書込失敗でも落ちない', () => {
  it('setItem が投げても save は例外を漏らさない', () => {
    const backend: StorageBackend = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
      removeItem: () => {},
    };
    const s = createStorage(backend);
    expect(() => s.saveRules(defaultRuleSettings())).not.toThrow();
  });

  it('getItem が投げても load は既定値を返す', () => {
    const backend: StorageBackend = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
      removeItem: () => {},
    };
    const s = createStorage(backend);
    expect(s.loadRules()).toEqual(defaultRuleSettings());
  });
});
