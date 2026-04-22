class Jackpot {
    constructor() {
        this.requiredTime = 5;
        this.time = 0;

        this.won = [];
    }

    update(dt, map) {
        this.time += dt;

        if (this.time < this.requiredTime) return;
        this.time -= this.requiredTime;
    
        const lines = this.won;

        // if (this.won != []) return;

        // poziome
        for (let y = 0; y < 6; y++) {
          if (map.tiles[y].every(v => v.constructor == map.tiles[y][0].constructor && v.level == map.tiles[y][0].level && !(v instanceof EmptyTile))) {
            lines.push({
              type: "horizontal",
              cells: map.tiles[y].map((tile, x) => [tile.px, tile.py])
            });
          }
        }
      
        // pionowe
        for (let x = 0; x < 6; x++) {
          const first = map.tiles[0][x];
          let valid = true;

          var cells = [];
      
          for (let y = 1; y < 6; y++) {
            if (map.tiles[y][x].constructor !== first.constructor || map.tiles[y][x].level != first.level || first instanceof EmptyTile) {
              valid = false;
              break;
            }

            cells.push(map.tiles[x][y].px, map.tiles[x][y].py);
          }
      
          if (valid) {
            lines.push({ type: "vertical", cells });
          }
        }
      
        // skos \
        const firstDiag = map.tiles[0][0];
        if ([1,2,3,4,5].every(i => map.tiles[i][i].constructor == firstDiag.constructor && map.tiles[i][i].level == firstDiag.level && !(firstDiag instanceof EmptyTile))) {
          lines.push({
            type: "diagonal \\",
            cells: Array.from({ length: 6 }, (_, i) => [i, i])
          });
        }
      
        // skos /
        const secondDiag = map.tiles[0][5];
        if ([1,2,3,4,5].every(i => map.tiles[i][5-i].constructor == secondDiag.constructor && map.tiles[i][5-i].level == secondDiag.level) && !(secondDiag instanceof EmptyTile)) {
          lines.push({
            type: "diagonal /",
            cells: Array.from({ length: 6 }, (_, i) => [5-i, i])
          });
        }

        this.won = lines;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx, map) {
        var percent = this.time * 100 / this.requiredTime;

        ctx.fillStyle = 'rgba(18, 18, 18, 0.42)';
        ctx.fillRect(0, -21, ctx.canvas.width * percent / 100, 42);

        ctx.strokeStyle = 'rgba(200, 100, 50, 0.42);';
        ctx.lineWidth = 10;
        
        ctx.beginPath();
        this.won.forEach(x => {
            ctx.moveTo(x.cells[0][0] + TILE_SIZE / 2, x.cells[0][1] + TILE_SIZE / 2);
            ctx.lineTo(x.cells[x.cells.length - 1][0] + TILE_SIZE / 2, x.cells[x.cells.length - 1][1] + TILE_SIZE / 2);
        });
        ctx.stroke();

        if (this.won != []) {
            setTimeout(() => {
                this.won = [];
            }, 5000);
        }
    }
}