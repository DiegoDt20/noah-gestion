export type NombreIcono = "inicio" | "proyectos" | "tareas" | "usuarios" | "flecha" | "buscar" | "salir" | "calendario" | "reloj" | "check" | "actualizar" | "descargar" | "campana" | "reportes";
const paths: Record<NombreIcono, string> = {
  reportes: "M14 2H5v20h14V7l-5-5zm0 0v6h5M8 12h8M8 16h6",
  campana: "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  actualizar: "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0112-2l2 3M4 16l2 3a7 7 0 0012-2",
  descargar: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  inicio: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  proyectos: "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  tareas: "M9 11l3 3 8-8M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9",
  usuarios: "M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.87M16 3.13a3.5 3.5 0 010 6.74",
  flecha: "M5 12h14m-6-6 6 6-6 6",
  buscar: "M21 21l-5-5M18 10a8 8 0 11-16 0 8 8 0 0116 0",
  salir: "M9 4H4v16h5m5-12 4 4-4 4m-6-4h13",
  calendario: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14H3V6a2 2 0 012-2z",
  reloj: "M12 8v5l3 2M22 12a10 10 0 11-20 0 10 10 0 0120 0",
  check: "M5 12l4 4L19 6",
};
export default function Icono({ nombre, className = "" }: { nombre: NombreIcono; className?: string }) {
  return <svg className={`shrink-0 ${className}`} width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[nombre]} /></svg>;
}
