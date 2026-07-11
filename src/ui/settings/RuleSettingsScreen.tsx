import type { Character, RuleSettings } from '../../types/index.ts';
import { SettingsLayout } from './SettingsLayout.tsx';
import { SettingRow } from './SettingRow.tsx';
import { ToggleSwitch } from './ToggleSwitch.tsx';
import { EnabledYakuField } from './EnabledYakuField.tsx';
import './settings.css';

interface RuleSettingsScreenProps {
  rules: RuleSettings;
  onChange: (next: RuleSettings) => void;
  /** 左に立ち続ける選択中キャラ。 */
  character: Character;
  onBack: () => void;
}

/**
 * ルール設定（screens.md §5・scoring-rules.md §5）。採点・出題に効く項目を編集（即時反映＋保存）。
 *
 * 現状エンジンに効いていない項目（後付け・レア役）は操作不可にし「機能追加予定」を
 * 添える（feature-2 の方針：UI は出すが現値固定、値は保存される）。
 */
/** 赤ドラ枚数の選択肢：0〜12 の任意枚数（scoring-rules §5。上限12＝5の牌の物理枚数） */
const AKA_DORA_OPTIONS = Array.from({ length: 13 }, (_, i) => i);

export function RuleSettingsScreen({
  rules,
  onChange,
  character,
  onBack,
}: RuleSettingsScreenProps) {
  const set = <K extends keyof RuleSettings>(key: K, value: RuleSettings[K]) =>
    onChange({ ...rules, [key]: value });

  return (
    <SettingsLayout title="ルール設定" character={character} onBack={onBack}>
      <div className="settings">
          <section className="settings__section">
            <h2 className="settings__section-title">採点</h2>

            <SettingRow
              title="喰いタン"
              description="副露（フーロ）した手でも断幺九（タンヤオ）を認める。"
              control={
                <ToggleSwitch
                  label="喰いタン"
                  checked={rules.kuitan}
                  onChange={(v) => set('kuitan', v)}
                />
              }
            />
            <SettingRow
              title="赤ドラ枚数"
              description="赤牌（赤5）を出題に混ぜる上限。手にあれば1枚ごとに1翻。"
              control={
                <select
                  className="setting-select"
                  aria-label="赤ドラ枚数"
                  value={rules.akaDoraCount}
                  onChange={(e) => set('akaDoraCount', Number(e.target.value))}
                >
                  {AKA_DORA_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} 枚
                    </option>
                  ))}
                </select>
              }
            />
            <SettingRow
              title="切り上げ満貫"
              description="4翻30符・3翻60符を満貫として扱う。"
              control={
                <ToggleSwitch
                  label="切り上げ満貫"
                  checked={rules.kiriageMangan}
                  onChange={(v) => set('kiriageMangan', v)}
                />
              }
            />
            <SettingRow
              title="数え役満"
              description="13翻以上を役満として扱う（オフは三倍満どまり）。"
              control={
                <ToggleSwitch
                  label="数え役満"
                  checked={rules.kazoeYakuman}
                  onChange={(v) => set('kazoeYakuman', v)}
                />
              }
            />
            <SettingRow
              title="ダブル役満・役満複合"
              description="複数の役満を加算し、もとからダブル役満の手を2倍にする。"
              control={
                <ToggleSwitch
                  label="ダブル役満・役満複合"
                  checked={rules.doubleYakuman}
                  onChange={(v) => set('doubleYakuman', v)}
                />
              }
            />
          </section>

          <section className="settings__section">
            <h2 className="settings__section-title">出題する役</h2>
            <EnabledYakuField
              enabledYaku={rules.enabledYaku}
              onChange={(v) => set('enabledYaku', v)}
            />
          </section>

          <section className="settings__section">
            <h2 className="settings__section-title">機能追加予定</h2>

            <SettingRow
              soon
              title="後付け（片和了）"
              description="後付け・片和了の可否（出題生成に反映予定）。"
              control={
                <ToggleSwitch label="後付け" checked={rules.atozuke} disabled onChange={() => {}} />
              }
            />
            <SettingRow
              soon
              title="レア役"
              description="流し満貫・人和・大車輪などを有効化（出題生成に反映予定）。"
              control={
                <ToggleSwitch label="レア役" checked={rules.rareYaku} disabled onChange={() => {}} />
              }
            />
          </section>
        </div>
    </SettingsLayout>
  );
}
