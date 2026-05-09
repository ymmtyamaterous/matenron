import { db, quizAttempt, quizQuestion, quizQuestionYaku, yaku } from "@better-t-app/db";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../index";

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export const quizRouter = {
  getQuestion: publicProcedure
    .input(
      z.object({
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        excludeIds: z.array(z.string()).optional(),
      }),
    )
    .handler(async ({ input }) => {
      const conditions = [eq(quizQuestion.difficulty, input.difficulty)];
      if (input.excludeIds && input.excludeIds.length > 0) {
        for (const id of input.excludeIds) {
          conditions.push(ne(quizQuestion.id, id));
        }
      }

      const questions = await db.query.quizQuestion.findMany({
        where: and(...conditions),
      });

      if (questions.length === 0) {
        throw new Error("No questions available");
      }

      // ランダムに1問選択
      const question = questions[Math.floor(Math.random() * questions.length)];
      if (!question) throw new Error("No questions available");

      // 関連する役を取得
      const questionYaku = await db
        .select({ yakuId: quizQuestionYaku.yakuId })
        .from(quizQuestionYaku)
        .where(eq(quizQuestionYaku.questionId, question.id));

      const yakuIds = questionYaku.map((y) => y.yakuId);
      let yakuNames: string[] = [];
      if (yakuIds.length > 0) {
        const yakuList = await db
          .select({ id: yaku.id, nameJa: yaku.nameJa })
          .from(yaku)
          .where(inArray(yaku.id, yakuIds));
        yakuNames = yakuList.map((y) => y.nameJa);
      }

      return {
        id: question.id,
        difficulty: question.difficulty,
        hand: {
          han: question.han,
          fu: question.fu,
          yakuIds,
          yakuNames,
          isOya: question.isOya,
          isTsumo: question.isTsumo,
          description: question.description,
        },
        choices: JSON.parse(question.choices) as number[],
        createdAt: question.createdAt.toISOString(),
      };
    }),

  submitAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.string(),
        answer: z.number().int(),
      }),
    )
    .handler(async ({ context, input }) => {
      const question = await db.query.quizQuestion.findFirst({
        where: eq(quizQuestion.id, input.questionId),
      });

      if (!question) {
        throw new Error("Question not found");
      }

      const isCorrect = question.correctAnswer === input.answer;
      const attemptId = generateId();
      const now = new Date();

      await db.insert(quizAttempt).values({
        id: attemptId,
        userId: context.session.user.id,
        questionId: input.questionId,
        answer: input.answer,
        isCorrect,
        answeredAt: now,
      });

      // 解説を生成
      const basicScore = question.fu * Math.pow(2, question.han + 2);
      const explanation = {
        han: question.han,
        fu: question.fu,
        basicScore,
        scoreBreakdown: `基本点 ${question.fu} × 2^(${question.han}+2) = ${basicScore}`,
      };

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation,
        pointsEarned: isCorrect ? 10 : 0,
        attemptId,
      };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id;

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizAttempt)
        .where(eq(quizAttempt.userId, userId));

      const items = await db.query.quizAttempt.findMany({
        where: eq(quizAttempt.userId, userId),
        orderBy: (t, { desc }) => [desc(t.answeredAt)],
        limit: input.limit,
        offset: input.offset,
        with: { question: true },
      });

      return {
        total: total[0]?.count ?? 0,
        items: items.map((item) => ({
          id: item.id,
          questionId: item.questionId,
          difficulty: item.question.difficulty,
          isCorrect: item.isCorrect,
          answer: item.answer,
          correctAnswer: item.question.correctAnswer,
          description: item.question.description,
          answeredAt: item.answeredAt.toISOString(),
        })),
      };
    }),
};
