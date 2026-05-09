import { describe, expect, it } from "bun:test";
import type { HandInput, Tile, WindValue } from "./tiles";
import { calculateYaku } from "./yaku-calculator";
import { parseHand } from "./hand-parser";

const m = (v: number): Tile => ({ suit: "man", value: v });
const p = (v: number): Tile => ({ suit: "pin", value: v });
const s = (v: number): Tile => ({ suit: "sou", value: v });
const wind = (v: number): Tile => ({ suit: "wind", value: v });
const dragon = (v: number): Tile => ({ suit: "dragon", value: v });

function makeHand(tiles: Tile[], winTile: Tile, overrides: Partial<HandInput> = {}): HandInput {
  return {
    tiles,
    winTile,
    isTsumo: false,
    isOya: false,
    bakaze: 1 as WindValue,
    jikaze: 2 as WindValue,
    isRiichi: false,
    isDoubleRiichi: false,
    isIppatsu: false,
    isRinshan: false,
    isChankan: false,
    isHaitei: false,
    isHoutei: false,
    doraCount: 0,
    uraDoraCount: 0,
    akaDoraCount: 0,
    ...overrides,
  };
}

describe("calculateYaku", () => {
  describe("立直", () => {
    it("立直が成立する", () => {
      const tiles = [m(1), m(2), m(3), m(4), m(5), m(6), m(7), m(8), m(9), p(1), p(2), p(3), s(1), s(1)];
      const winTile = s(1);
      const hand = makeHand(tiles, winTile, { isRiichi: true });
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.nameEn === "Riichi")).toBe(true);
    });

    it("ダブルリーチ成立時は通常リーチが成立しない", () => {
      const tiles = [m(1), m(2), m(3), m(4), m(5), m(6), m(7), m(8), m(9), p(1), p(2), p(3), s(1), s(1)];
      const winTile = s(1);
      const hand = makeHand(tiles, winTile, { isRiichi: true, isDoubleRiichi: true });
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.nameEn === "Double Riichi")).toBe(true);
      expect(yaku.some((y) => y.nameEn === "Riichi")).toBe(false);
    });
  });

  describe("断么九", () => {
    it("全て中張牌で断么九成立", () => {
      const tiles = [m(2), m(3), m(4), m(5), m(6), m(7), p(2), p(3), p(4), s(2), s(3), s(4), m(8), m(8)];
      const winTile = m(8);
      const hand = makeHand(tiles, winTile);
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.nameEn === "Tanyao")).toBe(true);
    });

    it("么九牌があれば断么九不成立", () => {
      const tiles = [m(1), m(2), m(3), m(4), m(5), m(6), p(2), p(3), p(4), s(2), s(3), s(4), m(8), m(8)];
      const winTile = m(8);
      const hand = makeHand(tiles, winTile);
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.nameEn === "Tanyao")).toBe(false);
    });
  });

  describe("七対子", () => {
    it("七対子が成立する", () => {
      const tiles = [
        m(2), m(2), m(4), m(4), p(6), p(6), s(8), s(8),
        wind(1), wind(1), wind(2), wind(2), dragon(1), dragon(1),
      ];
      const winTile = dragon(1);
      const hand = makeHand(tiles, winTile, { isTsumo: true });
      const parsed = parseHand(tiles);
      const chitoitsu = parsed.find((item) => item.isChitoitsu);
      expect(chitoitsu).toBeDefined();
      if (chitoitsu) {
        const yaku = calculateYaku(hand, chitoitsu);
        expect(yaku.some((y) => y.nameEn === "Chitoitsu")).toBe(true);
      }
    });
  });

  describe("役牌", () => {
    it("中が成立する", () => {
      const tiles = [m(1), m(2), m(3), p(4), p(5), p(6), s(7), s(8), s(9), dragon(3), dragon(3), dragon(3), m(5), m(5)];
      const winTile = m(5);
      const hand = makeHand(tiles, winTile);
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.name.includes("中"))).toBe(true);
    });

    it("場風 (東場で東の刻子) が成立する", () => {
      const tiles = [m(1), m(2), m(3), p(4), p(5), p(6), s(7), s(8), s(9), wind(1), wind(1), wind(1), m(5), m(5)];
      const winTile = m(5);
      const hand = makeHand(tiles, winTile, { bakaze: 1, jikaze: 2 });
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.name.includes("場風"))).toBe(true);
    });
  });

  describe("清一色", () => {
    it("萬子清一色が成立する", () => {
      const tiles = [m(1), m(2), m(3), m(4), m(5), m(6), m(7), m(8), m(9), m(1), m(2), m(3), m(5), m(5)];
      const winTile = m(5);
      const hand = makeHand(tiles, winTile);
      const parsed = parseHand(tiles);
      expect(parsed.length).toBeGreaterThan(0);
      const yaku = calculateYaku(hand, parsed[0]);
      expect(yaku.some((y) => y.nameEn === "Chinitsu")).toBe(true);
    });
  });

  describe("国士無双", () => {
    it("国士無双が成立する", () => {
      const tiles = [
        m(1), m(9), p(1), p(9), s(1), s(9),
        wind(1), wind(2), wind(3), wind(4),
        dragon(1), dragon(2), dragon(3), m(1),
      ];
      const winTile = m(1);
      const hand = makeHand(tiles, winTile, { isTsumo: true });
      const parsed = parseHand(tiles);
      const kokushi = parsed.find((p) => p.isKokushi);
      expect(kokushi).toBeDefined();
      if (kokushi) {
        const yaku = calculateYaku(hand, kokushi);
        expect(yaku.some((y) => y.nameEn === "Kokushi")).toBe(true);
        expect(yaku.some((y) => y.isYakuman)).toBe(true);
      }
    });
  });
});
