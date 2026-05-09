import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@better-t-app/ui/components/button";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/quiz/play")({
  validateSearch: z.object({
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  }),
  component: QuizPlayPage,
});

type AnswerState = { selected: number | null; submitted: boolean; isCorrect: boolean };

function QuizPlayPage() {
  const { difficulty } = Route.useSearch();
  const { data: session } = authClient.useSession();
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>({
    selected: null,
    submitted: false,
    isCorrect: false,
  });

  const question = useQuery(
    orpc.quiz.getQuestion.queryOptions({
      input: { difficulty, excludeIds: answeredIds },
    }),
  );

  const submitAnswer = useMutation(orpc.quiz.submitAnswer.mutationOptions());

  const q = question.data;

  const handleSelect = (choice: number) => {
    if (answerState.submitted) return;
    setAnswerState((s) => ({ ...s, selected: choice }));
  };

  const handleSubmit = async () => {
    if (!q || answerState.selected === null) return;
    const result = await submitAnswer.mutateAsync({ questionId: q.id, answer: answerState.selected });
    setAnswerState((s) => ({ ...s, submitted: true, isCorrect: result.isCorrect }));
  };

  const handleNext = () => {
    if (!q) return;
    setAnsweredIds((ids) => [...ids, q.id]);
    setAnswerState({ selected: null, submitted: false, isCorrect: false });
    question.refetch();
  };

  const difficultyLabel = { beginner: "初級", intermediate: "中級", advanced: "上級" }[difficulty];

  if (question.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-muted-foreground">問題を読み込み中...</p>
      </div>
    );
  }

  if (question.isError || !q) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-destructive">問題の取得に失敗しました。</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {difficultyLabel}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4">以下の手牌のロン点数はいくらですか？</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">翻数:</span> {q.hand.han}翻</p>
          <p><span className="font-medium text-foreground">符数:</span> {q.hand.fu}符</p>
          <p><span className="font-medium text-foreground">立場:</span> {q.hand.isOya ? "親" : "子"}</p>
          <p><span className="font-medium text-foreground">和了:</span> {q.hand.isTsumo ? "ツモ" : "ロン"}</p>
          {q.hand.yakuNames.length > 0 && (
            <p><span className="font-medium text-foreground">役:</span> {q.hand.yakuNames.join("・")}</p>
          )}
          {q.hand.description && (
            <p className="mt-2 text-muted-foreground">{q.hand.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {q.choices.map((choice) => {
          let className = "rounded-xl border p-4 text-center font-semibold text-lg transition-all cursor-pointer ";
          if (!answerState.submitted) {
            className += answerState.selected === choice
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:border-primary";
          } else {
            if (choice === q.choices[0]) {
              // correct answer is first choice conceptually - handled by server
            }
            className += answerState.isCorrect && choice === answerState.selected
              ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : !answerState.isCorrect && choice === answerState.selected
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-card text-muted-foreground";
          }
          return (
            <button key={choice} type="button" className={className} onClick={() => handleSelect(choice)}>
              {choice.toLocaleString()}点
            </button>
          );
        })}
      </div>

      {!answerState.submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={answerState.selected === null || submitAnswer.isPending || !session}
          className="w-full"
        >
          {!session ? "ログインして回答する" : submitAnswer.isPending ? "送信中..." : "回答する"}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 text-center font-bold text-lg ${
            answerState.isCorrect
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-500"
              : "bg-destructive/10 text-destructive border border-destructive"
          }`}>
            {answerState.isCorrect ? "🎉 正解！" : "❌ 不正解"}
          </div>
          <Button onClick={handleNext} variant="outline" className="w-full">
            次の問題へ →
          </Button>
        </div>
      )}
    </div>
  );
}
