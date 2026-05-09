import type { Tile } from "@better-t-app/api/lib/score/tiles";
import { tileDisplayName } from "@better-t-app/api/lib/score/tiles";

interface HandDisplayProps {
  tiles: Tile[];
  winTile: Tile | null;
  onRemoveTile: (index: number) => void;
  onSetWinTile: (tile: Tile) => void;
  maxTiles?: number;
}

function TileChip({
  tile,
  isWinTile,
  onClick,
  onRightClick,
}: {
  tile: Tile;
  isWinTile: boolean;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}) {
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
      onClick={onClick}
      onContextMenu={onRightClick}
      title={isWinTile ? "和了牌 (クリックで削除)" : "クリックで削除 / 右クリックで和了牌に設定"}
      className={`
        relative w-10 h-12 rounded border text-xs font-bold transition-colors cursor-pointer
        ${colorClass}
        ${
          isWinTile
            ? "border-primary bg-primary/15 ring-2 ring-primary ring-offset-1 ring-offset-background"
            : "border-border bg-background hover:border-destructive hover:bg-destructive/5"
        }
      `}
    >
      {label}
      {isWinTile && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] text-primary font-semibold">
          和了
        </span>
      )}
    </button>
  );
}

export function HandDisplay({ tiles, winTile, onRemoveTile, onSetWinTile, maxTiles = 14 }: HandDisplayProps) {
  const remaining = maxTiles - tiles.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">手牌</p>
        <p className="text-xs text-muted-foreground">
          {tiles.length} / {maxTiles} 枚
          {remaining > 0 && ` (あと${remaining}枚)`}
        </p>
      </div>
      <div className="min-h-14 rounded-lg border border-dashed border-border bg-muted/20 p-2 flex flex-wrap gap-1.5">
        {tiles.length === 0 && (
          <p className="text-xs text-muted-foreground self-center w-full text-center">
            下の牌を選択して手牌を入力してください
          </p>
        )}
        {tiles.map((tile, i) => (
          <TileChip
            key={`${i}-${tile.suit}-${tile.value}`}
            tile={tile}
            isWinTile={winTile !== null && winTile.suit === tile.suit && winTile.value === tile.value && i === tiles.length - 1}
            onClick={() => onRemoveTile(i)}
            onRightClick={(e) => {
              e.preventDefault();
              onSetWinTile(tile);
            }}
          />
        ))}
        {remaining > 0 &&
          Array.from({ length: remaining }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-10 h-12 rounded border border-dashed border-border/50 bg-muted/10"
            />
          ))}
      </div>
      {tiles.length > 0 && !winTile && (
        <p className="text-xs text-muted-foreground mt-1">
          💡 右クリックで和了牌を設定できます
        </p>
      )}
      {winTile && (
        <p className="text-xs text-muted-foreground mt-1">
          和了牌: <span className="font-medium text-primary">{tileDisplayName(winTile)}</span>
        </p>
      )}
    </div>
  );
}
