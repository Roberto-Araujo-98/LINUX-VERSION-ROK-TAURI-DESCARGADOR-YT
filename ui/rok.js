const { invoke } = window.__TAURI__.core;
const { getCurrentWindow } = window.__TAURI__.window;

// Referencias de paneles y contenedores
const panelMenu = document.getElementById('panel-menu');
const panelProgreso = document.getElementById('panel-progreso');
const grupoBotonesIniciales = document.getElementById('grupo-botones-iniciales');
const contenedorCalidad = document.getElementById('contenedor-calidad');

// Referencias de inputs y controles
const inputUrl = document.getElementById('input-url');
const selectCalidad = document.getElementById('select-calidad');
const btnRegresar = document.getElementById('btn-regresar');

// Nuevos botones de flujo
const btnConfirmarVideo = document.getElementById('btn-confirmar-video');
const btnCancelarCalidad = document.getElementById('btn-cancelar-calidad');

// Flag de control para evitar cierres accidentales durante la descarga
let estaDescargando = false;

// --- SISTEMA DE ALERTAS CON ESTILO CYBERPUNK ---
function mostrarAlertaCyber(mensaje, esError = false) {
  const alertaPrevia = document.getElementById('cyber-alert');
  if (alertaPrevia) alertaPrevia.remove();

  const alerta = document.createElement('div');
  alerta.id = 'cyber-alert';

  alerta.style.position = 'absolute';
  alerta.style.top = '15px';
  alerta.style.left = '50%';
  alerta.style.transform = 'translateX(-50%)';
  alerta.style.padding = '12px 20px';
  alerta.style.borderRadius = '6px';
  alerta.style.fontFamily = "'Courier New', Courier, monospace";
  alerta.style.fontSize = '12px';
  alerta.style.zIndex = '9999';
  alerta.style.width = '85%';
  alerta.style.boxSizing = 'border-box';
  alerta.style.textAlign = 'center';
  alerta.style.textTransform = 'uppercase';
  alerta.style.backgroundColor = '#020204';

  if (esError) {
    alerta.style.border = '2px solid var(--neon-red)';
    alerta.style.color = 'var(--neon-red)';
    alerta.style.boxShadow = '0 0 15px var(--neon-red-glow)';
    alerta.innerHTML = `>> CRITICAL_WARNING: ${mensaje}`;
  } else {
    alerta.style.border = '2px solid var(--neon-green)';
    alerta.style.color = 'var(--neon-green)';
    alerta.style.boxShadow = '0 0 15px var(--neon-green-glow)';
    alerta.innerHTML = `>> SYSTEM_INFO: ${mensaje}`;
  }

  document.querySelector('.container').appendChild(alerta);

  setTimeout(() => {
    alerta.style.transition = 'opacity 0.5s ease';
    alerta.style.opacity = '0';
    setTimeout(() => alerta.remove(), 500);
  }, 4000);
}

// --- FUNCIÓN CENTRAL DE DESCARGA (Llamada a Rust + Validación de URL + Barra Comercial) ---
async function ejecutarDescargaFrontend(tipoFormato) {
  const url = inputUrl.value.trim();

  // 1. Validación de cadena vacía
  if (!url) {
    mostrarAlertaCyber("Cadena de URL vacía. Inserte un link válido.", true);
    return;
  }

  // 2. Validación de formato de URL (Soporta youtube.com, youtu.be, etc.)
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  if (!youtubeRegex.test(url)) {
    mostrarAlertaCyber("URL NO VÁLIDA. VERIFIQUE EL PROTOCOLO O ENLACE DE CONEXIÓN.", true);
    return;
  }

  // Bloqueamos la salida de la app
  estaDescargando = true;

  const calidadSeleccionada = selectCalidad ? selectCalidad.value : "1";

  // Pasar a pantalla de carga
  panelMenu.classList.add('oculto');
  panelProgreso.classList.remove('oculto');
  btnRegresar.classList.add('oculto');

  // Obtener referencias de la barra de carga comercial
  const barraTrack = document.getElementById('barra-track');
  const barraFill = document.getElementById('barra-fill');
  const porcentajeTexto = document.getElementById('progreso-porcentaje');
  const tituloProgreso = document.getElementById('progreso-titulo');
  const detallesTexto = document.getElementById('progreso-detalles');

  // Resetear barra de progreso a estado inicial (Estilo Cyan / Green)
  barraTrack.classList.remove('error-state');
  barraFill.classList.remove('error-state');
  barraFill.style.width = "0%";
  porcentajeTexto.innerText = "0%";
  porcentajeTexto.style.color = "#00f0ff";
  tituloProgreso.innerText = ">> STATUS: REQUESTING_DATA";
  detallesTexto.innerText = "CONECTANDO CON LOS SERVIDORES DE EXTRACCIÓN... ESPERE RESPUESTA.";

  // Animación simulada fluida e inteligente para el usuario
  let progresoActual = 0;
  const intervaloProgreso = setInterval(() => {
    if (progresoActual < 50) {
      progresoActual += Math.floor(Math.random() * 8) + 3; // Sube rápido al inicio
    } else if (progresoActual < 85) {
      progresoActual += Math.floor(Math.random() * 3) + 1; // Se frena un poco
    } else if (progresoActual < 94) {
      progresoActual += 0.5; // Va muy lento mientras Rust procesa la descarga final
    }

    if (progresoActual > 94) progresoActual = 94;

    const pRedondeado = Math.floor(progresoActual);
    barraFill.style.width = `${pRedondeado}%`;
    porcentajeTexto.innerText = `${pRedondeado}%`;

    if (pRedondeado > 40 && pRedondeado < 80) {
      tituloProgreso.innerText = `>> STATUS: EXTRACTING_${tipoFormato.toUpperCase()}_STREAM`;
      detallesTexto.innerText = "DESCARGANDO PAQUETES DE DATOS DESDE EL STREAM... NO CIERRES LA APP.";
    } else if (pRedondeado >= 80) {
      tituloProgreso.innerText = ">> STATUS: CONVERTING_FORMAT_CONVERSION";
      detallesTexto.innerText = "ACOPLANDO AUDIO Y VIDEO (FFMPEG EN PROCESO). ESTO PUEDE TARDAR UN MOMENTO.";
    }
  }, 350);

  try {
    // Ejecución asíncrona hacia Rust
    const resultado = await invoke("ejecutar_descarga", {
      url: url,
      formato: tipoFormato,
      calidad: calidadSeleccionada
    });

    // ¡Descarga completada con éxito! (Salto al 100% inmediato y verde)
    clearInterval(intervaloProgreso);
    barraFill.style.width = "100%";
    porcentajeTexto.innerText = "100%";
    porcentajeTexto.style.color = "#00ff66";
    tituloProgreso.innerText = ">> SUCCESS: SYSTEM_COMPLETED";
    detallesTexto.innerText = "ARCHIVO GUARDADO EXITOSAMENTE EN TU CARPETA DE DESCARGAS.";
    mostrarAlertaCyber("Descarga finalizada de forma exitosa.");

  } catch (error) {
    // Manejo de error (La barra se vuelve Roja)
    clearInterval(intervaloProgreso);
    barraTrack.classList.add('error-state');
    barraFill.classList.add('error-state');
    porcentajeTexto.innerText = "FAIL";
    porcentajeTexto.style.color = "#ff0055";
    tituloProgreso.innerText = ">> ERROR: PROCESS_ABORTED";
    detallesTexto.innerText = `FALLO: ${error}`;
    mostrarAlertaCyber("Fallo en la extracción de datos.", true);
  } finally {
    // Liberamos el bloqueo de salida y mostramos botón de retorno
    estaDescargando = false;
    btnRegresar.classList.remove('oculto');
  }
}

// --- MANEJO DE EVENTOS DE FLUJO ---

// 1. Clic en descargar MP3 (Descarga de inmediato)
document.getElementById('btn-audio').addEventListener('click', () => {
  const url = inputUrl.value.trim();
  if (!url) {
    mostrarAlertaCyber("Cadena de URL vacía. Inserte un link válido.", true);
    return;
  }
  ejecutarDescargaFrontend('audio');
});

// 2. Clic en descargar MP4 (Muestra la configuración de calidad)
document.getElementById('btn-video').addEventListener('click', () => {
  const url = inputUrl.value.trim();
  if (!url) {
    mostrarAlertaCyber("Cadena de URL vacía. Inserte un link válido.", true);
    return;
  }
  grupoBotonesIniciales.classList.add('oculto');
  contenedorCalidad.classList.remove('oculto');
});

// 3. Confirmar descarga de video una vez seleccionada la calidad
btnConfirmarVideo.addEventListener('click', () => {
  ejecutarDescargaFrontend('video');
});

// 4. Cancelar selección de calidad y volver a los botones MP3/MP4
btnCancelarCalidad.addEventListener('click', () => {
  contenedorCalidad.classList.add('oculto');
  grupoBotonesIniciales.classList.remove('oculto');
});

// 5. Botón Regresar de la pantalla de progreso
btnRegresar.addEventListener('click', () => {
  inputUrl.value = "";
  panelProgreso.classList.add('oculto');

  // Reseteamos el menú inicial para la siguiente descarga
  contenedorCalidad.classList.add('oculto');
  grupoBotonesIniciales.classList.remove('oculto');
  panelMenu.classList.remove('oculto');
});

// 6. Botón Salir (Evita cierre si descarga)
document.getElementById('btn-salir').addEventListener('click', async () => {
  if (estaDescargando) {
    mostrarAlertaCyber("OPERACIÓN ACTIVA. No interrumpa el proceso de descarga.", true);
    return;
  }
  const appWindow = getCurrentWindow();
  await appWindow.close();
});
