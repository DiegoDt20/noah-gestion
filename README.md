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

Se trabaja con **Scrum**. Los roles de Product Owner y Scrum Master se indican en el informe. El trabajo se divide en sprints; cada sprint entrega requerimientos funcionales (RF) que ya se pueden probar.

### Plan de sprints

Se trabaja en **4 sprints de 3 semanas** (ciclo PPP2, semanas 17 a 32 del plan de trabajo).

| Sprint | Requerimientos | Semanas | Estado |
|---|---|---|---|
| **Sprint 1** · Acceso, roles y usuarios | RF-01 Inicio de sesión · RF-02 Control de acceso por roles · RF-03 Gestión de usuarios y roles | 17 a 19 | ✅ Terminado |
| **Sprint 2** · Proyectos y tareas | RF-04 Registro de proyectos · RF-05 Asignación de roles y tareas · RF-06 Estado de las tareas | 20 a 22 | ✅ Terminado |
| **Sprint 3** · Reportes, panel y alertas | RF-07 a RF-11: registro de avance, recordatorios, consulta de reportes, panel de seguimiento y alertas | 23 a 25 | En curso: RF-07, RF-08 y RF-09 implementados |
| **Sprint 4** · Documentos, IA y KPI | RF-12 a RF-16: procesamiento de documentos, contraste con IA, asistente, cálculo de KPI y exportación | 26 a 28 | ⏳ Planificado |
| **Cierre** | Pruebas de aceptación, despliegue en producción y documentación final | 29 a 32 | ⏳ Planificado |

Al final de cada sprint se hace la revisión con el jefe de prácticas y la retrospectiva. Avance actual: **9 de 16 requerimientos (56,25 %)**.

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
| **RF-07** Reportes de avance | El colaborador registra inicio y cierre diarios y un reporte adicional cada 3 días, con detalle y porcentaje de avance. | `/tareas/[id]/reportes` · `/api/tareas/[id]/reportes` |
| **RF-08** Recordatorios de reportes | Consulta recordatorios de inicio, cierre y reporte adicional pendientes, con lectura individual y actualización automática. | `/recordatorios` · `/api/recordatorios` |
| **RF-09** Consulta de reportes | Consulta centralizada con proyecto, autor, tipo, fechas, búsqueda y paginación de solo lectura. | `/reportes` · `GET /api/reportes` |

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

### Verificaciones de desarrollo

```bash
npm run typecheck  # valida TypeScript sin generar archivos
npm run build      # compila la aplicación para producción
npm run test:rf07  # prueba de integración; requiere servidor y base demo activos
```

Si el servidor utiliza otro puerto, indica la URL al ejecutar las pruebas:

```bash
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:rf07
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


## RF-07 · Reportes de avance

El colaborador entra en **Mis tareas → Registrar reporte** y registra, por tarea, un reporte de inicio y otro de cierre cada día, además de uno adicional cada tres días. Cada reporte guarda detalle, porcentaje acumulado entero de 0 a 100, autor, fecha y hora de Lima. El cierre requiere el inicio del mismo día. No se permiten duplicados del mismo tipo por tarea, usuario y fecha, incluso con envíos simultáneos.

El primer reporte adicional se habilita tres días después de la creación de la tarea; los siguientes, tres días después del último reporte adicional del responsable actual. Un reporte pendiente puede registrarse después de su fecha. La interfaz muestra la siguiente fecha y los reportes diarios pendientes. No se envían notificaciones automáticas en este RF. Cada reporte actualiza el estado de la tarea: 0 % pendiente, 1–99 % en curso y 100 % entregada. Si cambia el estado, se guarda el autor y la transición en el historial dentro de la misma transacción. El último reporte puede reabrir una tarea si declara un avance menor a 100 %.

El colaborador solo registra y consulta reportes de sus tareas. El jefe consulta los de sus proyectos; gerencia y administración pueden consultarlos desde **Proyectos → Ver reportes de avance**. Los reportes se conservan como historial y no se editan desde la interfaz.

Para actualizar una base existente **sin borrar datos**:

```bash
npm run db:migrate:rf07
```

En una base nueva, `npm run db:setup` ya incluye las columnas e índices del RF-07 (este comando reinicializa los datos).

Validación de integración con el servidor local activo y los usuarios demo disponibles:

```bash
npm run test:rf07
```

La prueba crea proyectos y tareas temporales y elimina exclusivamente esos registros al terminar; comprueba permisos, porcentajes, duplicados concurrentes, cambio de día, frecuencia de tres días, persistencia y la página de historial.

## Panel de inicio

El inicio muestra indicadores, distribución de estados de tareas, avance por proyecto y porcentajes del último reporte. En la cuenta de colaborador, las cifras y el gráfico circular corresponden a sus propias tareas; las barras de proyectos incluyen las tareas de todo el equipo. El avance de cada proyecto se calcula como tareas entregadas / total de tareas. Los datos se consultan al abrir o recargar la página. El panel destaca la primera entrega pendiente por fecha y permite buscar tareas por nombre o proyecto y filtrarlas por estado o vencimiento. En celular, las tareas se presentan en una lista adaptable; en escritorio, en una tabla. La búsqueda se aplica sobre las tareas autorizadas para el rol actual y muestra hasta ocho resultados por vez, con la opción de ver más.

Si una base existente ya tiene reportes previos a la actualización automática de estados, puede sincronizarse una vez con:

```bash
node --env-file=.env.local scripts/sync-report-status.mjs
```

Este comando conserva los reportes y registra en el historial los cambios de estado que aplica según el último reporte del responsable actual.

### Gráficos y vistas interactivas

El panel incluye un gráfico circular de estados que filtra la lista de tareas y una comparativa por proyecto con las medidas Avance (tareas entregadas / total) y Carga (cantidad de tareas por estado). Seleccionar un proyecto muestra su fecha de entrega y un enlace a su detalle. La vista de tareas alterna entre Lista y Tablero; el tablero agrupa por estado y permite consultar los reportes, sin arrastrar ni cambiar estados desde esta vista. La agenda muestra las cuatro primeras entregas pendientes por fecha. Los gráficos utilizan los datos actuales autorizados para cada rol, sin series históricas simuladas.

El selector de proyecto limita las gráficas y tareas visibles. El gráfico de plazos agrupa exclusivamente tareas sin entregar (vencidas, hoy, 1–7 días, 8–14 días y 15 días o más); seleccionar una columna filtra el gráfico de estados y la lista. La comparativa de avance conserva el total acumulado del proyecto, como indica su leyenda. Los indicadores superiores y la agenda mantienen la vista general. Actualizar consulta de nuevo los datos y muestra la hora de la consulta en Lima. Exportar CSV descarga todas las tareas que coinciden con proyecto, plazo, estado y búsqueda, independientemente de la paginación; no representa la exportación integral de KPI del RF-16.

### Interfaz de los módulos

- Proyectos: tarjetas o tabla, búsqueda por proyecto/área/responsable, filtros por tareas completadas o plazo y orden por fecha, nombre o avance.
- Detalle de proyecto y Mis tareas: tarjetas o tabla, búsqueda y filtros por estado. Los cambios de estado y enlaces a reportes respetan los permisos existentes.
- Usuarios y roles: directorio con búsqueda, filtros por actividad y rol, formularios por usuario, indicación de cambios pendientes y restablecimiento de contraseña desplegable.
- Reportes: historial con filtros por tipo, búsqueda y orden; gráfico de los últimos doce reportes, con selección de cada registro; porcentaje editable mediante número o deslizador. El gráfico aparece cuando hay reportes.
- Acceso: presentación coherente con la aplicación, botón para mostrar/ocultar contraseña y mensajes de conexión.

Los filtros y las vistas no crean nuevos requerimientos funcionales completados: mantienen las reglas y los permisos de los módulos existentes.

## RF-08 · Recordatorios de reportes pendientes

El menú incluye **Recordatorios** y un contador de pendientes **sin ver**. La pantalla muestra los reportes pendientes, permite buscar por tarea/proyecto/responsable, filtrar por tipo y marcar un recordatorio o todos como vistos. **Visto no significa completado:** el recordatorio permanece hasta registrar el reporte o entregar la tarea. La lectura es individual para cada persona y se conserva al recargar.

Reglas:

- Inicio del día: falta el reporte de inicio de hoy.
- Cierre del día: ya existe el inicio de hoy y falta el cierre; no se pide cerrar antes del inicio.
- Adicional: han pasado tres días desde el último adicional del responsable actual o desde la creación de la tarea. Si está atrasado, conserva su fecha y aparece una sola vez.
- Solo se consideran tareas no entregadas, ya creadas, asignadas a colaboradores activos. Cambiar el responsable recalcula los pendientes y no hereda las lecturas anteriores.
- Colaborador: sus tareas. Jefe: sus proyectos. Gerencia y administración: tareas de la organización. Los dos últimos roles consultan reportes; no pueden registrarlos por un colaborador.
- La fecha se calcula en PostgreSQL con `America/Lima`. Los reportes diarios corresponden a hoy, sin generar una notificación por cada día anterior.
- Se actualizan al abrir/cambiar de pantalla, volver a la aplicación y cada 60 segundos mientras esté visible. Guardar un reporte o cambiar el estado actualiza el contador de inmediato. No hay envío de correo, push ni avisos con la aplicación cerrada; esos canales y sus horarios no están definidos en este repositorio.

Los pendientes se derivan de las tareas y reportes actuales. Solo se guarda la lectura en `recordatorio_lectura`, con una clave única por lector, tarea, responsable, tipo y fecha; la concurrencia no genera duplicados. No se usa la tabla `alerta`, reservada para las alertas de seguimiento de los siguientes RF.

Para una base existente, sin borrar datos:

```bash
npm run db:migrate:rf08
```

Una base nueva creada con `db:setup` ya incluye RF-08. **No uses `db:setup` para actualizar una base existente.**

Pruebas con servidor activo y usuarios demo disponibles:

```bash
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:rf08
```

La prueba crea y elimina exclusivamente usuarios, proyectos y tareas temporales. Comprueba permisos de los cuatro roles, fecha de Lima, secuencia de reportes, recordatorios vencidos, resolución, reasignación, lecturas por persona/día, concurrencia, validaciones de la API y acceso a la pantalla.

## RF-09 · Consulta centralizada de reportes

El menú **Reportes** reúne el historial autorizado, sin entrar primero a cada tarea. Permite filtrar por proyecto, autor original, tipo (inicio/cierre/adicional), fechas de reporte inclusivas y texto del detalle, tarea, proyecto o autor; ordenar por más recientes o antiguos; leer detalles largos y abrir el reporte en el historial de su tarea. Los filtros quedan en la URL para mantenerlos al paginar o compartir el enlace con otro usuario, quien solo verá su propio alcance autorizado.

- Administración y gerencia: reportes de todos los proyectos.
- Jefe de área: reportes de los proyectos que dirige.
- Colaborador: historial completo de sus tareas actualmente asignadas, igual que RF-07, incluidos reportes del responsable anterior. No ve reportes de tareas ajenas.
- Los autores se muestran como autores históricos; no se confunden con el responsable actual de una tarea.
- Las opciones de proyecto y autor se limitan al alcance autorizado. La búsqueda, el conteo y la paginación se resuelven en el servidor, con consultas parametrizadas.
- Cada página muestra hasta 20 reportes. Los indicadores cuentan reportes, tareas distintas y autores de la consulta completa, no solo de la página. Los porcentajes son los declarados en cada reporte; no se promedian avances de tareas diferentes.
- Las fechas corresponden a `fecha_reporte` del RF-07 (día de Lima); el rango incluye ambos extremos. Las fechas inexistentes, rangos invertidos, parámetros duplicados y páginas inválidas se rechazan con recuperación desde la interfaz.
- Solo lectura: no incorpora edición, eliminación ni exportación integral de KPI. No requiere migración ni reinicializar la base.

API: `GET /api/reportes` con parámetros opcionales `proyecto`, `autor`, `tipo`, `desde`, `hasta`, `q`, `orden` (`recientes`/`antiguos`) y `pagina`. Requiere sesión y responde sin caché compartida. La API y la pantalla aplican el mismo control de acceso.

Pruebas con servidor local y usuarios demo disponibles:

```bash
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:rf09
```

Crea reportes y proyectos temporales y los elimina al finalizar. Comprueba los cuatro roles, historial de responsables anteriores, filtros combinados, búsqueda literal, fechas, conteos, orden estable, paginación y recuperación de errores.
