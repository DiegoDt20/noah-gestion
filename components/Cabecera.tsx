export default function Cabecera({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children?: React.ReactNode }) {
  return <div className="module-heading"><div><h1>{titulo}</h1>{subtitulo && <p>{subtitulo}</p>}</div>{children}</div>;
}