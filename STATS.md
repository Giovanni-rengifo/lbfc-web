# STATS.md — Sistema de estadísticas LBFC 2026

> Referencia completa de fórmulas, pesos y reglas. Cambiar un valor aquí no actualiza el código —
> los valores reales están en `index.html` en las constantes indicadas por sección.

---

## 1. Fuentes de datos

| Hoja (Sheet "LBFC Web App 2027") | Qué aporta |
|---|---|
| `JUGADORES` | ID, nombre, posición (Arquero / Defensa / Mediocampista / Delantero) |
| `PARTIDOS` | Solo fechas — el marcador (Goles_Rojo/Goles_Azul) y el MVP se derivan de `EVENTOS`/`ALINEACIONES` |
| `ALINEACIONES` | Quién jugó, en qué equipo (Rojo/Azul), `Diferenciador`/`MVP`/`Capitan` (booleanos), `Se_Presento`+`Pendiente`+`Hora_Llegada` (fuente de Fair Play), `Motivo_Inasistencia`, `Tiempo_Cancha`, `Razon_Salida` |
| `EVENTOS` | Cada gol: quién marcó, quién asistió, tipo de gol, tipo de pase, minuto, equipo |

Solo cuentan los partidos con `Goles_Rojo` y `Goles_Azul` registrados ("partidos jugados").

> **Nota:** las columnas `PO`, `VJ`, `PD` del Excel ya **no se usan**. El sistema dejó de
> depender de calificaciones subjetivas (ver sección 4).

---

## 2. Estadísticas simples

Se derivan directamente de `Eventos` y `Alineaciones`. No tienen pesos.

| Stat | Definición |
|---|---|
| Goles | Eventos donde `Goleador == jugador` y no es autogol |
| Asistencias (pases gol) | Eventos donde `Asistente == jugador` |
| Partidos jugados | Alineaciones del jugador en partidos jugados |
| Ganados / Perdidos | Del total de partidos jugados |
| MVP | Veces marcado como MVP en `Partidos` |
| Diferenciador | Veces marcado en columna `Diferenciador` |
| Vallas invictas | Partidos jugados en que su equipo no recibió goles |

---

## 3. Gesto Técnico

Dos rankings independientes: **Técnica Goleadora** (goles) y **Técnica de Pase Gol** (asistencias).
La "puntuación" es la **suma** de pesos de todos los gestos de la temporada.

### 3a. Técnica Goleadora

Constante en código: `PESOS_TIPO_GOL`

| Tipo de gol (en Excel) | Peso | Etiqueta mostrada |
|---|---|---|
| Jugada | 1 | Goles |
| Gol *(sin tipo)* | 1 | Goles |
| Penal | 1 | Penal |
| Cabeza | 1.5 | Cabeza |
| Tiro libre | 2 | Tiro libre |
| Fuera del área | 2 | Fuera del área |
| Olímpico | 2 | Olímpico |
| Chilena | 3 | Chilena |
| Autogol | −1 | *(no aparece en el ranking)* |

### 3b. Técnica de Pase Gol

Constante en código: `PESOS_TIPO_PASE`

| Tipo de pase (en Excel) | Peso | Etiqueta mostrada |
|---|---|---|
| Normal / Asistencia | 1 | Pases Gol |
| Tiro libre | 2 | Tiro libre |
| Esquina / Tiro de esquina | 2 | Esquina |
| Portería | 3 | Portería |

La leyenda de cada jugador se muestra como `Etiqueta (cantidad)`, separadas por coma.
Ej: `Goles (14), Cabeza (3), Fuera del área (1)`.

---

## 4. Salón de Leyendas

> **Decisión de junio 2026.** Se eliminaron los pilares subjetivos PO / VJ / PD. Reemplazaban
> calidad por opinión, generaban rankings injustos y eran un riesgo político para el club.
> En su lugar: un sistema **100% automático** que reconoce el aporte de **todos**, no solo
> de goleadores y asistidores.

El sistema tiene cuatro partes: **Nivel de Leyenda** (XP), **Distinciones** (medallas), **Emblemas** (logros permanentes) y **Puntos Temporada**. Más el **Fair Play** que ya existía.

### 4a. Nivel de Leyenda (XP)

Constante en código: `XP`

XP que **solo sube**. Se suma en cada partido jugado. Nunca baja — no hay castigo.
Premia presentarse, ganar y aportar; los goles ayudan pero no lo son todo.

| Acción (por partido) | XP |
|---|---|
| Jugar (presentarse) | +5 |
| Victoria del equipo | +10 |
| Gol (no autogol) | +5 c/u |
| Asistencia (pase gol) | +5 c/u |
| Valla invicta (su equipo no recibió goles) | +10 |
| MVP del partido | +6 |
| Diferenciador (mejor de su posición) | +3 (victoria/empate) · +2 (derrota, redondeado) |
| Capitán del equipo | +5 (gana) · +2 (empata) · +1 (pierde) |
| Llegó temprano | +3 |
| Llegó a tiempo | +2 |
| No asistió sin registrar motivo (`Motivo_Inasistencia="No registra"`) | −5 |

**Nivel** = `floor(XP / 20) + 1` (constante `XP_POR_NIVEL = 20`).
La barra de progreso muestra el avance dentro del nivel actual.

**Tiempo_Cancha = "Parcial":** se suma todo lo de la tabla de arriba (jugar, victoria, valla, MVP, diferenciador, capitán, llegada) y el total se **divide entre 2** (redondeado). Gol y asistencia nunca se ven afectados por esto — se suman completos aparte.

### 4b. Distinciones (medallas)

Constante en código: `DISTINCIONES`

Cada distinción premia un **tipo de aporte distinto**. Solo UN jugador la ostenta a la vez
(quien lidera la métrica). Chips dorados en el perfil.

| Distinción | Métrica | Quién compite |
|---|---|---|
| El Conquistador | Más victorias en la temporada | Todos |
| El Artillero | Más goles | Todos |
| El Estratega | Más pases gol | Todos |
| El Decisivo | Más Goles Victoria (gol que asegura el triunfo) | Todos |
| El Capitán | Más veces nombrado capitán | Todos |
| El Completo | Más partidos con gol + asistencia en el mismo juego | Todos |
| El Muro | Más veces elegido Diferenciador · mínimo 3 partidos | Solo Arquero / Defensa |
| El Maestro | Más veces elegido Diferenciador · mínimo 3 partidos | Solo Mediocampista |
| El Cazador | Más veces elegido Diferenciador · mínimo 3 partidos | Solo Delantero |
| El Puntual | Mejor % de puntualidad (Fair Play) · mínimo 40% de partidos jugados | Todos |
| El Líder | Más veces MVP | Todos |

> **Eliminadas**: El Inquebrantable (partidos jugados) y El Omnipresente (racha consecutiva)
> siempre serían de Giovanni como presidente — sin competencia real.

> **Diferenciador**: por cada partido se elige 1 jugador por grupo de posición (Arq/Def, Med, Del).
> Columna `Diferenciador` (VERDADERO/FALSO) en `Alineaciones`. 3 registros TRUE por partido.

### 4c. Emblemas (logros permanentes)

Constante en código: `EMBLEMAS`

Se **conquistan para siempre**. Múltiples jugadores pueden tenerlos simultáneamente.
Chips azules-plata en el perfil, visibles también en la tarjeta de Jugadores.

| Emblema | Condición | Notas |
|---|---|---|
| Hat-trick | 3 o más goles en un mismo partido | Permanente al lograrlo |
| Doblete | 2 goles en un mismo partido | Hat-trick incluye Doblete automáticamente |
| Asistidor Épico | 2 o más asistencias en un mismo partido | |
| Centella | Gol más rápido de la temporada | Puede cambiar si alguien supera el minuto |
| Nocturno | Gol más tardío de la temporada | Puede cambiar si alguien supera el minuto |
| Inmortal | Jugó **todos** los partidos de la temporada sin faltar uno | |

### 4d. Puntos Temporada

Constante en código: `puntosTemporada()`

| Resultado | Puntos |
|---|---|
| Victoria | 3 |
| Empate | 1 |
| Derrota | 0 |

Temporada = SUMA. Ranking propio en Estadísticas y línea en el perfil.

### 4e. Fair Play

Constante en código: `FP_PESOS`

Promedio (no suma) de los puntajes de llegada, expresado como porcentaje.

| Hora de llegada | Puntos |
|---|---|
| Temprano | 100 |
| A tiempo | 85 |
| Tarde | 75 |
| No asistió / Sancionado | 0 |

Temporada = PROMEDIO. Aparece en el perfil y alimenta la distinción "El Puntual".

---

## 5. Resumen de constantes modificables

```js
// Nivel de Leyenda (XP por acción en cada partido)
XP = { jugar: 5, victoria: 10, gol: 5, asistencia: 5,
       valla: 10, mvp: 6, diferenciador: 3, capitan: 5,
       temprano: 3, tiempo: 2, sinRegistro: -5 }
XP_POR_NIVEL = 20

// Puntos Temporada
Victoria = 3 · Empate = 1 · Derrota = 0

// Pesos de tipos de gol (Técnica Goleadora)
PESOS_TIPO_GOL = {
  jugada: 1, gol: 1, penal: 1,
  cabeza: 1.5,
  "tiro libre": 2, "fuera del area": 2, olimpico: 2,
  chilena: 3,
  autogol: -1
}

// Pesos de tipos de pase (Técnica de Pase Gol)
PESOS_TIPO_PASE = {
  normal: 1, asistencia: 1,
  "tiro libre": 2, esquina: 2, "tiro de esquina": 2,
  porteria: 3
}

// Fair Play
FP_PESOS = { Temprano: 100, Tiempo: 85, Tarde: 75, No: 0, Sancionado: 0 }
```

---

## 6. Reglas de borde

- **Autogol:** no cuenta como gol del jugador en ningún ranking ni suma XP.
- **Valla invicta:** la reciben **todos** los jugadores del equipo que no recibió goles (es colectiva), no solo defensas. La distinción "El Muro" sí se limita a Arquero/Defensa.
- **El Nivel solo sube:** perder un partido no resta XP; simplemente no suma victoria. Es por diseño — el objetivo es que nadie sienta retroceso.
- **No jugó:** si el jugador no aparece en la alineación de un partido, no recibe XP ni stats de ese partido.
- **Distinción sin datos:** si nadie tiene la métrica > 0, esa medalla no se muestra.
- **Nombre del jugador:** los rankings muestran el nombre tal cual está en la hoja `Jugadores`. "GR7" es el alias de Giovanni Rengifo en el Excel (intencional).
- **Emblemas permanentes:** Hat-trick, Doblete, Asistidor Épico se conquistan para siempre una vez logrados en la temporada.
- **Emblemas que pueden cambiar:** Centella y Nocturno los ostenta quien tenga el menor/mayor minuto de gol registrado — cambian si alguien supera ese récord. Inmortal desaparece si el jugador falta a algún partido futuro.
- **Diferenciador en Alineaciones:** 3 valores VERDADERO por partido (uno por grupo: Arq/Def, Med, Del). El jugador con VERDADERO recibe +3 XP si su equipo no perdió, +2 si perdió (redondeado).
- **No asistió con motivo justificado:** `Se_Presento="No asistió"` con cualquier `Motivo_Inasistencia` distinto de "N/A" y "No registra" → no genera XP ni stats de ese partido, pero tampoco penaliza.
- **No asistió sin justificar:** `Motivo_Inasistencia="No registra"` → penalización fija de −5 XP (no depende de si su equipo ganó o perdió).
- **Tiempo_Cancha="Parcial":** el jugador sí cuenta como presente, pero todo el XP de "presencia" de ese partido (jugar/victoria/valla/MVP/diferenciador/capitán/llegada) se divide entre 2. Gol y asistencia quedan intactos.
- **Razon_Salida="Lesión":** solo visual — ícono de cruz sobre el jugador en la vista Alineación, mismo tratamiento que el rayo de Diferenciador. No afecta XP ni stats.
