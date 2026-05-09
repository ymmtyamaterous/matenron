import { compareTiles, isHonorTile, isNumberTile, isYaochu, tilesEqual } from "./tiles";
import type { Jantai, Mentsu, ParsedHand, Tile } from "./tiles";

/** 牌リストをソート (破壊的) */
function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort(compareTiles);
}

/** 特定の牌インデックスを除いた残りの牌を返す */
function removeTile(tiles: Tile[], index: number): Tile[] {
  return [...tiles.slice(0, index), ...tiles.slice(index + 1)];
}

/**
 * 手牌から面子(順子・刻子)と雀頭への全分解パターンを再帰的に探索する
 * @param tiles ソート済みの残り牌
 * @param mentsuList 積み上げ済みの面子リスト
 * @returns 分解に成功した全パターン
 */
function decompose(tiles: Tile[], mentsuList: Mentsu[]): Array<{ mentsuList: Mentsu[]; jantai: Jantai }> {
  if (tiles.length === 0) return [];

  const results: Array<{ mentsuList: Mentsu[]; jantai: Jantai }> = [];

  // 雀頭として最初の2枚を選ぶ場合（まだ雀頭未確定の場合）
  // => 再帰の簡略化のため、雀頭はトップレベルで先に抜いて渡す方式にする
  // (内部では面子のみを処理)

  if (tiles.length % 3 !== 0) return []; // 面子候補の枚数が3の倍数でないなら失敗

  if (tiles.length === 0) return [{ mentsuList, jantai: { tiles: [tiles[0], tiles[0]] } }];

  const first = tiles[0];

  // 刻子試行
  const same = tiles.filter((t) => tilesEqual(t, first));
  if (same.length >= 3) {
    const remaining = tiles.slice();
    let removed = 0;
    for (let i = 0; i < tiles.length && removed < 3; i++) {
      if (tilesEqual(tiles[i], first)) {
        remaining.splice(i - (3 - removed - 1) + (removed === 0 ? 0 : 0), 1);
        removed++;
      }
    }
    // 刻子を確実に除去
    let rest = [...tiles];
    let count = 0;
    const newRest: Tile[] = [];
    for (const t of rest) {
      if (tilesEqual(t, first) && count < 3) {
        count++;
      } else {
        newRest.push(t);
      }
    }
    const koutsu: Mentsu = { type: "koutsu", tiles: [first, first, first], isFuro: false };
    const subResults = decomposeInner(newRest, [...mentsuList, koutsu]);
    results.push(...subResults);
  }

  // 順子試行 (数牌のみ)
  if (isNumberTile(first) && first.value <= 7) {
    const second = tiles.find((t) => t.suit === first.suit && t.value === first.value + 1);
    const third = tiles.find((t) => t.suit === first.suit && t.value === first.value + 2);
    if (second && third) {
      let rest = [...tiles];
      for (const target of [first, second, third]) {
        const idx = rest.findIndex((t) => tilesEqual(t, target));
        if (idx !== -1) rest = removeTile(rest, idx);
      }
      const shuntsu: Mentsu = { type: "shuntsu", tiles: [first, second, third], isFuro: false };
      const subResults = decomposeInner(rest, [...mentsuList, shuntsu]);
      results.push(...subResults);
    }
  }

  return results;
}

/** decomposeのラッパー (終了条件付き) */
function decomposeInner(
  tiles: Tile[],
  mentsuList: Mentsu[],
): Array<{ mentsuList: Mentsu[]; jantai: Jantai }> {
  if (tiles.length === 0) {
    // 雀頭は呼び出し元で持っているのでここでは返せない
    // このパスは decomposeWithJantai 経由でのみ呼ばれる
    return [{ mentsuList, jantai: { tiles: [{ suit: "man", value: 0 }, { suit: "man", value: 0 }] } }];
  }
  return decompose(tiles, mentsuList);
}

/**
 * 雀頭を先に確定させてから面子分解を行う
 */
function decomposeWithJantai(tiles: Tile[]): ParsedHand[] {
  const results: ParsedHand[] = [];
  const sorted = sortTiles(tiles);

  // 全ての雀頭候補を試す
  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = sorted[i];
    const t2 = sorted[i + 1];
    if (!tilesEqual(t1, t2)) continue;

    // 同じ牌が連続して複数ある場合に重複しないようにスキップ
    if (i > 0 && tilesEqual(sorted[i - 1], t1)) continue;

    const rest = [...sorted];
    rest.splice(i + 1, 1);
    rest.splice(i, 1);

    const jantai: Jantai = { tiles: [t1, t2] };
    const decomposed = decomposeRecursive(rest, []);

    for (const d of decomposed) {
      results.push({
        mentsuList: d,
        jantai,
        isChitoitsu: false,
        isKokushi: false,
      });
    }
  }

  return results;
}

/** 面子のみを再帰的に分解する (成功時はMentsu[]の配列を返す) */
function decomposeRecursive(tiles: Tile[], mentsuList: Mentsu[]): Mentsu[][] {
  if (tiles.length === 0) return [mentsuList];
  if (tiles.length % 3 !== 0) return [];

  const results: Mentsu[][] = [];
  const sorted = sortTiles(tiles);
  const first = sorted[0];

  // 刻子
  let count = 0;
  for (const t of sorted) {
    if (tilesEqual(t, first)) count++;
  }
  if (count >= 3) {
    let rest = [...sorted];
    let removed = 0;
    const newRest: Tile[] = [];
    for (const t of rest) {
      if (tilesEqual(t, first) && removed < 3) {
        removed++;
      } else {
        newRest.push(t);
      }
    }
    const koutsu: Mentsu = { type: "koutsu", tiles: [first, first, first], isFuro: false };
    const sub = decomposeRecursive(newRest, [...mentsuList, koutsu]);
    results.push(...sub);
  }

  // 順子
  if (isNumberTile(first) && first.value <= 7) {
    const idx2 = sorted.findIndex((t) => t.suit === first.suit && t.value === first.value + 1);
    const idx3 = sorted.findIndex((t) => t.suit === first.suit && t.value === first.value + 2);
    if (idx2 !== -1 && idx3 !== -1) {
      const second = sorted[idx2];
      const third = sorted[idx3];
      let rest = [...sorted];
      // 後ろから順に削除してインデックスズレを防ぐ
      const removeIndices = [idx3, idx2, 0].sort((a, b) => b - a);
      const newRest: Tile[] = [];
      const skipSet = new Set(removeIndices);
      for (let i = 0; i < rest.length; i++) {
        if (skipSet.has(i)) {
          skipSet.delete(i);
        } else {
          newRest.push(rest[i]);
        }
      }
      const shuntsu: Mentsu = { type: "shuntsu", tiles: [first, second, third], isFuro: false };
      const sub = decomposeRecursive(newRest, [...mentsuList, shuntsu]);
      results.push(...sub);
    }
  }

  return results;
}

/** 七対子判定 */
function parseChitoitsu(tiles: Tile[]): ParsedHand | null {
  if (tiles.length !== 14) return null;
  const sorted = sortTiles(tiles);
  const pairs: Tile[] = [];

  for (let i = 0; i < sorted.length; i += 2) {
    if (i + 1 >= sorted.length) return null;
    if (!tilesEqual(sorted[i], sorted[i + 1])) return null;
    pairs.push(sorted[i]);
  }

  if (pairs.length !== 7) return null;

  // 七対子は7種類の対子が必要
  for (let i = 1; i < pairs.length; i++) {
    if (tilesEqual(pairs[i], pairs[i - 1])) return null;
  }

  return {
    mentsuList: [],
    jantai: { tiles: [sorted[0], sorted[1]] },
    isChitoitsu: true,
    isKokushi: false,
  };
}

/** 国士無双判定 */
function parseKokushi(tiles: Tile[]): ParsedHand | null {
  if (tiles.length !== 14) return null;
  const yaochuTypes: Tile[] = [
    { suit: "man", value: 1 },
    { suit: "man", value: 9 },
    { suit: "pin", value: 1 },
    { suit: "pin", value: 9 },
    { suit: "sou", value: 1 },
    { suit: "sou", value: 9 },
    { suit: "wind", value: 1 },
    { suit: "wind", value: 2 },
    { suit: "wind", value: 3 },
    { suit: "wind", value: 4 },
    { suit: "dragon", value: 1 },
    { suit: "dragon", value: 2 },
    { suit: "dragon", value: 3 },
  ];

  const sorted = sortTiles(tiles);
  let hasAllYaochu = true;
  let pairTile: Tile | null = null;

  for (const yaochu of yaochuTypes) {
    const found = sorted.filter((t) => tilesEqual(t, yaochu));
    if (found.length === 0) return null;
    if (found.length >= 2) pairTile = yaochu;
  }

  if (!pairTile) return null;

  return {
    mentsuList: [],
    jantai: { tiles: [pairTile, pairTile] },
    isChitoitsu: false,
    isKokushi: true,
  };
}

/**
 * 手牌を解析して有効な分解パターンを返す
 * 複数パターンが存在する場合は全て返す（役計算側で最高点を選択）
 */
export function parseHand(tiles: Tile[]): ParsedHand[] {
  const results: ParsedHand[] = [];

  // 国士無双
  const kokushi = parseKokushi(tiles);
  if (kokushi) results.push(kokushi);

  // 七対子
  const chitoitsu = parseChitoitsu(tiles);
  if (chitoitsu) results.push(chitoitsu);

  // 通常手 (4面子1雀頭)
  const normal = decomposeWithJantai(tiles);
  results.push(...normal);

  return results;
}

/** 和了可能かどうかだけを判定する */
export function isWinningHand(tiles: Tile[]): boolean {
  return parseHand(tiles).length > 0;
}
