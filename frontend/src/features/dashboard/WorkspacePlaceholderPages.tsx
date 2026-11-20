import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FilmStrip, Image as ImageIcon, ShieldCheck, SlidersHorizontal } from "@phosphor-icons/react";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { ProvenancePill } from "../../components/ui/ProvenancePill";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { fetchDemoCases } from "../../lib/apiClient";
import { CURATED_DEMO_CORPUS } from "../../lib/constants";
import { useAutopsy } from "../workflow/AutopsyContext";

export function DemoCorpusPage() {
  const navigate = useNavigate();
  const { loadDemoCase } = useAutopsy();
  const demoCasesQuery = useQuery({
    queryKey: ["demo-cases"],
    queryFn: fetchDemoCases,
  });

  const apiCases = demoCasesQuery.data;

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
        {CURATED_DEMO_CORPUS.map((item) => {
          const matchingApiCase = apiCases?.find((c) => c.id === item.id);
          return (
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
                  onClick={() => {
                    if (matchingApiCase) {
                      loadDemoCase(matchingApiCase);
                      navigate("/analyze");
                    } else {
                      navigate("/analyze", { state: { selectedDemoId: item.id } });
                    }
                  }}
                >
                  Inspect
                </Button>
              </div>
            </GlassCard>
          );
        })}
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
