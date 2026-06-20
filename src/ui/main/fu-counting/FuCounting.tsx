import {
  FU_SOURCES,
  MELD_FU,
  MELD_FU_COLUMNS,
  SHUNTSU_FU,
  MELD_FU_NOTES,
  FU_SPECIALS,
} from './fuReference.ts';
import './FuCounting.css';

/**
 * 「符の数え方」の中身（表示専任・端末非依存）。符の発生源・面子の符・特例を列挙する
 * （scoring-rules §2）。モーダル／全画面の包み方は呼び出し側（ReferenceOverlay）が決める。
 */
export function FuCounting() {
  return (
    <div className="fu-counting">
      <section className="fu-counting__section">
        <h3 className="fu-counting__heading">符の発生源</h3>
        <ul className="fu-counting__rows">
          {FU_SOURCES.map((s, i) => (
            <li key={i} className="fu-counting__row">
              <div className="fu-counting__row-head">
                <span className="fu-counting__name">{s.source}</span>
                <span className="fu-counting__fu">{s.fu}</span>
              </div>
              <p className="fu-counting__desc">{s.condition}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="fu-counting__section">
        <h3 className="fu-counting__heading">面子の符</h3>
        <div className="fu-counting__table-wrap">
          <table className="fu-counting__table">
            <thead>
              <tr>
                <th aria-label="面子"></th>
                {MELD_FU_COLUMNS.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{SHUNTSU_FU.meld}</th>
                {/* 順子は明暗・牌種で変わらないので全列をまたいで1つだけ示す */}
                <td colSpan={MELD_FU_COLUMNS.length}>{SHUNTSU_FU.label}</td>
              </tr>
              {MELD_FU.map((r) => (
                <tr key={r.meld}>
                  <th scope="row">{r.meld}</th>
                  {r.values.map((v, i) => (
                    <td key={i}>{v}符</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="fu-counting__notes">
          {MELD_FU_NOTES.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="fu-counting__section">
        <h3 className="fu-counting__heading">特例</h3>
        <ul className="fu-counting__rows">
          {FU_SPECIALS.map((s, i) => (
            <li key={i} className="fu-counting__row">
              <div className="fu-counting__row-head">
                <span className="fu-counting__name">{s.case}</span>
                <span className="fu-counting__fu">{s.fu}</span>
              </div>
              <p className="fu-counting__desc">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
