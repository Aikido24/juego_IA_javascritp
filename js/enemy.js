class Enemy {
  constructor(x, y, ctx, correct, imagenSrc) {
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.correct = correct;
    this.haEntradoEnPantalla = false; // Marcar que aún no ha entrado en pantalla
    this.imagen = new Image();
    this.imagen.src = imagenSrc || "sprites/ene1.png";
    this.imagenCargada = false;

    // Cuando la imagen se carga, marcar como cargada
    this.imagen.onload = () => {
      this.imagenCargada = true;
    };
  }

  dibujar() {
    // Si la imagen está cargada, dibujarla; si no, dibujar el cuadrado como fallback
    if (this.imagenCargada) {
      this.ctx.drawImage(this.imagen, this.x, this.y, 120, 120);
    } else {
      // Fallback mientras la imagen se carga
      if (this.correct) {
        this.ctx.fillStyle = "green";
      } else {
        this.ctx.fillStyle = "blue";
      }
      this.ctx.fillRect(this.x, this.y, 120, 120);
    }
  }
}
