import {
  CancelAndStopIntentT,
  CancelIntentT,
  FallbackIntentT,
  HelpIntentT,
  StopIntentT,
} from "../../types/intents/standard";

/* AMAZON DEFAULTS */
export const CANCEL_INTENT: CancelIntentT = "AMAZON.CancelIntent";
export const FALLBACK_INTENT: FallbackIntentT = "AMAZON.FallbackIntent";
export const HELP_INTENT: HelpIntentT = "AMAZON.HelpIntent";
export const STOP_INTENT: StopIntentT = "AMAZON.StopIntent";

/* LIB */
export const CANCEL_AND_STOP_INTENT: CancelAndStopIntentT =
  "LIB.CancelAndStopIntent";
