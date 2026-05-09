/** 点数種別 */
export type ScoreType =
  | "normal"
  | "mangan"
  | "haneman"
  | "baiman"
  | "sanbaiman"
  | "yakuman"
  | "double_yakuman";

/** 点数計算の入力 */
export interface ScoreInput {
  han: number;
  fu: number;
  isOya: boolean;
  isTsumo: boolean;
}

/** ツモ時の支払い内訳 */
export interface TsumoPayment {
  /** 親が支払う点数 */
  dealerPays: number;
  /** 子が支払う点数 */
  nonDealerPays: number;
  /** 合計点数 */
  total: number;
}

/** ロン時の支払い */
export interface RonPayment {
  /** 子がロンされた時の支払い */
  dealer: number;
  /** 親がロンされた時の支払い */
  nonDealer: number;
}

/** 点数計算結果 */
export interface ScoreResult {
  han: number;
  fu: number;
  scoreType: ScoreType;
  basicScore: number;
  result: {
    ron: RonPayment;
    tsumo: TsumoPayment;
  };
}

// 100点単位で切り上げ
function ceil100(n: number): number {
  return Math.ceil(n / 100) * 100;
}

// 満貫以上の固定点数テーブル
const FIXED_SCORES: Record<
  string,
  { dealer: number; nonDealer: number; dealerPays: number; nonDealerPays: number }
> = {
  mangan: {
    dealer: 12000,
    nonDealer: 8000,
    dealerPays: 4000,
    nonDealerPays: 2000,
  },
  haneman: {
    dealer: 18000,
    nonDealer: 12000,
    dealerPays: 6000,
    nonDealerPays: 3000,
  },
  baiman: {
    dealer: 24000,
    nonDealer: 16000,
    dealerPays: 8000,
    nonDealerPays: 4000,
  },
  sanbaiman: {
    dealer: 36000,
    nonDealer: 24000,
    dealerPays: 12000,
    nonDealerPays: 6000,
  },
  yakuman: {
    dealer: 48000,
    nonDealer: 32000,
    dealerPays: 16000,
    nonDealerPays: 8000,
  },
  double_yakuman: {
    dealer: 96000,
    nonDealer: 64000,
    dealerPays: 32000,
    nonDealerPays: 16000,
  },
};

/** 翻数から点数種別を判定 */
export function getScoreType(han: number, basicScore: number): ScoreType {
  if (han >= 26) return "double_yakuman";
  if (han >= 13) return "yakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8) return "baiman";
  if (han >= 6) return "haneman";
  if (han >= 5) return "mangan";
  // 4翻・3翻の満貫条件
  if (han === 4 && basicScore >= 2000) return "mangan";
  if (han === 3 && basicScore >= 2000) return "mangan";
  return "normal";
}

/**
 * 麻雀の点数を計算する
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const { han, fu, isOya } = input;

  // 基本点 = 符 × 2^(翻数+2)
  const basicScore = fu * Math.pow(2, han + 2);
  const scoreType = getScoreType(han, basicScore);

  let ron: RonPayment;
  let tsumo: TsumoPayment;

  if (scoreType !== "normal") {
    // 満貫以上の固定点数
    const fixed = FIXED_SCORES[scoreType];
    if (!fixed) {
      throw new Error(`Unknown scoreType: ${scoreType}`);
    }
    ron = {
      dealer: fixed.dealer,
      nonDealer: fixed.nonDealer,
    };
    tsumo = {
      dealerPays: fixed.dealerPays,
      nonDealerPays: fixed.nonDealerPays,
      total: isOya
        ? fixed.nonDealerPays * 3
        : fixed.dealerPays + fixed.nonDealerPays * 2,
    };
  } else {
    // 通常計算
    if (isOya) {
      // 親の場合
      const ronScore = ceil100(basicScore * 6);
      const tsumoPayEach = ceil100(basicScore * 2);
      ron = {
        dealer: ronScore,
        nonDealer: ronScore,
      };
      tsumo = {
        dealerPays: tsumoPayEach,
        nonDealerPays: tsumoPayEach,
        total: tsumoPayEach * 3,
      };
    } else {
      // 子の場合
      const ronNonDealer = ceil100(basicScore * 4);
      const ronDealer = ceil100(basicScore * 6);
      const tsumoFromDealer = ceil100(basicScore * 2);
      const tsumoFromNonDealer = ceil100(basicScore * 1);
      ron = {
        dealer: ronDealer,
        nonDealer: ronNonDealer,
      };
      tsumo = {
        dealerPays: tsumoFromDealer,
        nonDealerPays: tsumoFromNonDealer,
        total: tsumoFromDealer + tsumoFromNonDealer * 2,
      };
    }
  }

  return {
    han,
    fu,
    scoreType,
    basicScore,
    result: { ron, tsumo },
  };
}

/**
 * ロン/ツモを考慮して実際の受け取り点数を返す
 */
export function getActualScore(result: ScoreResult, isOya: boolean, isTsumo: boolean): number {
  if (isTsumo) {
    return result.result.tsumo.total;
  }
  return isOya ? result.result.ron.dealer : result.result.ron.nonDealer;
}
