import "./globals.css";
import type { Metadata } from "next";
import { sesionActual } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = { title: "NOAH TECH – Seguimiento de proyectos y tareas" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await sesionActual();
  return (
    <html lang="es">
      <body>
        {s ? (
          <>
            <Navbar s={s} />
            <main className="px-5 py-7 lg:pl-[17rem] lg:pr-10 lg:py-9">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </>
        ) : children}
      </body>
    </html>
  );
}
