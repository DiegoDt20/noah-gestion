# Preparación para producción de NOAH TECH

Estado de la revisión: 22 de noviembre de 2026. Esta guía prepara el trabajo; no autoriza ni realiza un despliegue. **La aplicación aún no está lista para publicar**: primero deben resolverse los puntos bloqueantes de seguridad y validarse los flujos con la organización.

## Lo comprobado

- La compilación de producción (`npm run build`) pasó en una copia temporal aislada, sin interrumpir el servidor de desarrollo ni conectarse a una base de producción.
- El proyecto exige Node.js 24 o superior y PostgreSQL. Los archivos originales de la biblioteca de documentos se almacenan en PostgreSQL y deben incluirse en los respaldos.
- Las rutas de carga de documentos usan un worker y dependencias externas declaradas en `next.config.ts`; su funcionamiento debe probarse en el entorno de destino.
- Las pruebas automatizadas de reportes, recordatorios, consultas, panel, alertas, documentos, KPI y GitHub se han ejecutado localmente con datos temporales. No equivalen a una aceptación formal.

## Pendiente antes de publicar

1. **Secretos y sesiones.** Configurar `JWT_SECRET` largo, único y aleatorio en el entorno de destino. El servidor de producción rechaza el arranque si falta la variable, tiene menos de 32 caracteres útiles o coincide con los valores de ejemplo conocidos. Esta validación se probó en un servidor aislado; queda configurar una clave aleatoria y única en cada entorno real. No compartir claves por chat, capturas, commits ni registros.
2. **Conexión a PostgreSQL.** La aplicación y los scripts verifican el certificado y el nombre del servidor con TLS. Si el proveedor usa una CA privada, configurar `DATABASE_CA_CERT` con el certificado PEM. `DATABASE_SSL=false` se admite solo para localhost fuera de producción. Antes de conectar datos reales, probar la conexión y el certificado específico del proveedor en un entorno separado. Nunca usar la autenticación local `trust` fuera de la demostración.
3. **Acceso y protección de cuentas.** No se observa límite de intentos en el inicio de sesión. Añadir y comprobar protección contra intentos repetidos, y revisar la revocación de sesiones y las operaciones sensibles con los responsables del sistema.
4. **Base real y cuentas.** Preparar una base distinta de la demostración y un procedimiento seguro para crear el primer administrador. El script `npm run db:setup` ejecuta un esquema que elimina tablas existentes y carga usuarios de demostración: **no ejecutarlo contra una base con datos que deban conservarse ni usarlo como inicialización de producción**. No usar contraseñas demo ni copiar el `.env.local` de desarrollo.
5. **Respaldos y restauración.** Definir responsable, frecuencia, retención y almacenamiento protegido. Probar la restauración completa en una base separada antes de depender de los respaldos; incluir tanto los datos como los archivos de documentos almacenados en la base. Antes de cualquier migración, comprobar que existe un respaldo restaurable.
6. **IA.** Configurar el proveedor solo cuando la organización apruebe el envío de fragmentos. La clave `ANTHROPIC_API_KEY` y el modelo se configuran solo en servidor. RF-13 y RF-14 tienen pruebas simuladas, pero faltan pruebas reales con datos de prueba; la búsqueda actual es léxica, no semántica, y las citas verificadas no garantizan una respuesta correcta. Definir límites de costo y acceso.
7. **GitHub privado.** `GITHUB_READ_TOKEN` y `GITHUB_REPOSITORIES` son opcionales. El token debe tener acceso mínimo y usarse solo si se acepta que quienes puedan ver el proyecto en Noah consulten sus issues privados, aunque no tengan cuenta de GitHub autorizada individualmente. Documentar el dueño, alcance y rotación del token.
8. **Validación con usuarios.** El administrador, gerencia, jefes y colaboradores deben probar sus recorridos, permisos, reportes, documentos, indicadores y exportación. Confirmar que las fórmulas de KPI y la disponibilidad de historial corresponden a las expectativas del negocio.
9. **Operación.** Revisar HTTPS, dominio, supervisión, registro de errores sin secretos, capacidad y límites de conexión a PostgreSQL (cada instancia puede abrir hasta cinco conexiones). Las alertas se sincronizan al consultarlas; no hay garantía de detección inmediata mediante un proceso programado. Definir cómo se monitorearán y atenderán los fallos.

## Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a la base del entorno correspondiente. |
| `DATABASE_SSL` | `true` verifica certificado y nombre; `false` solo para localhost fuera de producción. |
| `DATABASE_CA_CERT` | Certificado PEM de la CA del proveedor, si no pertenece al almacén de confianza del sistema. |
| `JWT_SECRET` | Firma de sesiones; debe ser único y mantenerse secreto. |
| `ANTHROPIC_API_KEY` | Opcional hasta habilitar IA; solo en servidor. |
| `ANTHROPIC_MODEL` | Modelo de Anthropic, configurable. |
| `GITHUB_READ_TOKEN` | Opcional para repositorios privados, solo en servidor. |
| `GITHUB_REPOSITORIES` | Lista explícita de repositorios para los que se usa el token. |

Las variables reales deben configurarse en el gestor de secretos del entorno, no en el repositorio. Revisar la cadena de conexión y el tipo de pooler con el proveedor de base de datos antes de operar.

## Migraciones de una base existente

Antes de aplicar cambios, identificar qué versión de esquema está instalada, revisar los SQL en `db/migrations/`, hacer un respaldo y probar la migración y restauración en una copia. Los scripts disponibles son `db:migrate:rf07`, `db:migrate:rf08`, `db:migrate:rf11`, `db:migrate:rf12` y `db:migrate:github`; no asumir que una base desconocida acepta todos sin revisión. Usan la variable `DATABASE_URL` del archivo `.env.local` por sus comandos npm; no apuntar ese archivo a producción sin controlar explícitamente el entorno. Una migración fallida requiere investigar antes de reintentar.

## Orden propuesto

1. Configurar un secreto propio en el entorno y verificar el certificado del proveedor y resolver la protección de inicio de sesión.
2. Diseñar la inicialización de una base real, el primer administrador y el respaldo/restauración.
3. Preparar un entorno de pruebas separado, aplicar migraciones verificadas y probar documentos y roles.
4. Configurar y probar Anthropic con datos de demostración cuando corresponda.
5. Realizar la aceptación con NOAH TECH y documentar incidencias y decisiones.
6. Elegir plataforma de alojamiento y preparar un despliegue revisable; publicar solo cuando se solicite.
