import {Controller, Inject} from "@tsed/di";
import {Post, Returns} from "@tsed/schema";
import {StatusCodes} from "http-status-codes";
import {FileUploadModelResponse} from "../../../model/rest/FileUploadModelResponse";
import {BadRequest, NotFound} from "@tsed/exceptions";
import {MultipartFile, PlatformMulterFile, Req} from "@tsed/common";
import {BodyParams} from "@tsed/platform-params";
import {FileEngine} from "../../../engine/FileEngine";
import {FileUploadService} from "../../../services/FileUploadService";

@Controller("/upload")
export class FileUploadController {

    @Inject()
    private fileEngine: FileEngine;

    @Inject()
    private fileUploadService: FileUploadService;

    @Post("/")
    @Returns(StatusCodes.CREATED, FileUploadModelResponse)
    @Returns(StatusCodes.NOT_FOUND, NotFound)
    @Returns(StatusCodes.BAD_REQUEST, BadRequest)
    public async addEntry(@Req() req: Req, @MultipartFile("file") file?: PlatformMulterFile, @BodyParams("url") url?: string): Promise<unknown> {
        if (file && url) {
            if (file) {
                await this.fileEngine.deleteFile(file);
            }
            throw new BadRequest("Unable to upload both a file and a url");
        }
        const ip = req.ip;
        return this.fileUploadService.processUpload(ip, file, url);
        // const foo = Builder(FileUploadModelResponse).url(`http://localhost:8081/f/${file?.filename}`).build();
    }
}