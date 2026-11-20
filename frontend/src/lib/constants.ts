export const MANDATORY_DISCLAIMER =
  "This report describes historical facts and risk factors around a tip. It is not investment advice or SEBI-registered research. The decision is yours.";

export const CORE_PRODUCT_RULE = "We grade the information, not the investment.";

export interface CuratedDemoItem {
  id: string;
  influencer: string;
  alias?: string;
  instrument: string;
  ticker: string;
  instrumentType: "EQUITY" | "DERIVATIVE";
  mediaType: "Photo" | "Video";
  mediaPath: string;
  corpusTag: "Registered (Snapshot Pending)" | "Not found (Snapshot Pending)";
  note: string;
  provenance: "Curated Demo · Mixed";
}

export const CURATED_DEMO_CORPUS: CuratedDemoItem[] = [
  {
    id: "ashish-kyal-sensex-82900-ce",
    influencer: "Ashish Kyal",
    instrument: "Sensex 82900 CE",
    ticker: "SENSEX_82900_CE",
    instrumentType: "DERIVATIVE",
    mediaType: "Photo",
    mediaPath: "/media/photos/Ashish_Kyal__Sensex_82900_CE__Not_Registered.jpeg",
    corpusTag: "Not found (Snapshot Pending)",
    note: "Telegram screenshot · Gated stop-loss (SL PAID) · Derivative scope",
    provenance: "Curated Demo · Mixed",
  },
  {
    id: "chinmay-dudhane-nifty-25500-ce",
    influencer: "Chinmay Dudhane",
    alias: "Trading cafe India",
    instrument: "Nifty 25500 CE",
    ticker: "NIFTY_25500_CE",
    instrumentType: "DERIVATIVE",
    mediaType: "Photo",
    mediaPath: "/media/photos/Chinmay_Dudhane__Nifty_25500_CE__Registered.jpeg",
    corpusTag: "Registered (Snapshot Pending)",
    note: "Telegram screenshot · Gated stop-loss (SL- Paid) · Derivative scope",
    provenance: "Curated Demo · Mixed",
  },
  {
    id: "harsh-bhagat-nifty-25600-ce",
    influencer: "Harsh Bhagat",
    instrument: "Nifty 25600 CE",
    ticker: "NIFTY_25600_CE",
    instrumentType: "DERIVATIVE",
    mediaType: "Photo",
    mediaPath: "/media/photos/Harsh_Bhagat__Nifty_25600_CE__Not_Registered.jpeg",
    corpusTag: "Not found (Snapshot Pending)",
    note: "Telegram screenshot · Gated stop-loss (SL. VIP PREMIUM)",
    provenance: "Curated Demo · Mixed",
  },
  {
    id: "rakesh-bansal-borosil-renewables",
    influencer: "Rakesh Bansal",
    instrument: "Borosil Renewables Ltd",
    ticker: "BORORENEW",
    instrumentType: "EQUITY",
    mediaType: "Video",
    mediaPath: "/media/videos/Rakesh_Bansal__Borosil_Renewables_Ltd__Registered.App.mp4",
    corpusTag: "Registered (Snapshot Pending)",
    note: "Hinglish video clip · Equity 5-check eligible",
    provenance: "Curated Demo · Mixed",
  },
  {
    id: "rakesh-bansal-sarveshwar-foods",
    influencer: "Rakesh Bansal",
    instrument: "Sarveshwar Foods",
    ticker: "SARVESHWAR",
    instrumentType: "EQUITY",
    mediaType: "Video",
    mediaPath: "/media/videos/Rakesh_Bansal__Sarveshwar_Foods__Registered.App.mp4",
    corpusTag: "Registered (Snapshot Pending)",
    note: "Hinglish video clip · Equity 5-check eligible",
    provenance: "Curated Demo · Mixed",
  },
  {
    id: "vivek-rana-wipro-limited",
    influencer: "Vivek Rana",
    instrument: "Wipro Limited",
    ticker: "WIPRO",
    instrumentType: "EQUITY",
    mediaType: "Video",
    mediaPath: "/media/videos/Vivek_Rana__Wipro_Limited__Not_Registered.App.mp4",
    corpusTag: "Not found (Snapshot Pending)",
    note: "Hinglish video clip · Large-cap equity contrast case",
    provenance: "Curated Demo · Mixed",
  },
];
