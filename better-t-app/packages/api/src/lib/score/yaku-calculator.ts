import { isHonorTile, isNumberTile, isTanyao, isYaochu, tilesEqual } from "./tiles";
import type { HandInput, Jantai, Mentsu, ParsedHand, Tile, WindValue } from "./tiles";

/** 役の情報 */
export interface YakuResult {
  name: string;
  nameEn: string;
  han: number;
  /** 食い下がりの翻数 (鳴き時) */
  hanOpen?: number;
  /** 役満かどうか */
  isYakuman: boolean;
}

/** 役判定の文脈 */
interface YakuContext {
  hand: HandInput;
  parsed: ParsedHand;
  /** 門前かどうか */
  isMenzen: boolean;
  /** 和了牌が雀頭の牌かどうか */
  winTileIsJantai: boolean;
  /** 和了牌が含まれる面子 */
  winMentsu: Mentsu | null;
}

function buildContext(hand: HandInput, parsed: ParsedHand): YakuContext {
  const isMenzen = !parsed.mentsuList.some((m) => m.isFuro);
  const winTileIsJantai = tilesEqual(hand.winTile, parsed.jantai.tiles[0]);
  const winMentsu = parsed.mentsuList.find((m) => m.tiles.some((t) => tilesEqual(t, hand.winTile))) ?? null;
  return { hand, parsed, isMenzen, winTileIsJantai, winMentsu };
}

// ========== 役判定関数群 ==========

/** 立直 */
function checkRiichi(ctx: YakuContext): YakuResult | null {
  if (!ctx.isMenzen || !ctx.hand.isRiichi) return null;
  // ダブルリーチが成立している場合は通常リーチは成立しない
  if (ctx.hand.isDoubleRiichi) return null;
  return { name: "立直", nameEn: "Riichi", han: 1, isYakuman: false };
}

/** ダブル立直 */
function checkDoubleRiichi(ctx: YakuContext): YakuResult | null {
  if (!ctx.isMenzen || !ctx.hand.isDoubleRiichi) return null;
  return { name: "ダブル立直", nameEn: "Double Riichi", han: 2, isYakuman: false };
}

/** 一発 */
function checkIppatsu(ctx: YakuContext): YakuResult | null {
  if (!ctx.hand.isIppatsu || !ctx.hand.isRiichi) return null;
  return { name: "一発", nameEn: "Ippatsu", han: 1, isYakuman: false };
}

/** 門前清自摸和 */
function checkMenzenTsumo(ctx: YakuContext): YakuResult | null {
  if (!ctx.isMenzen || !ctx.hand.isTsumo) return null;
  return { name: "門前清自摸和", nameEn: "Menzen Tsumo", han: 1, isYakuman: false };
}

/** 断么九 */
function checkTanyao(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isKokushi) return null;
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  if (allTiles.every(isTanyao)) {
    return { name: "断么九", nameEn: "Tanyao", han: 1, hanOpen: 1, isYakuman: false };
  }
  return null;
}

/** 平和 */
function checkPinfu(ctx: YakuContext): YakuResult | null {
  const { parsed, hand, isMenzen } = ctx;
  if (!isMenzen || parsed.isChitoitsu || parsed.isKokushi) return null;

  // 全面子が順子
  if (parsed.mentsuList.some((m) => m.type !== "shuntsu")) return null;

  // 雀頭が役牌でない
  const jantaiTile = parsed.jantai.tiles[0];
  if (jantaiTile.suit === "dragon") return null;
  if (jantaiTile.suit === "wind") {
    if (jantaiTile.value === hand.bakaze || jantaiTile.value === hand.jikaze) return null;
  }

  // 両面待ち (和了牌が順子の端でない)
  // 和了牌を含む順子を探す
  const winMentsu = parsed.mentsuList.find((m) => m.tiles.some((t) => tilesEqual(t, hand.winTile)));
  if (!winMentsu || winMentsu.type !== "shuntsu") return null;
  const shuntsuTiles = winMentsu.tiles;
  const min = shuntsuTiles[0];
  const max = shuntsuTiles[2];
  // カンチャン・ペンチャン・単騎は平和なし
  if (tilesEqual(hand.winTile, shuntsuTiles[1])) return null; // カンチャン
  if (tilesEqual(hand.winTile, min) && min.value === 7) return null; // ペンチャン上
  if (tilesEqual(hand.winTile, max) && max.value === 3) return null; // ペンチャン下
  // 両面
  return { name: "平和", nameEn: "Pinfu", han: 1, isYakuman: false };
}

/** 一盃口 */
function checkIipeiko(ctx: YakuContext): YakuResult | null {
  if (!ctx.isMenzen || ctx.parsed.isChitoitsu || ctx.parsed.isKokushi) return null;
  const shuntsus = ctx.parsed.mentsuList.filter((m) => m.type === "shuntsu");
  for (let i = 0; i < shuntsus.length; i++) {
    for (let j = i + 1; j < shuntsus.length; j++) {
      const a = shuntsus[i].tiles;
      const b = shuntsus[j].tiles;
      if (a.every((t, idx) => tilesEqual(t, b[idx]))) {
        return { name: "一盃口", nameEn: "Iipeiko", han: 1, isYakuman: false };
      }
    }
  }
  return null;
}

/** 二盃口 */
function checkRyanpeiko(ctx: YakuContext): YakuResult | null {
  if (!ctx.isMenzen || ctx.parsed.isChitoitsu || ctx.parsed.isKokushi) return null;
  const shuntsus = ctx.parsed.mentsuList.filter((m) => m.type === "shuntsu");
  if (shuntsus.length < 4) return null;
  // 4つの順子から2組のペアを見つける
  for (let a = 0; a < shuntsus.length; a++) {
    for (let b = a + 1; b < shuntsus.length; b++) {
      const pair1 = shuntsus[a].tiles.every((t, idx) => tilesEqual(t, shuntsus[b].tiles[idx]));
      if (!pair1) continue;
      const remaining = shuntsus.filter((_, idx) => idx !== a && idx !== b);
      if (remaining.length >= 2) {
        const pair2 = remaining[0].tiles.every((t, idx) => tilesEqual(t, remaining[1].tiles[idx]));
        if (pair2) return { name: "二盃口", nameEn: "Ryanpeiko", han: 3, isYakuman: false };
      }
    }
  }
  return null;
}

/** 役牌 */
function checkYakuhai(ctx: YakuContext): YakuResult[] {
  const { parsed, hand } = ctx;
  const results: YakuResult[] = [];
  for (const m of parsed.mentsuList) {
    if (m.type !== "koutsu" && m.type !== "kantsu") continue;
    const t = m.tiles[0];
    if (t.suit === "dragon") {
      const names = ["白", "発", "中"];
      results.push({ name: `役牌 ${names[t.value - 1]}`, nameEn: `Yakuhai ${names[t.value - 1]}`, han: 1, hanOpen: 1, isYakuman: false });
    } else if (t.suit === "wind") {
      if (t.value === hand.bakaze) {
        const windNames = ["東", "南", "西", "北"];
        results.push({ name: `場風牌 ${windNames[t.value - 1]}`, nameEn: `Bakaze ${windNames[t.value - 1]}`, han: 1, hanOpen: 1, isYakuman: false });
      }
      if (t.value === hand.jikaze) {
        const windNames = ["東", "南", "西", "北"];
        results.push({ name: `自風牌 ${windNames[t.value - 1]}`, nameEn: `Jikaze ${windNames[t.value - 1]}`, han: 1, hanOpen: 1, isYakuman: false });
      }
    }
  }
  return results;
}

/** 混全帯么九 */
function checkChanta(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const allGroups: Tile[][] = [
    ...parsed.mentsuList.map((m) => m.tiles),
    parsed.jantai.tiles as Tile[],
  ];
  if (!allGroups.every((g) => g.some(isYaochu))) return null;
  if (allGroups.every((g) => g.every((t) => isHonorTile(t)))) return null; // 混老頭
  // 少なくとも1つの順子が必要
  if (!parsed.mentsuList.some((m) => m.type === "shuntsu")) return null;
  return { name: "混全帯么九", nameEn: "Chanta", han: 2, hanOpen: 1, isYakuman: false };
}

/** 純全帯么九 */
function checkJunchan(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const allGroups: Tile[][] = [
    ...parsed.mentsuList.map((m) => m.tiles),
    parsed.jantai.tiles as Tile[],
  ];
  if (!allGroups.every((g) => g.some((t) => isYaochu(t) && !isHonorTile(t)))) return null;
  if (!parsed.mentsuList.some((m) => m.type === "shuntsu")) return null;
  return { name: "純全帯么九", nameEn: "Junchan", han: 3, hanOpen: 2, isYakuman: false };
}

/** 一気通貫 */
function checkIttsu(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const suits = ["man", "pin", "sou"] as const;
  for (const suit of suits) {
    const shuntsus = parsed.mentsuList.filter((m) => m.type === "shuntsu" && m.tiles[0].suit === suit);
    const has123 = shuntsus.some((m) => m.tiles[0].value === 1);
    const has456 = shuntsus.some((m) => m.tiles[0].value === 4);
    const has789 = shuntsus.some((m) => m.tiles[0].value === 7);
    if (has123 && has456 && has789) {
      return { name: "一気通貫", nameEn: "Ittsu", han: 2, hanOpen: 1, isYakuman: false };
    }
  }
  return null;
}

/** 三色同順 */
function checkSanshoku(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const shuntsus = parsed.mentsuList.filter((m) => m.type === "shuntsu");
  for (const s of shuntsus) {
    const startVal = s.tiles[0].value;
    const hasSameMen = ["man", "pin", "sou"].every((suit) =>
      shuntsus.some((m) => m.tiles[0].suit === suit && m.tiles[0].value === startVal),
    );
    if (hasSameMen) return { name: "三色同順", nameEn: "Sanshoku", han: 2, hanOpen: 1, isYakuman: false };
  }
  return null;
}

/** 三色同刻 */
function checkSanshokuDoukou(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const koutsuList = parsed.mentsuList.filter((m) => m.type === "koutsu" || m.type === "kantsu");
  for (const k of koutsuList) {
    const val = k.tiles[0].value;
    const hasMen = koutsuList.some((m) => m.tiles[0].suit === "man" && m.tiles[0].value === val);
    const hasPin = koutsuList.some((m) => m.tiles[0].suit === "pin" && m.tiles[0].value === val);
    const hasSou = koutsuList.some((m) => m.tiles[0].suit === "sou" && m.tiles[0].value === val);
    if (hasMen && hasPin && hasSou) {
      return { name: "三色同刻", nameEn: "Sanshoku Doukou", han: 2, hanOpen: 2, isYakuman: false };
    }
  }
  return null;
}

/** 対々和 */
function checkToitoi(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  if (parsed.mentsuList.every((m) => m.type === "koutsu" || m.type === "kantsu")) {
    return { name: "対々和", nameEn: "Toitoi", han: 2, hanOpen: 2, isYakuman: false };
  }
  return null;
}

/** 三暗刻 */
function checkSanankou(ctx: YakuContext): YakuResult | null {
  const { parsed, hand } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const anKoutsu = parsed.mentsuList.filter((m) => !m.isFuro && (m.type === "koutsu" || m.type === "kantsu"));
  // ロンの場合、和了牌を含む刻子は明刻扱い
  let count = anKoutsu.length;
  if (!hand.isTsumo) {
    const winInKoutsu = anKoutsu.find((m) => m.tiles.some((t) => tilesEqual(t, hand.winTile)));
    if (winInKoutsu) count--;
  }
  if (count >= 3) return { name: "三暗刻", nameEn: "Sanankou", han: 2, isYakuman: false };
  return null;
}

/** 混老頭 */
function checkHonroutou(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  if (allTiles.every(isYaochu)) {
    return { name: "混老頭", nameEn: "Honroutou", han: 2, hanOpen: 2, isYakuman: false };
  }
  return null;
}

/** 小三元 */
function checkShousangen(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const dragonKoutsu = parsed.mentsuList.filter(
    (m) => (m.type === "koutsu" || m.type === "kantsu") && m.tiles[0].suit === "dragon",
  );
  const dragonJantai = parsed.jantai.tiles[0].suit === "dragon";
  if (dragonKoutsu.length === 2 && dragonJantai) {
    return { name: "小三元", nameEn: "Shousangen", han: 2, hanOpen: 2, isYakuman: false };
  }
  return null;
}

/** 混一色 */
function checkHonitsu(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  const numberSuits = new Set(allTiles.filter(isNumberTile).map((t) => t.suit));
  const hasHonor = allTiles.some(isHonorTile);
  if (numberSuits.size === 1 && hasHonor) {
    return { name: "混一色", nameEn: "Honitsu", han: 3, hanOpen: 2, isYakuman: false };
  }
  return null;
}

/** 清一色 */
function checkChinitsu(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  const suits = new Set(allTiles.map((t) => t.suit));
  if (suits.size === 1 && !isHonorTile(allTiles[0])) {
    return { name: "清一色", nameEn: "Chinitsu", han: 6, hanOpen: 5, isYakuman: false };
  }
  return null;
}

/** 七対子 */
function checkChitoitsu(ctx: YakuContext): YakuResult | null {
  if (!ctx.parsed.isChitoitsu) return null;
  return { name: "七対子", nameEn: "Chitoitsu", han: 2, isYakuman: false };
}

/** 国士無双 */
function checkKokushi(ctx: YakuContext): YakuResult | null {
  if (!ctx.parsed.isKokushi) return null;
  return { name: "国士無双", nameEn: "Kokushi", han: 13, isYakuman: true };
}

/** 四暗刻 */
function checkSuuankou(ctx: YakuContext): YakuResult | null {
  const { parsed, hand } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const anKoutsu = parsed.mentsuList.filter((m) => !m.isFuro && (m.type === "koutsu" || m.type === "kantsu"));
  if (anKoutsu.length !== 4) return null;
  // 単騎待ち = 四暗刻単騎 (ダブル役満) はここでは通常役満として扱う
  if (!hand.isTsumo) {
    const winInKoutsu = anKoutsu.find((m) => m.tiles.some((t) => tilesEqual(t, hand.winTile)));
    if (winInKoutsu) return null; // ロンで刻子を完成させた場合は四暗刻でない
  }
  return { name: "四暗刻", nameEn: "Suuankou", han: 13, isYakuman: true };
}

/** 大三元 */
function checkDaisangen(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const dragonKoutsu = parsed.mentsuList.filter(
    (m) => (m.type === "koutsu" || m.type === "kantsu") && m.tiles[0].suit === "dragon",
  );
  if (dragonKoutsu.length === 3) {
    return { name: "大三元", nameEn: "Daisangen", han: 13, isYakuman: true };
  }
  return null;
}

/** 小四喜 */
function checkShousuushi(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const windKoutsu = parsed.mentsuList.filter(
    (m) => (m.type === "koutsu" || m.type === "kantsu") && m.tiles[0].suit === "wind",
  );
  const windJantai = parsed.jantai.tiles[0].suit === "wind";
  if (windKoutsu.length === 3 && windJantai) {
    return { name: "小四喜", nameEn: "Shousuushi", han: 13, isYakuman: true };
  }
  return null;
}

/** 大四喜 */
function checkDaisuushi(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const windKoutsu = parsed.mentsuList.filter(
    (m) => (m.type === "koutsu" || m.type === "kantsu") && m.tiles[0].suit === "wind",
  );
  if (windKoutsu.length === 4) {
    return { name: "大四喜", nameEn: "Daisuushi", han: 26, isYakuman: true };
  }
  return null;
}

/** 清老頭 */
function checkChinroutou(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  if (allTiles.every((t) => isYaochu(t) && !isHonorTile(t))) {
    return { name: "清老頭", nameEn: "Chinroutou", han: 13, isYakuman: true };
  }
  return null;
}

/** 緑一色 */
function checkRyuuiisou(ctx: YakuContext): YakuResult | null {
  const { parsed } = ctx;
  const greenTiles: Array<[string, number]> = [
    ["sou", 2], ["sou", 3], ["sou", 4], ["sou", 6], ["sou", 8], ["dragon", 2],
  ];
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  if (allTiles.every((t) => greenTiles.some(([s, v]) => t.suit === s && t.value === v))) {
    return { name: "緑一色", nameEn: "Ryuuiisou", han: 13, isYakuman: true };
  }
  return null;
}

/** 九蓮宝燈 */
function checkChuurenpoutou(ctx: YakuContext): YakuResult | null {
  const { parsed, hand } = ctx;
  if (parsed.isChitoitsu || parsed.isKokushi) return null;
  const allTiles = [
    ...parsed.mentsuList.flatMap((m) => m.tiles),
    ...parsed.jantai.tiles,
  ];
  if (!allTiles.every(isNumberTile)) return null;
  const suits = new Set(allTiles.map((t) => t.suit));
  if (suits.size !== 1) return null;

  const counts = new Array(10).fill(0);
  for (const t of allTiles) counts[t.value]++;
  // 1112345678999 + 任意1枚
  const base = [3, 1, 1, 1, 1, 1, 1, 1, 3];
  let extras = 0;
  for (let i = 1; i <= 9; i++) {
    if (counts[i] < base[i - 1]) return null;
    extras += counts[i] - base[i - 1];
  }
  if (extras !== 1) return null;
  return { name: "九蓮宝燈", nameEn: "Chuurenpoutou", han: 13, isYakuman: true };
}

/** 嶺上開花 */
function checkRinshan(ctx: YakuContext): YakuResult | null {
  if (!ctx.hand.isRinshan) return null;
  return { name: "嶺上開花", nameEn: "Rinshan", han: 1, hanOpen: 1, isYakuman: false };
}

/** 槍槓 */
function checkChankan(ctx: YakuContext): YakuResult | null {
  if (!ctx.hand.isChankan) return null;
  return { name: "槍槓", nameEn: "Chankan", han: 1, hanOpen: 1, isYakuman: false };
}

/** 海底撈月 */
function checkHaitei(ctx: YakuContext): YakuResult | null {
  if (!ctx.hand.isHaitei) return null;
  return { name: "海底撈月", nameEn: "Haitei", han: 1, hanOpen: 1, isYakuman: false };
}

/** 河底撈魚 */
function checkHoutei(ctx: YakuContext): YakuResult | null {
  if (!ctx.hand.isHoutei) return null;
  return { name: "河底撈魚", nameEn: "Houtei", han: 1, hanOpen: 1, isYakuman: false };
}

// ========== ドラ ==========
function addDora(hand: HandInput): YakuResult[] {
  const results: YakuResult[] = [];
  if (hand.doraCount > 0) {
    results.push({ name: `ドラ${hand.doraCount}`, nameEn: `Dora ${hand.doraCount}`, han: hand.doraCount, hanOpen: hand.doraCount, isYakuman: false });
  }
  if (hand.uraDoraCount > 0 && hand.isRiichi) {
    results.push({ name: `裏ドラ${hand.uraDoraCount}`, nameEn: `Ura Dora ${hand.uraDoraCount}`, han: hand.uraDoraCount, isYakuman: false });
  }
  if (hand.akaDoraCount > 0) {
    results.push({ name: `赤ドラ${hand.akaDoraCount}`, nameEn: `Aka Dora ${hand.akaDoraCount}`, han: hand.akaDoraCount, hanOpen: hand.akaDoraCount, isYakuman: false });
  }
  return results;
}

/** 指定の ParsedHand に対して役を計算する */
export function calculateYaku(hand: HandInput, parsed: ParsedHand): YakuResult[] {
  const ctx = buildContext(hand, parsed);
  const results: YakuResult[] = [];

  // 役満
  const yakumanChecks = [
    checkKokushi,
    checkSuuankou,
    checkDaisangen,
    checkDaisuushi,
    checkShousuushi,
    checkChinroutou,
    checkRyuuiisou,
    checkChuurenpoutou,
  ];

  for (const check of yakumanChecks) {
    const r = check(ctx);
    if (r) results.push(r);
  }

  if (results.some((r) => r.isYakuman)) {
    return results; // 役満があればドラ以外は不要
  }

  // 通常役
  const normalChecks = [
    checkDoubleRiichi,
    checkRiichi,
    checkIppatsu,
    checkMenzenTsumo,
    checkTanyao,
    checkPinfu,
    checkIipeiko,
    checkRyanpeiko,
    checkChitoitsu,
    checkChanta,
    checkJunchan,
    checkIttsu,
    checkSanshoku,
    checkSanshokuDoukou,
    checkToitoi,
    checkSanankou,
    checkHonroutou,
    checkShousangen,
    checkHonitsu,
    checkChinitsu,
    checkRinshan,
    checkChankan,
    checkHaitei,
    checkHoutei,
  ];

  for (const check of normalChecks) {
    const r = check(ctx);
    if (r) results.push(r);
  }

  // 役牌 (複数ありえる)
  results.push(...checkYakuhai(ctx));

  // ドラ
  results.push(...addDora(hand));

  return results;
}

/** 役の翻数合計を計算 (鳴きを考慮) */
export function totalHan(yakuList: YakuResult[], isMenzen: boolean): number {
  return yakuList.reduce((sum, y) => {
    if (y.isYakuman) return sum + y.han;
    const han = !isMenzen && y.hanOpen !== undefined ? y.hanOpen : y.han;
    return sum + han;
  }, 0);
}
