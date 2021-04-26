
export interface IContentRecordDAC {
  skappAction(action: skappActionType, appId:string,data:any): Promise<IDACResponse>;
  getPublishedApps(appIds: string[]): Promise<any[]>;
  getSkappsInfo(appIds: string[]): Promise<any[]>;
  getSkappStats(appId: string): Promise<any>;
  getSkappComments(appId: string): Promise<any>;
  getDeployedApps(appIds: string[]): Promise<any[]>;
}

export interface IContentInfo {
  skylink: string;    // skylink
  metadata: object;   // should be valid JSON
}

export enum skappActionType {
  'PUBLISH',
  'REPUBLISH',
  'DEPLOY',
  'REDEPLOY',
  'VIEWED',
  'ACCESSED',
  'FAVORITE',
  'UNFAVORITE',
  'LIKED',
  'UNLIKED',
  'ADD_COMMENT',
  'EDIT_COMMENT',
  'REMOVE_COMMENT'
  }

  export interface IApp
  {
  id: string;
  version : string;//"version": "1",
  prevSkylink:string ;//"prevSkylink":"",
  ts: string;
  }

  export interface IDeployedApp extends IApp{
    content: IAppContent;//"content": ,
  }
  export interface IPublishedApp extends IApp{
    content: IPublishAppContent;
  }

  export interface IPublishAppContent extends IAppContent
  {
    skappLogo:string;//"skappLogo": "[46 Character SKYLINK]",
    demoUrl:string;//"demoUrl": "[46 Character SKYLINK]",
    age:string;//"age": "[18+|general]",
    appUrl:string;//"appUrl": "skylink URL",
    category: string[],
    tags: string[],
    appStatus: string,
    appDescription: string,
    releaseNotes: string,
    supportDetails: string,
    connections: ISocialConnect
}
export interface ISocialConnect {
  twitter: string;
  email: string;
  discord: string;
  }
  export interface IAppContent{
    
    storageGateway:string;//"storageGateway": "skynetportalUrl",
    hns:string;//  "hns": "skyfeed",
    skylink:string ;//  "skylink": "skylink",
    defaultPath:string; //  "defaultPath": "index.html or EMPTY",
    portalMinVersion:string; //  "portalMinVersion": "1.5",
    sourceCode:string;//  "sourceCode": "git url",
    history: string[];//  "history": [ "list of skylinks"]
  }

export interface IAppInfo {
  skylink: string;    // skylink
  metadata: object;   // should be valid JSON
}
export interface IAppStats extends IApp
{
  content: IAppStatsContents;
}
export interface IAppStatsContents{
  favorite : number;
  viewed: number; // counter increments everytime card is clicked to view details
  liked : number;
  accessed : number; // counter increments everytime app URL is clicked 
}
export interface IAppComments extends IApp
{
  content: IAppCommentsContents
}
export interface IAppCommentsContents{
  comments : IComments[];
}
export interface IComments{
  timestamp: string;
  comment:string;
}

export interface IContentPersistence {
  timestamp: number;  // unix timestamp of recording
}

export interface INewContentPersistence extends IContentPersistence { }
export interface IInteractionPersistence extends IContentPersistence { }

export interface IIndex {
  version: number;

  currPageNumber: number;
  currPageNumEntries: number;

  pages: string[];
  pageSize: number;
}

export interface IPage<IEntry> {
  version: number;

  indexPath: string; // back reference to the index
  pagePath: string; // back reference to the path

  entries: IEntry[];
}

export interface IDictionary {
  [key:string]: boolean
}
export interface IDACResponse {
  submitted: boolean;
  error?: string;
}

export enum EntryType {
  'NEWCONTENT',
  'INTERACTIONS'
}

// NOTE: the values contained by this interface are 'static', meaning they won't
// change after the DAC has initialized. That is why they are uppercased,
// because desctructured they will look like regular constants.
//
// e.g. const { NC_INDEX_PATH } = this.paths;
export interface IFilePaths {
SKAPPS_DICT_PATH: string; //{skapp_name:true/false}
//JSON data: {"skapp.hns":{}, "skyfeed.hns":{}, "SkySpaces.hns": {}}

PUBLISHED_INDEX_PATH: string; //${DATA_DOMAIN}/${skapp}/published/index.json
///JSON Data: [appId1, AppId2....]
//PATH_Example: /skyapps.hns/skapp.hns/published/index.json, /skyapps.hns/anotherAppStore.hns/published/index.json..etc
PUBLISHED_APP_INFO_PATH: string;//${DATA_DOMAIN}/${skapp}/published/{appid}/appInfo.json
PUBLISHED_APP_COMMENT_PATH: string;//${DATA_DOMAIN}/${skapp}/published/{appid}/comments.json
PUBLISHED_APP_STATS_PATH: string;//${DATA_DOMAIN}/${skapp}/published/{appid}/stats.json

DEPLOYED_INDEX_PATH: string;//${DATA_DOMAIN}/${skapp}/deployed/index.json
//JSON Data: [appId1, AppId2....]
DEPLOYED_APP_INFO_PATH: string;//${DATA_DOMAIN}/${skapp}/deployed/{appid}/appInfo.json
}