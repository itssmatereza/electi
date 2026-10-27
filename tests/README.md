# Postulaciones: comprobación del envío

Ejecutar desde la raíz con Node.js y Playwright disponibles:

```sh
node tests/postular.cjs
```

Opcional: `CHROME_PATH` permite usar un Chrome instalado en vez del navegador de Playwright; `SCREENSHOTS_DIR` guarda capturas de los estados de fallo. El servidor se abre solo en 127.0.0.1. Las peticiones a Firestore se interceptan: no se crean leads reales. Los temporizadores de reintento y espera máxima se aceleran durante las pruebas.

Se comprueban validación, confirmación del documento, borrador entre recargas y pestañas, expiración, almacenamiento bloqueado, límite de reintentos, conexión recuperada, respuesta perdida, tiempo de espera, permisos rechazados, doble envío, recomendación en WhatsApp y tamaños de 1440, 390 y 320 px.

## Alcance del refuerzo

- Guarda un borrador en este navegador, recuperable durante 24 horas desde la última edición. Se elimina al confirmar el envío; los borradores vencidos se descartan al volver al formulario.
- Cada postulación conserva un ID aleatorio y el mismo cuerpo en sus reintentos. Se usa `createDocument` con `documentId`: no se actualizan ni se leen documentos ajenos. Un conflicto explícito `ALREADY_EXISTS` reconoce una creación previa con ese mismo ID. Cualquier otro rechazo conserva el borrador y ofrece WhatsApp.
- Realiza hasta tres intentos por envío, con una espera máxima de 10 segundos por intento. Reintenta fallos recuperables, no errores de permisos o datos inválidos. Si se queda sin conexión, reanuda al volver internet mientras la página siga abierta.
- Después de cerrar y reabrir la página, recupera los datos y pide pulsar «Reintentar envío». No envía automáticamente al abrir el formulario.
- Si el navegador bloquea el almacenamiento, los datos se conservan en memoria mientras permanezca abierta la página y se informa de esa limitación.
- El enlace alternativo de WhatsApp incluye el teléfono y la recomendación. Abrir el enlace no confirma una postulación: la persona debe enviar el mensaje.
- Se elimina el campo antispam que podía redirigir a gracias sin guardar. La página de gracias solo se abre tras un recibo válido del documento o un conflicto explícito del mismo ID.

No cambia el esquema ni necesita nuevas reglas de Firestore. Las pruebas de fallos usan respuestas simuladas; no reemplazan una prueba integrada de las reglas publicadas. Esto reduce el riesgo de pérdida y duplicados, pero no garantiza entrega si se cierran todas las páginas y nunca se retoma el envío, se borran los datos del navegador o Firebase rechaza las escrituras de forma permanente. No incorpora un servicio de alertas ni una copia independiente del servidor.
