import { HandlerInput, ResponseBuilder } from "ask-sdk-core";

export type BuildRequestT = (handlerInput: HandlerInput) => HandlerInput;

export type BuildResponseT = (handlerInput: HandlerInput) => ResponseBuilder;

export type BuildErrorT = (err: Error) => Error;
