/**
 * Botones de amistad en el perfil de otra persona, según el estado actual:
 * sin relación → agregar · solicitud enviada → cancelar · recibida → aceptar/rechazar
 * · amigos → enviar mensaje / eliminar.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { aceptarSolicitud, eliminarAmistad, enviarSolicitud } from '../api/amistades.js';
import { abrirConversacion } from '../api/conversaciones.js';
import { useAvisos } from '../hooks/useAvisos.js';

export function AccionesAmistad({ perfil, alCambiar }) {
  const { avisar } = useAvisos();
  const navegar = useNavigate();
  const [ocupado, setOcupado] = useState(false);
  const amistad = perfil.amistad ?? null;

  async function ejecutar(accion, mensajeExito) {
    setOcupado(true);
    try {
      await accion();
      if (mensajeExito) avisar(mensajeExito);
    } catch (e) {
      avisar(e.message, 'error');
    } finally {
      setOcupado(false);
    }
  }

  const agregar = () =>
    ejecutar(async () => {
      const solicitud = await enviarSolicitud(perfil.id);
      alCambiar({ id: solicitud.id, estado: 'pendiente', soyElSolicitante: true });
    }, 'Solicitud enviada');

  const aceptar = () =>
    ejecutar(async () => {
      await aceptarSolicitud(amistad.id);
      alCambiar({ ...amistad, estado: 'aceptada' });
    }, `Ahora eres amigo de ${perfil.nombres}`);

  const quitar = (pregunta, mensaje) => {
    if (pregunta && !window.confirm(pregunta)) return;
    ejecutar(async () => {
      await eliminarAmistad(amistad.id);
      alCambiar(null);
    }, mensaje);
  };

  const enviarMensaje = () =>
    ejecutar(async () => {
      const conversacion = await abrirConversacion(perfil.id);
      navegar(`/mensajes/${conversacion.id}`);
    });

  if (!amistad) {
    return (
      <button className="boton" onClick={agregar} disabled={ocupado}>
        ➕ Agregar amigo
      </button>
    );
  }

  if (amistad.estado === 'pendiente' && amistad.soyElSolicitante) {
    return (
      <div className="fila">
        <span className="suave">Solicitud enviada</span>
        <button
          className="boton-secundario"
          onClick={() => quitar(null, 'Solicitud cancelada')}
          disabled={ocupado}
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (amistad.estado === 'pendiente') {
    return (
      <div className="fila">
        <button className="boton" onClick={aceptar} disabled={ocupado}>
          Aceptar solicitud
        </button>
        <button
          className="boton-secundario"
          onClick={() => quitar(null, 'Solicitud rechazada')}
          disabled={ocupado}
        >
          Rechazar
        </button>
      </div>
    );
  }

  return (
    <div className="fila">
      <span className="exito">✔ Amigos</span>
      <button className="boton" onClick={enviarMensaje} disabled={ocupado}>
        💬 Mensaje
      </button>
      <button
        className="boton-peligro"
        onClick={() => quitar(`¿Eliminar a ${perfil.nombres} de tus amigos?`, 'Amigo eliminado')}
        disabled={ocupado}
      >
        Eliminar
      </button>
    </div>
  );
}
