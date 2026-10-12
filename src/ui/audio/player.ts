/**
 * BGM プレイヤー（Web Audio・IO 層）。音源ファイル（AAC `.m4a`）を取得・デコードし、
 * AudioBufferSourceNode の loop で継ぎ目なく鳴らす（sound.md「BGM の実現方式」・ADR-0004）。
 * ここは AudioContext 上のノード構築・ループ・クロスフェード用ゲインだけを持つ。
 * 「何を鳴らすか」（キャラ→音源パス）は characters のデータ＝architecture §2。
 */

export interface Player {
  /** クロスフェード：ゲインを target（0〜1）へ dur 秒で寄せる。 */
  fadeTo: (target: number, dur: number) => void;
  /** 停止：フェードアウトしてからノードを解放する。 */
  stop: (fadeSec?: number) => void;
}

/**
 * 音源 URL を取得してデコードする。失敗（404・デコード不可）は例外のまま投げる＝呼び出し側が無音にする。
 * fetch は注入可能（テスト用。既定は globalThis.fetch）。
 */
export async function loadBuffer(
  ctx: AudioContext,
  url: string,
  fetchFn: typeof fetch = (...args) => globalThis.fetch(...args),
): Promise<AudioBuffer> {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`BGM fetch failed: ${res.status} ${url}`);
  const bytes = await res.arrayBuffer();
  return ctx.decodeAudioData(bytes);
}

/**
 * デコード済みバッファをループ再生するプレイヤーを起動する。出力は専用のクロスフェード用ゲイン→destination
 * （0 から始めて fadeTo で上げる）。同じ ctx に複数プレイヤーを重ねられる（キャラ切替のクロスフェード）。
 * loopEnd（秒）を渡すとそこで折り返す（楽譜由来のループ長 L。省略時はバッファ末尾まで）。
 */
export function createPlayer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  loopEnd?: number,
): Player {
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ctx.destination);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  if (loopEnd !== undefined && loopEnd > 0 && loopEnd < buffer.duration) {
    source.loopEnd = loopEnd;
  }
  source.connect(out);
  source.start();

  const fadeTo = (target: number, dur: number) => {
    const now = ctx.currentTime;
    const cur = out.gain.value;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(cur, now);
    out.gain.linearRampToValueAtTime(target, now + Math.max(0.001, dur));
  };

  return {
    fadeTo,
    stop: (fadeSec = 0.3) => {
      fadeTo(0, fadeSec);
      // フェードが終わってから止めて解放する。
      source.stop(ctx.currentTime + fadeSec + 0.05);
      setTimeout(() => {
        source.disconnect();
        out.disconnect();
      }, Math.ceil((fadeSec + 0.1) * 1000));
    },
  };
}
