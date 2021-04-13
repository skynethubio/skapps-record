export interface IContentRecordDAC {
    recordNewContent(content: IContentInfo): Promise<IDACResponse>;
    recordInteraction(content: IContentInfo): Promise<IDACResponse>;
}
export interface IContentInfo {
    skylink: string;
    metadata: object;
}
export interface IContentPersistence {
    timestamp: number;
}
export interface INewContentPersistence extends IContentPersistence {
}
export interface IInteractionPersistence extends IContentPersistence {
}
export interface IIndex {
    version: number;
    currPageNumber: number;
    currPageNumEntries: number;
    pages: string[];
    pageSize: number;
}
export interface IPage<IEntry> {
    version: number;
    indexPath: string;
    pagePath: string;
    entries: IEntry[];
}
export interface IDictionary {
    [key: string]: boolean;
}
export interface IDACResponse {
    submitted: boolean;
    error?: string;
}
export declare enum EntryType {
    'NEWCONTENT' = 0,
    'INTERACTIONS' = 1
}
export interface IFilePaths {
    SKAPPS_DICT_PATH: string;
    NC_INDEX_PATH: string;
    NC_PAGE_PATH: string;
    CI_INDEX_PATH: string;
    CI_PAGE_PATH: string;
}
