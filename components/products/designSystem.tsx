import type { ReactNode } from "react";
import {
  BadgeCheck,
  Camera,
  Dumbbell,
  Luggage,
  PartyPopper,
  Speaker,
  Star,
  Tent,
  Video,
  Wrench,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  camera: Camera,
  "party-popper": PartyPopper,
  speaker: Speaker,
  tent: Tent,
  wrench: Wrench,
  dumbbell: Dumbbell,
  video: Video,
  luggage: Luggage,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[name] ?? Camera;
  return <Icon className={className} />;
}

function joinClassNames(...classNames: Array<string | undefined | false>) {
  return classNames.filter(Boolean).join(" ");
}

export function PlaceholderImage({
  seed,
  className,
  rounded = "rounded-xl",
}: {
  seed: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`ภาพตัวอย่างสินค้า ${seed}`}
      className={joinClassNames(
        "flex items-center justify-center bg-gradient-to-br",
        "from-[#2980B9] to-[#6DD5FA]",
        rounded,
        className,
      )}
    >
      <ImageIcon
        aria-hidden="true"
        className="h-[28%] w-[28%] text-white/70"
        strokeWidth={1.8}
      />
    </div>
  );
}

export function Rating({ value, count }: { value: number; count: number }) {
  return (
    <span
      aria-label={`คะแนน ${value.toFixed(1)} จาก ${count} รีวิว`}
      className="inline-flex items-center gap-1 text-xs text-slate-600"
    >
      <Star
        aria-hidden="true"
        className="h-4 w-4 fill-amber-400 text-amber-400"
      />
      <span className="font-medium">{value.toFixed(1)}</span>
      <span className="text-slate-400">({count})</span>
    </span>
  );
}

const chipStyles = {
  success: {
    chip: "bg-emerald-500/15 text-emerald-700",
    dot: "bg-emerald-500",
  },
  maintenance: {
    chip: "bg-amber-500/15 text-amber-800",
    dot: "bg-amber-500",
  },
  rented: {
    chip: "bg-blue-500/15 text-slate-700",
    dot: "bg-blue-500",
  },
  inactive: {
    chip: "bg-grey-500/15 text-slate-700",
    dot: "bg-grey-500",
  },
  info: {
    chip: "border border-sky-200 bg-white/90 text-sky-600",
    dot: "bg-sky-500",
  },
};

export function StatusChip({
  children,
  tone,
  dot = true,
  className,
}: {
  children: ReactNode;
  tone: keyof typeof chipStyles;
  dot?: boolean;
  className?: string;
}) {
  const styles = chipStyles[tone];

  return (
    <span
      className={joinClassNames(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
        styles.chip,
        className,
      )}
    >
      {dot && (
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${styles.dot}`} />
      )}
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={joinClassNames(
        "mb-4 flex items-end justify-between gap-4",
        className,
      )}
    >
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {action}
    </div>
  );
}
