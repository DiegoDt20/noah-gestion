# Archivos de prueba RF-12

Datos sintéticos, sin información de usuarios. Se usan en `npm run test:rf12`:

- `requisitos.pdf`: dos páginas con texto seleccionable, creadas con pypdf.
- `acuerdos.docx`: párrafos con tildes y una tabla, creado con python-docx.
- `sin-texto.pdf`: página vacía para comprobar el mensaje de OCR/texto ausente.
- `protegido.pdf`: PDF de prueba cifrado con la contraseña desechable `prueba-fixture`.
- `demasiadas-paginas.pdf`: 101 páginas vacías, sobre el límite del extractor.
- `exceso-descomprimido.docx`: ZIP sintético con un XML de más de 10 MB; comprueba que se rechaza antes de procesar Word.

Los casos inválidos se incluyen deliberadamente para probar los límites. El sistema no ejecuta su contenido.
