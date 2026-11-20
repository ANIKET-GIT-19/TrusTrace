import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CloudArrowUp,
  FilmStrip,
  Image as ImageIcon,
  ShieldCheck,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { TextAreaField, TextField } from "../../components/ui/Input";
import { ProgressSteps } from "../../components/ui/ProgressSteps";
import { ProvenancePill } from "../../components/ui/ProvenancePill";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CURATED_DEMO_CORPUS } from "../../lib/constants";

interface AnalyzeLocationState {
  prefillQuery?: string;
  selectedDemoId?: string;
}

export function NewAnalysisShellPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as AnalyzeLocationState | null) ?? null;
  const selectedDemo = CURATED_DEMO_CORPUS.find((d) => d.id === state?.selectedDemoId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#161A18]">
            New Tip Autopsy
          </h1>
          <p className="mt-1 mb-0 text-[14px] text-[#4A524D]">
            Submit any photo, video, or Hinglish text alongside the influencer and stock name.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} weight="regular" aria-hidden="true" />
          <span>Overview</span>
        </Button>
      </div>

      <ProgressSteps activeStep={1} />

      <div className="grid gap-5 lg:grid-cols-12">
        <GlassCard className="space-y-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 text-[17px] font-semibold text-[#161A18]">
              1. Multimodal Tip Input
            </h2>
            <StatusBadge tone="unverified" label="Processed transiently · Not saved" />
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[rgba(22,26,24,0.16)] bg-[rgba(250,248,244,0.65)] px-5 py-7 text-center">
            <CloudArrowUp size={30} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
            <p className="mt-2.5 mb-0 text-[14.5px] font-semibold text-[#161A18]">
              Photo (.jpeg, .png, .webp) or Video (.mp4, .webm, .mov)
            </p>
            <p className="mt-1 mb-0 text-[12.5px] text-[#6E7771]">
              Full multimodal extraction and Claim Ledger parsing connect in Phase 2 (Task 2.9).
            </p>
          </div>

          <TextAreaField
            id="tip-text-shell"
            label="Or paste Hinglish / English tip text"
            defaultValue={state?.prefillQuery ?? ""}
            placeholder="e.g., Guaranteed 2x in 10 days, last chance! SL PAID..."
            hint="Raw text stays in active browser memory only and is cleared on reset."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="influencer-name-shell"
              label="Influencer name, handle, or SEBI no."
              defaultValue={selectedDemo?.influencer ?? ""}
              placeholder="e.g., Rakesh Bansal"
            />
            <TextField
              id="stock-name-shell"
              label="Stock or instrument name"
              defaultValue={selectedDemo?.instrument ?? ""}
              placeholder="e.g., Wipro Limited or Nifty 25500 CE"
            />
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between gap-4 lg:col-span-5">
          <div className="space-y-3">
            <h2 className="m-0 text-[17px] font-semibold text-[#161A18]">
              Evidence Engine Readiness
            </h2>
            <p className="m-0 text-[14px] leading-relaxed text-[#4A524D]">
              Phase 1 establishes the visual shell, design tokens, and Express + Supabase
              foundation. Deterministic market checks, SEBI snapshot lookup, Tip Time Machine,
              Guarded Information Verdict, and Pause &amp; Plan wire in Phase 2.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <StatusBadge tone="neutral_ok" label="Within normal range" />
              <StatusBadge tone="attention" label="Needs attention" />
              <StatusBadge tone="unverified" label="Could not verify" />
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(22,26,24,0.08)] bg-[#F3F0EA]/80 p-4 text-[13px] text-[#4A524D]">
            <p className="m-0 font-semibold text-[#161A18]">Non-Blocking SEBI Policy</p>
            <p className="mt-1 mb-0">
              A <span className="font-semibold">Not found in SEBI register</span> result never
              stops the rest of the analysis and is never treated as proof of fraud.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function DemoCorpusPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#161A18]">
            Curated Hinglish Media Corpus
          </h1>
          <p className="mt-1 mb-0 text-[14px] text-[#4A524D]">
            Preloaded photo screenshots and video clips used for repeatable demonstrations.
          </p>
        </div>
        <ProvenancePill label="Curated Demo · Mixed" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CURATED_DEMO_CORPUS.map((item) => (
          <GlassCard key={item.id} compact className="flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[rgba(22,26,24,0.08)] bg-[#EFECE6]">
                {item.mediaType === "Photo" ? (
                  <img
                    src={item.mediaPath}
                    alt={`${item.influencer} tip screenshot for ${item.instrument}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={item.mediaPath}
                    muted
                    loop
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                    aria-label={`${item.influencer} video clip about ${item.instrument}`}
                  />
                )}
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#161A18]/78 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  {item.mediaType === "Photo" ? (
                    <ImageIcon size={12} weight="bold" aria-hidden="true" />
                  ) : (
                    <FilmStrip size={12} weight="bold" aria-hidden="true" />
                  )}
                  {item.mediaType}
                </span>
              </div>

              <div>
                <h2 className="m-0 text-[16px] font-semibold text-[#161A18]">
                  {item.instrument}
                </h2>
                <p className="mt-0.5 mb-0 text-[13px] font-medium text-[#4A524D]">
                  {item.influencer}
                  {item.alias ? ` (${item.alias})` : ""}
                </p>
                <p className="mt-1 mb-0 text-[12.5px] text-[#6E7771]">{item.note}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <StatusBadge tone="unverified" label={item.instrumentType} />
              <Button
                variant="secondary"
                className="h-9 px-3.5 text-[12.5px]"
                onClick={() => navigate("/analyze", { state: { selectedDemoId: item.id } })}
              >
                Inspect
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function HowChecksWorkPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#161A18]">
          How Tip Autopsy Checks Work
        </h1>
        <p className="mt-1 mb-0 max-w-[700px] text-[14.5px] leading-relaxed text-[#4A524D]">
          Every check is computed deterministically on the backend from dated snapshots—never by
          a free-form LLM—and returns an explicit Could not verify state whenever source data is
          missing or inapplicable (such as equity-only checks on index options).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <SlidersHorizontal size={22} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
          <h2 className="mt-3 text-[16px] font-semibold text-[#161A18]">
            Five Deterministic Market Checks
          </h2>
          <ul className="mt-2 mb-0 space-y-1.5 pl-4 text-[13.5px] leading-relaxed text-[#4A524D]">
            <li>Liquidity: average daily traded value over prior N valid trading sessions.</li>
            <li>Market cap band: dated snapshot mapped to versioned Large/Mid/Small/Micro tiers.</li>
            <li>Volume spike: tip-day volume compared against prior N sessions.</li>
            <li>Pre-tip run-up: percentage price move across the 5 prior trading sessions.</li>
            <li>Surveillance &amp; circuit band: dated NSE/BSE ASM/GSM and circuit-band status.</li>
          </ul>
        </GlassCard>

        <GlassCard>
          <ShieldCheck size={22} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
          <h2 className="mt-3 text-[16px] font-semibold text-[#161A18]">
            Output Guard &amp; Benchmark-Adjusted Interval
          </h2>
          <p className="mt-2 mb-0 text-[13.5px] leading-relaxed text-[#4A524D]">
            Historical creator outcomes are evaluated against the Nifty 50 over the exact stated
            horizon and summarized with a Beta-Binomial 95% credible interval (or Not enough tips
            to judge). Every Information Verdict sentence is built from reviewed templates and
            scanned by the Output Guard to block investment advice.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
