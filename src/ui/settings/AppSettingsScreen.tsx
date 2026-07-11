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
 * 配線が入った項目から編集可へ昇格する（値は保存・復元される＝feature-2 の方針）。
 * 現状：BGM は配線済み（再生＝src/ui/audio・sound.md「BGM の実現方式」）＝編集可。
 * 効果音・呼び方・牌のランダム並びは未実装なので操作不可にし「機能追加予定」を添える。
 * キャラ選択（selectedCharacterId）はキャラクター選択画面が持つ（§4・feature-1）。
 */
export function AppSettingsScreen({
  appSettings,
  onChange,
  character,
  onBack,
}: AppSettingsScreenProps) {
  return (
    <SettingsLayout title="アプリ設定" character={character} onBack={onBack}>
      <div className="settings">
        <section className="settings__section">
          <h2 className="settings__section-title">サウンド</h2>

          <SettingRow
            title="音楽（BGM）"
            description="学習中に、選択中のキャラクターの BGM を流します（既定オフ）。"
            control={
              <ToggleSwitch
                label="音楽"
                checked={appSettings.bgm}
                onChange={(v) => onChange({ ...appSettings, bgm: v })}
              />
            }
          />
          <SettingRow
            soon
            title="効果音"
            description="正解・不正解・牌を置く音など（再生実装後に有効化予定）。"
            control={
              <ToggleSwitch label="効果音" checked={appSettings.se} disabled onChange={() => {}} />
            }
          />
        </section>

        <section className="settings__section">
          <h2 className="settings__section-title">機能追加予定</h2>

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
