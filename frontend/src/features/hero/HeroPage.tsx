import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play } from "@phosphor-icons/react";
import { Button } from "../../components/ui/Button";
import { ProvenancePill } from "../../components/ui/ProvenancePill";
import { CORE_PRODUCT_RULE, MANDATORY_DISCLAIMER } from "../../lib/constants";
import {
  HeroStockBackdrop,
  HeroWaveBorderOverlay,
  HeroWaveClipDefs,
} from "./HeroStockWave";

interface HeroCreatorCard {
  id: string;
  src: string;
  alt: string;
  hasEmbeddedCaption: boolean;
  overlayCaption?: string;
  tiltClass?: string;
  animatedPortrait?: boolean;
  objectPositionClass: string;
  sampleLabel: string;
}

const HERO_CREATOR_CARDS: HeroCreatorCard[] = [
  {
    id: "creator-multibagger",
    src: "/media/hero/claude.gif",
    alt: "Illustrative finfluencer clip quoting 10x multibagger claim",
    hasEmbeddedCaption: true,
    objectPositionClass: "object-center",
    sampleLabel: "Hype claim: 10x multibagger",
  },
  {
    id: "creator-2x-soon",
    src: "/media/hero/creator_2x_soon.jpg",
    alt: "Illustrative finfluencer portrait quoting This stock will 2x soon",
    hasEmbeddedCaption: false,
    overlayCaption: "This stock will 2x soon! 🔥",
    tiltClass: "-rotate-[4deg]",
    animatedPortrait: true,
    objectPositionClass: "object-[50%_20%]",
    sampleLabel: "Hype claim: 2x return promise",
  },
  {
    id: "creator-buy-now",
    src: "/media/hero/Gemini_Generated_Gif_rizow1rizow1rizo-watermark-removed.gif",
    alt: "Illustrative finfluencer clip quoting Buy now urgency prompt",
    hasEmbeddedCaption: true,
    objectPositionClass: "object-[50%_46%]",
    sampleLabel: "Urgency prompt: Buy now?",
  },
  {
    id: "creator-big-opportunity",
    src: "/media/hero/Gemini_Generated_Gif_9ll7po9ll7po9ll7-watermark-removed.gif",
    alt: "Illustrative finfluencer clip quoting Big opportunity claim",
    hasEmbeddedCaption: true,
    objectPositionClass: "object-[50%_46%]",
    sampleLabel: "Promotional claim: Big opportunity",
  },
  {
    id: "creator-dont-miss-out",
    src: "/media/hero/creator_dont_miss_out.jpg",
    alt: "Illustrative finfluencer portrait quoting Don't miss out urgency claim",
    hasEmbeddedCaption: false,
    overlayCaption: "Don't miss out! 📈",
    tiltClass: "rotate-[5deg]",
    animatedPortrait: true,
    objectPositionClass: "object-[50%_18%]",
    sampleLabel: "FOMO claim: Don't miss out",
  },
];

export function HeroPage() {
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#FAF8F4] text-[#161A18]">
      <a
        href="#hero-primary-cta"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-[#161A18] focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-[#FAF8F4]"
      >
        Skip to main content
      </a>

      {/* Single-viewport Hero Composition: header cleanly above interactive candlesticks + wave-clipped strip */}
      <section
        ref={heroSectionRef}
        aria-label="Tip Autopsy hero"
        className="relative isolate flex h-full w-full flex-col justify-between overflow-hidden"
        style={{
          background:
            "radial-gradient(62% 58% at 14% 28%, rgba(212, 232, 222, 0.78) 0%, rgba(250, 248, 244, 0) 70%), radial-gradient(54% 52% at 86% 18%, rgba(220, 236, 228, 0.65) 0%, rgba(250, 248, 244, 0) 68%), #FAF8F4",
        }}
      >
        <HeroWaveClipDefs />
        <HeroStockBackdrop interactionTargetRef={heroSectionRef} />

        {/* Centered Editorial Hero Header — positioned high so it never clashes with the chart animation */}
        <main className="relative z-20 mx-auto flex w-full max-w-[760px] shrink-0 flex-col items-center px-4 pt-6 pb-2 text-center sm:pt-8 lg:pt-9">
          <h1 className="m-0 text-[36px] leading-[1.06] font-bold tracking-[-0.03em] text-[#161A18] sm:text-[50px] lg:text-[60px] xl:text-[64px]">
            Think Before You <span className="text-[#4A7C64]">Trust.</span>
          </h1>

          <p className="mt-2.5 max-w-[520px] text-[14.5px] leading-[1.5] text-[#4A524D] sm:mt-3 sm:text-[17px]">
            Dissect any stock tip. Check the credibility, detect the hype, and see the real numbers
            — instantly.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 sm:mt-5">
            <Button id="hero-primary-cta" size="lg" onClick={() => navigate("/dashboard")}>
              <span>Analyze a Tip</span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12"
              aria-label="See how Tip Autopsy works"
              onClick={() => navigate("/how-it-works")}
            >
              <Play
                size={16}
                weight="fill"
                className="translate-x-[1px] text-[#4A524D]"
                aria-hidden="true"
              />
            </Button>
          </div>
        </main>

        {/* Lower Wave-Clipped 5-Card Finfluencer Strip sitting below the animated candlestick showcase */}
        <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col justify-end">
          {/* Desktop (lg+): Full-bleed 5-panel wave-clipped strip */}
          <div className="relative hidden h-[44vh] min-h-[220px] max-h-[345px] w-full lg:block">
            <div
              className="grid h-full w-full grid-cols-5 gap-[4px] bg-white/95"
              style={{ clipPath: "url(#hero-wave-strip-clip)" }}
            >
              {HERO_CREATOR_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  aria-label={`Inspect example tip in Tip Autopsy analyzer: ${card.sampleLabel}`}
                  className="group relative h-full w-full cursor-pointer overflow-hidden bg-[#EFECE6] text-left focus-visible:outline-offset-[-3px]"
                >
                  <img
                    src={card.src}
                    alt={card.alt}
                    className={`h-full w-full object-cover ${card.objectPositionClass} transition-transform duration-300 group-hover:scale-[1.04] ${
                      card.animatedPortrait ? "animate-portrait-live" : ""
                    }`}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#3B8E6A]/18 to-transparent"
                    aria-hidden="true"
                  />
                  {!card.hasEmbeddedCaption && card.overlayCaption && (
                    <span
                      className={`pointer-events-none absolute inset-x-3 bottom-6 flex justify-center ${card.tiltClass ?? ""}`}
                    >
                      <span className="rounded-xl border border-white/85 bg-[rgba(255,255,255,0.93)] px-3 py-1.5 text-center text-[14px] leading-snug font-bold tracking-[-0.015em] text-[#161A18] shadow-[0_10px_24px_rgba(22,26,24,0.18)] backdrop-blur-md xl:text-[15px]">
                        {card.overlayCaption}
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            <HeroWaveBorderOverlay />
          </div>

          {/* Mobile & Tablet (<lg): Horizontal scroll-snap carousel constrained to viewport */}
          <div className="flex min-h-0 flex-1 items-end px-4 pb-3 lg:hidden">
            <div className="flex h-full max-h-[265px] w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {HERO_CREATOR_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  aria-label={`Inspect example tip in Tip Autopsy analyzer: ${card.sampleLabel}`}
                  className="relative h-full aspect-[3/4] shrink-0 snap-center overflow-hidden rounded-[18px] border border-white/80 bg-[#EFECE6] shadow-[0_8px_24px_rgba(22,26,24,0.08)]"
                >
                  <img
                    src={card.src}
                    alt={card.alt}
                    className={`h-full w-full object-cover ${card.objectPositionClass} ${
                      card.animatedPortrait ? "animate-portrait-live" : ""
                    }`}
                  />
                  {!card.hasEmbeddedCaption && card.overlayCaption && (
                    <span
                      className={`pointer-events-none absolute inset-x-2.5 bottom-3.5 flex justify-center ${card.tiltClass ?? ""}`}
                    >
                      <span className="rounded-xl border border-white/85 bg-[rgba(255,255,255,0.93)] px-2.5 py-1 text-center text-[12.5px] font-bold text-[#161A18] shadow-md backdrop-blur-md">
                        {card.overlayCaption}
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Single-Line Non-Advisory Footer Strip */}
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[rgba(22,26,24,0.08)] bg-[rgba(250,248,244,0.95)] px-4 py-2 text-[11px] leading-snug text-[#6E7771] sm:px-6">
            <span className="truncate">
              <strong className="font-semibold text-[#161A18]">{CORE_PRODUCT_RULE}</strong>{" "}
              {MANDATORY_DISCLAIMER}
            </span>
            <ProvenancePill label="Synthetic / Demo" />
          </footer>
        </div>
      </section>
    </div>
  );
}
