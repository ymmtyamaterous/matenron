import { isHonorTile, isYaochu, tilesEqual } from "./tiles";
import type { HandInput, Jantai, Mentsu, ParsedHand, Tile } from "./tiles";
import type { YakuResult } from "./yaku-calculator";

/**
 * 符計算
 * 参考: https://mahjong.guide/fu-and-points/
 */

/** 面子の符 */
function mentsuFu(mentsu: Mentsu): number {
  const tile = mentsu.tiles[0];
  const isYao = isYaochu(tile);
  const isFuro = mentsu.isFuro;

  if (mentsu.type === "shuntsu") return 0;
  if (mentsu.type === "koutsu") {
    // 刻子: 中張2・么九4、副露は半分
    const base = isYao ? 4 : 2;
    return isFuro ? base : base * 2;
  }
  if (mentsu.type === "kantsu") {
    // 槓子: 中張8・么九16、副露は半分
    const base = isYao ? 16 : 8;
    return isFuro ? base : base * 2;
  }
  return 0;
}

/** 雀頭の符 */
function jantaiFu(jantai: Jantai, hand: HandInput): number {
  const tile = jantai.tiles[0];
  if (tile.suit === "dragon") return 2;
  if (tile.suit === "wind") {
    let fu = 0;
    if (tile.value === hand.bakaze) fu += 2;
    if (tile.value === hand.jikaze) fu += 2;
    return fu;
  }
  return 0;
}

/** 待ちの符 */
function waitFu(parsed: ParsedHand, winTile: Tile): number {
  if (parsed.isChitoitsu) return 0;
  if (parsed.isKokushi) return 0;

  // 単騎待ち (雀頭で和了)
  if (tilesEqual(winTile, parsed.jantai.tiles[0]) && parsed.mentsuList.every((m) => !m.tiles.some((t) => tilesEqual(t, winTile)))) {
    return 2;
  }

  const winMentsu = parsed.mentsuList.find((m) => m.tiles.some((t) => tilesEqual(t, winTile)));
  if (!winMentsu || winMentsu.type !== "shuntsu") return 0;

  const shuntsu = winMentsu.tiles;
  const minVal = shuntsu[0].value;
  const maxVal = shuntsu[2].value;

  // カンチャン待ち
  if (tilesEqual(winTile, shuntsu[1])) return 2;
  // ペンチャン待ち (1-2-3の3待ち or 7-8-9の7待ち)
  if (tilesEqual(winTile, shuntsu[2]) && minVal === 1) return 2; // ペンチャン下
  if (tilesEqual(winTile, shuntsu[0]) && maxVal === 9) return 2; // ペンチャン上

  // 両面待ち
  return 0;
}

/**
 * 符を計算する
 * @returns 切り上げ前の符 (10符単位で切り上げは呼び出し元で行う)
 */
export function calculateFu(parsed: ParsedHand, hand: HandInput, yakuList: YakuResult[]): number {
  const isMenzen = !parsed.mentsuList.some((m) => m.isFuro);

  // 七対子は固定25符
  if (parsed.isChitoitsu) return 25;

  // 国士無双は符計算不要 (役満固定)
  if (parsed.isKokushi) return 30;

  // 基本符
  let fu = 30; // 副底

  // 門前ロンの場合は +10
  if (isMenzen && !hand.isTsumo) fu += 10;

  // ツモの場合は +2 (平和ツモは除く)
  const isPinfu = yakuList.some((y) => y.nameEn === "Pinfu");
  if (hand.isTsumo && !isPinfu) fu += 2;

  // 面子の符
  for (const m of parsed.mentsuList) {
    fu += mentsuFu(m);
  }

  // 雀頭の符
  fu += jantaiFu(parsed.jantai, hand);

  // 待ちの符
  fu += waitFu(parsed, hand.winTile);

  // 10符単位で切り上げ
  return Math.ceil(fu / 10) * 10;
}
