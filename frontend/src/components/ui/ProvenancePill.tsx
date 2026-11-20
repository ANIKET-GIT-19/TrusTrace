import { CalendarBlank, Database } from "@phosphor-icons/react";

export type ProvenanceLabel = "Real" | "Synthetic / Demo" | "Mixed (Labelled)" | "Curated Demo · Mixed";

export interface ProvenancePillProps {
  label: ProvenanceLabel;
  asOfDate?: string;
}

export function ProvenancePill({ label, asOfDate }: ProvenancePillProps) {
  const isReal = label === "Real";
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#6E7771]">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
          isReal
            ? "bg-[#E6F2EC] text-[#1F4D3A] border border-[rgba(31,77,58,0.16)]"
            : "bg-[#EFECE6] text-[#4A524D] border border-[rgba(22,26,24,0.09)]"
        }`}
      >
        <Database size={12} weight="regular" aria-hidden="true" />
        {label}
      </span>
      {asOfDate && (
        <span className="tabular-nums-lining inline-flex items-center gap-1 text-[11.5px] text-[#6E7771]">
          <CalendarBlank size={12} weight="regular" aria-hidden="true" />
          As of {asOfDate}
        </span>
      )}
    </span>
  );
}
