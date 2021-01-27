import { RequestHandler, SkillBuilders } from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import {
  BuildResponseT,
  SkillCustomHandlerT,
  SkillDefaultHandlersT,
  SkillErrorHandleCallbackT,
  SkillErrorHandlerT,
  SkillInterceptorCallbackT,
  SkillRequestHandleCallbackT,
  SkillRequestInterceptorT,
  SkillResponseInterceptorT,
} from "../types";
import {
  createCustomIntentHandler,
  createEmptyRequestHandler,
  createErrorHandler,
  createRequestHandler,
  isCancelAndStopIntent,
  isCancelIntent,
  isFallbackIntent,
  isHelpIntent,
  isLaunchRequest,
  isSessionEndedRequest,
  isStopIntent,
} from "../utils";
import {
  createRequestInterceptor,
  createResponseInterceptor,
} from "../utils/Skill";

class Skill {
  protected defaultHandlers: SkillDefaultHandlersT = {
    launchRequest: createEmptyRequestHandler(),
    helpIntent: createEmptyRequestHandler(),
    cancelIntent: createEmptyRequestHandler(),
    stopIntent: createEmptyRequestHandler(),
    cancelAndStopIntent: createEmptyRequestHandler(),
    fallbackIntent: createEmptyRequestHandler(),
    sessionEndedRequest: createEmptyRequestHandler(),
  };
  protected customHandlers: SkillCustomHandlerT[] = [];
  protected errorHandlers: SkillErrorHandlerT[] = [];
  protected requestInterceptors: SkillRequestInterceptorT[] = [];
  protected responseInterceptors: SkillResponseInterceptorT[] = [];

  constructor(readonly skillId?: string) {}

  protected overwriteDefaultHandler = (
    handlerKey: keyof SkillDefaultHandlersT,
    newHandler: RequestHandler
  ) => {
    this.defaultHandlers[handlerKey] = newHandler;
    return this;
  };

  protected addCustomHandler = (handlerConfig: SkillCustomHandlerT) => {
    this.customHandlers.push(handlerConfig);
    return this;
  };

  protected addErrorHandler = (handlerConfig: SkillErrorHandlerT) => {
    this.errorHandlers.push(handlerConfig);
    return this;
  };

  protected addRequestInterceptor = (interceptor: SkillRequestInterceptorT) => {
    this.requestInterceptors.push(interceptor);
    return this;
  };

  protected addResponseInterceptor = (
    interceptor: SkillResponseInterceptorT
  ) => {
    this.responseInterceptors.push(interceptor);
    return this;
  };

  onLaunch = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "launchRequest",
      createRequestHandler(isLaunchRequest, handleCallback)
    );

  onHelp = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "helpIntent",
      createRequestHandler(isHelpIntent, handleCallback)
    );

  onCancel = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "cancelIntent",
      createRequestHandler(isCancelIntent, handleCallback)
    );

  onStop = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "stopIntent",
      createRequestHandler(isStopIntent, handleCallback)
    );

  onCancelAndStop = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "cancelAndStopIntent",
      createRequestHandler(isCancelAndStopIntent, handleCallback)
    );

  onFallback = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "fallbackIntent",
      createRequestHandler(isFallbackIntent, handleCallback)
    );

  onSessionEnded = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "sessionEndedRequest",
      createRequestHandler(isSessionEndedRequest, handleCallback)
    );

  onCustomIntent = (
    intentName: string,
    handleCallback: SkillRequestHandleCallbackT
  ) =>
    this.addCustomHandler({
      intentName,
      callback: createCustomIntentHandler(intentName, handleCallback),
    });

  onError = (errorName: string, handleCallback: SkillErrorHandleCallbackT) =>
    this.addErrorHandler({
      errorName,
      callback: createErrorHandler(errorName, handleCallback),
    });

  registerRequestInterceptor = (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT>>
  ) => this.addRequestInterceptor(createRequestInterceptor(callback));

  registerResponseInterceptor = (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT> | Response>
  ) => this.addResponseInterceptor(createResponseInterceptor(callback));

  build = () => {
    const build = SkillBuilders.custom()
      .addRequestHandlers(
        ...[
          this.defaultHandlers.launchRequest,
          ...this.customHandlers.map((handler) => handler.callback),
          ...Object.values(this.defaultHandlers).slice(1),
        ]
      )
      .addRequestInterceptors(...this.requestInterceptors)
      .addResponseInterceptors(...this.responseInterceptors)
      .addErrorHandlers(
        ...this.errorHandlers.map((handler) => handler.callback)
      );

    if (this.skillId) {
      build.withSkillId(this.skillId);
    }

    return build.lambda();
  };
}

export default Skill;
