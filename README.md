# Sistema web de seguimiento de proyectos y tareas con asistente de IA
**NOAH TECH SOLUTIONS S.A.C. – 2026**
Proyecto de Prácticas Preprofesionales II – Ingeniería de Sistemas, Universidad César Vallejo.

---

> **Para retomar el proyecto:** consulta [el estado y la guía para otra PC](#continuar-el-desarrollo-desde-otra-pc), actualizados el 25 de noviembre de 2026.

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
| **Sprint 3** · Reportes, panel y alertas | RF-07 a RF-11: registro de avance, recordatorios, consulta de reportes, panel de seguimiento y alertas | 23 a 25 | ✅ Terminado: RF-07 a RF-11 implementados |
| **Sprint 4** · Documentos, IA y KPI | RF-12 a RF-16: procesamiento de documentos, contraste con IA, asistente, cálculo de KPI y exportación | 26 a 28 | 🚧 RF-12, RF-15 y RF-16 implementados; RF-13 y RF-14 pendientes |
| **Cierre** | Pruebas de aceptación, despliegue en producción y documentación final | 29 a 32 | ⏳ Planificado |

Al final de cada sprint se hace la revisión con el jefe de prácticas y la retrospectiva. Avance actual: **14 de 16 requerimientos (87,5 %)**.

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
| **RF-10** Panel de seguimiento | Indicadores, gráficos, agenda y carga por responsable con alcance por proyecto y rol. | `/` · `GET /api/seguimiento` |
| **RF-11** Alertas de seguimiento | Detecta retrasos y falta de reportes o actividad; registra atención y resolución conservando el historial. | `/alertas` · `/api/alertas` |
| **RF-12** Documentos | Carga de PDF, Word DOCX, texto UTF-8 y Markdown, extracción, fragmentación, consulta y descarga por proyecto. | `/documentos` · `/api/documentos` |

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

Requisitos: Node 24 o superior y PostgreSQL.

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

Para PostgreSQL remoto usa `DATABASE_SSL=true` y un certificado confiable. Si tu proveedor utiliza una CA privada, configura `DATABASE_CA_CERT` con el certificado PEM. El nombre del servidor debe coincidir con su certificado. No agregues parámetros SSL ni `host` en `DATABASE_URL`: podrían sobrescribir la configuración del cliente. `DATABASE_SSL=false` solo se permite para localhost fuera de producción. Consulta las instrucciones de conexión de tu proveedor para elegir el pooler.

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

El inicio muestra indicadores, distribución de estados de tareas, avance por proyecto y porcentajes del último reporte. En la cuenta de colaborador, las cifras y el gráfico circular corresponden a sus propias tareas; las barras de proyectos incluyen las tareas de todo el equipo. El avance de cada proyecto se calcula como tareas entregadas / total de tareas. Los datos se consultan al abrir y se actualizan al volver a la aplicación, cada minuto mientras esté visible o al pulsar Actualizar. El panel destaca la primera entrega pendiente por fecha y permite buscar tareas por nombre o proyecto y filtrarlas por estado o vencimiento. En celular, las tareas se presentan en una lista adaptable; en escritorio, en una tabla. La búsqueda se aplica sobre las tareas autorizadas para el rol actual y muestra hasta ocho resultados por vez, con la opción de ver más.

Si una base existente ya tiene reportes previos a la actualización automática de estados, puede sincronizarse una vez con:

```bash
node --env-file=.env.local scripts/sync-report-status.mjs
```

Este comando conserva los reportes y registra en el historial los cambios de estado que aplica según el último reporte del responsable actual.

### Gráficos y vistas interactivas

El panel incluye un gráfico circular de estados que filtra la lista de tareas y una comparativa por proyecto con las medidas Avance (tareas entregadas / total) y Carga (cantidad de tareas por estado). Seleccionar un proyecto muestra su fecha de entrega y un enlace a su detalle. La vista de tareas alterna entre Lista y Tablero; el tablero agrupa por estado y permite consultar los reportes, sin arrastrar ni cambiar estados desde esta vista. La agenda muestra las cuatro primeras entregas pendientes por fecha. Los gráficos utilizan los datos actuales autorizados para cada rol, sin series históricas simuladas.

El selector de proyecto limita las gráficas y tareas visibles. El gráfico de plazos agrupa exclusivamente tareas sin entregar (vencidas, hoy, 1–7 días, 8–14 días y 15 días o más); seleccionar una columna filtra el gráfico de estados y la lista. La comparativa de avance conserva el total acumulado del proyecto, como indica su leyenda. Los indicadores superiores y la agenda siguen el proyecto seleccionado desde RF-10; no cambian con el filtro de plazo. Actualizar consulta de nuevo los datos y muestra la hora de la consulta en Lima. Exportar CSV descarga todas las tareas que coinciden con proyecto, plazo, estado y búsqueda, independientemente de la paginación; no representa la exportación integral de KPI del RF-16.

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

Los pendientes se derivan de las tareas y reportes actuales. Solo se guarda la lectura en `recordatorio_lectura`, con una clave única por lector, tarea, responsable, tipo y fecha; la concurrencia no genera duplicados. Los recordatorios no usan la tabla `alerta`; las situaciones de seguimiento se gestionan por separado en RF-11.

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

## RF-10 · Panel de seguimiento

Se formaliza el panel de Inicio como una consulta consistente por rol y proyecto. La pantalla y `GET /api/seguimiento` utilizan la misma consulta: proyectos, conteos del equipo y últimos reportes se obtienen en una sola sentencia de PostgreSQL. No requiere migración.

- Administración y gerencia consultan la organización; el jefe, sus proyectos; el colaborador, sus tareas dentro de los proyectos en los que es miembro. La API verifica también que la cuenta esté activa y conserve su rol.
- Seleccionar un proyecto actualiza los indicadores superiores, la próxima entrega, la agenda, la carga por responsable y los gráficos. Los filtros de plazo/estado afinan los gráficos y la lista de tareas; el resumen superior sigue representando el proyecto completo y lo indica expresamente.
- Los accesos Ver tareas, Ver entregadas y Ver vencidas ajustan el filtro y llevan al listado. Ver vencidas retira un filtro de plazo previo para no ocultar retrasos.
- Los porcentajes de entrega se calculan como tareas entregadas / total de tareas. En colaboradores, los indicadores de tareas son personales; la comparativa de proyectos sigue incluyendo al equipo. Un proyecto sin tareas tiene 0 % y no cuenta como completado.
- Vencida significa fecha anterior al día de Lima y estado distinto de entregada; las que vencen hoy no cuentan como vencidas. El gráfico de plazos separa hoy, 1–7 días, 8–14 días y 15 días o más.
- El avance reportado es el último reporte del responsable actual, con desempate por ID. Sin reporte se conserva como ausencia de información, sin convertirlo en 0 %. Los registros del responsable anterior no sustituyen su avance.
- La carga por responsable muestra sus tareas, entregas, vencidas y tareas sin reporte dentro del mismo alcance de los indicadores. La agenda presenta las primeras cuatro entregas pendientes; el listado pone pendientes antes de entregadas y ordena por fecha dentro de cada grupo.
- Los datos se actualizan al abrir, pulsar Actualizar, volver a la aplicación y cada 60 segundos mientras esté visible. Se conservan los filtros; si desaparece el proyecto seleccionado, se vuelve al alcance general autorizado. No se generan series históricas ni KPI avanzados del RF-16 a partir de datos incompletos.

API: `GET /api/seguimiento` admite `proyecto` opcional y devuelve la fecha de Lima, hora de consulta, proyectos, tareas, resumen y carga por responsable. Los proyectos inexistentes o fuera de alcance responden 404; identificadores inválidos o parámetros duplicados responden 400. Requiere sesión y no utiliza caché compartida.

```bash
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:rf10
```

Las pruebas crean y eliminan proyectos y tareas temporales. Verifican los cuatro roles, conteos exactos, alcance personal frente al de equipo, ausencia de reportes, responsables anteriores, desempate de reportes, fechas de Lima, proyectos vacíos y actualización de indicadores.

## RF-11 · Alertas de seguimiento

**Alertas** en el menú muestra un contador de abiertas, filtros por proyecto/tipo/estado, historial paginado de 20 registros y acceso a los reportes de la tarea. El jefe de área puede atender las de sus proyectos; administración puede atender todas. Colaboradores y gerencia solo consultan. El colaborador accede a las tareas propias en proyectos donde es miembro. Se verifica que la cuenta conserve su rol y esté activa.

Reglas iniciales, al no existir umbrales configurados en este repositorio:

- **Tarea vencida:** fecha de entrega anterior a hoy y tarea no entregada. Se conserva este riesgo aunque el responsable esté inactivo.
- **Sin reporte:** tarea con al menos tres días desde su creación, no entregada, sin ningún reporte del responsable actual. Solo se exige a colaboradores activos. Un cambio de estado no sustituye el reporte.
- **Sin actualizar:** tarea no entregada con reportes del responsable actual, pero con al menos tres días sin actividad. La actividad es la fecha más reciente entre creación, actualización del estado y último reporte. Solo se aplica a colaboradores activos; se excluye cuando el problema es ausencia completa de reportes.
- Se utilizan días calendario de Lima, con el límite de tres días inclusive. No se generan alertas para tareas creadas en una fecha futura ni entregadas. Las fechas de actividad se interpretan según la convención local de los TIMESTAMP existentes; los nuevos cambios de estado se guardan explícitamente en Lima.

La revisión ocurre al consultar o actualizar Alertas y al actualizar el contador del menú: al abrir/cambiar de pantalla, volver a la aplicación y cada 60 segundos mientras esté visible. No es un servicio de correo, push ni un proceso que siga ejecutándose con la aplicación cerrada. Los cambios se detectan durante estas revisiones; la fecha de resolución registrada corresponde al momento de detección.

Ciclo e historial:

- **Abierta:** condición vigente sin acción registrada.
- **Atendida:** jefe/administrador registró una acción obligatoria de hasta 250 caracteres. Quedan guardados autor y hora de Lima. La tarea no se entrega ni se modifica por atender una alerta; su condición puede seguir vigente y no genera una alerta repetida por cada consulta.
- **Resuelta automáticamente:** la condición de una alerta abierta dejó de cumplirse. Se conserva el registro con fecha de detección y motivo. Si ya estaba atendida, conserva ese estado, su acción y su autor, y además marca la condición como resuelta.
- Si la situación se resuelve y reaparece después de una revisión, se crea otro incidente. Cambiar el responsable o la referencia del riesgo separa incidentes y conserva el responsable al generarse.
- La sincronización bloquea tareas en orden fijo y utiliza un índice único por tarea/tipo vigente para evitar duplicados concurrentes. La primera atención prevalece; una segunda atención responde 409 sin sobrescribir la acción.
- Los registros legados no se eliminan: conservan su acción y la ausencia de responsable histórico se muestra como no registrada. Las alertas legadas abiertas se reevalúan al revisar la tarea.

La migración es aditiva y repetible, sin reinicializar datos:

```bash
npm run db:migrate:rf11
```

Las bases nuevas creadas con `db:setup` ya incluyen los campos e índices. No uses `db:setup` para actualizar una base existente.

API: `GET /api/alertas` (`proyecto`, `tipo`, `estado`, `pagina`) y `PATCH /api/alertas/[id]` con `{ "accion_tomada": "Descripción de la gestión realizada" }`. Sesión obligatoria; respuestas sin caché compartida. Los conteos respetan proyecto y tipo, y permiten navegar entre estados.

```bash
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:rf11
```

Las pruebas crean y eliminan exclusivamente tareas, proyectos y usuarios temporales. Comprueban límites de tres días, ausencia/antigüedad de reportes, tareas entregadas/futuras, cuentas inactivas, permisos de los cuatro roles, concurrencia, atención con auditoría, resolución, reaparición, reasignación, registros legados y paginación.


## RF-12 · Biblioteca y procesamiento de documentos

**Documentos** permite seleccionar un proyecto, incorporar archivos `.pdf`, `.docx`, `.txt` y `.md` de hasta 1 MB (TXT/MD en UTF-8), buscar los últimos 100 registros por nombre/autor, leer fragmentos ordenados y descargar el original. El jefe incorpora documentos de sus proyectos; administración, de todos. Gerencia solo consulta, y los colaboradores consultan bibliotecas de proyectos donde son miembros. Cada operación comprueba el rol y la actividad actual de la cuenta en la base.

El original se guarda en PostgreSQL, junto a su hash SHA-256, autor, fecha de Lima y cantidad de caracteres. Un archivo idéntico dentro del mismo proyecto responde 409, incluso con cargas simultáneas. Los fragmentos contienen hasta 2000 puntos de código Unicode, conservan el orden y se guardan en la misma transacción que el original. No se pierde el documento si falla el procesamiento: la operación completa se revierte. La descarga se entrega como adjunto; el texto se presenta sin interpretar HTML o Markdown. Los registros históricos se conservan y solo ofrecen descarga si tienen original almacenado.

La extracción PDF usa el texto seleccionable y recorre hasta 100 páginas en orden. Word admite `.docx` y extrae párrafos y texto de tablas; los `.doc` antiguos deben guardarse como DOCX. No se conserva el diseño visual de tablas o columnas en la lectura de texto. El original conserva su formato y bytes.

Los archivos protegidos, dañados o sin texto se rechazan con un mensaje recuperable y sin crear registros parciales. Los escaneos o imágenes necesitan OCR previo; no hay OCR en esta entrega. El procesamiento usa un hilo separado con un plazo de 15 segundos y límite de heap de 192 MB, hasta dos extracciones simultáneas por proceso (429 si está ocupado). Los DOCX admiten hasta 2000 entradas y 10 MB descomprimidos, verificados antes de extraer; el texto PDF/DOCX tiene un máximo de un millón de caracteres. La cuenta y el proyecto se verifican antes de procesar y al guardar.

Esta entrega prepara contenido para RF-13/RF-14; todavía no genera embeddings ni respuestas de IA. Eliminación/versionado, OCR y almacenamiento externo son ampliaciones posteriores. El extractor utiliza [unpdf](https://github.com/unjs/unpdf) y [Mammoth](https://github.com/mwilliamson/mammoth.js), sin servicios externos ni envío de documentos a proveedores. Requiere Node 24 o superior. El script del worker y las dependencias deben incluirse en el despliegue; `next.config.ts` declara el trazado correspondiente.

Migración aditiva y repetible para bases existentes:

```bash
npm run db:migrate:rf12
TEST_BASE_URL=http://127.0.0.1:3002 npm run test:rf12
```

No uses `db:setup` para actualizar datos existentes. Para una base nueva, el esquema completo ya incluye las columnas.

API: `GET /api/documentos?proyecto=ID`; `POST /api/documentos` multipart con `proyecto` y `archivo`; `GET /api/documentos/ID` para texto fragmentado y `GET /api/documentos/ID?descargar=1` para el original. Sesión obligatoria, consultas parametrizadas y respuestas sin caché compartida. La carga limita el cuerpo antes de analizar multipart, también si no hay Content-Length. La prueba utiliza proyectos temporales y limpia exclusivamente sus registros.


## RF-16 · Exportación de reportes

Gerencia y jefes de área pueden descargar desde Consulta de reportes un CSV con los filtros y el orden aplicados; se incluyen todas las páginas dentro de su alcance de acceso. El archivo protege las celdas de texto que puedan interpretarse como fórmulas y admite hasta 10 000 resultados; para más resultados hay que acotar los filtros. La consulta comprueba permisos de nuevo al exportar. Si detecta cambios en la cantidad o duplicados durante la descarga, solicita reintentar.

### Seguimiento de cambios solicitados

- Campo opcional de repositorio GitHub en el registro y detalle del proyecto: implementado. Solo admite URL HTTPS de repositorios de github.com; guardar el enlace no llama a GitHub. La consulta opcional de issues sí utiliza su API y se describe más abajo.
- RF-15 (PTA, RAT y TDR): implementado en el detalle del proyecto para gerencia y el jefe responsable.
- RF-13 y RF-14: integración Anthropic implementada en preparación y probada con simulación; faltan credenciales aprobadas y validación real de extremo a extremo.

Para actualizar una base existente sin borrar datos, ejecuta `npm run db:migrate:github`. Para verificar con los usuarios demo, ejecuta `node --env-file=.env.local scripts/test-repositorio-github.mjs` con el servidor activo.


## RF-15 · Indicadores del proyecto

Gerencia y el jefe responsable ven los indicadores en el detalle del proyecto. PTA divide las tareas actualmente entregadas a tiempo entre las que ya vencieron o están entregadas; usa la última transición a entregada, expresada en fecha de Lima. Las tareas vencidas son las anteriores al día actual. Si falta historial de alguna tarea actualmente entregada, PTA muestra «Sin datos suficientes». El historial anterior se interpreta según la hora guardada; los cambios nuevos se registran en hora de Lima. RAT divide todos los reportes entre todas las tareas; con tareas y ningún reporte el resultado es cero. TDR promedia los días desde el vencimiento hasta la primera alerta de retraso registrada para esa fecha por tarea. Alertas antiguas sin referencia a la fecha actual no se incluyen; las alertas dependen de cuándo se revisaron. Un denominador vacío o la ausencia de alertas muestra «Sin datos suficientes». Los indicadores usan la fecha de vencimiento actual y no reconstruyen cambios históricos de plazos.

Verificación con usuarios demo: `node --env-file=.env.local scripts/test-rf15.mjs`.

### RF-13 y RF-14 · Integración Anthropic en preparación

En el detalle de proyecto, gerencia y el jefe responsable pueden consultar los documentos de ese proyecto o seleccionar un reporte y un documento para contrastar. Al ejecutar la acción, la aplicación envía los fragmentos seleccionados a Anthropic; la respuesta se guarda en las tablas existentes y se muestra el historial. Las citas se verifican literalmente contra los fragmentos enviados, pero esto no garantiza que la interpretación de la IA sea correcta. La consulta busca por palabras en los documentos del proyecto y envía hasta 12 fragmentos relevantes; no implementa búsqueda semántica ni embeddings. Si no encuentra coincidencias, informa que no encontró información suficiente, sin llamar al proveedor. Las fuentes aparecen en el texto guardado de la respuesta; la coincidencia literal de una cita no garantiza que la interpretación sea correcta. El contraste solo guarda contradicciones con citas verificadas. El acceso se comprueba antes de la petición y nuevamente antes de guardar.

Configura `ANTHROPIC_API_KEY` en `.env.local` y opcionalmente `ANTHROPIC_MODEL`; reinicia el servidor después de editarlo. No compartas ni subas esa clave. Sin clave, los controles muestran un error recuperable y no se envían documentos. Se verificaron permisos y ausencia de clave; la integración real con Anthropic queda pendiente de configurar credenciales y hacer una prueba de extremo a extremo. Hasta entonces RF-13 y RF-14 siguen pendientes de validación.

### Consulta de issues de GitHub (solo lectura)

El detalle de un proyecto con repositorio registrado ofrece «Consultar issues». Muestra issues abiertos y cerrados de la primera página de hasta 100 resultados de GitHub, ordenados por actualización, sin incluir pull requests ni sincronizar tareas; la primera página puede contener menos de 100 issues porque GitHub también devuelve pull requests. Si hay más resultados se indica en pantalla. La consulta se hace solo al pulsar el botón y respeta el alcance de acceso al proyecto de Noah. Los repositorios públicos funcionan sin token, sujetos a los límites de GitHub.

Para un repositorio privado, quien administra el servidor puede configurar en `.env.local` un token de GitHub de permisos mínimos (fine-grained, permiso **Issues: read-only** y acceso solo a los repositorios necesarios) en `GITHUB_READ_TOKEN`, y enumerar los repositorios habilitados en `GITHUB_REPOSITORIES=propietario/repositorio,otro/repo`. Reinicia el servidor después de configurarlo; no subas ni compartas el token. El token es compartido por el servidor: **todas las personas que puedan ver un proyecto de Noah podrán consultar los issues del repositorio privado vinculado**, aunque no tengan acceso individual a GitHub. Configura cada repositorio solo si esa visibilidad es apropiada. No existe autenticación GitHub por usuario.

Para verificar sesión, alcance y conexión con GitHub usando datos temporales, ejecuta `node --env-file=.env.local scripts/test-github-issues.mjs` con el servidor activo. La consulta se limita a la primera página y no incluye el cuerpo de los issues, hitos ni su organización por semanas.

El administrador y el jefe responsable pueden añadir, cambiar o quitar el enlace de GitHub desde el detalle de un proyecto existente. El campo vacío elimina solo el enlace guardado en Noah; no cambia el repositorio en GitHub. Verificación con el servidor y usuarios demo: `node --env-file=.env.local scripts/test-editar-repositorio.mjs`.

La búsqueda léxica y el aislamiento entre proyectos se pueden comprobar con `node --env-file=.env.local scripts/test-busqueda-asistente.mjs`. La prueba real con Anthropic sigue pendiente.

### Pruebas de IA simuladas

`npm run test:ia:simulada` inicia un servidor de prueba aislado con una clave ficticia e intercepta las llamadas a Anthropic; no se envían documentos a servicios externos. Comprueba permisos, aislamiento, citas válidas e inventadas, fallos del proveedor y persistencia; crea y elimina registros temporales. Requiere la base de demostración y el puerto local 32174 disponible. Esta prueba no verifica el comportamiento real del modelo ni sustituye una prueba con credenciales configuradas.


## Preparación para producción

Consulta [la revisión de preparación para producción](docs/preparacion-produccion.md) antes de desplegar. La aplicación tiene bloqueantes de seguridad y validación que deben resolverse primero.

En producción, `JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres; los valores de ejemplo conocidos se rechazan. El arranque sin una clave válida falla de forma segura. La prueba aislada se ejecuta con `npm run test:secreto`.

La configuración TLS se comparte entre la aplicación, migraciones y scripts. La prueba `node scripts/test-postgres-tls.mjs` requiere `openssl` y herramientas de PostgreSQL locales; crea y elimina un clúster temporal y comprueba certificado confiable, CA desconocida y nombre incorrecto.


## Límite de intentos de acceso

El inicio de sesión tiene un límite persistente de cinco intentos por correo en quince minutos. Al alcanzarlo, muestra un mensaje de espera; la API responde 429 y `Retry-After`. Un acceso válido restablece el contador si no hubo nuevas solicitudes simultáneas. Consulta las reglas y permisos del rol de servidor en [la guía de producción](docs/preparacion-produccion.md#protección-del-inicio-de-sesión).

Para actualizar una base existente sin borrar datos, antes de ejecutar esta versión:

```bash
npm run db:migrate:login
npm run test:login
```


## Continuar el desarrollo desde otra PC

**Corte de trabajo: 25 de noviembre de 2026. Rama de desarrollo: `main`.** Lee esta sección antes de cambiar de equipo o continuar con otro agente. El avance funcional registrado es **14 de 16 requerimientos (87,5 %)**: RF-01 a RF-12, RF-15 y RF-16 implementados; RF-13 y RF-14 están preparados, pero su uso real con Anthropic sigue pendiente de validación. La protección del acceso descrita aquí es una mejora de infraestructura, no otro requerimiento funcional completado.

### Qué está hecho

| Área | Estado y comportamiento |
|---|---|
| Acceso, roles y usuarios (RF-01 a RF-03) | Inicio de sesión con bcrypt y JWT, permisos por rol, gestión de usuarios, actividad y contraseñas. |
| Proyectos y tareas (RF-04 a RF-06) | Proyectos, miembros, asignaciones, fechas y estados con historial. |
| Reportes y seguimiento (RF-07 a RF-11) | Inicio/cierre diarios, reportes adicionales, recordatorios, consulta filtrada, gráficos e indicadores del panel, atención e historial de alertas. |
| Documentos (RF-12) | PDF con texto seleccionable, Word DOCX, TXT y Markdown; original en PostgreSQL, extracción, fragmentos, consulta, descarga y controles de acceso. Los escaneos requieren OCR previo. |
| Indicadores y exportación (RF-15/RF-16) | PTA/RAT/TDR según las fórmulas documentadas; exportación CSV filtrada, con control de permisos y protección de fórmulas. |
| GitHub | Enlace editable al repositorio del proyecto y consulta manual de issues de solo lectura; token opcional y lista autorizada para repos privados. |
| IA (RF-13/RF-14, en preparación) | Asistente y contraste de reportes con documentos, búsqueda léxica, verificación literal de citas, persistencia e integración Anthropic; pruebas simuladas sin enviar documentos a servicios externos. |
| Interfaz | Actualización de acceso, navegación, panel, proyectos, tareas, reportes, recordatorios, alertas, documentos y usuarios. |
| Configuración de seguridad | Secreto JWT obligatorio en producción y comprobación de certificado/nombre TLS de PostgreSQL; sin TLS solo en localhost fuera de producción. |

### Qué se hizo en la última sesión

1. Se descargó y actualizó la copia local a `ab64d6d`, que traía la interfaz y el seguimiento actualizados.
2. Se instalaron dependencias con `npm ci`, se inició PostgreSQL local y se aplicó la migración aditiva de repositorio GitHub.
3. Se añadió `login_intento` para limitar el inicio de sesión a **cinco solicitudes por correo normalizado en quince minutos**. Se reserva cupo antes de comprobar credenciales, para que las solicitudes simultáneas no superen el límite. El contador se guarda en PostgreSQL y funciona entre instancias.
4. Un acceso válido restablece su contador solo si no llegaron nuevas solicitudes después. Una respuesta de una ventana anterior no puede borrar el contador actual. Agotar el límite bloquea temporalmente también una contraseña correcta hasta vencer el plazo.
5. La API responde **429**, con `Retry-After` y mensaje de espera. Si falla el servicio de acceso, responde **503** sin emitir una cookie de sesión ni mostrar detalles internos. El formulario existente muestra estos mensajes.
6. Se guarda una clave HMAC del correo, sin almacenar el correo o la contraseña en la tabla de límites. Se eliminan hasta 100 contadores vencidos por solicitud. No se implementó un límite por IP ni una protección global de tráfico.
7. Se añadió la migración aditiva y repetible `db/migrations/014_login_intentos.sql`, incluida también en el esquema de bases nuevas. **Esta migración de infraestructura no es el RF-14 de IA.**
8. Se aplicó y repitió la migración únicamente en la base local, conservando los datos. Quedó documentado el permiso que necesitará un rol dedicado del servidor en otros entornos.
9. Se añadieron y pasaron **37 verificaciones** del límite, incluidas solicitudes concurrentes, vencimiento, recuperación, entradas inválidas, acceso válido y cuentas inexistentes. Las pruebas eliminan exclusivamente su usuario y sus claves temporales.
10. Pasaron TypeScript, las pruebas de secreto JWT y las pruebas TLS de PostgreSQL. La compilación de producción pasó en una copia temporal con configuración de verificación separada, sin conectarse a una base real. La configuración local sin TLS es rechazada deliberadamente al compilar como producción.

Archivos principales de este cambio: `app/api/auth/login/route.ts`, `lib/login-limite.mjs`, `lib/login-limite.d.mts`, `db/migrations/014_login_intentos.sql`, `scripts/migrate-login.mjs` y `scripts/test-login-limite.mjs`.

### Qué falta y en qué orden continuar

1. **Aplicar la migración de acceso en cada base existente antes de desplegar esta versión.** Si el servidor usa un rol dedicado, necesita permisos SELECT/INSERT/UPDATE/DELETE y una política RLS exclusiva para ese rol sobre `login_intento`. No dar esos permisos a los roles públicos de Supabase. La base local usa el propietario y ya está actualizada.
2. **Revisar el entorno real de Vercel antes de usar la dirección principal.** Se creó el proyecto `noah-gestion-pruebas` en Vercel y una base separada del mismo nombre en Supabase. El 3 de noviembre se verificaron acceso, panel y procesamiento de PDF en un Preview. La dirección principal mostró fallos porque sus variables de producción no estaban configuradas. El último intento de transferir `DATABASE_URL` y `JWT_SECRET` a producción quedó bloqueado por revisión automática y pendiente de autorización explícita del usuario para ese envío. **En esta sesión no se configuró producción ni se volvió a verificar aquel Preview; no asumir que la dirección principal funciona.**
3. **Completar RF-13/RF-14 con una prueba real aprobada.** El proveedor elegido en el código es Anthropic. Configurar la clave y un modelo disponible, acordar el envío de fragmentos, usar documentos sintéticos, revisar respuestas y citas, costos y permisos. La simulación no valida la calidad del modelo ni completa la aceptación funcional.
4. **Preparar operación y aceptación.** Revisar revocación de sesiones, protección global de tráfico, inicialización del primer administrador, respaldos/restauración (incluidos documentos), supervisión y pruebas con los cuatro roles. Validar las fórmulas de KPI con la organización. Detalles en [preparación para producción](docs/preparacion-produccion.md).
5. **Mejoras posteriores, fuera del alcance actual:** OCR, búsqueda semántica/embeddings, versiones/eliminación de documentos, sincronización de issues con tareas y avisos con la aplicación cerrada. No presentarlas como funciones existentes.

### Instalar una copia nueva

Requisitos: **Git, Node.js 24 con npm y PostgreSQL 14 o superior**. Debe estar iniciado PostgreSQL y disponible el usuario de conexión. Los comandos siguientes son para Linux, macOS o WSL; los comandos npm son los mismos en Windows.

```bash
git clone https://github.com/DiegoDt20/noah-gestion.git
cd noah-gestion
git switch main
npm ci
cp .env.example .env.local
```

En PowerShell, el último comando es `Copy-Item .env.example .env.local`. Edita `.env.local` con los datos de **la base de ese equipo**, por ejemplo:

```dotenv
DATABASE_URL=postgresql://postgres:TU_CLAVE_LOCAL@127.0.0.1:5432/noah_demo
DATABASE_SSL=false
JWT_SECRET=REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_PROPIO_DE_AL_MENOS_32_CARACTERES
```

El ejemplo no es una credencial real. Genera el secreto para tu archivo local con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` y mantenlo privado. No uses ese valor en capturas, commits ni registros compartidos. `DATABASE_SSL=false` es exclusivamente para desarrollo en localhost; en un proveedor remoto usa TLS verificado y su CA cuando corresponda.

**Opción A: empezar con datos de demostración nuevos.** Crea una base vacía, por ejemplo `createdb -h 127.0.0.1 -U postgres noah_demo`, y comprueba que `.env.local` apunta a ella. Solo entonces:

```bash
npm run db:setup
npm run dev -- --port 3002
```

**`db:setup` elimina las tablas del sistema si ya existen. Úsalo únicamente en una base nueva o de demostración descartable.** El esquema nuevo ya incluye la tabla de límites y los cambios anteriores. Abre http://localhost:3002. Las cuentas demo son `admin@noahtech.pe`, `gerencia@noahtech.pe`, `jefe@noahtech.pe`, `carlos@noahtech.pe` y `maria@noahtech.pe`; la contraseña local por defecto es `Demo2026!`, salvo que se haya definido `DEMO_PASSWORD`. Estas credenciales no son las del entorno de pruebas en la nube.

**Opción B: conservar los datos de otro equipo.** Git descarga código, no usuarios, proyectos ni documentos guardados en PostgreSQL. Exporta un respaldo con `pg_dump -Fc` desde el equipo de origen, transfiérelo por un medio privado y restáuralo con `pg_restore --no-owner --no-privileges` en una base vacía del equipo de destino. No ejecutes `db:setup` sobre esa base restaurada. Configura las credenciales propias del destino, comprueba la versión del esquema y aplica únicamente las migraciones que falten, después de revisar el SQL y conservar un respaldo.

Para una base que ya tenía el esquema de `ab64d6d`, la migración nueva necesaria es:

```bash
npm run db:migrate:login
npm run dev -- --port 3002
```

Migraciones anteriores disponibles: `db:migrate:rf07`, `db:migrate:rf08`, `db:migrate:rf11`, `db:migrate:rf12` y `db:migrate:github`. No asumir que una base desconocida está actualizada; comparar con los SQL en `db/migrations/`.

### Si solo estás actualizando una copia existente

Revisa primero `git status` y conserva tus cambios. Después, con el servidor detenido y una base respaldada:

```bash
git switch main
git pull --ff-only origin main
npm ci
npm run db:migrate:login
npm run dev -- --port 3002
```

El comando de migración usa `.env.local`: confirma su destino antes de ejecutarlo. Si faltan migraciones anteriores, revísalas y aplícalas antes de iniciar la aplicación. Conserva la terminal abierta y detén el servidor con Ctrl+C.

### Comprobaciones al retomar

Con la base de demostración y el servidor local activos:

```bash
npm run typecheck
npm run test:login
npm run test:secreto
npm run test:postgres-tls
```

`test:login` usa por defecto http://127.0.0.1:3002. Para otro puerto, define `TEST_BASE_URL` antes de ejecutarlo. La prueba TLS requiere `openssl` y los binarios de PostgreSQL. Las pruebas de integración utilizan datos temporales: ejecútalas en una base de demostración, no en una base con datos reales. Para otros módulos están los scripts `test:rf07` a `test:rf12`, `test:ia:simulada` y los scripts adicionales de `scripts/`.

Si `npm run build` rechaza `DATABASE_SSL=false`, está aplicando la regla de producción: no desactives esa protección. Prepara una configuración de compilación aislada y, para ejecutar producción, utiliza la conexión TLS y el secreto del entorno correcto.

### Información que no viaja con el repositorio

- `.env.local` y otros archivos de secretos, claves de IA/GitHub, contraseñas locales y certificados privados.
- El clúster de PostgreSQL y su contenido, los respaldos y los documentos almacenados en la base.
- `.local/`, `node_modules/`, `.next/` y `.vercel/`. En otra PC, las dependencias se instalan con `npm ci`; la vinculación de Vercel se hace solo si se va a administrar un despliegue.
- Las cuentas y contraseñas generadas para la nube. Recuperarlas por un canal privado autorizado; no pegarlas en el README. No copiar la base o los secretos de producción a desarrollo por defecto.

En este equipo se usó PostgreSQL local en `127.0.0.1:55432` y la base `noah_gestion_demo`, con un clúster privado en `.local/postgres`. **Ese puerto y esa ruta son propios de este equipo**, no un requisito para una PC nueva. Un error `ECONNREFUSED` al entrar suele indicar que PostgreSQL no está iniciado o que host/puerto de `.env.local` no corresponden al servidor disponible.
