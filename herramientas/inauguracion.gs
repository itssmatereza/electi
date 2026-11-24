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
    ? '<tr><td style="padding:11px 0;color:#A47A35;font-size:11px;letter-spacing:3px;vertical-align:top;width:110px">CON USTED</td>' +
      '<td style="padding:11px 0;color:#0E1C4E;font-size:17px">' + r.acompanantes.map(esc).join('<br>') + '</td></tr>'
    : '';
  var fila = function (k, v) {
    return '<tr><td style="padding:11px 0;color:#A47A35;font-size:11px;letter-spacing:3px;width:110px;border-bottom:1px solid #E2D4B6">' + k + '</td>' +
           '<td style="padding:11px 0;color:#0E1C4E;font-size:17px;border-bottom:1px solid #E2D4B6">' + v + '</td></tr>';
  };
  var html =
  '<div style="background:#0F2763;padding:40px 12px;font-family:Georgia,\'Times New Roman\',serif">' +
  '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:0 auto;background:#F5EFE4;border:1px solid #D9C49A">' +
    '<tr><td style="padding:12px"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #C9A86A">' +
    '<tr><td style="padding:34px 34px 6px;text-align:center">' +
      '<img src="' + SITIO + '/assets/inauguracion/sello.png" width="96" height="96" alt="ELECTI" style="display:block;margin:0 auto 14px">' +
      '<div style="font-size:12px;letter-spacing:6px;color:#0E1C4E;font-weight:bold">E L E C T I</div>' +
      '<div style="font-size:34px;font-style:italic;color:#0E1C4E;margin:14px 0 4px;line-height:1.15">Su lugar está confirmado</div>' +
      '<div style="font-size:12px;letter-spacing:4px;color:#A47A35;text-transform:uppercase">Inauguración · Sexta generación</div>' +
      '<div style="margin:22px auto 0;width:160px;border-top:1px solid #C9A86A"></div>' +
    '</td></tr>' +
    '<tr><td style="padding:18px 38px 6px">' +
      '<p style="margin:0 0 14px;font-size:18px;color:#0E1C4E">Hola, ' + esc(nombre) + ':</p>' +
      '<p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#4A4236">Bienvenido a la inauguración de la nueva generación de ELECTI. Su reserva quedó registrada y le esperamos con mucho gusto.</p>' +
      '<p style="margin:0 0 22px;font-size:17px;line-height:1.6;color:#4A4236">ELECTI es la escuela de liderazgo y gestión de proyectos de Unión Estudiantil: un espacio donde, durante 24 semanas, jóvenes de colegio y de los primeros semestres de universidad trabajan su desarrollo personal y, en equipo, planifican, financian y ejecutan un proyecto real. Este sábado empieza la sexta generación, y nos alegra que nos acompañe en ese primer paso.</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:26px">' +
        fila('FECHA', EVENTO.fecha) + fila('HORA', EVENTO.hora) + fila('LUGAR', EVENTO.lugar) + acomp +
      '</table>' +
      '<div style="text-align:center"><a href="' + cal + '" style="display:inline-block;background:#0E1C4E;color:#E3C27E;text-decoration:none;font-family:Georgia,serif;font-size:13px;letter-spacing:3px;text-transform:uppercase;padding:16px 28px">Agregar a mi calendario</a></div>' +
      '<p style="margin:26px 0 0;font-size:15px;line-height:1.6;color:#7A705F;text-align:center;font-style:italic">Le recomendamos llegar 10 minutos antes. Si necesita cambiar su reserva o tiene alguna pregunta, responda a este correo o escríbanos por WhatsApp al 096 289 3857.</p>' +
    '</td></tr>' +
    '<tr><td style="padding:24px 38px 34px;text-align:center">' +
      '<p style="margin:0;font-size:20px;font-style:italic;color:#0E1C4E">Nos vemos el sábado.</p>' +
      '<p style="margin:6px 0 0;font-size:11px;letter-spacing:3px;color:#A47A35;text-transform:uppercase">Equipo ELECTI · Unión Estudiantil</p>' +
    '</td></tr>' +
    '</table></td></tr>' +
  '</table>' +
  '<p style="text-align:center;font-size:12px;color:#8FA0C9;margin:18px 0 0"><a href="' + SITIO + '" style="color:#8FA0C9">electi.unionestudiantil.org</a></p>' +
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
