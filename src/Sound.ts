export enum SOUND{
    CLICK,
    ILLEGAL,
    MOVE,
    CAPTURE,
    CHECK,
    LOSS,
    WIN,
    DRAW,
    BG,
    END,
}

export class Sound {
    private sounds;
    private canPlayMusic: boolean;
    private canPlayEffetc: boolean;

    constructor() {
        this.sounds = {};
        this.canPlayMusic = false;
        this.canPlayEffetc = false;

        this.sounds[SOUND.CLICK] = "res/sounds/click.mp3";
        this.sounds[SOUND.MOVE] = "res/sounds/move.mp3";
        this.sounds[SOUND.ILLEGAL] = "res/sounds/illegal.mp3";
        this.sounds[SOUND.LOSS] = "res/sounds/loss.mp3";
        this.sounds[SOUND.WIN] = "res/sounds/win.mp3";
        this.sounds[SOUND.DRAW] = "res/sounds/draw.mp3";
        this.sounds[SOUND.CAPTURE] = "res/sounds/capture.mp3";
        this.sounds[SOUND.CHECK] = "res/sounds/check.mp3";
        this.sounds[SOUND.BG] = "res/sounds/bg.mp3";

        Laya.loader.load([
            {url: this.sounds[SOUND.CLICK], type: "sound"},
            {url: this.sounds[SOUND.MOVE], type: "sound"},
            {url: this.sounds[SOUND.ILLEGAL], type: "sound"},
            {url: this.sounds[SOUND.LOSS], type: "sound"},
            {url: this.sounds[SOUND.WIN], type: "sound"},
            {url: this.sounds[SOUND.DRAW], type: "sound"},
            {url: this.sounds[SOUND.CAPTURE], type: "sound"},
            {url: this.sounds[SOUND.CHECK], type: "sound"},
            {url: this.sounds[SOUND.BG], type: "sound"}],
            Laya.Handler.create(this, this.onLoaded)
        );
    }

    onLoaded() {
        this.canPlayMusic = true;
        this.canPlayEffetc = true;

        this.playMusic();
    }

    playMusic() {
        if (this.canPlayMusic) {
            Laya.SoundManager.playMusic(this.sounds[SOUND.BG]);
        }
    }

    stopMusic() {
        Laya.SoundManager.stopMusic();
    }

    playEffect(sound: SOUND) {
        if (this.canPlayEffetc) {
            Laya.SoundManager.playSound(this.sounds[sound]);
        }
    }

    setMusic(flag: boolean) {
        this.canPlayMusic = flag;
        if (flag) {
            this.playEffect(SOUND.CLICK);
        }
    }

    setEffect(flag: boolean) {
        this.canPlayEffetc = flag;
        if (flag) {
            this.playEffect(SOUND.CLICK);
        }
    }
}
