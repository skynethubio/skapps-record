export interface IContentRecordDAC {
    skappAction(action: skappActionType, appId: string, data: any): Promise<IDACResponse>;
    getPublishedApps(appIds: string[]): Promise<any[]>;
    getSkappsInfo(appIds: string[]): Promise<any[]>;
    getSkappStats(appId: string): Promise<any>;
    getSkappComments(appId: string): Promise<any>;
    getDeployedApps(appIds: string[]): Promise<any[]>;
}
export interface IContentInfo {
    skylink: string;
    metadata: object;
}
export declare enum skappActionType {
    'PUBLISH' = 0,
    'REPUBLISH' = 1,
    'DEPLOY' = 2,
    'REDEPLOY' = 3,
    'VIEWED' = 4,
    'ACCESSED' = 5,
    'FAVORITE' = 6,
    'UNFAVORITE' = 7,
    'LIKED' = 8,
    'UNLIKED' = 9,
    'ADD_COMMENT' = 10,
    'EDIT_COMMENT' = 11,
    'REMOVE_COMMENT' = 12
}
export interface IApp {
    id: string;
    version: string;
    prevSkylink: string;
    ts: string;
}
export interface IDeployedApp extends IApp {
    content: IAppContent;
}
export interface IPublishedApp extends IApp {
    content: IPublishAppContent;
}
export interface IPublishAppContent extends IAppContent {
    skappLogo: string;
    demoUrl: string;
    age: string;
    appUrl: string;
    category: string[];
    tags: string[];
    appStatus: string;
    appDescription: string;
    releaseNotes: string;
    supportDetails: string;
    connections: ISocialConnect;
}
export interface ISocialConnect {
    twitter: string;
    email: string;
    discord: string;
}
export interface IAppContent {
    storageGateway: string;
    hns: string;
    skylink: string;
    defaultPath: string;
    portalMinVersion: string;
    sourceCode: string;
    history: string[];
}
export interface IAppInfo {
    skylink: string;
    metadata: object;
}
export interface IAppStats extends IApp {
    content: IAppStatsContents;
}
export interface IAppStatsContents {
    favorite: number;
    viewed: number;
    liked: number;
    accessed: number;
}
export interface IAppComments extends IApp {
    content: IAppCommentsContents;
}
export interface IAppCommentsContents {
    comments: IComments[];
}
export interface IComments {
    timestamp: string;
    comment: string;
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
    PUBLISHED_INDEX_PATH: string;
    PUBLISHED_APP_INFO_PATH: string;
    PUBLISHED_APP_COMMENT_PATH: string;
    PUBLISHED_APP_STATS_PATH: string;
    DEPLOYED_INDEX_PATH: string;
    DEPLOYED_APP_INFO_PATH: string;
}
