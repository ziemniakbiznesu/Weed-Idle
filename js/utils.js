function shuffle(array) {
    var tarray = array;

    for (let i = tarray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tarray[i], tarray[j]] = [tarray[j], tarray[i]];
      }

    return tarray;
  }
  

class SoundManager {
    constructor() {
        this.library = {};
    }

    load(name, src) {
        this.library[name] = new PoolSound(src);
    }

    play(name) {
        this.library[name].play();
    }

    stop(name) {

    }
}

class Sound {
    constructor(src) {
        this.src = src;
        this.playing = false;
        this.sound = new Audio(src);

    }

    play() {

    }

    stop() {

    }
}

class PoolSound extends Sound {
    constructor(src) {
        super(src);
        this.pool = Array.from({ length: 10 }, () => new Audio(src));
    }

    play() {
        for (let i = 0; i < this.pool.length; i++) {
            const sound = this.pool[i];

            if (sound.currentTime >= sound.duration || sound.currentTime == 0 || sound.paused) {
                sound.play();
                break;
            }
        }
        // this.pool.forEach(x => {
        // });
    }
}