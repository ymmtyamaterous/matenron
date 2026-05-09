import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/quiz/history")({
  component: QuizHistoryPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function QuizHistoryPage() {
  const history = useQuery(orpc.quiz.getHistory.queryOptions({ input: { limit: 50 } }));

  const attempts = history.data?.items ?? [];
  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">クイズ履歴</h1>
      <p className="text-muted-foreground mb-6">直近50件の回答履歴</p>

      {total > 0 && (
        <div className="flex gap-6 rounded-xl border border-border bg-card p-5 mb-6">
          <div>
            <p className="text-xs text-muted-foreground">総回答数</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">正解数</p>
            <p className="text-2xl font-bold text-primary">{correct}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">正答率</p>
            <p className="text-2xl font-bold text-foreground">{Math.round((correct / total) * 100)}%</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {history.isLoading && (
          <p className="text-muted-foreground">読み込み中...</p>
        )}
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {attempt.answer.toLocaleString()}点 を回答
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(attempt.answeredAt).toLocaleString("ja-JP")}
              </p>
            </div>
            <span className={`text-sm font-bold ${attempt.isCorrect ? "text-green-600" : "text-destructive"}`}>
              {attempt.isCorrect ? "正解" : "不正解"}
            </span>
          </div>
        ))}
        {!history.isLoading && attempts.length === 0 && (
          <p className="text-muted-foreground text-center py-8">まだ回答履歴がありません</p>
        )}
      </div>
    </div>
  );
}
