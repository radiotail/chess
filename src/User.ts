import {Board, SIDE, RESULT} from "./Board"

export class User {
    private messIndex: number;
    private pveHistory: Array<number[]>;
    private unlockMess: number;
    private pveLevelIndex: number;

    constructor() {
        //laya.net.LocalStorage.clear();
        let unlockMess = laya.net.LocalStorage.getItem("unlockMess");
        let pveLevelIndex = laya.net.LocalStorage.getItem("pveLevelIndex");
        let messIndex = laya.net.LocalStorage.getItem("messIndex");

        let pveHistory = laya.net.LocalStorage.getItem("pveHistory");

        if (pveHistory == "") {
            this.pveHistory = new Array<number[]>(16);
            for (let i = 0; i < 16; i++) {
                this.pveHistory[i] = [0, 0, 0];
            }
        } else {
            this.pveHistory = JSON.parse(pveHistory);
        }

        this.pveLevelIndex = Number(pveLevelIndex);
        this.unlockMess = Number(unlockMess);
        this.messIndex = Number(messIndex);
    }

    setUnlockMess(unlockMess: number) {
        this.unlockMess = unlockMess;
        laya.net.LocalStorage.setItem("unlockMess", String(this.unlockMess));
    }

    getUnlockMess(): number {
        return this.unlockMess;
    }

    setPveLevelIndex(pveLevelIndex: number) {
        this.pveLevelIndex = pveLevelIndex;
        laya.net.LocalStorage.setItem("pveLevelIndex", String(this.pveLevelIndex));
    }

    getPveLevelIndex(): number {
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
        
        laya.net.LocalStorage.setItem("pveHistory", JSON.stringify(this.pveHistory));
    }

    getPveHistory(level: number): number[] {
        return this.pveHistory[level];
    }

    setMessIndex(messIndex: number) {
        this.messIndex = messIndex;
        laya.net.LocalStorage.setItem("messIndex", String(this.messIndex));
    }

    getMessIndex(): number {
        return this.messIndex;
    }
}
