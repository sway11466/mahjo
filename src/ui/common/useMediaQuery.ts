import { useEffect, useState } from 'react';

/**
 * メディアクエリの一致を購読する小さなフック（端末別の出し分けに使う）。
 * 例：`useMediaQuery('(max-width: 640px)')` で狭い画面（モバイル相当）かを判定。
 * SSR/未対応環境では false を返す（防御的）。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // 購読開始時に現在値へ同期
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
