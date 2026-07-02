/**
 * LBFC — Apps Script único (solo lectura), Sheet unificada "LBFC Web App 2027"
 * Reemplaza a apps-script-estadisticas.gs + apps-script-finanzas-congelado.gs:
 * ahora Estadísticas y Finanzas viven en la MISMA Sheet, así que un solo
 * script las sirve a las dos con reglas distintas.
 *
 * Lista blanca de hojas (HOJAS_PUBLICAS): solo estas se publican completas.
 * Cualquier hoja nueva que agregues después (PAGOS, SANCIONES, PARAMETROS,
 * etc.) queda privada por defecto hasta que la agregues a mano aquí abajo
 * — a propósito, para no exponer algo nuevo sin darte cuenta.
 *
 * ASIGNACION_PAGOS es un caso especial: nunca se publica completa, solo
 * los 4 campos públicos (CAMPOS_ASIGNACION_PAGOS). Monto, VIP, Perdonado
 * y Registro_Cancelado NUNCA salen de aquí. Las filas con
 * Registro_Cancelado=TRUE tampoco salen (se tratan como si no existieran).
 *
 * ─── MONTAJE (una sola vez) ───
 * 1. Abrir la Sheet "LBFC Web App 2027" → Extensiones → Apps Script.
 * 2. Pegar este código y guardar.
 * 3. Implementar → Nueva implementación → Aplicación web:
 *      Ejecutar como: Yo · Acceso: Cualquier usuario.
 * 4. Copiar la URL /exec → pegarla en index.html → FUENTES.
 * 5. Probar la URL en el navegador: debe verse el JSON con JUGADORES,
 *    ALINEACIONES, EVENTOS, PARTIDOS completas, y ASIGNACION_PAGOS con
 *    solo 4 campos por fila.
 */

var HOJAS_PUBLICAS = ["JUGADORES", "ALINEACIONES", "EVENTOS", "PARTIDOS"];
var CAMPOS_ASIGNACION_PAGOS = ["id_jugador", "nombre_jugador", "fecha_partido", "tipo_asignacion"];

function doGet() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var resultado = {};

  HOJAS_PUBLICAS.forEach(function (nombre) {
    var hoja = libro.getSheetByName(nombre);
    if (hoja) resultado[nombre] = hojaAObjetos(hoja);
  });

  var hojaAsig = libro.getSheetByName("ASIGNACION_PAGOS");
  if (hojaAsig) resultado.ASIGNACION_PAGOS = asignacionPagosPublica(hojaAsig);

  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

// Convierte una hoja completa en lista de objetos {cabecera: valor}
function hojaAObjetos(hoja) {
  var valores = hoja.getDataRange().getValues();
  if (valores.length < 2) return [];
  var cabecera = valores.shift().map(String);
  return valores
    .filter(function (f) { return f[0] !== "" && f[0] != null; })
    .map(function (f) {
      var obj = {};
      cabecera.forEach(function (campo, i) { obj[campo] = comoValor(f[i]); });
      return obj;
    });
}

// Solo los 4 campos públicos; excluye filas con Registro_Cancelado=TRUE
function asignacionPagosPublica(hoja) {
  var valores = hoja.getDataRange().getValues();
  var cabecera = valores.shift().map(normalizar);
  var indices = CAMPOS_ASIGNACION_PAGOS.map(function (c) { return cabecera.indexOf(c); });
  var idxCancelado = cabecera.indexOf("registro_cancelado");

  return valores
    .filter(function (f) {
      if (f[indices[0]] === "" || f[indices[0]] == null) return false;
      if (idxCancelado !== -1 && f[idxCancelado] === true) return false;
      return true;
    })
    .map(function (f) {
      return {
        ID_Jugador: f[indices[0]],
        Nombre_Jugador: f[indices[1]],
        Fecha_Partido: comoFecha(f[indices[2]]),
        Tipo_Asignacion: String(f[indices[3]] || "")
      };
    });
}

// Tolerante a tildes y mayúsculas ("Fecha_Partido" vs "fecha_partido")
function normalizar(s) {
  return String(s).toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/\s+/g, "_");
}

function comoValor(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "America/Bogota", "yyyy-MM-dd");
  return v;
}

function comoFecha(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "America/Bogota", "yyyy-MM-dd");
  return String(v || "").slice(0, 10);
}
