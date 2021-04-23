
  public async getPublishedApps(appIds: string[]): Promise<IPublishedApp[]> {
    let indexData:any ={};
    let results:IPublishedApp[] = [];
    if(appIds ==null || appIds.length==0 ){
     try {
      indexData=this.mySky.getJSON(this.paths.PUBLISHED_INDEX_PATH);
     } catch (error) {
      throw new Error("NO PUBLISHED APP");
     } 
     appIds = indexData.published;
    }
    for(let appid of appIds){
      let appData :IPublishedApp;
      try{
        appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appInfo.json');
      results.push(appData);
      }catch(error){
        this.log('missing json for appid :',appid);
      }
    }
    return results;
  }

  public async getSkappsInfo(appIds: string[]): Promise<any[]> {
    let indexData:any ={};
    let results:any[] = [];
    if(appIds ==null || appIds.length==0 ){
     try {
      indexData=this.mySky.getJSON(this.paths.PUBLISHED_INDEX_PATH);
     } catch (error) {
      throw new Error("NO PUBLISHED APP");
     } 
     appIds = indexData.published;
    }
    for(let appid of appIds){
      let appMaster:any={};
      let appData :IPublishedApp;
      let appStats :IAppStats;
      let appComments :IAppComments;
      try{
        appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appInfo.json');
        appStats= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appStats.json');
        appComments= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appid+'/'+'appComments.json');
        appMaster={
          appdata:appData,
          appstats: appStats,
          appcomments: appComments
        }
        results.push(appMaster);
      }catch(error){
        this.log('missing json for appid :',appid);
      }
    }
    return results;
  }
  public async getSkappsStats(appId: string): Promise<IAppStats> {
    let appData :IAppStats;
    try{
      appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'appStats.json');
    
    }catch(error){
      this.log('missing json for appid :',appId);
      throw new Error("missing json for appid :"+appId);
    }
    return appData;
  }
  public async getSkappsComments(appId: string): Promise<IAppComments> {
    let appData :IAppComments;
    try{
      appData= await this.mySky.getJSON(this.paths.PUBLISHED_APP_INFO_PATH+appId+'/'+'appComments.json');
    }catch(error){
      this.log('missing json for appid :',appId);
      throw new Error("missing json for appid :"+appId);
    }
    return appData;
  }
  public async getDeployedApps(appIds: string[]): Promise<IDeployedApp[]> {
    let indexData:any ={};
    let results:IDeployedApp[] = [];
    if(appIds ==null || appIds.length==0 ){
     try {
      indexData=this.mySky.getJSON(this.paths.DEPLOYED_INDEX_PATH);
     } catch (error) {
      throw new Error("NO DEPLOYED APP");
     } 
     appIds = indexData.published;
    }
    for(let appid of appIds){
      let appData :IDeployedApp;
      try{
        appData= await this.mySky.getJSON(this.paths.DEPLOYED_APP_INFO_PATH+appid+'/'+'appInfo.json');
      results.push(appData);
      }catch(error){
        this.log('missing json for appid :',appid);
      }
    }
    return results;
  }
 