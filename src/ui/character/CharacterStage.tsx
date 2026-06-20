import './CharacterStage.css';

/** 会話窓の右下に出す操作ボタン（次へ／解説を見る／次の設問へ 等）。 */
export interface StageAction {
  label: string;
  onClick: () => void;
}

/** 解説ウォークスルーで積み上げる内訳バッジ（既に説明済みの翻/符）。
 *  複雑な手でも「ここまで何翻・何符」を見失わないための累積表示（screens.md §3）。 */
export interface StageBadge {
  text: string; // 例 "平和 1翻" / "副底 20符"
  unit: 'han' | 'fu'; // トーン分け（翻＝金／符＝キャラ色）
  current: boolean; // いま説明中（最新）のものを強調
}

interface CharacterStageProps {
  /** キャラの表示名（名札に出す） */
  name: string;
  /** いま喋っているセリフ（場面セリフ／ヒント段／解説文） */
  line: string;
  /** 立ち絵画像（無いときはプレースホルダ） */
  avatarSrc?: string | undefined;
  /** ヒントボタンを出すか（未回答かつ開ける段が残っているとき） */
  showHint?: boolean;
  /** ヒントボタン押下（段階ヒントを1段ずつ開く） */
  onHint?: () => void;
  /** ヒントボタンに乗せる使い魔アイコンの URL（ヒントは使い魔が出す＝decisions.md 2026-06-10）。
   *  未配置（undefined）なら「ヒント」テキストのみ。装飾扱いで、ボタンのアクセシブル名は「ヒント」に保つ。 */
  hintIconSrc?: string | undefined;
  /** 会話窓の右下に出す操作（ノベルゲームの送り位置）。空なら出さない。 */
  actions?: StageAction[];
  /** 解説中に積み上げる内訳バッジ（既出の翻/符）。空なら出さない。 */
  badges?: StageBadge[];
}

/**
 * 画面下部に常設するキャラクターの立ち絵＋会話窓（ノベルゲーム風）。
 * 構造は TSX、見た目は CharacterStage.css（architecture.md §5）。
 * セリフ・表情・操作は session の view-state ＋ App から渡る（描画専任）。
 */
export function CharacterStage({
  name,
  line,
  avatarSrc,
  showHint,
  onHint,
  hintIconSrc,
  actions = [],
  badges = [],
}: CharacterStageProps) {
  return (
    <section className="stage" aria-label="キャラクター">
      <div className="stage__avatar">
        {avatarSrc ? (
          <img className="stage__avatar-img" src={avatarSrc} alt={name} />
        ) : (
          <div className="stage__avatar-ph" aria-hidden="true">
            立ち絵
          </div>
        )}
      </div>
      <div className="stage__panel">
        {/* 内訳バッジは会話枠の「外・上」に固定（本文の長さで位置が動かないように）。 */}
        {badges.length > 0 && (
          <div className="stage__badges" aria-label="ここまでの内訳">
            {badges.map((b, i) => (
              <span
                key={i}
                className={
                  'stage__badge stage__badge--' +
                  b.unit +
                  (b.current ? ' stage__badge--current' : '')
                }
              >
                {b.text}
              </span>
            ))}
          </div>
        )}
        <div className="stage__dialogue">
        {/* 名札＋本文をひとまとめのスクロール枠に包む（低い画面では名札も本文と一緒にスクロール、
            ボタンだけ枠外で固定）。base では CSS を当てないので素の block＝描画は不変。 */}
        <div className="stage__dialogue-scroll">
          <div className="stage__dialogue-head">
          <div className="stage__name">{name}</div>
          {/* ヒントボタンは常に場所を確保し、出さないときは不可視＋不活性に
              （名札の位置が状況で動かないように。表示有無でレイアウトを変えない） */}
          <button
            type="button"
            className="stage__hint-btn"
            onClick={onHint}
            disabled={!showHint}
            aria-hidden={!showHint}
            style={showHint ? undefined : { visibility: 'hidden' }}
          >
            {hintIconSrc && (
              <img
                className="stage__hint-icon"
                src={hintIconSrc}
                alt=""
                aria-hidden="true"
              />
            )}
            ヒント
          </button>
        </div>
        <p className="stage__line">{line}</p>
        </div>
        {actions.length > 0 && (
          <div className="stage__actions">
            {actions.map((a, i) => (
              <button
                type="button"
                className="stage__action"
                key={i}
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
