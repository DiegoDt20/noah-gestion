/** Acepta únicamente direcciones HTTPS de repositorios de github.com. */
export function repositorioGithub(valor: unknown): string | null {
  if (valor == null || valor === "") return null;
  if (typeof valor !== "string") throw new Error("Indica una URL válida de un repositorio de GitHub");
  const texto = valor.trim();
  if (!texto) return null;
  if (texto.length > 500) throw new Error("La URL de GitHub admite hasta 500 caracteres");
  let url: URL;
  try { url = new URL(texto); } catch { throw new Error("Indica una URL válida de un repositorio de GitHub"); }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash || !/^\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9_.-]+\/?$/.test(url.pathname)) throw new Error("Usa una URL de repositorio como https://github.com/organizacion/repositorio");
  return url.href;
}
