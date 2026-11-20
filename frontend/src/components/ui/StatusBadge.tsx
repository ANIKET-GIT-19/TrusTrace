import { CheckCircle, Question, WarningCircle } from "@phosphor-icons/react";

export type EvidenceTone = "neutral_ok" | "attention" | "unverified";

export interface StatusBadgeProps {
  tone: EvidenceTone;
  label: string;
  className?: string;
}

const toneStyles: Record<EvidenceTone, { container: string; iconColor: string }> = {
  neutral_ok: {
    container: "bg-[#E6F2EC] text-[#2A6F52] border border-[rgba(42,111,82,0.18)]",
    iconColor: "#2A6F52",
  },
  attention: {
    container: "bg-[#FDF3E4] text-[#9A5B13] border border-[rgba(154,91,19,0.20)]",
    iconColor: "#9A5B13",
  },
  unverified: {
    container: "bg-[#EEF1F4] text-[#4E5964] border border-[rgba(78,89,100,0.16)]",
    iconColor: "#4E5964",
  },
};

export function StatusBadge({ tone, label, className = "" }: StatusBadgeProps) {
  const style = toneStyles[tone];
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold tracking-[0.01em] whitespace-nowrap ${style.container} ${className}`}
    >
      {tone === "neutral_ok" && (
        <CheckCircle size={14} weight="duotone" color={style.iconColor} aria-hidden="true" />
      )}
      {tone === "attention" && (
        <WarningCircle size={14} weight="duotone" color={style.iconColor} aria-hidden="true" />
      )}
      {tone === "unverified" && (
        <Question size={14} weight="duotone" color={style.iconColor} aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}
