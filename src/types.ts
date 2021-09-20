export const VERSION = 1;

// NOTE: the values contained by this interface are 'static', meaning they won't
// change after the DAC has initialized. That is why they are uppercased,
// because desctructured they will look like regular constants.
//
// e.g. const { NC_INDEX_PATH } = this.paths;
export interface IFilePaths {

  // Deploy
  DD_DEPLOYED_APPS_INDEX_PATH: string; // IDeployedAppsDDIDX
  DD_DEPLOYED_APP_PATH: string; //IDeploymentRecord
  SD_DEPLOYED_APPS_INDEX_PATH: string; // IDeployedAppsSDIDX
  SD_DEPLOYED_APP_PATH: string; //IDeploymentRecord

  // Publish App
  DD_PUBLISHED_APPS_INDEX_PATH: string; // IPublishedAppsDDIDX
  DD_PUBLISHED_APP_PATH: string; //IPublishedAppRecord
  SD_PUBLISHED_APPS_INDEX_PATH: string; // IPublishedAppsSDIDX
  SD_PUBLISHED_APP_PATH: string; //IPublishedAppRecord

  // Publish App : User Action -> Stats
  DD_PUBLISHED_APPS_STATS_INDEX_PATH: string; // IPublishedAppsDDIDX
  DD_PUBLISHED_APP_STATS_PATH: string; //IPublishedAppRecord
  SD_PUBLISHED_APPS_STATS_INDEX_PATH: string; // IPublishedAppsSDIDX
  SD_PUBLISHED_APP_STATS_PATH: string; //IPublishedAppRecord

  // Publish App : User Action -> Comments
  // DD_PUBLISHED_APPS_COMMENTS_MASTER_PATH: string,// IPublishedAppsComments
  // SD_PUBLISHED_APP_COMMENTS_INDEX_PATH: string, // ISkappPublishedAppsCommentsIndex
  // SD_PUBLISHED_APP_COMMENTS_PATH: string, //ISkappPublishedAppsComments
}
export interface ISkappDAC {
  // Deploy App Functionality
  setDeployment(data: IDeploymentRecord): Promise<IDACResponse>;
  getDeployments(appIds?: string[]): Promise<any>; // If null/empty will return all deployments
  // No GET history method for deployment as It is suppose to be private to app developer.
  // Once hidden storage feature is released, I will add method here.

  // Publish App Functionality
  setPublishedApp(data: IPublishedAppRecord): Promise<IDACResponse>;
  getPublishedApps(appIds?: string[], userId?: string): Promise<any>;// If null/empty will return all apps
  getPublishedAppIds(userId?: string): Promise<any>;
  //getPublishedAppHistory(appId: string, userId?: string): Promise<any>;

  // Interactions / stats
  skappAction(action: skappActionType, appId: string, data: any): Promise<IDACResponse>;
  getStats(appIds?: string[], userId?: string): Promise<any>;
  
  // setPublishedAppComment(data: IPublishedAppCommentRecord): Promise<IDACResponse>;
  // getPublishedAppComments(appId: string, userId?: string): Promise<any>;
  // getSkappComments(appId: string): Promise<any>;
}

// ## Deployment Models 
export interface IDeployedAppsDDIDX {
  version: number,
  appsIndex: IKeyValueMap<IDeployedAppsDDIDXRecord> | null,
  timestamp: number
}
export interface IDeployedAppsDDIDXRecord {
  appId: string,
  ddCounter: number,
  latestDataLink: string,
  lastUpdatedBy: string,
  skapps: string[]
}
export interface IDeployedAppsSDIDX {
  version: number,
  appsIndex: IKeyValueMap<IDeployedAppsSDIDXRecord> | null,
  timestamp: number
}
export interface IDeployedAppsSDIDXRecord {
  appId: string,
  sdCounter: number,
  latestDataLink: string,
}
export interface IDeploymentRecord {
  version: number,
  $type: string,//skapp
  $subType: string,//deployment
  appId: string,
  content: IDeploymentContent,
  ddCounter?: number,//This value will be set by DAC
  timestamp: number, //This value will be set by DAC
}
export interface IDeploymentContent {
  appName: string,
  appLogo: IMedia[],
  domainNames?: string[],
  entryPath: string,
  entryLink: string,
  dataLink: string,
  skynetPortal: string,
  defaultPath: string,
  notes?: string, // to store git commit or other deployment related notes. 
}

export const DEFAULT_DD_DEPLOYED_APPS_INDEX: IDeployedAppsDDIDX = {
  version: VERSION,
  appsIndex: null, // list of AppIds
  timestamp: (new Date()).valueOf()
}

export const DEFAULT_SD_DEPLOYED_APPS_INDEX: IDeployedAppsSDIDX = {
  version: VERSION,
  appsIndex: null, // list of AppIds
  timestamp: (new Date()).valueOf()
}

// Published App Model
export interface IPublishedAppsDDIDX {
  version: number,
  appsIndex: IKeyValueMap<IPublishedAppsDDIDXRecord> | null,
  timestamp: number
}
export interface IPublishedAppsDDIDXRecord {
  appId: string,
  ddCounter: number,
  latestDataLink: string,
  lastUpdatedBy: string,
  skapps: string[]
}
export interface IPublishedAppsSDIDX {
  version: number,
  appsIndex: IKeyValueMap<IPublishedAppsSDIDXRecord> | null,
  timestamp: number
}
export interface IPublishedAppsSDIDXRecord {
  appId: string,
  sdCounter: number,
  latestDataLink: string,
}
export interface IPublishedAppRecord {
  version: number,
  $type: string,//skapp
  $subType: string,//publishedApp
  appId: string,
  content: IPublishedAppContent,
  ddCounter?: number,//This value will be set by DAC
  timestamp: number, //This value will be set by DAC
}
export interface IPublishedAppContent {
  appLogo: IMediaRecord[],
  appName: string,
  appUrl: string,// domain url (hne, ens..etc) or entryLinkUrl or dataLinkUrl 
  appVersion: string, // x.x.x
  appStatus: string, // Alpha, Beta , Live
  category: string,
  tags?: string[],
  gitUrl?: string,
  demoUrl?: string,//"demoUrl": "[46 Character SKYLINK]",
  age: string;//"age": "[18+|general]",
  previewMedia?: IMedia[],
  appDescription: string,
  releaseNotes?: string,
  connections?: IKeyValueMap<string>,
}

export const DEFAULT_DD_PUBLISHED_APPS_INDEX: IPublishedAppsDDIDX = {
  version: VERSION,
  appsIndex: null, // list of AppIds
  timestamp: (new Date()).valueOf()
}

export const DEFAULT_SD_PUBLISHED_APPS_INDEX: IPublishedAppsSDIDX = {
  version: VERSION,
  appsIndex: null, // list of AppIds
  timestamp: (new Date()).valueOf()
}
// Published App Stats Model
export interface IPublishedAppsStatsDDIDX {
  version: number,
  appsIndex: IKeyValueMap<IPublishedAppsStatsDDIDXRecord> | null,
  timestamp: number
}
export interface IPublishedAppsStatsDDIDXRecord {
  appId: string,
  ddCounter: number,
  publishedAppStatsRecord: IPublishedAppStatsRecord | null,
  //latestDataLink : string,
  lastUpdatedBy: string,
  skapps: string[]
}
export interface IPublishedAppsStatsSDIDX {
  version: number,
  appsIndex: IKeyValueMap<IPublishedAppsStatsSDIDXRecord> | null,
  timestamp: number
}
export interface IPublishedAppsStatsSDIDXRecord {
  appId: string,
  sdCounter: number,
  publishedAppStatsRecord: IPublishedAppStatsRecord |null,
  //latestDataLink : string,
}
export interface IPublishedAppStatsRecord {
  version: number,
  $type: string,//skapp
  $subType: string,//publishedApp
  appId: string|null,
  content: IPublishedAppStatsContent,
  ddCounter?: number,//This value will be set by DAC
  timestamp: number, //This value will be set by DAC
}
export interface IPublishedAppStatsContent {
  favorite: number,
  liked: number,
  viewed: number, // counter increments everytime card is clicked to view details
  accessed: number, // counter increments everytime app URL is clicked
}

export const DEFAULT_DD_PUBLISHED_APPS_STATS_INDEX: IPublishedAppsStatsDDIDX = {
  version: VERSION,
  appsIndex: null, // list of AppIds
  timestamp: (new Date()).valueOf()
}

export const DEFAULT_SD_PUBLISHED_APPS_STATS_INDEX: IPublishedAppsStatsSDIDX = {
  version: VERSION,
  appsIndex: null, // list of AppIds
  timestamp: (new Date()).valueOf()
}
export const DEFAULT_PUBLISHED_APPS_STATS_RECORD: IPublishedAppStatsRecord = {
  version: VERSION,
  $type: "skapp",
  $subType: "interactions",//publishedApp
  appId: null,
  content: {
    favorite: 0,
    liked: 0,
    viewed: 0,
    accessed: 0,
  },
  ddCounter: 0,//This value will be set by DAC
  timestamp: (new Date()).valueOf()
}
//common Models
export interface IKeyValueMap<T> {
  [key: string]: T,
}
export interface IMedia {
  thumbnail: IMediaRecord[],
  originalContent: IMediaRecord[]
}

export interface IMediaRecord { // Image or Video
  ext: string,
  w: number,
  h: number,
  url: string, //data link sia://
}

// Published App Stats Model
export interface IPublishedAppsStats {
  version: number,
  publishedAppsStatsMap: IKeyValueMap<IPublishedAppStats> | null,// appId : IPublishedAppStats
  timestamp: number,
}
export interface IPublishedAppStats {
  latestPublishedAppStatsRecord: IPublishedAppStatsRecord,
  lastUpdatedBy: string, // skapp name
  skapps: string[] | null,
}
export interface IPublishedAppStatsRecord {
  version: number,
  $type: string,//skapp
  $subType: string,//stats
  appId: string|null,
  content: IPublishedAppStatsContent,
  timestamp: number
}
export interface IPublishedAppStatsContent {
  favorite: number,
  viewed: number, // counter increments everytime card is clicked to view details
  liked: number,
  accessed: number, // counter increments everytime app URL is clicked
}
export interface ISkappPublishedAppsStats {
  version: number,
  publishedAppRecords: IPublishedAppStatsRecord[] | null, // list of deploymentRecords
  timestamp: number,
}
export interface ISkappPublishedAppsStatsIndex {
  version: number,
  publishedAppIds: string[] | null,// list of AppIds for which stats are available (User has performed stats action)
  timestamp: number,
}

export enum skappActionType {
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

// // Published App Comments Model
// export interface IPublishedAppComments {
//   version: number,
//   counter: number,
//   publishedAppCommentsMap: IKeyValueMap<IPublishedAppCommentRecord> | null, //commentId : IPublishedAppComment
//   skapps: string[] | null,
//   timestamp: number,
// }
// export interface IPublishedAppCommentRecord {
//   version: number,
//   $type: string,//skapp
//   $subType: string,//comments
//   appId: string,
//   content: IPublishedAppCommentContent,
//   timestamp: number
// }
// export interface IPublishedAppCommentContent {
//   commentId: string,
//   comment: string,
//   attachments?: IMedia[],
//   createdBy: string, // skapp name
// }
// export interface ISkappPublishedAppsCommentsIndex {
//   version: number,
//   publishedAppIds: string[] | null,// list of AppIds for which comments are available (User has performed post comments action)
//   timestamp: number,
// }
// export interface ISkappPublishedAppComments {
//   version: number,
//   publishedAppCommentRecords: IPublishedAppCommentRecord[] | null, // list of deploymentRecords
//   timestamp: number,
// }

// ##### Domain Model
export interface IDomainIndex {
  version: number;
  domains: Map<string, IDomain> | null; // { skyspace.hns : {Domain JSON}, skyfeed.hns : {Domain JSON} }
  lastUpdatedBy: string;
}
export interface IDomain {
  version: number; // 1 for now
  domainType: string;//HNS, ENS..etc
  domainName: string;// skyfeed, skyspaces...etc
  domainRecords: IDomainRecord[] | null; // TXT for now
  status: string; //active, inactive
  timestamp: number;
}
export interface IDomainRecord {
  recordType: string; // TXT for now
  recordValue: string; // sia:{skylinkv2}
}
export interface IDomainHistoryLog {
  version: number;
  historyRecord: IDomainHistoryRecord[];
}
export interface IDomainHistoryRecord {
  domainType: string;//HNS, ENS..etc
  domainName: string;// skyfeed, skyspaces...etc
  updatedBy: string; //Updated by skapp name
  timestamp: number;
}

// domain-dac/{skapp}.hns/domainName.domainType.json
export interface ISkappDomainIndex {
  version: number;
  domains: IDomain[];
  timestamp: number;
}
export interface IOptions {
  skapp?: string
}
// DEFAULT_USER_PROFILE defines all props as it is used in validator
export const DEFAULT_DOMAIN_INDEX: IDomainIndex = {
  version: VERSION,
  domains: null, // { skyspace.hns : {Domain JSON}, skyfeed.hns : {Domain JSON} }
  lastUpdatedBy: "",
}
export const DEFAULT_DOMAIN: IDomain = {
  version: VERSION,
  domainType: "HNS",//HNS, ENS..etc
  domainName: "",// skyfeed, skyspaces...etc
  domainRecords: [], // TXT for now
  status: "Active", //active, inactive
  timestamp: (new Date()).valueOf()
}
export const DEFAULT_DOMAIN_RECORD: IDomainRecord = {
  recordType: "TXT", // TXT for now
  recordValue: "", // sia:{skylinkv2}
  // dataLink: "" // SkylinkV1 of uploaded code/site
}
export interface IDomainHistoryLog {
  version: number;
  historyRecord: IDomainHistoryRecord[];
}
export interface IDomainHistoryRecord {
  domainType: string;//HNS, ENS..etc
  domainName: string;// skyfeed, skyspaces...etc
  dataLink: string; // skylinkV1 of uploaded data 
  updatedBy: string; //Updated by skapp name
  timestamp: number;
}
export interface IDACResponse {
  submitted: boolean;
  error?: string;
}
