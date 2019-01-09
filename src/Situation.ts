import { Search } from './Search'
import { Zobrist, g_playerZobr, g_tableZobr } from './Zobrist'
import { Game } from './Game'
import { Evaluate, FIRST_VALUE, PIECE_VALUE, mvvLva } from './Evaluate'

export const SQUARE_COUNT = 256;
const MAX_MOVES = 256;
export const PIECE_COUNT = 14;

enum PIECE_CODE {
    KING,     // 王
    ADVISOR,  // 士
    BISHOP,   // 象
    KNIGHT,   // 马
    ROOK,     // 车
    CANNON,   // 炮
    PAWN,     // 卒
}

export const ROW_LEFT = 3;
export const ROW_RIGHT = 11;
export const COLUMN_TOP = 3;
export const COLUMN_BOTTOM = 12;
const FEN_PIECE = "        KABNRCP kabnrcp ";

const IN_BOARD_ = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// 棋盘左右镜像的映射数组
const BOARD_MIRROR = [
  0, 0, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0, 0, 0, 0, 0,
  0, 0, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0, 0, 0, 0, 0,
  0, 0, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0, 0, 0, 0, 0,
  0, 0, 0, 0x3b, 0x3a, 0x39, 0x38, 0x37, 0x36, 0x35, 0x34, 0x33, 0, 0, 0, 0,
  0, 0, 0, 0x4b, 0x4a, 0x49, 0x48, 0x47, 0x46, 0x45, 0x44, 0x43, 0, 0, 0, 0,
  0, 0, 0, 0x5b, 0x5a, 0x59, 0x58, 0x57, 0x56, 0x55, 0x54, 0x53, 0, 0, 0, 0,
  0, 0, 0, 0x6b, 0x6a, 0x69, 0x68, 0x67, 0x66, 0x65, 0x64, 0x63, 0, 0, 0, 0,
  0, 0, 0, 0x7b, 0x7a, 0x79, 0x78, 0x77, 0x76, 0x75, 0x74, 0x73, 0, 0, 0, 0,
  0, 0, 0, 0x8b, 0x8a, 0x89, 0x88, 0x87, 0x86, 0x85, 0x84, 0x83, 0, 0, 0, 0,
  0, 0, 0, 0x9b, 0x9a, 0x99, 0x98, 0x97, 0x96, 0x95, 0x94, 0x93, 0, 0, 0, 0,
  0, 0, 0, 0xab, 0xaa, 0xa9, 0xa8, 0xa7, 0xa6, 0xa5, 0xa4, 0xa3, 0, 0, 0, 0,
  0, 0, 0, 0xbb, 0xba, 0xb9, 0xb8, 0xb7, 0xb6, 0xb5, 0xb4, 0xb3, 0, 0, 0, 0,
  0, 0, 0, 0xcb, 0xca, 0xc9, 0xc8, 0xc7, 0xc6, 0xc5, 0xc4, 0xc3, 0, 0, 0, 0,
  0, 0, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0, 0, 0, 0, 0,
  0, 0, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0, 0, 0, 0, 0,
  0, 0, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0, 0, 0, 0, 0,
];

// 棋盘初始设置
const INITIAL_BOARD_ = [
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0, 20, 19, 18, 17, 16, 17, 18, 19, 20,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0, 21,  0,  0,  0,  0,  0, 21,  0,  0,  0,  0,  0,
  0,  0,  0, 22,  0, 22,  0, 22,  0, 22,  0, 22,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0, 14,  0, 14,  0, 14,  0, 14,  0, 14,  0,  0,  0,  0,
  0,  0,  0,  0, 13,  0,  0,  0,  0,  0, 13,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0, 12, 11, 10,  9,  8,  9, 10, 11, 12,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0
];

const IN_FORT_ = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// 合理位置
const LEGAL_SPAN = [
    3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
    0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
    0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
    0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
    3, 0, 0, 0, 3,
]

const LEGAL_SPAN_BASE = (LEGAL_SPAN.length - 1) / 2;

// 马腿位置
const KNIGHT_PIN_ = [
    -16,  0,-16,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, -1,  
      0,  0,  0,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  
      0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, -1,  
      0,  0,  0,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 
     16,  0, 16, 
]

const KNIGHT_PIN_BASE = (KNIGHT_PIN_.length - 1) / 2;

const KING_STEP = [-16, -1, 1, 16];
const ADVISOR_STEP = [-17, -15, 15, 17];
const KNIGHT_STEP = [[-33, -31], [-18, 14], [-14, 18], [31, 33]];
const KNIGHT_CHECK_STEP = [[-33, -18], [-31, -14], [14, 31], [18, 33]];

export function IN_BOARD(sq) {
    return IN_BOARD_[sq] != 0;
}

function IN_FORT(sq) {
    return IN_FORT_[sq] != 0;
}

export function SQUARE_FLIP(sq) {
    return 254 - sq;
}

function ROW_FLIP(x) {
    return 14 - x;
}

function COLUMN_FLIP(y) {
    return 15 - y;
}

function SQUARE_FORWARD(sq, ctrl) {
    return sq - 16 + (ctrl << 5);
}

function KING_SPAN(sqSrc, sqDst) {
    let spanIndex = sqDst - sqSrc + LEGAL_SPAN_BASE;
    return spanIndex >= 0 ? LEGAL_SPAN[spanIndex] == 1 : false;
}

function ADVISOR_SPAN(sqSrc, sqDst) {
    let spanIndex = sqDst - sqSrc + LEGAL_SPAN_BASE;
    return spanIndex >= 0 ? LEGAL_SPAN[spanIndex] == 2 : false;
}

function BISHOP_SPAN(sqSrc, sqDst) {
    let spanIndex = sqDst - sqSrc + LEGAL_SPAN_BASE;
    return spanIndex >= 0 ? LEGAL_SPAN[spanIndex] == 3 : false;
}

function BISHOP_PIN(sqSrc, sqDst) {
    return (sqSrc + sqDst) >> 1;
}

function KNIGHT_PIN(sqSrc, sqDst) {
    let spinIndex = sqDst - sqSrc + KNIGHT_PIN_BASE;
    return spinIndex >= 0 ? sqSrc + KNIGHT_PIN_[spinIndex] : 0
}

export function OWN_AREA(sq, ctrl) {
    return (sq & 0x80) != (ctrl << 7);
}

function OPP_AREA(sq, ctrl) {
    return (sq & 0x80) == (ctrl << 7);
}

function SAME_AREA(sqSrc, sqDst) {
    return ((sqSrc ^ sqDst) & 0x80) == 0;
}

function SAME_COLUMN(sqSrc, sqDst) {
    return ((sqSrc ^ sqDst) & 0xf0) == 0;
}

function SAME_ROW(sqSrc, sqDst) {
    return ((sqSrc ^ sqDst) & 0x0f) == 0;
}

function PIECE_BASE(ctrl) {
    return 8 + (ctrl << 3);
}

function OPP_PIECE_BASE(ctrl) {
    return 16 - (ctrl << 3);
}

export function COLUMN_Y(sq) {
    return sq >> 4;
}

export function ROW_X(sq) {
    return sq & 15;
}

function COORD_XY(x, y) {
    return x + (y << 4);
}

export function TO_SRC(move) {
    return move & 255;
}

export function TO_DST(move) {
    return move >> 8;
}

export function TO_MOVE(sqSrc, sqDst) {
    return sqSrc + (sqDst << 8);
}

export function MIRROR_MOVE(move) {
    return TO_MOVE(BOARD_MIRROR[TO_SRC(move)], BOARD_MIRROR[TO_DST(move)]);
}

class MoveInfo {
    move: number;
    key: number;
    captured: number;
    checked: boolean;

    constructor() {
        this.move = 0;
        this.key = 0;
        this.captured = 0;
        this.checked = false;
    }

    set(move: number, key: number, captured: number, checked: boolean) {
        this.move = move;
        this.key = key;
        this.captured = captured;
        this.checked = checked;
    }
}

const ADD_PIECE = false;
const DEL_PIECE = true;

export class Situation {
    private squares: Array<number>;
    private moveInfoList: Array<MoveInfo>;
    private moveInfoCount: number;
    private whiteValue: number;
    private blackValue: number;
    private whiteKing: number;
    private blackKing: number;
    private game: Game;
    search: Search;
    controller: number;
    zobr: Zobrist;
    depth: number;
    
    constructor() {
        this.squares = new Array<number>(SQUARE_COUNT);
        this.moveInfoList = new Array<MoveInfo>(MAX_MOVES);
        for (let i = 0; i < MAX_MOVES; i++) {
            this.moveInfoList[i] = new MoveInfo();
        }

        this.initSquares();
        
        this.zobr = new Zobrist();
    }

    bindGame(game: Game) {
        this.game = game;
    }

    clear() {
        this.whiteValue = this.blackValue = this.controller = 0;
        this.depth = this.moveInfoCount = this.whiteKing = this.blackKing = 0;

        this.zobr.init();
    };

    initSquares() {
        for (let sq = 0; sq < SQUARE_COUNT; sq++) {
            this.squares[sq] = 0;
        }
    }

    init(fen ?: string) {
        this.clear();

        if (fen != undefined) {
            let piece: number;
            for(let i = 0; i < 10; i++) {
                let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
                let sqEnd = sqStart + 9;
                for (let sqSrc = sqStart; sqSrc < sqEnd; sqSrc++) {
                    this.squares[sqSrc] = 0;
                }
            }

            this.fromFen(fen);
        } else {
            let piece: number;
            for(let i = 0; i < 10; i++) {
                let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
                let sqEnd = sqStart + 9;
                for (let sqSrc = sqStart; sqSrc < sqEnd; sqSrc++) {
                    this.squares[sqSrc] = 0;
                    piece = INITIAL_BOARD_[sqSrc];
                    if (piece != 0) {
                        this.addPiece(sqSrc, piece);
                    }
                }
            }
        }

        this.clearMoveInfos();
    }

    showAll() {
        if (!this.game.debug) {
            return;
        }

        for(let i = 0; i < 10; i++) {
            let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
            let sqEnd = sqStart + 9;
            let line = "";
            for (let sqSrc = sqStart; sqSrc < sqEnd; sqSrc++) {
                let pieceSrc = this.squares[sqSrc];
                if (pieceSrc > 9) {
                    line += pieceSrc + " ";
                } else {
                    line += pieceSrc + "  ";
                }   
            }

            console.log(line);
        }

        console.log("\n");
    }

    // 获得控制方价值
    controllerValue(): number {
        return this.controller == 0 ? this.whiteValue : this.blackValue;
    }

    // 获得控制方与对方价值差
    controllerValueDiff(): number {
        return (this.controller == 0 ? this.whiteValue - this.blackValue : this.blackValue - this.whiteValue) + FIRST_VALUE;
    }

    toSrcSq(move: number): number {
        return this.squares[TO_SRC(move)]
    }

    toDstSq(move: number): number {
        return this.squares[TO_DST(move)]
    }

    isSelfPiece(sq: number): boolean {
        let piece = this.squares[sq];
        return (piece & PIECE_BASE(this.controller)) != 0
    }

    getPiece(sq: number): number {
        return this.squares[sq];
    }

    // 获得将的位置
    getKingSq(): number {
        return this.controller == 0 ? this.whiteKing : this.blackKing;
    }

    captured(index = 1): number {
        return this.moveInfoList[this.moveInfoCount - index].captured;
    }

    getMoveCount(): number {
        return this.moveInfoCount;
    }

     // 清空历史走法信息
    private clearMoveInfos() {
        this.moveInfoCount = 1;
        this.moveInfoList[0].set(0, 0, 0, false);
    }

    // 加入一个历史走法
    private pushMoveInfo(move: number, key: number, captured: number, checked: boolean) {
        this.moveInfoList[this.moveInfoCount++].set(move, key, captured, checked);
    }

    // 取出一个历史走法
    private popMoveInfo(): MoveInfo {
        return this.moveInfoList[--this.moveInfoCount];
    }

    getLastMoveInfo(): MoveInfo {
        return this.moveInfoList[this.moveInfoCount - 1];
    }

    // 换手
    private changeSide() {
        this.controller = 1 - this.controller;
        this.zobr.xor(g_playerZobr);
    }

    // 在棋盘上放一枚棋子, 并改变价值
    private addPiece(sq: number, piece: number, del = false) {
        this.squares[sq] = del ? 0 : piece;

        let pieceCode = 0;
        if (piece < 16) {
            pieceCode = piece - 8;
            if (pieceCode == PIECE_CODE.KING) {
                this.whiteKing = sq;
            }
            this.whiteValue += del ? -PIECE_VALUE[pieceCode][sq] : PIECE_VALUE[pieceCode][sq];
        } else {
            pieceCode = piece - 16;
            if (pieceCode == PIECE_CODE.KING) {
                this.blackKing = sq;
            }
            this.blackValue += del ? -PIECE_VALUE[pieceCode][SQUARE_FLIP(sq)] : PIECE_VALUE[pieceCode][SQUARE_FLIP(sq)];
            pieceCode += 7;
        }

        this.zobr.xor(g_tableZobr[pieceCode][sq]);
    }

    private movePiece(mv: number): number {
        let sqSrc = TO_SRC(mv);
        let sqDst = TO_DST(mv);

        let captured = this.squares[sqDst];
        if (captured > 0) {
            this.addPiece(sqDst, captured, DEL_PIECE);
        }

        let piece = this.squares[sqSrc];
        this.addPiece(sqSrc, piece, DEL_PIECE);
        this.addPiece(sqDst, piece, ADD_PIECE);
        
        return captured;
    }

    private undoMovePiece(move: number, captured: number) {
        let sqSrc = TO_SRC(move);
        let sqDst = TO_DST(move);
        let piece = this.squares[sqDst];
        this.addPiece(sqDst, piece, DEL_PIECE);
        this.addPiece(sqSrc, piece, ADD_PIECE);

        if (captured > 0) {
            this.addPiece(sqDst, captured, ADD_PIECE);
        }
    }

    // 走一步棋
    makeMove(move: number): boolean {
        let key = this.zobr.key;
        let captured = this.movePiece(move);
        if (this.checked()) {
            this.undoMovePiece(move, captured);
            return false;
        }

        this.changeSide();

        this.pushMoveInfo(move, key, captured, this.checked());
        this.depth++;

        //console.log("makeMove ", TO_SRC(move), " ---> ",TO_DST(move), this.depth);
        this.showAll();

        return true;
    }

    // 撤消搬一步棋
    undoMakeMove() {
        this.changeSide();

        this.depth--;
        let moveInfo = this.popMoveInfo();
        this.undoMovePiece(moveInfo.move, moveInfo.captured);

        //console.log("undoMakeMove ", TO_SRC(moveInfo.move), " ---> ",TO_DST(moveInfo.move), this.depth);
        this.showAll();
    }

    // 走一步空步
    nullMove() {
        let key = this.zobr.key;
        this.changeSide();

        this.pushMoveInfo(0, key, 0, false);
        this.depth++;
    }

    // 撤消走一步空步
    undoNullMove() {
        this.depth--;
        this.popMoveInfo();
        this.changeSide();
    }

    private commonMovesValues(moves: Array<number>, values: Array<number>, sqSrc: number, sqDst: number, pieceBase: number, oppPieceBase: number, capture: boolean) {
        let move = TO_MOVE(sqSrc, sqDst); 
        let pieceDst = this.squares[sqDst];
        if (!capture) {
            if ((pieceDst & pieceBase) == 0) {
                moves.push(move);
                if (values != null) {
                    values.push(this.search.getHistory(move));
                }
            }
        } else if ((pieceDst & oppPieceBase) != 0) {
            moves.push(move);
            values.push(mvvLva(this, sqDst, sqSrc));
        }
    }

    private kingMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        for (let i = 0; i < 4; i++) {
            let sqDst = sqSrc + KING_STEP[i];
            if (!IN_FORT(sqDst)) {
                continue;
            }
            
            this.commonMovesValues(moves, values, sqSrc, sqDst, pieceBase, oppPieceBase, capture);
        }
    }

    private advisorMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        for (let i = 0; i < 4; i++) {
            let sqDst = sqSrc + ADVISOR_STEP[i];
            if (!IN_FORT(sqDst)) {
                continue;
            }

            this.commonMovesValues(moves, values, sqSrc, sqDst, pieceBase, oppPieceBase, capture);
        }
    }

    private bishopMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        for (let i = 0; i < 4; i ++) {
            let sqDst = sqSrc + ADVISOR_STEP[i];
            if (!(IN_BOARD(sqDst) && OWN_AREA(sqDst, this.controller) && this.squares[sqDst] == 0)) {
                continue;
            }

            sqDst += ADVISOR_STEP[i];
            this.commonMovesValues(moves, values, sqSrc, sqDst, pieceBase, oppPieceBase, capture);
        }
    }

    private knightMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        for (let i = 0; i < 4; i ++) {
            let sqDst = sqSrc + KING_STEP[i];
            if (this.squares[sqDst] > 0) {
                continue;
            }

            for (let j = 0; j < 2; j ++) {
                sqDst = sqSrc + KNIGHT_STEP[i][j];
                if (!IN_BOARD(sqDst)) {
                    continue;
                }

                this.commonMovesValues(moves, values, sqSrc, sqDst, pieceBase, oppPieceBase, capture);
            }
        }
    }

    private rookMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        for (let i = 0; i < 4; i ++) {
            let step = KING_STEP[i];
            let sqDst = sqSrc + step;
            while (IN_BOARD(sqDst)) {
                let pieceDst = this.squares[sqDst];
                if (pieceDst == 0) {
                    if (!capture) {
                        let move = TO_MOVE(sqSrc, sqDst); 
                        moves.push(move);
                        if (values != null) {
                            values.push(this.search.getHistory(move));
                        }
                    }
                } else {
                    if ((pieceDst & oppPieceBase) != 0) {
                        let move = TO_MOVE(sqSrc, sqDst); 
                        moves.push(move);
                        if (values != null) {
                            values.push(mvvLva(this, sqDst, sqSrc));
                        }
                    }``
                    break;
                }
                sqDst += step;
            }
        }
    }

    private cannonMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        for (let i = 0; i < 4; i ++) {
            let step = KING_STEP[i];
            let sqDst = sqSrc + step;
            while (IN_BOARD(sqDst)) {
                let pieceDst = this.squares[sqDst];
                if (pieceDst != 0) {
                     break;
                }

                let move = TO_MOVE(sqSrc, sqDst);
                if (!capture) {
                    let move = TO_MOVE(sqSrc, sqDst); 
                    moves.push(move);
                    if (values != null) {
                        values.push(this.search.getHistory(move));
                    }
                }

                sqDst += step;
            }

            sqDst += step;
            while (IN_BOARD(sqDst)) {
                let pieceDst = this.squares[sqDst];
                if (pieceDst > 0) {
                    if ((pieceDst & oppPieceBase) != 0) {
                        let move = TO_MOVE(sqSrc, sqDst); 
                        moves.push(move);
                        if (values != null) {
                            values.push(mvvLva(this, sqDst, sqSrc));
                        }
                    }
                    break;
                }

                sqDst += step;
            }
        }
    }

    private pawnMoves(sqSrc: number, moves: Array<number>, values: Array<number>, pieceBase: number, oppPieceBase: number, capture: boolean) {
        let sqDst = SQUARE_FORWARD(sqSrc, this.controller);
        if (!IN_BOARD(sqDst)) {
            return;
        }

        this.commonMovesValues(moves, values, sqSrc, sqDst, pieceBase, oppPieceBase, capture);

        if (!OPP_AREA(sqSrc, this.controller)) {
            return; 
        }

        for (let step = -1; step <= 1; step += 2) {
            sqDst = sqSrc + step;
            if (IN_BOARD(sqDst)) {
                this.commonMovesValues(moves, values, sqSrc, sqDst, pieceBase, oppPieceBase, capture);
            }
        }
    }

    // 生成所有走法，如果"capture"为"true"则只生成吃子走法
    genMoves(values: Array<number>, capture = false) : Array<number> {
        let moves = new Array<number>();
        let pieceBase = PIECE_BASE(this.controller);
        let oppPieceBase = OPP_PIECE_BASE(this.controller);
        // 生成所有走法，需要经过以下几个步骤：

        for(let i = 0; i < 10; i++) {
            let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
            let sqEnd = sqStart + 9;
            for (let sqSrc = sqStart; sqSrc < sqEnd; sqSrc++) {
                // 1. 找到一个本方棋子，再做以下判断：
                let pieceSrc = this.squares[sqSrc];
                if ((pieceSrc & pieceBase) == 0) {
                    continue;
                }

                // 2. 根据棋子确定走法
                let pieceNo = pieceSrc - pieceBase;
                switch (pieceNo) {
                    case PIECE_CODE.KING:
                        this.kingMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    case PIECE_CODE.ADVISOR:
                        this.advisorMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    case PIECE_CODE.BISHOP:
                        this.bishopMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    case PIECE_CODE.KNIGHT:
                        this.knightMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    case PIECE_CODE.ROOK:
                        this.rookMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    case PIECE_CODE.CANNON:
                        this.cannonMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    case PIECE_CODE.PAWN:
                        this.pawnMoves(sqSrc, moves, values, pieceBase, oppPieceBase, capture);
                        break;
                    default:
                        console.error("error piece no: ", pieceNo);
                }
            }
        }

        return moves;
    }

    // 判断走法是否合理
    legalMove(move: number): boolean {
        // 判断走法是否合法，需要经过以下的判断过程：
        
        // 1. 判断起始格是否有自己的棋子
        let sqSrc = TO_SRC(move);
        let pieceSrc = this.squares[sqSrc];
        let pieceBase = PIECE_BASE(this.controller);
        if ((pieceSrc & pieceBase) == 0) {
            return false;
        }

        // 2. 判断目标格是否有自己的棋子
        let sqDst = TO_DST(move);
        let pieceDst = this.squares[sqDst];
        if ((pieceDst & pieceBase) != 0) {
            return false;
        }

        // 3. 根据棋子的类型检查走法是否合理
        let pieceNo = pieceSrc - pieceBase
        switch (pieceNo) {
            case PIECE_CODE.KING:
                return IN_FORT(sqDst) && KING_SPAN(sqSrc, sqDst);
            case PIECE_CODE.ADVISOR:
                return IN_FORT(sqDst) && ADVISOR_SPAN(sqSrc, sqDst);
            case PIECE_CODE.BISHOP:
                return SAME_AREA(sqSrc, sqDst) && BISHOP_SPAN(sqSrc, sqDst) && this.squares[BISHOP_PIN(sqSrc, sqDst)] == 0;
            case PIECE_CODE.KNIGHT:
                let sqPin = KNIGHT_PIN(sqSrc, sqDst);
                return sqPin != 0 && this.squares[sqPin] == 0;
            case PIECE_CODE.ROOK:
            case PIECE_CODE.CANNON:
                let step;
                if (SAME_COLUMN(sqSrc, sqDst)) {
                    step = (sqDst < sqSrc ? -1 : 1);
                } else if (SAME_ROW(sqSrc, sqDst)) {
                    step = (sqDst < sqSrc ? -16 : 16);
                } else {
                    return false;
                }

                let sq = sqSrc + step;
                while (sq != sqDst && this.squares[sq] == 0) {
                    sq += step;
                }

                if (sq == sqDst) {
                    // 途中无子阻挡的炮，车走法
                    return pieceDst == 0 || pieceSrc - pieceBase == PIECE_CODE.ROOK;
                }
                
                // 验证炮吃子走法
                if (pieceDst == 0 || pieceSrc - pieceBase != PIECE_CODE.CANNON) {
                    return false;
                }

                sq += step;
                while (sq != sqDst && this.squares[sq] == 0) {
                    sq += step;
                }

                return sq == sqDst;
            case PIECE_CODE.PAWN:
                if (OPP_AREA(sqDst, this.controller) && (sqDst == sqSrc - 1 || sqDst == sqSrc + 1)) {
                    return true;
                }

                return sqDst == SQUARE_FORWARD(sqSrc, this.controller);
            default:
                return false;
        }
    }

    // 判断是否被将军
    checked(): boolean {
        let pieceBase = PIECE_BASE(this.controller);
        let oppPieceBase = OPP_PIECE_BASE(this.controller);

        let sqSrc = this.controller == 0 ? this.whiteKing : this.blackKing;

        // 找到棋盘上的王
        if (this.squares[sqSrc] != pieceBase + PIECE_CODE.KING) {
            this.showAll();
            console.error("king pos error! ", sqSrc, this.squares[sqSrc]);
            console.assert(false);
        }

        // 1. 是否被卒将军
        // 正前是否有卒
        if (this.squares[SQUARE_FORWARD(sqSrc, this.controller)] == oppPieceBase + PIECE_CODE.PAWN) {
            return true;
        }

        // 左右是否有卒
        for (let step = -1; step <= 1; step  += 2) {
            if (this.squares[sqSrc + step] == oppPieceBase + PIECE_CODE.PAWN) {
                return true;
            }
        }

        // 2. 是否被马将军
        for (let i = 0; i < 4; i++) {
            // 以士的步长当作马腿
            if (this.squares[sqSrc + ADVISOR_STEP[i]] != 0) {
                continue;
            }

            for (let j = 0; j < 2; j ++) {
                let pieceDst = this.squares[sqSrc + KNIGHT_CHECK_STEP[i][j]];
                if (pieceDst == oppPieceBase + PIECE_CODE.KNIGHT) {
                    return true;
                }
            }
        }

        // 3. 是否被王,车,炮将军
        for (let i = 0; i < 4; i++) {
            let step = KING_STEP[i];
            let sqDst = sqSrc + step;
            // 车，王
            while (IN_BOARD(sqDst)) {
                let pieceDst = this.squares[sqDst];
                if (pieceDst > 0) {
                    if (pieceDst == oppPieceBase + PIECE_CODE.ROOK || pieceDst == oppPieceBase + PIECE_CODE.KING) {
                        return true;
                    }
                    break;
                }
                sqDst += step;
            }

            // 炮
            sqDst += step;
            while (IN_BOARD(sqDst)) {
                let pieceDst = this.squares[sqDst];
                if (pieceDst > 0) {
                    if (pieceDst == oppPieceBase + PIECE_CODE.CANNON) {
                        return true;
                    }
                    break;
                }
                sqDst += step;
            }
        }

        return false;
    }

    inCheck(): boolean {
        return this.moveInfoList[this.moveInfoCount - 1].checked;
    }

    // 是否被将死
    checkmate(): boolean {
        let moves = this.genMoves(null);
        for (let i = 0; i < moves.length; i++) {
            if (this.makeMove(moves[i])) {
                this.undoMakeMove();
                return false;
            }
        }
        
        return true;
    }

    // 检测重复局面
    repStatus(limit: number): number {
        let side = 1 - this.controller;
        let perpCheck = true;
        let oppPerpCheck = true;
        let index = this.moveInfoCount - 1;

        let moveInfo = this.moveInfoList[index];
        while (moveInfo.move > 0 && moveInfo.captured == 0) {
            if (side == this.controller) {
                perpCheck = perpCheck && moveInfo.checked;
                if ((moveInfo.key == this.zobr.key) && (--limit == 0)) {
                    return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0);
                }
            } else {
                oppPerpCheck = oppPerpCheck && moveInfo.checked;
            }

            side = 1 - side;
            moveInfo = this.moveInfoList[--index];
        }

        return 0;
    }

    canFight(): boolean {
        for(let i = 0; i < 10; i++) {
            let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
            let sqEnd = sqStart + 9;
            for (let sq = sqStart; sq < sqEnd; sq++) {
                if ((this.squares[sq] & 7) > 2) {
                    return true;
                }
            }
        }

        return false;
    }
    
    mirror(): Situation {
        let situation = new Situation();
        this.bindGame(this.game);
        situation.clear();

        for(let i = 0; i < 10; i++) {
            let sqStart = (ROW_LEFT + COLUMN_TOP * 16) + 16 * i;
            let sqEnd = sqStart + 9;
            for (let sq = sqStart; sq < sqEnd; sq++) {
                let piece = this.squares[sq];
                if (piece > 0) {
                    situation.addPiece(BOARD_MIRROR[sq], piece);
                }
            }
        }

        if (this.controller == 1) {
            situation.changeSide();
        }

        return situation;
    }

    //http://www.icanju.cn/cjtx/SrcShow.asp?Src_ID=6784
    chr(n: number) : string {
        return String.fromCharCode(n);
    }

    asc(c: string) : number {
        return c.charCodeAt(0);
    }

    charToPiece(c: string) {
        switch (c) {
        case "K":
            return PIECE_CODE.KING;
        case "A":
            return PIECE_CODE.ADVISOR;
        case "B":
        case "E":
            return PIECE_CODE.BISHOP;
        case "H":
        case "N":
            return PIECE_CODE.KNIGHT;
        case "R":
            return PIECE_CODE.ROOK;
        case "C":
            return PIECE_CODE.CANNON;
        case "P":
            return PIECE_CODE.PAWN;
        default:
            return -1;
        }
    }

    fromFen(fen: string) {
        let y = COLUMN_TOP;
        let x = ROW_LEFT;
        let index = 0;

        if (index == fen.length) {
            return;
        }

        let c = fen.charAt(index);
        while (c != " ") {
            if (c == "/") {
                x = ROW_LEFT;
                y++;
                if (y > COLUMN_BOTTOM) {
                    break;
                }
            } else if (c >= "1" && c <= "9") {
                x += (this.asc(c) - this.asc("0"));
            } else if (c >= "A" && c <= "Z") {
                if (x <= ROW_RIGHT) {
                    let pt = this.charToPiece(c);
                    if (pt >= 0) {
                        this.addPiece(COORD_XY(x, y), pt + 8);
                    }
                    x++;
                }
            } else if (c >= "a" && c <= "z") {
                if (x <= ROW_RIGHT) {
                    let pt = this.charToPiece(this.chr(this.asc(c) + this.asc("A") - this.asc("a")));
                    if (pt >= 0) {
                        this.addPiece(COORD_XY(x, y), pt + 16);
                    }
                    x++;
                }
            }

            if (index++ == fen.length) {
                return;
            }
            
            c = fen.charAt(index);
        }

        if (index++ == fen.length) {
            return;
        }

        if (this.controller == (fen.charAt(index) == "b" ? 0 : 1)) {
            this.changeSide();
        }
    }

    toFen() : string {
        let fen = "";
        for (let y = COLUMN_TOP; y <= COLUMN_BOTTOM; y++) {
            let k = 0;
            for (let x = ROW_LEFT; x <= ROW_RIGHT; x++) {
                let pc = this.squares[COORD_XY(x, y)];
                if (pc > 0) {
                    if (k > 0) {
                        fen += this.chr(this.asc("0") + k);
                        k = 0;
                    }
                    fen += FEN_PIECE.charAt(pc);
                } else {
                    k++;
                }
            }
            
            if (k > 0) {
                fen += this.chr(this.asc("0") + k);
            }

            fen += "/";
        }

        return fen.substring(0, fen.length - 1) + (this.controller == 0 ? " w" : " b");
    }
}


