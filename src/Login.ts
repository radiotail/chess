import {ui} from "./ui/layaMaxUI"
// import {ui} from "./ui/layaUI.max.all"
import {Situation} from "./Situation"
import {Search} from "./Search"
import {Match, MatchType} from "./Match"
import {Board} from "./Board"
import {Game} from "./Game"
import {User} from "./User"
import { initZobrist } from './Zobrist'

export class Login extends ui.LoginUI {
    private match: Match;
    private game: Game;

    constructor(game: Game) {
        super();

        this.game = game;
        this.logo.centerX = 0;

        this.pveBtn.centerX = 0;
        this.pveBtn.on(laya.events.Event.CLICK, this, this.onPveBtnClick);
        Game.addButtonEvent(this.pveBtn);

        this.pvpBtn.centerX = 0;
        this.pvpBtn.on(laya.events.Event.CLICK, this, this.onPvpBtnClick);
        Game.addButtonEvent(this.pvpBtn);

        this.messBtn.centerX = 0;
        this.messBtn.on(laya.events.Event.CLICK, this, this.onMessBtnClick);
        Game.addButtonEvent(this.messBtn);

        initZobrist();
        game.board = new Board(game);
    }

    startGame() {
        this.match.start();
    }

    onPveBtnClick() {
        this.visible = false;

        this.match = new Match(this.game, MatchType.PVE);
        Laya.stage.addChild(this.match);
        Laya.stage.addChild(this.game.board);

        this.match.start();
    }

    onPvpBtnClick() {
        this.visible = false;

        this.match = new Match(this.game, MatchType.PVP);
        Laya.stage.addChild(this.match);
        Laya.stage.addChild(this.game.board);

        this.match.start();
    }

    onMessBtnClick() {
        this.visible = false;

        this.match = new Match(this.game, MatchType.MESS, 0);
        Laya.stage.addChild(this.match);
        Laya.stage.addChild(this.game.board);

        this.match.start();
    }
}

