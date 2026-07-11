import { createElement, StrictMode, type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import type { Progress } from '../types/index.ts';
import { createStorage } from '../storage/index.ts';
import { usePersistence } from './usePersistence.ts';

// usePersistence は既定 backend（globalThis.localStorage＝jsdom）を使う。各テスト前に消す。
beforeEach(() => localStorage.clear());

describe('usePersistence: 進捗（feature-7）', () => {
  const mao: Progress = { correctTotal: 3, correctByMode: { yaku: 2, score: 1 } };

  it('setProgressForCharacter で localStorage に保存される', () => {
    const { result } = renderHook(() => usePersistence());
    act(() => result.current.setProgressForCharacter('mao', mao));

    // 別経路（素の storage）でも読めれば、エンベロープに正しく書けている。
    expect(createStorage().loadProgress()).toEqual({ mao });
    expect(result.current.progressByCharacter).toEqual({ mao });
  });

  it('再マウント（リロード相当）で保存済みの進捗が復元される', () => {
    const first = renderHook(() => usePersistence());
    act(() => first.result.current.setProgressForCharacter('mao', mao));
    first.unmount();
    // フックを作り直すと load 経路で復元される。
    const { result } = renderHook(() => usePersistence());
    expect(result.current.progressByCharacter).toEqual({ mao });
  });

  it('StrictMode でも保存は1回（setState の updater 内で副作用を起こさない）', () => {
    // updater は純粋であるべき＝StrictMode（開発時）は updater を2重実行する。
    // 保存が updater 内にあると setItem が2回走る（冪等だが作法違反の検出器として数える）。
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children);
    const { result } = renderHook(() => usePersistence(), { wrapper });
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    act(() => result.current.setProgressForCharacter('mao', mao));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    expect(createStorage().loadProgress()).toEqual({ mao }); // 保存内容は従来どおり
  });

  it('キャラごとにスライスが分かれて保存される', () => {
    const rin: Progress = { correctTotal: 1, correctByMode: { yaku: 1 } };
    const { result } = renderHook(() => usePersistence());
    act(() => result.current.setProgressForCharacter('mao', mao));
    act(() => result.current.setProgressForCharacter('rin', rin));
    expect(result.current.progressByCharacter).toEqual({ mao, rin });
    expect(createStorage().loadProgress()).toEqual({ mao, rin });
  });
});
