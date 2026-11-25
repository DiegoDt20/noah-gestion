import Icono from "./Icono";
/** Explicación opcional: no ocupa espacio hasta que la persona la pide. */
export default function Ayuda({ children, titulo = "Cómo funciona" }: { children: React.ReactNode; titulo?: string }) {
  return <details className="ayuda"><summary><Icono nombre="ayuda" /><span>{titulo}</span></summary><div>{children}</div></details>;
}