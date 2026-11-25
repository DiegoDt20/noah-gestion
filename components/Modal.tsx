"use client";
import { useId, useRef } from "react";
import Icono, { type NombreIcono } from "./Icono";
/** Botón que abre su contenido en una ventana; el diálogo nativo gestiona foco y Escape. */
export default function Modal({ boton, titulo, icono = "mas", suave = false, children }: { boton: string; titulo: string; icono?: NombreIcono; suave?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  return <>
    <button type="button" className={`${suave ? "btn-suave" : "btn"} gap-2`} aria-haspopup="dialog" onClick={() => ref.current?.showModal()}><Icono nombre={icono} />{boton}</button>
    <dialog ref={ref} className="modal" aria-labelledby={id} onClick={e => { if (e.target === ref.current) ref.current.close(); }}>
      <div className="modal-caja"><header><h2 id={id}>{titulo}</h2><button type="button" className="row-action" aria-label="Cerrar" onClick={() => ref.current?.close()}><Icono nombre="cerrar" /></button></header><div className="modal-cuerpo">{children}</div></div>
    </dialog>
  </>;
}