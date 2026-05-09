import type { Tile } from "@better-t-app/api/lib/score/tiles";
import { tileDisplayName } from "@better-t-app/api/lib/score/tiles";

// 牌のSVG的な表示用の絵文字マッピング (Unicode麻雀牌)
const MAHJONG_UNICODE: Record<string, Record<number, string>> = {
  man: { 1: "🀇", 2: "🀈", 3: "🀉", 4: "🀊", 5: "🀋", 6: "🀌", 7: "🀍", 8: "🀎", 9: "🀏" },
  pin: { 1: "🀙", 2: "🀚", 3: "🀛", 4: "🀜", 5: "🀝", 6: "🀞", 7: "🀟", 8: "🀠", 9: "🀡" },
  sou: { 1: "🀀", 2: "🀁", 3: "🀂", 4: "🀃", 5: "🀄", 6: "🀅", 7: "🀆", 8: "🀇", 9: "🀈" },
};

interface TileButtonProps {
  tile: Tile;
  onClick: (tile: Tile) => void;
  disabled?: boolean;
  className?: string;
}

export function TileButton({ tile, onClick, disabled, className = "" }: TileButtonProps) {
  const label = tileDisplayName(tile);

  const colorClass =
    tile.suit === "man"
      ? "text-red-600 dark:text-red-400"
      : tile.suit === "dragon" && tile.value === 3
        ? "text-red-600 dark:text-red-400"
        : tile.suit === "dragon" && tile.value === 2
          ? "text-green-600 dark:text-green-400"
          : "text-foreground";

  return (
    <button
      type="button"
      onClick={() => onClick(tile)}
      disabled={disabled}
      className={`
        w-10 h-12 rounded border border-border bg-background text-xs font-bold
        hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${colorClass} ${className}
      `}
    >
      {label}
    </button>
  );
}

interface TileSelectorProps {
  onSelect: (tile: Tile) => void;
  disabled?: boolean;
}

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

export function TileSelector({ onSelect, disabled }: TileSelectorProps) {
  return (
    <div className="space-y-3">
      {NUMBER_SUITS.map(({ suit, label }) => (
        <div key={suit}>
          <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
              <TileButton
                key={`${suit}-${v}`}
                tile={{ suit, value: v }}
                onClick={onSelect}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">字牌</p>
        <div className="flex gap-1.5 flex-wrap">
          {WIND_TILES.map((t) => (
            <TileButton key={`wind-${t.value}`} tile={t} onClick={onSelect} disabled={disabled} />
          ))}
          {DRAGON_TILES.map((t) => (
            <TileButton key={`dragon-${t.value}`} tile={t} onClick={onSelect} disabled={disabled} />
          ))}
        </div>
      </div>
    </div>
  );
}
