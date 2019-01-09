import GameConfig from "./GameConfigMine";
import {Game} from "./Game"
import {Situation} from "./Situation"
import {Search, HASH_LEVEL} from "./Search"
import {User} from "./User"
// require('res/game.js')

class Main {
	constructor() {
		//根据IDE设置初始化引擎		
		if (window["Laya3D"]) Laya3D.init(GameConfig.width, GameConfig.height);
		else Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
		// Laya["Physics"] && Laya["Physics"].enable();
		Laya["DebugPanel"] && Laya["DebugPanel"].enable();
		Laya.stage.scaleMode = GameConfig.scaleMode;
		Laya.stage.screenMode = GameConfig.screenMode;
		//兼容微信不支持加载scene后缀场景
		Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;

		//打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）
		if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true") Laya.enableDebugPanel();
		// if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"]) Laya["PhysicsDebugDraw"].enable();
		if (GameConfig.stat) Laya.Stat.show();
		Laya.alertGlobalError = true;

		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
		Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
	}

	onVersionLoaded(): void {
		//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
		Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
		// const loadTask = window['wx'].loadSubpackage({
		// 	name: 'subpackage', // name 可以填 name 或者 root
		// 	success: function(res) {
		// 		//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
		// 		Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));

		// 		// 分包加载成功后通过 success 回调
		// 		console.log("success");
		// 	},

		// 	fail: function(res) {
		// 		// 分包加载失败通过 fail 回调
		// 		console.log("fail");
		// 	}
		// });
	}

	onConfigLoaded(): void {
		console.log("onConfigLoaded");
		//加载IDE指定的场景
		GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);

		Laya.loader.load(["Login.json", "Board.json", "Match.json"], Laya.Handler.create(this, this.onUiLoaded), null, Laya.Loader.JSON);
		console.log("onConfigLoaded success");
	}

	onUiLoaded() {
		console.log("onUiLoaded");
		Laya.loader.load(["res/pveBtn.png", "res/pvpBtn.png", "res/messBtn.png"], Laya.Handler.create(this, this.onImgLoaded), null, Laya.Loader.IMAGE);
		console.log("onUiLoaded success");
	}

	onImgLoaded() {
		console.log("onImgLoaded");
		var user = new User();
		var situation = new Situation();
		var search = new Search(situation, HASH_LEVEL);
		var game = new Game(user, situation, search);
        situation.bindGame(game);
		console.log("onImgLoaded success");
	}
}
//激活启动类
new Main();
