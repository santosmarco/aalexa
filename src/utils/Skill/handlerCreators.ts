import {
  ErrorHandler,
  HandlerInput,
  RequestHandler,
  ResponseBuilder,
} from "ask-sdk-core";
import {
  SkillErrorHandleCallbackT,
  SkillRequestHandleCallbackT,
} from "../../types/classes/Skill";
import { checkIntentName } from "../validators/intentValidators";

const buildRequest = (handlerInput: HandlerInput): HandlerInput => handlerInput;

const buildResponse = (handlerInput: HandlerInput): ResponseBuilder =>
  handlerInput.responseBuilder;

export const createRequestHandler = (
  canHandleVerifier: (handleInput: HandlerInput, error?: Error) => boolean,
  handleCallback: SkillRequestHandleCallbackT
): RequestHandler => ({
  canHandle: (handlerInput) => canHandleVerifier(handlerInput),
  handle: (handlerInput) => {
    const req = buildRequest(handlerInput);
    const res = buildResponse(handlerInput);
    handleCallback(req, res);
    return res.getResponse();
  },
});

export const createEmptyRequestHandler = () =>
  createRequestHandler(
    () => true,
    () => {}
  );

export const createCustomIntentHandler = (
  intentName: string,
  handleCallback: SkillRequestHandleCallbackT
) =>
  createRequestHandler(
    (handlerInput) => checkIntentName(handlerInput, intentName),
    handleCallback
  );

export const createErrorHandler = (
  errorName: string | null,
  handleCallback: SkillErrorHandleCallbackT
): ErrorHandler => ({
  canHandle: (_, err) => (errorName ? err!.name === errorName : true),
  handle: (handlerInput, err) => {
    const req = buildRequest(handlerInput);
    const res = buildResponse(handlerInput);
    handleCallback(req, res, err);
    return res.getResponse();
  },
});
