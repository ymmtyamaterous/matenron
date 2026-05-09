import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { quizRouter } from "./quiz";
import { rankingRouter } from "./ranking";
import { scoreRouter } from "./score";
import { userRouter } from "./user";
import { yakuRouter } from "./yaku";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  user: userRouter,
  score: scoreRouter,
  quiz: quizRouter,
  yaku: yakuRouter,
  ranking: rankingRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
