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

1. **SOLO LECTURA**: la página jamás escribe en ninguna Google Sheet. No agregar código que haga POST/PUT ni use APIs de escritura. El Apps Script publicado (`apps-script-lbfc2027.gs`) también es de solo lectura — nunca agregarle una función que modifique la Sheet.
2. **DATOS FINANCIEROS PRIVADOS**: de `ASIGNACION_PAGOS` solo se usan `ID_Jugador`, `Nombre_Jugador`, `Fecha_Partido`, `Tipo_Asignacion`. Los campos `Monto`, `VIP`, `Perdonado` y `Registro_Cancelado` NUNCA se solicitan, almacenan, loguean ni muestran — ni siquiera en datos mock o comentarios. La hoja `PAGOS` (montos, forma de pago, comprobantes) está completamente fuera de alcance: ni se lee ni se cachea.
3. Sin login, sin cookies, sin tracking. Acceso público por link.

## Cómo leer los datos (decisión final: en vivo vía Apps Script)

La Sheet real (`LBFC Web App 2027`) es **nativa de Google**, no un .xlsx conectado a AppSheet — por eso ya no hace falta el flujo manual de antes. La web lee en vivo:

1. `apps-script-lbfc2027.gs` corre como Web App bajo la cuenta de Giovanni (Ejecutar como: Yo · Acceso: Cualquier usuario). Publica completas `JUGADORES`, `ALINEACIONES`, `EVENTOS` y `PARTIDOS` (lista blanca `HOJAS_PUBLICAS` — cualquier hoja nueva queda privada por defecto). `ASIGNACION_PAGOS` sale filtrada a los 4 campos públicos y sin filas `Registro_Cancelado=true`. `PAGOS` nunca se toca.
2. La URL `/exec` del script se pega en `index.html` → constante `FUENTES`.
3. `cargarDatos()` hace `fetch(FUENTES)` y pasa el resultado por `aplicarDatos()`; `sanearAsignaciones()` vuelve a filtrar Asignacion_Pagos como defensa extra aunque el script ya lo haga.

Sin `FUENTES` configurada → datos mock (desarrollo), sin avisos. Si el `fetch` falla → mock + aviso "Sin conexión con la Sheet".

## Lógica de negocio (resumen)

- **Convocatoria**: registros de `ASIGNACION_PAGOS` con la `Fecha_Partido` más reciente. `Tipo_Asignacion="Convocado"` → convocado; `"Lista de espera"` → reserva; `"Partido"` → ya asignado a una alineación (sale de la convocatoria); `"Torneo"` → no aplica. Si no queda nadie en Convocado/Lista de espera, mostrar "los convocados ya fueron asignados a equipo y alineación" con botón a la pestaña Alineación.
- **Alineación**: equipos Rojo/Azul del partido más reciente. Rojo y Azul **rotan cada partido** — no son equipos fijos. `Ubicacion` (Centro/Izquierda/Derecha) ordena a los jugadores dentro de su línea; el texto que se ve en la tarjeta es `Posicion_Jugador` directo.
- Marcador siempre en orden **Rojo — Azul**.
- Autogoles no cuentan como gol del jugador.
- `Se_Presento="No asistió"` → sin estadísticas ni XP de ese partido. Si además `Motivo_Inasistencia="No registra"` → penalización de XP (`XP.sinRegistro`). Cualquier otro motivo registrado → sin penalización, simplemente no genera datos.
- `Tiempo_Cancha="Parcial"` → mitad del XP de "presencia" (jugar/victoria/valla/mvp/diferenciador/capitán/llegada); gol y asistencia no se ven afectados.
- `Razon_Salida="Lesión"` → ícono de cruz sobre el jugador en la cancha (mismo tratamiento visual que el rayo de Diferenciador).

## Cómo probar

Abrir `index.html` directo en el navegador (o `python -m http.server`). Verificar: las 6 pestañas renderizan (Convocatoria, Alineación, Jugadores, Estadísticas, Partidos, Información), el modal de perfil abre/cierra (click, ✕, Escape, click fuera), sin errores de consola, y nada financiero visible en ninguna vista ni en el código.
