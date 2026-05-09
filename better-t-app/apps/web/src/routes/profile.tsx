import { useQuery, useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@better-t-app/ui/components/button";
import { Input } from "@better-t-app/ui/components/input";
import { Label } from "@better-t-app/ui/components/label";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function ProfilePage() {
  const { session } = Route.useRouteContext();
  const profile = useQuery(orpc.user.getProfile.queryOptions({ input: {} }));

  const [name, setName] = useState(session.data?.user.name ?? "");

  const updateProfile = useMutation(orpc.user.updateProfile.mutationOptions());

  const handleSave = async () => {
    await updateProfile.mutateAsync(
      { name },
      {
        onSuccess: () => toast.success("プロフィールを更新しました"),
        onError: () => toast.error("更新に失敗しました"),
      },
    );
  };

  const stats = profile.data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-2">プロフィール設定</h1>
      <p className="text-muted-foreground mb-8">{session.data?.user.email}</p>

      <div className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">名前</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
          />
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "保存中..." : "保存する"}
        </Button>
      </div>

      {stats && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-4">統計</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">総回答数</p>
              <p className="text-2xl font-bold text-foreground">{stats.stats.totalAnswers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">正解数</p>
              <p className="text-2xl font-bold text-primary">{stats.stats.correctAnswers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">正答率</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.stats.totalAnswers > 0
                  ? Math.round((stats.stats.correctAnswers / stats.stats.totalAnswers) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
