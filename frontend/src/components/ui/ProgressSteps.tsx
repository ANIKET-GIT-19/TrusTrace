import { Check } from "@phosphor-icons/react";

const STEPS = [
  "Input",
  "Claim Ledger",
  "SEBI & Checks",
  "Time Machine & Verdict",
  "Pause & Plan",
] as const;

export interface ProgressStepsProps {
  activeStep: number;
}

export function ProgressSteps({ activeStep }: ProgressStepsProps) {
  return (
    <nav aria-label="Autopsy workflow progress" className="w-full overflow-x-auto pb-1">
      <ol className="m-0 flex min-w-max list-none items-center gap-2 p-0">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < activeStep;
          const isActive = stepNumber === activeStep;

          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={isActive ? "step" : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  isActive
                    ? "bg-[#161A18] text-[#FAF8F4]"
                    : isComplete
                      ? "bg-[#E6F2EC] text-[#1F4D3A]"
                      : "bg-[#F3F0EA] text-[#4A524D]"
                }`}
              >
                <span className="tabular-nums-lining inline-flex h-4 w-4 items-center justify-center rounded-full text-[11px]">
                  {isComplete ? <Check size={12} weight="bold" aria-hidden="true" /> : stepNumber}
                </span>
                <span>{label}</span>
              </span>
              {index < STEPS.length - 1 && (
                <span className="h-px w-4 bg-[rgba(22,26,24,0.12)]" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
