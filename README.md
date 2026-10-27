# Sistema web de seguimiento de proyectos y tareas con asistente de IA
**NOAH TECH SOLUTIONS S.A.C. – 2026**
Proyecto de Prácticas Preprofesionales II – Ingeniería de Sistemas, Universidad César Vallejo.

---

## 1. ¿Qué busca este proyecto?

NOAH TECH gestiona sus proyectos y tareas de forma dispersa: el estado de cada entrega se pregunta por mensajes, los reportes de avance llegan tarde y no hay un historial confiable de quién hizo qué ni cuándo. Esto provoca retrasos, tareas olvidadas y poco tiempo de reacción ante problemas.

Este sistema centraliza todo en una sola aplicación web para que la empresa pueda:

- **Registrar proyectos** con sus fechas y su jefe responsable.
- **Asignar tareas y roles** a cada colaborador, con fecha de entrega.
- **Seguir el estado de cada tarea** (pendiente, en curso, entregada) con historial de cambios.
- **Controlar quién puede ver y hacer qué** según su rol.
- **(Sprints siguientes)** recibir alertas de vencimiento, reportes de avance y apoyo de un asistente de inteligencia artificial.

### Indicadores que se quieren mejorar

| Indicador | Situación inicial | Meta |
|---|---|---|
| PTA – Proyectos/tareas entregados a tiempo | 75 % | ≥ 95 % |
| RAT – Reportes de avance entregados | 7 | ≥ 10 |
| TDR – Tiempo de respuesta ante retrasos | 5 a 6 días | ≤ 1 día |
| PRC | 75 % | ≥ 90 % |
| PAA | 60 % | ≥ 90 % |

> Los valores iniciales de PRC, PAA y TDR deben coincidir con los del informe final.

---

## 2. Metodología

Se trabaja con **Scrum**. El jefe de prácticas actúa como Product Owner y Scrum Master. El trabajo se divide en sprints; cada sprint entrega requerimientos funcionales (RF) que ya se pueden probar.

### Plan de sprints

| Sprint | Requerimientos | Estado |
|---|---|---|
| **Sprint 1** | RF-01 Inicio de sesión · RF-02 Control de acceso por roles · RF-03 Gestión de usuarios y roles | ✅ Terminado |
| **Sprint 2** | RF-04 Registro de proyectos · RF-05 Asignación de roles y tareas · RF-06 Estado de las tareas | ✅ Terminado |
| **Sprint 3** | Reportes de avance por tarea y panel de seguimiento para jefe y gerencia | ⏳ Planificado |
| **Sprint 4** | Alertas de vencimiento y de tareas con retraso | ⏳ Planificado |
| **Sprint 5** | Carga de documentos y base de conocimiento para el asistente | ⏳ Planificado |
| **Sprint 6** | Asistente de IA: consultas y observaciones sobre el avance del proyecto | ⏳ Planificado |
| **Cierre** | Pruebas, ajustes, validación con la empresa y puesta en producción | ⏳ Planificado |

> Los sprints 3 en adelante se ajustan al cronograma y a la lista de requerimientos del informe final. Avance actual: **6 de 16 requerimientos (40 %)**.

---

## 3. Qué hace cada requerimiento ya implementado

| RF | Qué permite | Dónde está |
|---|---|---|
| **RF-01** Inicio de sesión | Entrar con correo y contraseña. La contraseña se guarda encriptada (bcrypt) y la sesión dura 8 horas en una cookie segura (JWT). | `/login` · `POST /api/auth/login` |
| **RF-02** Control de acceso por roles | Cada rol ve y hace solo lo que le corresponde. Se valida en el menú, en el middleware y en cada API. | `middleware.ts` · `lib/acceso.ts` |
| **RF-03** Usuarios y roles | El administrador registra usuarios, cambia su rol y área, los activa o desactiva y restablece contraseñas. | `/usuarios` · `/api/usuarios` |
| **RF-04** Registro de proyectos | El jefe de área registra proyectos con nombre, descripción y fechas. Valida que la entrega no sea anterior al inicio. | `/proyectos` · `POST /api/proyectos` |
| **RF-05** Asignación de roles y tareas | El jefe suma colaboradores al proyecto con su rol y les asigna tareas con fecha dentro del rango del proyecto. | `/proyectos/[id]` |
| **RF-06** Estado de las tareas | El responsable cambia el estado de su tarea y queda registrado quién lo cambió, cuándo y de qué estado a cuál. | `/mis-tareas` · `PATCH /api/tareas/[id]/estado` |

### Permisos por rol

| Acción | Administrador | Gerencia | Jefe de área | Colaborador |
|---|:-:|:-:|:-:|:-:|
| Gestionar usuarios y roles | ✅ | – | – | – |
| Ver todos los proyectos | ✅ | ✅ | solo los suyos | solo donde participa |
| Registrar proyectos | ✅ | – | ✅ | – |
| Asignar miembros y tareas | ✅ | – | ✅ (sus proyectos) | – |
| Cambiar estado de una tarea | ✅ | – | ✅ (sus proyectos) | ✅ (sus tareas) |

---

## 4. Tecnología

- **Next.js 15** (App Router), **React 19** y **TypeScript**
- **Tailwind CSS 4** para el diseño
- **PostgreSQL** (Supabase en la nube o instalación local) con el paquete `pg`
- **JWT** (`jose`) en cookie httpOnly y **bcryptjs** para contraseñas
- Despliegue previsto en **Vercel**

### Estructura

```
app/            Pantallas y rutas de la API (app/api)
components/     Menú lateral, formularios, estados y barras de avance
lib/            Conexión a BD, sesión, reglas de acceso
db/schema.sql   Esquema completo de la base de datos
scripts/        setup-db.mjs: crea tablas y carga datos de ejemplo
middleware.ts   Protección de rutas según sesión y rol
```

---

## 5. Cómo ejecutarlo

Requisitos: Node 20 o superior y PostgreSQL.

```bash
npm install
copy .env.example .env.local     # en Mac/Linux: cp .env.example .env.local
```

Edita `.env.local`:

```
# Base local
DATABASE_URL=postgresql://postgres:TU_CLAVE@localhost:5432/noah
DATABASE_SSL=false
JWT_SECRET=un-texto-largo-y-secreto
```

Para Supabase usa la cadena *Session pooler* y `DATABASE_SSL=true`.

```bash
npm run db:setup   # crea las tablas y carga datos de ejemplo (borra los datos existentes)
npm run dev        # abre http://localhost:3000
```

### Usuarios de ejemplo

Contraseña de todos: `Demo2026!` (cámbiala antes de usar el sistema en serio).

| Correo | Rol |
|---|---|
| admin@noahtech.pe | Administrador |
| gerencia@noahtech.pe | Gerencia |
| jefe@noahtech.pe | Jefe de área |
| carlos@noahtech.pe | Colaborador |
| maria@noahtech.pe | Colaborador |

---

## 6. Guion de demostración (5 minutos)

1. **admin**: Usuarios y roles → registrar un usuario y cambiar su rol (RF-01, RF-03).
2. **jefe**: Proyectos → registrar un proyecto, abrirlo, asignar un colaborador y una tarea (RF-04, RF-05).
3. **carlos**: Mis tareas → cambiar el estado de una tarea (RF-06). Intentar abrir `/usuarios`: el sistema lo rechaza (RF-02).
4. **gerencia**: solo consulta, sin botones de edición (RF-02).

---

## 7. Seguridad

- Las contraseñas nunca se guardan en texto plano.
- La sesión viaja en una cookie `httpOnly`, no accesible desde JavaScript.
- Cada API revisa sesión y rol en el servidor; ocultar un botón no es la única protección.
- Los archivos `.env` no se suben al repositorio.

## 8. Autor

Diego – Prácticas Preprofesionales II, NOAH TECH SOLUTIONS S.A.C., 2026.
