# PRODUCT.md — Dashboard Deportivo Los Bigotes F.C.

## Qué es

Página web estática, pública y responsiva que muestra la vida deportiva de **Los Bigotes F.C. (LBFC)**, club amateur fundado en 2009 que juega los domingos de 6:00 a 8:00 am. Hosteada en GitHub Pages, se comparte por link de WhatsApp.

Los equipos internos **Rojo** y **Azul** rotan cada partido — no son equipos fijos. La identidad del club es medieval y épica: caballeros con bigote, honor y camaradería.

## Para quién

- **Jugadores del club** (~18-20 personas): consultan si están convocados, la alineación, sus estadísticas.
- **Administrador** (Giovanni): comparte el link; los datos los mantiene en las Google Sheets, la web solo los refleja.

## Qué hace

1. **Convocatoria** — convocados (Tipo="Convocado") y lista de espera (Tipo="Lista de espera") para la fecha más reciente de `Asignacion_Pagos`. Visible el sábado, antes del partido. Cuando todos pasan a Tipo="Partido" (ya asignados a alineación), la vista muestra "convocatoria cerrada" con enlace a la Alineación.
2. **Alineación** — Equipo Rojo vs Equipo Azul del último partido jugado, con MVP y Diferenciador. Visible post-partido.
3. **Estadísticas** — TOP 10 por categoría: Goleadores, Asistidores (pases gol), Mejores Defensas y Promedio Arqueros.
4. **Perfil de jugador** — modal al hacer click: goles, asist. de gol, partidos, MVPs, Diferenciadores, % asistencia, equipo frecuente. ("Asistencia" siempre significa ir al partido; los pases gol son "Asistidores".)
5. **Partidos** — tarjeta por partido estilo Premier League: fecha, marcador, goleadores con minuto por equipo y MVP(s) — puede haber más de uno.

(La vista "Asistencia" se eliminó; el % de asistencia vive en el perfil del jugador.)

- Carga datos automáticamente al abrir + botón "Actualizar" manual.
- Lee 2 Google Sheets vía Apps Scripts publicados como Web App (JSON).

## Qué NO hace

- **NUNCA escribe en ninguna Sheet** — solo lectura, sin excepciones.
- **NUNCA muestra datos financieros**: los campos `Monto`, `Estado` y `Perdonado` de `Asignacion_Pagos` son privados y no se traen ni se renderizan.
- No tiene login ni cuentas — acceso público por link.
- No usa frameworks ni backend — HTML/CSS/JS vanilla, archivos estáticos.
- No gestiona pagos, cobros ni deudas.

## Estado actual

**Fase 1 completada**: maqueta funcional en un solo `index.html` con datos mock (`MOCK_DATA`) que replican la estructura exacta de las Sheets reales.

**Fase 2 (pendiente)**: reemplazar `MOCK_DATA` por `fetch()` a los 2 Apps Scripts.
