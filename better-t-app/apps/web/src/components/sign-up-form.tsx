import { Button } from "@better-t-app/ui/components/button";
import { Input } from "@better-t-app/ui/components/input";
import { Label } from "@better-t-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate({ from: "/" });
  const { isPending } = authClient.useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        { email: value.email, password: value.password, name: value.name },
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("アカウントを作成しました");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z
        .object({
          name: z.string().min(2, "名前は2文字以上で入力してください"),
          email: z.email("有効なメールアドレスを入力してください"),
          password: z.string().min(8, "パスワードは8文字以上で入力してください"),
          confirmPassword: z.string(),
        })
        .refine((v) => v.password === v.confirmPassword, {
          message: "パスワードが一致しません",
          path: ["confirmPassword"],
        }),
    },
  });

  if (isPending) return <Loader />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">新規登録</h1>
            <p className="text-sm text-muted-foreground mt-1">麻点論でアカウントを作成</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
            className="space-y-5"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>名前</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="麻雀太郎"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>メールアドレス</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="example@email.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>パスワード</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? "text" : "password"}
                      placeholder="8文字以上"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>パスワード（確認）</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showConfirm ? "text" : "password"}
                      placeholder="もう一度入力"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "パスワードを隠す" : "パスワードを表示"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                  ))}
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "登録中..." : "アカウント作成"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            すでにアカウントをお持ちの方は{" "}
            <button type="button" onClick={onSwitchToSignIn} className="text-primary font-medium hover:underline">
              ログイン
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

