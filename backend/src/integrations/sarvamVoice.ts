import { AppError } from "../core/errors.js";
import { logWarn } from "../core/logger.js";
import { withBoundedTimeout } from "../core/snapshotCache.js";
import { scanSystemAuthoredText } from "../domain/output-guard/guard.js";

export type SupportedVoiceLanguage = "en-IN" | "hi-IN" | "kn-IN";

export interface VoiceReadoutResult {
  status: "READY" | "DISABLED" | "UNAVAILABLE";
  language: SupportedVoiceLanguage;
  audio_base64: string | null;
  mime_type: string | null;
  guard_verified: true;
  message: string;
}

const MAX_VOICE_CHARS = 500;
const VOICE_TIMEOUT_MS = 8_000;

/**
 * Optional Sarvam Voice TTS adapter (Task 3.3).
 * Safety invariants:
 * 1. Re-scans text with the mandatory Output Guard before any external call.
 * 2. Never invents new facts or advice; reads only already-guarded facts-card text.
 * 3. Disabled or failed provider never blocks the core text experience.
 */
export async function synthesizeGuardedVoiceReadout(params: {
  guardedText: string;
  language: SupportedVoiceLanguage;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<VoiceReadoutResult> {
  const trimmed = params.guardedText.trim().slice(0, MAX_VOICE_CHARS);
  if (!trimmed) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Guarded summary text is required for voice readout.",
      statusCode: 400,
      retryable: false,
    });
  }

  // Defense-in-depth: re-verify text through Output Guard so voice can never emit advice
  const scan = scanSystemAuthoredText(trimmed);
  if (!scan.passed) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message:
        "Voice readout blocked by Output Guard: only guarded, non-advisory evidence text may be synthesized.",
      statusCode: 422,
      retryable: false,
    });
  }

  if (!params.apiKey) {
    return {
      status: "DISABLED",
      language: params.language,
      audio_base64: null,
      mime_type: null,
      guard_verified: true,
      message:
        "Voice readout is currently disabled (SARVAM_API_KEY not configured). Use the guarded text facts card above.",
    };
  }

  const doFetch = params.fetchImpl ?? fetch;

  try {
    const response = await withBoundedTimeout(
      doFetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": params.apiKey,
        },
        body: JSON.stringify({
          inputs: [trimmed],
          target_language_code: params.language,
          speaker: "meera",
          model: "bulbul:v1",
          enable_preprocessing: true,
        }),
      }),
      VOICE_TIMEOUT_MS,
      "sarvam_tts"
    );

    if (!response.ok) {
      logWarn("voice.provider_http_error", {
        status_code: response.status,
        language: params.language,
      });
      return {
        status: "UNAVAILABLE",
        language: params.language,
        audio_base64: null,
        mime_type: null,
        guard_verified: true,
        message:
          "Voice provider returned an error. The guarded text facts card remains available.",
      };
    }

    const payload = (await response.json()) as { audios?: string[] };
    const firstAudio = payload.audios?.[0];
    if (!firstAudio) {
      return {
        status: "UNAVAILABLE",
        language: params.language,
        audio_base64: null,
        mime_type: null,
        guard_verified: true,
        message: "Voice provider returned an empty audio stream. Use the text facts card.",
      };
    }

    return {
      status: "READY",
      language: params.language,
      audio_base64: firstAudio,
      mime_type: "audio/wav",
      guard_verified: true,
      message: `Guarded voice summary generated in ${params.language}.`,
    };
  } catch {
    logWarn("voice.provider_unavailable", { language: params.language });
    return {
      status: "UNAVAILABLE",
      language: params.language,
      audio_base64: null,
      mime_type: null,
      guard_verified: true,
      message:
        "Voice provider timed out or was unreachable. Core text analysis is unaffected.",
    };
  }
}
