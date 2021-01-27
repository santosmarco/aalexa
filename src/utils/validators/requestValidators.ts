import Alexa, { HandlerInput } from "ask-sdk-core";
import * as REQUEST_TYPES from "../../constants/requestTypes";

export const checkRequestType = (
  handlerInput: HandlerInput,
  requestType: string
) => Alexa.getRequestType(handlerInput.requestEnvelope) === requestType;

export const isLaunchRequest = (handlerInput: HandlerInput) =>
  checkRequestType(handlerInput, REQUEST_TYPES.LAUNCH_REQUEST);

export const isIntentRequest = (handlerInput: HandlerInput) =>
  checkRequestType(handlerInput, REQUEST_TYPES.INTENT_REQUEST);

export const isSessionEndedRequest = (handlerInput: HandlerInput) =>
  checkRequestType(handlerInput, REQUEST_TYPES.SESSION_ENDED_REQUEST);

export const isCanFulfillIntentRequest = (handlerInput: HandlerInput) =>
  checkRequestType(handlerInput, REQUEST_TYPES.CAN_FULFILL_INTENT_REQUEST);
