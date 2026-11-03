import "./globals.css";
import type { Metadata } from "next";
import { sesionActual } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { RecordatoriosProvider } from "@/components/RecordatoriosContext";

export const metadata: Metadata = { title: "NOAH TECH – Seguimiento de proyectos y tareas" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await sesionActual();
  return (
    <html lang="es">
      <body>
        {s ? (
          <RecordatoriosProvider>
            <Navbar s={s} />
            <main id="contenido" className="app-main">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </RecordatoriosProvider>
        ) : children}
      </body>
    </html>
  );
}
