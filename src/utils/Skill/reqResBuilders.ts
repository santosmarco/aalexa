import { HandlerInput } from "ask-sdk-core";
import { BuildErrorT, BuildRequestT, BuildResponseT } from "../../types";

export const buildRequest: BuildRequestT = (handlerInput: HandlerInput) =>
  handlerInput;

export const buildResponse: BuildResponseT = (handlerInput: HandlerInput) =>
  handlerInput.responseBuilder;

export const buildError: BuildErrorT = (error: Error) => error;
