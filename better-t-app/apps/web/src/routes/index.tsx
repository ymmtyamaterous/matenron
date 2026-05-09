import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const features = [
  {
    to: "/score-calculator",
    icon: "🀄",
    title: "点数計算",
    description: "翻数・符数を入力してロン/ツモの点数を即座に計算。基本点から満貫以上の固定点まで対応。",
  },
  {
    to: "/quiz",
    icon: "📝",
    title: "クイズ",
    description: "難易度別の点数計算クイズで実戦感覚を養おう。正誤履歴も確認できます。",
  },
  {
    to: "/yaku",
    icon: "📖",
    title: "役一覧",
    description: "麻雀の全役を翻数・難易度付きで網羅。初心者から上級者まで役立つ辞典。",
  },
  {
    to: "/ranking",
    icon: "🏆",
    title: "ランキング",
    description: "クイズ正答率で競うランキング。上位を目指して腕を磨こう。",
  },
] as const;

function HomeComponent() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">麻点論</h1>
        <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl mx-auto">
          麻雀の点数計算をマスターしよう。<br />計算ツール・クイズ・役辞典を一箇所に。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/score-calculator"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-foreground text-primary font-semibold hover:opacity-90 transition-opacity"
          >
            点数を計算する
          </Link>
          <Link
            to="/quiz"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-primary-foreground/50 text-primary-foreground font-semibold hover:bg-primary-foreground/10 transition-colors"
          >
            クイズに挑戦
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-10">主な機能</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group block rounded-xl border border-border bg-card p-6 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
