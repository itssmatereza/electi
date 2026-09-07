# -*- coding: utf-8 -*-
"""
════════════════════════════════════════════════════════════════════
 CONSTRUCTOR DEL SITIO DE ELECTI
════════════════════════════════════════════════════════════════════

 Qué hace: toma el molde (src/plantilla.html), los trozos compartidos
 (src/parciales/) y el contenido de cada página (src/paginas/), y arma
 las páginas finales que Cloudflare publica.

 Cómo se usa:   python3 build.py

 Qué NO hay que hacer: editar los archivos generados (index.html,
 programa/index.html, etc.). Cualquier cambio ahí se pierde en la
 siguiente construcción. Se edita SIEMPRE dentro de src/.

 Para cambiar el dominio: la línea DOMINIO, unas líneas más abajo.
════════════════════════════════════════════════════════════════════
"""
import io, os, re, sys

# ── LO ÚNICO QUE SE TOCA AQUÍ ────────────────────────────────────
# El día que ELECTI tenga dominio propio, se cambia esta línea,
# se corre el script y las 13 páginas quedan actualizadas.
# Sin barra al final.
DOMINIO = 'https://electi.pages.dev'
# ─────────────────────────────────────────────────────────────────

RAIZ = os.path.dirname(os.path.abspath(__file__))


def leer(*p):
    return io.open(os.path.join(RAIZ, *p), encoding='utf-8').read()


def escribir(ruta, texto):
    destino = os.path.join(RAIZ, ruta)
    carpeta = os.path.dirname(destino)
    if carpeta and not os.path.isdir(carpeta):
        os.makedirs(carpeta)
    io.open(destino, 'w', encoding='utf-8').write(texto)


def ficha_y_cuerpo(texto):
    """Separa la cabecera de datos (el comentario de arriba) del contenido."""
    m = re.match(r'\s*<!--\n(.*?)-->\n', texto, re.S)
    if not m:
        raise SystemExit('Falta la cabecera de datos en una página')
    datos = {}
    for linea in m.group(1).strip().split('\n'):
        if ':' in linea:
            k, v = linea.split(':', 1)
            datos[k.strip()] = v.strip()
    return datos, texto[m.end():]


def escapar(t):
    return t.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def url_whatsapp(mensaje):
    from urllib.parse import quote
    return 'https://wa.me/593962893857?text=' + quote(mensaje)


def main():
    plantilla = leer('src', 'plantilla.html')
    nav = leer('src', 'parciales', 'nav.html')
    menu = leer('src', 'parciales', 'menu-movil.html')
    pie = leer('src', 'parciales', 'pie.html')
    fab = leer('src', 'parciales', 'whatsapp.html')

    rutas_sitemap = []
    generadas = []

    carpeta = os.path.join(RAIZ, 'src', 'paginas')
    for nombre in sorted(os.listdir(carpeta)):
        if not nombre.endswith('.html'):
            continue
        datos, cuerpo = ficha_y_cuerpo(leer('src', 'paginas', nombre))

        oculta = datos.get('noindex', '').lower() in ('si', 'sí', 'true', '1')
        pagina = plantilla
        pagina = pagina.replace('{{TITULO}}', escapar(datos['titulo']))
        pagina = pagina.replace('{{DESCRIPCION}}', escapar(datos['descripcion']))
        pagina = pagina.replace('{{COMPARTIR}}', escapar(datos['compartir']))
        pagina = pagina.replace('{{RUTA}}', datos['ruta'])
        pagina = pagina.replace('{{ROBOTS}}',
                                '<meta name="robots" content="noindex, nofollow">\n' if oculta else '')
        pagina = pagina.replace('{{NAV}}', nav)
        pagina = pagina.replace('{{MENU_MOVIL}}', menu)
        pagina = pagina.replace('{{PIE}}', pie)
        pagina = pagina.replace('{{WHATSAPP_FAB}}',
                                fab.replace('{{WHATSAPP}}', url_whatsapp(datos['whatsapp'])))
        pagina = pagina.replace('{{CONTENIDO}}', cuerpo.strip())
        pagina = pagina.replace('{{DOMINIO}}', DOMINIO)

        if '{{' in pagina:
            sobra = re.findall(r'\{\{[A-Z_]+\}\}', pagina)
            raise SystemExit('Quedaron huecos sin rellenar en %s: %s' % (nombre, sobra))

        escribir(datos['archivo'], pagina)
        generadas.append((datos['archivo'], len(pagina.encode('utf-8'))))
        if not oculta:
            rutas_sitemap.append(datos['ruta'])

    # ── sitemap ──
    filas = []
    for r in rutas_sitemap:
        prio = '1.0' if r == '/' else '0.8'
        filas.append('  <url><loc>%s%s</loc><changefreq>weekly</changefreq>'
                     '<priority>%s</priority></url>' % (DOMINIO, r, prio))
    filas.append('  <url><loc>%s/privacidad.html</loc><changefreq>yearly</changefreq>'
                 '<priority>0.2</priority></url>' % DOMINIO)
    escribir('sitemap.xml',
             '<?xml version="1.0" encoding="UTF-8"?>\n'
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
             + '\n'.join(sorted(filas)) + '\n</urlset>\n')

    escribir('robots.txt',
             'User-agent: *\nAllow: /\nDisallow: /uide/\n\nSitemap: %s/sitemap.xml\n' % DOMINIO)

    print('Sitio construido con dominio: %s\n' % DOMINIO)
    for archivo, peso in sorted(generadas):
        print('  %-32s %6.1f KB' % (archivo, peso / 1024.0))
    print('\n  sitemap.xml  ->  %d páginas' % len(rutas_sitemap))
    print('\nListo. Sube los cambios a GitHub y Cloudflare publica solo.')


if __name__ == '__main__':
    main()
