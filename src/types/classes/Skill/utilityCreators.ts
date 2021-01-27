import { Response } from "ask-sdk-model";
import { BuildErrorT, BuildRequestT, BuildResponseT } from "./reqResBuilders";

export type SkillRequestHandleCallbackT = (
  req: ReturnType<BuildRequestT>,
  res: ReturnType<BuildResponseT>
) => Response | Promise<Response>;

export type SkillErrorHandleCallbackT = (
  req: ReturnType<BuildRequestT>,
  res: ReturnType<BuildResponseT>,
  err: ReturnType<BuildErrorT>
) => Response | Promise<Response>;

export type SkillInterceptorCallbackT<
  T extends ReturnType<BuildResponseT> | Response
> = (req: ReturnType<BuildRequestT>, res: T) => void | Promise<void>;
