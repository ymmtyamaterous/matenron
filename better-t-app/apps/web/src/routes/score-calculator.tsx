import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@better-t-app/ui/components/button";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/score-calculator")({
  component: ScoreCalculatorPage,
});

const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

function ScoreCalculatorPage() {
  const [han, setHan] = useState(1);
  const [fu, setFu] = useState(30);
  const [isOya, setIsOya] = useState(false);
  const [isTsumo, setIsTsumo] = useState(false);

  const calculate = useMutation(orpc.score.calculate.mutationOptions());

  const handleCalculate = () => {
    calculate.mutate({ han, fu, isOya, isTsumo });
  };

  const result = calculate.data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">点数計算</h1>
      <p className="text-muted-foreground mb-8">翻数・符数を選択してロン/ツモの点数を計算します</p>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6 mb-6">
        {/* 翻数 */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">翻数</p>
          <div className="flex flex-wrap gap-2">
            {HAN_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHan(h)}
                className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  han === h
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background text-foreground hover:border-primary"
                }`}
              >
                {h}翻
              </button>
            ))}
          </div>
        </div>

        {/* 符数 */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">符数</p>
          <div className="flex flex-wrap gap-2">
            {FU_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFu(f)}
                className={`px-3 h-10 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  fu === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background text-foreground hover:border-primary"
                }`}
              >
                {f}符
              </button>
            ))}
          </div>
        </div>

        {/* オプション */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOya}
              onChange={(e) => setIsOya(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium text-foreground">親</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTsumo}
              onChange={(e) => setIsTsumo(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium text-foreground">ツモ</span>
          </label>
        </div>

        <Button onClick={handleCalculate} disabled={calculate.isPending} className="w-full">
          {calculate.isPending ? "計算中..." : "計算する"}
        </Button>
      </div>

      {/* 結果表示 */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">計算結果</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {result.scoreType === "normal"
                ? `${han}翻 ${fu}符`
                : result.scoreType === "mangan"
                  ? "満貫"
                  : result.scoreType === "haneman"
                    ? "跳満"
                    : result.scoreType === "baiman"
                      ? "倍満"
                      : result.scoreType === "sanbaiman"
                        ? "三倍満"
                        : result.scoreType === "yakuman"
                          ? "役満"
                          : "ダブル役満"}
            </span>
          </div>

          {!isTsumo ? (
            <div>
              <p className="text-sm text-muted-foreground mb-1">ロン</p>
              <p className="text-4xl font-bold text-foreground">
                {isOya ? result.result.ron.dealer.toLocaleString() : result.result.ron.nonDealer.toLocaleString()}
                <span className="text-lg font-normal ml-1">点</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">ツモ</p>
              {isOya ? (
                <div>
                  <p className="text-sm text-muted-foreground">子 全員</p>
                  <p className="text-3xl font-bold text-foreground">
                    {result.result.tsumo.nonDealerPays.toLocaleString()}
                    <span className="text-base font-normal ml-1">点 × 3</span>
                  </p>
                </div>
              ) : (
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">親</p>
                    <p className="text-2xl font-bold text-foreground">
                      {result.result.tsumo.dealerPays.toLocaleString()}<span className="text-sm ml-1">点</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">子</p>
                    <p className="text-2xl font-bold text-foreground">
                      {result.result.tsumo.nonDealerPays.toLocaleString()}<span className="text-sm ml-1">点 × 2</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">合計</p>
                <p className="text-3xl font-bold text-primary">
                  {result.result.tsumo.total.toLocaleString()}<span className="text-base font-normal ml-1">点</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {calculate.isError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          計算できませんでした。翻数・符数の組み合わせを確認してください。
        </div>
      )}
    </div>
  );
}
