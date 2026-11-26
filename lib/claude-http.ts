import { NextResponse } from 'next/server';
import { ErrorClaude } from './claude.mjs';
export function errorRespuestaClaude(e: unknown) {
 const conocido = e instanceof ErrorClaude;
 return NextResponse.json({ error: conocido ? e.message : 'No se pudo completar la consulta con IA. Vuelve a intentarlo.' }, {
  status: conocido ? e.status : 503,
  headers: { 'Cache-Control': 'private, no-store', ...(conocido && e.reintentar ? { 'Retry-After': String(e.reintentar) } : {}) },
 });
}
