import { calculateScore } from "../lib/score/calculator";
import { z } from "zod";

import { publicProcedure } from "../index";

const FU_VALUES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;

export const scoreRouter = {
  calculate: publicProcedure
    .input(
      z.object({
        han: z.number().int().min(1).max(13),
        fu: z.number().int().refine((v) => (FU_VALUES as readonly number[]).includes(v), {
          message: "Invalid fu value",
        }),
        isOya: z.boolean(),
        isTsumo: z.boolean(),
        yakuIds: z.array(z.string()).optional(),
      }),
    )
    .handler(({ input }) => {
      const result = calculateScore({
        han: input.han,
        fu: input.fu,
        isOya: input.isOya,
        isTsumo: input.isTsumo,
      });

      return result;
    }),
};
