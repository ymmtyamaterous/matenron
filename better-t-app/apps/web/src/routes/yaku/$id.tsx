import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/yaku/$id")({
  component: YakuDetailPage,
});

function YakuDetailPage() {
  const { id } = Route.useParams();
  const detail = useQuery(orpc.yaku.getDetail.queryOptions({ input: { id } }));

  const y = detail.data;

  if (detail.isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-muted-foreground">読み込み中...</div>;
  }

  if (!y) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-destructive">役が見つかりません</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{y.nameJa}</h1>
        <p className="text-muted-foreground">{y.nameReading}</p>
        {y.nameEn && <p className="text-sm text-muted-foreground">{y.nameEn}</p>}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-6">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-muted-foreground">翻数（門前）</p>
            <p className="text-2xl font-bold text-foreground">
              {y.isYakuman ? "役満" : `${y.han}翻`}
            </p>
          </div>
          {y.hanOpen !== null && y.hanOpen !== y.han && (
            <div>
              <p className="text-xs text-muted-foreground">翻数（副露）</p>
              <p className="text-2xl font-bold text-foreground">{y.hanOpen}翻</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {y.hanOpen === null && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">門前のみ</span>
          )}
          {y.isYakuman && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">役満</span>
          )}
        </div>
      </div>

      {y.description && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-2">説明</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{y.description}</p>
        </div>
      )}
    </div>
  );
}
