import Alexa, { HandlerInput } from "ask-sdk-core";
import * as INTENT_NAMES from "../../constants/intentNames";
import { isIntentRequest } from "./requestValidators";

export const checkIntentName = (
  handlerInput: HandlerInput,
  intentName: string
) => Alexa.getIntentName(handlerInput.requestEnvelope) === intentName;

export const isHelpIntent = (handlerInput: HandlerInput) =>
  isIntentRequest(handlerInput) &&
  checkIntentName(handlerInput, INTENT_NAMES.HELP_INTENT);

export const isFallbackIntent = (handlerInput: HandlerInput) =>
  isIntentRequest(handlerInput) &&
  checkIntentName(handlerInput, INTENT_NAMES.FALLBACK_INTENT);

export const isCancelIntent = (handlerInput: HandlerInput) =>
  isIntentRequest(handlerInput) &&
  checkIntentName(handlerInput, INTENT_NAMES.CANCEL_INTENT);

export const isStopIntent = (handlerInput: HandlerInput) =>
  isIntentRequest(handlerInput) &&
  checkIntentName(handlerInput, INTENT_NAMES.STOP_INTENT);

export const isCancelAndStopIntent = (handlerInput: HandlerInput) =>
  isCancelIntent(handlerInput) && isStopIntent(handlerInput);
