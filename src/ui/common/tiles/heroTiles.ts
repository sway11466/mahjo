/**
 * 看板牌（1筒/1索）のキャラ非依存デフォルト画像の URL 解決。
 * src/assets/tiles/<key>.webp を Vite がバンドルした URL に橋渡しする（avatarAssets と同方式）。
 * 該当が無ければ undefined を返し、呼び出し側は中立SVG（PinOne/SouOne）にフォールバックする。
 * 将来キャラ別に差し替えるときは、characters 配下のグロブを足してこの上に重ねる（看板牌の皮）。
 */

const modules = import.meta.glob('../../../assets/tiles/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [key, url] of Object.entries(modules)) {
  // '../../../assets/tiles/sou1.webp' → 'sou1'
  const name = key.slice(key.lastIndexOf('/') + 1).replace(/\.webp$/, '');
  byName[name] = url;
}

/** 牌キー（例 'sou1' / 'pin1'）→ デフォルト画像 URL。無ければ undefined。 */
export function heroTileUrl(name: string): string | undefined {
  return byName[name];
}
