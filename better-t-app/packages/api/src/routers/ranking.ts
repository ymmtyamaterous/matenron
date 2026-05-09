import { db, quizAttempt, user } from "@better-t-app/db";
import { desc, sql } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure } from "../index";

export const rankingRouter = {
  getLeaderboard: publicProcedure
    .input(
      z.object({
        type: z.enum(["correctRate", "correctCount"]),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .handler(async ({ input }) => {
      // ユーザーごとの回答統計を集計
      const stats = await db
        .select({
          userId: quizAttempt.userId,
          totalAnswers: sql<number>`cast(count(*) as integer)`,
          correctAnswers: sql<number>`cast(sum(case when ${quizAttempt.isCorrect} then 1 else 0 end) as integer)`,
        })
        .from(quizAttempt)
        .groupBy(quizAttempt.userId)
        .having(sql`count(*) >= 5`) // 5回以上回答したユーザーのみ
        .orderBy(
          input.type === "correctRate"
            ? desc(
                sql`cast(sum(case when ${quizAttempt.isCorrect} then 1 else 0 end) as real) / cast(count(*) as real)`,
              )
            : desc(
                sql`sum(case when ${quizAttempt.isCorrect} then 1 else 0 end)`,
              ),
        )
        .limit(input.limit);

      // ユーザー名を取得
      const userIds = stats.map((s) => s.userId);
      const users =
        userIds.length > 0
          ? await db
              .select({ id: user.id, name: user.name })
              .from(user)
          : [];

      const userMap = new Map(users.map((u) => [u.id, u.name]));

      return {
        type: input.type,
        items: stats.map((s, idx) => ({
          rank: idx + 1,
          userId: s.userId,
          userName: userMap.get(s.userId) ?? "Unknown",
          correctRate:
            s.totalAnswers > 0
              ? Math.round((s.correctAnswers / s.totalAnswers) * 1000) / 10
              : 0,
          totalAnswers: s.totalAnswers,
          correctAnswers: s.correctAnswers,
        })),
      };
    }),
};
