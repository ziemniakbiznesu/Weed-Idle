
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

for (let i = 0; i <= 8; i++) load("weed_"+i, `./ziem_plants/weed_${i}.png`);
load("sweed_7", "./ziem_plants/sweed_7.png");
load("sweed_8", "./ziem_plants/sweed_8.png");

for (let i = 0; i <= 4; i++) load("water_"+i, `./ziem_plants/water_${i}.png`);


class PlayerInventory {
  constructor(){
    this.seeds = 5;  // np. startowa ilość nasion
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
  }

  update(dt, map){
    super.update(dt, map);
  
    // --- Growth ALWAYS ---
    let boost = map.getWaterBoost(this);
    this.growth += dt * boost;
  
    if(this.stage === "seed" && this.growth > 2){
      this.stage = "growing";
      this.growth = 0;
    }
  
    if(this.stage === "growing" && this.growth > 2 + this.level){
      this.level = Math.min(8, this.level + 1);
      this.growth = 0;
    }
  
    // --- Sweed logic after normal growth ---
    if(boost > map.globalBoost && this.level >= 7 && !this.special && !this.sweedActivated){
      this.level = Math.max(this.level, 7);
      this.special = true;
      this.sweedActivated = true;
      this.targetScale = 1.4;
      setTimeout(()=> this.targetScale=1,150);
      console.log('Sweed appeared at:', this.x, this.y);
    }
  }

  canMerge(other){
    return other instanceof WeedTile &&
      this.level>=7 && other.level>=7;
  }

  merge(){
    const r=Math.random();

    if(r<0.1){this.level=8; this.special=true;}
    else if(r<0.3){this.level=7; this.special=true;}

    this.targetScale=1.4;
    setTimeout(()=>this.targetScale=1,100);
  }

  render(ctx, map){
    if (map) {
      let boost = map.getWaterBoost(this);
      if(boost > map.globalBoost){
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.px, this.py, TILE_SIZE, TILE_SIZE);
      }
    }
  
    let sprite;
    if(this.stage==="seed") sprite = SPRITES.seed;
    else if(this.special) sprite = SPRITES["sweed_"+this.level];
    else sprite = SPRITES["weed_"+this.level];
  
    this.draw(ctx, sprite);
  }
}

// ===== WATER =====
class WaterTile extends Tile {
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
      this.get(t.x,t.y-1)
    ].filter(Boolean);
  }

  getWaterBoost(t){
    let boost=this.globalBoost;

    for(let n of this.getNeighbors(t)){
      if(n instanceof WaterTile) boost+=n.getBoost();
    }

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
    if(d instanceof WeedTile && d.level == 8 && target instanceof WeedTile && target.level == 8){

      if (d.special && target.special) {
        money += 42;
        this.set(target.x, target.y, new WeedTile(target.x, target.y));
        this.dragged = null;
      }

      if (!d.special && !target.special) {
        money += 24;
        this.set(target.x, target.y, new WeedTile(target.x, target.y));
        this.dragged = null;
      }

      console.log(`Money: ${money}`);
      
      return;
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
  
    // ❌ NIE CLAMPUJ (to było błędne podejście)
    // ✔ ZWRÓĆ NULL jak poza mapą
  
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

const map=new GameMap(GRID_SIZE);

// test
map.set(1,1,new WeedTile(1,1));
map.set(2,1,new WeedTile(2,1));
map.set(0,0,new WaterTile(0,0));

// ===== LOOP =====
let last=0;
function loop(t){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const dt=(t-last)/1000;
  last=t;

  map.update(dt);
  map.render(ctx);
  popupManager.draw(ctx);

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