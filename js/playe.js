class Player {
  constructor(x, y, ctx) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.score = 0;
    this.imagen = new Image();
    this.imagen.src = "sprites/player.png";
    this.imagenCargada = false;

    // Cuando la imagen se carga, marcar como cargada
    this.imagen.onload = () => {
      this.imagenCargada = true;
    };
  }

  incrementarScore() {
    this.score++;
  }

  decrementarScore() {
    this.score--;
  }

  dibujar() {
    // Si la imagen está cargada, dibujarla; si no, dibujar el cuadrado rojo como fallback
    if (this.imagenCargada) {
      this.ctx.drawImage(this.imagen, this.x, this.y, 80, 80);
    } else {
      // Fallback mientras la imagen se carga
      this.ctx.fillStyle = "red";
      this.ctx.fillRect(this.x, this.y, 80, 80);
    }
  }

  mover(velocidad) {
    // Mover el player (velocidad positiva = derecha, negativa = izquierda)
    this.x += velocidad;

    // Limitar el movimiento dentro del canvas
    const anchoPlayer = 80;
    if (this.x < 0) {
      this.x = 0;
    }
    if (this.x + anchoPlayer > this.ctx.canvas.width) {
      this.x = this.ctx.canvas.width - anchoPlayer;
    }
  }

  // Función para detectar colisiones con la lista de enemigos
  detectarColisiones(enemies) {
    const anchoPlayer = 80;
    const altoPlayer = 80;
    const colisiones = [];

    // Área de impacto reducida para compensar la transparencia de los sprites
    // Usamos 70% del tamaño del sprite para el área de colisión
    const anchoEnemigoImpacto = 120 * 0.7; // 84px
    const altoEnemigoImpacto = 120 * 0.7; // 84px
    const offsetX = (120 - anchoEnemigoImpacto) / 2; // Centrar el área de impacto
    const offsetY = (120 - altoEnemigoImpacto) / 2;

    enemies.forEach((enemy) => {
      // Verificar colisión usando AABB con área de impacto reducida
      // Ajustar la posición del enemigo para usar el área de impacto centrada
      const enemyXImpacto = enemy.x + offsetX;
      const enemyYImpacto = enemy.y + offsetY;

      const hayColision =
        this.x < enemyXImpacto + anchoEnemigoImpacto &&
        this.x + anchoPlayer > enemyXImpacto &&
        this.y < enemyYImpacto + altoEnemigoImpacto &&
        this.y + altoPlayer > enemyYImpacto;

      if (hayColision) {
        colisiones.push(enemy);

        // Verificar si el enemigo es correct y actualizar el score
        if (enemy.correct) {
          this.incrementarScore();
        } else {
          this.decrementarScore();
        }
      }
    });

    return colisiones; // Retorna un array con los enemigos con los que colisionó
  }
}
