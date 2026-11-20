import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CaretRight,
  Database,
  FilmStrip,
  Image as ImageIcon,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { ProvenancePill } from "../../components/ui/ProvenancePill";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CURATED_DEMO_CORPUS } from "../../lib/constants";

const BENCHMARK_CARDS = [
  {
    key: "NIFTY_50",
    label: "NIFTY 50",
    points: "4,34 24,29 44,31 66,22 86,25 108,15 130,18 152,9",
  },
  {
    key: "SENSEX",
    label: "SENSEX",
    points: "4,32 24,28 46,30 68,21 90,23 112,14 132,16 152,8",
  },
  {
    key: "BANKNIFTY",
    label: "BANKNIFTY",
    points: "4,35 26,30 48,26 70,28 92,19 114,21 134,12 152,10",
  },
] as const;

export function DashboardOverviewPage() {
  const [quickInput, setQuickInput] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/analyze", { state: { prefillQuery: quickInput.trim() } });
  }

  return (
    <div className="space-y-6">
      {/* Top Intake Bar + Compliant Snapshot Status Pill (adapted from ui-ux/DashBoard.png) */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <form
          onSubmit={handleSubmit}
          className="glass-card flex flex-1 flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:rounded-full sm:pl-4"
        >
          <label htmlFor="quick-tip-intake" className="sr-only">
            Paste a Hinglish tip or enter an influencer and stock name
          </label>
          <div className="flex flex-1 items-center gap-2.5 px-2 sm:px-0">
            <MagnifyingGlass size={18} weight="regular" className="shrink-0 text-[#6E7771]" aria-hidden="true" />
            <input
              id="quick-tip-intake"
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Paste a Hinglish tip, or enter influencer & stock name..."
              className="h-10 w-full bg-transparent text-[14.5px] text-[#161A18] placeholder:text-[#6E7771] focus:outline-none"
            />
          </div>
          <Button type="submit" size="md" className="h-10 shrink-0 px-5">
            <span>Analyze</span>
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </Button>
        </form>

        {/* Compliant provenance badge: NEVER "Live Market Data" */}
        <div className="glass-card-subtle flex items-center gap-2.5 rounded-2xl px-4 py-2.5 sm:self-start xl:self-auto">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#4A7C64]"
            aria-hidden="true"
          />
          <div className="leading-tight">
            <p className="m-0 text-[12.5px] font-semibold text-[#161A18]">
              Dated Market Snapshots · NSE / BSE
            </p>
            <p className="m-0 text-[11.5px] text-[#6E7771]">
              Snapshot ingestion activates in Phase 2
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Market Overview Strip */}
      <section aria-labelledby="market-overview-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1
            id="market-overview-heading"
            className="text-[20px] font-semibold tracking-[-0.02em] text-[#161A18]"
          >
            Market Overview
          </h1>
          <ProvenancePill label="Real" asOfDate="Pending Phase 2 Snapshot" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {BENCHMARK_CARDS.map((indexCard) => (
            <GlassCard key={indexCard.key} compact className="flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="m-0 text-[12px] font-semibold tracking-[0.04em] text-[#6E7771] uppercase">
                    {indexCard.label}
                  </p>
                  <p className="tabular-nums-lining mt-1 mb-0 text-[22px] font-bold tracking-[-0.02em] text-[#161A18]">
                    —
                  </p>
                </div>
                <StatusBadge tone="unverified" label="Could not verify" />
              </div>

              <div className="flex items-end justify-between gap-3">
                <p className="m-0 text-[12px] text-[#6E7771]">
                  Awaiting verified dated index snapshot
                </p>
                <svg
                  viewBox="0 0 156 40"
                  className="h-8 w-24 shrink-0 opacity-45"
                  aria-hidden="true"
                >
                  <polyline
                    fill="none"
                    stroke="#4A7C64"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={indexCard.points}
                  />
                </svg>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Curated Demo & In-Session Analyses Table (Compliant replacement for mockup's "Past Reports" & "Confidence Score") */}
      <section aria-labelledby="demo-analyses-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="demo-analyses-heading"
              className="text-[18px] font-semibold tracking-[-0.015em] text-[#161A18]"
            >
              Curated Demo &amp; In-Session Analyses
            </h2>
            <p className="mt-0.5 mb-0 text-[13px] text-[#6E7771]">
              Zero history is persisted across sessions. Select any curated sample to preview the
              analysis flow.
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/corpus")} className="h-9 px-3 text-[13px]">
            <span>View Corpus</span>
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </Button>
        </div>

        <GlassCard className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[rgba(22,26,24,0.08)] bg-white/60 text-[11.5px] font-semibold tracking-[0.04em] text-[#4A524D] uppercase">
                  <th className="px-5 py-3.5">Tip / Stock &amp; Instrument</th>
                  <th className="px-4 py-3.5">Creator &amp; Media</th>
                  <th className="px-4 py-3.5">SEBI Snapshot</th>
                  <th className="px-4 py-3.5">Evidence Status</th>
                  <th className="px-5 py-3.5 text-right">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(22,26,24,0.07)] text-[14px]">
                {CURATED_DEMO_CORPUS.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-white/60"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => navigate("/analyze", { state: { selectedDemoId: item.id } })}
                        className="group flex flex-col text-left cursor-pointer"
                      >
                        <span className="font-semibold text-[#161A18] group-hover:text-[#1F4D3A]">
                          {item.instrument}
                        </span>
                        <span className="text-[12px] text-[#6E7771]">{item.note}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-[#161A18]">
                        {item.mediaType === "Photo" ? (
                          <ImageIcon size={16} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
                        ) : (
                          <FilmStrip size={16} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
                        )}
                        <div>
                          <div className="font-medium">{item.influencer}</div>
                          {item.alias && (
                            <div className="text-[12px] text-[#6E7771]">{item.alias}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge tone="unverified" label={item.corpusTag} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        tone={item.instrumentType === "DERIVATIVE" ? "unverified" : "attention"}
                        label={
                          item.instrumentType === "DERIVATIVE"
                            ? "Could not verify (Derivative)"
                            : "Snapshot pending"
                        }
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(22,26,24,0.09)] bg-[#EFECE6] px-2.5 py-1 text-[11.5px] font-semibold text-[#4A524D]">
                        <Database size={12} weight="regular" aria-hidden="true" />
                        {item.provenance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
