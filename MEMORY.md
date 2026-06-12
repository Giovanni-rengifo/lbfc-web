# MEMORY.md — Decisiones técnicas y estructura

## Stack

- HTML + CSS + JS vanilla, **un solo archivo** `index.html` (Fase 1). Sin frameworks, sin build.
- Mobile-first; breakpoints: 600px (tablet, alineación a 2 columnas), 900px (desktop).
- GitHub Pages — todo estático.
- Google Fonts: **Cinzel** (títulos) + **Lora** (cuerpo).

## Paleta (CSS custom properties en `:root`)

```css
--color-primary:    #1B3A4B  /* Azul petróleo */
--color-secondary:  #8B1A1A  /* Rojo vino */
--color-gold:       #C9A84C  /* Dorado */
--color-black:      #0A0A0A  /* (de marca; ya no es el fondo) */
--color-parchment:  #E8D5A3  /* Pergamino */
--color-text-light: #F0E6CC  /* Texto sobre oscuro */
/* Derivados de superficie (rediseño anti-casino) */
--bg: #0E222E;  --surface: #16303F;  --surface-2: #1C3A4B;
--azul-team: #24506A;  --azul-chip: #4E8CAC;  --rojo-chip: #C45050;
--line: rgba(232,213,163,.14);  --text-dim: rgba(240,230,204,.62);
```

### Dirección visual (decidida tras feedback: "parecía casino/poker")

- **El azul petróleo es la superficie dominante**, no el negro. El fondo es petróleo oscuro tintado, como web de club de fútbol con color de camiseta.
- **El dorado es acento escaso**: nombre del club, borde inferior del header, pestaña activa, badge MVP, #1 del ranking, borde superior del modal. Nunca en glows, sombras ni bordes generalizados.
- **Cero glows/neón/text-shadow** — la heráldica es mate.
- **Sin emojis ni ornamentos** (❖⚜) en títulos; lo medieval vive en el escudo SVG y la tipografía Cinzel.
- **Escudo heráldico SVG inline**: partido per pale (rojo vino | azul #24506A para contrastar con el header), bigote de pergamino, "2009" en dorado.
- **Marcadores estilo deportivo**: "ROJO 2 — 3 AZUL" con nombres de equipo coloreados (--rojo-chip / --azul-chip), no puntos de colores.
- Cinzel solo en: h1, pestañas, títulos de vista, cabeceras de equipo, marcador. Datos y cuerpo en Lora con `tabular-nums`.

## Fuentes de datos

| Sheet | ID | Tablas usadas |
|---|---|---|
| Estadísticas | `19oiiq8kRmh15qqMZSaxOX6DjUFMis28r` | Jugadores, Partidos, Alineaciones, Evento, Sanciones |
| Finanzas | `1ss-bmZpET2mqjDhh-TEQjVy7-lzGAlj1` | solo `Asignacion_Pagos` |

Acceso vía 2 Apps Scripts publicados como Web App pública → fetch JSON. **Solo lectura, siempre.**

### Campos de Asignacion_Pagos

- **Visibles**: `ID_Jugador`, `Nombre_Jugador`, `Fecha_Asignacion`, `Tipo_Asignacion`
- **PRIVADOS — nunca traer ni mostrar**: `Monto`, `Estado`, `Perdonado`

## Estructura de MOCK_DATA (espeja las Sheets)

```js
jugadores:       [{ ID_Jugador, Nombre, Posicion }]
partidos:        [{ ID_Partido, Fecha (ISO), Goles_Rojo, Goles_Azul, MVP (id), Diferenciador (id) }]
alineaciones:    [{ ID_Partido, Rojo: [ids], Azul: [ids] }]   // forma compacta de la maqueta
eventos:         [{ ID_Partido, Goleador (id), Asistente (id|null), Equipo, Tipo_Gol }]
asignacionPagos: [{ ID_Jugador, Nombre_Jugador, Fecha_Asignacion, Tipo_Asignacion }]
```

## Lógica de negocio — flujo del partido

```
Asignacion_Pagos (Finanzas)            Alineaciones (Estadísticas)
Tipo = "Partido"         → Convocado → Jugó el partido → genera estadísticas
Tipo = "Lista de espera" → Reserva
```

- **Convocatoria** = registros con la `Fecha_Asignacion` más reciente. `Tipo_Asignacion` real: **"Convocado"** → convocados, **"Lista de espera"** → reserva, **"Partido"** → ya asignado a alineación (sale de la vista), "Torneo" → se ignora. Si no queda nadie en Convocado/Espera → estado "Convocatoria cerrada" (`.conv-cerrada`) con mensaje "los N convocados ya fueron asignados a su equipo y alineación" + botón "Ver la alineación →" (`irAVista('alineacion')`).
- **Fase 2 — DECISIÓN FINAL (tras descartar la Opción A): archivo manual `datos.xlsx`**. Los originales son **.xlsx conectados a AppSheet**: no se pueden convertir (AppSheet los usa) y Apps Script no puede leer formato Excel → el modo automático es imposible. Flujo: Giovanni copia Estadísticas + pestaña con las 4 columnas públicas de Asignacion_Pagos → `datos.xlsx` en la carpeta de la app → push. La web lo parsea con **SheetJS (CDN)**: `leerDatosXlsx()` (con cache-buster, fechas → yyyy-MM-dd local), `aplicarDatos()` (pestaña tolerante a tildes vía `normalizar()`), `sanearAsignaciones()` como capa final; el resto de hojas queda en `DATOS_ESTADISTICAS` — **pendiente: mapear a las tablas internas** (estructura real ≠ mock: Goles/Asistencias separadas, Alineaciones por fila-jugador). Sin datos.xlsx → mock sin aviso. ⚠ A la carpeta jamás entran los archivos reales (todo se publica). Los `.gs` quedan archivados por si algún día se migra a Sheets nativas (modo en vivo vía `FUENTES`).
- Seguridad de este modo: no hay endpoint público; lo único publicado es un archivo que Giovanni arma y revisa. La regla de las 4 columnas en la pestaña de finanzas es la muralla principal. Pagar (GitHub Pro, Netlify, Firebase) no aporta seguridad relevante; solo un dominio propio tendría sentido a futuro por imagen.
  - UI: cabecera sin título redundante — chip dorado "Convocatoria" + **fecha grande** + "Se juega de 6:00 a 8:00 am" (horario fijo del club). **Buscador de jugador digitable** (autocompletado propio, convocados + espera) que resalta coincidencias y hace scroll, igual que en Alineación.
- **Actualizar datos** = acción crucial: **botón flotante dorado fijo** (abajo-derecha, `.fab-refresh`, siempre visible al hacer scroll) con icono ⟳ + texto "Actualizar"; al terminar muestra toast "Datos actualizados ✓" (~2s). En Fase 2 este botón dispara los fetch.
  - Convocados en **cuadrícula compacta** (`.roster-grid`: 2 columnas en celular, 3 en ≥600px) para que la vista no sea un scroll eterno; lista de espera **visualmente distinta** (`.espera-card`: borde punteado, avatares apagados con contorno, número de turno). El orden de la lista de espera es el orden de llegada en `Asignacion_Pagos`.
- **Tamaños reales**: convocados = 24 (12 por equipo), lista de espera ≤ 10. Se juega fútbol 11 pero entran 24.
- **Partido jugado vs futuro**: un partido sin resultado (`Goles_Rojo`/`Goles_Azul` = null) es el **próximo partido** (la alineación se publica el sábado). `esJugado(p)` es el discriminador. Goleadores, asistencia, perfil e historial cuentan **solo partidos jugados**.
- **Alineación** = por defecto la más reciente (la futura si está publicada; si no, la del último jugado con aviso "aún no se publica"). Cabecera sin título redundante: chip de estado ("Próximo partido" dorado / "Partido jugado") + **fecha grande** para gente distraída. Controles: **selector de fecha** (todas las alineaciones, con marcador) y **buscador de jugador digitable** (autocompletado propio `initAutocomplete()` — el datalist nativo no se estiliza; sugerencias desde `FUENTES_AC[id]`, lista `.ac-list` tematizada bajo el input, flechas/Enter/Escape/click; insensible a acentos/mayúsculas vía `normalizar()`) que resalta las coincidencias en la cancha, atenúa al resto y hace scroll a la primera (`resaltarPorNombre()`, compartido con Convocatoria). Dibujada sobre **cancha de fútbol**:
  - Media cancha vertical por equipo (ataque hacia arriba, arquero abajo). Cancha del Rojo en rojo vino, la del Azul en azul; franjas de césped con `repeating-linear-gradient`, líneas de cal en pergamino translúcido.
  - **Formación 1-4-4-3** (12 jugadores): arquero, 4 defensas, 4 mediocampistas, 3 delanteros.
  - **Regla de relleno** (`lineasEquipo()`): cada jugador va a su línea según `Posicion`; si una línea no se llena, los sobrantes rellenan **de abajo hacia arriba** (arquero → defensa → mediocampista → delantero). Con más de 12, las líneas se amplían también de abajo hacia arriba.
  - MVP = anillo dorado + tag dorado; Diferenciador = tag pergamino ("DIF"). Click en jugador → perfil.
- Marcador convención: **Rojo — Azul** (Goles_Rojo primero).
- **Terminología**: "Asistencia" = presencia en el partido (solo en perfil; la vista Asistencia se eliminó). Los pases gol se llaman **"Asistidores" / "Asist. de gol"** en toda la UI para evitar confusión entre los 2 sistemas.
- **Vista Partidos** (estilo Premier League): tarjeta por partido, todo centrado de arriba a abajo — fecha completa, marcador grande, resultado, **goleadores con minuto** en dos columnas (Rojo derecha-alineado | Azul izquierda, divididas por línea; autogol = "(AG)"), **MVP(s)** al pie con badge dorado. `Partidos.MVP` acepta **id único o lista** (`mvpsDe()` normaliza — partido 4 del mock tiene dos). `Evento.Minuto` = minuto del gol (partido de 2 horas: 1-120). Goleadores y MVPs clickeables → perfil.
- **Vista Estadísticas** (reemplazó a Goleadores): **hub de 4 cards** (Goleadores dorado, Asistidores pergamino, Mejores Defensas azul, Promedio Arqueros rojo; cada card muestra líder + valor). Al tocar una card se abre el **detalle**: flecha "← Estadísticas" para volver, **podio del top 3** (2-1-3) con **medallas Oro/Plata/Bronce**: etiqueta de medalla sobre cada uno, anillo del avatar y pedestal en su color (#C9A84C / #AEB6BD / #A8703D), alturas bien contrastadas (76/40/22px) y "1°/2°/3°" en el pedestal y filas con **barras proporcionales** para los puestos 4-10. En métricas inversas (menor = mejor) la barra del mejor llena más (`barraPct`: min/valor). Métrica defensiva (`statsDefensivas()`): **goles en contra del equipo en que jugó, promediados por partido** (menor = mejor) + vallas invictas como desempate; defensas necesitan mínimo 3 partidos para rankear, arqueros con 1 basta. Estado en `categoriaActiva` (null = hub).
- Equipos Rojo/Azul rotan cada partido; "equipo frecuente" del perfil se calcula contando apariciones.

## Pilares del jugador (núcleo de las estadísticas — el "espíritu" de la app)

Referencia: `Contexto Real.docx` (chat del proyecto AppSheet de Giovanni). **Objetivo estratégico: que la Web calcule todo y AppSheet quede solo como captura de datos.**

### Modelo matemático (decisión firme del club — NO violar)

**Sistema Acumulativo Ponderado**: cada evento real suma puntos de peso fijo.
- ❌ NUNCA porcentajes por partido, ❌ NUNCA normalizar a 100 (ya fracasó: saturación en el tope, no distingue 1 gol de 2, favorece a quien juega poco), ❌ NUNCA promedio como métrica principal (premia muestras pequeñas).
- ✅ Por partido el jugador suma **hasta 10 pts por pilar** = componente **Individual** + componente **Colectivo** (para que el que no anota no quede invisible — el gran problema del modelo anterior eran los defensas del equipo perdedor desmotivados).
- ✅ El valor de temporada es la **SUMA** de los partidos, sin techo: la constancia queda incorporada sola (8 goles en 8 partidos > 2 goles en 1). "Puntos/partido" solo como métrica secundaria.

### Los 4 pilares

1. **Poder Ofensivo (OF)** ✅ implementado — por partido: *Individual* (goles propios × peso por tipo + bonus **gol de la victoria** [el gol que superó el total final del rival: en un 4-3, el 4° del ganador] + bonus hat-trick; tope 7) + *Colectivo* (0.5 por gol del equipo, tope 3; **autogol propio resta 1 aquí**). Config en `OF_CONFIG` — pesos ajustables: Jugada 1.0, Cabeza 1.2, TL 1.3, Penal 0.8, Olímpico 1.5, gol victoria +1, hat-trick +1.
2. **Visión de Juego (VJ)** ⏳ — asistencias × tipo de asistencia + momento; misma estructura Individual + Colectivo. La Sheet real tiene tabla **Asistencias separada** (`Minuto_Asistencia`, `Tipo_Asistencia`).
3. **Poder Defensivo (PD)** ⏳ — arco en cero (campo `CV` yes/no en Alineaciones), goles recibidos, respuesta defensiva.
4. **Fair Play (FP)** ⏳ — asistencia al partido + `Hora_Llegada` (llegar temprano influye en el inicio) − amarillas/rojas/sanciones (tabla Sanciones). Escala 1-10 por partido.

### Mapeo real implementado (Fase 2 completada con LBFC 2026.xlsx)

- `transformarDatosReales()` convierte las hojas reales a las tablas internas; se activa si el xlsx trae `Alineaciones` con `Fecha_Partido` (`esFormatoReal`). El archivo se busca como "LBFC 2026.xlsx" o "datos.xlsx".
- **IDs internos = strings siempre** ("J01"); el mock se normaliza al arrancar (`normalizarIdsMock()`); `byId` se reconstruye con `indexarJugadores()` al cargar datos.
- **ID_Partido interno = fecha ISO** (Partidos real no tiene ID ni marcador): el marcador se **deriva contando Evento** por `Gol_Equipo`; partido "jugado" = fecha ≤ hoy; fechas futuras → Goles null ("Próximo partido").
- MVP (puede ser varios) y Diferenciador salen de Alineaciones (MVP="SI", Diferenciador no vacío). Jugador en cancha si `Asistencia ≠ "No asistió"` y Equipo Rojo/Azul. Filas con ID que no exista en Jugadores se descartan (hay corruptas).
- Posición real "Portero" → canon interno "Arquero" (`POS_CANON`). Tipos de gol reales (Gol, Penal, Cabeza, Tiro libre, Fuera del Área, Autogol, con variantes de mayúsculas) → comparación normalizada (`esAutogol()`, pesos OF por clave normalizada).
- Fechas mixtas en el xlsx: Date, serial Excel (46040) o texto "M/D/YYYY" → `aFechaISO()` cubre los tres.
- ⚠ **Los ID_Jugador de Finanzas y Estadísticas son numeraciones INDEPENDIENTES** (J15 = personas distintas). La Convocatoria muestra `Nombre_Jugador` de la fila de Finanzas y enlaza al perfil **por nombre** (`idPorNombre()`); si el nombre no existe en Estadísticas, la celda no es clickeable. Convocatoria cerrada y lista de espera son independientes (puede haber espera con convocados ya asignados).
- Fecha de convocatoria = **la más cercana ≥ hoy** entre tipos Convocado/Lista de espera/Partido (Torneo se ignora; hay fechas lejanas tipo diciembre).
- **Huecos de datos reales detectados (responsabilidad de la Sheet, no de la web)**: Evento solo tiene goles hasta 2026-04-26 (los partidos de mayo-junio aparecen 0-0); hoja Sanciones vacía; un jugador llamado "GR7"; asignaciones con fecha lunes 2026-07-06.

### Estructura REAL de las Sheets (difiere del mock — mapear en Fase 2)

- `Goles` y `Asistencias` son **tablas separadas** (mock las une en `eventos`).
- `Alineaciones` real es por fila-jugador (cabecera confirmada por captura): `ID_Alineación, Fecha_Partido, ID_Jugador, Nombre_Jugador, Posición_Jugador, Equipo, Hora_Llegada, Asistencia, Motivo_Inasistencia, Tiempo_Cancha, MVP, Diferenciador` (+ `CV` mencionado en el contexto). `Tiempo_Cancha` y `Motivo_Inasistencia` servirán para Fair Play. Ojo: cabeceras con tildes ("ID_Alineación", "Posición_Jugador") — mapear tolerante a tildes.
- ⚠ El archivo original "Estadísticas LBFC 2026" era **.XLSX** (Excel en modo compatibilidad): sin menú Extensiones/Apps Script. Se convirtió con Archivo → Guardar como hoja de cálculo de Google → **ID nuevo**; verificar que AppSheet apunte a la copia nativa y que Finanzas no tenga el mismo problema.
- `Partidos` tiene `Equipo_Ganador` (Text).
- Ojo en Finanzas: inconsistencia de tildes ("Alineacion" vs "Alineación") entre hojas.

UI: sección "Pilares del Caballero" en el perfil — valor = **puntos acumulados**, barra relativa al líder del club (solo visual, no es un techo); pilares pendientes atenuados como "pronto". Config en `PILARES[]`.

## Decisiones clave

1. **Todo se deriva, nada agregado se hardcodea**: goleadores, asistencia y perfil se calculan desde `eventos` + `alineaciones` con `statsJugador(id)`. Garantiza consistencia y es el mismo código que servirá en Fase 2.
2. **Autogoles** (`Tipo_Gol: "Autogol"`) se excluyen del conteo de goles del jugador.
3. Sin fotos en Fase 1 → avatar circular con iniciales (azul petróleo por defecto, rojo vino en equipo Rojo).
4. Perfil de jugador = **modal** (bottom-sheet en móvil, centrado en desktop), no página aparte.
5. Navegación por pestañas sticky con scroll horizontal en móvil.
6. Botón "Actualizar" simula recarga en Fase 1; en Fase 2 disparará los fetch.
7. Empty states en todas las listas (sin convocatoria, sin goles, etc.) — no se rompe con datos vacíos.

## Componentes UI

- `header` — franja de club horizontal: escudo SVG + nombre + "Fundado en 2009 · Domingos 6:00 am", borde inferior dorado.
- `.tab` / `.view` — pestañas con subrayado dorado (estilo web de liga), sticky.
- `.player-row` — fila de jugador clickeable (avatar + nombre + posición + stat opcional).
- `.score-banner` / `.score-line` — marcador del último partido con etiquetas ROJO/AZUL.
- `.team-card` / `.team-head` — tarjeta Rojo/Azul de la alineación, cabecera de color sólido plano.
- `.pitch` / `.pitch-rows` / `.p-line` / `.pitch-player` — cancha de la alineación: líneas de cal (`.pl-outer`, `.pl-circle`, `.pl-box`, `.pl-box-in`) y chips de jugador (avatar + nombre corto + tag MVP/DIF).
- `.match-card` — fila de resultados tipo tabla de liga (grid: fecha | marcador | resultado+MVP).
- `.badge` / `.badge.mvp` — Diferenciador (neutro) y MVP (dorado sólido).
- `.modal` — perfil bottom-sheet en móvil / centrado en desktop, `stat-grid` de 6 cajas.

## Datos mock — nota

Nombres confirmados reales: Alex Diaz, Carlos Rengifo, Jhonattan Tibocha, Jose Oviedo, Giovanni Rengifo. El resto (IDs 6-28) son placeholders a reemplazar. Plantilla mock: 28 jugadores (3 arqueros, 9 defensas, 9 mediocampistas, 7 delanteros); cada partido juegan 24 (12 por equipo) y descansan 4. Partidos quincenales de enero a junio 2026; los goles en `eventos` suman exactamente el marcador de cada partido y los goleadores pertenecen al equipo correcto de su alineación.
