import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  const quizHistory = useQuery(orpc.quiz.getHistory.queryOptions({ input: { limit: 5 } }));

  const user = session.data?.user;
  const attempts = quizHistory.data?.items ?? [];
  const correctCount = attempts.filter((a) => a.isCorrect).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-1">ダッシュボード</h1>
      <p className="text-muted-foreground mb-8">ようこそ、{user?.name} さん</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">クイズ回答数</p>
          <p className="text-3xl font-bold text-foreground">{attempts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">正解数</p>
          <p className="text-3xl font-bold text-primary">{correctCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-1">正答率</p>
          <p className="text-3xl font-bold text-foreground">
            {attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/score-calculator"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          点数計算する
        </Link>
        <Link
          to="/quiz"
          className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:border-primary transition-colors"
        >
          クイズに挑戦
        </Link>
        <Link
          to="/profile"
          className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:border-primary transition-colors"
        >
          プロフィール設定
        </Link>
      </div>
    </div>
  );
}

