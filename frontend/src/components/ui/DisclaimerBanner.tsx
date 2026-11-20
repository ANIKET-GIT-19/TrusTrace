import { Info } from "@phosphor-icons/react";
import { MANDATORY_DISCLAIMER } from "../../lib/constants";

export function DisclaimerBanner() {
  return (
    <aside
      aria-label="Mandatory non-advisory disclaimer"
      className="flex items-center gap-2 rounded-xl border border-[rgba(22,26,24,0.08)] bg-[rgba(255,255,255,0.78)] px-3.5 py-2 text-[12px] leading-snug text-[#4A524D]"
    >
      <Info
        size={16}
        weight="duotone"
        className="shrink-0 text-[#4A7C64]"
        aria-hidden="true"
      />
      <p className="m-0">{MANDATORY_DISCLAIMER}</p>
    </aside>
  );
}
