# STATS.md — Sistema de estadísticas LBFC 2026

> Referencia completa de fórmulas, pesos y reglas. Cambiar un valor aquí no actualiza el código —
> los valores reales están en `index.html` en las constantes indicadas por sección.

---

## 1. Fuentes de datos

| Tabla Excel | Qué aporta |
|---|---|
| `Jugadores` | ID, nombre, posición (Arquero / Defensa / Mediocampista / Delantero) |
| `Partidos` | ID, fecha, Goles_Rojo, Goles_Azul, Diferenciador, MVP |
| `Alineaciones` | Quién jugó en cada partido, en qué equipo (Rojo/Azul) |
| `Eventos` | Cada gol: quién marcó, quién asistió, tipo de gol, tipo de pase, minuto, equipo |
| `Asistencia` | Hora de llegada al partido (fuente de Fair Play y puntualidad) |

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

El sistema tiene tres partes: **Nivel de Leyenda** (XP), **Distinciones** (medallas) y
**Puntos Temporada**. Más el **Fair Play** que ya existía.

### 4a. Nivel de Leyenda (XP)

Constante en código: `XP`

XP que **solo sube**. Se suma en cada partido jugado. Nunca baja — no hay castigo.
Premia presentarse, ganar y aportar; los goles ayudan pero no lo son todo.

| Acción (por partido) | XP |
|---|---|
| Jugar (presentarse) | +10 |
| Victoria del equipo | +5 |
| Gol (no autogol) | +8 c/u |
| Asistencia (pase gol) | +6 c/u |
| Valla invicta (su equipo no recibió goles) | +4 |
| MVP del partido | +10 |
| Diferenciador (mejor de su posición) | +6 (victoria/empate) · +3 (derrota) |
| Llegó temprano | +3 |
| Llegó a tiempo | +2 |

**Nivel** = `floor(XP / 20) + 1` (constante `XP_POR_NIVEL = 20`).
La barra de progreso muestra el avance dentro del nivel actual.

### 4b. Distinciones (medallas)

Constante en código: `DISTINCIONES`

Cada distinción premia un **tipo de aporte distinto**, para que el reconocimiento rote
y casi nadie quede invisible. Todas se calculan solas: la ostenta quien lidera esa métrica.

| Distinción | Métrica | Quién compite |
|---|---|---|
| El Inquebrantable | Más partidos jugados | Todos |
| El Conquistador | Más victorias en la temporada | Todos |
| El Artillero | Más goles | Todos |
| El Estratega | Más pases gol | Todos |
| El Muro | Más veces elegido Diferenciador · mínimo 3 partidos | Solo Arquero / Defensa |
| El Maestro | Más veces elegido Diferenciador · mínimo 3 partidos | Solo Mediocampista |
| El Cazador | Más veces elegido Diferenciador · mínimo 3 partidos | Solo Delantero |
| El Puntual | Mejor % de puntualidad (Fair Play) · mínimo 40% de partidos jugados | Todos |
| El Líder | Más veces MVP | Todos |

> **Diferenciador**: por cada partido se elige 1 jugador por grupo de posición (Arq/Def, Med, Del)
> que fue el mejor de su posición. Columna `Diferenciador` (VERDADERO/FALSO) en la hoja
> `Alineaciones` del Excel. 3 registros TRUE por partido (uno por grupo).

En el perfil de cada jugador se muestran como chips dorados las distinciones que ostenta.

### 4c. Puntos Temporada

Constante en código: `puntosTemporada()`

| Resultado | Puntos |
|---|---|
| Victoria | 3 |
| Empate | 1 |
| Derrota | 0 |

Temporada = SUMA. Ranking propio en Estadísticas y línea en el perfil.

### 4d. Fair Play

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
XP = { jugar: 10, victoria: 5, gol: 8, asistencia: 6,
       valla: 4, mvp: 10, temprano: 3, tiempo: 2 }
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
