import type { CSSProperties } from 'react';
import type { Character, Progress } from '../../types/index.ts';
import { characters } from '../../characters/index.ts';
import { themeColorOf } from '../character/themeColor.ts';
import { avatarThumbUrl } from '../character/avatarAssets.ts';
import { SettingsLayout } from './SettingsLayout.tsx';
import './settings.css';

const HEART_COUNT = 5;
const PER_HEART = 10; // ハート1個＝10問正解
const MAX = HEART_COUNT * PER_HEART; // 満タン＝50問（screens.md §4）

// 標準的なハート形（viewBox 0 0 24 24）。塗り/輪郭の2層で部分点灯に使う。
const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/** 1個分のハート。fill=0..1 で左から部分点灯（10問ごとにカチッと埋まる）。 */
function Heart({ fill }: { fill: number }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <span className="char-heart" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="char-heart__base">
        <path d={HEART_PATH} />
      </svg>
      {/* 塗り層：左から pct% だけ見せる（inset で右側をクリップ） */}
      <svg
        viewBox="0 0 24 24"
        className="char-heart__fill"
        style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
      >
        <path d={HEART_PATH} />
      </svg>
    </span>
  );
}

interface CharacterScreenProps {
  /** 選択中キャラ（左に立ち続ける＋成績の対象）。 */
  character: Character;
  progress: Progress;
  /** キャラを選ぶ（AppSettings.selectedCharacterId を更新＝feature-1）。 */
  onSelectCharacter: (id: string) => void;
  onBack: () => void;
}

/**
 * キャラクター選択画面（screens.md §4）。設定画面と同じ2カラム土台（SettingsLayout）に載せ、
 * 左に選択中キャラの立ち絵・右に成績（ハートレーティング）＋キャラ一覧（サムネ）を置く。
 * サムネを押すと選択が切り替わり、立ち絵・テーマ色も即座に追従する（App が再描画）。
 * 成績は好感度として見せる（咎めない・お祝い止まり）。
 */
export function CharacterScreen({
  character,
  progress,
  onSelectCharacter,
  onBack,
}: CharacterScreenProps) {
  // 50問で上限（お祝い止まり）。伸び中の1個は端数で部分点灯。
  const eff = Math.min(progress.correctTotal, MAX);
  const hearts = Array.from({ length: HEART_COUNT }, (_, i) =>
    Math.max(0, Math.min(1, (eff - i * PER_HEART) / PER_HEART)),
  );

  return (
    <SettingsLayout title="キャラクター選択" character={character} onBack={onBack}>
      <div className="char-select">
        <section className="char-select__rating">
          <p className="char-select__rating-label">好感度</p>
          <div className="char-select__hearts">
            {hearts.map((f, i) => (
              <Heart key={i} fill={f} />
            ))}
          </div>
        </section>

        <section className="char-select__pick">
          <h2 className="settings__section-title">サポートキャラ</h2>
          <ul className="char-select__grid">
            {characters.map((c) => {
              const current = c.id === character.id;
              const thumb = avatarThumbUrl(c.id, c.avatar);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`char-card${current ? ' char-card--current' : ''}`}
                    aria-pressed={current}
                    style={{ '--card-glow': themeColorOf(c) } as CSSProperties}
                    onClick={() => onSelectCharacter(c.id)}
                  >
                    {thumb ? (
                      <img className="char-card__thumb" src={thumb} alt="" />
                    ) : (
                      <span className="char-card__thumb char-card__thumb--ph" aria-hidden="true">
                        {c.displayName.slice(0, 1)}
                      </span>
                    )}
                    <span className="char-card__name">{c.displayName}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </SettingsLayout>
  );
}
