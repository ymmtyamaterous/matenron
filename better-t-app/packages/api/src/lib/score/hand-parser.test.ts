import { describe, expect, it } from "bun:test";
import { parseHand, parseHandWithFuro } from "./hand-parser";
import type { Mentsu, Tile } from "./tiles";

// ヘルパー: 牌を作成
const m = (v: number): Tile => ({ suit: "man", value: v });
const p = (v: number): Tile => ({ suit: "pin", value: v });
const s = (v: number): Tile => ({ suit: "sou", value: v });
const wind = (v: number): Tile => ({ suit: "wind", value: v });
const dragon = (v: number): Tile => ({ suit: "dragon", value: v });

describe("parseHand", () => {
  describe("通常手", () => {
    it("一盃口形 (1m1m2m3m4m5m6m7m8m9m1p2p3p東東)", () => {
      // 4面子1雀頭の形
      const tiles: Tile[] = [
        m(1), m(2), m(3), m(1), m(2), m(3), m(4), m(5), m(6), m(7), m(8), m(9), wind(1), wind(1),
      ];
      const result = parseHand(tiles);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => !r.isChitoitsu && !r.isKokushi)).toBe(true);
    });

    it("平和形 (123m456m789m123p55p)", () => {
      const tiles: Tile[] = [
        m(1), m(2), m(3), m(4), m(5), m(6), m(7), m(8), m(9),
        p(1), p(2), p(3), p(5), p(5),
      ];
      const result = parseHand(tiles);
      expect(result.length).toBeGreaterThan(0);
    });

    it("対々和形 (111m222p333s456z白白)", () => {
      const tiles: Tile[] = [
        m(1), m(1), m(1), p(2), p(2), p(2), s(3), s(3), s(3),
        dragon(1), dragon(1), dragon(1), dragon(2), dragon(2),
      ];
      const result = parseHand(tiles);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("七対子", () => {
    it("7種の対子 (11m22p33s44z55z66z77z)", () => {
      const tiles: Tile[] = [
        m(1), m(1), p(2), p(2), s(3), s(3),
        wind(1), wind(1), wind(2), wind(2), wind(3), wind(3), wind(4), wind(4),
      ];
      const result = parseHand(tiles);
      const chitoitsu = result.find((r) => r.isChitoitsu);
      expect(chitoitsu).toBeDefined();
    });

    it("同じ牌4枚は七対子でない (1111m222p333s44z55z6z)", () => {
      const tiles: Tile[] = [
        m(1), m(1), m(1), m(1), p(2), p(2), s(3), s(3),
        wind(1), wind(1), wind(2), wind(2), wind(3), wind(3),
      ];
      const result = parseHand(tiles);
      const chitoitsu = result.find((r) => r.isChitoitsu);
      expect(chitoitsu).toBeUndefined();
    });
  });

  describe("国士無双", () => {
    it("国士無双 (1m9m1p9p1s9s東南西北白発中)", () => {
      const tiles: Tile[] = [
        m(1), m(9), p(1), p(9), s(1), s(9),
        wind(1), wind(2), wind(3), wind(4),
        dragon(1), dragon(2), dragon(3), m(1),
      ];
      const result = parseHand(tiles);
      const kokushi = result.find((r) => r.isKokushi);
      expect(kokushi).toBeDefined();
    });

    it("国士無双でない手 (么九牌が1枚足りない)", () => {
      const tiles: Tile[] = [
        m(1), m(9), p(1), p(9), s(1), s(9),
        wind(1), wind(2), wind(3), wind(4),
        dragon(1), dragon(2), m(2), m(2),
      ];
      const result = parseHand(tiles);
      const kokushi = result.find((r) => r.isKokushi);
      expect(kokushi).toBeUndefined();
    });
  });

  describe("和了形でない手", () => {
    it("バラバラな手は和了形でない", () => {
      const tiles: Tile[] = [
        m(1), m(3), m(5), m(7), m(9),
        p(2), p(4), p(6), p(8),
        s(1), s(3), s(5), s(7), s(9),
      ];
      const result = parseHand(tiles);
      expect(result.length).toBe(0);
    });
  });
});

describe("parseHandWithFuro", () => {
  describe("副露あり手牌の分解", () => {
    it("ポン1つ: 暗牌11枚を正しく分解する", () => {
      const ponMentsu: Mentsu = {
        type: "koutsu",
        tiles: [dragon(3), dragon(3), dragon(3)],
        isFuro: true,
        furoType: "pon",
      };
      // 暗牌: 123m 456p 789s + 東東 = 11枚
      const concealed: Tile[] = [m(1), m(2), m(3), p(4), p(5), p(6), s(7), s(8), s(9), wind(1), wind(1)];
      const result = parseHandWithFuro(concealed, [ponMentsu]);
      expect(result.length).toBeGreaterThan(0);
      // 副露面子が先頭に含まれる
      expect(result[0].mentsuList[0]).toEqual(ponMentsu);
    });

    it("ポン2つ: 暗牌8枚を正しく分解する", () => {
      const pon1: Mentsu = {
        type: "koutsu",
        tiles: [dragon(3), dragon(3), dragon(3)],
        isFuro: true,
        furoType: "pon",
      };
      const pon2: Mentsu = {
        type: "koutsu",
        tiles: [dragon(2), dragon(2), dragon(2)],
        isFuro: true,
        furoType: "pon",
      };
      // 暗牌: 123m 456p + 東東 = 8枚
      const concealed: Tile[] = [m(1), m(2), m(3), p(4), p(5), p(6), wind(1), wind(1)];
      const result = parseHandWithFuro(concealed, [pon1, pon2]);
      expect(result.length).toBeGreaterThan(0);
      // 4面子1雀頭で合計4面子 (副露2 + 暗2)
      expect(result[0].mentsuList.length).toBe(4);
    });

    it("副露4つ: 暗牌2枚 (雀頭のみ) を正しく解析する", () => {
      // 暗牌: 東東 = 2枚
      const concealed: Tile[] = [wind(1), wind(1)];
      const furoList: Mentsu[] = [
        { type: "koutsu", tiles: [m(1), m(1), m(1)], isFuro: true, furoType: "pon" },
        { type: "koutsu", tiles: [m(2), m(2), m(2)], isFuro: true, furoType: "pon" },
        { type: "koutsu", tiles: [m(3), m(3), m(3)], isFuro: true, furoType: "pon" },
        { type: "koutsu", tiles: [m(4), m(4), m(4)], isFuro: true, furoType: "pon" },
      ];
      const result = parseHandWithFuro(concealed, furoList);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].mentsuList.length).toBe(4);
      expect(result[0].jantai.tiles[0]).toEqual(wind(1));
    });

    it("暗牌枚数不一致: 空配列を返す", () => {
      const ponMentsu: Mentsu = {
        type: "koutsu",
        tiles: [dragon(3), dragon(3), dragon(3)],
        isFuro: true,
        furoType: "pon",
      };
      // ポン1つなら暗牌11枚必要だが14枚渡す → 無効
      const wrongTiles: Tile[] = [m(1), m(2), m(3), p(1), p(2), p(3), s(1), s(2), s(3), s(4), s(5), s(6), wind(1), wind(1)];
      expect(parseHandWithFuro(wrongTiles, [ponMentsu])).toHaveLength(0);
    });

    it("副露なし: parseHand と同じ結果を返す", () => {
      const tiles: Tile[] = [m(1), m(2), m(3), m(4), m(5), m(6), m(7), m(8), m(9), p(1), p(2), p(3), s(1), s(1)];
      const resultWithFuro = parseHandWithFuro(tiles, []);
      const resultNormal = parseHand(tiles);
      expect(resultWithFuro.length).toBe(resultNormal.length);
    });
  });
});
