import {
  HandlerInput,
  RequestInterceptor,
  ResponseInterceptor,
} from "ask-sdk-core";
import { Response } from "ask-sdk-model";
import { BuildResponseT, SkillInterceptorCallbackT } from "../../types";
import { buildRequest, buildResponse } from "./reqResBuilders";

export const createRequestInterceptor = (
  callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT>>
): RequestInterceptor => ({
  process: (handlerInput: HandlerInput) => {
    const req = buildRequest(handlerInput);
    const res = buildResponse(handlerInput);
    return callback(req, res);
  },
});

export const createResponseInterceptor = (
  callback: SkillInterceptorCallbackT<ReturnType<BuildResponseT> | Response>
): ResponseInterceptor => ({
  process: (handlerInput: HandlerInput, output?: Response) => {
    const req = buildRequest(handlerInput);
    const res = output ? output : buildResponse(handlerInput);
    return callback(req, res);
  },
});
