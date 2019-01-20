import { Situation, MIRROR_MOVE, OWN_AREA, TO_DST } from './Situation'
import { Evaluate, WIN_VALUE, MATE_VALUE, mvvLvaByMove, BAN_VALUE } from './Evaluate'
import { Zobrist } from './Zobrist'
import { BOOK_DAT } from "./Book"

const MAX_GEN_MOVES = 128;   // 最大的生成走法数
const HISTORY_LIMIT = 65536; // 历史表大小
export const LIMIT_DEPTH = 64;      // 最大的搜索深度
const NULL_DEPTH = 2;        // 空步裁剪的裁剪深度
const RANDOM_MASK = 8;       // 随机性分值
export const HASH_LEVEL = 20;

enum HAST_TYPE {
    ALPHA,
    BETA,
    PV,
}

enum SORT_STAGE {
    HASH,
    KILLER1,
    KILLER2,
    GEN_MOVES,
    RESET,
}

let SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093];
function shellSort(moves: Array<number>, values: Array<number>) {
    let stepLevel = 1;
    let len = moves.length;
    while (SHELL_STEP[stepLevel] < len) {
        stepLevel++;
    }
    
    while (--stepLevel > 0) {
        let step = SHELL_STEP[stepLevel];
        for (let i = step; i < len; i++) {
            let mvBest = moves[i];
            let vlBest = values[i];
            let j = i - step;
            while (j >= 0 && vlBest > values[j]) {
                moves[j + step] = moves[j];
                values[j + step] = values[j];
                j -= step;
            }
            moves[j + step] = mvBest;
            values[j + step] = vlBest;
        }
    }
}

function binarySearch(array: Array<Array<number>>, value: number) {
    let low = 0;
    let high = array.length - 1;
    
    while (low <= high) {
        let mid = (low + high) >> 1;
        if (array[mid][0] < value) {
            low = mid + 1;
        } else if (array[mid][0] > value) {
            high = mid - 1;
        } else {
            return mid;
        }
    } 

    return -1;
}

class MoveSort {
    private hash: number;               // 置换表
    private killer1: number;            // 杀手走法1
    private killer2: number;            // 杀手走法2
    private stage: SORT_STAGE;          // 当前阶段
    private index: number;              // 当前走法索引
    private movesCount: number;         // 走法总数
    private moves: Array<number>;       // 走法列表
    private values: Array<number>;      // 价值列表
    private situation: Situation;       // 局面
    private search: Search;
    singleReply: boolean;               

    constructor(situation: Situation, search: Search, hash: number) {
        this.situation = situation;
        this.search = search;
        this.movesCount = 0;
        this.index = 0;
        this.singleReply = false;
        this.stage = SORT_STAGE.HASH;
        
        if (situation.inCheck()) {
            this.hash = 0;
            this.stage = SORT_STAGE.RESET;
            let allMoves = situation.genMoves(null);
            this.values = new Array<number>();
            this.moves = new Array<number>();
            for (let i = 0; i < allMoves.length; i++) {
                let move = allMoves[i]
                if (!situation.makeMove(move)) {
                    continue;
                }

                situation.undoMakeMove();
                this.moves.push(move);
                this.values.push(move == hash ? 0x7fffffff : search.getHistory(move));
            }

            shellSort(this.moves, this.values);
            this.singleReply = this.moves.length == 1;
        } else {
            this.hash = hash;
            this.killer1 = this.search.getKiller1();
            this.killer2 = this.search.getKiller2();
        }
    }

    // 得到下一个走法
    next() {
        // console.log("next stage: ", this.stage);
        switch (this.stage) {
            // 0. 置换表着法启发，完成后立即进入下一阶段；
            case SORT_STAGE.HASH:
                this.stage = SORT_STAGE.KILLER1;
                if (this.hash != 0) {
                    return this.hash;
                }
            // 1. 杀手着法启发(第一个杀手着法)，完成后立即进入下一阶段；
            case SORT_STAGE.KILLER1:
                this.stage = SORT_STAGE.KILLER2;
                if (this.killer1 != this.hash && this.killer1 != 0 && this.situation.legalMove(this.killer1)) {
                    return this.killer1;
                }

            // 2. 杀手着法启发(第二个杀手着法)，完成后立即进入下一阶段；
            case SORT_STAGE.KILLER2:
                this.stage = SORT_STAGE.GEN_MOVES;
                if (this.killer2 != this.hash && this.killer2 != 0 && this.situation.legalMove(this.killer2)) {
                    return this.killer2;
                }

            // 3. 生成所有着法，完成后立即进入下一阶段；
            case SORT_STAGE.GEN_MOVES:
                this.stage = SORT_STAGE.RESET;
                this.values = new Array<number>();
                this.moves = this.situation.genMoves(this.values);
                shellSort(this.moves, this.values);
                this.index = 0;

            // 4. 对剩余着法做历史表启发；
            default:
                let move: number;
                while (this.index < this.moves.length) {
                    move = this.moves[this.index++];
                    if (move != this.hash && move != this.killer1 && move != this.killer2) {
                        return move;
                    }
                }
        }

        return 0;
    }
}

// 置换表项结构
class HashItem {
    depth: number;
    flag: number;
    value: number;
    move: number;
    zobr: Zobrist;

  constructor() {
      this.depth = 0;
      this.flag = 0;
      this.value = 0;
      this.move = 0;
      this.zobr = new Zobrist();
  }
};

export class Search {
    private situation: Situation;
    private result: number;
    private hashMask: number;
    private historyTable: Array<number>;
    private historyCount: number;
    private hashTable: Array<HashItem>;
    private hashCount: number;
    private killerTable: Array<number[]>;
    private killersCount: number;
    private bookMovesCount: number;     // 开局走法数
    private bookMoves: Array<number>;   // 开局走法列表
    private bookValues: Array<number>;  // 开局走法价值
    evaluate: Evaluate;
    
    constructor(situation: Situation, hashLevel: number) {
        this.situation = situation;
        this.evaluate = new Evaluate(situation, this);
        this.hashMask = (1 << hashLevel) - 1;
        
        this.bookMoves = new Array<number>(MAX_GEN_MOVES);
        this.bookValues = new Array<number>(MAX_GEN_MOVES);

        this.historyTable = new Array<number>();
        for (let i = 0; i < HISTORY_LIMIT; i++) {
            this.historyTable[i] = 0;
        }

        this.hashTable = new Array<HashItem>();
        for (let i = 0; i <= this.hashMask; i++) {
            this.hashTable[i] = new HashItem();
        }

        this.killerTable = new Array<number[]>();
        for (let i = 0; i < LIMIT_DEPTH; i++) {
            this.killerTable[i] = [0, 0];
        }
    }

    getHistory(move: number) {
        return this.historyTable[move];
    }

    // 找到最佳着法时采取的措施
    setBestMove(move: number, depth: number) {
        this.historyTable[move] += depth * depth;

        let killer = this.killerTable[this.situation.depth];
        if (killer[0] != move) {
            killer[1] = killer[0];
            killer[0] = move;
        }
    }

    getKiller1(): number {
        return this.killerTable[this.situation.depth][0];
    }

    getKiller2(): number {
        return this.killerTable[this.situation.depth][1];
    }

    // 迭代加深搜索过程
    searchMain(depth: number, msecLimit: number) {
        this.historyCount = 0;
        this.hashCount = 0;
        this.killersCount = 0;
        this.situation.depth = 0;

        // 搜索开局库
        this.result = this.searchBook();
        if (this.result > 0) {
            this.situation.makeMove(this.result);
            if (this.situation.repStatus(3) == 0) {
                this.situation.undoMakeMove();
                return this.result;
            }

            this.situation.undoMakeMove();
        }

        // 迭代加深过程
        this.result = 0;
        let msec = Laya.Browser.now();
        for (let i = 1; i <= depth; i ++) {
            let value = this.searchRoot(i);
            let delta = Laya.Browser.now() - msec;
            console.log("search depth: ", i, Laya.Browser.now(), msec, delta, msecLimit);
            if (delta > msecLimit) {
                console.log("thinking break: ", this.situation.getMoveCount(), delta, msecLimit, Laya.timer.currTimer, this.result);
                break;
            }

            if (value > WIN_VALUE || value < -WIN_VALUE) {
                break;
            }

            if (this.searchUnique(1 - WIN_VALUE, i)) {
                break;
            }
        }

        return this.result;
    }

    // 搜索开局库
    searchBook() {
        if (typeof BOOK_DAT != "object" || BOOK_DAT.length == 0) {
            return 0;
        }

        let mirror = false;
        let lock = this.situation.zobr.lock1 >>> 1; // Convert into Unsigned
        let index = binarySearch(BOOK_DAT, lock);
        if (index < 0) {
            mirror = true;
            lock = this.situation.mirror().zobr.lock1 >>> 1; // Convert into Unsigned
            index = binarySearch(BOOK_DAT, lock);

            if (index < 0) {
                return 0;
            }
        }
        
        while (--index >= 0 && BOOK_DAT[index][0] == lock) {
        }

        let allValue = 0;
        this.bookMovesCount = 0;
        while (++index < BOOK_DAT.length && BOOK_DAT[index][0] == lock) {
            let move = BOOK_DAT[index][1];
            move = (mirror ? MIRROR_MOVE(move) : move);
            if (this.situation.legalMove(move)) {
                let value = BOOK_DAT[index][2];
                allValue += value;
                this.bookMoves[this.bookMovesCount] = move;
                this.bookValues[this.bookMovesCount++] = value;
            }
        }

        if (allValue == 0) {
            return 0;
        }

        allValue = Math.floor(Math.random() * allValue);
        for (index = 0; index < this.bookMovesCount; index++) {
            allValue -= this.bookValues[index];
            if (allValue < 0) {
                break;
            }
        }

        return this.bookMoves[index];
    }

    // 根节点的Alpha-Beta搜索过程
    searchRoot(depth: number) {
        let best = -MATE_VALUE;
        let sort = new MoveSort(this.situation, this, this.result);

        let move;
        while ((move = sort.next()) > 0) {
            if (!this.situation.makeMove(move)) {
                continue;
            }

            let value;
            let newDepth = this.situation.inCheck() ? depth : depth - 1;
            if (best == -MATE_VALUE) {
                value = -this.searchFull(-MATE_VALUE, MATE_VALUE, newDepth, true);
            } else {
                value = -this.searchFull(-best - 1, -best, newDepth, false);
                if (value > best) {
                    value = -this.searchFull(-MATE_VALUE, -best, newDepth, true);
                }
            }

            this.situation.undoMakeMove();
            if (value > best) {
                best = value;
                this.result = move;
                if (best > -WIN_VALUE && best < WIN_VALUE) {
                    best += Math.floor(Math.random() * RANDOM_MASK) - Math.floor(Math.random() * RANDOM_MASK);
                    best = (best == this.evaluate.drawValue() ? best - 1 : best);
                }
            }
        }

        this.setBestMove(this.result, depth);

        return best;
    }

    // 超出边界(Fail-Soft)的Alpha-Beta搜索过程
    searchFull(alpha: number, beta: number, depth: number, noNull: boolean) {
        // 一个Alpha-Beta完全搜索分为以下几个阶段

        // 1. 到达水平线，则调用静态搜索(注意：由于空步裁剪，深度可能小于零)
        if (depth <= 0) {
            return this.searchQuiesc(alpha, beta);
        }

        let value = this.evaluate.mateValue();
        if (value >= beta) {
            return value;
        }

        // 1-1. 检查重复局面(注意：不要在根节点检查，否则就没有走法了)
        let repValue = this.situation.repStatus(1);
        if (repValue > 0) {
            return this.evaluate.repValue(repValue);
        }

        // 1-2. 尝试置换表裁剪，并得到置换表走法
        let hash = [0];
        value = this.probeHash(alpha, beta, depth, hash);
        if (value > -MATE_VALUE) {
            return value;
        }

         // 1-3. 到达极限深度就返回局面评价
        if (this.situation.depth == LIMIT_DEPTH) {
            return this.evaluate.genEvaluate();
        }

        // 1-4. 尝试空步裁剪(根节点的Beta值是"MATE_VALUE"，所以不可能发生空步裁剪)
        if (!noNull && !this.situation.inCheck() && this.evaluate.nullOkay()) {
            this.situation.nullMove();
            value = -this.searchFull(-beta, 1 - beta, depth - NULL_DEPTH - 1, true);
            this.situation.undoNullMove();

            if (value >= beta && (this.evaluate.nullSafe() || this.searchFull(alpha, beta, depth - NULL_DEPTH, true) >= beta)) {
                return value;
            }
        }

        // 2. 初始化最佳值和最佳走法
        let hashFlag = HAST_TYPE.ALPHA;
        let bestValue = -MATE_VALUE;        // 这样可以知道，是否一个走法都没走过(杀棋)
        let bestMove = 0;                  // 这样可以知道，是否搜索到了Beta走法或PV走法，以便保存到历史表
        
        // 3. 初始化走法排序结构
        let sort = new MoveSort(this.situation, this, hash[0]);

        // 4. 逐一走这些走法，并进行递归
        let move;
        while ((move = sort.next()) != 0) {
            // console.log("next to move: ", move);
            if (!this.situation.makeMove(move)) {
                continue;
            }

            // 将军延伸
            let newDepth = this.situation.inCheck() || sort.singleReply ? depth : depth - 1;
            // PVS
            if (bestValue == -MATE_VALUE) {
                value = -this.searchFull(-beta, -alpha, newDepth, false);
            } else {
                value = -this.searchFull(-alpha - 1, -alpha, newDepth, false);
                if (value > alpha && value < beta) {
                    value = -this.searchFull(-beta, -alpha, newDepth, false);
                }
            }

            this.situation.undoMakeMove();

            // 5. 进行Alpha-Beta大小判断和截断
            if (value > bestValue) {                  // 找到最佳值(但不能确定是Alpha、PV还是Beta走法)
                bestValue = value;                    // "bestValue"就是目前要返回的最佳值，可能超出Alpha-Beta边界
                if (value >= beta) {                  // 找到一个Beta走法
                    hashFlag = HAST_TYPE.BETA;
                    bestMove = move;                  // Beta走法要保存到历史表
                    break;                            // Beta截断
                }

                if (value > alpha) {                  // 找到一个PV走法
                    hashFlag = HAST_TYPE.PV;
                    bestMove = move;                  // PV走法要保存到历史表
                    alpha = value;                    // 缩小Alpha-Beta边界
                }
            }
        }

        // 5. 所有走法都搜索完了，把最佳走法(不能是Alpha走法)保存到历史表，返回最佳值
        if (bestValue == -MATE_VALUE) {
            // 如果是杀棋，就根据杀棋步数给出评价
            return this.evaluate.mateValue();
        }

        // 记录到置换表
        this.recordHash(hashFlag, bestValue, depth, bestMove);
        if (bestMove > 0) {
            // 如果不是Alpha走法，就将最佳走法保存到历史表
            this.setBestMove(bestMove, depth);
        }

        return bestValue;
    }

    // 静态搜索过程
    searchQuiesc(alpha: number, beta: number) {
        // 根据杀棋步数给出评价
        let value = this.evaluate.mateValue();
        if (value >= beta) {
            return value;
        }

        // 一个静态搜索分为以下几个阶段

        // 1. 检查重复局面
        let repValue = this.situation.repStatus(1);
        if (repValue > 0) {
            return this.evaluate.repValue(repValue);
        }

        // 2. 到达极限深度就返回局面评价
        if (this.situation.depth == LIMIT_DEPTH) {
            return this.evaluate.genEvaluate();
        }

        // 3. 初始化最佳值 这样可以知道，是否一个走法都没走过(杀棋)
        let moves: Array<number>;
        let best = -MATE_VALUE;
        let values = new Array<number>();
        if (this.situation.inCheck()) {
            // 4. 如果被将军，则生成全部走法
            moves = this.situation.genMoves(values);
            shellSort(moves, values);
        } else {
            // 5. 如果不被将军，先做局面评价
            value = this.evaluate.genEvaluate();
            if (value > best) {
                if (value >= beta) {
                    return value;
                }

                best = value;
                if (value > alpha) {
                    alpha = value;
                }
            }

            // 6. 如果局面评价没有截断，再生成吃子走法
            moves = this.situation.genMoves(values, true);
            shellSort(moves, values);
            for (let i = 0; i < moves.length; i++) {
                let value = mvvLvaByMove(this.situation, moves[i]);
                if (value < 10 || (value < 20 && OWN_AREA(TO_DST(moves[i]), this.situation.controller))) {
                    moves.length = i;
                    break;
                }
            }
        }

        // 7. 逐一走这些走法，并进行递归
        for (let i = 0; i < moves.length; i++) {
            if (!this.situation.makeMove(moves[i])) {
                continue;
            }

            value = -this.searchQuiesc(-beta, -alpha);
            this.situation.undoMakeMove();

            // 8. 进行Alpha-Beta大小判断和截断
            if (value > best) {                   // 找到最佳值(但不能确定是Alpha、PV还是Beta走法)             
                if (value >= beta) {              // 找到一个Beta走法
                    return value;                 // Beta截断
                }

                best = value;                     // "best"就是目前要返回的最佳值，可能超出Alpha-Beta边界
                if (value > alpha) {              // 找到一个PV走法
                    alpha = value;                // 缩小Alpha-Beta边界
                }
            }
        }

        // 9. 所有走法都搜索完了，返回最佳值
        return best == -MATE_VALUE ? this.evaluate.mateValue() : best;
    }

    // 唯一着法检验是ElephantEye在搜索上的一大特色，用来判断用以某种深度进行的搜索是否找到了唯一着法。
    // 其原理是把找到的最佳着法设成禁止着法，然后以(-WIN_VALUE, 1 - WIN_VALUE)的窗口重新搜索，
    // 如果低出边界则说明其他着法都将被杀。
    searchUnique(beta: number, depth: number) {
        let sort = new MoveSort(this.situation, this, this.result);
  
        // 跳过第一个着法
        sort.next();
        
        let move;
        while ((move = sort.next()) > 0) {
            if (!this.situation.makeMove(move)) {
                continue;
            }

            let value = -this.searchFull(-beta, 1 - beta, this.situation.inCheck() ? depth : depth - 1, false);
            this.situation.undoMakeMove();
            if (value >= beta) {
                return false;
            }
        }

        return true;
    }

    getHashItem(): HashItem {
        return this.hashTable[this.situation.zobr.key & this.hashMask];
    }

    // 保存置换表项
    recordHash(flag: number, value: number, depth: number, move: number) {
        let hash = this.getHashItem();
        if (hash.depth > depth) {
            return;
        }

        hash.flag = flag;
        hash.depth = depth;
        if (value > WIN_VALUE) {
            // 可能导致搜索的不稳定性，并且没有最佳着法，立刻退出
            if (move == 0 && value <= BAN_VALUE) {
                return;
            }

            hash.value = value + this.situation.depth;
        } else if (value < -WIN_VALUE) {
            // 同上注释
            if (move == 0 && value >= -BAN_VALUE) {
                return;
            }

            hash.value = value - this.situation.depth;
        } else if (value == this.evaluate.drawValue() && move == 0) {
            return;
        } else {
            hash.value = value;
        }

        hash.move = move;
        hash.zobr.lock0 = this.situation.zobr.lock0;
        hash.zobr.lock1 = this.situation.zobr.lock1;
    }

    // 提取置换表项
    probeHash(alpha: number, beta: number, depth: number, move: number[]) {
        let hash = this.getHashItem();
        if (hash.zobr.lock0 != this.situation.zobr.lock0 || hash.zobr.lock1 != this.situation.zobr.lock1) {
            move[0] = 0;
            return -MATE_VALUE;
        }

        move[0] = hash.move;

        // 杀棋标志：如果是杀棋，那么不需要满足深度条件
        let mate = false;
        if (hash.value > WIN_VALUE) {
            // 可能导致搜索的不稳定性，立刻退出，但最佳着法可能拿到
            if (hash.value <= BAN_VALUE) {
                return -MATE_VALUE;
            }

            hash.value -= this.situation.depth;
            mate = true;
        } else if (hash.value < -WIN_VALUE) {
            // 同上
            if (hash.value >= -BAN_VALUE) {
                return -MATE_VALUE;
            }

            hash.value += this.situation.depth;
            mate = true;
        } else if (hash.value == this.evaluate.drawValue()) {
            return -MATE_VALUE;
        }

        if (hash.depth < depth && !mate) {
            return -MATE_VALUE;
        }

        if (hash.flag == HAST_TYPE.BETA) {
            return (hash.value >= beta ? hash.value : -MATE_VALUE);
        }

        if (hash.flag == HAST_TYPE.ALPHA) {
            return (hash.value <= alpha ? hash.value : -MATE_VALUE);
        }

        return hash.value;
    }
}

