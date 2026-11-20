import { ArrowCounterClockwise, ArrowLeft, CheckCircle, LockSimple, ShieldWarning } from "@phosphor-icons/react";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { TextAreaField, TextField } from "../../components/ui/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAutopsy } from "../workflow/AutopsyContext";

export function PauseAndPlanGate() {
  const { state, updatePausePlan, setStep, resetSession } = useAutopsy();
  const { maxLoss, exitPrice, disproofCriteria, completed } = state.pausePlan;

  const allThreeAnswered =
    maxLoss.trim().length > 0 && exitPrice.trim().length > 0 && disproofCriteria.trim().length > 0;

  return (
    <GlassCard className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldWarning size={22} weight="duotone" className="text-[#9A5B13]" aria-hidden="true" />
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#161A18]">
              Step 5 — Pause &amp; Plan Before You Act
            </h2>
          </div>
          <p className="m-0 max-w-[660px] text-[14px] leading-relaxed text-[#4A524D]">
            Before choosing <strong className="text-[#161A18]">I&apos;d act on this</strong>, write
            your own risk limits. Tip Autopsy does not recommend a position size, exit price, or
            trade action—and your answers stay only in active memory.
          </p>
        </div>

        <StatusBadge tone="unverified" label="In-memory only · Never saved" />
      </div>

      <div className="grid gap-4">
        <TextField
          id="pause-plan-max-loss"
          label="1. How much can I afford to lose?"
          value={maxLoss}
          onChange={(e) => updatePausePlan({ maxLoss: e.target.value, completed: false })}
          placeholder="Write your own rupee amount or personal limit..."
          hint="Tip Autopsy will never calculate or recommend a position size for you."
        />

        <TextField
          id="pause-plan-exit-price"
          label="2. At what price do I exit?"
          value={exitPrice}
          onChange={(e) => updatePausePlan({ exitPrice: e.target.value, completed: false })}
          placeholder="Write your own invalidation / exit price or rule..."
          hint="Notice whether the original tip omitted or paywalled a stop-loss."
        />

        <TextAreaField
          id="pause-plan-disproof"
          label="3. What would prove this tip wrong?"
          value={disproofCriteria}
          onChange={(e) => updatePausePlan({ disproofCriteria: e.target.value, completed: false })}
          placeholder="Write the concrete evidence that would invalidate this thesis for you..."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(22,26,24,0.08)] pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setStep(4)}>
            <ArrowLeft size={16} weight="regular" aria-hidden="true" />
            <span>Back to Evidence</span>
          </Button>
          <Button variant="ghost" onClick={resetSession}>
            <ArrowCounterClockwise size={16} weight="regular" aria-hidden="true" />
            <span>Reset &amp; Clear Session</span>
          </Button>
        </div>

        <Button
          disabled={!allThreeAnswered}
          onClick={() => updatePausePlan({ completed: true })}
        >
          <span>I&apos;d act on this — Record my pause</span>
        </Button>
      </div>

      {!allThreeAnswered && (
        <p className="m-0 flex items-center gap-2 text-[12.5px] text-[#6E7771]">
          <LockSimple size={14} weight="duotone" aria-hidden="true" />
          <span>Complete all three pre-commitment questions above to unlock this path.</span>
        </p>
      )}

      {completed && allThreeAnswered && (
        <div
          aria-live="polite"
          className="space-y-2 rounded-2xl border border-[rgba(42,111,82,0.25)] bg-[#E6F2EC]/80 p-4 text-[13.5px] text-[#123528]"
        >
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle size={18} weight="duotone" aria-hidden="true" />
            <span>Personal pre-commitment review completed (in-memory only)</span>
          </div>
          <p className="m-0 leading-relaxed">
            You noted your personal risk limit (<strong>{maxLoss}</strong>), exit boundary (
            <strong>{exitPrice}</strong>), and disproof condition (
            <strong>{disproofCriteria}</strong>). These notes are never sent to our server or saved
            in browser storage. The decision is entirely yours.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
