import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/ranking")({
  component: RankingPage,
});

function RankingPage() {
  const ranking = useQuery(orpc.ranking.getLeaderboard.queryOptions({ input: { type: "correctRate", limit: 20 } }));

  const entries = ranking.data?.items ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">ランキング</h1>
      <p className="text-muted-foreground mb-8">クイズ正答率トップ20</p>

      {ranking.isLoading && <p className="text-muted-foreground">読み込み中...</p>}

      <div className="space-y-3">
        {entries.map((entry, idx) => (
          <div
            key={entry.userId}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              idx === 0
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : idx === 1
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  : idx === 2
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-muted text-muted-foreground"
            }`}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{entry.userName}</p>
              <p className="text-xs text-muted-foreground">{entry.totalAnswers}問回答</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-lg text-primary">{entry.correctRate}%</p>
              <p className="text-xs text-muted-foreground">{entry.correctAnswers}正解</p>
            </div>
          </div>
        ))}

        {!ranking.isLoading && entries.length === 0 && (
          <p className="text-muted-foreground text-center py-8">まだランキングデータがありません</p>
        )}
      </div>
    </div>
  );
}
