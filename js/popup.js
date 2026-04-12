class Button {
    constructor(text, onClick, { width = 200, height = 35 } = {}) {
      this.text = text;
      this.onClick = onClick;
      this.width = width;
      this.height = height;
  
      this.x = 0;
      this.y = 0;
    }
  
    draw(ctx) {
      ctx.fillStyle = "#444";
      ctx.fillRect(this.x, this.y, this.width, this.height);
  
      ctx.strokeStyle = "white";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
  
      ctx.fillStyle = "white";
      ctx.font = "14px Arial";
      ctx.fillText(this.text, this.x + 10, this.y + 22);
    }
  
    isInside(x, y) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    }
  }
  
  class Popup {
    constructor({ x = 100, y = 100, width = 300, height = 200, title = "", content = () => [] }) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.title = title;
  
      this.padding = 15;
      this.headerHeight = 40;
  
      this.elements = content(this);
  
      // przycisk zamknięcia
      this.closeBtn = new Button("X", () => {
        this.visible = false;
      }, { width: 30, height: 30 });
  
      this.visible = true;
  
      this.layout();
    }
  
    layout() {
      // close button
      this.closeBtn.x = this.x + this.width - 35;
      this.closeBtn.y = this.y + 5;
  
      // content layout (stack vertical)
      let currentY = this.y + this.headerHeight + this.padding;
  
      this.elements.forEach(el => {
        el.x = this.x + this.padding;
        el.y = currentY;
        el.width = this.width - this.padding * 2;
  
        currentY += el.height + 10;
      });
    }
  
    draw(ctx) {
      if (!this.visible) return;
  
      // tło
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
  
      // header
      ctx.fillStyle = "#222";
      ctx.fillRect(this.x, this.y, this.width, this.headerHeight);
  
      // title
      ctx.fillStyle = "white";
      ctx.font = "bold 18px Arial";
      ctx.fillText(this.title, this.x + 10, this.y + 25);
  
      // border
      ctx.strokeStyle = "white";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
  
      // close button
      this.closeBtn.draw(ctx);
  
      // content
      this.elements.forEach(el => el.draw(ctx));
    }
  
    handleClick(x, y) {
      if (!this.visible) return;
  
      // close
      if (this.closeBtn.isInside(x, y)) {
        this.closeBtn.onClick();
        return;
      }
  
      // elements
      this.elements.forEach(el => {
        if (el.isInside(x, y)) {
          el.onClick();
        }
      });
    }
  
    isInside(x, y) {
      return (
        x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height
      );
    }
  }

class SeedShopPopup extends Popup {
    constructor() {
      super(100, 100, 400, 300);
  
      this.items = [
        { name: "Marchew", price: 10 },
        { name: "Pomidor", price: 20 },
        { name: "Ziemniak", price: 15 },
      ];
    }
  
    draw(ctx) {
      super.draw(ctx);
  
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText("Sklep z nasionami", this.x + 20, this.y + 30);
  
      this.items.forEach((item, i) => {
        ctx.fillText(
          `${item.name} - ${item.price}$`,
          this.x + 20,
          this.y + 70 + i * 40
        );
      });
    }
  
    handleClick(x, y) {
      this.items.forEach((item, i) => {
        let itemY = this.y + 50 + i * 40;
  
        if (
          x > this.x &&
          x < this.x + this.width &&
          y > itemY &&
          y < itemY + 30
        ) {
          console.log("Kupiono:", item.name);
        }
      });
    }
  }

  class PopupManager {
    constructor() {
      this.popups = [];
    }
  
    open(popup) {
      this.popups.push(popup);
    }
  
    draw(ctx) {
        // console.log(this.popups)
      this.popups.forEach(p => p.draw(ctx));
    }
  
    handleClick(x, y) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        if (p.isInside(x, y)) {
          p.handleClick(x, y);
          return;
        }
      }
    }
  }

// document.querySelector('canvas').addEventListener("click", (e) => {
//   });

  const popupManager = new PopupManager();

// otwierasz sklep
var seedshop = new Popup({
    title: "Sklep z nasionami",
    width: 400,
    height: 300,
  
    content: (popup) => [
      new Button("🌱 Nasiono - ", () => {
        console.log("Kupiono marchew");
      })
    ]
  });

  canvas.addEventListener('touch', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    popupManager.handleClick(x, y);
  });

popupManager.open(seedshop);
// popupManager.close(seedshop);