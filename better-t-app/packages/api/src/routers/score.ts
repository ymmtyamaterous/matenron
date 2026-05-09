import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { publicProcedure } from "../index";
import { calculateScore } from "../lib/score/calculator";
import { calculateFu } from "../lib/score/fu-calculator";
import { parseHandWithFuro } from "../lib/score/hand-parser";
import type { FuroType, HandInput, Mentsu, MentsuType, Tile, WindValue } from "../lib/score/tiles";
import { calculateYaku, totalHan } from "../lib/score/yaku-calculator";

const FU_VALUES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

const tileSchema = z.object({
  suit: z.enum(["man", "pin", "sou", "wind", "dragon"]),
  value: z.number().int().min(1).max(9),
});

const windValueSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

const furoMentsuSchema = z.object({
  type: z.enum(["shuntsu", "koutsu", "kantsu"]),
  tiles: z.array(tileSchema).min(3).max(4),
  isFuro: z.boolean(),
  furoType: z.enum(["pon", "chi", "minkan", "ankan"]),
});

export const scoreRouter = {
  calculate: publicProcedure
    .input(
      z.object({
        han: z.number().int().min(1).max(13),
        fu: z.number().int().refine((v) => (FU_VALUES as readonly number[]).includes(v), {
          message: "Invalid fu value",
        }),
        isOya: z.boolean(),
        isTsumo: z.boolean(),
        yakuIds: z.array(z.string()).optional(),
      }),
    )
    .handler(({ input }) => {
      const result = calculateScore({
        han: input.han,
        fu: input.fu,
        isOya: input.isOya,
        isTsumo: input.isTsumo,
      });

      return result;
    }),

  analyzeHand: publicProcedure
    .input(
      z.object({
        tiles: z.array(tileSchema).min(2).max(14),
        furoMentsuList: z.array(furoMentsuSchema).max(4).default([]),
        winTile: tileSchema,
        isTsumo: z.boolean(),
        isOya: z.boolean(),
        bakaze: windValueSchema,
        jikaze: windValueSchema,
        isRiichi: z.boolean().default(false),
        isDoubleRiichi: z.boolean().default(false),
        isIppatsu: z.boolean().default(false),
        isRinshan: z.boolean().default(false),
        isChankan: z.boolean().default(false),
        isHaitei: z.boolean().default(false),
        isHoutei: z.boolean().default(false),
        doraCount: z.number().int().min(0).max(10).default(0),
        uraDoraCount: z.number().int().min(0).max(10).default(0),
        akaDoraCount: z.number().int().min(0).max(3).default(0),
      }),
    )
    .handler(({ input }) => {
      const expectedTileCount = 14 - 3 * input.furoMentsuList.length;
      if (input.tiles.length !== expectedTileCount) {
        throw new ORPCError("BAD_REQUEST", {
          message: `暗牌は${expectedTileCount}枚必要です（現在${input.tiles.length}枚）`,
        });
      }

      const furoMentsuList: Mentsu[] = input.furoMentsuList.map((m) => ({
        type: m.type as MentsuType,
        tiles: m.tiles as Tile[],
        isFuro: m.isFuro,
        furoType: m.furoType as FuroType,
      }));

      const handInput: HandInput = {
        tiles: input.tiles as Tile[],
        furoMentsuList,
        winTile: input.winTile as Tile,
        isTsumo: input.isTsumo,
        isOya: input.isOya,
        bakaze: input.bakaze as WindValue,
        jikaze: input.jikaze as WindValue,
        isRiichi: input.isRiichi,
        isDoubleRiichi: input.isDoubleRiichi,
        isIppatsu: input.isIppatsu,
        isRinshan: input.isRinshan,
        isChankan: input.isChankan,
        isHaitei: input.isHaitei,
        isHoutei: input.isHoutei,
        doraCount: input.doraCount,
        uraDoraCount: input.uraDoraCount,
        akaDoraCount: input.akaDoraCount,
      };

      const parsedList = parseHandWithFuro(handInput.tiles, furoMentsuList);
      if (parsedList.length === 0) {
        throw new ORPCError("BAD_REQUEST", { message: "和了形ではありません" });
      }

      // 全パターンで役・点数を計算して最高点を選択
      let bestResult: {
        yakuList: ReturnType<typeof calculateYaku>;
        han: number;
        fu: number;
        score: ReturnType<typeof calculateScore>;
        parsedHand: (typeof parsedList)[0];
      } | null = null;

      for (const parsed of parsedList) {
        const yakuList = calculateYaku(handInput, parsed);
        const isMenzen = !parsed.mentsuList.some((m) => m.isFuro);
        const han = totalHan(yakuList, isMenzen);

        // 役なしは無効（ドラのみは役なし）
        const nonDoraYaku = yakuList.filter(
          (y) => !y.nameEn?.startsWith("Dora") && y.nameEn !== "Ura Dora" && y.nameEn !== "Aka Dora",
        );
        if (nonDoraYaku.length === 0) continue;

        const fu = calculateFu(parsed, handInput, yakuList);
        const score = calculateScore({ han, fu, isOya: input.isOya, isTsumo: input.isTsumo });

        const actualScore = input.isTsumo ? score.result.tsumo.total : (input.isOya ? score.result.ron.dealer : score.result.ron.nonDealer);

        if (!bestResult) {
          bestResult = { yakuList, han, fu, score, parsedHand: parsed };
        } else {
          const bestActual = input.isTsumo ? bestResult.score.result.tsumo.total : (input.isOya ? bestResult.score.result.ron.dealer : bestResult.score.result.ron.nonDealer);
          if (actualScore > bestActual) {
            bestResult = { yakuList, han, fu, score, parsedHand: parsed };
          }
        }
      }

      if (!bestResult) {
        throw new ORPCError("BAD_REQUEST", { message: "役がありません" });
      }

      return {
        yakuList: bestResult.yakuList,
        han: bestResult.han,
        fu: bestResult.fu,
        scoreResult: bestResult.score,
        isChitoitsu: bestResult.parsedHand.isChitoitsu,
        isKokushi: bestResult.parsedHand.isKokushi,
      };
    }),
};


export const scoreRouter = {
  calculate: publicProcedure
    .input(
      z.object({
        han: z.number().int().min(1).max(13),
        fu: z.number().int().refine((v) => (FU_VALUES as readonly number[]).includes(v), {
          message: "Invalid fu value",
        }),
        isOya: z.boolean(),
        isTsumo: z.boolean(),
        yakuIds: z.array(z.string()).optional(),
      }),
    )
    .handler(({ input }) => {
      const result = calculateScore({
        han: input.han,
        fu: input.fu,
        isOya: input.isOya,
        isTsumo: input.isTsumo,
      });

      return result;
    }),

  analyzeHand: publicProcedure
    .input(
      z.object({
        tiles: z.array(tileSchema).length(14, "手牌は14枚必要です"),
        winTile: tileSchema,
        isTsumo: z.boolean(),
        isOya: z.boolean(),
        bakaze: windValueSchema,
        jikaze: windValueSchema,
        isRiichi: z.boolean().default(false),
        isDoubleRiichi: z.boolean().default(false),
        isIppatsu: z.boolean().default(false),
        isRinshan: z.boolean().default(false),
        isChankan: z.boolean().default(false),
        isHaitei: z.boolean().default(false),
        isHoutei: z.boolean().default(false),
        doraCount: z.number().int().min(0).max(10).default(0),
        uraDoraCount: z.number().int().min(0).max(10).default(0),
        akaDoraCount: z.number().int().min(0).max(3).default(0),
      }),
    )
    .handler(({ input }) => {
      const handInput: HandInput = {
        tiles: input.tiles as Tile[],
        winTile: input.winTile as Tile,
        isTsumo: input.isTsumo,
        isOya: input.isOya,
        bakaze: input.bakaze as WindValue,
        jikaze: input.jikaze as WindValue,
        isRiichi: input.isRiichi,
        isDoubleRiichi: input.isDoubleRiichi,
        isIppatsu: input.isIppatsu,
        isRinshan: input.isRinshan,
        isChankan: input.isChankan,
        isHaitei: input.isHaitei,
        isHoutei: input.isHoutei,
        doraCount: input.doraCount,
        uraDoraCount: input.uraDoraCount,
        akaDoraCount: input.akaDoraCount,
      };

      const parsedList = parseHand(handInput.tiles);
      if (parsedList.length === 0) {
        throw new ORPCError("BAD_REQUEST", { message: "和了形ではありません" });
      }

      // 全パターンで役・点数を計算して最高点を選択
      let bestResult: {
        yakuList: ReturnType<typeof calculateYaku>;
        han: number;
        fu: number;
        score: ReturnType<typeof calculateScore>;
        parsedHand: (typeof parsedList)[0];
      } | null = null;

      for (const parsed of parsedList) {
        const yakuList = calculateYaku(handInput, parsed);
        const isMenzen = !parsed.mentsuList.some((m) => m.isFuro);
        const han = totalHan(yakuList, isMenzen);

        // 役なしは無効
        const hasYaku = yakuList.some((y) => y.isYakuman) || yakuList.some((y) => !y.isYakuman && (y.nameEn === "Dora" || y.nameEn?.startsWith("Dora") ? false : true) && y.han > 0);
        const nonDoraYaku = yakuList.filter(
          (y) => !y.nameEn?.startsWith("Dora") && y.nameEn !== "Ura Dora" && y.nameEn !== "Aka Dora",
        );
        if (nonDoraYaku.length === 0) continue;

        const fu = calculateFu(parsed, handInput, yakuList);
        const score = calculateScore({ han, fu, isOya: input.isOya, isTsumo: input.isTsumo });

        const actualScore = input.isTsumo ? score.result.tsumo.total : (input.isOya ? score.result.ron.dealer : score.result.ron.nonDealer);

        if (!bestResult) {
          bestResult = { yakuList, han, fu, score, parsedHand: parsed };
        } else {
          const bestActual = input.isTsumo ? bestResult.score.result.tsumo.total : (input.isOya ? bestResult.score.result.ron.dealer : bestResult.score.result.ron.nonDealer);
          if (actualScore > bestActual) {
            bestResult = { yakuList, han, fu, score, parsedHand: parsed };
          }
        }
      }

      if (!bestResult) {
        throw new ORPCError("BAD_REQUEST", { message: "役がありません" });
      }

      return {
        yakuList: bestResult.yakuList,
        han: bestResult.han,
        fu: bestResult.fu,
        scoreResult: bestResult.score,
        isChitoitsu: bestResult.parsedHand.isChitoitsu,
        isKokushi: bestResult.parsedHand.isKokushi,
      };
    }),
};
