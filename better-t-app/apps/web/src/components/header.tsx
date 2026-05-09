import { Link } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const navLinks = [
    { to: "/score-calculator", label: "点数計算" },
    { to: "/quiz", label: "クイズ" },
    { to: "/yaku", label: "役一覧" },
    { to: "/ranking", label: "ランキング" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        <Link to="/" className="font-bold text-xl text-primary tracking-tight">
          麻点論
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
