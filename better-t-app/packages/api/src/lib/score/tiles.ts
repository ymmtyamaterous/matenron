/**
 * 麻雀牌の型定義
 */

/** 牌の種類 */
export type Suit = "man" | "pin" | "sou" | "wind" | "dragon";

/** 数牌の数字 (1〜9) */
export type Number = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 風牌の種類: 1=東 2=南 3=西 4=北 */
export type WindValue = 1 | 2 | 3 | 4;

/** 三元牌の種類: 1=白 2=発 3=中 */
export type DragonValue = 1 | 2 | 3;

/** 1枚の牌 */
export interface Tile {
  suit: Suit;
  value: number;
}

/** 牌を文字列表現に変換 */
export function tileToString(tile: Tile): string {
  const suitMap: Record<Suit, string> = {
    man: "m",
    pin: "p",
    sou: "s",
    wind: "z",
    dragon: "z",
  };
  return `${tile.value}${suitMap[tile.suit]}`;
}

/** 牌の表示名 */
export function tileDisplayName(tile: Tile): string {
  if (tile.suit === "man") return `${tile.value}萬`;
  if (tile.suit === "pin") return `${tile.value}筒`;
  if (tile.suit === "sou") return `${tile.value}索`;
  if (tile.suit === "wind") {
    const names = ["東", "南", "西", "北"];
    return names[(tile.value as WindValue) - 1] ?? `${tile.value}風`;
  }
  if (tile.suit === "dragon") {
    const names = ["白", "発", "中"];
    return names[(tile.value as DragonValue) - 1] ?? `${tile.value}`;
  }
  return `${tile.value}`;
}

/** 牌が数牌かどうか */
export function isNumberTile(tile: Tile): boolean {
  return tile.suit === "man" || tile.suit === "pin" || tile.suit === "sou";
}

/** 牌が字牌かどうか */
export function isHonorTile(tile: Tile): boolean {
  return tile.suit === "wind" || tile.suit === "dragon";
}

/** 牌が么九牌(1・9・字牌)かどうか */
export function isYaochu(tile: Tile): boolean {
  if (isHonorTile(tile)) return true;
  return tile.value === 1 || tile.value === 9;
}

/** 牌が中張牌(2〜8の数牌)かどうか */
export function isTanyao(tile: Tile): boolean {
  return isNumberTile(tile) && tile.value >= 2 && tile.value <= 8;
}

/** 牌を比較 (ソート用) */
export function compareTiles(a: Tile, b: Tile): number {
  const suitOrder: Record<Suit, number> = { man: 0, pin: 1, sou: 2, wind: 3, dragon: 4 };
  if (suitOrder[a.suit] !== suitOrder[b.suit]) {
    return suitOrder[a.suit] - suitOrder[b.suit];
  }
  return a.value - b.value;
}

/** 牌が同じかどうか */
export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

/** 手牌の入力情報 */
export interface HandInput {
  /** 手牌 (和了牌含む 14枚) */
  tiles: Tile[];
  /** ロンかツモか */
  isTsumo: boolean;
  /** 親かどうか */
  isOya: boolean;
  /** 場風 (1=東 2=南 3=西 4=北) */
  bakaze: WindValue;
  /** 自風 (1=東 2=南 3=西 4=北) */
  jikaze: WindValue;
  /** 立直かどうか */
  isRiichi: boolean;
  /** ダブル立直かどうか */
  isDoubleRiichi: boolean;
  /** 一発かどうか */
  isIppatsu: boolean;
  /** 嶺上開花かどうか */
  isRinshan: boolean;
  /** 槍槓かどうか */
  isChankan: boolean;
  /** 海底牌かどうか */
  isHaitei: boolean;
  /** 河底牌かどうか */
  isHoutei: boolean;
  /** ドラ枚数 */
  doraCount: number;
  /** 裏ドラ枚数 */
  uraDoraCount: number;
  /** 赤ドラ枚数 */
  akaDoraCount: number;
  /** 和了牌 (最後に引いた/ロンした牌) */
  winTile: Tile;
}

/** 面子の種類 */
export type MentsuType = "shuntsu" | "koutsu" | "kantsu";

/** 面子 */
export interface Mentsu {
  type: MentsuType;
  tiles: Tile[];
  /** 副露(鳴き)かどうか */
  isFuro: boolean;
}

/** 雀頭 */
export interface Jantai {
  tiles: [Tile, Tile];
}

/** 分解された手牌 */
export interface ParsedHand {
  mentsuList: Mentsu[];
  jantai: Jantai;
  /** 七対子かどうか */
  isChitoitsu: boolean;
  /** 国士無双かどうか */
  isKokushi: boolean;
}
