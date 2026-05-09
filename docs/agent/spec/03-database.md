# データベース設計書 — 麻点論 (Matenron)

## 1. 概要

| 項目 | 内容 |
|------|------|
| DBMS | SQLite (libsql) |
| ORM | Drizzle ORM |
| スキーマ管理 | `packages/db/src/schema/` |
| マイグレーション | drizzle-kit generate / migrate |
| タイムスタンプ精度 | ミリ秒 (unixepoch) |

---

## 2. ER 図

```
┌──────────────┐       ┌──────────────────┐
│    user      │       │     session      │
│──────────────│1     *│──────────────────│
│ id (PK)      │───────│ id (PK)          │
│ name         │       │ userId (FK)      │
│ email        │       │ token            │
│ emailVerified│       │ expiresAt        │
│ image        │       │ ipAddress        │
│ createdAt    │       │ userAgent        │
│ updatedAt    │       │ createdAt        │
└──────────────┘       │ updatedAt        │
       │1              └──────────────────┘
       │
       │1             ┌──────────────────┐
       └──────────────│    account       │
              *        │──────────────────│
                       │ id (PK)          │
                       │ userId (FK)      │
                       │ providerId       │
                       │ accountId        │
                       │ accessToken      │
                       │ refreshToken     │
                       │ ...              │
                       └──────────────────┘

┌──────────────┐       ┌──────────────────────┐
│     yaku     │       │    quiz_question      │
│──────────────│1     *│──────────────────────│
│ id (PK)      │───────│ id (PK)               │
│ nameJa       │       │ han                   │
│ nameReading  │       │ fu                    │
│ nameEn       │       │ isOya                 │
│ han          │       │ isTsumo               │
│ hanOpen      │       │ difficulty            │
│ isYakuman    │       │ description           │
│ category     │       │ correctAnswer         │
│ description  │       │ choices (JSON)        │
│ conditions   │       │ createdAt             │
│ examples     │       └──────────────────────┘
│ sortOrder    │                │1
└──────────────┘                │
                                │*
                       ┌────────────────────┐
┌──────────────┐       │    quiz_attempt    │
│    user      │1     *│────────────────────│
│──────────────│───────│ id (PK)            │
│ id (PK)      │       │ userId (FK)        │
│ ...          │       │ questionId (FK)    │
└──────────────┘       │ answer             │
                       │ isCorrect          │
                       │ answeredAt         │
                       └────────────────────┘

┌──────────────────────┐
│  quiz_question_yaku  │  (中間テーブル)
│──────────────────────│
│ questionId (FK)      │
│ yakuId (FK)          │
└──────────────────────┘
```

---

## 3. テーブル定義

### 3.1 `user` テーブル (既存 — better-auth)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK (CUID) |
| `name` | TEXT | NOT NULL | — | 表示名 |
| `email` | TEXT | NOT NULL | — | メールアドレス (UNIQUE) |
| `emailVerified` | INTEGER | NOT NULL | 0 | メール認証済みフラグ |
| `image` | TEXT | NULL | — | アバター画像 URL |
| `createdAt` | INTEGER | NOT NULL | — | 作成日時 (ms unixepoch) |
| `updatedAt` | INTEGER | NOT NULL | — | 更新日時 (ms unixepoch) |

**インデックス**: `email` (UNIQUE)

---

### 3.2 `session` テーブル (既存 — better-auth)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK |
| `expiresAt` | INTEGER | NOT NULL | — | セッション有効期限 (ms unixepoch) |
| `token` | TEXT | NOT NULL | — | セッショントークン (UNIQUE) |
| `createdAt` | INTEGER | NOT NULL | — | 作成日時 |
| `updatedAt` | INTEGER | NOT NULL | — | 更新日時 |
| `ipAddress` | TEXT | NULL | — | クライアント IP |
| `userAgent` | TEXT | NULL | — | ユーザーエージェント |
| `userId` | TEXT | NOT NULL | — | FK → user.id (CASCADE DELETE) |

**インデックス**: `userId`, `token` (UNIQUE)

---

### 3.3 `account` テーブル (既存 — better-auth)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK |
| `accountId` | TEXT | NOT NULL | — | プロバイダー側のアカウント ID |
| `providerId` | TEXT | NOT NULL | — | プロバイダー識別子 (例: "credential") |
| `userId` | TEXT | NOT NULL | — | FK → user.id (CASCADE DELETE) |
| `accessToken` | TEXT | NULL | — | OAuth アクセストークン |
| `refreshToken` | TEXT | NULL | — | OAuth リフレッシュトークン |
| `idToken` | TEXT | NULL | — | OAuth ID トークン |
| `accessTokenExpiresAt` | INTEGER | NULL | — | アクセストークン有効期限 |
| `refreshTokenExpiresAt` | INTEGER | NULL | — | リフレッシュトークン有効期限 |
| `scope` | TEXT | NULL | — | OAuth スコープ |
| `password` | TEXT | NULL | — | ハッシュ化済みパスワード |
| `createdAt` | INTEGER | NOT NULL | — | 作成日時 |
| `updatedAt` | INTEGER | NOT NULL | — | 更新日時 |

**インデックス**: `userId`

---

### 3.4 `verification` テーブル (既存 — better-auth)

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK |
| `identifier` | TEXT | NOT NULL | — | 検証対象 (メールアドレスなど) |
| `value` | TEXT | NOT NULL | — | 検証コード |
| `expiresAt` | INTEGER | NOT NULL | — | 有効期限 |
| `createdAt` | INTEGER | NULL | — | 作成日時 |
| `updatedAt` | INTEGER | NULL | — | 更新日時 |

**インデックス**: `identifier`

---

### 3.5 `yaku` テーブル (新規)

麻雀の役のマスターデータ。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK (例: "tanyao") |
| `nameJa` | TEXT | NOT NULL | — | 役名 (日本語) |
| `nameReading` | TEXT | NOT NULL | — | 読み仮名 |
| `nameEn` | TEXT | NOT NULL | — | 英語名 |
| `han` | INTEGER | NOT NULL | — | 翻数 (門前) |
| `hanOpen` | INTEGER | NULL | — | 翻数 (食い下がり、NULL=副露不可) |
| `isYakuman` | INTEGER | NOT NULL | 0 | 役満フラグ (0/1) |
| `category` | TEXT | NOT NULL | — | "normal" または "yakuman" |
| `description` | TEXT | NOT NULL | — | 役の説明 |
| `conditions` | TEXT | NOT NULL | — | 成立条件 (JSON 配列 → TEXT) |
| `examples` | TEXT | NOT NULL | — | 例示牌テキスト (JSON 配列 → TEXT) |
| `sortOrder` | INTEGER | NOT NULL | 0 | 表示順 |
| `createdAt` | INTEGER | NOT NULL | — | 作成日時 (ms unixepoch) |
| `updatedAt` | INTEGER | NOT NULL | — | 更新日時 (ms unixepoch) |

**インデックス**: `category`, `han`, `isYakuman`

**Drizzle スキーマ例**

```typescript
// packages/db/src/schema/yaku.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const yaku = sqliteTable("yaku", {
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
  examples: text("examples").notNull(),     // JSON array
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
```

---

### 3.6 `quiz_question` テーブル (新規)

クイズ問題のマスターデータ。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK (CUID) |
| `difficulty` | TEXT | NOT NULL | — | "beginner" / "intermediate" / "advanced" |
| `han` | INTEGER | NOT NULL | — | 翻数 |
| `fu` | INTEGER | NOT NULL | — | 符数 |
| `isOya` | INTEGER | NOT NULL | 0 | 親フラグ (0=子, 1=親) |
| `isTsumo` | INTEGER | NOT NULL | 0 | ツモフラグ (0=ロン, 1=ツモ) |
| `description` | TEXT | NOT NULL | — | 問題文 (例: "断么九・平和 子のロン") |
| `correctAnswer` | INTEGER | NOT NULL | — | 正解点数 |
| `choices` | TEXT | NOT NULL | — | 選択肢 4 件 (JSON 配列 → TEXT) |
| `createdAt` | INTEGER | NOT NULL | — | 作成日時 (ms unixepoch) |
| `updatedAt` | INTEGER | NOT NULL | — | 更新日時 (ms unixepoch) |

**インデックス**: `difficulty`

**Drizzle スキーマ例**

```typescript
// packages/db/src/schema/quiz.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const quizQuestion = sqliteTable("quiz_question", {
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
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
```

---

### 3.7 `quiz_question_yaku` テーブル (新規)

クイズ問題と役のリレーション (多対多)。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `questionId` | TEXT | NOT NULL | — | FK → quiz_question.id |
| `yakuId` | TEXT | NOT NULL | — | FK → yaku.id |

**複合 PK**: `(questionId, yakuId)`

```typescript
// packages/db/src/schema/quiz.ts (続き)
export const quizQuestionYaku = sqliteTable(
  "quiz_question_yaku",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestion.id, { onDelete: "cascade" }),
    yakuId: text("yaku_id")
      .notNull()
      .references(() => yaku.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.yakuId] })]
);
```

---

### 3.8 `quiz_attempt` テーブル (新規)

ユーザーのクイズ回答履歴。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| `id` | TEXT | NOT NULL | — | PK (CUID) |
| `userId` | TEXT | NOT NULL | — | FK → user.id (CASCADE DELETE) |
| `questionId` | TEXT | NOT NULL | — | FK → quiz_question.id |
| `answer` | INTEGER | NOT NULL | — | ユーザーが選んだ点数 |
| `isCorrect` | INTEGER | NOT NULL | — | 正解フラグ (0/1) |
| `answeredAt` | INTEGER | NOT NULL | — | 回答日時 (ms unixepoch) |

**インデックス**: `userId`, `questionId`, `(userId, isCorrect)`

**Drizzle スキーマ例**

```typescript
// packages/db/src/schema/quiz.ts (続き)
export const quizAttempt = sqliteTable("quiz_attempt", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => quizQuestion.id),
  answer: integer("answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp_ms" }).notNull(),
});
```

---

## 4. スキーマファイル構成

```
packages/db/src/schema/
├── index.ts        全テーブルをエクスポート
├── auth.ts         user / session / account / verification (既存)
├── yaku.ts         yaku (新規)
└── quiz.ts         quiz_question / quiz_question_yaku / quiz_attempt (新規)
```

---

## 5. シードデータ方針

| テーブル | シード | 件数目安 |
|---------|--------|---------|
| `yaku` | 全役をシードファイルで投入 | 約 40 件 |
| `quiz_question` | 各難易度のサンプル問題を投入 | 初級 20 / 中級 20 / 上級 10 件 |
| `quiz_question_yaku` | 上記に紐づくリレーション | 問題数 × 平均役数 |

シードファイルは `packages/db/src/seed.ts` に配置し、サーバー起動時に自動実行する。

---

## 6. マイグレーション方針

1. スキーマ変更は `drizzle-kit generate` で自動生成
2. `packages/db/drizzle/` 配下に連番の SQL ファイルを出力
3. サーバー起動時に `migrate()` を呼び出し、未適用のマイグレーションを自動実行
4. `_journal.json` を手動編集する場合は `date` コマンドでシステム時刻を確認してから実施

---

## 7. 点数計算用定数テーブル (アプリ内定義)

DBには持たず、アプリケーションコード内に定数として定義する。

```typescript
// apps/server/src/lib/score/tables.ts
// 満貫以上の固定点数
const FIXED_SCORES = {
  mangan:     { dealer: 12000, nonDealer: 8000 },
  haneman:    { dealer: 18000, nonDealer: 12000 },
  baiman:     { dealer: 24000, nonDealer: 16000 },
  sanbaiman:  { dealer: 36000, nonDealer: 24000 },
  yakuman:    { dealer: 48000, nonDealer: 32000 },
};
```
