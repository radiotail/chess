import {Situation, SQUARE_COUNT, PIECE_COUNT} from "./Situation"

class Rc4 {
    private x: number;
    private y: number;
    private state: Array<number>;

    constructor(key: number[]) {
        this.x = 0;
        this.y = 0;

        this.state = new Array<number>(SQUARE_COUNT);
        for (let i = 0; i < SQUARE_COUNT; i++) {
            this.state[i] = i;
        }
        
        let j = 0;
        for (let i = 0; i < SQUARE_COUNT; i++) {
            j = (j + this.state[i] + key[i % key.length]) & 0xff;
            this.swap(i, j);
        }
    }

    private swap(i: number, j: number) {
        let t = this.state[i];
        this.state[i] = this.state[j];
        this.state[j] = t;
    }

    private nextByte(): number {
        this.x = (this.x + 1) & 0xff;
        this.y = (this.y + this.state[this.x]) & 0xff;
        this.swap(this.x, this.y);
        let t = (this.state[this.x] + this.state[this.y]) & 0xff;
        return this.state[t];
    }

    nextLong(): number {
        let n0 = this.nextByte();
        let n1 = this.nextByte();
        let n2 = this.nextByte();
        let n3 = this.nextByte();
        return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff);
    }
}

export class Zobrist {
    public key: number;
    public lock0: number;
    public lock1: number;

    constructor() {
        this.init();
    }

    init() {
        this.key = this.lock0 = this.lock1 = 0;
    }

    initRc4(rc4: Rc4) {
        this.key = rc4.nextLong();
        this.lock0 = rc4.nextLong();
        this.lock1 = rc4.nextLong();
    }

    xor(zobr: Zobrist) {
        this.key ^= zobr.key;
        this.lock0 ^= zobr.lock0;
        this.lock1 ^= zobr.lock1;
    }
}

export let g_playerZobr: Zobrist;
export let g_tableZobr: Array<Zobrist[]>;

function random(range: number): number {
    return Math.round(Math.random() * range);   
}

export function initZobrist() {
    let key = [0]; //[random(255), random(255), random(255), random(255), random(255), random(255), random(255), random(255)];
    let rc4 = new Rc4(key);

    g_playerZobr = new Zobrist();
    g_playerZobr.initRc4(rc4);

    g_tableZobr = new Array<Zobrist[]>(PIECE_COUNT);
    for (let i = 0; i < PIECE_COUNT; i ++) {
        let zobrs: Zobrist[];
        zobrs = new Array<Zobrist>(SQUARE_COUNT);
        for (let j = 0; j < SQUARE_COUNT; j ++) {
            zobrs[j] = new Zobrist();
            zobrs[j].initRc4(rc4);
        }
        
        g_tableZobr[i] = zobrs;
    }
}
