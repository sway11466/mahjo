import type { RuleSettings } from '../../types/index.ts';
import { YAKU_TABLE, yakuDisplayName, type ScoredYakuId } from '../../engine/yaku-table.ts';
import { seedIds } from '../../engine/generate.ts';
import {
  YAKU_REFERENCE,
  type YakuDifficulty,
} from '../main/yaku-list/yakuReference.ts';
import { ToggleSwitch } from './ToggleSwitch.tsx';

interface EnabledYakuFieldProps {
  enabledYaku: RuleSettings['enabledYaku'];
  onChange: (next: RuleSettings['enabledYaku']) => void;
}

const ALL_IDS = Object.keys(YAKU_TABLE) as ScoredYakuId[];
// 生成のシードになりうる役（構築器あり）。出題が必ず1問は作れるよう、最低1つは残す（後述のガード）。
const SEED_SET = new Set<string>(seedIds());

// 難易度（理解の見抜きやすさ軸）でグルーピング。順序は yakuReference の difficulty に合わせる。
const GROUP_ORDER: Exclude<YakuDifficulty, 'レア'>[] = ['初級', '中級', '上級', '役満'];

function isEnabled(map: RuleSettings['enabledYaku'], id: string): boolean {
  return map[id as keyof RuleSettings['enabledYaku']] !== false; // 未指定＝オン
}

/**
 * 出題する役の範囲（`RuleSettings.enabledYaku`）。難易度ごとにグルーピングしたトグル群。
 * オフにした役は出題・判定から外れる（scoring-rules.md §5）。
 *
 * ガード：出題が必ず1問作れるよう、シード役（構築器あり）を全部オフにはできない
 * （最後の1つはトグルを無効化）。これで生成器が空プールで失敗するのを防ぐ（generate.ts §防御）。
 */
export function EnabledYakuField({ enabledYaku, onChange }: EnabledYakuFieldProps) {
  const enabledSeedCount = ALL_IDS.filter(
    (id) => SEED_SET.has(id) && isEnabled(enabledYaku, id),
  ).length;

  const toggle = (id: ScoredYakuId, next: boolean) => {
    onChange({ ...enabledYaku, [id]: next });
  };

  return (
    <div className="enabled-yaku">
      {GROUP_ORDER.map((difficulty) => {
        const ids = ALL_IDS.filter(
          (id) => YAKU_REFERENCE[id].difficulty === difficulty,
        );
        const onCount = ids.filter((id) => isEnabled(enabledYaku, id)).length;
        return (
          <section key={difficulty} className="enabled-yaku__group">
            <header className="enabled-yaku__group-head">
              <span className="enabled-yaku__group-title">{difficulty}</span>
              <span className="enabled-yaku__group-count">
                {onCount} / {ids.length}
              </span>
            </header>
            <ul className="enabled-yaku__list">
              {ids.map((id) => {
                const on = isEnabled(enabledYaku, id);
                // 最後のシード役はオフにできない（出題が作れなくなるため）。
                const isLastSeed = SEED_SET.has(id) && on && enabledSeedCount === 1;
                return (
                  <li key={id} className="enabled-yaku__item">
                    <span
                      className="enabled-yaku__name"
                      title={YAKU_REFERENCE[id].condition}
                    >
                      {yakuDisplayName(YAKU_TABLE[id])}
                    </span>
                    <ToggleSwitch
                      checked={on}
                      disabled={isLastSeed}
                      onChange={(v) => toggle(id, v)}
                      label={yakuDisplayName(YAKU_TABLE[id])}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <p className="enabled-yaku__note">
        オフにした役は出題・採点から外れます。出題を作るため、最低1つは残ります。
      </p>
    </div>
  );
}
