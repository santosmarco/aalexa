/* AMAZON DEFAULTS */
export type CancelIntentT = "AMAZON.CancelIntent";
export type FallbackIntentT = "AMAZON.FallbackIntent";
export type HelpIntentT = "AMAZON.HelpIntent";
export type StopIntentT = "AMAZON.StopIntent";

/* LIB */
export type CancelAndStopIntentT = "LIB.CancelAndStopIntent";

export type IntentT =
  | CancelIntentT
  | FallbackIntentT
  | HelpIntentT
  | StopIntentT
  | CancelAndStopIntentT;
