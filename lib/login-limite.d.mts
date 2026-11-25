type Consultar = (sql: string, params?: unknown[]) => Promise<any[]>;
export interface Reserva { permitido: boolean; clave: string; ventana?: string; intentos?: number; segundos: number; }
export function claveIntento(correo: string): string;
export function reservarIntento(correo: string, consultar: Consultar): Promise<Reserva>;
export function completarAcceso(reserva: Reserva, consultar: Consultar): Promise<void>;
export function limpiarIntentos(consultar: Consultar): Promise<void>;
