import { useRef, useState } from 'react';
import type {
  RuleSettings,
  AppSettings,
  Progress,
  ProgressByCharacter,
  StudyMode,
  MissRecord,
  MissHistory,
} from '../types/index.ts';
import { appendMiss } from '../session/index.ts';
import { createStorage, type AppStorage } from '../storage/index.ts';

/**
 * 永続化の合成点（storage.md §7）。「起動時 load → state、変化で save」の橋渡しだけを担う。
 * 画面コンポーネントは storage を直接 import せず、このフック越しに使う（永続化の知識を ui に散らさない）。
 *
 * 対象は設定（RuleSettings／AppSettings）と進捗（ProgressByCharacter）。進捗はキャラ別の真実を
 * ここ（ProgressByCharacter）に集約し、App は現在キャラのスライス（Progress）を導出して使う。
 */
export interface Persistence {
  rules: RuleSettings;
  setRules: (next: RuleSettings) => void;
  appSettings: AppSettings;
  setAppSettings: (next: AppSettings) => void;
  /** キャラ別の進捗（真実）。App は現在キャラ id でスライスを引く（無ければ既定）。 */
  progressByCharacter: ProgressByCharacter;
  /** 指定キャラの進捗を更新して保存する（正解加算後の Progress を書き戻す）。 */
  setProgressForCharacter: (characterId: string, next: Progress) => void;
  /** キャラ別×モード別の間違い履歴（data-model §16）。出口（寄り添い・復習）は未実装＝当面書くだけ。 */
  missHistory: MissHistory;
  /** 誤答1件を指定キャラ・モードの履歴へ追記して保存する（直近 MISS_HISTORY_CAP 件のリングバッファ）。 */
  recordMissForCharacter: (characterId: string, mode: StudyMode, record: MissRecord) => void;
}

export function usePersistence(): Persistence {
  // storage は1回だけ作る（backend は既定の localStorage）。
  const storageRef = useRef<AppStorage | null>(null);
  if (!storageRef.current) storageRef.current = createStorage();
  const storage = storageRef.current;

  // 起動時に load した値を初期 state に（lazy initializer で1回だけ）。
  const [rules, setRulesState] = useState<RuleSettings>(() => storage.loadRules());
  const [appSettings, setAppState] = useState<AppSettings>(() =>
    storage.loadAppSettings(),
  );
  const [progressByCharacter, setProgressState] = useState<ProgressByCharacter>(
    () => storage.loadProgress(),
  );
  const [missHistory, setMissState] = useState<MissHistory>(() => storage.loadMisses());

  return {
    rules,
    setRules: (next) => {
      setRulesState(next);
      storage.saveRules(next); // 即時反映＋保存（screens.md §5）
    },
    appSettings,
    setAppSettings: (next) => {
      setAppState(next);
      storage.saveAppSettings(next);
    },
    progressByCharacter,
    setProgressForCharacter: (characterId, next) => {
      // updater は純粋に保つ（StrictMode は updater を2重実行する）＝保存は setState の外で。
      const merged = { ...progressByCharacter, [characterId]: next };
      setProgressState(merged);
      storage.saveProgress(merged); // 即時反映＋保存
    },
    missHistory,
    recordMissForCharacter: (characterId, mode, record) => {
      // 追記ロジック（リングバッファ）は session の純ヘルパ、ここは state＋保存の橋渡しのみ。
      const merged = appendMiss(missHistory, characterId, mode, record);
      setMissState(merged);
      storage.saveMisses(merged);
    },
  };
}
