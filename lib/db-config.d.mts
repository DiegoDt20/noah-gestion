export function configDB(opciones?: {url?:string;ssl?:string;ca?:string;entorno?:string}): {connectionString:string|undefined;ssl:false|{rejectUnauthorized:true;ca?:string}};
export function configDBDesdeEntorno(): {connectionString:string|undefined;ssl:false|{rejectUnauthorized:true;ca?:string}};
