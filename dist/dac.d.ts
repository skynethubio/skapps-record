import { Connection } from "post-me";
import { IContentInfo, IDACResponse, IContentRecordDAC } from "./types";
export default class ContentRecordDAC implements IContentRecordDAC {
    protected connection: Promise<Connection>;
    private client;
    private mySky;
    private paths;
    private skapp;
    constructor();
    init(): Promise<void>;
    onUserLogin(): Promise<void>;
    recordNewContent(...data: IContentInfo[]): Promise<IDACResponse>;
    recordInteraction(...data: IContentInfo[]): Promise<IDACResponse>;
    private registerSkappName;
    private handleNewEntries;
    private updateIndex;
    private fetchIndex;
    private fetchPage;
    private downloadFile;
    private updateFile;
    private ensureFileHierarchy;
    private toPersistence;
    private log;
}
