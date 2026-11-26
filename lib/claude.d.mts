export const MODELO_CLAUDE: string;
export function estadoClaude(): { configurada: boolean; modelo: string };
export class ErrorClaude extends Error { status: number; reintentar: number; constructor(message: string, status?: number, reintentar?: number); }
export function consultarClaude(opciones: { sistema: string; datos: unknown; esquema: object }): Promise<any>;
export const esquemaAsistente: object;
export const esquemaContraste: object;
