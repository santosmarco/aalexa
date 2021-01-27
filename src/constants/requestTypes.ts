import {
  CanFulfillIntentRequestT,
  ErrorRequestT,
  IntentRequestT,
  LaunchRequestT,
  SessionEndedRequestT,
} from "../types/requests/requestTypes";

/* AMAZON DEFAULTS */
export const LAUNCH_REQUEST: LaunchRequestT = "LaunchRequest";
export const INTENT_REQUEST: IntentRequestT = "IntentRequest";
export const SESSION_ENDED_REQUEST: SessionEndedRequestT =
  "SessionEndedRequest";
export const CAN_FULFILL_INTENT_REQUEST: CanFulfillIntentRequestT =
  "CanFulfillIntentRequest";

/* LIB */
export const ERROR_REQUEST: ErrorRequestT = "ErrorRequest";
