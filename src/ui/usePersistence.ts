import { useRef, useState } from 'react';
import type {
  RuleSettings,
  AppSettings,
  Progress,
  ProgressByCharacter,
} from '../types/index.ts';
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
      setProgressState((prev) => {
        const merged = { ...prev, [characterId]: next };
        storage.saveProgress(merged); // 即時反映＋保存
        return merged;
      });
    },
  };
}
