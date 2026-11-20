/**
 * Optional Coordinated-Promotion Demo Signal (Task 3.4).
 * Strictly separate from the five core deterministic market checks.
 * Explicitly synthetic demonstration only — never presented as a production
 * manipulation detector and never labels any individual or channel fraudulent.
 */

export interface SyntheticChannelPostEvent {
  channel_label: string;
  posted_at_iso: string;
  ticker: string;
  phrase_overlap_jaccard: number;
  is_synthetic: true;
}

export interface CoordinatedDemoSignalResult {
  feature_scope: "OPTIONAL_SYNTHETIC_DEMO_ONLY";
  is_synthetic: true;
  data_label: "SYNTHETIC";
  ticker: string;
  window_minutes: number;
  distinct_channels_in_window: number;
  median_phrase_overlap: number;
  status: "BURST_CLUSTER_OBSERVED_DEMO" | "NO_SYNTHETIC_CLUSTER_FOR_TICKER";
  events: SyntheticChannelPostEvent[];
  what_this_shows: string;
  limitations: string[];
}

const SYNTHETIC_BURST_FIXTURES: Record<string, SyntheticChannelPostEvent[]> = {
  BORORENEW: [
    {
      channel_label: "Synthetic Demo Channel A",
      posted_at_iso: "2026-11-10T09:18:00+05:30",
      ticker: "BORORENEW",
      phrase_overlap_jaccard: 0.78,
      is_synthetic: true,
    },
    {
      channel_label: "Synthetic Demo Channel B",
      posted_at_iso: "2026-11-10T09:22:00+05:30",
      ticker: "BORORENEW",
      phrase_overlap_jaccard: 0.81,
      is_synthetic: true,
    },
    {
      channel_label: "Synthetic Demo Channel C",
      posted_at_iso: "2026-11-10T09:27:00+05:30",
      ticker: "BORORENEW",
      phrase_overlap_jaccard: 0.74,
      is_synthetic: true,
    },
  ],
  SARVESHWAR: [
    {
      channel_label: "Synthetic Demo Channel D",
      posted_at_iso: "2026-11-12T09:31:00+05:30",
      ticker: "SARVESHWAR",
      phrase_overlap_jaccard: 0.84,
      is_synthetic: true,
    },
    {
      channel_label: "Synthetic Demo Channel E",
      posted_at_iso: "2026-11-12T09:36:00+05:30",
      ticker: "SARVESHWAR",
      phrase_overlap_jaccard: 0.79,
      is_synthetic: true,
    },
    {
      channel_label: "Synthetic Demo Channel F",
      posted_at_iso: "2026-11-12T09:40:00+05:30",
      ticker: "SARVESHWAR",
      phrase_overlap_jaccard: 0.82,
      is_synthetic: true,
    },
  ],
};

export function getSyntheticCoordinatedDemoSignal(ticker: string): CoordinatedDemoSignalResult {
  const upper = ticker.trim().toUpperCase();
  const events = SYNTHETIC_BURST_FIXTURES[upper] ?? [];
  const overlaps = events.map((e) => e.phrase_overlap_jaccard).sort((a, b) => a - b);
  const medianOverlap =
    overlaps.length === 0 ? 0 : overlaps[Math.floor(overlaps.length / 2)]!;

  return {
    feature_scope: "OPTIONAL_SYNTHETIC_DEMO_ONLY",
    is_synthetic: true,
    data_label: "SYNTHETIC",
    ticker: upper,
    window_minutes: 15,
    distinct_channels_in_window: events.length,
    median_phrase_overlap: Number(medianOverlap.toFixed(2)),
    status:
      events.length >= 3
        ? "BURST_CLUSTER_OBSERVED_DEMO"
        : "NO_SYNTHETIC_CLUSTER_FOR_TICKER",
    events,
    what_this_shows:
      events.length >= 3
        ? `Illustrative synthetic example: ${events.length} synthetic channels posted similar text for ${upper} within 15 minutes.`
        : `No synthetic multi-channel burst fixture is configured for ${upper}.`,
    limitations: [
      "All timestamps and channel events shown in this panel are 100% synthetic demonstration inputs — Tip Autopsy does not scrape live Telegram, WhatsApp, Instagram, or YouTube channels.",
      "Simultaneous posts or shared phrases can occur around public earnings news or exchange filings and cannot by themselves establish coordinated manipulation or fraud.",
      "This optional demonstration is strictly separate from the five core deterministic market checks.",
    ],
  };
}
