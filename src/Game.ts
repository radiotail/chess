import {Login} from "./Login"
import {Situation} from "./Situation"
import {Search} from "./Search"
import {User} from "./User"
import {Sound, SOUND} from "./Sound"
import { Match } from "./Match";
import { Board } from "./Board";
import GameConfig from "./GameConfigMine";

// 程序入口
export class Game{
    // public bg: Laya.Sprite;
    public bg: Laya.Image;
    public login: Login;
    public board: Board;
    public sound: Sound;
    public debug: boolean;
    public user: User;
    public situation: Situation;
    public search: Search;
    public match: Match;

    constructor(user: User, situation: Situation, search: Search) {
        //显示FPS
        //Laya.Stat.show(0, 50);
        this.user = user;
        this.situation = situation;
        this.search = search;
        this.debug = GameConfig.debug;
        
        //创建背景
        this.bg = new laya.ui.Image("res/bg.png");
        this.bg.centerX = 0;
        Laya.stage.addChild(this.bg);
        
        // 加载音乐
        this.sound = new Sound();       

        // 创建登录UI
        this.login = new Login(this);

		// if (window['wx'] != undefined) {
        //     const bannerAd = window['wx'].createBannerAd({
        //         adUnitId: 'xxxx',
        //         style: {
        //             left: 10,
        //             top: 76,
        //             width: 320
        //         }
        //     })
            
        //     bannerAd.show()
        // }
    }

    static addButtonEvent(btn: Laya.Button) {
        btn.on(laya.events.Event.MOUSE_OVER, this, this.onButtonMouseOver, [btn]);
        btn.on(laya.events.Event.MOUSE_OUT, this, this.onButtonMouseOut, [btn]);
    }

    static onButtonMouseOver(btn: Laya.Button) {
        btn.scale(1.07, 1.07);
    }

    static onButtonMouseOut(btn: Laya.Button) {
        btn.scale(1, 1);
    }
}


