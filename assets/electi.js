/* ══════════════════════════════════════════════════════════════
   INTERRUPTOR DE ANIMACIONES
   ──────────────────────────────────────────────────────────────
   Las reglas del CSS que esconden contenido para animarlo después
   dependen de la clase .anim, y esa clase la enciende este bloque
   SOLO si el navegador tiene lo necesario. Si algo falla —un error
   de JavaScript, un navegador que no conoce IntersectionObserver,
   una extensión que bloquea scripts— la clase no se enciende o se
   apaga, y la página se ve completa y quieta.

   Esto nació de un caso real: las fotos se veían en Safari pero no
   en Chrome. Con este interruptor, cualquiera que sea la causa,
   lo peor que puede pasar es perder una animación.
   ══════════════════════════════════════════════════════════════ */
(function(){
  var raiz = document.documentElement;
  var puede = ('IntersectionObserver' in window)
           && ('classList' in raiz)
           && (typeof requestAnimationFrame === 'function')
           && (typeof CSS === 'undefined' || !CSS.supports || CSS.supports('clip-path','inset(0 0 0 0)'));

  if (puede) raiz.className += ' anim';

  // Si algo revienta después, se apaga todo y el contenido queda visible.
  function rendirse(){
    raiz.className = raiz.className.replace(/\banim\b/g, '');
  }
  window.addEventListener('error', rendirse);

  // Último seguro: a los 4 segundos, todo lo que siga escondido se muestra.
  setTimeout(function(){
    var faltan = document.querySelectorAll(
      '.rv:not(.in), .foto-rv:not(.in), [data-escalon]:not(.in), .pal:not(.in), .ml-mapa:not(.llena)'
    );
    if (!faltan.length) return;
    Array.prototype.forEach.call(faltan, function(el){
      el.classList.add('in');
      if (el.classList.contains('ml-mapa')) el.classList.add('llena');
    });
  }, 4000);
})();

(function(){
  'use strict';

  // ── Nav con sombra al hacer scroll ──
  var nav = document.getElementById('nav');
  function onScroll(){
    if (window.scrollY > 12) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // ── Scroll reveal ──
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  function observar(){
    var els = document.querySelectorAll('.rv:not(.in), .step:not(.in)');
    if (!io) { Array.prototype.forEach.call(els, function(el){ el.classList.add('in'); }); return; }
    Array.prototype.forEach.call(els, function(el){ io.observe(el); });
  }
  window.observarReveal = observar;
  observar();
  document.addEventListener('DOMContentLoaded', observar);

  // ── Contadores animados ──
  var contadores = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var ioNum = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        ioNum.unobserve(el);
        var meta = parseInt(el.getAttribute('data-count'), 10) || 0;
        var pre = el.getAttribute('data-prefix') || '';
        var suf = el.getAttribute('data-suffix') || '';
        var dur = 1500, ini = performance.now();
        function paso(t){
          var p = Math.min((t - ini) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + Math.round(meta * eased) + suf;
          if (p < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(contadores, function(el){ ioNum.observe(el); });
  } else {
    Array.prototype.forEach.call(contadores, function(el){
      el.textContent = (el.getAttribute('data-prefix')||'') + el.getAttribute('data-count') + (el.getAttribute('data-suffix')||'');
    });
  }

  // ── Parallax sutil en los orbes del hero ──
  var orbes = document.querySelectorAll('.orb');
  if (orbes.length && window.matchMedia('(min-width:769px)').matches
      && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    var ticking = false;
    window.addEventListener('scroll', function(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var y = window.scrollY;
        if (y < 900) {
          orbes[0].style.transform = 'translateY(' + (y * 0.14) + 'px)';
          if (orbes[1]) orbes[1].style.transform = 'translateY(' + (y * -0.09) + 'px)';
        }
        ticking = false;
      });
    }, {passive:true});
  }
})();

// ── Menú móvil ──
function menuMovil(){
  document.getElementById('mobMenu').classList.toggle('on');
  document.getElementById('burger').classList.toggle('on');
}
function cerrarMenu(){
  document.getElementById('mobMenu').classList.remove('on');
  document.getElementById('burger').classList.remove('on');
  var gs = document.querySelectorAll('.mob-group.open');
  Array.prototype.forEach.call(gs, function(g){
    g.classList.remove('open');
    g.querySelector('.mob-sub').style.maxHeight = null;
  });
}
function grupoMovil(btn){
  var g = btn.parentElement, sub = btn.nextElementSibling;
  var abierto = g.classList.contains('open');
  var todos = document.querySelectorAll('.mob-group');
  Array.prototype.forEach.call(todos, function(x){
    x.classList.remove('open');
    x.querySelector('.mob-sub').style.maxHeight = null;
  });
  if (!abierto){ g.classList.add('open'); sub.style.maxHeight = sub.scrollHeight + 'px'; }
}

// ── Desplegables de escritorio ──
function abrirDD(btn){
  var item = btn.parentElement;
  var abierto = item.classList.contains('open');
  cerrarDD();
  if (!abierto) item.classList.add('open');
}
function cerrarDD(){
  var items = document.querySelectorAll('.nav-item.open');
  Array.prototype.forEach.call(items, function(i){ i.classList.remove('open'); });
}
document.addEventListener('click', function(e){
  if (!e.target.closest('[data-dd]')) cerrarDD();
});
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){ cerrarDD(); cerrarMenu(); }
});

// ══════════════════════════════════════════════════════════
// ELECTI INSTITUCIONES · envío del formulario B2B
// PENDIENTE DE INTEGRACIÓN: hoy sólo valida y compone un correo.
// Ver la nota "INTEGRACIÓN PENDIENTE" en la documentación de entrega.
// Para revertir: eliminar esta función y la página #pg-instituciones.
// ══════════════════════════════════════════════════════════
function enviarInstituciones(ev){
  ev.preventDefault();
  var f = ev.target;
  var aviso = document.getElementById('inst-aviso');
  var d = {};
  ['nombre','cargo','institucion','ciudad','telefono','correo','cantidad','modalidad','mensaje']
    .forEach(function(k){ d[k] = (f.elements[k] && f.elements[k].value || '').trim(); });

  if (!d.nombre || !d.cargo || !d.institucion || !d.ciudad || !d.telefono ||
      !d.correo || !d.cantidad || !d.modalidad){
    aviso.className = 'inst-aviso-envio err';
    aviso.textContent = 'Falta completar algún campo obligatorio.';
    return false;
  }

  var cuerpo = [
    'Solicitud de vinculación institucional — ELECTI Instituciones', '',
    'Nombre: ' + d.nombre,
    'Cargo: ' + d.cargo,
    'Institución: ' + d.institucion,
    'Ciudad: ' + d.ciudad,
    'Correo: ' + d.correo,
    'Teléfono: ' + d.telefono,
    'Estudiantes interesados: ' + d.cantidad,
    'Modalidad de interés: ' + d.modalidad, '',
    'Mensaje:', (d.mensaje || '—')
  ].join('\n');

  window.location.href = 'mailto:mreza@unionestudiantil.org'
    + '?subject=' + encodeURIComponent('Solicitud institucional · ' + d.institucion)
    + '&body=' + encodeURIComponent(cuerpo);

  aviso.className = 'inst-aviso-envio ok';
  aviso.textContent = 'Se abrirá su cliente de correo con la solicitud lista para enviar. '
    + 'Si no se abre, escríbanos a mreza@unionestudiantil.org.';
  return false;
}

// ── Selector de sede: retirado ──
// La portada tenía pestañas para elegir entre cuatro ciudades. Al pasar a
// dos modalidades ese bloque salió del HTML, así que su código también.
// Si se reactivan las sedes por ciudad, está en el historial de git.

// ── Acordeón FAQ ──
function toggleFaq(btn){
  var item = btn.parentElement;
  var panel = btn.nextElementSibling;
  var abierto = item.classList.contains('on');
  var todos = document.querySelectorAll('.fq');
  Array.prototype.forEach.call(todos, function(f){
    f.classList.remove('on');
    f.querySelector('.fq-a').style.maxHeight = null;
    f.querySelector('.fq-q').setAttribute('aria-expanded', 'false');
  });
  if (!abierto) {
    item.classList.add('on');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    btn.setAttribute('aria-expanded', 'true');
  }
}

/* ══════════════════════════════════════════════════════════════
   CAPA DE MOVIMIENTO
   Barra de progreso, llenado del mapa de semanas, revelado de
   fotos con cortina y acercamiento lento de la franja del hero.
   Todo se apaga solo si el sistema pide menos animación.
   ══════════════════════════════════════════════════════════════ */
(function(){
  try {
  var quieto = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var movil  = window.matchMedia('(max-width:768px)').matches;
  var hayIO  = 'IntersectionObserver' in window;

  /* ── Barra de progreso de lectura ── */
  if (!quieto) {
    var barra = document.createElement('div');
    barra.className = 'progreso';
    document.body.appendChild(barra);
    var pendiente = false;
    function pintarProgreso(){
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      var p = alto > 0 ? Math.min(window.scrollY / alto, 1) : 0;
      barra.style.transform = 'scaleX(' + p + ')';
      pendiente = false;
    }
    window.addEventListener('scroll', function(){
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(pintarProgreso);
    }, {passive:true});
    window.addEventListener('resize', pintarProgreso, {passive:true});
    pintarProgreso();
  }

  /* ── El mapa de 24 semanas se llena en orden ── */
  var mapas = document.querySelectorAll('.ml-mapa');
  Array.prototype.forEach.call(mapas, function(mapa){
    var celdas = mapa.querySelectorAll('.ml-c');
    Array.prototype.forEach.call(celdas, function(c, i){
      c.style.setProperty('--i', i);
    });
    var bandas = mapa.parentNode.querySelectorAll('.ml-banda');
    Array.prototype.forEach.call(bandas, function(b, i){
      b.style.setProperty('--i', i);
    });
    if (quieto || !hayIO) { mapa.classList.add('llena'); return; }
    var ioMapa = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){
        if (!e.isIntersecting) return;
        mapa.classList.add('llena');
        ioMapa.unobserve(mapa);
      });
    }, {threshold:0.25});
    ioMapa.observe(mapa);
    setTimeout(function(){ mapa.classList.add('llena'); }, 4000);
  });

  /* ── Fotos con revelado de cortina ── */
  var fotos = document.querySelectorAll(
    '.gen-franja, .sol-foto, .ml-tira, .fs-img, .qt-fotos figure, .ml-foto, .tira'
  );
  if (fotos.length) {
    Array.prototype.forEach.call(fotos, function(f){ f.classList.add('foto-rv'); });
    if (quieto || !hayIO) {
      Array.prototype.forEach.call(fotos, function(f){ f.classList.add('in'); });
    } else {
      var ioFoto = new IntersectionObserver(function(entradas){
        entradas.forEach(function(e){
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          ioFoto.unobserve(e.target);
        });
      }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
      Array.prototype.forEach.call(fotos, function(f){
        // Lo que ya está en pantalla al cargar se muestra de una: en
        // monitores grandes media página entra antes del primer scroll.
        var caja = f.getBoundingClientRect();
        if (caja.top < window.innerHeight && caja.bottom > 0) { f.classList.add('in'); return; }
        ioFoto.observe(f);
      });
      // Red de seguridad: si algo impide que el observador dispare, a los
      // tres segundos se muestran todas. Una foto nunca se queda invisible.
      setTimeout(function(){
        Array.prototype.forEach.call(fotos, function(f){ f.classList.add('in'); });
      }, 3000);
    }
  }

  /* ── El antetítulo dibuja su línea al entrar ── */
  var antetitulos = document.querySelectorAll('.eyebrow');
  if (antetitulos.length && hayIO && !quieto) {
    var ioEye = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        ioEye.unobserve(e.target);
      });
    }, {threshold:0.6});
    Array.prototype.forEach.call(antetitulos, function(el){ ioEye.observe(el); });
  } else {
    Array.prototype.forEach.call(antetitulos, function(el){ el.classList.add('in'); });
  }

  /* ── La franja del hero se acerca despacio mientras se baja ── */
  var franja = document.querySelector('.gen-franja img');
  if (franja && !quieto && !movil) {
    var tickF = false;
    window.addEventListener('scroll', function(){
      if (tickF) return;
      tickF = true;
      requestAnimationFrame(function(){
        var caja = franja.parentNode.getBoundingClientRect();
        if (caja.bottom > 0 && caja.top < window.innerHeight) {
          var avance = 1 - (caja.top + caja.height) / (window.innerHeight + caja.height);
          franja.style.transform = 'scale(' + (1.04 + avance * 0.05).toFixed(4) + ')';
        }
        tickF = false;
      });
    }, {passive:true});
  }
  } catch (e) {
    /* Si esta capa falla, se pierde su animación y nada más:
       el resto del archivo sigue corriendo y el contenido queda visible. */
  }
})();

/* ══════════════════════════════════════════════════════════════
   CAPA DE ENTRADA · el inicio
   Parte los titulares en palabras, arma el fondo vivo del hero,
   mueve la luz con el puntero y escalona las rejillas.
   ══════════════════════════════════════════════════════════════ */
(function(){
  try {
  var quieto = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var movil  = window.matchMedia('(max-width:768px)').matches;
  var fino   = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ── Partir un titular en palabras, respetando su marcado interno ── */
  function partirEnPalabras(raiz){
    if (raiz.getAttribute('data-partido')) return;
    raiz.setAttribute('data-partido', '1');
    var n = 0;
    (function recorrer(nodo){
      var hijos = Array.prototype.slice.call(nodo.childNodes);
      hijos.forEach(function(h){
        if (h.nodeType === 3) {                       // texto
          var partes = h.nodeValue.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          partes.forEach(function(p){
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var fuera = document.createElement('span');
            fuera.className = 'pal';
            fuera.style.setProperty('--w', n++);
            var dentro = document.createElement('span');
            dentro.textContent = p;
            fuera.appendChild(dentro);
            frag.appendChild(fuera);
          });
          nodo.replaceChild(frag, h);
        } else if (h.nodeType === 1 && h.tagName !== 'BR') {
          recorrer(h);                                // entra a <span class="grad">, <b>, etc.
        }
      });
    })(raiz);
  }

  if (!quieto) {
    var titulares = document.querySelectorAll('.hero h1, .ph h1, .h-section');
    Array.prototype.forEach.call(titulares, partirEnPalabras);

    // Los que no llevan .rv necesitan su propio disparador
    if ('IntersectionObserver' in window) {
      var ioPal = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          ioPal.unobserve(e.target);
        });
      }, {threshold:0.2});
      Array.prototype.forEach.call(titulares, function(t){
        if (!t.classList.contains('rv')) ioPal.observe(t);
      });
    }
  }

  /* ── Fondo vivo del hero ── */
  var hero = document.querySelector('.hero');
  if (hero && !quieto) {
    var aurora = document.createElement('div');
    aurora.className = 'aurora';
    aurora.innerHTML = '<i></i><i></i><i></i>';
    hero.insertBefore(aurora, hero.firstChild);

    var grano = document.createElement('div');
    grano.className = 'grano';
    hero.appendChild(grano);

    if (fino && !movil) {
      var luz = document.createElement('div');
      luz.className = 'hero-luz';
      hero.appendChild(luz);
      var tickL = false, mx = 50, my = 40;
      hero.addEventListener('mousemove', function(ev){
        var caja = hero.getBoundingClientRect();
        mx = ((ev.clientX - caja.left) / caja.width) * 100;
        my = ((ev.clientY - caja.top) / caja.height) * 100;
        if (tickL) return;
        tickL = true;
        requestAnimationFrame(function(){
          luz.style.setProperty('--mx', mx.toFixed(1) + '%');
          luz.style.setProperty('--my', my.toFixed(1) + '%');
          tickL = false;
        });
      }, {passive:true});
    }

    // Indicador de que hay más abajo
    if (!movil) {
      var baja = document.createElement('div');
      baja.className = 'baja';
      baja.innerHTML = 'Desliza<span></span>';
      hero.appendChild(baja);
    }

    // El contenido del hero se aleja al bajar
    if (!movil) {
      var dentro = hero.querySelector('.hero-inner');
      var tickH = false;
      window.addEventListener('scroll', function(){
        if (tickH) return;
        tickH = true;
        requestAnimationFrame(function(){
          var y = window.scrollY;
          if (y < window.innerHeight * 1.1) {
            var p = y / window.innerHeight;
            dentro.style.transform = 'translateY(' + (y * 0.16).toFixed(1) + 'px)';
            dentro.style.opacity = Math.max(0, 1 - p * 1.25).toFixed(3);
          }
          tickH = false;
        });
      }, {passive:true});
    }
  }

  /* ── El destello del botón necesita el ancho real del botón ── */
  var btnHero = document.querySelector('.hero .btn-primary');
  if (btnHero && !quieto) {
    var medir = function(){
      btnHero.style.setProperty('--ancho-btn', (btnHero.offsetWidth + 70) + 'px');
    };
    medir();
    window.addEventListener('resize', medir, {passive:true});
  }

  /* ── Escalonado automático de rejillas ── */
  var rejillas = document.querySelectorAll(
    '.fs-grid, .ml-ejes, .mh-ejes, .qt-lista, .ml-llevas, .hero-proof, .ml-cifras, .pm-fases'
  );
  if (rejillas.length && !quieto) {
    Array.prototype.forEach.call(rejillas, function(r){
      r.setAttribute('data-escalon', '1');
      Array.prototype.forEach.call(r.children, function(h, i){
        h.style.setProperty('--e', i);
      });
    });
    if ('IntersectionObserver' in window) {
      var ioRej = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          ioRej.unobserve(e.target);
        });
      }, {threshold:0.15});
      Array.prototype.forEach.call(rejillas, function(r){ ioRej.observe(r); });
    } else {
      Array.prototype.forEach.call(rejillas, function(r){ r.classList.add('in'); });
    }
    setTimeout(function(){
      Array.prototype.forEach.call(rejillas, function(r){ r.classList.add('in'); });
    }, 3000);
  }
  } catch (e) {
    /* Si esta capa falla, se pierde su animación y nada más:
       el resto del archivo sigue corriendo y el contenido queda visible. */
  }
})();
