import { db, quizAttempt, user } from "@better-t-app/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../index";

export const userRouter = {
  getProfile: protectedProcedure
    .input(z.object({}))
    .handler(async ({ context }) => {
      const userId = context.session.user.id;

      const found = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      if (!found) {
        throw new Error("User not found");
      }

      // 統計を集計
      const attempts = await db.query.quizAttempt.findMany({
        where: eq(quizAttempt.userId, userId),
      });

      const totalAnswers = attempts.length;
      const correctAnswers = attempts.filter((a) => a.isCorrect).length;
      const correctRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 1000) / 10 : 0;

      return {
        id: found.id,
        name: found.name,
        email: found.email,
        image: found.image ?? null,
        stats: { totalAnswers, correctAnswers, correctRate },
        createdAt: found.createdAt.toISOString(),
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;
      const now = new Date();

      await db.update(user).set({ name: input.name, updatedAt: now }).where(eq(user.id, userId));

      return { id: userId, name: input.name, updatedAt: now.toISOString() };
    }),
};
