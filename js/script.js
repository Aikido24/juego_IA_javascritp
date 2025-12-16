// Variable global para controlar si el juego ya está inicializado
let juegoInicializado = false;
let gameLoopId = null;

// Función para inicializar el juego
function inicializarJuegoCanvas() {
  // Si ya está inicializado, no hacer nada
  if (juegoInicializado) {
    return;
  }

  // Obtener referencia al canvas
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) {
    console.warn("Canvas no encontrado, esperando...");
    return;
  }

  // Verificar si el canvas está visible
  const gameContainer = document.getElementById("gameContainer");
  if (gameContainer && gameContainer.style.display === "none") {
    // El canvas no está visible, esperar a que se muestre
    return;
  }

  // Configurar el tamaño del canvas para ocupar todo el espacio disponible
  const containerWidth = gameContainer ? gameContainer.clientWidth : 375;
  const containerHeight = gameContainer ? gameContainer.clientHeight : 667;

  // Usar todo el espacio del contenedor
  const dpr = window.devicePixelRatio || 1;
  canvas.width = containerWidth * dpr;
  canvas.height = containerHeight * dpr;

  // Obtener el contexto 2D para dibujar
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Establecer estilos CSS
  canvas.style.width = containerWidth + "px";
  canvas.style.height = containerHeight + "px";

  // Usar las dimensiones visuales (sin dpr) para las coordenadas del juego
  // Estas son las dimensiones que se usan para posicionar objetos
  const canvasWidth = containerWidth;
  const canvasHeight = containerHeight;

  // Guardar las dimensiones visuales en el canvas para acceso global
  canvas.visualWidth = canvasWidth;
  canvas.visualHeight = canvasHeight;

  // Crear el player en la parte inferior del canvas, centrado horizontalmente
  const playerX = canvasWidth / 2 - 40; // Centrado (80px de ancho / 2)
  const playerY = canvasHeight - 90; // Parte inferior con un poco de margen
  const player = new Player(playerX, playerY, ctx);

  // Array para almacenar los enemigos
  const enemies = [];

  // Variable para controlar si el juego está pausado
  let juegoPausado = false;

  // Array con objetos literales de sprites de enemigos y su valor correct
  const spritesEnemigos = [
    { imagen: "sprites/ene1.png", correct: true },
    { imagen: "sprites/ene2.png", correct: true },
    { imagen: "sprites/ene3.png", correct: true },
    { imagen: "sprites/ene4.png", correct: false },
    { imagen: "sprites/ene5.png", correct: false },
    { imagen: "sprites/ene6.png", correct: false },
  ];

  // Velocidad de caída de los enemigos
  const velocidadCaida = 4;

  // Cargar sonidos para las colisiones
  const sonidoCorrecto = new Audio("sounds/material-gold-394476.mp3");
  const sonidoIncorrecto = new Audio("sounds/negative_beeps-6008.mp3");

  // Configurar volumen de los sonidos
  sonidoCorrecto.volume = 0.5;
  sonidoIncorrecto.volume = 0.5;

  // Cargar música de fondo
  const musicaFondo = new Audio("sounds/musicbox-23766.mp3");
  musicaFondo.volume = 0.09; // Volumen muy bajo (6%)
  musicaFondo.loop = true; // Reproducir en bucle

  // Variable para rastrear si la música ya se inició
  let musicaIniciada = false;

  // Variable para rastrear si el usuario ya interactuó con la página
  let usuarioInteractuo = false;

  // Función para iniciar el audio después de la interacción del usuario
  function iniciarAudioDespuesDeInteraccion() {
    if (!usuarioInteractuo && !juegoPausado && !musicaIniciada) {
      musicaFondo
        .play()
        .then(() => {
          musicaIniciada = true;
        })
        .catch((e) => {
          // Silenciar el error, el usuario aún no ha interactuado
        });
    }
  }

  // Detectar la primera interacción del usuario
  const eventosInteraccion = ["click", "keydown", "touchstart", "mousedown"];
  eventosInteraccion.forEach((evento) => {
    document.addEventListener(
      evento,
      () => {
        if (!usuarioInteractuo) {
          usuarioInteractuo = true;
          // Iniciar la música después de la primera interacción
          if (!juegoPausado) {
            musicaFondo
              .play()
              .then(() => {
                musicaIniciada = true;
              })
              .catch((e) => {
                console.log(
                  "Error al iniciar música después de interacción:",
                  e
                );
              });
          }
        }
      },
      { once: true } // Solo ejecutar una vez
    );
  });

  // Crear el primer enemigo al inicio del juego
  crearEnemigo(1);

  // Función gravedad para hacer caer los enemigos
  function gravedad() {
    enemies.forEach((enemy) => {
      enemy.y += velocidadCaida;
    });
  }

  // Función para verificar si una posición está ocupada (horizontal y vertical)
  function posicionOcupada(x, y, margenX, margenY) {
    const anchoEnemigo = 120;
    const altoEnemigo = 120;
    const margenSeguridadX = margenX || 10; // Espacio mínimo horizontal entre enemigos
    const margenSeguridadY = margenY || 80; // Espacio mínimo vertical entre enemigos (80px)

    return enemies.some((enemy) => {
      const distanciaX = Math.abs(enemy.x - x);
      const distanciaY = Math.abs(enemy.y - y);
      return (
        distanciaX < anchoEnemigo + margenSeguridadX &&
        distanciaY < altoEnemigo + margenSeguridadY
      );
    });
  }

  // Función para crear y poblar enemigos aleatoriamente
  function crearEnemigo(cantidad) {
    // Si no se proporciona una cantidad, crear un solo enemigo
    if (!cantidad || cantidad <= 0) {
      cantidad = 1;
    }

    // Crear enemigos según la cantidad especificada
    for (let i = 0; i < cantidad; i++) {
      // Seleccionar aleatoriamente un sprite del array spritesEnemigos
      const spriteAleatorio =
        spritesEnemigos[Math.floor(Math.random() * spritesEnemigos.length)];

      let xAleatorio;
      let yAleatorio;
      let intentos = 0;
      const maxIntentos = 100; // Límite de intentos para evitar bucle infinito

      // Buscar una posición X e Y que no esté ocupada
      // Usar dimensiones visuales del canvas
      const visualWidth = canvas.visualWidth || canvas.width;
      const visualHeight = canvas.visualHeight || canvas.height;
      do {
        xAleatorio = Math.random() * (visualWidth - 120);
        // Posición Y fuera de la pantalla (arriba, negativo o muy arriba)
        yAleatorio = -200 - Math.random() * 100;
        intentos++;
      } while (
        posicionOcupada(xAleatorio, yAleatorio, 10, 200) &&
        intentos < maxIntentos
      );

      // Si encontramos una posición válida, crear el enemigo
      if (intentos < maxIntentos) {
        // Crear el enemigo con el sprite seleccionado y agregarlo al array
        const nuevoEnemigo = new Enemy(
          xAleatorio,
          yAleatorio,
          ctx,
          spriteAleatorio.correct,
          spriteAleatorio.imagen
        );
        enemies.push(nuevoEnemigo);
      }
    }
  }

  // Función para generar un número aleatorio de enemigos
  function generarEnemigosAleatorios(numeroMaximo) {
    // Generar un número aleatorio entre 1 y el número máximo
    const cantidadEnemigos = Math.floor(Math.random() * numeroMaximo) + 1;

    // Crear los enemigos con sprites aleatorios del array
    crearEnemigo(cantidadEnemigos);
  }

  // Función para crear un nuevo enemigo cuando uno sale de pantalla
  function crearNuevoEnemigoAlSalir() {
    // Crear un solo enemigo con sprite aleatorio del array
    crearEnemigo(1);
  }

  // Obtener el botón y agregar el event listener (si existe)
  const btnGenerarEnemigos = document.getElementById("btnGenerarEnemigos");
  if (btnGenerarEnemigos) {
    btnGenerarEnemigos.addEventListener("click", () => {
      generarEnemigosAleatorios(5); // Genera entre 1 y 5 enemigos
    });
  }

  // Objeto para rastrear las teclas presionadas
  const keys = {
    ArrowLeft: false,
    ArrowRight: false,
  };

  // Velocidad de movimiento del player
  const velocidad = 5;

  // Listeners del teclado
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      keys.ArrowLeft = true;
    }
    if (e.key === "ArrowRight") {
      keys.ArrowRight = true;
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") {
      keys.ArrowLeft = false;
    }
    if (e.key === "ArrowRight") {
      keys.ArrowRight = false;
    }
  });

  // Función para limpiar enemigos que ya salieron de pantalla y crear nuevos
  function limpiarEnemigosFueraDePantalla() {
    const altoEnemigo = 120;
    const cantidadAntes = enemies.length;
    let enemigosEliminados = 0;

    // Filtrar y mantener solo los enemigos que aún están en pantalla o arriba
    // Usar dimensiones visuales del canvas
    const visualHeight = canvas.visualHeight || canvas.height;
    const enemigosVisibles = enemies.filter((enemy) => {
      const estaEnPantalla = enemy.y <= visualHeight + altoEnemigo;
      if (!estaEnPantalla) {
        enemigosEliminados++;
      }
      return estaEnPantalla;
    });

    // Crear un nuevo enemigo por cada enemigo que salió de pantalla
    for (let i = 0; i < enemigosEliminados; i++) {
      crearNuevoEnemigoAlSalir();
    }

    // Actualizar el array de enemigos
    enemies.length = 0;
    enemies.push(...enemigosVisibles);
  }

  // Función para verificar si un enemigo entró en pantalla y generar uno nuevo
  function verificarEntradaEnPantalla() {
    enemies.forEach((enemy) => {
      // Verificar si el enemigo entró en pantalla (Y >= 0) y aún no se ha marcado
      if (enemy.y >= 0 && !enemy.haEntradoEnPantalla) {
        enemy.haEntradoEnPantalla = true;

        // Crear un nuevo enemigo cuando el anterior aparece en pantalla por primera vez
        crearNuevoEnemigoAlSalir();
      }
    });
  }

  // Función para dibujar el fondo con degradado
  function dibujarFondo() {
    // Usar dimensiones visuales del canvas
    const visualWidth = canvas.visualWidth || canvas.width;
    const visualHeight = canvas.visualHeight || canvas.height;

    // Crear un gradiente lineal desde arriba hacia abajo
    const gradient = ctx.createLinearGradient(0, 0, 0, visualHeight);
    gradient.addColorStop(0, "#fdd42e"); // Color inicial (arriba)
    gradient.addColorStop(1, "#b89814"); // Color final (abajo)

    // Dibujar el degradado en todo el canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, visualWidth, visualHeight);
  }

  // Función para dibujar el score del player
  function dibujarScore() {
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Score: ${player.score}`, 10, 10);
  }

  // Función para dibujar el mensaje de nivel completado
  function dibujarNivelCompletado() {
    if (player.score === 10) {
      // Usar dimensiones visuales del canvas
      const visualWidth = canvas.visualWidth || canvas.width;
      const visualHeight = canvas.visualHeight || canvas.height;

      // Calcular el tamaño del texto basado en el ancho del canvas
      // Usar aproximadamente 12% del ancho del canvas para el tamaño de fuente
      const tamanoFuente = Math.min(visualWidth * 0.12, 40);
      const texto = "Nivel Completado";

      // Configurar el estilo del texto
      ctx.font = `bold ${tamanoFuente}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Medir el texto para ajustar el fondo
      const medidaTexto = ctx.measureText(texto);
      const anchoTexto = medidaTexto.width;
      const altoTexto = tamanoFuente;
      const padding = 20;

      // Dibujar fondo semitransparente para mejor visibilidad
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      const fondoX = visualWidth / 2 - anchoTexto / 2 - padding;
      const fondoY = visualHeight / 2 - altoTexto / 2 - padding;
      const fondoAncho = anchoTexto + padding * 2;
      const fondoAlto = altoTexto + padding * 2;
      ctx.fillRect(fondoX, fondoY, fondoAncho, fondoAlto);

      // Dibujar sombra para mejor visibilidad
      ctx.shadowColor = "black";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Dibujar el texto en el centro del canvas
      ctx.fillStyle = "white";
      ctx.fillText(texto, visualWidth / 2, visualHeight / 2);

      // Restaurar sombra
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }

  // Función del game loop principal
  function gameLoop() {
    // Dibujar el fondo con degradado
    dibujarFondo();

    // Verificar si el nivel está completado y pausar el juego
    if (player.score === 10) {
      if (!juegoPausado) {
        juegoPausado = true;
      }
    }

    // Controlar la música de fondo según el estado del juego
    if (juegoPausado) {
      // Si el juego está pausado, FORZAR que la música esté pausada
      musicaFondo.pause();
    } else {
      // Si el juego está activo y el usuario ya interactuó, iniciar o reproducir la música
      if (usuarioInteractuo) {
        if (!musicaIniciada) {
          musicaFondo
            .play()
            .then(() => {
              musicaIniciada = true;
            })
            .catch((e) => {
              // Error silenciado, ya se maneja en el listener de interacción
            });
        } else if (musicaFondo.paused) {
          // Si la música ya se inició pero está pausada, reanudarla
          musicaFondo.play().catch((e) => {
            // Error silenciado
          });
        }
      }
    }

    // Solo ejecutar la lógica del juego si no está pausado
    if (!juegoPausado) {
      // Aplicar gravedad a los enemigos
      gravedad();

      // Limpiar enemigos que ya salieron de pantalla
      limpiarEnemigosFueraDePantalla();

      // Verificar si algún enemigo entró en pantalla y crear el siguiente
      verificarEntradaEnPantalla();

      // Mover el player según las teclas presionadas
      if (keys.ArrowLeft) {
        player.mover(-velocidad);
      }
      if (keys.ArrowRight) {
        player.mover(velocidad);
      }

      // Detectar colisiones y actualizar score
      const colisiones = player.detectarColisiones(enemies);

      // Eliminar los enemigos con los que se colisionó y reproducir sonidos
      if (colisiones.length > 0) {
        colisiones.forEach((enemyColisionado) => {
          // Reproducir sonido según si el enemigo es correcto o no (solo si el usuario ya interactuó)
          if (usuarioInteractuo) {
            if (enemyColisionado.correct) {
              // Reiniciar y reproducir sonido de éxito
              sonidoCorrecto.currentTime = 0;
              sonidoCorrecto.play().catch((e) => {
                // Error silenciado, el usuario ya interactuó
              });
            } else {
              // Reiniciar y reproducir sonido de error
              sonidoIncorrecto.currentTime = 0;
              sonidoIncorrecto.play().catch((e) => {
                // Error silenciado, el usuario ya interactuó
              });
            }
          }

          const index = enemies.indexOf(enemyColisionado);
          if (index > -1) {
            enemies.splice(index, 1);
          }
        });
      }
    }

    // Dibujar los enemigos (siempre se dibujan para mantener el estado visual)
    enemies.forEach((enemy) => {
      enemy.dibujar();
    });

    // Dibujar el player (siempre se dibuja para mantener el estado visual)
    player.dibujar();

    // Dibujar el score
    dibujarScore();

    // Dibujar mensaje de nivel completado si el score es 10
    dibujarNivelCompletado();

    // Continuar el loop
    requestAnimationFrame(gameLoop);
  }

  // Iniciar el game loop
  gameLoop();
  juegoInicializado = true;
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  // Intentar inicializar el juego después de un pequeño delay
  // para asegurar que todos los elementos estén listos
  setTimeout(() => {
    inicializarJuegoCanvas();
  }, 100);
});

// Exportar la función para que pueda ser llamada desde ChatAcompanamiento.html
window.inicializarJuegoCanvas = inicializarJuegoCanvas;
