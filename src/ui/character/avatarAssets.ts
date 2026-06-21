/**
 * キャラの抽象アセットパス（例 'characters/mao/mao-portrait-happy-a.webp'）→
 * Vite がバンドルした実 URL の解決。表情→画像の解決は ui の責務（architecture.md §2）。
 *
 * characters 層はバンドラ非依存のデータ（パス文字列）だけを持ち、ここで URL へ橋渡しする。
 */

import type { Character, Expression } from '../../types/index.ts';
import { expressionFor } from '../../characters/index.ts';

// src/assets 以下を一括取り込み（eager・url 取得）。キーは本ファイルからの相対パス。
const modules = import.meta.glob('../../assets/characters/**/*.{webp,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PREFIX = '../../assets/';
const byPath: Record<string, string> = {};
for (const [key, url] of Object.entries(modules)) {
  // '../../assets/characters/mao/mao-avatar.webp' → 'characters/mao/mao-avatar.webp'
  byPath[key.slice(PREFIX.length)] = url;
}

/** 抽象パス → 実 URL。未登録なら undefined（呼び出し側はプレースホルダにフォールバック）。 */
export function assetUrl(path: string | undefined): string | undefined {
  return path ? byPath[path] : undefined;
}

/** 長さ len の差分プールを種 seed（[0,1)）で等確率に1つ選ぶ index。seed が境界でも範囲内に収める。 */
export function variantIndex(len: number, seed: number): number {
  if (len <= 0) return 0;
  return Math.min(len - 1, Math.max(0, Math.floor(seed * len)));
}

/**
 * 表情差分プール（ExpressionAsset.srcs）から、種 seed（[0,1)）で1枚の実 URL を選ぶ。
 * 飽き対策のバリアント選択（character-guide §4）。種は session が1ターンに1回引く（CharacterView.variantSeed）。
 * 選んだ差分が未解決（ファイル未配置）なら先頭 srcs[0] にフォールバックし、それも無ければ undefined。
 */
export function variantUrl(
  srcs: string[] | undefined,
  seed: number,
): string | undefined {
  if (!srcs || srcs.length === 0) return undefined;
  return assetUrl(srcs[variantIndex(srcs.length, seed)]) ?? assetUrl(srcs[0]);
}

/**
 * 抽象表情（Expression）→ そのキャラのポートレート実 URL。差分プールから種で1枚選び、その表情の
 * 画像が無ければ ①ベース表情（あいさつ＝greeting・MVP必須の1枚）→ ②neutral ベース顔 の順に落とす保険。
 * それも無ければ undefined（呼び出し側はプレースホルダ）。②は、あいさつ表情の画像すら未配置なキャラ
 * （例 りん＝greeting:smug 未配置・neutral のみ配置）でも neutral ベース顔を出すための網（neutral＝
 * あいさつ汎用既定・data-model §13）。standeeUrl と同じ「表情→画像＋フォールバック」族を、
 * ここ（表情→画像の解決＝ui の責務・data-model §17）に集約する。
 */
export function portraitUrl(
  character: Character,
  expression: Expression,
  variantSeed: number,
): string | undefined {
  const pick = (expr: Expression): string | undefined =>
    variantUrl(
      character.expressions.find((e) => e.expression === expr)?.srcs,
      variantSeed,
    );
  const direct = pick(expression);
  if (direct) return direct;
  // ① ベース表情（あいさつ＝greeting の表情）へ
  const base = expressionFor(character, 'greeting');
  if (base !== expression) {
    const baseUrl = pick(base);
    if (baseUrl) return baseUrl;
  }
  // ② neutral ベース顔へ（あいさつ表情の画像も未配置なキャラの保険）
  if (expression !== 'neutral' && base !== 'neutral') {
    const neutralUrl = pick('neutral');
    if (neutralUrl) return neutralUrl;
  }
  return undefined;
}

/**
 * キャラ選択グリッドのサムネ URL。セレクト用 avatar を優先し、無ければ立ち絵 <id>-full-stand-a.webp に落とす
 * （avatar 未用意のキャラでも顔が出る）。どちらも無ければ undefined（呼び出し側は名前プレースホルダ）。
 */
export function avatarThumbUrl(
  characterId: string,
  avatar: string | undefined,
): string | undefined {
  return (
    assetUrl(avatar) ??
    assetUrl(`characters/${characterId}/${characterId}-full-stand-a.webp`)
  );
}

/**
 * スタート画面・キャラクター画面で見せる立ち絵（全身）の URL。
 * 全身 <id>-full-stand-a.webp を優先し、無ければベース表情（あいさつ＝greeting の表情。まおは neutral）→
 * avatar の順にフォールバック。（全身は character-guide §2 で任意のため、未用意でも崩れないように）
 */
export function standeeUrl(
  characterId: string,
  baselineSrc: string | undefined,
  avatar: string | undefined,
): string | undefined {
  return (
    assetUrl(`characters/${characterId}/${characterId}-full-stand-a.webp`) ??
    assetUrl(baselineSrc) ??
    assetUrl(avatar)
  );
}
