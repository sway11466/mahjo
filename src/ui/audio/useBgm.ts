/**
 * BGM コントローラ（React フック）。App ルートで動き、AppSettings.bgm と選択キャラの楽譜データだけを
 * 見て、アプリ全体で1本の BGM を鳴らす（画面遷移の外側なので通し再生）。architecture §2：
 * 「どう鳴らすか」は ui、「何を鳴らすか」は characters のデータ。sound.md「BGM の実現方式」。
 *
 * 挙動：
 * - 開始点は最初のユーザー操作（autoplay 制限）。AudioContext は suspended で作り resume する。
 * - キャラ切替（bgm 参照が変わる）で旧→新をクロスフェード。
 * - トグル off / 楽譜なしキャラで停止（無音）。
 */
import { useEffect, useRef } from 'react';
import type { BgmData } from '../../types/index.ts';
import { createPlayer, type Player } from './player.ts';

const FADE_IN = 0.8;
const FADE_OUT = 0.4;

export function useBgm(enabled: boolean, bgm: BgmData | undefined): void {
  const ctxRef = useRef<AudioContext | null>(null);

  // AudioContext は unmount で閉じる（作るのは再生が要るときだけ）。
  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !bgm) return; // 停止は前回 effect の cleanup が担う

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
      player = createPlayer(ctx, bgm);
      player.fadeTo(1, FADE_IN);
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
  }, [enabled, bgm]);
}
