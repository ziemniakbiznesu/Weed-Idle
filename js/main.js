const AUTO_HARVEST = true;

var soundManager = new SoundManager();
soundManager.load('earn', './media/sounds/ean.mp3');

// ===== CONFIG =====
const GRID_SIZE = 6;
const TILE_SIZE = 121;

// ===== SPRITES =====
const SPRITES = {};
function load(name, src) {
  const img = new Image();
  img.src = src;
  SPRITES[name] = img;
}

var money = 0;

load("empty", "./ziem_plants/empty.png");
load("seed", "./ziem_plants/seed.png");
load("dead_0", "./ziem_plants/dead_0.png");
load("dead_1", "./ziem_plants/dead_1.png");

for (let i = 0; i <= 8; i++) load("weed_"+i, `./ziem_plants/weed_${i}.png`);
load("sweed_7", "./ziem_plants/sweed_7.png");
load("sweed_8", "./ziem_plants/sweed_8.png");

for (let i = 0; i <= 4; i++) load("water_"+i, `./ziem_plants/water_${i}.png`);

for (let i = 0; i <= 9; i++) load(`number_${i}`, `./numbers/${i}.png`);


class PlayerInventory {
  constructor(){
    this.seeds = 1;  // np. startowa ilość nasion
  }

  useSeed(){
    if(this.seeds > 0){
      this.seeds--;
      console.log('Inventory seeds:', this.seeds); // debug
      return true;
    }
    return false;
  }

  addSeed(amount=1){
    this.seeds += amount;
    console.log('Inventory seeds:', this.seeds);
  }
}

const playerInventory = new PlayerInventory();


// ===== BASE TILE =====
class Tile {
  constructor(x,y){
    this.x=x;
    this.y=y;
  
    this.px = x * TILE_SIZE;
    this.py = y * TILE_SIZE;
  
    this.scale=0.8;
    this.targetScale=1;
  }

  update(dt){
    this.scale += (this.targetScale - this.scale)*10*dt;
  
    if(!this.isDragging){
      this.px += (this.x*TILE_SIZE - this.px)*15*dt;
      this.py += (this.y*TILE_SIZE - this.py)*15*dt;
    }
  }

  draw(ctx, sprite){
    const px = this.px + TILE_SIZE/2;
    const py = this.py + TILE_SIZE/2;
  
    const size = TILE_SIZE*this.scale;
  
    ctx.drawImage(sprite, px-size/2, py-size/2, size, size);
  }
}

// ===== EMPTY =====
class EmptyTile extends Tile {
  render(ctx){
    this.draw(ctx, SPRITES.empty);
  }
}

// ===== WEED =====
class WeedTile extends Tile {
  constructor(x,y){
    super(x,y);
    this.stage="seed";
    this.level=0;
    this.growth=0;
    this.special=false;
    this.sweedActivated = false;
    this.harvested = false;
    this.isDead = false;
  }

  update(dt, map){
    super.update(dt, map);
  
    // --- Growth ALWAYS ---
    let boost = map.getWaterBoost(this);
    this.growth += dt * boost * (Math.floor(Math.random() * 100) / 100 + 0.5);

    if (Math.floor(Math.random() * 4200 * this.level ** 0.42 * boost ** 0.42) == 1) {
      // map.set(this.x, this.y, new EmptyTile(this.x, this.y));
      // console.log(boost ** 5)
      this.isDead = true;
    }
  
    if(this.stage === "seed" && this.growth > 2){
      this.stage = "growing";
      this.growth = 0;
    }

    if(this.stage === "growing" && this.growth > (this.level + 2)){  
    // if(this.stage === "growing" && this.growth > 2 + this.level){
      this.level = Math.min(8, this.level + 1);
      this.growth = 0;
    }
  
    // --- Sweed logic after normal growth ---
    if(boost > map.globalBoost && this.level >= 7 && !this.special && !this.sweedActivated){
      this.level = Math.max(this.level, 7);
      this.special = Math.floor(Math.random() * 10) == 1;
      this.sweedActivated = true;
      this.targetScale = 1.4;
      setTimeout(()=> this.targetScale=1,150);
      console.log('Sweed appeared at:', this.x, this.y);
    }

    if (AUTO_HARVEST && this.level == 8) {
      setTimeout(() => {
        if (!this.harvested) this.harvest(this);
      }, 4200);
    }
  }

  /**
   * @param {WeedTile} other 
   */
  harvest(other) {
    if (this.x != other.x 
      || this.y != other.y
      || this.level != 8
      || this.isDead
      ) return;
      
    this.harvested = true;
    money += 21 * (this.special ? 2 : 1);

    // clickSound.currentTime = 0;
    soundManager.play('earn');

    map.set(this.x, this.y, new WeedTile(this.x, this.y));
    if (map.dragged == this) {
      map.dragged = null;
    }

    console.log(`Money: ${money}`);
  }

  // canMerge = other => other instanceof WaterTile && this.level < 4 && other.level < 4;

  // merge(){
  //   if (this instanceof WaterTile) this.level = Math.min(4, this.level);

  //   setTimeout(()=>this.targetScale=1,100);
  // }

  render(ctx, map){
    // if (map) {
    //   let boost = map.getWaterBoost(this);
    //   if(boost > map.globalBoost){
    //     ctx.strokeStyle = "yellow";
    //     ctx.lineWidth = 4;
    //     ctx.strokeRect(this.px, this.py, TILE_SIZE, TILE_SIZE);
    //   }
    // }
    
  
    let sprite;
    if(this.stage==="seed") sprite = SPRITES.seed;
    else if (this.isDead) sprite = SPRITES[`dead_${(Math.sin(this.x * 374761393 + this.y * 668265263) * 43758.5453 % 1) < 0.5 ? 0 : 1}`];
    else if(this.special) sprite = SPRITES["sweed_"+this.level];
    else sprite = SPRITES["weed_"+this.level];
  
    ctx.save();

    if (map && !this.isDead) {
      let boost = map.getWaterBoost(this);
      if(boost > map.globalBoost){
        // console.log(boost **4)
        // ctx.shadowColor = `rgba(155, 155, 255, ${0.6 * boost ** 4})`;
        // ctx.shadowBlur = 42;
        ctx.filter = "brightness(1.1) saturate(1.1)";
      }
    } 
    
    if (this.isDead) {
      // ctx.shadowColor = "rgba(155, 155, 255, 0.8)";
      // ctx.shadowBlur = 25;
      ctx.filter = "brightness(0.9) saturate(0.8)";
    }

    this.draw(ctx, sprite);
    ctx.restore();

    if (this.isDead) return;

    let numer_sprite = SPRITES[`number_${this.level + 1}`];
    
    const px = this.px + TILE_SIZE * 0.8;
    const py = this.py + TILE_SIZE * 0.8;
  
    const size = TILE_SIZE * 0.16;
    ctx.fillStyle = '#121212';
    ctx.fillRect(px - 3, py - 3, size + 6, size + 6);
    ctx.fillStyle = '#fafafa';
    if (map) ctx.fillStyle = map.getWaterBoost(this) > map.globalBoost ? "#6495ED" : '#fafafa';
    ctx.fillRect(px - 2, py - 2, size + 4, size + 4);
    ctx.drawImage(numer_sprite, px + 1, py + 1, size - 2, size - 2);
  }
}

// ===== WATER =====
class WaterTile extends Tile {
  constructor(x, y){
    super(x, y);
    this.level = 0;
  }

  getBoost() {
    return 1 + (this.level + 1) * 0.1;
  }

  isGlobal(){
    return this.level===4;
  }

  canMerge = other => {
    console.log("CAN MERGE?");
    var can = other instanceof WaterTile && this.level < 4 && other.level < 4 && !(this.x == other.x && this.y == other.y);
    console.log(can);
    return can;
  };

  merge(){
    console.log(this.level);
    var water = new WaterTile(this.x, this.y);
    water.level = Math.min(4, this.level + 1);
    map.set(this.x, this.y, water);
    console.log(water.level);

    setTimeout(()=>this.targetScale=1,100);
  }

  render(ctx){
    this.draw(ctx, SPRITES["water_"+this.level]);

    let numer_sprite = SPRITES[`number_${this.level + 1}`];
    
    const px = this.px + TILE_SIZE * 0.8;
    const py = this.py + TILE_SIZE * 0.8;
  
    const size = TILE_SIZE * 0.16;
  
    ctx.fillStyle = '#121212';
    ctx.fillRect(px - 3, py - 3, size + 6, size + 6);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(px - 2, py - 2, size + 4, size + 4);
    ctx.drawImage(numer_sprite, px + 1, py + 1, size - 2, size - 2);
  }
}

// ===== SCISSORS =====
class TrimmerTile extends Tile {
  constructor(x,y){
    super(x,y);
    this.level=0;
  }

  getBoost(){
    if(this.level<=3) return (this.level+1)*0.25;
    return 0;
  }

  isGlobal(){
    return this.level===4;
  }

  canMerge = other => {
    console.log("CAN MERGE?");
    var can = other instanceof WaterTile && this.level < 4 && other.level < 4 && !(this.x == other.x && this.y == other.y);
    console.log(can);
    return can;
  };

  merge(){
    console.log(this.level);
    var water = new WaterTile(this.x, this.y);
    water.level = Math.min(4, this.level + 1);
    map.set(this.x, this.y, water);
    console.log(water.level);

    setTimeout(()=>this.targetScale=1,100);
  }

  render(ctx){
    this.draw(ctx, SPRITES["water_"+this.level]);
  }
}

// ===== MAP =====
class GameMap {
  constructor(size){
    this.size=size;
    this.tiles=[];
    this.globalBoost=1;

    for(let y=0;y<size;y++){
      this.tiles[y]=[];
      for(let x=0;x<size;x++){
        this.tiles[y][x]=new EmptyTile(x,y);
      }
    }
  }

  get(x,y){
    if(x<0||y<0||x>=this.size||y>=this.size) return null;
    return this.tiles[y][x];
  }

  set(x,y,t){
    t.x=x; t.y=y;
    t.scale=0.5;
    t.targetScale=1;
    this.tiles[y][x]=t;
  }

  getNeighbors(t){
    return [
      this.get(t.x+1,t.y),
      this.get(t.x-1,t.y),
      this.get(t.x,t.y+1),
      this.get(t.x,t.y-1),
      this.get(t.x-1,t.y+1),
      this.get(t.x+1,t.y+1),
      this.get(t.x-1,t.y-1),
      this.get(t.x+1,t.y-1)
    ].filter(Boolean);
  }

  getWaterBoost(t){
    let boost=this.globalBoost;

    for (let n of this.getNeighbors(t)) {
      if (n instanceof WaterTile) boost *= n.getBoost();
    }
    // for(let n of this.getNeighbors(t)){
    //   if(n instanceof WaterTile) boost+=n.getBoost();
    // }

    return boost;
  }

  recalcGlobal(){
    this.globalBoost=1;
    for(let row of this.tiles){
      for(let t of row){
        if(t instanceof WaterTile && t.isGlobal()){
          this.globalBoost+=0.5;
        }
      }
    }
  }

  update(dt){
    for(let row of this.tiles){
      for(let t of row){
        t.update(dt, this);
      }
    }
  
    this.recalcGlobal();
  }

  render(ctx){
    ctx.clearRect(0,0,500,500);

    for(let row of this.tiles){
      for(let t of row){
        if(t !== this.dragged || !t.isDragging){
          if(t instanceof WeedTile){
            t.render(ctx, this);
          } else {
            t.render(ctx);
          }
        }
      }
    }

    // dragged na wierzchu
    if(this.dragged){
      this.dragged.render(ctx);
    }
  }

  // ===== DRAG =====
  startDrag(x,y){
    const tile = this.getTileFromPixel(x,y);
    if(!tile) return;
  
    if(this.dragged) return; // 🔥 BLOCK MULTI DRAG
  
    this.dragged = tile;
    tile.isDragging = true;
    tile.targetScale = 1.2;
  }

  endDrag(x, y){
    if(!this.dragged) return;
  
    const d = this.dragged;
    const target = this.getTileFromPixel(x, y);
  
    d.isDragging = false;
    d.targetScale = 1;
  
    if(!target){
      this.dragged = null;
      return;
    }
  
    // ===== EMPTY + EMPTY => SEED =====
    if(d instanceof EmptyTile && target instanceof EmptyTile){
      if(playerInventory.useSeed()){  // tylko jeśli gracz ma nasiona
        this.set(target.x, target.y, new WeedTile(target.x, target.y));
      }
      this.dragged = null;
      return;
    }

    // ===== WEED + WEED => CASH =====
    if (target instanceof WeedTile && d instanceof WeedTile) target.harvest(d);

    // ===== DEAD + DEAD => EMPTY =====
    if (target instanceof WeedTile && d instanceof WeedTile) {
      if (target.x == d.x && target.y == d.y && target.isDead) {
        playerInventory.seeds += 2;
        money += 1;
        map.set(target.x, target.y, new WaterTile(target.x, target.y));
      }
    }

    // ===== WATER + WATER => UPGRADE ===== 
    if (target instanceof WaterTile && d instanceof WaterTile) {
      if (target.canMerge(d)) {
        console.log(d)
        this.set(d.x, d.y, new EmptyTile(d.x, d.y));
        target.merge(d);
        this.dragged = null;
  
        return;
      }
    }
    

    // ===== WATER SWAP =====
    const dx = d.x, dy = d.y;
    const tx = target.x, ty = target.y;
    const temp = this.tiles[ty][tx];
    this.set(tx, ty, d);
    this.set(dx, dy, temp);
  
    this.dragged = null;
  }

  getTileFromPixel(px, py){
    const rect = canvas.getBoundingClientRect();
  
    let x = Math.floor((px - rect.left) / TILE_SIZE);
    let y = Math.floor((py - rect.top) / TILE_SIZE);
  
    if(x < 0 || y < 0 || x >= this.size || y >= this.size){
      return null;
    }
  
    return this.get(x,y);
  }
}

// ===== SETUP =====
const canvas=document.querySelector("canvas");
canvas.width=GRID_SIZE*TILE_SIZE;
canvas.height=GRID_SIZE*TILE_SIZE;

const ctx=canvas.getContext("2d");

const map = new GameMap(GRID_SIZE);

// test
// map.set(0, 0, new WeedTile(0, 0));
// map.set(1, 4, new WeedTile(1, 4));
// map.set(4, 1, new WeedTile(4, 1));
// map.set(0, 0, new WaterTile(0, 0));
// map.set(5, 5, new WaterTile(5, 5));
// map.set(2, 2, new WaterTile(2, 2));
// map.set(3, 3, new WaterTile(3, 3));

// ===== LOOP =====
let last=0;
function loop(t){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const dt=(t-last)/1000;
  last=t;

  map.update(dt);
  popupManager.update(ctx);
  
  map.render(ctx);
  popupManager.draw(ctx);

  document.querySelectorAll('.money-ui').forEach(x => x.innerText = money);
  document.querySelectorAll('.seeds-ui').forEach(x => x.innerText = playerInventory.seeds);

  var testcost = 0;
  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile instanceof EmptyTile) {
        testcost += 1;
      }
    });
  })

  document.querySelectorAll('.test-cost-ui').forEach(x => x.innerText = testcost * 420);

  
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ===== INPUT =====
canvas.addEventListener("mousedown",e=>{
  map.startDrag(e.offsetX,e.offsetY);
});
canvas.addEventListener("mouseup",e=>{
  map.endDrag(e.offsetX,e.offsetY);
});

canvas.addEventListener("touchstart",e=>{
  e.preventDefault();
  const t=e.touches[0];
  map.startDrag(t.clientX,t.clientY);
},{passive:false});

addEventListener("touchend",e=>{
  const t=e.changedTouches[0];
  map.endDrag(t.clientX,t.clientY);
});

canvas.addEventListener("mousemove", e=>{
  if(map.dragged){
    map.dragged.px = e.offsetX - TILE_SIZE/2;
    map.dragged.py = e.offsetY - TILE_SIZE/2;
  }
});

canvas.addEventListener("touchmove", e=>{
  const t=e.changedTouches[0];

  if(map.dragged){
    map.dragged.px = t.clientX - TILE_SIZE/2;
    map.dragged.py = t.clientY - TILE_SIZE/2;
  }
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  popupManager.handleClick(x, y);
});

canvas.addEventListener('touchstart', e => {
  var t = e.touches[0];

  const rect = canvas.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  console.log('a');
  popupManager.handleClick(x, y);
});



canvas.addEventListener('contextmenu', e => {
  e.preventDefault();

  console.log(map.getTileFromPixel(e.x, e.y));
  console.log('c');
});




document.querySelector('.test').addEventListener('click', e => {
  var wx = Math.floor(Math.random() * 6)
  var wy = Math.floor(Math.random() * 6)

  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      setTimeout(() => {
        if (map.tiles[y][x] instanceof EmptyTile && playerInventory.seeds > 0) {
          if (x == wx && y == wy) {
            map.set(x, y, new WaterTile(5 - y, x));
          } else if (Math.floor(Math.random() * 12) == 1) {
            map.set(x, y, new WeedTile(5 - y, x));
            playerInventory.seeds -= 1;
          } else {
            map.set(x, y, new EmptyTile(5 - y, x));
          }

        }
      }, 50 * x ** 0.42 * y ** 0.42);
    });
  })
});


document.querySelector('.zero').addEventListener('click', e => {
  map.tiles.forEach((row, y) => {
    row.forEach((tile, x) => {
      setTimeout(() => {
        map.set(tile.x, tile.y, new EmptyTile(5 - tile.y, 5 - tile.x));
        playerInventory.seeds = 100;
        money = 0;
      }, 50 * x ** 0.42 * y ** 0.42);
    });
  })
});



var max = 0;
for (let i = 0; i < 50; i++) {
  max = Math.max(Math.floor(Math.random() * 6), max);
}
console.log(max)