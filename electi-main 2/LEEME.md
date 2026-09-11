# Sitio de ELECTI — cómo está organizado

## Lo importante en una frase

**Se edita en `src/`. Nunca se editan los archivos generados.**

---

## Las dos mitades del repositorio

### 1. Lo que se edita: la carpeta `src/`

```
src/
  plantilla.html          El molde: cabecera, tipografía, dónde va cada cosa
  parciales/
    nav.html              El menú de escritorio      ← existe UNA sola vez
    menu-movil.html       El menú de celular         ← existe UNA sola vez
    pie.html              El pie de página           ← existe UNA sola vez
    whatsapp.html         El botón flotante de WhatsApp
  paginas/
    home.html             Contenido de la página de inicio
    programa.html         Contenido de /programa/
    becas.html            ... y así con las 13
```

Si hay que cambiar un enlace del menú, se cambia en `src/parciales/nav.html`
y queda cambiado en las trece páginas. Si hay que cambiar el precio, se cambia
en `src/paginas/becas.html` y en `src/paginas/home.html`, que son los dos
lugares donde aparece.

### 2. Lo que se genera: todo lo demás

`index.html`, `programa/index.html`, `becas/index.html`, etc., más
`sitemap.xml` y `robots.txt`. Son los archivos que Cloudflare publica.

**Editar estos archivos no sirve de nada**: el cambio se pierde la próxima vez
que se construye el sitio.

---

## Cómo se construye

En una terminal, dentro de la carpeta del proyecto:

```
python3 build.py
```

Tarda menos de un segundo y muestra las páginas que generó con su peso.
Después se suben todos los cambios a GitHub y Cloudflare publica solo.

---

## La cabecera de datos de cada página

Cada archivo dentro de `src/paginas/` empieza con un comentario así:

```
<!--
titulo: Becas e inversión · Hasta el 100% — ELECTI
descripcion: Cuatro tipos de beca, hasta del 100%...
compartir: Becas de ELECTI · Hasta el 100%
whatsapp: Hola, quiero informacion sobre las becas de ELECTI.
ruta: /becas/
archivo: becas/index.html
-->
```

- **titulo** — lo que se ve en la pestaña del navegador y como titular en Google.
  Conviene que tenga entre 50 y 60 caracteres.
- **descripcion** — el párrafo gris debajo del titular en Google. Entre 140 y 160.
- **compartir** — el título que aparece al pegar el enlace en WhatsApp o Instagram.
- **whatsapp** — el mensaje que sale ya escrito cuando alguien toca el botón verde
  desde esa página. Sin tildes, para que no se rompa el enlace.
- **ruta** y **archivo** — no tocar salvo que se mueva la página de sitio.

Se pueden editar libremente: son texto normal.

---

## Para agregar una página nueva (por ejemplo, una quinta sede)

1. Copiar `src/paginas/sede-cuenca.html` con otro nombre, por ejemplo
   `src/paginas/sede-loja.html`.
2. Cambiar la cabecera de datos: `titulo`, `descripcion`, `ruta: /loja/`,
   `archivo: loja/index.html`.
3. Cambiar el contenido.
4. Agregar el enlace en `src/parciales/nav.html`, `src/parciales/menu-movil.html`
   y `src/parciales/pie.html`.
5. Correr `python3 build.py`.

El sitemap se actualiza solo.

---

## El día que haya dominio propio

Abrir `build.py` y cambiar una sola línea, la que dice:

```python
DOMINIO = 'https://electi.pages.dev'
```

Correr `python3 build.py`. Las trece páginas, el sitemap y las tarjetas de
compartir quedan actualizadas.

Después, dos tareas de diez minutos:
1. En Google Search Console, dar de alta el dominio nuevo y usar la opción
   de "cambio de dirección".
2. Volver a compartir un enlace en Instagram y WhatsApp para que refresquen
   la imagen de vista previa, que queda guardada en caché.

---

## Otras carpetas

- `assets/` — el CSS, el JavaScript y las imágenes (logos y fotos de docentes).
  El CSS y el JS se generaron una vez y se editan directamente ahí.
- `portal/` — el portal de alumnos. **No tiene nada que ver con este sistema.**
  Sigue siendo un archivo único e independiente.
- `_redirects` — atajos y redirecciones. Los QR ya impresos siguen funcionando.
- `_headers` — reglas de caché y seguridad.

---

## Si algo sale mal

El script no borra nada: solo sobreescribe las páginas que genera. Si una
construcción sale mal, se corrige el archivo en `src/` y se vuelve a correr.

Si `build.py` se detiene con un mensaje de error, lo más probable es que a una
página le falte un dato en su cabecera. El mensaje dice cuál.

Si algún día ya no se quiere usar este sistema, se borran `build.py` y `src/`:
las trece páginas HTML quedan y funcionan igual por su cuenta.
