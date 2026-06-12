/**
 * LBFC — Apps Script de ESTADÍSTICAS (solo lectura)
 * Devuelve TODAS las hojas del archivo como JSON: {NombreHoja: [filas]}.
 * Aquí no hay nada sensible, así que se publica todo — la web toma lo
 * que necesita. Esto evita fallas silenciosas por nombres de hoja que
 * no coinciden (tildes, plurales, etc.).
 *
 * Si algún día creas una pestaña con datos privados (teléfonos, notas),
 * agrega su nombre a HOJAS_EXCLUIDAS y nunca se publicará.
 *
 * ─── MONTAJE (una sola vez) ───
 * 1. Abrir la Sheet de ESTADÍSTICAS → Extensiones → Apps Script.
 * 2. Pegar este código y guardar.
 * 3. Implementar → Nueva implementación → Aplicación web:
 *      Ejecutar como: Yo · Acceso: Cualquier usuario.
 * 4. Copiar la URL /exec → pegarla en index.html → FUENTES.estadisticas.
 * 5. Probar la URL en el navegador: debe verse el JSON con todas las hojas.
 */

// Hojas que NUNCA se publican (agregar aquí cualquier pestaña privada)
var HOJAS_EXCLUIDAS = [];

function doGet() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var resultado = {};

  libro.getSheets().forEach(function (hoja) {
    var nombre = hoja.getName();
    if (HOJAS_EXCLUIDAS.indexOf(nombre) !== -1) return;
    resultado[nombre] = hojaAObjetos(hoja);
  });

  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

// Convierte una hoja en lista de objetos {cabecera: valor}
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

function comoValor(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "America/Bogota", "yyyy-MM-dd");
  return v;
}
