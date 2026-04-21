class Color {
    constructor() {

    }
}

class RgbColor {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = 255;
    }
}

class RgbaColor {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class HexColor {
    constructor(hex) {
        hex = hex.replace('#', '');
      
        // obsługa skrótu #fff
        if (hex.length === 3) {
          hex = hex.split('').map(c => c + c).join('');
        }
      
        const num = parseInt(hex, 16);
      
        this.r = (num >> 16) & 255;
        this.g = (num >> 8) & 255;
        this.b = num & 255;
        this.a = 255;
    }
}


class CanvasStyle {
    constructor() {
        this.backgroundColor = new RgbColor(32, 32, 32)
    }
}

class CanvasElement {
    constructor(x, y, w, h) {
        this.style = new CanvasStyle();
    }
}

class Button {

}