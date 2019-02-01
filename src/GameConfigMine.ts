export default class GameConfig{
    static width:number=512;
    static height:number=909;
    static scaleMode:string=Laya.Stage.SCALE_FIXED_AUTO;;
    static screenMode:string="vertical";
    static alignV:string="middle";
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