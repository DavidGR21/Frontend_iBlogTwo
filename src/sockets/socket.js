import { io } from 'socket.io-client';
import { API_URL } from '../config.js';
import { obtenerToken } from '../api/cliente.js';

/**
 * Crea la conexión de tiempo real. `auth` es una función para que cada
 * (re)conexión use el token MÁS RECIENTE, no el que había al crearla.
 */
export function crearSocket() {
  return io(API_URL, {
    auth: (enviar) => enviar({ token: obtenerToken() }),
  });
}
