"use client";
import Icono from "@/components/Icono";
export default function ErrorPagina({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="panel mx-auto max-w-xl p-8" role="alert"><Icono nombre="reloj" className="mb-4 text-marca" /><h1 className="text-xl font-semibold">No pudimos cargar esta página</h1><p className="mt-3 text-sm leading-6 text-suave">El servicio puede estar temporalmente fuera de línea. Intenta cargar la página otra vez; si el problema continúa, contacta al administrador.</p><button onClick={reset} className="btn mt-6">Volver a intentar</button></section>;
}
