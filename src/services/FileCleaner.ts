import {Constant, Inject, OnInit, Service} from "@tsed/di";
import {FileRepo} from "../db/repo/FileRepo";
import {ScheduleService} from "./ScheduleService";
import {FileUploadModel} from "../model/db/FileUpload.model";
import fs from "fs";
import GlobalEnv from "../model/constants/GlobalEnv";
import {FileUploadService} from "./FileUploadService";

@Service()
export class FileCleaner implements OnInit {

    @Inject()
    private repo: FileRepo;

    private static readonly MIN_EXPIRATION = 30 * 24 * 60 * 60 * 1000;
    private static readonly MAX_EXPIRATION = 365 * 24 * 60 * 60 * 1000;

    @Inject()
    private scheduleService: ScheduleService;

    @Inject()
    private fileUploadService: FileUploadService;

    @Constant(GlobalEnv.FILE_SIZE_UPLOAD_LIMIT_MB)
    private readonly MAX_SIZE: string;

    private readonly basePath = `${__dirname}/../../files`;

    public async processFiles(): Promise<void> {
        const allFiles = await this.repo.getAllEntries();
        if (allFiles.length === 0) {
            return;
        }
        const isExpiredPArr = allFiles.map(file => this.isFileExpired(file));
        const isExpiredArr = await Promise.all(isExpiredPArr);
        const expiredFiles = allFiles.filter((_, index) => isExpiredArr[index]);
        const deletePArr = expiredFiles.map(file => this.fileUploadService.processDelete(file.token));
        await Promise.all(deletePArr);
    }

    private async isFileExpired(entry: FileUploadModel): Promise<boolean> {
        const fileSize = await this.getFileSize(`${this.basePath}/${entry.fileName}`);
        const maxLifespan: number = Math.floor((FileCleaner.MIN_EXPIRATION - FileCleaner.MAX_EXPIRATION) * Math.pow((fileSize / (Number.parseInt(this.MAX_SIZE) * 1048576) - 1), 3));
        const currentEpoch: number = Date.now();
        const maxExpiration: number = maxLifespan + entry.updatedAt.getTime();
        return currentEpoch > maxExpiration;
    }

    private async getFileSize(filename: string): Promise<number> {
        const info = await fs.promises.stat(filename);
        return info.size;
    }

    public $onInit(): void {
        this.scheduleService.scheduleJobInterval({
            days: 1,
            runImmediately: true
        }, this.processFiles, "removeExpiredFiles", this);
    }
}
