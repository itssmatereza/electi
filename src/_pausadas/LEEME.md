# Páginas en pausa

Estas cuatro páginas salieron del sitio mientras el programa opera solo en Quito.
No están borradas: están fuera de `src/paginas/`, así que `build.py` no las construye
y no aparecen en el menú ni en el sitemap.

- `sede-guayaquil.html`
- `sede-cuenca.html`
- `sede-santo-domingo.html`
- `sedes.html` (comparativa de las cuatro)

**Para reactivarlas:** se mueven de vuelta a `src/paginas/`, se vuelven a poner los
enlaces en `src/parciales/nav.html`, `menu-movil.html` y `pie.html`, se quitan las
redirecciones de `_redirects` y se corre `python3 build.py`.

Ojo al reactivar: los textos de estas páginas hablan de bloques regionales
(Costa / Sierra) y de la malla vieja de seis meses. Hay que actualizarlos a la
malla de 24 semanas antes de volver a publicarlos.
