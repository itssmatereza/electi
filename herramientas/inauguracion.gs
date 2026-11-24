/**
 * ELECTI · Reservas para la inauguración de la 6.ª generación
 *
 * Recibe las reservas de electi.unionestudiantil.org/inauguracion/,
 * las guarda en la hoja "Reservas" de esta hoja de cálculo y envía
 * a cada persona un correo de confirmación desde la cuenta que publica
 * el script (idealmente electi@unionestudiantil.org).
 *
 * Instalación (una sola vez, unos 3 minutos):
 *   1. Con la cuenta de ELECTI, crea una hoja de cálculo nueva en Google
 *      Sheets llamada "Inauguración ELECTI · Reservas".
 *   2. Extensiones → Apps Script. Borra lo que haya y pega este archivo.
 *   3. Guarda (ícono de disquete).
 *   4. Implementar → Nueva implementación → tipo "Aplicación web".
 *      · Ejecutar como: Yo
 *      · Quién tiene acceso: Cualquier usuario
 *   5. Autoriza los permisos que pide Google (hoja de cálculo y Gmail).
 *   6. Copia la URL que termina en /exec y pásala para ponerla en la página.
 *
 * Si cambias algo de este código, vuelve a Implementar → Gestionar
 * implementaciones → editar (lápiz) → Versión: nueva → Implementar.
 * La URL no cambia.
 */

var EVENTO = {
  nombre: 'Inauguración de la 6.ª generación de ELECTI',
  fecha: 'Sábado 28 de noviembre de 2026',
  hora: '11:00',
  lugar: 'Auditorio Casa Patrimonial, Quito',
  // 11:00 a 12:30 hora de Ecuador (UTC-5)
  inicioUTC: '20261128T160000Z',
  finUTC: '20261128T173000Z'
};
var CUPO_PERSONAS = 60;          // aforo total, contando acompañantes
var MAX_ACOMPANANTES = 4;
var HOJA = 'Reservas';
var RESPONDER_A = 'electi@unionestudiantil.org';
var SITIO = 'https://electi.unionestudiantil.org';

var COLUMNAS = ['Fecha', 'Nombre', 'Correo', 'WhatsApp', 'Perfil', 'Acompañantes',
                'Nombres de acompañantes', 'Total personas', 'Origen', 'Correo enviado'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents || '{}');
    var limpio = function (v, max) { return String(v || '').replace(/\s+/g, ' ').trim().slice(0, max); };
    var r = {
      nombre: limpio(d.nombre, 80),
      correo: limpio(d.correo, 120).toLowerCase(),
      whatsapp: limpio(d.whatsapp, 20),
      perfil: limpio(d.perfil, 60),
      acompanantes: (Array.isArray(d.acompanantes) ? d.acompanantes : []).slice(0, MAX_ACOMPANANTES)
        .map(function (x) { return limpio(x, 80); }).filter(function (x) { return x.length >= 2; }),
      origen: limpio(d.origen, 90)
    };
    if (r.nombre.length < 3) return json({ ok: false, error: 'Falta tu nombre.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.correo)) return json({ ok: false, error: 'Revisa tu correo.' });
    if (!/^0\d{8,9}$/.test(r.whatsapp)) return json({ ok: false, error: 'Revisa tu WhatsApp.' });

    var hoja = hojaReservas();
    var filas = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, COLUMNAS.length).getValues() : [];

    // Misma persona otra vez: no se duplica, solo se reenvía la confirmación
    for (var i = 0; i < filas.length; i++) {
      if (String(filas[i][2]).toLowerCase() === r.correo) {
        var previos = String(filas[i][6] || '').split(',').map(function (x) { return x.trim(); }).filter(String);
        enviarCorreo({ nombre: filas[i][1], correo: r.correo, acompanantes: previos });
        return json({ ok: true, repetido: true });
      }
    }

    var ocupados = filas.reduce(function (s, f) { return s + (Number(f[7]) || 0); }, 0);
    var personas = 1 + r.acompanantes.length;
    if (ocupados + personas > CUPO_PERSONAS) return json({ ok: false, lleno: true, quedan: Math.max(0, CUPO_PERSONAS - ocupados) });

    hoja.appendRow([new Date(), r.nombre, r.correo, r.whatsapp, r.perfil, r.acompanantes.length,
                    r.acompanantes.join(', '), personas, r.origen, '']);
    var fila = hoja.getLastRow();
    var enviado = enviarCorreo(r);
    hoja.getRange(fila, 10).setValue(enviado ? 'Sí' : 'Error');
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'No pudimos guardar tu reserva.' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Para revisar rápido que la aplicación está publicada (abre la URL /exec en el navegador)
function doGet() {
  var hoja = hojaReservas();
  var filas = hoja.getLastRow() > 1 ? hoja.getRange(2, 8, hoja.getLastRow() - 1, 1).getValues() : [];
  var ocupados = filas.reduce(function (s, f) { return s + (Number(f[0]) || 0); }, 0);
  return json({ ok: true, reservas: filas.length, personas: ocupados, cupo: CUPO_PERSONAS });
}

function hojaReservas() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA) || libro.insertSheet(HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold').setBackground('#0D2A6E').setFontColor('#FFFFFF');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function enviarCorreo(r) {
  var nombre = String(r.nombre).split(' ')[0];
  var cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
    encodeURIComponent('Inauguración ELECTI · 6.ª generación') + '&dates=' + EVENTO.inicioUTC + '/' + EVENTO.finUTC +
    '&location=' + encodeURIComponent(EVENTO.lugar) + '&details=' + encodeURIComponent(EVENTO.nombre);
  var acomp = r.acompanantes && r.acompanantes.length
    ? '<tr><td style="padding:10px 0;color:#7C88A6;font-size:12px;letter-spacing:.12em;font-weight:700;vertical-align:top;width:130px">CON USTED</td>' +
      '<td style="padding:10px 0;color:#0D2A6E;font-size:16px;font-weight:600">' + r.acompanantes.map(esc).join('<br>') + '</td></tr>'
    : '';
  var fila = function (k, v) {
    return '<tr><td style="padding:10px 0;color:#7C88A6;font-size:12px;letter-spacing:.12em;font-weight:700;width:130px;border-bottom:1px solid #EEF1F7">' + k + '</td>' +
           '<td style="padding:10px 0;color:#0D2A6E;font-size:16px;font-weight:700;border-bottom:1px solid #EEF1F7">' + v + '</td></tr>';
  };
  var html =
  '<div style="background:#F4F6FA;padding:32px 12px;font-family:Helvetica,Arial,sans-serif">' +
  '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden">' +
    '<tr><td style="background:#0D2A6E;padding:28px 32px">' +
      '<img src="' + SITIO + '/icon-192.png" width="40" height="40" alt="ELECTI" style="vertical-align:middle;border-radius:8px">' +
      '<span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-.5px;vertical-align:middle;margin-left:10px">ELECTI</span>' +
      '<div style="color:#EBBA55;font-size:12px;font-weight:700;letter-spacing:.2em;margin-top:22px">6.ª GENERACIÓN · CICLO 2027</div>' +
      '<div style="color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-.8px;line-height:1.15;margin-top:8px">Su lugar está confirmado</div>' +
    '</td></tr>' +
    '<tr><td style="padding:30px 32px 8px">' +
      '<p style="margin:0 0 14px;font-size:17px;color:#08153A;font-weight:700">Hola, ' + esc(nombre) + ':</p>' +
      '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#3D4A6B">Bienvenido a la inauguración de la nueva generación de ELECTI. Su reserva quedó registrada y le esperamos con mucho gusto.</p>' +
      '<p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#3D4A6B">ELECTI es la escuela de liderazgo y gestión de proyectos de Unión Estudiantil: un espacio donde, durante 24 semanas, jóvenes de colegio y de los primeros semestres de universidad trabajan su desarrollo personal y, en equipo, planifican, financian y ejecutan un proyecto real. Este sábado empieza la 6.ª generación, y nos alegra que nos acompañe en ese primer paso.</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">' +
        fila('FECHA', EVENTO.fecha) + fila('HORA', EVENTO.hora) + fila('LUGAR', EVENTO.lugar) + acomp +
      '</table>' +
      '<a href="' + cal + '" style="display:inline-block;background:#0D2A6E;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:999px">Agregar a mi calendario</a>' +
      '<p style="margin:26px 0 0;font-size:14px;line-height:1.6;color:#7C88A6">Le recomendamos llegar 10 minutos antes. Si necesita cambiar su reserva o tiene alguna pregunta, responda a este correo o escríbanos por WhatsApp al 096 289 3857.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:24px 32px 30px">' +
      '<p style="margin:0;font-size:15px;color:#08153A;font-weight:700">Nos vemos el sábado.</p>' +
      '<p style="margin:2px 0 0;font-size:14px;color:#7C88A6">Equipo ELECTI · Unión Estudiantil</p>' +
    '</td></tr>' +
  '</table>' +
  '<p style="text-align:center;font-size:12px;color:#9AA3BA;margin:18px 0 0"><a href="' + SITIO + '" style="color:#9AA3BA">electi.unionestudiantil.org</a></p>' +
  '</div>';

  var texto = 'Hola, ' + nombre + ':\n\nSu lugar para la ' + EVENTO.nombre + ' está confirmado.\n\n' +
    'Fecha: ' + EVENTO.fecha + '\nHora: ' + EVENTO.hora + '\nLugar: ' + EVENTO.lugar + '\n' +
    (r.acompanantes && r.acompanantes.length ? 'Con usted: ' + r.acompanantes.join(', ') + '\n' : '') +
    '\nAgregar al calendario: ' + cal + '\n\nNos vemos el sábado.\nEquipo ELECTI · Unión Estudiantil';
  try {
    MailApp.sendEmail({ to: r.correo, subject: 'Su lugar está confirmado · Inauguración ELECTI', body: texto,
                        htmlBody: html, name: 'ELECTI', replyTo: RESPONDER_A });
    return true;
  } catch (e) {
    return false;
  }
}

// Ejecuta esta función desde el editor (botón ▶) para recibir un correo de prueba en tu propia cuenta.
function probarCorreo() {
  enviarCorreo({ nombre: 'Mateo Reza', correo: Session.getActiveUser().getEmail(), acompanantes: ['Ana Reza'] });
}
