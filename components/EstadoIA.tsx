export default function EstadoIA({ disponible }: { disponible: boolean }) {
 if (disponible) return null;
 return <div role="status" className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-suave"><p className="font-semibold text-tinta">IA pendiente de activación</p><p className="mt-1">Las consultas se habilitarán cuando el administrador configure el servicio. Puedes seguir trabajando con los documentos y consultar el historial guardado.</p></div>;
}
