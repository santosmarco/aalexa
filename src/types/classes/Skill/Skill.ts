import {
  ErrorHandler,
  LambdaHandler,
  RequestHandler,
  RequestInterceptor,
  ResponseInterceptor,
} from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import { BuildResponseT } from "./reqResBuilders";
import {
  SkillInterceptorCallbackT,
  SkillRequestHandleCallbackT,
} from "./utilityCreators";

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

interface ISkill {
  onLaunch: (callback: SkillRequestHandleCallbackT) => this;
  on: (intentName: string, callback: SkillRequestHandleCallbackT) => this;
  onHelp: (callback: SkillRequestHandleCallbackT) => this;
  onCancel: (callback: SkillRequestHandleCallbackT) => this;
  onStop: (callback: SkillRequestHandleCallbackT) => this;
  onCancelAndStop: (callback: SkillRequestHandleCallbackT) => this;
  onFallback: (callback: SkillRequestHandleCallbackT) => this;
  onSessionEnded: (callback: SkillRequestHandleCallbackT) => this;
  onError: (errorName: string, callback: SkillRequestHandleCallbackT) => this;
  registerRequestInterceptor: (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT>>
  ) => this;
  registerResponseInterceptor: (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT> | Response>
  ) => this;
  build: () => LambdaHandler;
}

export default ISkill;
