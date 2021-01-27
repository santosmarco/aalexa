import { RequestHandler, SkillBuilders } from "ask-sdk-core";
import {
  SkillCustomHandlerT,
  SkillDefaultHandlersT,
  SkillErrorHandleCallbackT,
  SkillErrorHandlerT,
  SkillRequestHandleCallbackT,
} from "../types/classes/Skill";
import {
  createCustomIntentHandler,
  createEmptyRequestHandler,
  createErrorHandler,
  createRequestHandler,
  isCancelAndStopIntent,
  isCancelIntent,
  isHelpIntent,
  isLaunchRequest,
  isSessionEndedRequest,
  isStopIntent,
} from "../utils";

class Skill {
  protected defaultHandlers: SkillDefaultHandlersT = {
    launchRequest: createEmptyRequestHandler(),
    helpIntent: createEmptyRequestHandler(),
    cancelIntent: createEmptyRequestHandler(),
    stopIntent: createEmptyRequestHandler(),
    cancelAndStopIntent: createEmptyRequestHandler(),
    sessionEndedRequest: createEmptyRequestHandler(),
  };
  protected customHandlers: SkillCustomHandlerT[] = [];
  protected errorHandlers: SkillErrorHandlerT[] = [];

  protected updateDefaultHandler = (
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

  onLaunch = (handleCallback: SkillRequestHandleCallbackT) =>
    this.updateDefaultHandler(
      "launchRequest",
      createRequestHandler(isLaunchRequest, handleCallback)
    );

  onHelp = (handleCallback: SkillRequestHandleCallbackT) =>
    this.updateDefaultHandler(
      "helpIntent",
      createRequestHandler(isHelpIntent, handleCallback)
    );

  onCancel = (handleCallback: SkillRequestHandleCallbackT) =>
    this.updateDefaultHandler(
      "cancelIntent",
      createRequestHandler(isCancelIntent, handleCallback)
    );

  onStop = (handleCallback: SkillRequestHandleCallbackT) =>
    this.updateDefaultHandler(
      "stopIntent",
      createRequestHandler(isStopIntent, handleCallback)
    );

  onCancelAndStop = (handleCallback: SkillRequestHandleCallbackT) =>
    this.updateDefaultHandler(
      "cancelAndStopIntent",
      createRequestHandler(isCancelAndStopIntent, handleCallback)
    );

  onSessionEnded = (handleCallback: SkillRequestHandleCallbackT) =>
    this.updateDefaultHandler(
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

  onError = (
    errorName: string | null,
    handleCallback: SkillErrorHandleCallbackT
  ) =>
    this.addErrorHandler({
      errorName,
      callback: createErrorHandler(errorName, handleCallback),
    });

  build = () => {
    const build = SkillBuilders.custom()
      .addRequestHandlers(
        ...[
          this.defaultHandlers.launchRequest,
          ...this.customHandlers.map((handler) => handler.callback),
          this.defaultHandlers.helpIntent,
          this.defaultHandlers.cancelIntent,
          this.defaultHandlers.stopIntent,
          this.defaultHandlers.cancelAndStopIntent,
          this.defaultHandlers.sessionEndedRequest,
        ]
      )
      .addErrorHandlers(
        ...this.errorHandlers.map((handler) => handler.callback)
      );

    return build.lambda();
  };
}

export default Skill;
