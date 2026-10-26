# Publicación manual de reglas

`firestore.rules` parte del archivo «reglas-firebase-completas-v2.txt» compartido en la conversación «Revisar sitio web». El único cambio es añadir `Bachiller graduado (aún no inicio la universidad)` a los valores permitidos de `curso` en `/postulaciones/{id}`.

Antes de publicar el formulario, añade ese mismo valor a la lista `request.resource.data.curso in [...]` en las reglas vigentes de Firebase Console → Firestore Database → Reglas y publícalas. Si las reglas vigentes han cambiado desde aquel archivo, conserva esas modificaciones y aplica solo esta adición; no las reemplaces por una versión anterior.

Las reglas no se publican con `build.py` ni con Cloudflare Pages. Esta rama no las despliega. El formulario enviará el nuevo valor como texto, al igual que los otros cursos, y el portal lo mostrará sin cambios. Los permisos existentes se conservan.

Comprobación en el simulador de reglas de Firebase: una creación anónima en `/postulaciones/prueba` con nombre válido, WhatsApp internacional, quien, modalidad y el nuevo curso debe permitirse; un curso ajeno a la lista debe rechazarse. La lectura anónima debe seguir denegada.
