import {
  ErrorHandler,
  HandlerInput,
  RequestHandler,
  ResponseBuilder,
} from "ask-sdk-core";

export type SkillDefaultHandlersT = {
  launchRequest: RequestHandler;
  helpIntent: RequestHandler;
  cancelIntent: RequestHandler;
  stopIntent: RequestHandler;
  cancelAndStopIntent: RequestHandler;
  sessionEndedRequest: RequestHandler;
};

export type SkillCustomHandlerT = {
  intentName: string;
  callback: RequestHandler;
};

export type SkillErrorHandlerT = {
  errorName: string | null;
  callback: ErrorHandler;
};

export type SkillRequestHandleCallbackT = (
  req: HandlerInput,
  res: ResponseBuilder
) => any;

export type SkillErrorHandleCallbackT = (
  req: HandlerInput,
  res: ResponseBuilder,
  err: Error
) => any;
