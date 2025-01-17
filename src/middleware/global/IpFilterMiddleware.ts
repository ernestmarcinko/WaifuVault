import {Middleware, type MiddlewareMethods} from "@tsed/platform-middlewares";
import {Req} from "@tsed/common";
import {Inject} from "@tsed/di";
import {IpBlackListRepo} from "../../db/repo/IpBlackListRepo.js";
import {Forbidden} from "@tsed/exceptions";
import {NetworkUtils} from "../../utils/Utils.js";

@Middleware()
export class IpFilterMiddleware implements MiddlewareMethods {

    @Inject()
    private ipRepo: IpBlackListRepo;

    public async use(@Req() req: Req): Promise<void> {
        const ip = NetworkUtils.getIp(req);
        const isBlocked = await this.ipRepo.isIpBlocked(ip);
        if (isBlocked) {
            throw new Forbidden("Your IP has been blocked");
        }
    }

}
