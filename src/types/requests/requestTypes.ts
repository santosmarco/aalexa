/* AMAZON DEFAULTS */
export type LaunchRequestT = "LaunchRequest";
export type IntentRequestT = "IntentRequest";
export type SessionEndedRequestT = "SessionEndedRequest";
export type CanFulfillIntentRequestT = "CanFulfillIntentRequest";

/* LIB */
export type ErrorRequestT = "ErrorRequest";

export type RequestT =
  | LaunchRequestT
  | IntentRequestT
  | SessionEndedRequestT
  | CanFulfillIntentRequestT
  | ErrorRequestT;
