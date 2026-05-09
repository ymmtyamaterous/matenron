import { useState } from "react";
import type { FuroType, Mentsu, Tile } from "@better-t-app/api/lib/score/tiles";
import { tileDisplayName } from "@better-t-app/api/lib/score/tiles";
import { TileButton } from "./tile-selector";

// ---- 定数 ----

const FURO_TYPE_LABELS: Record<FuroType, string> = {
  chi: "チー",
  pon: "ポン",
  minkan: "明槓",
  ankan: "暗槓",
};

const NUMBER_SUITS: Array<{ suit: "man" | "pin" | "sou"; label: string }> = [
  { suit: "man", label: "萬子" },
  { suit: "pin", label: "筒子" },
  { suit: "sou", label: "索子" },
];

const WIND_TILES: Tile[] = [
  { suit: "wind", value: 1 },
  { suit: "wind", value: 2 },
  { suit: "wind", value: 3 },
  { suit: "wind", value: 4 },
];

const DRAGON_TILES: Tile[] = [
  { suit: "dragon", value: 1 },
  { suit: "dragon", value: 2 },
  { suit: "dragon", value: 3 },
];

// ---- ユーティリティ ----

function countTile(tiles: Tile[], tile: Tile): number {
  return tiles.filter((t) => t.suit === tile.suit && t.value === tile.value).length;
}

function canAddTiles(allUsedTiles: Tile[], tilesToAdd: Tile[]): boolean {
  // タイル種別ごとに現在の枚数 + 追加枚数 <= 4 をチェック
  const countMap = new Map<string, number>();
  for (const t of tilesToAdd) {
    const key = `${t.suit}-${t.value}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }
  for (const [key, addCount] of countMap) {
    const [suit, value] = key.split("-");
    const current = countTile(allUsedTiles, { suit: suit as Tile["suit"], value: Number(value) });
    if (current + addCount > 4) return false;
  }
  return true;
}

// ---- 副露表示コンポーネント ----

function MentsuChip({
  mentsu,
  onRemove,
}: {
  mentsu: Mentsu;
  onRemove: () => void;
}) {
  const label = mentsu.furoType ? FURO_TYPE_LABELS[mentsu.furoType] : "副露";
  const tileStr = mentsu.tiles.map((t) => tileDisplayName(t)).join("");

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-sm">
      <span className="text-xs text-muted-foreground font-medium mr-0.5">{label}</span>
      <span className="font-bold text-foreground">{tileStr}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer leading-none"
        aria-label="削除"
      >
        ×
      </button>
    </div>
  );
}

// ---- チー選択パネル ----

function ChiPicker({
  allUsedTiles,
  onSelect,
}: {
  allUsedTiles: Tile[];
  onSelect: (tiles: Tile[]) => void;
}) {
  return (
    <div className="space-y-2">
      {NUMBER_SUITS.map(({ suit, label }) => (
        <div key={suit}>
          <p className="text-xs text-muted-foreground mb-1">{label} (順子の先頭を選択)</p>
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7].map((v) => {
              const seq: Tile[] = [
                { suit, value: v },
                { suit, value: v + 1 },
                { suit, value: v + 2 },
              ];
              const canAdd = canAddTiles(allUsedTiles, seq);
              return (
                <button
                  key={v}
                  type="button"
                  disabled={!canAdd}
                  onClick={() => onSelect(seq)}
                  className="px-2 h-10 rounded border border-border bg-background text-xs font-bold hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
                >
                  {v}-{v + 1}-{v + 2}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- ポン/槓選択パネル ----

function KoutsuKantsuPicker({
  furoType,
  allUsedTiles,
  onSelect,
}: {
  furoType: "pon" | "minkan" | "ankan";
  allUsedTiles: Tile[];
  onSelect: (tiles: Tile[]) => void;
}) {
  const needed = furoType === "pon" ? 3 : 4;

  function handleSelect(tile: Tile) {
    const tiles = Array.from({ length: needed }, () => ({ ...tile }));
    onSelect(tiles);
  }

  function isDisabled(tile: Tile): boolean {
    return !canAddTiles(allUsedTiles, Array.from({ length: needed }, () => tile));
  }

  return (
    <div className="space-y-2">
      {NUMBER_SUITS.map(({ suit, label }) => (
        <div key={suit}>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => {
              const tile: Tile = { suit, value: v };
              return (
                <TileButton
                  key={v}
                  tile={tile}
                  onClick={handleSelect}
                  disabled={isDisabled(tile)}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="text-xs text-muted-foreground mb-1">字牌</p>
        <div className="flex gap-1 flex-wrap">
          {WIND_TILES.map((t) => (
            <TileButton
              key={`wind-${t.value}`}
              tile={t}
              onClick={handleSelect}
              disabled={isDisabled(t)}
            />
          ))}
          {DRAGON_TILES.map((t) => (
            <TileButton
              key={`dragon-${t.value}`}
              tile={t}
              onClick={handleSelect}
              disabled={isDisabled(t)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- メインコンポーネント ----

interface FuroInputProps {
  furoMentsuList: Mentsu[];
  /** 暗牌 + 既存副露牌をすべて含む配列（4枚制限チェック用） */
  allUsedTiles: Tile[];
  onAdd: (mentsu: Mentsu) => void;
  onRemove: (index: number) => void;
  /** 副露が4つ達していれば追加不可にする */
  disabled?: boolean;
}

export function FuroInput({ furoMentsuList, allUsedTiles, onAdd, onRemove, disabled }: FuroInputProps) {
  const [selectedType, setSelectedType] = useState<FuroType>("pon");

  function handleChiSelect(tiles: Tile[]) {
    onAdd({
      type: "shuntsu",
      tiles,
      isFuro: true,
      furoType: "chi",
    });
  }

  function handlePonSelect(tiles: Tile[]) {
    onAdd({
      type: "koutsu",
      tiles,
      isFuro: true,
      furoType: "pon",
    });
  }

  function handleMinkanSelect(tiles: Tile[]) {
    onAdd({
      type: "kantsu",
      tiles,
      isFuro: true,
      furoType: "minkan",
    });
  }

  function handleAnkanSelect(tiles: Tile[]) {
    onAdd({
      type: "kantsu",
      tiles,
      isFuro: false, // 暗槓は門前扱い
      furoType: "ankan",
    });
  }

  const canAdd = !disabled && furoMentsuList.length < 4;

  return (
    <div className="space-y-3">
      {/* 追加済み副露 */}
      {furoMentsuList.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            副露済み ({furoMentsuList.length}/4)
          </p>
          <div className="flex flex-wrap gap-2">
            {furoMentsuList.map((m, i) => (
              <MentsuChip
                key={`${m.furoType}-${i}`}
                mentsu={m}
                onRemove={() => onRemove(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 副露追加パネル */}
      {canAdd && (
        <div className="rounded-lg border border-border bg-background p-3 space-y-3">
          {/* 種別タブ */}
          <div className="flex gap-1">
            {(["pon", "chi", "minkan", "ankan"] as FuroType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                  selectedType === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background text-foreground hover:border-primary"
                }`}
              >
                {FURO_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* 牌選択 */}
          {selectedType === "chi" && (
            <ChiPicker allUsedTiles={allUsedTiles} onSelect={handleChiSelect} />
          )}
          {selectedType === "pon" && (
            <KoutsuKantsuPicker
              furoType="pon"
              allUsedTiles={allUsedTiles}
              onSelect={handlePonSelect}
            />
          )}
          {selectedType === "minkan" && (
            <KoutsuKantsuPicker
              furoType="minkan"
              allUsedTiles={allUsedTiles}
              onSelect={handleMinkanSelect}
            />
          )}
          {selectedType === "ankan" && (
            <KoutsuKantsuPicker
              furoType="ankan"
              allUsedTiles={allUsedTiles}
              onSelect={handleAnkanSelect}
            />
          )}
        </div>
      )}

      {furoMentsuList.length === 0 && !canAdd && (
        <p className="text-xs text-muted-foreground">副露なし</p>
      )}
    </div>
  );
}
