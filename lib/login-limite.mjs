import { createHmac, randomUUID } from 'node:crypto';
import { secretoSesion } from './session-secret.mjs';

export function claveIntento(correo) {
  const secreto = secretoSesion(process.env.JWT_SECRET, process.env.NODE_ENV);
  return createHmac('sha256', secreto).update('noah:login:').update(correo.trim().toLowerCase()).digest('hex');
}

// PostgreSQL arbitra el cupo entre peticiones e instancias concurrentes.
export async function reservarIntento(correo, consultar) {
  const clave = claveIntento(correo);
  const filas = await consultar(`
    INSERT INTO login_intento(clave,ventana,intentos,vence_en)
    VALUES($1,$2,1,clock_timestamp()+interval '15 minutes')
    ON CONFLICT(clave) DO UPDATE SET
      ventana=CASE WHEN login_intento.vence_en<=clock_timestamp() THEN EXCLUDED.ventana ELSE login_intento.ventana END,
      intentos=CASE WHEN login_intento.vence_en<=clock_timestamp() THEN 1 ELSE login_intento.intentos+1 END,
      vence_en=CASE WHEN login_intento.vence_en<=clock_timestamp() THEN EXCLUDED.vence_en ELSE login_intento.vence_en END
    WHERE login_intento.vence_en<=clock_timestamp() OR login_intento.intentos<5
    RETURNING ventana,intentos`, [clave, randomUUID()]);
  if (filas.length) return { permitido: true, clave, ...filas[0], segundos: 0 };
  const espera = await consultar(`SELECT greatest(1,ceil(extract(epoch FROM vence_en-clock_timestamp())))::int segundos FROM login_intento WHERE clave=$1`, [clave]);
  return { permitido: false, clave, segundos: espera[0]?.segundos || 900 };
}

export async function completarAcceso(reserva, consultar) {
  // Un acceso lento no borra los intentos de otra ventana ni peticiones posteriores.
  await consultar('DELETE FROM login_intento WHERE clave=$1 AND ventana=$2 AND intentos=$3', [reserva.clave, reserva.ventana, reserva.intentos]);
}

export async function limpiarIntentos(consultar) {
  await consultar(`DELETE FROM login_intento WHERE clave IN (SELECT clave FROM login_intento WHERE vence_en<clock_timestamp() ORDER BY vence_en LIMIT 100) AND vence_en<clock_timestamp()`);
}
