import {ui} from "./ui/layaMaxUI"
import {Game} from "./Game"
import {Situation, SQUARE_COUNT, ROW_X, COLUMN_Y, ROW_LEFT, ROW_RIGHT, COLUMN_TOP,
        TO_SRC, TO_DST, IN_BOARD, TO_MOVE, SQUARE_FLIP} from "./Situation"
import {Search, LIMIT_DEPTH} from "./Search"
import {WIN_VALUE} from "./Evaluate"
import {User} from "./User"
import {Sound, SOUND} from "./Sound"
import { Match } from "./Match";

export enum RESULT{
    UNKNOWN,
    WIN,
    DRAW,
    LOSS,
}

const SQUARE_SIZE = 80;
const TOP_GAP = 8;

const PIECE_NAME = [
	"oo", null, null, null, null, null, null, null,
	"rk", "ra", "rb", "rn", "rr", "rc", "rp", null,
	"bk", "ba", "bb", "bn", "br", "bc", "bp", null,
];

function SQ_X(sq) {
	return (ROW_X(sq) - 3) * SQUARE_SIZE;
}

function SQ_Y(sq) {
	return (COLUMN_Y(sq) - 3) * SQUARE_SIZE + TOP_GAP;
}

function alert(message: string) {
    console.log(message);
}

function alertDelay(message) {
    Laya.timer.once(250, this, alert, [message]); 
}

export enum SIDE {
    RED = 0,
    BLACK = 1,
    NONE = 2,
}

class Cell extends laya.ui.Image {
    sq: number;
    private img: laya.ui.Image;
    private board: Board;

    constructor(sq: number, board: Board) {
        super();

        this.height = SQUARE_SIZE;
        this.width = SQUARE_SIZE;
        this.board = board;
        this.setPos(sq);

        this.img = new laya.ui.Image();
        this.img.height = SQUARE_SIZE;
        this.img.width = SQUARE_SIZE;
        this.drawSquare();

        this.addChild(this.img);
        board.addChild(this);
    }

    setClickEvent(caller: any, listener: Function, args?: Array<any>) {
        this.img.on("click", caller, listener, args);
    }

    drawSquare() {
        let pieceName = this.board.getPieceName(this.sq);
        if (pieceName == undefined) pieceName = "oo";

        this.img.skin = "res/" + pieceName + ".png";
    }

    setPos(sq: number) {
        this.sq = sq;
        this.x = SQ_X(sq);
        this.y = SQ_Y(sq);
    }

    moveTo(sqDst: number, handler: laya.utils.Handler) {
        laya.utils.Tween.to(this, {x: SQ_X(sqDst), y: SQ_Y(sqDst)}, 100, null, handler);
    }

    swap(cellDst: Cell) {
        let tmp = cellDst.sq;
        cellDst.setPos(this.sq);
        this.setPos(tmp);
        cellDst.drawSquare();
    }

    selected(sel: boolean) {
        this.skin = sel ? "res/oos.png" : "res/oo.png";;
    }

    over() {
        this.img.skin = "res/" + (this.board.getController() == 0 ? "r" : "b") + "km.png";
    }
}

export class Board  extends ui.BoardUI {
    private situation: Situation;
    private search: Search;
    private cells: Array<Cell>;
    private busy: boolean;
    private result: RESULT;
    private lastMove: number;
    private computer: number;
    private selected: number;
    private resultImg: laya.ui.Image;
    private msecLimit: number;
    private hintLevel: number;
    private level: number;
	private	game: Game;

    constructor(game: Game) {
        super();
        
        this.centerX = 0;
        this.centerY = 0;
        this.msecLimit = 10000;
        this.search = null;
        this.computer = SIDE.NONE;
        this.selected = 0;
        this.busy = false;
        this.lastMove = 0;
        this.result = RESULT.UNKNOWN;
        this.game = game;
        this.situation = game.situation;
        this.cells = new Array<Cell>(SQUARE_COUNT);

        this.resultImg = new laya.ui.Image("res/win.png");
        this.resultImg.centerX = 0;
        this.resultImg.centerY = 0;
        this.resultImg.visible = false;
        this.resultImg.zOrder = 10;
        this.addChild(this.resultImg);

        this.initCells();
    }

    selectLevel(level: number, search: Search) {
        this.level = level;
        this.msecLimit = this.genLevelMsec(level);
        this.setSearch(search);
    }

    genLevelMsec(level: number): number {
        return Math.pow(2, level);
    }

    setHintLevel(hintLevel: number) {
        this.hintLevel = hintLevel;
    }

    setSearch(search: Search) {
        this.search = search;
        this.situation.search = this.search;
    }

    newGame(computer : SIDE, fen ?: string) {
        this.computer = computer;
        this.result = RESULT.UNKNOWN;
        this.situation.init(fen);
        this.flushBoard();
        //this.response();
    }

    flushBoard() {
        this.lastMove = this.situation.getLastMoveInfo().move;

        for (let i = 0; i < 10; i++) {
            let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
            let sqEnd = sqStart + 9;
            for (let sq = sqStart; sq < sqEnd; sq++) {
                let cell = this.cells[sq];
                cell.drawSquare();
                cell.selected(sq == TO_SRC(this.lastMove) || sq == TO_DST(this.lastMove))
                //this.drawSquare(sq, sq == TO_SRC(this.lastMove) || sq == TO_DST(this.lastMove));
            }
        }
    }

    getPieceName(sq: number): string {
        let piece = this.situation.getPiece(sq);
        return PIECE_NAME[piece];
    }

    getController(): number {
        return this.situation.controller;
    }

    swapCell(cellSrc: Cell, cellDst: Cell) {
        this.cells[cellSrc.sq] = cellDst;
        this.cells[cellDst.sq] = cellSrc;
        cellSrc.swap(cellDst);
    }

    initCells() {
        for (let sq = 0; sq < SQUARE_COUNT; sq++) {
            if (!IN_BOARD(sq)) {
                this.cells[sq] = null;
                continue;
            }

            let cell = new Cell(sq, this);
            cell.setClickEvent(this, this.onCellClick, [cell]);
            this.cells[sq] = cell;
        }
    }

    restartGame() {
        this.resultImg.visible = false;
        this.game.login.startGame();
    }

    showResult(result: RESULT, msg: string) {
        if (result == RESULT.WIN) {
            this.resultImg.skin =  "res/win.png";
            this.game.sound.playEffect(SOUND.WIN);
        } else if (result == RESULT.LOSS) {
            this.resultImg.skin =  "res/lose.png";
            this.game.sound.playEffect(SOUND.LOSS);
        } else if (result == RESULT.DRAW) {
            this.resultImg.skin =  "res/draw.png";
            this.game.sound.playEffect(SOUND.DRAW);
        }    

        this.busy = false;
        this.result = result;
        this.resultImg.visible = true;
        
        this.game.user.setPveHistory(this.level, result)

        Laya.timer.once(1000, this, this.restartGame);
        alertDelay(msg);
    }

    onCellClick(cell: Cell) {
        if (this.busy || this.result != RESULT.UNKNOWN) {
            return;
        }

        let sq = this.flipped(cell.sq);
        if (this.situation.isSelfPiece(sq)) {
            this.game.sound.playEffect(SOUND.CLICK);

            this.clearMoveHint();

            if (this.selected) {
                this.setMoveCursor(this.selected, false);
            }
            
            this.setMoveCursor(sq, true);
            this.selected = sq;
        } else if (this.selected > 0) {
            // console.log("plyer move: ",  Laya.Browser.now(), this.situation.getMoveCount(), this.selected, sq);
            this.addMove(TO_MOVE(this.selected, sq), false);
        }
    }

    setMoveCursor(sq: number, selected: boolean) {
        let cell = this.cells[this.flipped(sq)];
        cell.selected(selected);
    }

    setMoveHint(move: number) {
        this.setMoveCursor(TO_SRC(move), true);
        this.setMoveCursor(TO_DST(move), true);
    }

    clearMoveHint() {
        if (this.lastMove != 0) {
            this.setMoveCursor(TO_SRC(this.lastMove), false);
            this.setMoveCursor(TO_DST(this.lastMove), false);
        }
    }

    flipped(sq: number): number {
        return this.computer == 0 ? SQUARE_FLIP(sq) : sq;
    }

    computerMove(): boolean {
        return this.situation.controller == this.computer;
    }
    
    addMove(move: number, computer: boolean) {
        if (!this.situation.legalMove(move)) {
            return;
        }

        if (!this.situation.makeMove(move)) {
            this.game.sound.playEffect(SOUND.ILLEGAL);
            return;
        }

        this.busy = true;

        let sqSrc = this.flipped(TO_SRC(move));
        let sqDst = this.flipped(TO_DST(move));
        let cell = this.cells[sqSrc];
        let handler = Laya.Handler.create(this, this.onMoveComplete, [cell, sqDst, move, computer]);
        cell.moveTo(sqDst, handler);
    }

    onMoveComplete(cell: Cell, sqDst: number, move: number, computer: boolean) {
        let cellDst = this.cells[sqDst];
        this.swapCell(cell, cellDst);
        
        this.postAddMove(move, computer);
    }

    private checkmate(computer: boolean): boolean {
        if (this.situation.checkmate()) {
            this.game.sound.playEffect(computer ? SOUND.LOSS : SOUND.WIN);
            this.result = computer ? RESULT.LOSS : RESULT.WIN;

            let mateSq = this.situation.getKingSq();
            if (mateSq == 0) {
                this.gameover(computer);
                return true;
            }

            mateSq = this.flipped(mateSq);
            let cell = this.cells[mateSq];
            cell.over();
            this.gameover(computer);

            return true;
        }

        return false;
    }

    checkRepStatus(computer: boolean): boolean {
        let repValue = this.situation.repStatus(3);
        if (repValue > 0) {
            repValue = this.search.evaluate.repValue(repValue);
            if (repValue > -WIN_VALUE && repValue < WIN_VALUE) {
                this.showResult(RESULT.DRAW, "双方不变作和，辛苦了！");
            } else if (computer == (repValue < 0)) {
                this.showResult(RESULT.LOSS, "长将作负，请不要气馁！");
            } else {
                this.showResult(RESULT.WIN, "长将作负，祝贺你取得胜利！");
            }

            return true;
        }

        return false
    }

    tooLong(): boolean {
        // if (this.situation.getMoveCount() <= 100) {
        //     return false;
        // }

        // for (let i = 2; i <= 100; i ++) {
        //     if (!this.situation.captured(i)) {
        //         this.showResult(RESULT.DRAW, "超过自然限着作和，辛苦了！");
        //         return true;
        //     }
        // }

        return false;
    }

    postAddMove(move: number, computer: boolean) {
        this.clearMoveHint();
        this.setMoveHint(move);

        this.selected = 0;
        this.lastMove = move;

        if (this.checkmate(computer)) {
            return;
        }

        if (this.checkRepStatus(computer)) {
            return;
        }

        if (this.situation.captured()) {
            if (!this.situation.canFight()) {
                this.showResult(RESULT.DRAW, "双方都没有进攻棋子了，辛苦了！");
                return;
            }
        } else if (this.tooLong()) {
            return;
        }

        if (this.situation.inCheck()) {
            this.game.sound.playEffect(SOUND.CHECK);
        } else if (this.situation.captured()) {
            this.game.sound.playEffect(SOUND.CAPTURE);
        } else {
            this.game.sound.playEffect(SOUND.MOVE);
        }

        this.response();
    }

    responseMove(hint = false) {
        let msecLimit : number;
        if (hint) {
            msecLimit = this.genLevelMsec(this.hintLevel);
        } else {
            msecLimit = this.msecLimit;
        }

        let ret = this.search.searchMain(LIMIT_DEPTH, msecLimit);
        this.addMove(ret, true);
    }

    response() {
        if (this.search == null || !this.computerMove()) {
            this.busy = false;
            return;
        }

        let this_ = this;
        this.busy = true;

        // console.log("response: ", this.situation.getMoveCount() , Laya.timer.delta, Laya.Browser.now());
        Laya.timer.once(500, this, this.responseMove); 
    }

    gameover(computer: boolean) {
        this.showResult(computer? RESULT.LOSS: RESULT.WIN, computer ? "请再接再厉！" : "祝贺你取得胜利！");
    }

    undo() {
        if (this.busy) {
            return;
        }
        
        this.result = RESULT.UNKNOWN;
        if (this.situation.getMoveCount() > 1) {
            this.situation.undoMakeMove();
        }

        if (this.situation.getMoveCount() > 1 && this.computerMove()) {
            this.situation.undoMakeMove();
        }

        this.flushBoard();
        this.response();
    }

}



