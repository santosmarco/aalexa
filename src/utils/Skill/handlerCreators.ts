import { ErrorHandler, HandlerInput, RequestHandler } from "ask-sdk-core";
import {
  SkillErrorHandleCallbackT,
  SkillRequestHandleCallbackT,
  SkillRequestHandleOptionsT,
} from "../../types";
import { checkIntentName } from "../validators/intentValidators";
import { buildError, buildRequest, buildResponse } from "./reqResBuilders";

export const createRequestHandler = (
  canHandleVerifier: (handleInput: HandlerInput, error?: Error) => boolean,
  handleCallback: SkillRequestHandleCallbackT
): RequestHandler => ({
  canHandle: (handlerInput) => canHandleVerifier(handlerInput),
  handle: (handlerInput) => {
    const req = buildRequest(handlerInput);
    const res = buildResponse(handlerInput);
    return handleCallback(req, res);
  },
});

export const createEmptyRequestHandler = () =>
  createRequestHandler(
    () => true,
    (_, res) => res.getResponse()
  );

export const createCustomIntentHandler = (
  intentName: string,
  handleCallback: SkillRequestHandleCallbackT,
  handleOptions?: SkillRequestHandleOptionsT
) =>
  createRequestHandler(
    (handlerInput) =>
      checkIntentName(handlerInput, intentName) &&
      (handleOptions
        ? handleOptions.canHandle
          ? handleOptions.canHandle(handlerInput)
          : true
        : true),
    handleCallback
  );

export const createErrorHandler = (
  errorName: string,
  handleCallback: SkillErrorHandleCallbackT
): ErrorHandler => ({
  canHandle: (_, err) => (errorName ? err!.name === errorName : true),
  handle: (handlerInput, error) => {
    const req = buildRequest(handlerInput);
    const res = buildResponse(handlerInput);
    const err = buildError(error);
    return handleCallback(req, res, err);
  },
});
