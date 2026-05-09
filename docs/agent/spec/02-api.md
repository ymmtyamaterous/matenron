# API 設計書 — 麻点論 (Matenron)

## 1. 概要

- **API 層**: oRPC (Open RPC) — 型安全な RPC フレームワーク
- **エンドポイントベース**: `POST /rpc/{procedure}` (oRPC 規約に準拠)
- **OpenAPI 参照**: `GET /api-reference` で Swagger UI を提供
- **認証**: better-auth が管理する `/api/auth/*` エンドポイントは別系統

---

## 2. 認証エンドポイント (`/api/auth/*`)

better-auth が自動生成するエンドポイント群。フロントエンドは `auth-client` 経由で呼び出す。

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth/sign-up/email` | 新規アカウント登録 |
| POST | `/api/auth/sign-in/email` | メール/パスワードでログイン |
| POST | `/api/auth/sign-out` | ログアウト (セッション削除) |
| GET | `/api/auth/get-session` | 現在のセッション情報取得 |

### 2.1 アカウント登録

**リクエスト**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**バリデーション**
- `name`: 1〜50 文字
- `email`: RFC 5322 準拠
- `password`: 8 文字以上、英数字混合

**レスポンス (成功 200)**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "createdAt": "string (ISO8601)"
  },
  "session": {
    "id": "string",
    "token": "string",
    "expiresAt": "string (ISO8601)"
  }
}
```

### 2.2 ログイン

**リクエスト**
```json
{
  "email": "string",
  "password": "string"
}
```

**エラーレスポンス (401)**
```json
{ "error": "Invalid email or password" }
```

---

## 3. oRPC ルーター設計

### 3.1 ルーター構成

```
appRouter
├── healthCheck          公開
├── user
│   ├── getProfile       認証必須
│   └── updateProfile    認証必須
├── score
│   └── calculate        公開 (ログイン不要)
├── quiz
│   ├── getQuestion      公開
│   ├── submitAnswer     認証必須
│   └── getHistory       認証必須
├── yaku
│   ├── list             公開
│   └── getDetail        公開
└── ranking
    └── getLeaderboard   公開
```

### 3.2 共通エラー形式

```json
{
  "code": "UNAUTHORIZED | NOT_FOUND | BAD_REQUEST | INTERNAL_SERVER_ERROR",
  "message": "string"
}
```

---

## 4. 各プロシージャ詳細

### 4.1 `healthCheck`

| 項目 | 内容 |
|------|------|
| 認証 | 不要 |
| 説明 | サーバー疎通確認 |

**レスポンス**
```json
{ "status": "OK" }
```

---

### 4.2 `user.getProfile`

| 項目 | 内容 |
|------|------|
| 認証 | 必須 |
| 説明 | ログイン中ユーザーのプロフィール取得 |

**レスポンス**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "image": "string | null",
  "stats": {
    "totalAnswers": "number",
    "correctAnswers": "number",
    "correctRate": "number (0-100)"
  },
  "createdAt": "string (ISO8601)"
}
```

---

### 4.3 `user.updateProfile`

| 項目 | 内容 |
|------|------|
| 認証 | 必須 |
| 説明 | 表示名の変更 |

**リクエスト**
```json
{
  "name": "string"
}
```

**バリデーション**
- `name`: 1〜50 文字

**レスポンス**
```json
{
  "id": "string",
  "name": "string",
  "updatedAt": "string (ISO8601)"
}
```

---

### 4.4 `score.calculate`

| 項目 | 内容 |
|------|------|
| 認証 | 不要 |
| 説明 | 翻数・符・和了形式から点数を計算 |

**リクエスト**
```json
{
  "han": "number (1-13)",
  "fu": "number (20|25|30|40|50|60|70|80|90|100|110)",
  "isOya": "boolean",
  "isTsumo": "boolean",
  "yakuIds": "string[]"
}
```

**バリデーション**
- `han`: 1〜13 (役満は 13)
- `fu`: 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110 のいずれか
- `isOya` / `isTsumo`: boolean

**レスポンス**
```json
{
  "han": 3,
  "fu": 40,
  "scoreType": "mangan | haneman | baiman | sanbaiman | yakuman | normal",
  "basicScore": 1920,
  "result": {
    "ron": {
      "dealer": 11600,
      "nonDealer": 7700
    },
    "tsumo": {
      "dealerPays": 3900,
      "nonDealerPays": 2000,
      "total": 7900
    }
  }
}
```

---

### 4.5 `quiz.getQuestion`

| 項目 | 内容 |
|------|------|
| 認証 | 不要 |
| 説明 | クイズ問題を 1 問取得 |

**リクエスト**
```json
{
  "difficulty": "beginner | intermediate | advanced",
  "excludeIds": "string[] (任意: 既出問題を除外)"
}
```

**レスポンス**
```json
{
  "id": "string",
  "difficulty": "beginner",
  "hand": {
    "han": 2,
    "fu": 30,
    "yakuIds": ["tanyao", "pinfu"],
    "yakuNames": ["断么九", "平和"],
    "isOya": false,
    "isTsumo": false,
    "description": "断么九・平和 子のロン"
  },
  "choices": [3900, 5200, 7700, 11600],
  "createdAt": "string (ISO8601)"
}
```

---

### 4.6 `quiz.submitAnswer`

| 項目 | 内容 |
|------|------|
| 認証 | 必須 |
| 説明 | クイズへの回答を送信し採点結果を返す |

**リクエスト**
```json
{
  "questionId": "string",
  "answer": "number (選択した点数)"
}
```

**レスポンス**
```json
{
  "isCorrect": true,
  "correctAnswer": 3900,
  "explanation": {
    "han": 2,
    "fu": 30,
    "basicScore": 900,
    "scoreBreakdown": "基本点900 × 4 = 3600 → 端数切り上げ 3900点"
  },
  "pointsEarned": 10,
  "attemptId": "string"
}
```

---

### 4.7 `quiz.getHistory`

| 項目 | 内容 |
|------|------|
| 認証 | 必須 |
| 説明 | ログインユーザーのクイズ回答履歴を取得 |

**リクエスト**
```json
{
  "limit": "number (default: 20, max: 100)",
  "offset": "number (default: 0)"
}
```

**レスポンス**
```json
{
  "total": 42,
  "items": [
    {
      "id": "string",
      "questionId": "string",
      "difficulty": "beginner",
      "isCorrect": true,
      "answer": 3900,
      "correctAnswer": 3900,
      "answeredAt": "string (ISO8601)"
    }
  ]
}
```

---

### 4.8 `yaku.list`

| 項目 | 内容 |
|------|------|
| 認証 | 不要 |
| 説明 | 全役の一覧を取得 |

**リクエスト**
```json
{
  "category": "normal | yakuman | all (default: all)",
  "minHan": "number (任意)",
  "maxHan": "number (任意)",
  "keyword": "string (任意)"
}
```

**レスポンス**
```json
{
  "items": [
    {
      "id": "string",
      "nameJa": "断么九",
      "nameReading": "たんやおちゅー",
      "nameEn": "All Simples",
      "han": 1,
      "hanOpen": 1,
      "isYakuman": false,
      "shortDescription": "1〜9のうち2〜8の数牌のみで構成",
      "category": "normal"
    }
  ]
}
```

---

### 4.9 `yaku.getDetail`

| 項目 | 内容 |
|------|------|
| 認証 | 不要 |
| 説明 | 指定役の詳細情報を取得 |

**リクエスト**
```json
{
  "id": "string"
}
```

**レスポンス**
```json
{
  "id": "tanyao",
  "nameJa": "断么九",
  "nameReading": "たんやおちゅー",
  "nameEn": "All Simples",
  "han": 1,
  "hanOpen": 1,
  "isYakuman": false,
  "category": "normal",
  "description": "1〜9のうち2〜8の数牌のみで構成された役。字牌・1・9の牌を使用しない。",
  "conditions": [
    "手牌に1・9・字牌を使わない",
    "副露可"
  ],
  "examples": [
    "2m3m4m 5p6p7p 3s4s5s 2z2z 8m (ロン)"
  ],
  "relatedYakuIds": ["chiitoi"]
}
```

---

### 4.10 `ranking.getLeaderboard`

| 項目 | 内容 |
|------|------|
| 認証 | 不要 |
| 説明 | クイズ正答率・正答数ランキングを取得 |

**リクエスト**
```json
{
  "type": "correctRate | correctCount",
  "limit": "number (default: 10, max: 50)"
}
```

**レスポンス**
```json
{
  "type": "correctRate",
  "items": [
    {
      "rank": 1,
      "userId": "string",
      "userName": "string",
      "correctRate": 95.2,
      "totalAnswers": 200,
      "correctAnswers": 190
    }
  ]
}
```

---

## 5. oRPC ミドルウェア設計

### 5.1 認証ミドルウェア

```typescript
// packages/api/src/middlewares/auth.ts
const authMiddleware = os.middleware(async ({ context, next }) => {
  const session = await auth.api.getSession({
    headers: context.headers,
  });
  if (!session) {
    throw new ORPCError({ code: "UNAUTHORIZED" });
  }
  return next({ context: { ...context, session, user: session.user } });
});
```

### 5.2 コンテキスト型

```typescript
// packages/api/src/context.ts
export type Context = {
  headers: Headers;
  session?: Session;
  user?: User;
};
```

---

## 6. エラーコード一覧

| コード | HTTP ステータス | 説明 |
|--------|---------------|------|
| `UNAUTHORIZED` | 401 | 未認証 |
| `FORBIDDEN` | 403 | 権限不足 |
| `NOT_FOUND` | 404 | リソースが存在しない |
| `BAD_REQUEST` | 400 | リクエストパラメータ不正 |
| `CONFLICT` | 409 | 重複リソース (例: メール重複) |
| `INTERNAL_SERVER_ERROR` | 500 | サーバー内部エラー |

---

## 7. ルーターファイル構成 (実装マッピング)

```
packages/api/src/
├── index.ts              appRouter をエクスポート
├── context.ts            Context 型定義
├── middlewares/
│   └── auth.ts           認証ミドルウェア
└── routers/
    ├── index.ts          appRouter の組み立て
    ├── user.ts           user.* プロシージャ
    ├── score.ts          score.* プロシージャ
    ├── quiz.ts           quiz.* プロシージャ
    ├── yaku.ts           yaku.* プロシージャ
    └── ranking.ts        ranking.* プロシージャ
```
