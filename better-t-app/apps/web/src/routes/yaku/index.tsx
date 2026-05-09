import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/yaku/")({
  component: YakuListPage,
});

function YakuListPage() {
  const yakuList = useQuery(orpc.yaku.list.queryOptions({ input: {} }));

  const grouped = (yakuList.data?.items ?? []).reduce<Record<number, NonNullable<typeof yakuList.data>["items"]>>((acc, y) => {
    if (!acc[y.han]) acc[y.han] = [];
    acc[y.han]!.push(y);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">役一覧</h1>
      <p className="text-muted-foreground mb-8">麻雀の全役を翻数別に掲載</p>

      {yakuList.isLoading && <p className="text-muted-foreground">読み込み中...</p>}

      {Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b)
        .map((han) => (
          <div key={han} className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm">
                {han === 13 ? "役満" : `${han}翻`}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[han]?.map((y) => (
                <Link
                  key={y.id}
                  to="/yaku/$id"
                  params={{ id: y.id }}
                  className="rounded-xl border border-border bg-card p-4 hover:border-primary hover:shadow-sm transition-all"
                >
                  <p className="font-semibold text-foreground">{y.nameJa}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{y.nameReading}</p>
                  {y.isYakuman && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive font-medium">
                      役満
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
