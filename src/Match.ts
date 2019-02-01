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

const Levels = [5, 7, 9, 11, 13, 15];
const MessLevel = 11;
const HintLevel = 11;

export class Match extends ui.MatchUI {
    private type: MatchType;
    private side: SIDE;
    private game: Game;
    private level: number;
    private hintLevel: number;

    constructor(game: Game, type: MatchType) {
        super();

        this.game = game;
        this.type = type;
        this.side = SIDE.NONE;

        this.menu.centerX = 0;
        // this.control.centerX = 0;

        this.undoBtn.on(laya.events.Event.CLICK, this, this.onUndoBtnClick);
        Game.addButtonEvent(this.undoBtn);

        this.defeatBtn.on(laya.events.Event.CLICK, this, this.onGiveupBtnClick);
        Game.addButtonEvent(this.defeatBtn);

        this.hintBtn.on(laya.events.Event.CLICK, this, this.onHintBtnClick);
        Game.addButtonEvent(this.hintBtn);

        this.historyBtn.on(laya.events.Event.CLICK, this, this.onHistoryBtnClick);
        Game.addButtonEvent(this.historyBtn);

        this.menuBtn.on(laya.events.Event.CLICK, this, this.onMenuBtnClick);
        Game.addButtonEvent(this.menuBtn);

        this.quitBtn.on(laya.events.Event.CLICK, this, this.onQuitBtnClick);
        Game.addButtonEvent(this.quitBtn);

        this.selectInfo.labels = "       江湖小虾,       后起之秀,       江湖少侠,       武林高手,       英雄豪杰,       一代宗师";
        this.selectInfo.selectedIndex = 0;
        this.selectInfo.selectHandler = new Laya.Handler(this, this.onSelectLevel, [this.selectInfo]);
        this.selectInfo.on(laya.events.Event.MOUSE_OVER, this, this.onComboxMouseOver, [this.selectInfo]);
        this.selectInfo.on(laya.events.Event.MOUSE_OUT, this, this.onComboxMouseOut, [this.selectInfo]);

        this.hintLevel = HintLevel;

        this.visible = false;
        this.control.visible = false;
        Laya.stage.addChild(this);
    }

    setHintLevel(level: number) {
        this.hintLevel = level;
    }

    getHintLevel() {
        return this.hintLevel;
    }

    setType(type: MatchType) {
        this.type = type;
    }

    onComboxMouseOver(comboBox: Laya.ComboBox) {
        comboBox.scale(1.05, 1.05);
    }

    onComboxMouseOut(comboBox: Laya.ComboBox) {
        comboBox.scale(1, 1);
    }

    onUndoBtnClick() {
        this.game.match.control.visible = false;
        this.game.board.undo();
    }

    showModal(title: string, content: string) {
		if (window['wx'] != undefined) {
            window['wx'].showModal({
                title: title,
                content: content,
                showCancel: false,
            })
        } else {
            alert(content);
        }
    }

    onHistoryBtnClick() {
        let history = this.game.user.getPveHistory(this.level);
        this.showModal("战绩", "总场: " + history[0] + " 胜: " + history[1] + " 平: " + history[2]);
    }

    onMenuBtnClick() {
        if (this.game.match.control.visible) {
            this.game.match.control.visible = false;
        } else {
            this.game.match.control.visible = true;
        }
    }

    onQuitBtnClick() {
        this.game.match.control.visible = false;
        this.game.login.visible = true;
        this.game.match.visible = false;
    }

    onGiveupBtnClick() {
        this.game.match.control.visible = false;
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
        this.visible = true;
        this.game.match.control.visible = false;

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
        this.game.match.control.visible = false;
        this.game.board.responseMove(true);
    }
}

