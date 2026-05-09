import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/quiz/")({
  component: QuizTopPage,
});

function QuizTopPage() {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  const history = useQuery({
    ...orpc.quiz.getHistory.queryOptions({ input: { limit: 10 } }),
    enabled: isLoggedIn,
  });

  const attempts = history.data?.items ?? [];
  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">クイズ</h1>
      <p className="text-muted-foreground mb-8">点数計算力を鍛えよう</p>

      {/* 難易度選択 */}
      <div className="space-y-4 mb-8">
        {(
          [
            { difficulty: "beginner", label: "初級", description: "リーチ・タンヤオ等の基本役", color: "text-green-600" },
            { difficulty: "intermediate", label: "中級", description: "複合役・判断力を鍛える", color: "text-yellow-600" },
            { difficulty: "advanced", label: "上級", description: "役満・高難度問題", color: "text-red-600" },
          ] as const
        ).map((d) => (
          <Link
            key={d.difficulty}
            to="/quiz/play"
            search={{ difficulty: d.difficulty }}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-sm transition-all group"
          >
            <div>
              <p className={`font-bold text-lg ${d.color}`}>{d.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{d.description}</p>
            </div>
            <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
          </Link>
        ))}
      </div>

      {/* 直近の成績 */}
      {total > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground mb-3">直近の成績</h2>
          <div className="flex gap-6 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">回答数</p>
              <p className="text-2xl font-bold text-foreground">{total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">正解</p>
              <p className="text-2xl font-bold text-primary">{correct}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">正答率</p>
              <p className="text-2xl font-bold text-foreground">{Math.round((correct / total) * 100)}%</p>
            </div>
          </div>
          <Link to="/quiz/history" className="text-sm text-primary hover:underline">
            履歴を見る →
          </Link>
        </div>
      )}
    </div>
  );
}
