import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { ClaimLedger, DemoCaseMeta, ParseResponse } from "../../types/api";

export type InputTabMode = "text" | "photo" | "video";

export interface InSessionAnalysisSummary {
  id: string;
  influencerName: string;
  instrumentName: string;
  ticker: string;
  tipDate: string;
  inputMode: InputTabMode;
  sebiStatus: string;
}

export interface PausePlanAnswers {
  maxLoss: string;
  exitPrice: string;
  disproofCriteria: string;
  completed: boolean;
}

export interface AutopsyState {
  activeStep: 1 | 2 | 3 | 4 | 5;
  inputMode: InputTabMode;
  uploadedFile: File | null;
  mediaPreviewUrl: string | null;
  rawText: string;
  influencerName: string;
  stockName: string;
  resolvedTicker: string;
  tipDate: string;
  selectedDemoCaseId: string | null;
  parseResult: ParseResponse | null;
  editedClaims: ClaimLedger | null;
  selectedMarkerDate: string | null;
  pausePlan: PausePlanAnswers;
  inSessionRuns: InSessionAnalysisSummary[];
}

const INITIAL_PAUSE_PLAN: PausePlanAnswers = {
  maxLoss: "",
  exitPrice: "",
  disproofCriteria: "",
  completed: false,
};

const INITIAL_STATE: AutopsyState = {
  activeStep: 1,
  inputMode: "text",
  uploadedFile: null,
  mediaPreviewUrl: null,
  rawText: "",
  influencerName: "",
  stockName: "",
  resolvedTicker: "",
  tipDate: "2026-11-10",
  selectedDemoCaseId: null,
  parseResult: null,
  editedClaims: null,
  selectedMarkerDate: null,
  pausePlan: INITIAL_PAUSE_PLAN,
  inSessionRuns: [],
};

type Action =
  | { type: "SET_STEP"; step: 1 | 2 | 3 | 4 | 5 }
  | { type: "SET_INPUT_MODE"; mode: InputTabMode }
  | { type: "SET_MEDIA"; file: File | null; previewUrl: string | null }
  | { type: "SET_TEXT"; text: string }
  | { type: "SET_INFLUENCER"; name: string }
  | { type: "SET_STOCK"; name: string; ticker?: string }
  | { type: "SET_TIP_DATE"; date: string }
  | { type: "LOAD_DEMO_CASE"; demo: DemoCaseMeta }
  | { type: "SET_PARSE_RESULT"; result: ParseResponse; resolvedTicker: string }
  | { type: "UPDATE_CLAIMS"; claims: ClaimLedger }
  | { type: "SET_MARKER_DATE"; date: string | null }
  | { type: "UPDATE_PAUSE_PLAN"; patch: Partial<PausePlanAnswers> }
  | { type: "RECORD_SESSION_RUN"; run: InSessionAnalysisSummary }
  | { type: "RESET" };

function reducer(state: AutopsyState, action: Action): AutopsyState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, activeStep: action.step };
    case "SET_INPUT_MODE":
      return { ...state, inputMode: action.mode };
    case "SET_MEDIA":
      return {
        ...state,
        uploadedFile: action.file,
        mediaPreviewUrl: action.previewUrl,
        selectedDemoCaseId: action.file ? null : state.selectedDemoCaseId,
      };
    case "SET_TEXT":
      return { ...state, rawText: action.text };
    case "SET_INFLUENCER":
      return { ...state, influencerName: action.name };
    case "SET_STOCK":
      return {
        ...state,
        stockName: action.name,
        resolvedTicker: action.ticker ?? state.resolvedTicker,
      };
    case "SET_TIP_DATE":
      return { ...state, tipDate: action.date };
    case "LOAD_DEMO_CASE":
      return {
        ...state,
        inputMode: action.demo.media_type === "PHOTO" ? "photo" : "video",
        uploadedFile: null,
        mediaPreviewUrl: action.demo.media_path,
        rawText: action.demo.sample_text,
        influencerName: action.demo.influencer_name,
        stockName: action.demo.instrument_name,
        resolvedTicker: action.demo.ticker,
        tipDate: action.demo.tip_date,
        selectedDemoCaseId: action.demo.id,
        parseResult: null,
        editedClaims: null,
        selectedMarkerDate: null,
        pausePlan: INITIAL_PAUSE_PLAN,
      };
    case "SET_PARSE_RESULT":
      return {
        ...state,
        parseResult: action.result,
        editedClaims: action.result.claims,
        resolvedTicker: action.resolvedTicker,
      };
    case "UPDATE_CLAIMS":
      return { ...state, editedClaims: action.claims };
    case "SET_MARKER_DATE":
      return { ...state, selectedMarkerDate: action.date };
    case "UPDATE_PAUSE_PLAN":
      return { ...state, pausePlan: { ...state.pausePlan, ...action.patch } };
    case "RECORD_SESSION_RUN": {
      const deduped = state.inSessionRuns.filter((r) => r.id !== action.run.id);
      return { ...state, inSessionRuns: [action.run, ...deduped].slice(0, 8) };
    }
    case "RESET":
      return {
        ...INITIAL_STATE,
        inSessionRuns: [],
      };
    default:
      return state;
  }
}

interface AutopsyContextValue {
  state: AutopsyState;
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  setInputMode: (mode: InputTabMode) => void;
  setUploadedFile: (file: File | null) => void;
  setRawText: (text: string) => void;
  setInfluencerName: (name: string) => void;
  setStockName: (name: string, ticker?: string) => void;
  setTipDate: (date: string) => void;
  loadDemoCase: (demo: DemoCaseMeta) => void;
  setParseResult: (result: ParseResponse, resolvedTicker: string) => void;
  updateClaims: (claims: ClaimLedger) => void;
  setSelectedMarkerDate: (date: string | null) => void;
  updatePausePlan: (patch: Partial<PausePlanAnswers>) => void;
  recordSessionRun: (run: InSessionAnalysisSummary) => void;
  resetSession: () => void;
}

const AutopsyContext = createContext<AutopsyContextValue | null>(null);

function revokeIfBlobUrl(url: string | null) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Strictly transient in-memory workflow context.
 * Never persists uploaded photos/videos, pasted tips, or Pause & Plan answers
 * to localStorage, sessionStorage, or IndexedDB.
 */
export function AutopsyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    const currentUrl = state.mediaPreviewUrl;
    return () => {
      revokeIfBlobUrl(currentUrl);
    };
  }, [state.mediaPreviewUrl]);

  const setUploadedFile = useCallback(
    (file: File | null) => {
      revokeIfBlobUrl(state.mediaPreviewUrl);
      const previewUrl = file ? URL.createObjectURL(file) : null;
      dispatch({ type: "SET_MEDIA", file, previewUrl });
    },
    [state.mediaPreviewUrl]
  );

  const loadDemoCase = useCallback(
    (demo: DemoCaseMeta) => {
      revokeIfBlobUrl(state.mediaPreviewUrl);
      dispatch({ type: "LOAD_DEMO_CASE", demo });
    },
    [state.mediaPreviewUrl]
  );

  const resetSession = useCallback(() => {
    revokeIfBlobUrl(state.mediaPreviewUrl);
    dispatch({ type: "RESET" });
  }, [state.mediaPreviewUrl]);

  return (
    <AutopsyContext.Provider
      value={{
        state,
        setStep: (step) => dispatch({ type: "SET_STEP", step }),
        setInputMode: (mode) => dispatch({ type: "SET_INPUT_MODE", mode }),
        setUploadedFile,
        setRawText: (text) => dispatch({ type: "SET_TEXT", text }),
        setInfluencerName: (name) => dispatch({ type: "SET_INFLUENCER", name }),
        setStockName: (name, ticker) => dispatch({ type: "SET_STOCK", name, ticker }),
        setTipDate: (date) => dispatch({ type: "SET_TIP_DATE", date }),
        loadDemoCase,
        setParseResult: (result, resolvedTicker) =>
          dispatch({ type: "SET_PARSE_RESULT", result, resolvedTicker }),
        updateClaims: (claims) => dispatch({ type: "UPDATE_CLAIMS", claims }),
        setSelectedMarkerDate: (date) => dispatch({ type: "SET_MARKER_DATE", date }),
        updatePausePlan: (patch) => dispatch({ type: "UPDATE_PAUSE_PLAN", patch }),
        recordSessionRun: (run) => dispatch({ type: "RECORD_SESSION_RUN", run }),
        resetSession,
      }}
    >
      {children}
    </AutopsyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAutopsy(): AutopsyContextValue {
  const ctx = useContext(AutopsyContext);
  if (!ctx) {
    throw new Error("useAutopsy must be used within an AutopsyProvider");
  }
  return ctx;
}
