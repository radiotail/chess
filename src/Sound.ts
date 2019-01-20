export enum SOUND{
    CLICK,
    ILLEGAL,
    MOVE,
    CAPTURE,
    CHECK,
    LOSS,
    WIN,
    DRAW,
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

        Laya.loader.load([
            {url: "res/sounds/click.ogg", type: "sound"},
            {url: "res/sounds/illegal.ogg", type: "sound"},
            {url: "res/sounds/move.ogg", type: "sound"},
            {url: "res/sounds/capture.ogg", type: "sound"},
            {url: "res/sounds/check.ogg", type: "sound"},
            {url: "res/sounds/loss.ogg", type: "sound"},
            {url: "res/sounds/win.ogg", type: "sound"},
            {url: "res/sounds/draw.ogg", type: "sound"},
            {url: "res/sounds/bg.ogg", type: "sound"}],
            Laya.Handler.create(this, this.onLoaded)
        );
        // Laya.Sound.load("res/sounds/click.ogg");
    }

    onLoaded() {
        console.log("sounds loaded!")
        this.canPlayMusic = true;
        this.canPlayEffetc = true;

        this.sounds[SOUND.CLICK] = "res/sounds/click.ogg";
        this.sounds[SOUND.MOVE] = "res/sounds/move.ogg";
        this.sounds[SOUND.ILLEGAL] = "res/sounds/illegal.ogg";
        this.sounds[SOUND.LOSS] = "res/sounds/loss.ogg";
        this.sounds[SOUND.WIN] = "res/sounds/win.ogg";
        this.sounds[SOUND.DRAW] = "res/sounds/draw.ogg";
        this.sounds[SOUND.CAPTURE] = "res/sounds/capture.ogg";
        this.sounds[SOUND.CHECK] = "res/sounds/check.ogg";

        this.playMusic();
    }

    playMusic() {
        if (this.canPlayMusic) {
            Laya.SoundManager.playMusic("res/sounds/bg.ogg");
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
