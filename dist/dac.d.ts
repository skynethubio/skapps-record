import { Connection } from "post-me";
import { skappActionType, IDACResponse, IContentRecordDAC } from "./types";
export default class ContentRecordDAC implements IContentRecordDAC {
    protected connection: Promise<Connection>;
    private client;
    private mySky;
    private paths;
    private skapp;
    private skappDict;
    constructor();
    skappAction(action: skappActionType, appId: string, data: any): Promise<IDACResponse>;
    private updatePublisedIndex;
    private updateDeployedIndex;
    init(): Promise<void>;
    private getPublishedAppInfo;
    private getPublishedAppStats;
    private setPublishedAppStats;
    private getPublishedAppComments;
    private setPublishedAppComments;
    private setPublishedAppInfo;
    private getDeployedAppInfo;
    private setDeployedAppInfo;
    onUserLogin(): Promise<void>;
    private registerSkappName;
    private downloadFile;
    private updateFile;
    private toPersistence;
    private log;
}
