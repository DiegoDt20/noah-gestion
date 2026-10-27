// Crea las tablas (db/schema.sql) y carga datos DEMO. Uso: npm run db:setup
import fs from "node:fs";
import pg from "pg";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Falta DATABASE_URL (crea el archivo .env.local)"); process.exit(1); }
const c = new pg.Client({ connectionString: url, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false } });
await c.connect();

await c.query(fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));

await c.query(`INSERT INTO area (id_area,nombre) VALUES (1,'Gerencia General'),(2,'Gerencia Comercial'),(3,'Tecnologías de Información')`);

const CLAVE = process.env.DEMO_PASSWORD || "Demo2026!";
const h = await bcrypt.hash(CLAVE, 10);
// roles: 1 gerencia, 2 jefe_area, 3 colaborador, 4 administrador
const usuarios = [
  [4, 3, "Administrador", "del Sistema", "admin@noahtech.pe"],
  [1, 1, "Gerente", "General", "gerencia@noahtech.pe"],
  [2, 3, "Jefe", "de Prácticas", "jefe@noahtech.pe"],
  [3, 3, "Carlos", "Quispe", "carlos@noahtech.pe"],
  [3, 3, "María", "Torres", "maria@noahtech.pe"],
];
for (const [rol, area, n, a, co] of usuarios)
  await c.query("INSERT INTO usuario (id_rol,id_area,nombres,apellidos,correo,clave_hash) VALUES ($1,$2,$3,$4,$5,$6)", [rol, area, n, a, co, h]);

// Proyecto de ejemplo (DEMO)
const jefe = (await c.query("SELECT id_usuario FROM usuario WHERE correo='jefe@noahtech.pe'")).rows[0].id_usuario;
const car = (await c.query("SELECT id_usuario FROM usuario WHERE correo='carlos@noahtech.pe'")).rows[0].id_usuario;
const mar = (await c.query("SELECT id_usuario FROM usuario WHERE correo='maria@noahtech.pe'")).rows[0].id_usuario;
const p = (await c.query(
  `INSERT INTO proyecto (id_area,id_jefe,nombre,descripcion,fecha_inicio,fecha_entrega)
   VALUES (3,$1,'Portal web corporativo (demo)','Proyecto de ejemplo para probar el sistema','2026-10-01','2026-12-15') RETURNING id_proyecto`, [jefe])).rows[0].id_proyecto;
await c.query("INSERT INTO proyecto_miembro VALUES ($1,$2,'Jefe de proyecto'),($1,$3,'Desarrollador'),($1,$4,'Diseñadora')", [p, jefe, car, mar]);
await c.query(
  `INSERT INTO tarea (id_proyecto,id_responsable,titulo,descripcion,rol_asignado,fecha_entrega,estado) VALUES
   ($1,$2,'Maquetar página de inicio','Versión responsive','Desarrollador','2026-11-10','en_curso'),
   ($1,$3,'Diseñar identidad visual','Paleta y tipografía','Diseñadora','2026-11-05','entregada'),
   ($1,$2,'Formulario de contacto','Validaciones','Desarrollador','2026-11-25','pendiente')`, [p, car, mar]);

console.log("Base de datos lista.\nUsuarios DEMO (contraseña: " + CLAVE + "):");
for (const u of usuarios) console.log(" -", u[4]);
await c.end();
