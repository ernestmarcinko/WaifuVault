import {Constant, Service} from "@tsed/di";
import GlobalEnv from "../model/constants/GlobalEnv";
import fetch from 'node-fetch';
import {BadRequest} from "@tsed/exceptions";
import path from "path";
import fs from "fs";

@Service()
export class FileUrlService {

    @Constant(GlobalEnv.FILE_SIZE_UPLOAD_LIMIT_MB)
    private readonly MAX_SIZE: string;

    private readonly basePath = `${__dirname}/../../customWads`;

    public async getFile(url: string): Promise<string> {
        const headCheck = await fetch(url, {
            method: "HEAD"
        });
        const contentLengthStr = headCheck.headers.get("content-length");
        if (!contentLengthStr) {
            throw new BadRequest("Unable to obtain content size for deleted file");
        }
        const contentLength = Number.parseInt(contentLengthStr);
        if (contentLength > Number.parseInt(this.MAX_SIZE)) {
            throw new BadRequest("file too big");
        }
        const response = await fetch(url, {
            method: "GET"
        });
        if (!response.ok) {
            throw new BadRequest(`Unable to get response ${response.statusText}`);
        }
        const fileName = `${Date.now()}${url.substring(url.lastIndexOf('/') + 1)}`;
        const destination = path.resolve(`${this.basePath}/${fileName}`);
        const fileStream = fs.createWriteStream(destination);
        return new Promise((resolve, reject) => {
            response.body.pipe(fileStream);
            response.body.on("error", reject);
            fileStream.on("finish", resolve);
        }).then(() => fileName);
    }
}