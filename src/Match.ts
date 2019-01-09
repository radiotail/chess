import {ui} from "./ui/layaMaxUI"
import {Situation} from "./Situation"
import {Search} from "./Search"
import {Board, SIDE, RESULT} from "./Board"
import {Game} from "./Game"
import {User} from "./User"
import {MESS_DAT} from "./Mess"

export enum MatchType {
    PVE,
    PVP,
    MESS,
}

const Levels = [8, 10, 12, 14, 16, 18];
const MessLevel = 14;
const HintLevel = 14;

export class Match extends ui.MatchUI {
    private type: MatchType;
    private side: SIDE;
    private game: Game;
    private level: number;

    constructor(game: Game, type: MatchType, messIndex?: number) {
        super();

        this.game = game;
        this.type = type;
        this.side = SIDE.NONE;
        
        this.undoBtn.on(laya.events.Event.CLICK, this, this.onUndoBtnClick);
        Game.addButtonEvent(this.undoBtn);

        this.defeatBtn.on(laya.events.Event.CLICK, this, this.onGiveupBtnClick);
        Game.addButtonEvent(this.defeatBtn);

        this.hintBtn.on(laya.events.Event.CLICK, this, this.onHintBtnClick);
        Game.addButtonEvent(this.hintBtn);

        this.historyBtn.on(laya.events.Event.CLICK, this, this.onHistoryBtnClick);
        Game.addButtonEvent(this.historyBtn);

        this.selectInfo.labels = "      江湖小虾,      后起之秀,      江湖少侠,      武林高手,      英雄豪杰,      一代宗师";
        this.selectInfo.selectedIndex = 0;
        this.selectInfo.selectHandler = new Laya.Handler(this, this.onSelectLevel, [this.selectInfo]);
        this.selectInfo.on(laya.events.Event.MOUSE_OVER, this, this.onComboxMouseOver, [this.selectInfo]);
        this.selectInfo.on(laya.events.Event.MOUSE_OUT, this, this.onComboxMouseOut, [this.selectInfo]);
        this.game.board.setHintLevel(HintLevel);
    }

    onComboxMouseOver(comboBox: Laya.ComboBox) {
        comboBox.scale(1.05, 1.05);
    }

    onComboxMouseOut(comboBox: Laya.ComboBox) {
        comboBox.scale(1, 1);
    }

    onUndoBtnClick() {
        this.game.board.undo();
    }

    onHistoryBtnClick() {
        let history = this.game.user.getPveHistory(this.level);
        alert("总场: " + history[0] + " 胜: " + history[1] + " 平: " + history[2]);
    }

    onGiveupBtnClick() {
        this.game.user.setPveHistory(this.level, RESULT.LOSS);
        this.start();
    }

    onSelectLevel() {
        // console.log("onSelectLevel: ", this.selectInfo.selectedIndex);
        this.level = Levels[this.selectInfo.selectedIndex];
        this.game.user.setPveLevelIndex(this.selectInfo.selectedIndex);
        this.game.board.selectLevel(this.level, this.game.search);
        this.game.board.newGame(SIDE.BLACK);
    }

    start() {
        if (this.type == MatchType.PVE) {
            this.level = Levels[this.game.user.getPveLevelIndex()];
            this.game.board.selectLevel(this.level, this.game.search);
            this.selectInfo.visible = true;
            this.game.board.newGame(SIDE.BLACK);
        } else if (this.type == MatchType.PVP) {
            this.level = 0;
            this.game.board.selectLevel(0, this.game.search);
            this.selectInfo.visible = false;
            this.game.board.newGame(SIDE.NONE);
        } else if (this.type == MatchType.MESS) {
            this.level = MessLevel;
            this.game.board.selectLevel(this.level, this.game.search);
            this.selectInfo.visible = false;
            this.game.board.newGame(SIDE.BLACK, MESS_DAT[this.game.user.getMessIndex()][1]);
        }
    }

    onHintBtnClick() {
        this.game.board.responseMove(true);
    }
}

