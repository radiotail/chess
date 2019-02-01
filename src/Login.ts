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
    private game: Game;

    constructor(game: Game) {
        super();

        this.game = game;
        this.centerX = 0;
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
        game.match = new Match(this.game, MatchType.PVE);
        game.board = new Board(game);

        Laya.stage.addChild(this);
    }

    startGame() {
        this.visible = false;
        this.game.match.start();
    }

    onPveBtnClick() {
        this.game.match.setType(MatchType.PVE);

        this.startGame();
    }

    onPvpBtnClick() {
        this.game.match.setType(MatchType.PVP);

        this.startGame();
    }

    onMessBtnClick() {
        this.game.match.setType(MatchType.MESS);

        this.startGame();
    }
}

