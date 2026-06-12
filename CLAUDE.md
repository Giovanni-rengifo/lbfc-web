# CLAUDE.md — Dashboard Los Bigotes F.C.

Dashboard deportivo estático de Los Bigotes F.C. (club amateur, fundado 2009, domingos 6-8am). Estética medieval/épica. Ver `PRODUCT.md` (qué es) y `MEMORY.md` (decisiones y estructura de datos).

## Stack y convenciones

- **HTML + CSS + JS vanilla únicamente.** Sin frameworks, sin npm, sin build. Compatible con GitHub Pages.
- Fase 1: todo vive en `index.html` (CSS y JS embebidos, datos en `MOCK_DATA`).
- Mobile-first. Breakpoints existentes: 600px y 900px.
- Tipografía: Cinzel (títulos, `--font-title`) + Lora (cuerpo, `--font-body`).
- Colores SIEMPRE vía las CSS variables de `:root` — no hardcodear hex en reglas nuevas.
- Idioma de la UI y del código visible: **español**.
- Estadísticas agregadas se **derivan** de los datos crudos (`statsJugador()`), nunca se hardcodean.

## Reglas absolutas

1. **SOLO LECTURA**: la página jamás escribe en ninguna Google Sheet. No agregar código que haga POST/PUT ni use APIs de escritura.
2. **DATOS FINANCIEROS PRIVADOS**: de `Asignacion_Pagos` solo se usan `ID_Jugador`, `Nombre_Jugador`, `Fecha_Asignacion`, `Tipo_Asignacion`. Los campos `Monto`, `Estado` y `Perdonado` NUNCA se solicitan, almacenan, loguean ni muestran — ni siquiera en datos mock o comentarios.
3. Sin login, sin cookies, sin tracking. Acceso público por link.

## Cómo leer los datos (Fase 2 — decisión final: archivo manual `datos.xlsx`)

Los archivos reales son **.xlsx conectados a AppSheet**: no se pueden convertir a Sheets nativas ni leerse con Apps Script (`SpreadsheetApp` no abre formato Excel). Por eso el modo automático no existe y el flujo es manual:

1. Giovanni crea una copia de Estadísticas y le agrega una pestaña con **solo las 4 columnas públicas** de `Asignacion_Pagos` (jamás Monto/Estado/Perdonado).
2. La guarda como **`datos.xlsx` en la carpeta de la app** y sube el cambio (GitHub Pages lo publica).
3. La web lo lee en el navegador con **SheetJS** (CDN en el `<head>`): `leerDatosXlsx()` lo convierte a `{NombreHoja: [filas]}` (fechas → `yyyy-MM-dd`), `aplicarDatos()` lo vuelca (pestaña de asignaciones tolerante a tildes) y `sanearAsignaciones()` filtra campos.

Sin `datos.xlsx` → datos mock (desarrollo). ⚠ **A la carpeta de la app jamás entran los archivos reales** — todo lo que esté ahí se publica. Los `apps-script-*.gs` quedan solo por si algún día se migra a Sheets nativas (modo en vivo vía `FUENTES`).

## Lógica de negocio (resumen)

- **Convocatoria** (única vista que usa la Sheet de Finanzas): registros de `Asignacion_Pagos` con la `Fecha_Asignacion` más reciente. `Tipo_Asignacion="Convocado"` → convocado; `"Lista de espera"` → reserva; `"Partido"` → ya asignado a una alineación (sale de la convocatoria); `"Torneo"` → no aplica. Si no queda nadie en Convocado/Lista de espera, mostrar "los convocados ya fueron asignados a equipo y alineación" con botón a la pestaña Alineación.
- **Alineación**: equipos Rojo/Azul del partido más reciente. Rojo y Azul **rotan cada partido** — no son equipos fijos.
- Marcador siempre en orden **Rojo — Azul**.
- Autogoles no cuentan como gol del jugador.

## Cómo probar

Abrir `index.html` directo en el navegador (o `python -m http.server`). Verificar: las 4 pestañas renderizan (Convocatoria, Alineación, Estadísticas, Partidos), el modal de perfil abre/cierra (click, ✕, Escape, click fuera), sin errores de consola, y nada financiero visible en ninguna vista ni en el código.
