import { db, yaku } from "@better-t-app/db";
import { and, eq, gte, like, lte, or } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure } from "../index";

export const yakuRouter = {
  list: publicProcedure
    .input(
      z.object({
        category: z.enum(["normal", "yakuman", "all"]).default("all"),
        minHan: z.number().int().min(1).optional(),
        maxHan: z.number().int().optional(),
        keyword: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [];

      if (input.category !== "all") {
        conditions.push(eq(yaku.category, input.category));
      }
      if (input.minHan !== undefined) {
        conditions.push(gte(yaku.han, input.minHan));
      }
      if (input.maxHan !== undefined) {
        conditions.push(lte(yaku.han, input.maxHan));
      }
      if (input.keyword) {
        const kw = `%${input.keyword}%`;
        conditions.push(
          or(
            like(yaku.nameJa, kw),
            like(yaku.nameReading, kw),
            like(yaku.nameEn, kw),
            like(yaku.description, kw),
          ),
        );
      }

      const items = await db.query.yaku.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (t, { asc }) => [asc(t.sortOrder)],
      });

      return {
        items: items.map((y) => ({
          id: y.id,
          nameJa: y.nameJa,
          nameReading: y.nameReading,
          nameEn: y.nameEn,
          han: y.han,
          hanOpen: y.hanOpen ?? null,
          isYakuman: y.isYakuman,
          shortDescription: y.description.slice(0, 50),
          category: y.category,
        })),
      };
    }),

  getDetail: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const found = await db.query.yaku.findFirst({
        where: eq(yaku.id, input.id),
        with: { quizQuestionYaku: { with: { question: { columns: { id: true } } } } },
      });

      if (!found) {
        throw new Error("Yaku not found");
      }

      return {
        id: found.id,
        nameJa: found.nameJa,
        nameReading: found.nameReading,
        nameEn: found.nameEn,
        han: found.han,
        hanOpen: found.hanOpen ?? null,
        isYakuman: found.isYakuman,
        category: found.category,
        description: found.description,
        conditions: JSON.parse(found.conditions) as string[],
        examples: JSON.parse(found.examples) as string[],
      };
    }),
};
