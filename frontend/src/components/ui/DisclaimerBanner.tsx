import { Info } from "@phosphor-icons/react";
import { MANDATORY_DISCLAIMER } from "../../lib/constants";

export function DisclaimerBanner() {
  return (
    <aside
      aria-label="Mandatory non-advisory disclaimer"
      className="flex items-start gap-2.5 rounded-2xl border border-[rgba(22,26,24,0.09)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-[13px] leading-relaxed text-[#4A524D]"
    >
      <Info
        size={18}
        weight="duotone"
        className="mt-0.5 shrink-0 text-[#4A7C64]"
        aria-hidden="true"
      />
      <p className="m-0">{MANDATORY_DISCLAIMER}</p>
    </aside>
  );
}
