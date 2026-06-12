/**
 * ════════════════════════════════════════════════════════════════
 *  LBFC — SCRIPT CONGELADO DE FINANZAS · ⛔ NO TOCAR ⛔
 * ════════════════════════════════════════════════════════════════
 * Este script se publica UNA VEZ y no se vuelve a editar JAMÁS.
 * Es el único código que toca el archivo de Finanzas, y devuelve
 * exclusivamente las 4 columnas públicas de Asignacion_Pagos.
 * Monto, Estado y Perdonado NUNCA salen de aquí.
 *
 * Cualquier cambio futuro del sistema se hace en la web o en el
 * script de Estadísticas — NUNCA en este archivo. Si crees que
 * necesitas editarlo, detente: probablemente no.
 *
 * ─── MONTAJE (una sola vez) ───
 * 1. Abrir la Sheet de FINANZAS → Extensiones → Apps Script.
 * 2. Pegar este código y guardar.
 * 3. Implementar → Nueva implementación → Aplicación web:
 *      Ejecutar como: Yo · Acceso: Cualquier usuario.
 * 4. Copiar la URL /exec → pegarla en index.html → FUENTES.finanzas.
 * 5. Probar la URL en el navegador: deben verse SOLO las 4 columnas.
 * 6. No volver a abrir este proyecto nunca más.
 */

var CAMPOS_PUBLICOS = ["id_jugador", "nombre_jugador", "fecha_asignacion", "tipo_asignacion"];

function doGet() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Asignacion_Pagos");
  var valores = hoja.getDataRange().getValues();
  var cabecera = valores.shift().map(normalizar);
  var indices = CAMPOS_PUBLICOS.map(function (c) { return cabecera.indexOf(c); });

  var filas = valores
    .filter(function (f) { return f[indices[0]] !== "" && f[indices[0]] != null; })
    .map(function (f) {
      return {
        ID_Jugador: f[indices[0]],
        Nombre_Jugador: f[indices[1]],
        Fecha_Asignacion: comoFecha(f[indices[2]]),
        Tipo_Asignacion: String(f[indices[3]] || "")
      };
    });

  return ContentService
    .createTextOutput(JSON.stringify(filas))
    .setMimeType(ContentService.MimeType.JSON);
}

// Tolerante a tildes y mayúsculas ("Asignacion" vs "Asignación")
function normalizar(s) {
  return String(s).toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/\s+/g, "_");
}

function comoFecha(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "America/Bogota", "yyyy-MM-dd");
  return String(v || "").slice(0, 10);
}
