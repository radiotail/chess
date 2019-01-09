export default class GameConfig{
    static width:number=720;
    static height:number=1280;
    static scaleMode:string="fixedauto";
    static screenMode:string="vertical";
    static alignV:string="top";
    static alignH:string="center";
    static startScene:any="";
    static sceneRoot:string="";
    static debug:boolean=false;
    static stat:boolean=false;
    static physicsDebug:boolean=false;
    static exportSceneToJson:boolean=true;
    static platform:string="";
    constructor(){}
    static init(){
        var reg: Function = Laya.ClassUtils.regClass;

    }
}
GameConfig.init();