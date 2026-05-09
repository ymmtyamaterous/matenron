import type { Mentsu, Tile, WindValue } from "@better-t-app/api/lib/score/tiles";
import { tileDisplayName } from "@better-t-app/api/lib/score/tiles";
import { Button } from "@better-t-app/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FuroInput } from "@/components/furo-input";
import { HandDisplay } from "@/components/hand-display";
import { TileSelector } from "@/components/tile-selector";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/score-calculator")({
  component: ScoreCalculatorPage,
});

const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

const WIND_NAMES: Record<number, string> = { 1: "東", 2: "南", 3: "西", 4: "北" };

const SCORE_TYPE_LABELS: Record<string, string> = {
  normal: "",
  mangan: "満貫",
  haneman: "跳満",
  baiman: "倍満",
  sanbaiman: "三倍満",
  yakuman: "役満",
  double_yakuman: "ダブル役満",
};

// ========== 翻数/符数モード ==========
function ManualModePanel({
  isOya,
  isTsumo,
  setIsOya,
  setIsTsumo,
}: {
  isOya: boolean;
  isTsumo: boolean;
  setIsOya: (v: boolean) => void;
  setIsTsumo: (v: boolean) => void;
}) {
  const [han, setHan] = useState(1);
  const [fu, setFu] = useState(30);
  const calculate = useMutation(orpc.score.calculate.mutationOptions());

  const result = calculate.data;

  return (
    <>
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
            <input type="checkbox" checked={isOya} onChange={(e) => setIsOya(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-foreground">親</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isTsumo} onChange={(e) => setIsTsumo(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-foreground">ツモ</span>
          </label>
        </div>

        <Button onClick={() => calculate.mutate({ han, fu, isOya, isTsumo })} disabled={calculate.isPending} className="w-full">
          {calculate.isPending ? "計算中..." : "計算する"}
        </Button>
      </div>

      {result && <ScoreResultDisplay result={result.result} scoreType={result.scoreType} han={result.han} fu={result.fu} isOya={isOya} isTsumo={isTsumo} />}
      {calculate.isError && <ErrorMessage message="計算できませんでした。翻数・符数の組み合わせを確認してください。" />}
    </>
  );
}

// ========== 手牌入力モード ==========
function HandInputModePanel({
  isOya,
  isTsumo,
  setIsOya,
  setIsTsumo,
}: {
  isOya: boolean;
  isTsumo: boolean;
  setIsOya: (v: boolean) => void;
  setIsTsumo: (v: boolean) => void;
}) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [winTile, setWinTile] = useState<Tile | null>(null);
  const [furoMentsuList, setFuroMentsuList] = useState<Mentsu[]>([]);
  const [bakaze, setBakaze] = useState<WindValue>(1);
  const [jikaze, setJikaze] = useState<WindValue>(1);
  const [isRiichi, setIsRiichi] = useState(false);
  const [isDoubleRiichi, setIsDoubleRiichi] = useState(false);
  const [isIppatsu, setIsIppatsu] = useState(false);
  const [isRinshan, setIsRinshan] = useState(false);
  const [isChankan, setIsChankan] = useState(false);
  const [isHaitei, setIsHaitei] = useState(false);
  const [isHoutei, setIsHoutei] = useState(false);
  const [doraCount, setDoraCount] = useState(0);
  const [uraDoraCount, setUraDoraCount] = useState(0);
  const [akaDoraCount, setAkaDoraCount] = useState(0);

  const analyze = useMutation(orpc.score.analyzeHand.mutationOptions());

  // 副露枚数に基づく暗牌最大枚数 (14 - 3*n)
  const maxConcealedTiles = 14 - 3 * furoMentsuList.length;

  // チー/ポン/明槓があれば門前崩れ（暗槓のみは門前維持）
  const hasFuro = furoMentsuList.some((m) => m.furoType !== "ankan");

  // 4枚制限チェック用: 暗牌 + 副露牌をすべて含む
  const allUsedTiles = useMemo(
    () => [...tiles, ...furoMentsuList.flatMap((m) => m.tiles)],
    [tiles, furoMentsuList],
  );

  const handleAddTile = (tile: Tile) => {
    if (tiles.length >= maxConcealedTiles) return;
    const newTiles = [...tiles, tile];
    setTiles(newTiles);
    // 最大枚数に達したら自動的に和了牌を設定
    if (newTiles.length === maxConcealedTiles) {
      setWinTile(tile);
    }
  };

  const handleRemoveTile = (index: number) => {
    const newTiles = tiles.filter((_, i) => i !== index);
    setTiles(newTiles);
    if (winTile && index === tiles.length - 1) {
      setWinTile(null);
    }
  };

  const handleSetWinTile = (tile: Tile) => {
    setWinTile(tile);
  };

  const handleAddFuro = (mentsu: Mentsu) => {
    if (furoMentsuList.length >= 4) return;
    const newFuroList = [...furoMentsuList, mentsu];
    setFuroMentsuList(newFuroList);

    // 副露追加で暗牌最大枚数が減るため、超過分を切り捨て
    const newMax = 14 - 3 * newFuroList.length;
    if (tiles.length > newMax) {
      setTiles(tiles.slice(0, newMax));
      setWinTile(null);
    }

    // チー/ポン/明槓で門前崩れ → 立直系フラグをリセット
    const breaksMenzen = mentsu.furoType !== "ankan";
    if (breaksMenzen) {
      setIsRiichi(false);
      setIsDoubleRiichi(false);
      setIsIppatsu(false);
      setUraDoraCount(0);
    }

    analyze.reset();
  };

  const handleRemoveFuro = (index: number) => {
    setFuroMentsuList(furoMentsuList.filter((_, i) => i !== index));
    analyze.reset();
  };

  const handleReset = () => {
    setTiles([]);
    setWinTile(null);
    setFuroMentsuList([]);
    setIsRiichi(false);
    setIsDoubleRiichi(false);
    setIsIppatsu(false);
    setIsRinshan(false);
    setIsChankan(false);
    setIsHaitei(false);
    setIsHoutei(false);
    setDoraCount(0);
    setUraDoraCount(0);
    setAkaDoraCount(0);
    analyze.reset();
  };

  const canAnalyze = tiles.length === maxConcealedTiles && winTile !== null;

  const handleAnalyze = () => {
    if (!canAnalyze || !winTile) return;
    analyze.mutate({
      tiles,
      furoMentsuList: furoMentsuList.map((m) => ({
        type: m.type,
        tiles: m.tiles,
        isFuro: m.isFuro,
        furoType: m.furoType ?? "pon",
      })),
      winTile,
      isTsumo,
      isOya,
      bakaze,
      jikaze,
      isRiichi,
      isDoubleRiichi,
      isIppatsu,
      isRinshan,
      isChankan,
      isHaitei,
      isHoutei,
      doraCount,
      uraDoraCount,
      akaDoraCount,
    });
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6 mb-4">
        {/* 副露 (鳴き) */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">副露 (鳴き)</p>
          <FuroInput
            furoMentsuList={furoMentsuList}
            allUsedTiles={allUsedTiles}
            onAdd={handleAddFuro}
            onRemove={handleRemoveFuro}
            disabled={furoMentsuList.length >= 4}
          />
        </div>

        {/* 手牌表示 */}
        <HandDisplay
          tiles={tiles}
          winTile={winTile}
          onRemoveTile={handleRemoveTile}
          onSetWinTile={handleSetWinTile}
          maxTiles={maxConcealedTiles}
        />

        {/* 牌選択 */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            牌を選択
            <span className="text-xs text-muted-foreground ml-2">
              ({tiles.length}/{maxConcealedTiles}枚)
            </span>
          </p>
          <TileSelector
            onSelect={handleAddTile}
            currentTiles={allUsedTiles}
            disabled={tiles.length >= maxConcealedTiles}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            リセット
          </Button>
        </div>
      </div>

      {/* 場況設定 */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5 mb-4">
        <p className="text-sm font-semibold text-foreground">場況・特殊条件</p>

        {/* 場風・自風 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">場風</p>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4] as WindValue[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setBakaze(w)}
                  className={`w-9 h-8 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    bakaze === w ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  {WIND_NAMES[w]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">自風</p>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4] as WindValue[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setJikaze(w)}
                  className={`w-9 h-8 rounded text-xs font-medium border transition-colors cursor-pointer ${
                    jikaze === w ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  {WIND_NAMES[w]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 特殊条件チェックボックス */}
        <div className="flex flex-wrap gap-4">
          {(
            [
              { label: "親", checked: isOya, set: setIsOya },
              { label: "ツモ", checked: isTsumo, set: setIsTsumo },
              { label: "立直", checked: isRiichi, set: (v: boolean) => { setIsRiichi(v); if (!v) { setIsDoubleRiichi(false); setIsIppatsu(false); setUraDoraCount(0); } }, disabled: isDoubleRiichi || hasFuro },
              { label: "ダブル立直", checked: isDoubleRiichi, set: (v: boolean) => { setIsDoubleRiichi(v); if (v) setIsRiichi(true); }, disabled: hasFuro },
              { label: "一発", checked: isIppatsu, set: setIsIppatsu, disabled: hasFuro },
              { label: "嶺上開花", checked: isRinshan, set: setIsRinshan },
              { label: "槍槓", checked: isChankan, set: setIsChankan },
              { label: "海底", checked: isHaitei, set: setIsHaitei },
              { label: "河底", checked: isHoutei, set: setIsHoutei },
            ] as Array<{ label: string; checked: boolean; set: (v: boolean) => void; disabled?: boolean }>
          ).map(({ label, checked, set, disabled }) => (
            <label key={label} className={`flex items-center gap-1.5 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
              <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} disabled={disabled} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>

        {/* ドラ */}
        <div className="flex flex-wrap gap-6">
          {(
            [
              { label: "ドラ", value: doraCount, set: setDoraCount, max: 10 },
              { label: "裏ドラ", value: uraDoraCount, set: setUraDoraCount, max: 10, disabled: !isRiichi },
              { label: "赤ドラ", value: akaDoraCount, set: setAkaDoraCount, max: 3 },
            ] as Array<{ label: string; value: number; set: (v: number) => void; max: number; disabled?: boolean }>
          ).map(({ label, value, set, max, disabled }) => (
            <div key={label} className={disabled ? "opacity-40 pointer-events-none" : ""}>
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => set(Math.max(0, value - 1))} className="w-6 h-6 rounded border border-border bg-background text-foreground hover:border-primary text-sm cursor-pointer">−</button>
                <span className="w-5 text-center text-sm font-medium text-foreground">{value}</span>
                <button type="button" onClick={() => set(Math.min(max, value + 1))} className="w-6 h-6 rounded border border-border bg-background text-foreground hover:border-primary text-sm cursor-pointer">+</button>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleAnalyze} disabled={!canAnalyze || analyze.isPending} className="w-full">
          {analyze.isPending
            ? "解析中..."
            : canAnalyze
              ? "点数を計算する"
              : `あと${maxConcealedTiles - tiles.length}枚入力してください`}
        </Button>
      </div>

      {/* 結果 */}
      {analyze.data && (
        <HandAnalyzeResult
          data={analyze.data}
          isOya={isOya}
          isTsumo={isTsumo}
        />
      )}
      {analyze.isError && (
        <ErrorMessage message={analyze.error?.message ?? "計算できませんでした。手牌を確認してください。"} />
      )}
    </>
  );
}

// ========== 手牌解析結果表示 ==========
function HandAnalyzeResult({
  data,
  isOya,
  isTsumo,
}: {
  data: { yakuList: Array<{ name: string; han: number; isYakuman: boolean }>; han: number; fu: number; scoreResult: { result: { ron: { dealer: number; nonDealer: number }; tsumo: { dealerPays: number; nonDealerPays: number; total: number } }; scoreType: string } };
  isOya: boolean;
  isTsumo: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">解析結果</h2>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {data.scoreResult.scoreType === "normal"
            ? `${data.han}翻 ${data.fu}符`
            : SCORE_TYPE_LABELS[data.scoreResult.scoreType] ?? data.scoreResult.scoreType}
        </span>
      </div>

      {/* 役一覧 */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">成立した役</p>
        <div className="space-y-1">
          {data.yakuList.map((y, i) => (
            <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
              <span className="text-sm text-foreground">{y.name}</span>
              <span className="text-sm font-medium text-primary">
                {y.isYakuman ? "役満" : `${y.han}翻`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 点数 */}
      <ScoreResultDisplay
        result={data.scoreResult.result}
        scoreType={data.scoreResult.scoreType}
        han={data.han}
        fu={data.fu}
        isOya={isOya}
        isTsumo={isTsumo}
      />
    </div>
  );
}

// ========== 点数表示 (共通) ==========
function ScoreResultDisplay({
  result,
  scoreType,
  han,
  fu,
  isOya,
  isTsumo,
}: {
  result: { ron: { dealer: number; nonDealer: number }; tsumo: { dealerPays: number; nonDealerPays: number; total: number } };
  scoreType: string;
  han: number;
  fu: number;
  isOya: boolean;
  isTsumo: boolean;
}) {
  return (
    <div className={scoreType !== "normal" ? "" : "pt-3 border-t border-border"}>
      {!isTsumo ? (
        <div>
          <p className="text-sm text-muted-foreground mb-1">ロン</p>
          <p className="text-4xl font-bold text-foreground">
            {isOya ? result.ron.dealer.toLocaleString() : result.ron.nonDealer.toLocaleString()}
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
                {result.tsumo.nonDealerPays.toLocaleString()}
                <span className="text-base font-normal ml-1">点 × 3</span>
              </p>
            </div>
          ) : (
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-muted-foreground">親</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.tsumo.dealerPays.toLocaleString()}<span className="text-sm ml-1">点</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">子</p>
                <p className="text-2xl font-bold text-foreground">
                  {result.tsumo.nonDealerPays.toLocaleString()}<span className="text-sm ml-1">点 × 2</span>
                </p>
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">合計</p>
            <p className="text-3xl font-bold text-primary">
              {result.tsumo.total.toLocaleString()}<span className="text-base font-normal ml-1">点</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}

// ========== メインページ ==========
function ScoreCalculatorPage() {
  const [mode, setMode] = useState<"manual" | "hand">("hand");
  const [isOya, setIsOya] = useState(false);
  const [isTsumo, setIsTsumo] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">点数計算</h1>
      <p className="text-muted-foreground mb-6">手牌を入力して点数を自動計算します</p>

      {/* モード切替 */}
      <div className="flex rounded-lg border border-border bg-muted/30 p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode("hand")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            mode === "hand" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          手牌入力
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          翻数・符数入力
        </button>
      </div>

      {mode === "hand" ? (
        <HandInputModePanel isOya={isOya} isTsumo={isTsumo} setIsOya={setIsOya} setIsTsumo={setIsTsumo} />
      ) : (
        <ManualModePanel isOya={isOya} isTsumo={isTsumo} setIsOya={setIsOya} setIsTsumo={setIsTsumo} />
      )}
    </div>
  );
}
