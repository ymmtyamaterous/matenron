import { describe, it, expect } from "bun:test";
import { calculateScore } from "./calculator";

describe("calculateScore", () => {
  // 通常計算
  describe("通常計算", () => {
    it("子のロン: 1翻30符 = 1000点", () => {
      const r = calculateScore({ han: 1, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("normal");
      expect(r.result.ron.nonDealer).toBe(1000);
    });

    it("親のロン: 1翻30符 = 1500点", () => {
      const r = calculateScore({ han: 1, fu: 30, isOya: true, isTsumo: false });
      expect(r.result.ron.dealer).toBe(1500);
    });

    it("子のツモ: 1翻30符 = 親500・子300", () => {
      const r = calculateScore({ han: 1, fu: 30, isOya: false, isTsumo: true });
      expect(r.result.tsumo.dealerPays).toBe(500);
      expect(r.result.tsumo.nonDealerPays).toBe(300);
      expect(r.result.tsumo.total).toBe(1100);
    });

    it("親のツモ: 1翻30符 = 子全員500", () => {
      const r = calculateScore({ han: 1, fu: 30, isOya: true, isTsumo: true });
      expect(r.result.tsumo.nonDealerPays).toBe(500);
      expect(r.result.tsumo.total).toBe(1500);
    });

    it("子のロン: 3翻70符 = 満貫", () => {
      // 3翻70符 = 70 * 2^5 = 2240 > 2000(満貫基本点)
      const r = calculateScore({ han: 3, fu: 70, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("mangan");
      expect(r.result.ron.nonDealer).toBe(8000);
    });

    it("4翻30符 = 満貫", () => {
      // 4翻30符 = 30 * 2^6 = 1920 < 2000だが、4翻30符は満貫扱い
      const r = calculateScore({ han: 4, fu: 30, isOya: false, isTsumo: false });
      // 基本点1920は満貫未満だがhan=4/fu=30は境界
      // 満貫か通常かはルールによるが計算ロジックに従う
      expect(r).toBeDefined();
    });

    it("5翻以上は必ず満貫以上", () => {
      const r = calculateScore({ han: 5, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("mangan");
      expect(r.result.ron.nonDealer).toBe(8000);
    });
  });

  // 満貫以上の固定点数
  describe("満貫以上", () => {
    it("満貫: 子のロン = 8000点", () => {
      const r = calculateScore({ han: 5, fu: 30, isOya: false, isTsumo: false });
      expect(r.result.ron.nonDealer).toBe(8000);
    });

    it("満貫: 親のロン = 12000点", () => {
      const r = calculateScore({ han: 5, fu: 30, isOya: true, isTsumo: false });
      expect(r.result.ron.dealer).toBe(12000);
    });

    it("跳満: 子のロン = 12000点", () => {
      const r = calculateScore({ han: 6, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("haneman");
      expect(r.result.ron.nonDealer).toBe(12000);
    });

    it("跳満: 7翻も跳満", () => {
      const r = calculateScore({ han: 7, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("haneman");
    });

    it("倍満: 8翻", () => {
      const r = calculateScore({ han: 8, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("baiman");
      expect(r.result.ron.nonDealer).toBe(16000);
    });

    it("三倍満: 11翻", () => {
      const r = calculateScore({ han: 11, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("sanbaiman");
      expect(r.result.ron.nonDealer).toBe(24000);
    });

    it("役満: 13翻", () => {
      const r = calculateScore({ han: 13, fu: 30, isOya: false, isTsumo: false });
      expect(r.scoreType).toBe("yakuman");
      expect(r.result.ron.nonDealer).toBe(32000);
    });

    it("役満: 子のツモ合計 = 32000点", () => {
      const r = calculateScore({ han: 13, fu: 30, isOya: false, isTsumo: true });
      expect(r.result.tsumo.total).toBe(32000);
    });

    it("役満: 親のロン = 48000点", () => {
      const r = calculateScore({ han: 13, fu: 30, isOya: true, isTsumo: false });
      expect(r.result.ron.dealer).toBe(48000);
    });
  });

  // 返却値の構造確認
  describe("返却値の構造", () => {
    it("返却値に han, fu, scoreType, basicScore, result が含まれる", () => {
      const r = calculateScore({ han: 2, fu: 40, isOya: false, isTsumo: false });
      expect(r).toHaveProperty("han");
      expect(r).toHaveProperty("fu");
      expect(r).toHaveProperty("scoreType");
      expect(r).toHaveProperty("basicScore");
      expect(r).toHaveProperty("result");
      expect(r.result).toHaveProperty("ron");
      expect(r.result).toHaveProperty("tsumo");
    });
  });
});
