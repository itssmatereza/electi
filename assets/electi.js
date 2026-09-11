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

// ── Selector de sede (metodología en el inicio) ──
function verSede(cod){
  var paneles = document.querySelectorAll('.met-panel');
  Array.prototype.forEach.call(paneles, function(p){ p.classList.remove('on'); });
  var destino = document.getElementById('met-' + cod);
  if (destino) destino.classList.add('on');

  var tabs = document.querySelectorAll('.met-tab');
  Array.prototype.forEach.call(tabs, function(t){
    t.classList.toggle('on', t.getAttribute('data-sede') === cod);
  });

  var sel = document.querySelector('.met-select');
  if (sel && sel.value !== cod) sel.value = cod;

  if (window.observarReveal) window.observarReveal();
}

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
