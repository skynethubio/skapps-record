import { Buffer } from "buffer"
import { SkynetClient, MySky, JsonData, JSONResponse } from "skynet-js";
import { uint8ArrayToBase64RawUrl, base64RawUrlToUint8Array, trimSuffix, trimUriPrefix, uriSkynetPrefix } from "./util";
import { ChildHandshake, Connection, WindowMessenger } from "post-me";
import {
  ISkappDAC, IDACResponse, IFilePaths, skappActionType, IDeployedAppsDDIDX, DEFAULT_SD_DEPLOYED_APPS_INDEX,
  DEFAULT_DD_DEPLOYED_APPS_INDEX, IDeployedAppsSDIDX, IDeploymentRecord, IDeployedAppsDDIDXRecord, IDeployedAppsSDIDXRecord,
  IPublishedAppRecord, IPublishedAppsDDIDX, DEFAULT_DD_PUBLISHED_APPS_INDEX, DEFAULT_SD_PUBLISHED_APPS_INDEX, IPublishedAppsSDIDX,
  IPublishedAppsDDIDXRecord, IPublishedAppsSDIDXRecord, IPublishedAppsStatsDDIDX, IPublishedAppsStatsSDIDX, IPublishedAppsStatsDDIDXRecord,
  DEFAULT_PUBLISHED_APPS_STATS_RECORD, IPublishedAppStatsRecord, IPublishedAppsStatsSDIDXRecord
} from "./types";

// DAC consts
const DATA_DOMAIN = "skapp-dac.hns";
const DAC_VERSION = "0.1.6-beta";

//const urlParams = new URLSearchParams(window.location.search);
const DEBUG_ENABLED = true;
const DEV_ENABLED = false;
export default class SkappDAC implements ISkappDAC {
  protected connection: Promise<Connection>;

  private client: SkynetClient
  private mySky: MySky;
  private paths: IFilePaths;
  private skapp: string;
  private skappDict: any = {};

  // will be flipped to true if all files are created
  private fileHierarchyEnsured: boolean;

  public constructor(
  ) {
    // create client
    this.client = new SkynetClient();

    // define API
    const methods = {
      init: this.init.bind(this),
      onUserLogin: this.onUserLogin.bind(this),

      setDeployment: this.setDeployment.bind(this),
      getDeployments: this.getDeployments.bind(this),

      setPublishedApp: this.setPublishedApp.bind(this),
      getPublishedApps: this.getPublishedApps.bind(this),
      getPublishedAppIds: this.getPublishedAppIds.bind(this),

      skappAction: this.skappAction.bind(this),
      getStats: this.getStats.bind(this),

      //getSkappComments: this.getSkappComments.bind(this),

    };
    // create connection
    this.connection = ChildHandshake(
      new WindowMessenger({
        localWindow: window,
        remoteWindow: window.parent,
        remoteOrigin: "*",
      }),
      methods,
    );
  }

  public async init() {
    try {
      // extract the skappname and use it to set the filepaths
      const hostname = new URL(document.referrer).hostname
      const skapp = await this.client.extractDomain(hostname)
      this.log("loaded from skapp", skapp)
      this.skapp = skapp;

      this.paths = {
        // Deploy
        DD_DEPLOYED_APPS_INDEX_PATH: `${DATA_DOMAIN}/deployed/index.json`, // IDeployedAppsDDIDX
        DD_DEPLOYED_APP_PATH: `${DATA_DOMAIN}/deployed/$APP_ID/$LATEST/deploymentRecord.json`, //IDeploymentRecord
        SD_DEPLOYED_APPS_INDEX_PATH: `${DATA_DOMAIN}/${skapp}/deployed/index.json`, // IDeployedAppsSDIDX
        SD_DEPLOYED_APP_PATH: `${DATA_DOMAIN}/${skapp}/deployed/$APP_ID/$LATEST/deploymentRecord.json`, //IDeploymentRecord

        // Publish
        DD_PUBLISHED_APPS_INDEX_PATH: `${DATA_DOMAIN}/published/index.json`, // IPublishedAppsDDIDX
        DD_PUBLISHED_APP_PATH: `${DATA_DOMAIN}/published/$APP_ID/$LATEST/publishedAppRecord.json`, //IPublishedAppRecord
        SD_PUBLISHED_APPS_INDEX_PATH: `${DATA_DOMAIN}/${skapp}/published/index.json`,// IPublishedAppsSDIDX
        SD_PUBLISHED_APP_PATH: `${DATA_DOMAIN}/${skapp}/published/$APP_ID/$LATEST/publishedAppRecord.json`,//IPublishedAppRecord

        // User Interactions / stats
        DD_PUBLISHED_APPS_STATS_INDEX_PATH: `${DATA_DOMAIN}/published/stats/index.json`, // IPublishedAppsStatsDDIDX
        DD_PUBLISHED_APP_STATS_PATH: `${DATA_DOMAIN}/published/stats/$APP_ID/$LATEST/publishedAppStatsRecord.json`, //IPublishedAppStatsRecord
        SD_PUBLISHED_APPS_STATS_INDEX_PATH: `${DATA_DOMAIN}/${skapp}/published/stats/index.json`, // IPublishedAppsStatsSDIDX
        SD_PUBLISHED_APP_STATS_PATH: `${DATA_DOMAIN}/${skapp}/published/stats/$APP_ID/$LATEST/publishedAppStatsRecord.json`, //IPublishedAppStatsRecord

        // Publish App : User Action -> Comments
        // DD_PUBLISHED_APPS_COMMENTS_INDEX_PATH: `${DATA_DOMAIN}/published/comments/index.json`,// IPublishedAppsComments
        // SD_PUBLISHED_APP_COMMENTS_INDEX_PATH: `${DATA_DOMAIN}/${skapp}/published/comments/index.json`, // ISkappPublishedAppsCommentsIndex
        // SD_PUBLISHED_APP_COMMENTS_PATH: `${DATA_DOMAIN}/${skapp}/published/$APP_ID/comments/$LATEST/publishedAppCommentRecords.json`, //ISkappPublishedAppsComments
      }
      // load mysky
      const opts = { dev: DEV_ENABLED }
      this.mySky = await this.client.loadMySky(DATA_DOMAIN, opts)
    } catch (error) {
      this.log('Failed to load MySky, err: ', error)
      throw error;
    }
    try {
      //this.skappDict= await this.downloadFile(this.paths.SKAPPS_DICT_PATH)
    } catch (error) {
      this.log('Failed to load skappDict, err: ', error)
      this.skappDict[this.skapp] = true;
      //this.mySky.setJSON(this.paths.SKAPPS_DICT_PATH,this.skappDict);
      this.log('updated current skapp to skapp dict');
    }
  }

  // onUserLogin is called by MySky when the user has logged in successfully
  public async onUserLogin() {
    this.log(`>>>>>>>> SKAPP DAC : VRESION : ${DAC_VERSION} <<<<<<<<<<<<<<<<`)
    const promises = []
    promises.push(this.ensureDDDeployedAppsIndexPresent()
      .then(() => { this.log(`Successfully ensured ${this.paths.DD_DEPLOYED_APPS_INDEX_PATH} present`) })
      .catch(err => { this.log('Failed to ensure Deployment DataDomain index.json, err: ', err) })
    )
    promises.push(this.ensureSDDeployedAppsIndexPresent()
      .then(() => { this.log(`Successfully ensured ${this.paths.SD_DEPLOYED_APPS_INDEX_PATH} present`) })
      .catch(err => { this.log('Failed to ensure Deployment SkappDomain index.json, err: ', err) }))

    promises.push(this.ensureDDPublishedAppsIndexPresent()
      .then(() => { this.log(`Successfully ensured ${this.paths.DD_PUBLISHED_APPS_INDEX_PATH} present`) })
      .catch(err => { this.log('Failed to ensure PublishedApp DataDomain index.json, err: ', err) })
    )
    promises.push(this.ensureSDPublishedAppsIndexPresent()
      .then(() => { this.log(`Successfully ensured ${this.paths.SD_PUBLISHED_APPS_INDEX_PATH} present`) })
      .catch(err => { this.log('Failed to ensure PublishedApp SkappDomain index.json, err: ', err) }))

    promises.push(this.ensureDDPublishedAppsStatsIndexPresent()
      .then(() => { this.log(`Successfully ensured ${this.paths.DD_PUBLISHED_APPS_STATS_INDEX_PATH} present`) })
      .catch(err => { this.log('Failed to ensure PublishedAppStats DataDomain index.json, err: ', err) })
    )
    promises.push(this.ensureSDPublishedAppsStatsIndexPresent()
      .then(() => { this.log(`Successfully ensured ${this.paths.SD_PUBLISHED_APPS_STATS_INDEX_PATH} present`) })
      .catch(err => { this.log('Failed to ensure PublishedAppStats SkappDomain index.json, err: ', err) }))
    Promise.all(promises).then(() => { this.fileHierarchyEnsured = true })
  }
  private async ensureDDDeployedAppsIndexPresent(): Promise<void> {
    const { DD_DEPLOYED_APPS_INDEX_PATH: path } = this.paths;
    const index = await this.downloadFile<IDeployedAppsDDIDX>(path);
    if (!index) {
      await this.updateFile(path, DEFAULT_DD_DEPLOYED_APPS_INDEX) // default index
    }
  }
  private async ensureSDDeployedAppsIndexPresent(): Promise<void> {
    const { SD_DEPLOYED_APPS_INDEX_PATH: path } = this.paths;
    const index = await this.downloadFile<IDeployedAppsSDIDX>(path);
    if (!index) {
      await this.updateFile(path, DEFAULT_SD_DEPLOYED_APPS_INDEX) // default index
    }
  }
  private async ensureDDPublishedAppsIndexPresent(): Promise<void> {
    const { DD_PUBLISHED_APPS_INDEX_PATH: path } = this.paths;
    const index = await this.downloadFile<IPublishedAppsDDIDX>(path);
    if (!index) {
      await this.updateFile(path, DEFAULT_DD_PUBLISHED_APPS_INDEX) // default index
    }
  }
  private async ensureSDPublishedAppsIndexPresent(): Promise<void> {
    const { SD_PUBLISHED_APPS_INDEX_PATH: path } = this.paths;
    const index = await this.downloadFile<IPublishedAppsSDIDX>(path);
    if (!index) {
      await this.updateFile(path, DEFAULT_SD_PUBLISHED_APPS_INDEX) // default index
    }
  }
  private async ensureDDPublishedAppsStatsIndexPresent(): Promise<void> {
    const { DD_PUBLISHED_APPS_STATS_INDEX_PATH: path } = this.paths;
    const index = await this.downloadFile<IPublishedAppsDDIDX>(path);
    if (!index) {
      await this.updateFile(path, DEFAULT_DD_PUBLISHED_APPS_INDEX) // default index
    }
  }
  private async ensureSDPublishedAppsStatsIndexPresent(): Promise<void> {
    const { SD_PUBLISHED_APPS_STATS_INDEX_PATH: path } = this.paths;
    const index = await this.downloadFile<IPublishedAppsSDIDX>(path);
    if (!index) {
      await this.updateFile(path, DEFAULT_SD_PUBLISHED_APPS_INDEX) // default index
    }
  }
  // #####################################################################################
  // ###################### Deployment Methods ###########################################
  // #####################################################################################
  public async setDeployment(data: IDeploymentRecord): Promise<IDACResponse> {
    if (!await this.waitUntilFilesArePresent()) {
      return this.fail('Could not initialize Deployment Files, initialization timeout');
    }
    let result: IDACResponse = { submitted: false, };
    // TODO: Add "Validation" call here
    let promises: any = []
    const timestamp: number = (new Date()).valueOf();
    const { DD_DEPLOYED_APPS_INDEX_PATH, DD_DEPLOYED_APP_PATH, SD_DEPLOYED_APPS_INDEX_PATH, SD_DEPLOYED_APP_PATH } = this.paths;
    const DD_DEPLOYED_APP_PATH_UPDATED = DD_DEPLOYED_APP_PATH.replace("$APP_ID", data.appId);
    const SD_DEPLOYED_APP_PATH_UPDATED = SD_DEPLOYED_APP_PATH.replace("$APP_ID", data.appId);
    this.log(' DD_DEPLOYED_APP_PATH_UPDATED : ', DD_DEPLOYED_APP_PATH_UPDATED);
    this.log(' SD_DEPLOYED_APP_PATH_UPDATED : ', SD_DEPLOYED_APP_PATH_UPDATED);

    try {

      // ####### Step 1: Read DataDomain and SkappDomain Indexes and update Index variable, dont write yet. Index File write will be in last step

      let ddDeployedAppsIndex: IDeployedAppsDDIDX | null = null;// at Data Domain Level
      let sdDeployedAppsIndex: IDeployedAppsSDIDX | null = null;// at Skapp Domain Level
      let ddCounter: number = 0;
      let sdCounter: number = 0;
      let deployedAppRecordDataLink: string | null = null;
      try {
        let promises: any = [];
        promises.push(this.downloadFile<IDeployedAppsDDIDX>(DD_DEPLOYED_APPS_INDEX_PATH));
        promises.push(this.downloadFile<IDeployedAppsSDIDX>(SD_DEPLOYED_APPS_INDEX_PATH))
        const promiseResult = await Promise.all<IDeployedAppsDDIDX, IDeployedAppsSDIDX>(promises);
        ddDeployedAppsIndex = promiseResult[0];
        sdDeployedAppsIndex = promiseResult[1];
        if (ddDeployedAppsIndex == undefined || ddDeployedAppsIndex == null) {
          result.error = `Error Downloading DataDomain Index File`;
          return result;
        }
        if (sdDeployedAppsIndex == undefined || sdDeployedAppsIndex == null) {
          result.error = `Error Downloading SkappDomain Index File`;
          return result;
        }
      } catch (error) {
        result.error = `Error Downloading DataDomain and/or SkappDomain Index File`;
        return result;
      }

      // --> DataDomain Index File
      if (ddDeployedAppsIndex.appsIndex == null) {// first time deploying
        const deployedAppsDDIDXRecord: IDeployedAppsDDIDXRecord = {
          appId: data.appId,
          ddCounter: 0,
          latestDataLink: "",// value will be set here later on.
          lastUpdatedBy: this.skapp,
          skapps: [this.skapp]
        }
        ddDeployedAppsIndex.appsIndex = {
          [data.appId]: deployedAppsDDIDXRecord
        }
      }
      else {//Not FirstTime 
        const ddAppIds = Object.keys(ddDeployedAppsIndex.appsIndex);
        if (!ddAppIds.includes(data.appId)) {// "New App" Deployment !
          const deployedAppsDDIDXRecord: IDeployedAppsDDIDXRecord = {
            appId: data.appId,
            ddCounter: 0,
            latestDataLink: "",// value will be set here later on.
            lastUpdatedBy: this.skapp,
            skapps: [this.skapp]
          }
          ddDeployedAppsIndex.appsIndex[data.appId] = deployedAppsDDIDXRecord;
        }
        else {// "Existing App" Deployment !
          ddCounter = ddDeployedAppsIndex.appsIndex[data.appId].ddCounter + 1;
          ddDeployedAppsIndex.appsIndex[data.appId].ddCounter = ddCounter;
          ddDeployedAppsIndex.appsIndex[data.appId].lastUpdatedBy = this.skapp;
          if (!ddDeployedAppsIndex.appsIndex[data.appId].skapps.includes(this.skapp))
            ddDeployedAppsIndex.appsIndex[data.appId].skapps.push(this.skapp);
          const lastDeploymentDataLink = ddDeployedAppsIndex.appsIndex[data.appId].latestDataLink;
          const historyPath: string = DD_DEPLOYED_APP_PATH_UPDATED.replace("$LATEST", ddCounter.toString());
          // set Entry with (lastDeploymentDataLink)
          await this.setDataLink(historyPath, lastDeploymentDataLink);
        }
      }

      // --> SkappDomain Index File
      if (sdDeployedAppsIndex.appsIndex == null) {//first time
        // first time deploying
        const deployedAppsSDIDXRecord: IDeployedAppsSDIDXRecord = {
          appId: data.appId,
          sdCounter: 0,
          latestDataLink: "",// value will be set here later on.
        }
        sdDeployedAppsIndex.appsIndex = {
          [data.appId]: deployedAppsSDIDXRecord
        }
      }
      else {//Not FirstTime 
        const sdAppIds = Object.keys(sdDeployedAppsIndex.appsIndex);
        if (!sdAppIds.includes(data.appId)) {// "New App" Deployment !
          const deployedAppsSDIDXRecord: IDeployedAppsSDIDXRecord = {
            appId: data.appId,
            sdCounter: 0,
            latestDataLink: "",// value will be set here later on.
          }
          sdDeployedAppsIndex.appsIndex[data.appId] = deployedAppsSDIDXRecord;
        }
        else {// "Existing App" Deployment !
          sdCounter = sdDeployedAppsIndex.appsIndex[data.appId].sdCounter + 1;
          sdDeployedAppsIndex.appsIndex[data.appId].sdCounter = sdCounter;
          const lastDeploymentDataLink = sdDeployedAppsIndex.appsIndex[data.appId].latestDataLink;
          const historyPath: string = SD_DEPLOYED_APP_PATH_UPDATED.replace("$LATEST", sdCounter.toString());
          // set Entry with (lastDeploymentDataLink)
          await this.setDataLink(historyPath, lastDeploymentDataLink);
        }
      }

      // ####### Step 2: Actual Data Write

      // update DeploymentRecord and update File
      data.ddCounter = ddCounter;
      data.timestamp = timestamp;
      const sdUpdateFileResult = await this.updateFile(SD_DEPLOYED_APP_PATH_UPDATED, data);
      deployedAppRecordDataLink = sdUpdateFileResult.dataLink ?? "";
      // update DD $Latest pointer to new dataLink
      if (deployedAppRecordDataLink != "") // this is to avoid pointing to incorrect deployment
      {
        await this.setDataLink(DD_DEPLOYED_APP_PATH_UPDATED, deployedAppRecordDataLink) // this REG-Write can be eliminated in specific senarios if we get SkylinkV2 to SkyLinkV2 resolution in sdk. 
      }

      // ####### Step 3: update IndexRecord objects and update DD & SD index files

      ddDeployedAppsIndex.appsIndex[data.appId].latestDataLink = deployedAppRecordDataLink;
      sdDeployedAppsIndex.appsIndex[data.appId].latestDataLink = deployedAppRecordDataLink;
      await this.updateFile(DD_DEPLOYED_APPS_INDEX_PATH, ddDeployedAppsIndex);
      await this.updateFile(SD_DEPLOYED_APPS_INDEX_PATH, sdDeployedAppsIndex);
      result.submitted = true;
    } catch (error) {
      result.error = error;
    }
    return result;
  }

  // If null will return all deployments
  public async getDeployments(appIds?: string[]): Promise<any> {
    let response: any = { status: "failure", result: null, error: null };
    let deployedApps: any = null;
    const { DD_DEPLOYED_APP_PATH, DD_DEPLOYED_APPS_INDEX_PATH } = this.paths;
    try {
      if (appIds)// If appIds are provided
      {
        const promises: Promise<IDeploymentRecord | null>[] = appIds.map((appId) => {
          const DD_DEPLOYED_APP_PATH_UPDATED = DD_DEPLOYED_APP_PATH.replace("$APP_ID", appId);
          return this.downloadFile(DD_DEPLOYED_APP_PATH_UPDATED);
        })
        deployedApps = await Promise.all(promises);

      }
      else// If No AppIds are provided, then fetch all apps deployment record
      {
        // step1: read DD Index File
        const deployedAppsIndex: IDeployedAppsDDIDX | null = await this.downloadFile(DD_DEPLOYED_APPS_INDEX_PATH);
        if (deployedAppsIndex != null && deployedAppsIndex.appsIndex != null) {
          const appIds: string[] = Object.keys(deployedAppsIndex.appsIndex);
          const promises: Promise<IDeploymentRecord | null>[] = appIds.map((appId) => {
            const DD_DEPLOYED_APP_PATH_UPDATED = DD_DEPLOYED_APP_PATH.replace("$APP_ID", appId);
            return this.downloadFile(DD_DEPLOYED_APP_PATH_UPDATED);
          })
          deployedApps = await Promise.all(promises);
        }
      }
      return deployedApps;
    } catch (error) {
      this.log('Error in getDeployments :', error);
      response.error = `Error fetching deployment data, error : ${error}`;
    }
    return response;
  }

  // #####################################################################################
  // ###################### PublishApp Methods ###########################################
  // #####################################################################################

  public async setPublishedApp(data: IPublishedAppRecord): Promise<IDACResponse> {
    if (!await this.waitUntilFilesArePresent()) {
      return this.fail('Could not initialize PublishedApp Files, initialization timeout');
    }
    let result: IDACResponse = { submitted: false, };
    // TODO: Add "Validation" call here
    let promises: any = []
    const timestamp: number = (new Date()).valueOf();
    const { DD_PUBLISHED_APPS_INDEX_PATH, DD_PUBLISHED_APP_PATH, SD_PUBLISHED_APPS_INDEX_PATH, SD_PUBLISHED_APP_PATH } = this.paths;
    const DD_PUBLISHED_APP_PATH_UPDATED = DD_PUBLISHED_APP_PATH.replace("$APP_ID", data.appId);
    const SD_PUBLISHED_APP_PATH_UPDATED = SD_PUBLISHED_APP_PATH.replace("$APP_ID", data.appId);
    this.log(' DD_PUBLISHED_APP_PATH_UPDATED : ', DD_PUBLISHED_APP_PATH_UPDATED);
    this.log(' SD_PUBLISHED_APP_PATH_UPDATED : ', SD_PUBLISHED_APP_PATH_UPDATED);

    try {

      // ####### Step 1: Read DataDomain and SkappDomain Indexes and update Index variable, dont write yet. Index File write will be in last step

      let ddPublishedAppsIndex: IPublishedAppsDDIDX | null = null;// at Data Domain Level
      let sdPublishedAppsIndex: IPublishedAppsSDIDX | null = null;// at Skapp Domain Level
      let ddCounter: number = 0;
      let sdCounter: number = 0;
      let publishedAppRecordDataLink: string | null = null;
      try {
        let promises: any = [];
        promises.push(this.downloadFile<IPublishedAppsDDIDX>(DD_PUBLISHED_APPS_INDEX_PATH));
        promises.push(this.downloadFile<IPublishedAppsSDIDX>(SD_PUBLISHED_APPS_INDEX_PATH))
        const promiseResult = await Promise.all<IPublishedAppsDDIDX, IPublishedAppsSDIDX>(promises);
        ddPublishedAppsIndex = promiseResult[0];
        sdPublishedAppsIndex = promiseResult[1];
        if (ddPublishedAppsIndex == undefined || ddPublishedAppsIndex == null) {
          result.error = `Error Downloading DataDomain Index File`;
          return result;
        }
        if (sdPublishedAppsIndex == undefined || sdPublishedAppsIndex == null) {
          result.error = `Error Downloading SkappDomain Index File`;
          return result;
        }
      } catch (error) {
        result.error = `Error Downloading DataDomain and/or SkappDomain Index File`;
        return result;
      }

      // --> DataDomain Index File
      if (ddPublishedAppsIndex.appsIndex == null) {// first time deploying
        const publishedAppsDDIDXRecord: IPublishedAppsDDIDXRecord = {
          appId: data.appId,
          ddCounter: 0,
          latestDataLink: "",// value will be set here later on.
          lastUpdatedBy: this.skapp,
          skapps: [this.skapp]
        }
        ddPublishedAppsIndex.appsIndex = {
          [data.appId]: publishedAppsDDIDXRecord
        }
      }
      else {//Not FirstTime 
        const ddAppIds = Object.keys(ddPublishedAppsIndex.appsIndex);
        if (!ddAppIds.includes(data.appId)) {// "New App" Published App !
          const publishedAppsDDIDXRecord: IPublishedAppsDDIDXRecord = {
            appId: data.appId,
            ddCounter: 0,
            latestDataLink: "",// value will be set here later on.
            lastUpdatedBy: this.skapp,
            skapps: [this.skapp]
          }
          ddPublishedAppsIndex.appsIndex[data.appId] = publishedAppsDDIDXRecord;
        }
        else {// "Existing App" Published App !
          ddCounter = ddPublishedAppsIndex.appsIndex[data.appId].ddCounter + 1;
          ddPublishedAppsIndex.appsIndex[data.appId].ddCounter = ddCounter;
          ddPublishedAppsIndex.appsIndex[data.appId].lastUpdatedBy = this.skapp;
          if (!ddPublishedAppsIndex.appsIndex[data.appId].skapps.includes(this.skapp))
            ddPublishedAppsIndex.appsIndex[data.appId].skapps.push(this.skapp);
          const lastPublishedAppDataLink = ddPublishedAppsIndex.appsIndex[data.appId].latestDataLink;
          const historyPath: string = DD_PUBLISHED_APP_PATH_UPDATED.replace("$LATEST", ddCounter.toString());
          // set Entry with (lastPublishedAppDataLink)
          await this.setDataLink(historyPath, lastPublishedAppDataLink);
        }
      }

      // --> SkappDomain Index File
      if (sdPublishedAppsIndex.appsIndex == null) {//first time
        // first time deploying
        const publishedAppsSDIDXRecord: IPublishedAppsSDIDXRecord = {
          appId: data.appId,
          sdCounter: 0,
          latestDataLink: "",// value will be set here later on.
        }
        sdPublishedAppsIndex.appsIndex = {
          [data.appId]: publishedAppsSDIDXRecord
        }
      }
      else {//Not FirstTime 
        const sdAppIds = Object.keys(sdPublishedAppsIndex.appsIndex);
        if (!sdAppIds.includes(data.appId)) {// "New App" PublishedApp !
          const publishedAppsSDIDXRecord: IPublishedAppsSDIDXRecord = {
            appId: data.appId,
            sdCounter: 0,
            latestDataLink: "",// value will be set here later on.
          }
          sdPublishedAppsIndex.appsIndex[data.appId] = publishedAppsSDIDXRecord;
        }
        else {// "Existing App" PublishedApp !
          sdCounter = sdPublishedAppsIndex.appsIndex[data.appId].sdCounter + 1;
          sdPublishedAppsIndex.appsIndex[data.appId].sdCounter = sdCounter;
          const lastPublishedAppDataLink = sdPublishedAppsIndex.appsIndex[data.appId].latestDataLink;
          const historyPath: string = SD_PUBLISHED_APP_PATH_UPDATED.replace("$LATEST", sdCounter.toString());
          // set Entry with (lastPublishedAppDataLink)
          await this.setDataLink(historyPath, lastPublishedAppDataLink);
        }
      }

      // ####### Step 2: Actual Data Write

      // update PublishedAppRecord and update File
      data.ddCounter = ddCounter;
      data.timestamp = timestamp;
      const sdUpdateFileResult = await this.updateFile(SD_PUBLISHED_APP_PATH_UPDATED, data);
      publishedAppRecordDataLink = sdUpdateFileResult.dataLink ?? "";
      // update DD $Latest pointer to new dataLink
      if (publishedAppRecordDataLink != "") // this is to avoid pointing to incorrect publishedApp
      {
        await this.setDataLink(DD_PUBLISHED_APP_PATH_UPDATED, publishedAppRecordDataLink) // this REG-Write can be eliminated in specific senarios if we get SkylinkV2 to SkyLinkV2 resolution in sdk. 
      }

      // ####### Step 3: update IndexRecord objects and update DD & SD index files

      ddPublishedAppsIndex.appsIndex[data.appId].latestDataLink = publishedAppRecordDataLink;
      sdPublishedAppsIndex.appsIndex[data.appId].latestDataLink = publishedAppRecordDataLink;
      await this.updateFile(DD_PUBLISHED_APPS_INDEX_PATH, ddPublishedAppsIndex);
      await this.updateFile(SD_PUBLISHED_APPS_INDEX_PATH, sdPublishedAppsIndex);
      result.submitted = true;
    } catch (error) {
      result.error = error;
    }
    return result;
  }

  public async getPublishedApps(appIds?: string[], userId?: string): Promise<any> {
    let response: any = { status: "failure", result: null, error: null };
    let publishedApps: any = null;
    const { DD_PUBLISHED_APP_PATH, DD_PUBLISHED_APPS_INDEX_PATH } = this.paths;
    try {
      if (appIds)// If appIds are provided
      {
        const promises: Promise<IDeploymentRecord | null>[] = appIds.map((appId) => {
          const DD_PUBLISHED_APP_PATH_UPDATED = DD_PUBLISHED_APP_PATH.replace("$APP_ID", appId);
          return this.downloadFile(DD_PUBLISHED_APP_PATH_UPDATED);
        })
        publishedApps = await Promise.all(promises);

      }
      else// If No AppIds are provided, then fetch all apps deployment record
      {
        // step1: read DD Index File
        const publishedAppsIndex: IPublishedAppsDDIDX | null = await this.downloadFile(DD_PUBLISHED_APPS_INDEX_PATH);
        if (publishedAppsIndex != null && publishedAppsIndex.appsIndex != null) {
          const appIds: string[] = Object.keys(publishedAppsIndex.appsIndex);
          const promises: Promise<IDeploymentRecord | null>[] = appIds.map((appId) => {
            const DD_PUBLISHED_APP_PATH_UPDATED = DD_PUBLISHED_APP_PATH.replace("$APP_ID", appId);
            return this.downloadFile(DD_PUBLISHED_APP_PATH_UPDATED);
          })
          publishedApps = await Promise.all(promises);
        }
      }
      return publishedApps;
    } catch (error) {
      this.log('Error in getPublishedApps :', error);
      response.error = `Error fetching Published Apps data, error : ${error}`;
    }
    return response;
  }
  public async getPublishedAppIds(userId?: string): Promise<any> {
    // TODO: Pending Implementation
    const { DD_PUBLISHED_APPS_INDEX_PATH } = this.paths;
    const publishedAppsIndex: IPublishedAppsDDIDX | null = await this.downloadFile(DD_PUBLISHED_APPS_INDEX_PATH);
    if (publishedAppsIndex != null && publishedAppsIndex.appsIndex != null) {
      const appIds: string[] = Object.keys(publishedAppsIndex.appsIndex);
      return appIds;
    }
    return null;
  }
  // #####################################################################################
  // ###################### PublishApp Stats / Interactions Methods ######################
  // #####################################################################################

  public async skappAction(action: skappActionType, appId: string, data: any): Promise<IDACResponse> {
    if (!await this.waitUntilFilesArePresent()) {
      return this.fail('Could not initialize PublishedApp Stats Files, initialization timeout');
    }
    let result: IDACResponse = { submitted: false, };
    // TODO: Add "Validation" call here
    let promises: any = []
    const timestamp: number = (new Date()).valueOf();
    const { DD_PUBLISHED_APPS_STATS_INDEX_PATH, SD_PUBLISHED_APPS_STATS_INDEX_PATH } = this.paths;
    try {
      // ####### Step 1: Read DataDomain and SkappDomain Indexes and update Index variable, dont write yet. Index File write will be in last step
      let ddPublishedAppsStatsIndex: IPublishedAppsStatsDDIDX | null = null;// at Data Domain Level
      let sdPublishedAppsStatsIndex: IPublishedAppsStatsSDIDX | null = null;// at Skapp Domain Level
      let ddCounter: number = 0;
      let sdCounter: number = 0;
      try {
        let promises: any = [];
        promises.push(this.downloadFile<IPublishedAppsStatsDDIDX>(DD_PUBLISHED_APPS_STATS_INDEX_PATH));
        promises.push(this.downloadFile<IPublishedAppsStatsSDIDX>(SD_PUBLISHED_APPS_STATS_INDEX_PATH))
        const promiseResult = await Promise.all<IPublishedAppsStatsDDIDX, IPublishedAppsStatsSDIDX>(promises);
        ddPublishedAppsStatsIndex = promiseResult[0];
        sdPublishedAppsStatsIndex = promiseResult[1];
        if (ddPublishedAppsStatsIndex == undefined || ddPublishedAppsStatsIndex == null) {
          result.error = `Error Downloading DataDomain Index File`;
          return result;
        }
        if (sdPublishedAppsStatsIndex == undefined || sdPublishedAppsStatsIndex == null) {
          result.error = `Error Downloading SkappDomain Index File`;
          return result;
        }
      } catch (error) {
        result.error = `Error Downloading DataDomain and/or SkappDomain Index File`;
        return result;
      }
      // --> DataDomain Index File
      if (ddPublishedAppsStatsIndex.appsIndex == null) {// first time 
        const publishedAppsStatsDDIDXRecord: IPublishedAppsStatsDDIDXRecord = {
          appId: data.appId,
          ddCounter: 0,
          //latestDataLink: "",// value will be set here later on.
          publishedAppStatsRecord: null,
          lastUpdatedBy: this.skapp,
          skapps: [this.skapp]
        }
        let publishedAppStatsRecord = this.getUpdatesPublishedAppStatsRecord(action, DEFAULT_PUBLISHED_APPS_STATS_RECORD)
        publishedAppsStatsDDIDXRecord.publishedAppStatsRecord = publishedAppStatsRecord;
        ddPublishedAppsStatsIndex.appsIndex = {
          [data.appId]: publishedAppsStatsDDIDXRecord
        }
      }
      else {//Not FirstTime 
        const ddAppIds = Object.keys(ddPublishedAppsStatsIndex.appsIndex);
        if (!ddAppIds.includes(data.appId)) {// "New App" Published App !
          const publishedAppsStatsDDIDXRecord: IPublishedAppsStatsDDIDXRecord = {
            appId: data.appId,
            ddCounter: 0,
            //latestDataLink: "",// value will be set here later on.
            publishedAppStatsRecord: null,
            lastUpdatedBy: this.skapp,
            skapps: [this.skapp]
          }
          let publishedAppStatsRecord = this.getUpdatesPublishedAppStatsRecord(action, DEFAULT_PUBLISHED_APPS_STATS_RECORD)
          publishedAppsStatsDDIDXRecord.publishedAppStatsRecord = publishedAppStatsRecord;
          ddPublishedAppsStatsIndex.appsIndex[data.appId] = publishedAppsStatsDDIDXRecord;
        }
        else {// "Existing App" Published App !
          ddCounter = ddPublishedAppsStatsIndex.appsIndex[data.appId].ddCounter + 1;
          ddPublishedAppsStatsIndex.appsIndex[data.appId].ddCounter = ddCounter;
          ddPublishedAppsStatsIndex.appsIndex[data.appId].lastUpdatedBy = this.skapp;
          if (!ddPublishedAppsStatsIndex.appsIndex[data.appId].skapps.includes(this.skapp))
            ddPublishedAppsStatsIndex.appsIndex[data.appId].skapps.push(this.skapp);
          let publishedAppStatsRecord = this.getUpdatesPublishedAppStatsRecord(action, ddPublishedAppsStatsIndex.appsIndex[data.appId].publishedAppStatsRecord!)
          ddPublishedAppsStatsIndex.appsIndex[data.appId].publishedAppStatsRecord = publishedAppStatsRecord;
        }
      }
      // --> SkappDomain Index File
      if (sdPublishedAppsStatsIndex.appsIndex == null) {//first time
        // first time deploying
        const publishedAppsStatsSDIDXRecord: IPublishedAppsStatsSDIDXRecord = {
          appId: data.appId,
          sdCounter: 0,
          //latestDataLink: "",// value will be set here later on.
          publishedAppStatsRecord: DEFAULT_PUBLISHED_APPS_STATS_RECORD,
        }
        let publishedAppStatsRecord = this.getUpdatesPublishedAppStatsRecord(action, DEFAULT_PUBLISHED_APPS_STATS_RECORD)
        publishedAppsStatsSDIDXRecord.publishedAppStatsRecord = publishedAppStatsRecord;
        sdPublishedAppsStatsIndex.appsIndex = {
          [data.appId]: publishedAppsStatsSDIDXRecord
        }
      }
      else {//Not FirstTime 
        const sdAppIds = Object.keys(sdPublishedAppsStatsIndex.appsIndex);
        if (!sdAppIds.includes(data.appId)) {// "New App" PublishedApp !
          const publishedAppsStatsSDIDXRecord: IPublishedAppsStatsSDIDXRecord = {
            appId: data.appId,
            sdCounter: 0,
            //latestDataLink: "",// value will be set here later on.
            publishedAppStatsRecord: DEFAULT_PUBLISHED_APPS_STATS_RECORD,
          }
          let publishedAppStatsRecord = this.getUpdatesPublishedAppStatsRecord(action, DEFAULT_PUBLISHED_APPS_STATS_RECORD)
          publishedAppsStatsSDIDXRecord.publishedAppStatsRecord = publishedAppStatsRecord;
          sdPublishedAppsStatsIndex.appsIndex[data.appId] = publishedAppsStatsSDIDXRecord;
        }
        else {// "Existing App" PublishedApp !
          sdCounter = sdPublishedAppsStatsIndex.appsIndex[data.appId].sdCounter + 1;
          sdPublishedAppsStatsIndex.appsIndex[data.appId].sdCounter = sdCounter;
          let publishedAppStatsRecord = this.getUpdatesPublishedAppStatsRecord(action, sdPublishedAppsStatsIndex.appsIndex[data.appId].publishedAppStatsRecord!)
          sdPublishedAppsStatsIndex.appsIndex[data.appId].publishedAppStatsRecord = publishedAppStatsRecord;
        }
      }
      // ####### Step 2: Actual Data Write
      promises = [];
      promises.push(this.updateFile(DD_PUBLISHED_APPS_STATS_INDEX_PATH, ddPublishedAppsStatsIndex));
      promises.push(this.updateFile(SD_PUBLISHED_APPS_STATS_INDEX_PATH, sdPublishedAppsStatsIndex));
      const promiseResult = await Promise.all<JSONResponse, JSONResponse>(promises);
      result.submitted = true;
    } catch (error) {
      result.error = error;
    }
    return result;
  }
  private getUpdatesPublishedAppStatsRecord(action: skappActionType, data: IPublishedAppStatsRecord): IPublishedAppStatsRecord {
    try {
      switch (action) {
        case skappActionType.LIKED:
        case skappActionType.UNLIKED:
          data.content.liked = action == skappActionType.LIKED ? 1 : 0;
          break;
        case skappActionType.FAVORITE:
        case skappActionType.UNFAVORITE:
          data.content.favorite = action == skappActionType.FAVORITE ? 1 : 0;
          break;
        case skappActionType.VIEWED:
          data.content.viewed += 1;
          break;
        case skappActionType.ACCESSED:
          data.content.accessed += 1;
          break;
        default:
          this.log('No such Implementation');
      }
      data.timestamp = (new Date()).valueOf();
    } catch (error) {
      this.log(' ### Error updating IPublishedAppStatsRecord');
    }
    return data;
  }
  public async getStats(appIds?: string[], userId?: string): Promise<any> {
    let publishedApps: any = null;
    const { DD_PUBLISHED_APPS_STATS_INDEX_PATH } = this.paths;
    try {
      const publishedAppsStatsIndex: IPublishedAppsStatsDDIDX | null = await this.downloadFile(DD_PUBLISHED_APPS_STATS_INDEX_PATH);

      if (publishedAppsStatsIndex != null && publishedAppsStatsIndex.appsIndex != null) {
        let statsRecordArray = Object.values(publishedAppsStatsIndex.appsIndex);
        if (appIds)// If appIds are provided
        {
          publishedApps = statsRecordArray.filter((item: IPublishedAppsStatsDDIDXRecord) => { if (appIds.includes(item.appId)) { return item.publishedAppStatsRecord; } })
        }
        else// If No AppIds are provided, then fetch all apps deployment record
        {
          publishedApps = statsRecordArray.map((item: IPublishedAppsStatsDDIDXRecord) =>  item.publishedAppStatsRecord)
        }
      }
      return publishedApps;
    } catch (error) {
      this.log('Error in getPublishedApps :', error);
    }
    return publishedApps;
  }
  // #####################################################################################
  // ############################ Review Below Methods ###################################
  // #####################################################################################

  // public async getPublishedAppsByUserIds(userIds: string[]): Promise<any[]> {
  //   let results: any = [];
  //   for (let userId of userIds) {
  //     this.log('getPublishedAppsByUserIds : ', userId);
  //     try {
  //       let { data: publishedList } = await this.client.file.getJSON(userId, this.paths.PUBLISHED_INDEX_PATH);
  //       this.log("getPublishedAppsByUserIds : " + userId + " ,publishedList " + JSON.stringify(publishedList));
  //       if (publishedList != null && publishedList.published !== null) {
  //         let appIdsList: any = publishedList.published;
  //         results[userId] = appIdsList;
  //       }
  //       else {
  //         results[userId] = [];
  //       }
  //       //results.push(publishedList);
  //     } catch (error) {
  //       this.log('missing json for appid :', userId);
  //     }
  //   }
  //   this.log("getPublishedAppsByUserIds : consolidated : " + JSON.stringify(results));
  //   return results;
  // }
  // public async getPublishedAppsCountByUserIds(userIds: string[]): Promise<any[]> {
  //   let results: any = {};
  //   for (let userId of userIds) {
  //     this.log('getPublishedAppsCountByUserIds : ', userId);
  //     try {
  //       let { data: publishedList } = await this.client.file.getJSON(userId, this.paths.PUBLISHED_INDEX_PATH);
  //       this.log("getPublishedAppsCountByUserIds : " + userId + " ,publishedList " + JSON.stringify(publishedList));
  //       if (publishedList != null && publishedList.published !== null) {
  //         let appIdsList: any = publishedList.published;
  //         results[userId] = appIdsList.length;
  //       }
  //       else {
  //         results[userId] = 0;
  //       }
  //       //results.push(publishedList);
  //     } catch (error) {
  //       this.log('missing json for appid :', userId);
  //     }
  //   }
  //   this.log("getPublishedAppsCountByUserIds : consolidated : " + JSON.stringify(results));
  //   return results;
  // }
  // public async getSkappComments(appId: string): Promise<any> {
  //   let appData: any;
  //   try {
  //     appData = await this.downloadFile(this.paths.PUBLISHED_APP_INFO_PATH + appId + '/' + 'appComments.json');
  //   } catch (error) {
  //     this.log('missing json for appid :', appId);
  //     throw new Error("missing json for appid :" + appId);
  //   }
  //   return appData;
  // }
  // downloadFile merely wraps getJSON but is typed in a way that avoids
  // repeating the awkward "as unknown as T" everywhere
  private async downloadFile<T>(path: string): Promise<T | null> {
    this.log('### Skapp-Record ### :: downloading file at path', path)
    const { data } = await this.mySky.getJSON(path)
    if (!data) {
      this.log('no data found at path', path)
      return null;
    }
    this.log('data found at path', path, data)
    return data as unknown as T
  }
  // updateFile merely wraps setJSON but is typed in a way that avoids repeating
  // the awkwars "as unknown as JsonData" everywhere
  private async setDataLink(path: string, dataLink: string) {
    // TODO: add validation for dataLink
    this.log('updating EntryData at path', path, dataLink)
    try {
      await this.mySky.setDataLink(path, dataLink);
    }
    catch (e) {
      this.log(' Error in setDataLink ', e)
      throw e;
    }
  }
  // updateFile merely wraps setJSON but is typed in a way that avoids repeating
  // the awkwars "as unknown as JsonData" everywhere
  private async setEntryData(path: string, dataLink: string) {
    // TODO: add validation for dataLink
    this.log('updating EntryData at path', path, dataLink)
    const paddedDataLink = `${trimUriPrefix(dataLink, uriSkynetPrefix)}==`;
    this.log(' paddedDataLink ', paddedDataLink)
    const entrydata: Uint8Array = base64RawUrlToUint8Array(paddedDataLink);
    this.log(' entrydata ', JSON.stringify(entrydata))
    try {
      await this.mySky.setEntryData(path, entrydata, {});
    }
    catch (e) {
      this.log(' Error Setting Entry Data ', e)
      throw e;
    }
  }
  // updateFile merely wraps setJSON but is typed in a way that avoids repeating
  // the awkwars "as unknown as JsonData" everywhere
  private async getEntryData(path: string, data: string) {
    this.log('reading EntryData at path', path, data)
    //let jsonString = JSON.stringify(data);
    //let dataJSON = JSON.parse(jsonString);
    //this.log('updating file at path(jsonString)', path, jsonString)
    await this.mySky.setJSON(path, data as unknown as JsonData)
  }
  // updateFile merely wraps setJSON but is typed in a way that avoids repeating
  // the awkwars "as unknown as JsonData" everywhere
  private async updateFile<T>(path: string, data: T): Promise<JSONResponse> {
    this.log('updating file at path', path, data)
    //let jsonString = JSON.stringify(data);
    //let dataJSON = JSON.parse(jsonString);
    //this.log('updating file at path(jsonString)', path, jsonString)
    return await this.mySky.setJSON(path, data as unknown as JsonData)
  }
  // // this function returns promise
  // private async updateFile<T>(path: string, data: T): Promise<void> {
  //   this.log('updating file at path', path, data)
  //   await this.mySky.setJSON(path, data as unknown as JsonData)
  // }
  private waitUntilFilesArePresent(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.fileHierarchyEnsured) {
        resolve(true);
        return;
      }
      const start = new Date().getTime()
      while (true) {
        setTimeout(() => {
          if (this.fileHierarchyEnsured) {
            resolve(true);
          }
          const elapsed = new Date().getTime() - start;
          if (elapsed > 60000) {
            this.log(`waitUntilFilesArePresent timed out after ${elapsed}ms`)
            reject(false)
          }
        }, 100)
      }
    })
  }

  // log prints to stdout only if DEBUG_ENABLED flag is set
  private log(message: string, ...optionalContext: any[]) {
    if (DEBUG_ENABLED) {
      console.log("### SKAPP-DAC (DEBUG) #### " + message, ...optionalContext)
    }
  }
  private fail(error: string): IDACResponse {
    this.log(error)
    return { submitted: false, error }
  }
}
