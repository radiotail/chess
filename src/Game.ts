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
    public bg: Laya.Sprite;
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
        
        this.sound = new Sound();       

        this.login = new Login(this);

        //创建背景
        this.bg = new Laya.Sprite();
        this.bg.loadImage("res/bg.png");

        Laya.stage.addChild(this.bg);
        Laya.stage.addChild(this.login);
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


