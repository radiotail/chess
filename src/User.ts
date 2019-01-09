import {Board, SIDE, RESULT} from "./Board"

export class User {
    private messIndex: number;
    private pveHistory: Array<number[]>;
    private unlockMess: number;
    private pveLevelIndex: number;

    constructor() {
        //laya.net.LocalStorage.clear();
        this.unlockMess = laya.net.LocalStorage.getJSON("unlockMess");
        this.pveLevelIndex = laya.net.LocalStorage.getJSON("pveLevelIndex");
        this.pveHistory = laya.net.LocalStorage.getJSON("pveHistory");
        this.messIndex = laya.net.LocalStorage.getJSON("messIndex");

        if (this.pveHistory == null) {
            this.pveHistory = new Array<number[]>(16);
            for (let i = 0; i < 16; i++) {
                this.pveHistory[i] = [0, 0, 0];
            }
        }

        if (this.pveLevelIndex == null) {
            this.pveLevelIndex = 0
        }

        if (this.unlockMess == null) {
            this.unlockMess = 0
        }

        if (this.messIndex == null) {
            this.messIndex = 0
        }
    }

    setUnlockMess(unlockMess: number) {
        this.unlockMess = unlockMess;
        laya.net.LocalStorage.setJSON("unlockMess", this.unlockMess);
    }

    getUnlockMess() {
        return this.unlockMess;
    }

    setPveLevelIndex(pveLevelIndex: number) {
        this.pveLevelIndex = pveLevelIndex;
        laya.net.LocalStorage.setJSON("pveLevelIndex", this.pveLevelIndex);
    }

    getPveLevelIndex() {
        return this.pveLevelIndex;
    }

    setPveHistory(level: number, result: RESULT) {
        let history = this.pveHistory[level];
        history[0]++;

        if (result == RESULT.WIN) {
            history[1]++;
        } else if (result == RESULT.DRAW) {
            history[2]++;
        }
        
        laya.net.LocalStorage.setJSON("pveHistory", this.pveHistory);
    }

    getPveHistory(level: number): number[] {
        return this.pveHistory[level];
    }

    setMessIndex(messIndex: number) {
        this.messIndex = messIndex;
        laya.net.LocalStorage.setJSON("messIndex", this.messIndex);
    }

    getMessIndex() {
        return this.messIndex;
    }
}
