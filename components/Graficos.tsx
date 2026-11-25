"use client";
import Link from "next/link";
import { useState } from "react";
export type Dato = { id: string; nombre: string; valor: number; color: string; corto?: string };
const pct = (v: number, t: number) => (t ? Math.round((v / t) * 100) : 0);

export function Anillo({ valor, tam = 64, grosor = 7, color = "#0f9f85", pista = "#e3f3ef", children }: { valor: number; tam?: number; grosor?: number; color?: string; pista?: string; children?: React.ReactNode }) {
  const r = 50 - grosor / 2;
  return <div className="anillo" style={{ width: tam, height: tam }} role="img" aria-label={`${valor}% completado`}>
    <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r={r} fill="none" stroke={pista} strokeWidth={grosor} />{valor > 0 && <circle className="anillo-valor" cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" pathLength="100" strokeDasharray={`${valor} 100`} transform="rotate(-90 50 50)" />}</svg>
    <div aria-hidden="true">{children ?? <strong>{valor}%</strong>}</div>
  </div>;
}

export function Dona({ datos, etiqueta, activo, alElegir }: { datos: Dato[]; etiqueta: string; activo?: string; alElegir?: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = datos.reduce((n, d) => n + d.valor, 0);
  const foco = datos.find(d => d.id === (hover ?? activo));
  let inicio = 0;
  return <div className="dona">
    <div className="dona-figura">
      <svg viewBox="0 0 100 100" role="img" aria-label={datos.map(d => `${d.nombre}: ${d.valor}`).join(", ")}>
        <circle cx="50" cy="50" r="41" fill="none" stroke="#f0f0f6" strokeWidth="13" />
        {datos.map(d => {
          const parte = total ? (d.valor / total) * 100 : 0, ini = inicio; inicio += parte;
          const ang = (v: number) => ((v / 100) * 2 - 0.5) * Math.PI;
          const a = ang(ini + (parte < 100 ? 0.45 : 0)), b = ang(ini + Math.max(parte < 100 ? Math.max(0.9, parte - 0.45) : 99.99, 0));
          const punto = (v: number) => `${(50 + 41 * Math.cos(v)).toFixed(3)} ${(50 + 41 * Math.sin(v)).toFixed(3)}`;
          return parte > 0 && <path key={d.id} className="dona-parte" d={`M${punto(a)}A41 41 0 ${parte > 50 ? 1 : 0} 1 ${punto(b)}`} fill="none" stroke={d.color} strokeWidth="13" style={{ opacity: foco && foco.id !== d.id ? 0.25 : 1, cursor: alElegir ? "pointer" : undefined }} onPointerEnter={() => setHover(d.id)} onPointerLeave={() => setHover(null)} onClick={() => alElegir?.(d.id)} />;
        })}
      </svg>
      <div className="dona-centro" aria-hidden="true"><strong>{foco ? foco.valor : total}</strong><span>{foco ? foco.nombre.toLowerCase() : etiqueta}</span></div>
    </div>
    <ul className="leyenda">{datos.map(d => {
      const fila = <><i style={{ background: d.color }} /><span>{d.nombre}</span><strong>{d.valor}</strong><small>{pct(d.valor, total)}%</small></>;
      return <li key={d.id}>{alElegir ? <button type="button" aria-pressed={activo === d.id} onClick={() => alElegir(d.id)} onPointerEnter={() => setHover(d.id)} onPointerLeave={() => setHover(null)}>{fila}</button> : <div>{fila}</div>}</li>;
    })}</ul>
  </div>;
}

export function Columnas({ datos, activo, alElegir, unidad = "tareas" }: { datos: Dato[]; activo?: string; alElegir?: (id: string) => void; unidad?: string }) {
  const max = Math.max(1, ...datos.map(d => d.valor));
  return <div className="columnas">{datos.map(d => {
    const dentro = <><strong>{d.valor}</strong><span className="columna-espacio"><i style={{ height: `${(d.valor / max) * 100}%`, background: d.color }} /></span><span>{d.corto ?? d.nombre}</span></>;
    return alElegir ? <button type="button" key={d.id} className="columna" data-tip={d.nombre} aria-pressed={activo === d.id} aria-label={`${d.nombre}: ${d.valor} ${unidad}`} onClick={() => alElegir(d.id)}>{dentro}</button> : <div key={d.id} className="columna" data-tip={`${d.nombre}: ${d.valor} ${unidad}`}>{dentro}</div>;
  })}</div>;
}

export function Apiladas({ filas, series, vacio = "Sin datos todavía" }: { filas: { id: number; nombre: string; href?: string; nota?: string; alerta?: boolean; valores: number[] }[]; series: readonly { nombre: string; color: string }[]; vacio?: string }) {
  const max = Math.max(1, ...filas.map(f => f.valores.reduce((a, b) => a + b, 0)));
  if (!filas.length) return <p className="sin-datos">{vacio}</p>;
  return <div className="apiladas">
    <ul>{filas.map(f => {
      const total = f.valores.reduce((a, b) => a + b, 0);
      return <li key={f.id}><div className="apilada-cab">{f.href ? <Link href={f.href}>{f.nombre}</Link> : <span>{f.nombre}</span>}<small className={f.alerta ? "texto-alerta" : ""}>{f.nota ?? total}</small></div>
        <div className="apilada-pista" role="img" aria-label={`${f.nombre}: ${series.map((s, i) => `${f.valores[i]} ${s.nombre.toLowerCase()}`).join(", ")}`}>{f.valores.map((v, i) => v > 0 && <i key={i} tabIndex={0} data-tip={`${series[i].nombre}: ${v}`} style={{ width: `${(v / max) * 100}%`, background: series[i].color }} />)}</div></li>;
    })}</ul>
    <div className="leyenda-linea">{series.map(s => <span key={s.nombre}><i style={{ background: s.color }} />{s.nombre}</span>)}</div>
  </div>;
}

export function BarrasH({ datos, unidad = "", vacio = "Sin datos todavía" }: { datos: Dato[]; unidad?: string; vacio?: string }) {
  const max = Math.max(1, ...datos.map(d => d.valor));
  if (!datos.length) return <p className="sin-datos">{vacio}</p>;
  return <ul className="barras-h">{datos.map(d => <li key={d.id} data-tip={`${d.nombre}: ${d.valor} ${unidad}`}><span>{d.corto ?? d.nombre}</span><div><i style={{ width: `${(d.valor / max) * 100}%`, background: d.color }} /></div><strong>{d.valor}</strong></li>)}</ul>;
}

const diaCorto = (s: string) => { const [, m, d] = s.split("-"); return `${d}/${m}`; };
export function Area({ puntos, unidad = "reportes", maximo, alElegir, elegido }: { puntos: { dia: string; n: number; detalle?: string }[]; unidad?: string; maximo?: number; alElegir?: (i: number) => void; elegido?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!puntos.length) return <p className="sin-datos">Sin datos todavía</p>;
  const W = 600, H = 190, izq = 34, der = 14, arriba = 14, abajo = 162;
  const mayor = Math.max(...puntos.map(p => p.n));
  const techo = maximo ?? (mayor <= 2 ? 2 : Math.ceil(mayor / 2) * 2);
  const x = (i: number) => (puntos.length === 1 ? (izq + W - der) / 2 : izq + (i / (puntos.length - 1)) * (W - der - izq));
  const y = (v: number) => abajo - (v / techo) * (abajo - arriba);
  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.n)}`).join("");
  const i = hover ?? elegido ?? null;
  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.min(puntos.length - 1, Math.max(0, Math.round(((px - izq) / (W - der - izq)) * (puntos.length - 1)))));
  };
  return <div className="area">
    <svg viewBox={`0 0 ${W} ${H}`} role={alElegir ? "group" : "img"} aria-label={puntos.filter(p => p.n > 0).map(p => `${diaCorto(p.dia)}: ${p.n}`).join(", ") || `Sin ${unidad}`} onPointerMove={mover} onPointerLeave={() => setHover(null)}>
      {[0, techo / 2, techo].map(v => <g key={v}><line x1={izq} x2={W - der} y1={y(v)} y2={y(v)} stroke="#ececf3" /><text x={izq - 8} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
      {[...new Set([0, Math.floor((puntos.length - 1) / 2), puntos.length - 1])].map(k => <text key={k} x={x(k)} y={H - 8} textAnchor={puntos.length === 1 ? "middle" : k === 0 ? "start" : k === puntos.length - 1 ? "end" : "middle"}>{diaCorto(puntos[k].dia)}</text>)}
      {puntos.length > 1 && <><path d={`${linea}L${x(puntos.length - 1)},${abajo}L${x(0)},${abajo}Z`} fill="#6250d6" opacity=".1" /><path d={linea} fill="none" stroke="#6250d6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></>}
      {i !== null && puntos[i] && <line x1={x(i)} x2={x(i)} y1={arriba} y2={abajo} stroke="#c9c6e4" />}
      {puntos.map((p, k) => (alElegir || k === i || (p.n > 0 && puntos.length <= 31)) && <circle key={k} cx={x(k)} cy={y(p.n)} r={k === i ? 6 : 4} fill="#6250d6" stroke="white" strokeWidth="2" {...(alElegir ? { tabIndex: 0, role: "button", "aria-label": `${diaCorto(p.dia)}: ${p.n} ${unidad}`, "aria-pressed": k === elegido, style: { cursor: "pointer" }, onClick: () => alElegir(k), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alElegir(k); } } } : {})} />)}
    </svg>
    {hover !== null && puntos[hover] && <div className="area-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(puntos[hover].n) / H) * 100}%` }}><strong>{puntos[hover].n} {unidad}</strong><span>{puntos[hover].detalle ?? diaCorto(puntos[hover].dia)}</span></div>}
  </div>;
}

/** Línea de tiempo de proyectos: duración, avance entregado y posición de hoy. */
export function Cronograma({ filas, hoy }: { filas: { id: number; nombre: string; inicio: string; fin: string; avance: number; vencido: boolean }[]; hoy: string }) {
  if (!filas.length) return <p className="sin-datos">Los proyectos aparecerán aquí al registrarse.</p>;
  const t = (s: string) => Date.parse(s + "T00:00:00Z");
  const min = Math.min(t(hoy), ...filas.map(f => t(f.inicio))), max = Math.max(t(hoy), ...filas.map(f => t(f.fin)));
  const rango = Math.max(1, max - min), pos = (s: string) => ((t(s) - min) / rango) * 100;
  return <div className="cronograma">
    <ul>{filas.map(f => <li key={f.id}><Link href={`/proyectos/${f.id}`}>{f.nombre}</Link><div className="crono-pista"><i className="crono-hoy" style={{ left: `${pos(hoy)}%` }} /><span className={`crono-barra ${f.vencido ? "vencido" : ""}`} tabIndex={0} data-tip={`${diaCorto(f.inicio)} a ${diaCorto(f.fin)} · ${f.avance}% entregado${f.vencido ? " · Fuera de plazo" : ""}`} style={{ left: `${pos(f.inicio)}%`, width: `${Math.max(1.5, pos(f.fin) - pos(f.inicio))}%` }}><i style={{ width: `${f.avance}%` }} /></span></div><strong>{f.avance}%</strong></li>)}</ul>
    <div className="crono-eje"><span /><div><span style={{ left: `${pos(hoy)}%` }} className={pos(hoy) > 90 ? "fin" : pos(hoy) < 10 ? "ini" : ""}>Hoy {diaCorto(hoy)}</span></div><span /></div>
    <div className="leyenda-linea"><span><i style={{ background: "#0f9f85" }} />Entregado</span><span><i style={{ background: "#d9d5f5" }} />Por entregar</span><span><i style={{ background: "#f3cfcf" }} />Fuera de plazo</span></div>
  </div>;
}