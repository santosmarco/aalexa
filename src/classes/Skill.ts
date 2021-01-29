import { RequestHandler, SkillBuilders } from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import {
  CANCEL_AND_STOP_INTENT,
  CANCEL_INTENT,
  FALLBACK_INTENT,
  HELP_INTENT,
  STOP_INTENT,
} from "../constants/intentNames";
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
import ISkill from "../types/classes/Skill/Skill";
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

class Skill implements ISkill {
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

  /**
   * @description Register a handler for requests of type LaunchRequest. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-types-reference.html#launchrequest)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onLaunch = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "launchRequest",
      createRequestHandler(isLaunchRequest, handleCallback)
    );

  /**
   * @description Register a handler for requests that match the given intent name.
   * @param {string} intentName The custom intent name, as defined in the Amazon Developer Console, that should trigger the handler function.
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  on = (intentName: string, handleCallback: SkillRequestHandleCallbackT) => {
    intentName = intentName.trim();
    switch (intentName) {
      case HELP_INTENT:
        return this.onHelp(handleCallback);
      case CANCEL_INTENT:
        return this.onCancel(handleCallback);
      case STOP_INTENT:
        return this.onStop(handleCallback);
      case CANCEL_AND_STOP_INTENT:
        return this.onCancelAndStop(handleCallback);
      case FALLBACK_INTENT:
        return this.onFallback(handleCallback);
      default:
        return this.addCustomHandler({
          intentName,
          callback: createCustomIntentHandler(intentName, handleCallback),
        });
    }
  };

  /**
   * @description Register a handler for requests that match the standard built-in intent AMAZON.HelpIntent. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/standard-built-in-intents.html)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onHelp = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "helpIntent",
      createRequestHandler(isHelpIntent, handleCallback)
    );

  /**
   * @description Register a handler for requests that match the standard built-in intent AMAZON.CancelIntent. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/standard-built-in-intents.html)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onCancel = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "cancelIntent",
      createRequestHandler(isCancelIntent, handleCallback)
    );

  /**
   * @description Register a handler for requests that match the standard built-in intent AMAZON.StopIntent. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/standard-built-in-intents.html)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onStop = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "stopIntent",
      createRequestHandler(isStopIntent, handleCallback)
    );

  /**
   * @description Register a handler for requests that match both the standard built-in intents AMAZON.CancelIntent and AMAZON.StopIntent. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/standard-built-in-intents.html)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onCancelAndStop = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "cancelAndStopIntent",
      createRequestHandler(isCancelAndStopIntent, handleCallback)
    );

  /**
   * @description Register a handler for requests that match the standard built-in intent AMAZON.FallbackIntent. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/standard-built-in-intents.html)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onFallback = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "fallbackIntent",
      createRequestHandler(isFallbackIntent, handleCallback)
    );

  /**
   * @description Register a handler for requests of type SessionEndedRequest. _(see: https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-types-reference.html#sessionendedrequest)_
   * @param {SkillRequestHandleCallbackT} handleCallback Function to be executed upon request handling.
   * @memberof Skill
   */
  onSessionEnded = (handleCallback: SkillRequestHandleCallbackT) =>
    this.overwriteDefaultHandler(
      "sessionEndedRequest",
      createRequestHandler(isSessionEndedRequest, handleCallback)
    );

  /**
   * @description Register a handler for responding to a known, named error.
   * @param {string} errorName The name of the error that should trigger the handler function.
   * @param {SkillErrorHandleCallbackT} handleCallback Function to be executed upon error handling.
   * @memberof Skill
   */
  onError = (errorName: string, handleCallback: SkillErrorHandleCallbackT) =>
    this.addErrorHandler({
      errorName: errorName.trim(),
      callback: createErrorHandler(errorName, handleCallback),
    });

  /**
   * @description Register a callback to be executed before every request handling. _(see: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/handle-requests.html#request-and-response-interceptors)_
   * @param {SkillInterceptorCallbackT<ReturnType<BuildResponseT>>} callback Function to be executed before request handlings.
   * @memberof Skill
   */
  registerRequestInterceptor = (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT>>
  ) => this.addRequestInterceptor(createRequestInterceptor(callback));

  /**
   * @description Register a callback to be executed after every request handling. _(see: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/handle-requests.html#request-and-response-interceptors)_
   * @param {(SkillInterceptorCallbackT<ReturnType<BuildResponseT> | Response>)} callback Function to be executed after request handlings.
   * @memberof Skill
   */
  registerResponseInterceptor = (
    callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT> | Response>
  ) => this.addResponseInterceptor(createResponseInterceptor(callback));

  /**
   * @description Bundle all registered handlers together and prepare the skill to be exported.
   * @memberof Skill
   */
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
