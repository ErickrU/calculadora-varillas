/**
 * Registro del service worker, aviso de nueva versión, prompt de instalación
 * y estado de la conexión. Módulo independiente de la lógica de cálculo.
 */
const estadoSw = document.getElementById('estado-sw');
const toast = document.getElementById('toast-actualizacion');
const btnRecargar = document.getElementById('btn-recargar');
const btnInstalar = document.getElementById('btn-instalar');
const chipConexion = document.getElementById('chip-conexion');

const informar = (texto) => { if (estadoSw) estadoSw.textContent = texto ? `Service worker: ${texto}` : ''; };

/* ================================================================
   1. Service worker
   ================================================================ */
if (!('serviceWorker' in navigator)) {
  informar('no soportado en este navegador');
} else {
  // Solo recargamos si NOSOTROS pedimos activar la versión nueva. En la primera
  // visita clients.claim() también dispara controllerchange y recargar ahí
  // sería un parpadeo gratuito.
  let saltoSolicitado = false;
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!saltoSolicitado || recargando) return;
    recargando = true;
    location.reload();
  });

  /** Un SW "esperando" solo es una actualización real si ya había otro controlando. */
  function revisarEspera(registro) {
    if (!registro.waiting || !navigator.serviceWorker.controller) return;
    informar('nueva versión lista');
    if (!toast || !btnRecargar) return;
    toast.hidden = false;
    btnRecargar.onclick = () => {
      btnRecargar.disabled = true;
      saltoSolicitado = true;
      registro.waiting.postMessage({ tipo: 'SALTAR_ESPERA' });
    };
  }

  window.addEventListener('load', async () => {
    try {
      const registro = await navigator.serviceWorker.register('./sw.js');
      informar(registro.active ? 'activo · disponible sin conexión' : 'instalando…');

      revisarEspera(registro);
      registro.addEventListener('updatefound', () => {
        const nuevo = registro.installing;
        nuevo?.addEventListener('statechange', () => {
          if (nuevo.state === 'installed') {
            if (navigator.serviceWorker.controller) revisarEspera(registro);
            else informar('activo · disponible sin conexión');
          }
        });
      });
    } catch (error) {
      console.error('[SW] no se pudo registrar:', error);
      informar('no se pudo registrar');
    }
  });
}

/* ================================================================
   2. Instalación (beforeinstallprompt)
   ================================================================ */
let promptInstalacion = null;

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();
  promptInstalacion = evento;
  if (btnInstalar) btnInstalar.hidden = false;
});

btnInstalar?.addEventListener('click', async () => {
  if (!promptInstalacion) return;
  btnInstalar.disabled = true;
  try {
    await promptInstalacion.prompt();
    await promptInstalacion.userChoice;
  } finally {
    promptInstalacion = null;
    btnInstalar.hidden = true;
    btnInstalar.disabled = false;
  }
});

window.addEventListener('appinstalled', () => {
  promptInstalacion = null;
  if (btnInstalar) btnInstalar.hidden = true;
});

/* ================================================================
   3. Estado de la conexión
   ================================================================ */
function actualizarConexion() {
  if (!chipConexion) return;
  const enLinea = navigator.onLine;
  chipConexion.dataset.estado = enLinea ? 'en-linea' : 'sin-conexion';
  chipConexion.querySelector('.chip__texto').textContent = enLinea ? 'En línea' : 'Sin conexión · la calculadora sigue funcionando';
}
window.addEventListener('online', actualizarConexion);
window.addEventListener('offline', actualizarConexion);
actualizarConexion();
