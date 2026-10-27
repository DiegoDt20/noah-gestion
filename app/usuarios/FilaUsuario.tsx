"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FilaUsuario({ u, roles, areas }: { u: any; roles: any[]; areas: any[] }) {
  const router = useRouter();
  const [rol, setRol] = useState(String(u.id_rol));
  const [area, setArea] = useState(u.id_area ? String(u.id_area) : "");
  const [activo, setActivo] = useState(u.activo as boolean);
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  async function guardar() {
    setMsg(null);
    const body: any = { id_rol: Number(rol), id_area: area || null, activo };
    if (clave) body.clave = clave;
    const r = await fetch(`/api/usuarios/${u.id_usuario}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ t: d.error || "No se pudo guardar", ok: false }); return; }
    setClave(""); setMsg({ t: "Guardado", ok: true }); router.refresh();
  }
  return (
    <tr>
      <td className="td"><div className="font-medium">{u.nombres} {u.apellidos}</div><div className="text-xs text-suave">{u.correo}</div></td>
      <td className="td"><select value={rol} onChange={e => setRol(e.target.value)} className="campo min-w-36">{roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}</select></td>
      <td className="td"><select value={area} onChange={e => setArea(e.target.value)} className="campo min-w-44"><option value="">Sin área</option>{areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}</select></td>
      <td className="td"><input type="checkbox" className="h-4 w-4 accent-marca" checked={activo} onChange={e => setActivo(e.target.checked)} aria-label="Usuario activo" /></td>
      <td className="td"><input type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="Sin cambio" className="campo min-w-32" /></td>
      <td className="td"><button onClick={guardar} className="btn-suave">Guardar</button>{msg && <p className={`mt-1 text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.t}</p>}</td>
    </tr>
  );
}
