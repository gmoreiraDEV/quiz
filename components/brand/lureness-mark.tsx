import Image from "next/image";

import { cn } from "@/lib/utils";

type LurenessMarkProps = {
  className?: string;
  compact?: boolean;
  subtitle?: string;
};

export function LurenessMark({
  className,
  compact = false,
  subtitle = "Revenue Intelligence",
}: LurenessMarkProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex h-11 w-11 items-center justify-start overflow-hidden rounded-2xl",
          className,
        )}
      >
        <Image
          src="/img/icon.png"
          alt="Lureness"
          width={368}
          height={384}
          className="pointer-events-none h-11 w-auto select-none invert dark:invert-0"
        />
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1.5", className)}>
      <Image
        src="/img/lureness.png"
        alt="Lureness"
        width={1656}
        height={384}
        className="pointer-events-none h-9 w-auto select-none invert dark:invert-0 sm:h-10"
      />
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
        {subtitle}
      </span>
    </div>
  );
}
