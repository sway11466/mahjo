import type { AppSettings, Character } from '../../types/index.ts';
import { SettingsLayout } from './SettingsLayout.tsx';
import { SettingRow } from './SettingRow.tsx';
import { ToggleSwitch } from './ToggleSwitch.tsx';
import './settings.css';

interface AppSettingsScreenProps {
  appSettings: AppSettings;
  onChange: (next: AppSettings) => void;
  /** 左に立ち続ける選択中キャラ。 */
  character: Character;
  onBack: () => void;
}

/**
 * アプリ設定（screens.md §5・AppSettings）。採点に効かない UX 設定。
 *
 * 当面は全項目が未配線（音の再生＝parking lot、呼び方の差し込み・牌のランダム並びも未実装）なので
 * 操作不可にし「機能追加予定」を添える（値は保存・復元される＝feature-2 の方針）。配線が入った項目から
 * 順に編集可へ昇格する。キャラ選択（selectedCharacterId）はキャラクター選択画面が持つ（§4・feature-1）。
 */
export function AppSettingsScreen({
  appSettings,
  onChange: _onChange,
  character,
  onBack,
}: AppSettingsScreenProps) {
  // 全項目 disabled の間は onChange を呼ばない（配線済み項目を足すときに使う）。
  void _onChange;

  return (
    <SettingsLayout title="アプリ設定" character={character} onBack={onBack}>
      <div className="settings">
        <section className="settings__section">
          <h2 className="settings__section-title">機能追加予定</h2>

          <SettingRow
            soon
            title="効果音"
            description="正解・不正解・牌を置く音など（再生実装後に有効化予定）。"
            control={
              <ToggleSwitch label="効果音" checked={appSettings.se} disabled onChange={() => {}} />
            }
          />
          <SettingRow
            soon
            title="音楽（BGM）"
            description="学習中の BGM（再生実装後に有効化予定）。"
            control={
              <ToggleSwitch label="音楽" checked={appSettings.bgm} disabled onChange={() => {}} />
            }
          />
          <SettingRow
            soon
            title="呼び方"
            description="キャラのセリフに差し込む、あなたの呼び方（差し込み実装後に有効化予定）。"
            control={
              <span className="setting-value">
                {appSettings.playerName || '（未設定）'}
              </span>
            }
          />
          <SettingRow
            soon
            title="牌のランダム並び"
            description="手牌を正準順でなくランダムに並べて表示（実装後に有効化予定）。"
            control={
              <ToggleSwitch
                label="牌のランダム並び"
                checked={appSettings.randomTileOrder}
                disabled
                onChange={() => {}}
              />
            }
          />
        </section>
      </div>
    </SettingsLayout>
  );
}
