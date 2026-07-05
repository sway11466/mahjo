import type {
  RuleSettings,
  AppSettings,
  Progress,
  ProgressByCharacter,
  MissHistory,
} from '../types/index.ts';

/**
 * 永続化対象の既定値ファクトリ（storage.md §2,5）。読込フォールバック（envelope.read）と
 * アプリ初期値で共有する単一出所。値の正：RuleSettings＝scoring-rules.md §5、
 * AppSettings／Progress＝data-model.md §15,16。
 *
 * storage は types のみに依存する（characters を import しない）。selectedCharacterId の既定は
 * characters レジストリの defaultCharacterId（'mao'）と一致させるが、ここではリテラルで持つ。
 * 未知 id は読込側（App の getCharacter）が既定キャラへフォールバックするので、非空であればよい。
 */
export function defaultRuleSettings(): RuleSettings {
  return {
    kuitan: true,
    atozuke: true,
    akaDoraCount: 0,
    kiriageMangan: false,
    kazoeYakuman: false,
    doubleYakuman: false,
    rareYaku: false,
    round: 'random',
    enabledYaku: {},
  };
}

export function defaultAppSettings(): AppSettings {
  return {
    selectedCharacterId: 'mao',
    playerName: '',
    se: true,
    bgm: false,
    randomTileOrder: false,
  };
}

export function defaultProgress(): Progress {
  return { correctTotal: 0, correctByMode: {} };
}

export function defaultProgressByCharacter(): ProgressByCharacter {
  return {};
}

export function defaultMissHistory(): MissHistory {
  return {};
}
