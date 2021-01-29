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
  onLaunch: (handleCallback: SkillRequestHandleCallbackT) => this;
  on: (intentName: string, handleCallback: SkillRequestHandleCallbackT) => this;
  onHelp: (handleCallback: SkillRequestHandleCallbackT) => this;
  onCancel: (handleCallback: SkillRequestHandleCallbackT) => this;
  onStop: (handleCallback: SkillRequestHandleCallbackT) => this;
  onCancelAndStop: (handleCallback: SkillRequestHandleCallbackT) => this;
  onFallback: (handleCallback: SkillRequestHandleCallbackT) => this;
  onSessionEnded: (handleCallback: SkillRequestHandleCallbackT) => this;
  onError: (
    errorName: string,
    handleCallback: SkillRequestHandleCallbackT
  ) => this;
  registerRequestInterceptor: (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT>>
  ) => this;
  registerResponseInterceptor: (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT> | Response>
  ) => this;
  build: () => LambdaHandler;
}

export default ISkill;
