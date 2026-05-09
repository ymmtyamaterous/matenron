import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const yaku = sqliteTable(
  "yaku",
  {
    id: text("id").primaryKey(),
    nameJa: text("name_ja").notNull(),
    nameReading: text("name_reading").notNull(),
    nameEn: text("name_en").notNull(),
    han: integer("han").notNull(),
    hanOpen: integer("han_open"),
    isYakuman: integer("is_yakuman", { mode: "boolean" }).notNull().default(false),
    category: text("category", { enum: ["normal", "yakuman"] }).notNull(),
    description: text("description").notNull(),
    conditions: text("conditions").notNull(), // JSON array
    examples: text("examples").notNull(), // JSON array
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("yaku_category_idx").on(table.category),
    index("yaku_han_idx").on(table.han),
    index("yaku_is_yakuman_idx").on(table.isYakuman),
  ],
);

export const yakuRelations = relations(yaku, ({ many }) => ({
  quizQuestionYaku: many(quizQuestionYaku),
}));

export const quizQuestion = sqliteTable(
  "quiz_question",
  {
    id: text("id").primaryKey(),
    difficulty: text("difficulty", {
      enum: ["beginner", "intermediate", "advanced"],
    }).notNull(),
    han: integer("han").notNull(),
    fu: integer("fu").notNull(),
    isOya: integer("is_oya", { mode: "boolean" }).notNull().default(false),
    isTsumo: integer("is_tsumo", { mode: "boolean" }).notNull().default(false),
    description: text("description").notNull(),
    correctAnswer: integer("correct_answer").notNull(),
    choices: text("choices").notNull(), // JSON array [3900, 5200, 7700, 11600]
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("quiz_question_difficulty_idx").on(table.difficulty)],
);

export const quizQuestionRelations = relations(quizQuestion, ({ many }) => ({
  quizQuestionYaku: many(quizQuestionYaku),
  quizAttempts: many(quizAttempt),
}));

export const quizQuestionYaku = sqliteTable("quiz_question_yaku", {
  questionId: text("question_id")
    .notNull()
    .references(() => quizQuestion.id, { onDelete: "cascade" }),
  yakuId: text("yaku_id")
    .notNull()
    .references(() => yaku.id, { onDelete: "cascade" }),
});

export const quizQuestionYakuRelations = relations(quizQuestionYaku, ({ one }) => ({
  question: one(quizQuestion, {
    fields: [quizQuestionYaku.questionId],
    references: [quizQuestion.id],
  }),
  yaku: one(yaku, {
    fields: [quizQuestionYaku.yakuId],
    references: [yaku.id],
  }),
}));

export const quizAttempt = sqliteTable(
  "quiz_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id),
    answer: integer("answer").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    answeredAt: integer("answered_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("quiz_attempt_user_id_idx").on(table.userId),
    index("quiz_attempt_question_id_idx").on(table.questionId),
    index("quiz_attempt_user_correct_idx").on(table.userId, table.isCorrect),
  ],
);

export const quizAttemptRelations = relations(quizAttempt, ({ one }) => ({
  question: one(quizQuestion, {
    fields: [quizAttempt.questionId],
    references: [quizQuestion.id],
  }),
}));
