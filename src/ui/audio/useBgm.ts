/**
 * BGM コントローラ（React フック）。App ルートで動き、AppSettings.bgm と選択キャラの音源 URL だけを見て、
 * アプリ全体で1本の BGM を鳴らす（画面遷移の外側なので通し再生）。architecture §2：
 * 「どう鳴らすか」は ui、「何を鳴らすか」は characters のデータ。sound.md「BGM の実現方式」・ADR-0004。
 *
 * 挙動：
 * - 開始点は最初のユーザー操作（autoplay 制限）。AudioContext は suspended で作り resume する。
 * - 音源は fetch → decodeAudioData（デコード済みはキャッシュ。取得は Service Worker のランタイムキャッシュが担う）。
 * - キャラ切替（url が変わる）で旧→新をクロスフェード。
 * - トグル off / 曲なしキャラ（url なし）/ 取得失敗で停止（無音）。
 */
import { useEffect, useRef } from 'react';
import { createPlayer, loadBuffer, type LoopRange, type Player } from './player.ts';

const FADE_IN = 0.8;
const FADE_OUT = 0.4;

export function useBgm(enabled: boolean, url: string | undefined, loop?: LoopRange): void {
  const loopStart = loop?.start;
  const loopEnd = loop?.end;
  const ctxRef = useRef<AudioContext | null>(null);
  // デコード済みバッファのキャッシュ（url → Promise）。キャラを行き来しても再デコードしない。
  const buffersRef = useRef<Map<string, Promise<AudioBuffer>>>(new Map());

  // AudioContext は unmount で閉じる（作るのは再生が要るときだけ）。
  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !url) return; // 停止は前回 effect の cleanup が担う

    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return; // Web Audio 非対応環境は無音

    if (!ctxRef.current) ctxRef.current = new AC();
    const ctx = ctxRef.current;

    let player: Player | null = null;
    let canceled = false;
    let started = false;

    const start = () => {
      if (canceled || started) return;
      started = true;
      let p = buffersRef.current.get(url);
      if (!p) {
        p = loadBuffer(ctx, url);
        buffersRef.current.set(url, p);
      }
      p.then(
        (buffer) => {
          if (canceled) return;
          const range =
            loopStart !== undefined && loopEnd !== undefined
              ? { start: loopStart, end: loopEnd }
              : undefined;
          player = createPlayer(ctx, buffer, range);
          player.fadeTo(1, FADE_IN);
        },
        (err: unknown) => {
          buffersRef.current.delete(url); // 次回また試せるように
          console.warn('[bgm] load failed, staying silent:', err);
        },
      );
    };

    // resume 済みなら即開始。まだなら最初のユーザー操作を待つ（autoplay 解禁）。
    const onGesture = () => {
      ctx.resume().then(() => {
        if (!canceled) start();
      });
      removeGestureListeners();
    };
    const removeGestureListeners = () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };

    ctx
      .resume()
      .then(() => {
        if (canceled) return;
        if (ctx.state === 'running') start();
        else addGestureListeners();
      })
      .catch(() => {
        if (!canceled) addGestureListeners();
      });

    function addGestureListeners() {
      window.addEventListener('pointerdown', onGesture);
      window.addEventListener('keydown', onGesture);
    }

    return () => {
      canceled = true;
      removeGestureListeners();
      player?.stop(FADE_OUT);
    };
    // loop はオブジェクトなので値（秒）で依存を取る（毎レンダーの新しい参照で鳴らし直さない）。
  }, [enabled, url, loopStart, loopEnd]);
}
