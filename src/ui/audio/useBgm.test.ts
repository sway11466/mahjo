/**
 * useBgm の進行（フェッチ→デコード→ループ再生→停止、autoplay 解禁待ち）を、Web Audio と fetch を
 * 偽物に差し替えて決定的に確かめる。音そのものの確認は人手（testing.md §6）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useBgm } from './useBgm.ts';

// ---- 偽 Web Audio ---------------------------------------------------------
class FakeParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((v: number) => {
    this.value = v;
  });
  linearRampToValueAtTime = vi.fn((v: number) => {
    this.value = v;
  });
}
class FakeNode {
  connect = vi.fn();
  disconnect = vi.fn();
}
class FakeGain extends FakeNode {
  gain = new FakeParam();
}
class FakeSource extends FakeNode {
  buffer: unknown = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  start = vi.fn();
  stop = vi.fn();
}
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: 'suspended' | 'running' = 'running';
  currentTime = 0;
  destination = {};
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  decoded: ArrayBuffer[] = [];
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  resume = vi.fn(async () => {
    // ブラウザは操作前の resume を黙って無視する＝state は変わらない。
  });
  close = vi.fn(async () => {});
  createGain() {
    const g = new FakeGain();
    this.gains.push(g);
    return g;
  }
  createBufferSource() {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  decodeAudioData = vi.fn(async (bytes: ArrayBuffer) => {
    this.decoded.push(bytes);
    return { duration: 80 } as AudioBuffer;
  });
}

const flush = () => act(async () => {});

beforeEach(() => {
  FakeAudioContext.instances = [];
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: !url.includes('missing'),
      status: url.includes('missing') ? 404 : 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ctx = () => FakeAudioContext.instances[0]!;

describe('useBgm', () => {
  it('オフ／音源なしでは AudioContext も fetch も作らない', async () => {
    type Props = { on: boolean; url: string | undefined };
    const { rerender } = renderHook((p: Props) => useBgm(p.on, p.url), {
      initialProps: { on: false, url: '/a.m4a' } as Props,
    });
    await flush();
    rerender({ on: true, url: undefined });
    await flush();
    expect(FakeAudioContext.instances).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('オン＋音源あり：fetch → decode → loop 再生 → フェードイン', async () => {
    renderHook(() => useBgm(true, '/mao-bgm.m4a'));
    await flush();
    expect(fetch).toHaveBeenCalledWith('/mao-bgm.m4a');
    expect(ctx().decodeAudioData).toHaveBeenCalledTimes(1);
    const src = ctx().sources[0]!;
    expect(src.loop).toBe(true);
    expect(src.start).toHaveBeenCalledTimes(1);
    // クロスフェード用ゲインは 0 から 1 へ
    const out = ctx().gains[0]!;
    expect(out.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
  });

  it('ループ範囲を渡すと loopStart/loopEnd に入る（イントロは初回だけ）', async () => {
    renderHook(() => useBgm(true, '/mao-bgm.m4a', { start: 6.4, end: 57.6 }));
    await flush();
    const src = ctx().sources[0]!;
    expect(src.loopStart).toBe(6.4);
    expect(src.loopEnd).toBe(57.6);
    // 再生は先頭（0 秒）から
    expect(src.start).toHaveBeenCalledWith();
  });

  it('ループ終端がバッファより長ければバッファ長で頭打ち、範囲が不正なら全体ループ', async () => {
    // 偽 decode の長さは 80 秒
    const { unmount } = renderHook(() => useBgm(true, '/a.m4a', { start: 6.4, end: 80.02 }));
    await flush();
    expect(ctx().sources[0]!.loopStart).toBe(6.4);
    expect(ctx().sources[0]!.loopEnd).toBe(80);
    unmount();

    FakeAudioContext.instances = [];
    renderHook(() => useBgm(true, '/b.m4a', { start: 90, end: 100 }));
    await flush();
    expect(ctx().sources[0]!.loopStart).toBe(0);
    expect(ctx().sources[0]!.loopEnd).toBe(0);
  });

  it('毎レンダーで新しい loop オブジェクトを渡しても鳴らし直さない', async () => {
    const { rerender } = renderHook(() => useBgm(true, '/mao-bgm.m4a', { start: 6.4, end: 57.6 }));
    await flush();
    rerender();
    await flush();
    expect(ctx().sources).toHaveLength(1);
  });

  it('トグルオフでフェードアウトして止める', async () => {
    const { rerender } = renderHook(({ on }: { on: boolean }) => useBgm(on, '/mao-bgm.m4a'), {
      initialProps: { on: true },
    });
    await flush();
    const src = ctx().sources[0]!;
    rerender({ on: false });
    await flush();
    expect(ctx().gains[0]!.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.any(Number));
    expect(src.stop).toHaveBeenCalledTimes(1);
  });

  it('キャラ切替（url 変更）で新しい音源を鳴らし、旧音源を止める（クロスフェード）', async () => {
    const { rerender } = renderHook(({ url }: { url: string }) => useBgm(true, url), {
      initialProps: { url: '/mao-bgm.m4a' },
    });
    await flush();
    rerender({ url: '/rin-bgm.m4a' });
    await flush();
    expect(fetch).toHaveBeenCalledWith('/rin-bgm.m4a');
    expect(ctx().sources).toHaveLength(2);
    expect(ctx().sources[0]!.stop).toHaveBeenCalled();
    expect(ctx().sources[1]!.start).toHaveBeenCalled();
    // 同じ AudioContext を使い続ける（切替ごとに作り直さない）
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('戻ってきた音源はデコードし直さない（キャッシュ）', async () => {
    const { rerender } = renderHook(({ url }: { url: string }) => useBgm(true, url), {
      initialProps: { url: '/mao-bgm.m4a' },
    });
    await flush();
    rerender({ url: '/rin-bgm.m4a' });
    await flush();
    rerender({ url: '/mao-bgm.m4a' });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(ctx().decodeAudioData).toHaveBeenCalledTimes(2);
    expect(ctx().sources).toHaveLength(3);
  });

  it('autoplay 未解禁（suspended）なら最初の操作まで待ち、操作で鳴り始める', async () => {
    vi.stubGlobal(
      'AudioContext',
      class extends FakeAudioContext {
        constructor() {
          super();
          this.state = 'suspended';
          this.resume = vi.fn(async () => {
            if (gestureSeen) this.state = 'running';
          });
        }
      },
    );
    let gestureSeen = false;
    renderHook(() => useBgm(true, '/mao-bgm.m4a'));
    await flush();
    expect(fetch).not.toHaveBeenCalled();

    gestureSeen = true;
    await act(async () => {
      window.dispatchEvent(new Event('pointerdown'));
    });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(ctx().sources[0]!.start).toHaveBeenCalled();
  });

  it('操作前の resume が保留のまま返らないブラウザ（Chrome）でも、次の操作で鳴り始める', async () => {
    vi.stubGlobal(
      'AudioContext',
      class extends FakeAudioContext {
        constructor() {
          super();
          this.state = 'suspended';
          // 操作前は promise を返したまま解決しない。操作後の resume は running にして解決する。
          this.resume = vi.fn(() =>
            gestureSeen
              ? Promise.resolve().then(() => {
                  this.state = 'running';
                })
              : new Promise<void>(() => {}),
          );
        }
      },
    );
    let gestureSeen = false;
    renderHook(() => useBgm(true, '/mao-bgm.m4a'));
    await flush();
    expect(fetch).not.toHaveBeenCalled();

    gestureSeen = true;
    await act(async () => {
      window.dispatchEvent(new Event('pointerdown'));
    });
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(ctx().sources[0]!.start).toHaveBeenCalled();
  });

  it('取得失敗（404）は無音のまま例外にしない', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderHook(() => useBgm(true, '/missing.m4a'));
    await flush();
    expect(ctx().sources).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });
});
