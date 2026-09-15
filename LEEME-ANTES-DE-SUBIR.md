# Cómo aplicar este cambio

1. Copiar todo esto encima del repo, respetando las carpetas.
2. Borrar lo que ya no se genera (descomprimir agrega y reemplaza, nunca borra):
   - carpetas: `guayaquil/`, `cuenca/`, `santodomingo/`, `sedes/`
   - archivos: `src/paginas/sede-guayaquil.html`, `sede-cuenca.html`,
     `sede-santo-domingo.html`, `sedes.html`
     (están guardados en `src/_pausadas/`, no se pierden)
3. `python3 build.py`
4. Subir a GitHub. Cloudflare publica solo.

## Revisión hecha antes de entregar

Se comprobó, página por página (las 11):
- marcado balanceado, sin etiquetas sin cerrar
- ningún `{{MARCADOR}}` de plantilla sin reemplazar
- todas las imágenes y enlaces internos existen
- todos los JSON-LD son válidos
- todas las páginas traen `meta viewport` y el sello de versión del CSS
- CSS con llaves y paréntesis balanceados
- ninguna animación usada sin definir
- JavaScript compila limpio

## Arreglado en esta revisión

- Las tildes del titular partido en palabras se cortaban por arriba.
- El destello del botón animaba `left` (repinta cada cuadro); pasó a `transform`.
- En teléfono, tres capas desenfocadas animándose daban tirones: ahora el
  fondo del hero queda fijo, con el mismo color.
- El mapa de 24 semanas no avisaba que se desplaza de lado en pantallas
  chicas: se le puso un degradado en el borde derecho.
- `var(--sky-light)` no existía (era `--sky-l`): ese borde nunca cambiaba.
- Código muerto del selector de cuatro sedes, retirado del JavaScript.

## Cosas que siguen pendientes de tu decisión

- Seis de las trece fotos vienen de WhatsApp en baja resolución. Solo se usan
  en tarjetas chicas, pero una sesión de fotos en una clase del sábado es lo
  que más subiría el nivel visual del sitio.
- Falta fecha de cierre de postulaciones en el hero (hay un comentario
  `PENDIENTE` en `src/paginas/home.html`).
