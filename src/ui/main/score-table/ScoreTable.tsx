import { useState } from 'react';
import { TABLE_FU, TABLE_HAN, cellFor, MANGAN_RANKS, manganCell, type ScoreCell } from './scoreTable.ts';
import './ScoreTable.css';

/**
 * 1マスの中身：ロン／ツモ子／ツモ親（親のツモはオール）をラベル左・数字右寄せで縦にそろえる。
 * 成立しない欄は「—」。本体グリッドと満貫以上の表で共有する。
 */
function CellContent({ ron, tsumo }: ScoreCell) {
  if (ron === null && tsumo === null) {
    return <span className="score-table__none">—</span>;
  }
  return (
    <span className="score-table__cell">
      {/* ロン行は常に出す（無い形は「—」）＝行をそろえる */}
      <span className="score-table__k">ロン</span>
      <span className={`score-table__v${ron === null ? ' score-table__v--none' : ''}`}>
        {ron !== null ? ron : '—'}
      </span>
      {tsumo?.kind === 'ko' && (
        <>
          <span className="score-table__k">ツモ（子払）</span>
          <span className="score-table__v">{tsumo.fromKo}</span>
          <span className="score-table__k">ツモ（親払）</span>
          <span className="score-table__v">{tsumo.fromOya}</span>
        </>
      )}
      {tsumo?.kind === 'oya' && (
        <>
          {/* 親ツモは全員（子）が同額。初心者向けに「オール」を使わず子払で示す */}
          <span className="score-table__k">ツモ（子払）</span>
          <span className="score-table__v">{tsumo.each}</span>
        </>
      )}
    </span>
  );
}

/**
 * 点数早見表の中身（表示専任・端末非依存）。子／親を切替え、符×翻→点数（ロン＋ツモの支払い）を
 * 一覧する。値は engine の scorePoints から動的算出（採点と一致）。包みは ReferenceOverlay 側。
 */
export function ScoreTable() {
  const [isDealer, setIsDealer] = useState(false);

  return (
    <div className="score-table">
      <section className="score-table__section">
        <h3 className="score-table__heading">点数の出し方</h3>
        <ol className="score-table__steps">
          <li>翻を数える（＝成立役。「役一覧」へ）。</li>
          <li>符を数える（「符の数え方」へ）。</li>
          <li>下の表で「符×翻」から点数を読む（5翻以上は符に依らず満貫〜役満）。</li>
        </ol>
        <p className="score-table__note">
          計算式（参考）：表の値は 基本点 <code>a ＝ 符 × 2^(2+翻)</code> を配分（子ロン{' '}
          <code>a×4</code>／子ツモ 親 <code>a×2</code>・子 <code>a×1</code>／親ロン <code>a×6</code>／
          親ツモ <code>a×2</code> オール）し、各支払いを100点単位で切り上げたもの。標準ルール（切り上げ満貫オフ）。
        </p>
      </section>

      <section className="score-table__section">
        <h3 className="score-table__heading">4翻以下</h3>
        <div className="score-table__tabs" role="tablist" aria-label="親子">
          <button
            type="button"
            role="tab"
            aria-selected={!isDealer}
            className={`score-table__tab${!isDealer ? ' score-table__tab--active' : ''}`}
            onClick={() => setIsDealer(false)}
          >
            子
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isDealer}
            className={`score-table__tab${isDealer ? ' score-table__tab--active' : ''}`}
            onClick={() => setIsDealer(true)}
          >
            親
          </button>
        </div>

        <div className="score-table__scroll">
          <table className="score-table__grid score-table__grid--main">
            <thead>
              <tr>
                <th scope="col">符＼翻</th>
                {TABLE_HAN.map((h) => (
                  <th key={h} scope="col">
                    {h}翻
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_FU.map((fu) => (
                <tr key={fu}>
                  <th scope="row">{fu}符</th>
                  {TABLE_HAN.map((han) => (
                    <td key={han}>
                      <CellContent {...cellFor(fu, han, isDealer)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="score-table__section">
        <h3 className="score-table__heading">5翻以上（符に依らない）</h3>
        <div className="score-table__scroll">
          <table className="score-table__grid">
            <thead>
              <tr>
                <th scope="col">区分</th>
                <th scope="col">子</th>
                <th scope="col">親</th>
              </tr>
            </thead>
            <tbody>
              {MANGAN_RANKS.map(({ label, han }) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>
                    <CellContent {...manganCell(han, false)} />
                  </td>
                  <td>
                    <CellContent {...manganCell(han, true)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
