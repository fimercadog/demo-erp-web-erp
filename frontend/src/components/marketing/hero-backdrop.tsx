import { cn } from "@/lib/utils";

/**
 * Ambient hero background: soft aurora blobs (teal + amber) that slowly
 * breathe and drift over the warm cream ground. Pure CSS, fully token-driven
 * (`var(--primary)`, `var(--chart-3)`) so it re-skins with `.site-theme`.
 * No tech grid / conic scan — a clinic hero reads warm and organic, not
 * dashboard-SaaS. `variant="navy"` tunes it for the dark bands (login, final
 * CTA). `max-sm:` overrides keep it from washing the whole screen on phones.
 */
export function HeroBackdrop({
  variant = "light",
  className,
}: {
  variant?: "light" | "navy";
  className?: string;
}) {
  const navy = variant === "navy";

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0",
          navy
            ? "bg-[radial-gradient(90%_70%_at_50%_-15%,rgba(94,234,212,0.22),transparent_65%)]"
            : "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_10%,var(--background)),var(--background)_60%)] max-sm:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_7%,var(--background)),var(--background)_34%)]",
        )}
      />

      <div
        className={cn(
          "absolute left-[-14%] top-[-28%] size-[40rem] animate-marketing-aurora rounded-full blur-[70px] max-sm:size-[22rem] max-sm:opacity-30",
          navy ? "opacity-70" : "opacity-50",
        )}
        style={{ background: "radial-gradient(circle at 35% 35%, var(--primary), transparent 70%)" }}
      />
      <div
        className={cn(
          "absolute right-[-14%] top-[4%] size-[34rem] animate-marketing-aurora rounded-full blur-[80px] [animation-delay:-6s] max-sm:opacity-20",
          navy ? "opacity-50" : "opacity-35",
        )}
        style={{ background: navy ? "radial-gradient(circle at 60% 40%, var(--cta, var(--chart-3)), transparent 68%)" : "radial-gradient(circle at 60% 40%, var(--chart-3), transparent 68%)" }}
      />
      <div
        className={cn(
          "absolute bottom-[-30%] left-[22%] size-[30rem] animate-marketing-pulse-glow rounded-full blur-[80px] max-sm:opacity-30",
          navy ? "bg-primary/35" : "bg-primary/20",
        )}
      />
    </div>
  );
}
