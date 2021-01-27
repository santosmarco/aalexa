import {
  ErrorHandler,
  RequestHandler,
  RequestInterceptor,
  ResponseInterceptor,
} from "ask-sdk-core";

export type SkillDefaultHandlerT = RequestHandler;

export type SkillCustomHandlerT = {
  intentName: string;
  callback: RequestHandler;
};

export type SkillErrorHandlerT = {
  errorName: string;
  callback: ErrorHandler;
};

export type SkillRequestInterceptorT = RequestInterceptor;

export type SkillResponseInterceptorT = ResponseInterceptor;

export type SkillDefaultHandlersT = {
  launchRequest: SkillDefaultHandlerT;
  helpIntent: SkillDefaultHandlerT;
  cancelIntent: SkillDefaultHandlerT;
  stopIntent: SkillDefaultHandlerT;
  cancelAndStopIntent: SkillDefaultHandlerT;
  fallbackIntent: SkillDefaultHandlerT;
  sessionEndedRequest: SkillDefaultHandlerT;
};
