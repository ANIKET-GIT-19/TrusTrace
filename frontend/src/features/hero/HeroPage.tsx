import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChartLineUp,
  List,
  Play,
  Scales,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import { BrandMark } from "../../components/ui/BrandMark";
import { Button } from "../../components/ui/Button";
import { DisclaimerBanner } from "../../components/ui/DisclaimerBanner";
import { GlassCard } from "../../components/ui/GlassCard";
import { ProvenancePill } from "../../components/ui/ProvenancePill";
import { CORE_PRODUCT_RULE } from "../../lib/constants";
import {
  HeroStockBackdrop,
  HeroWaveBorderOverlay,
  HeroWaveClipDefs,
} from "./HeroStockWave";

interface HeroCreatorCard {
  id: string;
  src: string;
  alt: string;
  /** True for the 3 user GIFs that already include a caption pill in-frame */
  hasEmbeddedCaption: boolean;
  /** Literal quoted creator hype example rendered on generated portraits */
  overlayCaption?: string;
  tiltClass?: string;
  animatedPortrait?: boolean;
  sampleLabel: string;
}

const HERO_CREATOR_CARDS: HeroCreatorCard[] = [
  {
    id: "creator-multibagger",
    src: "/media/hero/claude.gif",
    alt: "Illustrative finfluencer clip quoting 10x multibagger claim",
    hasEmbeddedCaption: true,
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
    sampleLabel: "Hype claim: 2x return promise",
  },
  {
    id: "creator-buy-now",
    src: "/media/hero/Gemini_Generated_Gif_rizow1rizow1rizo-watermark-removed.gif",
    alt: "Illustrative finfluencer clip quoting Buy now urgency prompt",
    hasEmbeddedCaption: true,
    sampleLabel: "Urgency prompt: Buy now?",
  },
  {
    id: "creator-big-opportunity",
    src: "/media/hero/Gemini_Generated_Gif_9ll7po9ll7po9ll7-watermark-removed.gif",
    alt: "Illustrative finfluencer clip quoting Big opportunity claim",
    hasEmbeddedCaption: true,
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
    sampleLabel: "FOMO claim: Don't miss out",
  },
];

export function HeroPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#161A18]">
      {/* Flagship Hero Composition matching ui-ux/hero.jpeg */}
      <section
        aria-label="Tip Autopsy hero"
        className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden"
        style={{
          background:
            "radial-gradient(62% 58% at 14% 28%, rgba(212, 232, 222, 0.78) 0%, rgba(250, 248, 244, 0) 70%), radial-gradient(54% 52% at 86% 18%, rgba(220, 236, 228, 0.65) 0%, rgba(250, 248, 244, 0) 68%), #FAF8F4",
        }}
      >
        <HeroWaveClipDefs />
        <HeroStockBackdrop />

        {/* Floating Pill Navigation Bar */}
        <header className="relative z-30 mx-auto w-[calc(100%-32px)] max-w-[1060px] pt-5">
          <nav
            aria-label="Primary"
            className="glass-nav flex h-[52px] items-center justify-between rounded-full pr-2 pl-4 sm:h-[56px] sm:pl-5"
          >
            <Link to="/" className="rounded-full focus-visible:outline-offset-4">
              <BrandMark />
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Link
                to="/dashboard"
                className="text-[14px] font-medium text-[#4A524D] transition-colors hover:text-[#161A18]"
              >
                Analyze
              </Link>
              <a
                href="#learn"
                className="text-[14px] font-medium text-[#4A524D] transition-colors hover:text-[#161A18]"
              >
                Learn
              </a>
              <a
                href="#about"
                className="text-[14px] font-medium text-[#4A524D] transition-colors hover:text-[#161A18]"
              >
                About
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="md"
                className="h-10 px-4 text-[13.5px] sm:px-5"
                onClick={() => navigate("/dashboard")}
              >
                <span>Get Started</span>
                <ArrowRight size={15} weight="bold" aria-hidden="true" />
              </Button>
              <button
                type="button"
                aria-label={mobileMenuOpen ? "Close menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#161A18] hover:bg-black/5 md:hidden"
              >
                {mobileMenuOpen ? <X size={20} weight="regular" /> : <List size={20} weight="regular" />}
              </button>
            </div>
          </nav>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="glass-card mt-2 flex flex-col gap-1 rounded-2xl p-3 md:hidden">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 items-center rounded-xl px-3 text-[15px] font-medium text-[#161A18] hover:bg-black/5"
              >
                Analyze
              </Link>
              <a
                href="#learn"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 items-center rounded-xl px-3 text-[15px] font-medium text-[#4A524D] hover:bg-black/5"
              >
                Learn
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 items-center rounded-xl px-3 text-[15px] font-medium text-[#4A524D] hover:bg-black/5"
              >
                About
              </a>
            </div>
          )}
        </header>

        {/* Centered Editorial Hero Copy */}
        <div className="relative z-20 mx-auto flex w-full max-w-[760px] flex-col items-center px-4 pt-9 pb-6 text-center sm:pt-12 sm:pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(74,124,100,0.24)] bg-[#E6F2EC]/90 px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.015em] text-[#1F4D3A] shadow-[0_2px_10px_rgba(31,77,58,0.06)]">
            <span
              className="h-2 w-2 rounded-full bg-[#2E9E6B] shadow-[0_0_0_3px_rgba(46,158,107,0.22)]"
              aria-hidden="true"
            />
            <span>Signal vs. Noise for Retail Investors</span>
          </div>

          <h1 className="mt-5 text-[38px] leading-[1.08] font-bold tracking-[-0.03em] text-[#161A18] sm:text-[52px] lg:text-[64px]">
            Think Before You <span className="text-[#4A7C64]">Trust.</span>
          </h1>

          <p className="mt-4 max-w-[540px] text-[16px] leading-[1.55] text-[#4A524D] sm:text-[18px]">
            Dissect any stock tip. Check the credibility, detect the hype, and see the real numbers
            — instantly.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/dashboard")}>
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
              <Play size={16} weight="fill" className="translate-x-[1px] text-[#4A524D]" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Lower Wave-Clipped 5-Card Finfluencer Media Strip */}
        <div className="relative z-20 mt-auto w-full">
          {/* Desktop (lg+): Exact full-bleed 5-panel wave-clipped strip matching ui-ux/hero.jpeg */}
          <div className="relative hidden h-[330px] w-full lg:block xl:h-[370px]">
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
                    className={`h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.04] ${
                      card.animatedPortrait ? "animate-portrait-live" : ""
                    }`}
                  />
                  {/* Subtle top green tint fade under wave edge */}
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#3B8E6A]/18 to-transparent"
                    aria-hidden="true"
                  />
                  {!card.hasEmbeddedCaption && card.overlayCaption && (
                    <span
                      className={`pointer-events-none absolute inset-x-3 bottom-7 flex justify-center ${card.tiltClass ?? ""}`}
                    >
                      <span className="rounded-xl border border-white/85 bg-[rgba(255,255,255,0.92)] px-3.5 py-2 text-center text-[15px] leading-snug font-bold tracking-[-0.015em] text-[#161A18] shadow-[0_10px_24px_rgba(22,26,24,0.18)] backdrop-blur-md">
                        {card.overlayCaption}
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
            <HeroWaveBorderOverlay />
          </div>

          {/* Mobile & Tablet (<lg): Smooth horizontal scroll-snap carousel */}
          <div className="px-4 pb-6 lg:hidden">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {HERO_CREATOR_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  aria-label={`Inspect example tip in Tip Autopsy analyzer: ${card.sampleLabel}`}
                  className="relative aspect-[3/4] w-[68vw] max-w-[240px] shrink-0 snap-center overflow-hidden rounded-[18px] border border-white/80 bg-[#EFECE6] shadow-[0_8px_24px_rgba(22,26,24,0.08)]"
                >
                  <img
                    src={card.src}
                    alt={card.alt}
                    className={`h-full w-full object-cover object-top ${
                      card.animatedPortrait ? "animate-portrait-live" : ""
                    }`}
                  />
                  {!card.hasEmbeddedCaption && card.overlayCaption && (
                    <span
                      className={`pointer-events-none absolute inset-x-3 bottom-4 flex justify-center ${card.tiltClass ?? ""}`}
                    >
                      <span className="rounded-xl border border-white/85 bg-[rgba(255,255,255,0.92)] px-3 py-1.5 text-center text-[13.5px] font-bold text-[#161A18] shadow-md backdrop-blur-md">
                        {card.overlayCaption}
                      </span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Discreet Provenance Bar directly below the illustrative hero visuals */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(22,26,24,0.08)] bg-[rgba(250,248,244,0.92)] px-4 py-2.5 text-[12px] text-[#6E7771] sm:px-6">
            <span>
              Illustrative demo market curve &amp; creator examples · Real NSE/BSE snapshots in
              analyzer
            </span>
            <ProvenancePill label="Synthetic / Demo" />
          </div>
        </div>
      </section>

      {/* Editorial Evidence Summary (#learn & #about) */}
      <main className="mx-auto max-w-[1120px] space-y-12 px-4 py-14 sm:px-6 sm:py-16">
        <section id="learn" aria-labelledby="learn-heading" className="space-y-6">
          <div className="max-w-[660px]">
            <p className="text-[12px] font-semibold tracking-[0.06em] text-[#4A7C64] uppercase">
              Evidence, Not Advice
            </p>
            <h2
              id="learn-heading"
              className="mt-2 text-[24px] leading-[1.25] font-semibold tracking-[-0.02em] text-[#161A18] sm:text-[28px]"
            >
              {CORE_PRODUCT_RULE}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.55] text-[#4A524D]">
              Tip Autopsy examines one stock tip at a time from a photo, video, or Hinglish text—
              pairing a structured Claim Ledger with dated SEBI and NSE/BSE snapshots.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard>
              <ShieldCheck size={24} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.015em] text-[#161A18]">
                SEBI Snapshot &amp; Disclosure
              </h3>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-[#4A524D]">
                Checks the creator against a dated SEBI register snapshot without treating a missing
                match as proof of wrongdoing, and grades sponsorship disclosure clarity.
              </p>
            </GlassCard>

            <GlassCard>
              <ChartLineUp size={24} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.015em] text-[#161A18]">
                Five Deterministic Checks
              </h3>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-[#4A524D]">
                Measures liquidity, market-cap band, tip-day volume spike, 5-session pre-tip
                run-up, and ASM/GSM surveillance status—returning Could not verify when data is
                absent.
              </p>
            </GlassCard>

            <GlassCard>
              <Scales size={24} weight="duotone" className="text-[#4A7C64]" aria-hidden="true" />
              <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.015em] text-[#161A18]">
                Guarded Verdict &amp; Pause
              </h3>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-[#4A524D]">
                Assembles an Information Verdict from reviewed templates only, enforces an Output
                Guard against advice language, and prompts a three-question Pause &amp; Plan.
              </p>
            </GlassCard>
          </div>
        </section>

        <section id="about" aria-labelledby="about-heading" className="space-y-4">
          <h2
            id="about-heading"
            className="text-[20px] font-semibold tracking-[-0.02em] text-[#161A18]"
          >
            Zero Login. Zero Personal Data Stored.
          </h2>
          <p className="max-w-[720px] text-[15px] leading-[1.55] text-[#4A524D]">
            Version 1 requires no account, portfolio, or watchlist. Uploaded photos, videos, pasted
            tips, and Pause &amp; Plan reflections are processed transiently in active memory and
            never stored on disk, in browser storage, or in the database.
          </p>
          <DisclaimerBanner />
        </section>
      </main>
    </div>
  );
}
