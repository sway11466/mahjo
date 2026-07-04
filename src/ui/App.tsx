import { useRef, useState } from 'react';
import type { Progress, StudyMode } from '../types/index.ts';
import { mulberry32, type Rng } from '../engine/rng.ts';
import { getCharacter } from '../characters/index.ts';
// App は永続化の合成点＝「画面コンポーネントは storage を直接 import しない」規約の対象外
// （既定値ヘルパの参照のみ可。storage.md §7）。
import { defaultProgress } from '../storage/index.ts';
import { usePersistence } from './usePersistence.ts';
import { StartScreen } from './start/StartScreen.tsx';
import { MainScreen } from './main/MainScreen.tsx';
import { CharacterScreen } from './settings/CharacterScreen.tsx';
import { RuleSettingsScreen } from './settings/RuleSettingsScreen.tsx';
import { AppSettingsScreen } from './settings/AppSettingsScreen.tsx';

// いまどの画面か（screens.md §1）。メイン画面は選んだ mode を伴う。
type Screen = 'start' | 'main' | 'character' | 'rule-settings' | 'app-settings';

/**
 * 画面ルーター（screens.md §1）。rng・進捗・キャラ・ルール・現在画面を保持し、
 * スタート／メイン／キャラクター／設定を切り替える。各画面は描画＋dispatch に徹する。
 */
export function App() {
  // rng はセッションをまたいで進める乱数列。再レンダーで作り直さないよう ref に保持。
  const rngRef = useRef<Rng | null>(null);
  if (!rngRef.current) rngRef.current = mulberry32((Date.now() & 0xffffffff) >>> 0);
  const rng = rngRef.current;

  // 設定・進捗は storage から load → 変化で save（feature-2/feature-7・storage.md §7）。
  const {
    rules,
    setRules,
    appSettings,
    setAppSettings,
    progressByCharacter,
    setProgressForCharacter,
  } = usePersistence();

  // キャラは選択中 id から引く（未知 id は既定へフォールバック）。選択 UI は feature-1。
  const character = getCharacter(appSettings.selectedCharacterId);

  // 進捗の真実はキャラ別（ProgressByCharacter）。現在キャラのスライスを導出して使う
  // （無ければ既定）。キャラ切替で自動的にそのキャラの進捗へ追従する（同期不要）。
  const progress: Progress = progressByCharacter[character.id] ?? defaultProgress();
  const setProgress = (p: Progress) =>
    setProgressForCharacter(character.id, p);

  const [screen, setScreen] = useState<Screen>('start');
  const [mode, setMode] = useState<StudyMode>('yaku');

  const goStart = () => setScreen('start');

  if (screen === 'main') {
    return (
      <MainScreen
        mode={mode}
        character={character}
        progress={progress}
        setProgress={setProgress}
        rng={rng}
        rules={rules}
        onExit={goStart}
      />
    );
  }
  if (screen === 'character') {
    return (
      <CharacterScreen
        character={character}
        progress={progress}
        onSelectCharacter={(id) =>
          setAppSettings({ ...appSettings, selectedCharacterId: id })
        }
        onBack={goStart}
      />
    );
  }
  if (screen === 'rule-settings') {
    return (
      <RuleSettingsScreen
        rules={rules}
        onChange={setRules}
        character={character}
        onBack={goStart}
      />
    );
  }
  if (screen === 'app-settings') {
    return (
      <AppSettingsScreen
        appSettings={appSettings}
        onChange={setAppSettings}
        character={character}
        onBack={goStart}
      />
    );
  }

  return (
    <StartScreen
      character={character}
      onStart={(m) => {
        setMode(m);
        setScreen('main');
      }}
      onCharacter={() => setScreen('character')}
      onRuleSettings={() => setScreen('rule-settings')}
      onAppSettings={() => setScreen('app-settings')}
    />
  );
}
