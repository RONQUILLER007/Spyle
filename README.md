# SPYLE // PROTOCOLO DE CONTRAINTELIGENCIA 🗂️

**Spyle** es un juego diario de palabras, agilidad mental y calibración cultural ejecutado íntegramente en el navegador web (arquitectura *offline-first* sin dependencias de backend de pago). Está ambientado en una terminal táctica de escucha e interrogatorio de la Guerra Fría, con una dirección de arte fría, oscura y burocrática inspirada estéticamente en *Final Sentence*.

La premisa operativa sitúa al jugador como instructor de inteligencia formando y evaluando a agentes durmientes antes de su despliegue en territorio hispanohablante. El objetivo no es acertar lo primero que viene a la mente, sino calibrar la profundidad y autenticidad del término: las opciones turísticas o evidentes apenas otorgan puntuación, los clichés pretenciosos delatan la tapadera, y solo el conocimiento de nicho, la jerga callejera y los registros locales profundos permiten infiltrar al agente con la máxima calificación.

---

## 🕹️ Mecánicas de Juego y Dinámica Operativa

- **Estructura de Misión:** 7 expedientes (prompts) consecutivos por inmersión, generados mediante rotación estratificada multi-temática para garantizar variedad entre categorías en cada jornada.
- **Reloj de Interrogatorio:** 25 segundos por expediente.
- **Intentos Múltiples en Tiempo Real:** Si un término no está catalogado, el reloj continúa corriendo. El jugador puede seguir probando términos alternativos hasta que el tiempo expire o acierte uno válido.
- **Visor de Intentos Fallidos y Reclamación en Vivo:** Los términos no reconocidos se listan en tiempo real debajo del campo de texto (`[✕ término]`) para evitar repeticiones en esa misma ronda, permitiendo remitir sugerencias a contrainteligencia tanto al instante como en el informe final.
- **Cláusula de Disparo Limpio / Penalización de Multiplicadores:**
  - **Speed Bonus (+20%):** Se otorga si se introduce una respuesta válida en los primeros 6 segundos de la ronda.
  - **Anulación Inmediata:** Si el primer intento en una ronda resulta fallido o no catalogado, la bonificación de velocidad queda **anulada irreversiblemente** para esa ronda.
  - **Comodín Operativo Quemado:** Si el jugador había armado el comodín (*Wildcard*) y falla el primer intento, el comodín se consume y se quema de inmediato por fallo de infiltración. Cualquier acierto posterior puntuará exclusivamente a valor base ($1.0\times$).
- **Comodín Operativo (Wildcard):** 1 uso por misión (disponible en Modo Diario y Dossieres de Campo; deshabilitado en Modo Ilimitado). Permite intentar duplicar la puntuación si se alcanza el rango de Infiltración Profunda ($\ge 65\text{ pts}$).

### Escala de Evaluación y Sellos Tácticos Unificados

El sistema utiliza una función canónica compartida de iconos tanto en las tarjetas del calendario como en los expedientes detallados:

- ⬛ **0 pts** · Delatado / Misión Fallida (Término no catalogado o tiempo agotado).
- 📰 **10 pts** · Registro Turístico (Respuesta evidente y masiva que cualquier forastero sabría).
- 🎭 **25 pts** · Tapadera Chapucera / Gesto Delatador (*Too Clever*: el cliché rebuscado que levanta sospechas).
- 🗂️ **45 pts** · Conocimiento de Campo (Creíble, fluido y natural en conversación habitual).
- 🕵️ **65 pts** · Infiltración Profunda (Nivel de residente veterano).
- 🗝️ **85 pts** · Alto Secreto / Archivo Reservado (Microcultura, marcas o datos de archivo).
- 🎖️ **100 pts** · Agente Durmiente Perfecto (Nicho extremo / 1 en un billón).
- 🔑 **Easter Egg** · Clave Oculta de Desclasificación (Término secreto del día que desbloquea el Archivo Histórico).

---

## 🛠️ Modos de Juego y Navegación

1. **Expediente Diario (días fijos blindados + consolidación y generador infinito determinista sobre 7 dossiers):**
   - `DAILY_MISSIONS` conserva blindadas e inmutables todas las jornadas históricas (`dia1` a `dia31`) y las jornadas ya materializadas (`dia32` a `dia60`), ofreciendo **7 retos temáticos cada 24 horas idénticos para todos los jugadores**.
   - Para cualquier jornada nueva (y en la consolidación con `python -B spyle_tool.py consolidar-dias --hasta dia60`), un **generador determinista compartido entre `app.js` y `spyle_tool.py` (`mulberry32` con semilla fija del día `seed = (d * 2654435761) >>> 0`)** selecciona **1 categoría activa ($\ge 400$ palabras) de cada uno de los 7 dossiers activos** (`pel-`, `dep-`, `geo-`, `mus-`, `pal-`, `gen-`, `vid-` = **7 categorías exactas**), excluyendo las categorías aparecidas en los **últimos 14 días (`N-1` a `N-14`)** (con ventana adaptativa en dossiers de menor tamaño) y sin clonar ningún día previo ni depender de `Math.random()` o `localStorage`.
   - Tanto los días guardados en `DAILY_MISSIONS` como los generados determinísticamente en vivo guardan progreso, puntuación y estado de reclamaciones en `localStorage`.
2. **Entrenamiento Ilimitado:** Rondas infinitas no repetitivas seleccionadas aleatoriamente entre las **220 categorías activas** ($\ge 400$ palabras únicas), con comodín deshabilitado para entrenamiento puro.
3. **Dossieres de Campo Temáticos (220 categorías · 93.816 palabras calibradas):** Expedientes clasificados agrupados en **7 áreas** del conocimiento (100 % activas con **mínimo 405**, **media 426,44** y **máximo 810** palabras por categoría):
   - *General y Miscelánea* (`gen-`): 40 categorías (`gen-001` a `gen-040`)
   - *Palabras y Lenguaje* (`pal-`): 32 categorías (`pal-001` a `pal-032`)
   - *Películas y Cine* (`pel-`): 32 categorías (`pel-001` a `pel-032`)
   - *Deportes y Competición* (`dep-`): 32 categorías (`dep-001` a `dep-032`)
   - *Geografía y Territorio* (`geo-`): 32 categorías (`geo-001` a `geo-032`)
   - *Música y Acústica* (`mus-`): 32 categorías (`mus-001` a `mus-032`)
   - *Videojuegos* (`vid-`): 20 categorías (`vid-01` a `vid-20`)
4. **Archivo Histórico de Misiones:** Registro cronológico desbloqueable mediante Easter Egg diario. Permite inspeccionar expedientes completados (`[ VER EXPEDIENTE ]`) o infiltrarse en misiones anteriores no jugadas (`[ INFILTRARSE ]`).
5. **Protocolo de Despliegue Operativo:** Ventana de confirmación táctica previa a cualquier partida con el resumen de reglas y advertencias antes de iniciar el cronómetro.
6. **Briefing Inicial:** Al acceder por primera vez a la terminal, se despliega automáticamente la *Directiva de Operaciones // Briefing*. Puede reabrirse en cualquier momento mediante el botón `[ ? ]` de la cabecera.

---

## 🎖️ Cámara de Archivos Clasificados (Logros Operativos)

Sistema integrado de condecoraciones persistentes en `localStorage` con notificaciones tácticas en pantalla (*toasts*), **auditoría retroactiva sobre todo el calendario histórico** y **contadores de repetición** (`[ x2 ]`, `[ x3 ]`...) cuando una hazaña o Easter Egg se revalida en distintas jornadas:

1. **Doble Agente Durmiente (`OP-01`):** Clava dos respuestas de 100 puntos base en una misma misión.
2. **Informe Sobresaliente (`OP-02`):** Obtén 500 o más puntos en una sola misión.
3. **Operativo Impecable (`OP-03`):** Logra un pleno perfecto de 700 puntos base en las 7 rondas.
4. **Gatillo Rápido (`OP-04`):** Responde de forma válida en menos de $2,0\text{ segundos}$ en cualquier ronda.
5. **Carrera de Espías (`OP-05`):** Consigue la bonificación de velocidad (+20%) en las 7 rondas de una misión.
6. **Sin Rastro (`OP-06`):** Completa una misión de 7 rondas con un 100 % de efectividad al primer intento (0 fallos y ninguna ronda agotada).
7. **Extracción In Extremis (`OP-07`):** Acierta una palabra válida quedando menos de $1,0\text{ segundo}$ en el temporizador.
8. **Infiltración Duplicada (`OP-08`):** Activa el comodín y duplica con éxito una puntuación de $\ge 65\text{ pts}$.
9. **Red Durmiente (`OP-09`):** Acumula un mínimo de 2.000 puntos históricos totales en el expediente.
10. **Desclasificación Total (`OP-10`):** Descubre el Easter Egg diario y obtén acceso permanente al Archivo Histórico de Misiones.

---

## 🖥️ Experiencia de Usuario (UX), Visualización Táctica y Ergonomía Móvil

- **Animaciones progresivas en `#depth-gauge` (`10` → `100` pts):**
  - La función `animarSubidaPuntuacion` en `Spyle/app.js` clasifica cada acierto dentro de la escala de 6 tramos (`10`, `25`, `45`, `65`, `85`, `100`) en cuatro intensidades visuales (`tier-low` para `10–25`, `tier-mid` para `45–65`, `tier-high` para `85` y `tier-100` para `100` pts).
  - Ajusta progresivamente duración y curva de transición (`--gauge-dur`, `--gauge-ease`), destellos en `.gauge-track` (`gaugeFlashMid`, `gaugeFlashHigh`, `gaugeFlash100`), pulso numérico en `#score-label` (`scoreBump*`) y etiqueta flotante `#gauge-gain`.
  - Al clavar **100 pts** (`tier-100`), dispara sacudida breve (`gaugeShake`), resplandor dorado, **estela luminosa ascendente** (`#depthfill::after` con `gaugeTrail`) y el rótulo destacado **`★ +<pts> · AGENTE DURMIENTE`**. Respeta la preferencia del sistema `@media (prefers-reduced-motion: reduce)`.
- **Encuadre dinámico para teclado virtual (`visualViewport` + `--keyboard-offset`):**
  - En móviles y tablets, `ajustarEncuadreTeclado` calcula la altura ocupada por el teclado virtual a partir de `window.visualViewport`, actualiza en `:root` la variable CSS `--keyboard-offset` y alterna `body.keyboard-open` sobre `#screen-game`.
  - Desplaza suavemente la ventana cuando hace falta para mantener siempre visibles la tarjeta del expediente (`.prompt-container`) y el formulario de respuesta (`#answer-form`), además de configurar `#answer-input` con `enterkeyhint="send"`, `autocapitalize="off"`, `autocorrect="off"` y `font-size: 16px` bajo `@media (pointer: coarse)` para evitar el zoom automático en iOS.

---

## 🔍 Auditor de Densidad, Métricas del Banco y Escala de 4 Niveles ($\ge 400$)

El umbral mínimo oficial para habilitar una categoría en juego es **`MIN_PALABRAS_CATEGORIA = 400`** (`MIN_ACTIVE_WORDS = 400` en `spyle_tool.py`), evaluado en el panel de desarrollador (`Alt + D` o `?dev=1`) según la escala de 4 niveles:

- **Estado actual verificado del banco (`220/220` categorías activas):**
  - **Mínimo por categoría:** `405` palabras únicas (`0` categorías por debajo de `400`)
  - **Media global:** `426,44` palabras por categoría
  - **Máximo por categoría:** `810` palabras únicas
  - **Total acumulado en `PROMPTS`:** `93.816` respuestas calibradas en español/inglés
  - **Integridad estructural y DOM:** `0` IDs duplicados, `0` referencias huérfanas en `60/60` días guardados (`dia1`–`dia60`), `0` días consecutivos repetidos o clonados, reparto `1×7` dossiers verificado y **`115/115` IDs DOM** verificados entre `app.js` e `index.html`.

- 🟢 **Completo / Activo ($\ge 400$ palabras):** Habilitada en Modo Ilimitado, Dossieres, Expediente Diario y Archivo Histórico.
- 🟡 **Intermedio ($130\text{--}399$ palabras):** Categoría avanzada en desarrollo (bloqueada en juego).
- 🔴 **Baja ($50\text{--}129$ palabras):** Base inicial insuficiente (bloqueada en juego).
- ⚪ **Crítica / Vacía ($0\text{--}49$ palabras):** Categoría sin poblar o en esqueleto (bloqueada en juego).

Incluye filtrado por rango de densidad y dossier (`pel-`, `dep-`, `geo-`, `mus-`, `pal-`, `gen-`, `vid-`), además de ordenación bidireccional por día, cantidad de palabras, título o temática.

---

## ⚙️ Motor de Normalización, Flexibilidad Morfológica y Búsqueda Dual

Para garantizar una evaluación justa, rápida y tolerante al español e inglés reales sin necesidad de duplicar entradas en `prompts.js`:

- **Tratamiento Estricto de la 'Ñ':** Limpieza sistemática de tildes vocálicas y diéresis ($á, é, í, ó, ú, ü \to a, e, i, o, u$), preservando intacta la letra **`ñ`**.
- **Despojo de Artículos y Determinantes Iniciales (`quitarArticulosIniciales`):** Acepta automáticamente entradas con o sin artículo/determinante inicial en español e inglés (`el`, `la`, `los`, `las`, `un`, `una`, `unos`, `unas`, `al`, `del`, `the`, `a`, `an`) cuando va seguido de una palabra de $\ge 2$ caracteres.
- **Equivalencias de Singular y Plural (`generarVariantesNumero`):** Acepta variantes regulares `-s`, `-es` y `-z` ↔ `-ces` en términos de $\ge 4$ caracteres. Se desactiva automáticamente si el enunciado de la categoría exige explícitamente `"en singular"`, `"en plural"` o `"en infinitivo"`.
- **Validación en Prioridades y Control Anti-Doble Puntuación:** Prioriza coincidencias exactas directas (`directMap`) sobre coincidencias morfológicas flexibles (`spacedMap` y versión colapsada `collapsedMap`) y mantiene distancia de Levenshtein `1` para erratas tipográficas ($\ge 5$ caracteres). Registra la raíz canónica (`obtenerFormaCanonica`) para impedir puntuar dos veces por el mismo término con y sin artículo en una sesión.

---

## 🧰 Herramienta CLI Oficial (`spyle_tool.py`)

Utilidad única y reutilizable para gestionar `prompts.js` con respaldo automático previo en `.backups/`, normalización estricta (`ñ` intacta, sin tildes vocálicas), validación de puntuaciones `{10, 25, 45, 65, 85, 100}`, regla anti-duplicados y rollback automático si falla la verificación sintáctica o estructural:

- `python -B spyle_tool.py auditar` *(y `auditar --incompletas --dias`)*: audita las 220 categorías, estadísticas `min / media / max / total`, las 15 categorías de menor densidad, integridad de las jornadas en `DAILY_MISSIONS`, reparto equilibrado `1×7` dossiers, sintaxis de `prompts.js` y `app.js` y coincidencia de los `115/115` IDs DOM con `index.html`.
- `python -B spyle_tool.py consolidar-dias --hasta dia60` *(o `generar-dias --hasta dia60`)*: materializa y guarda permanentemente en `DAILY_MISSIONS` dentro de `prompts.js` los días nuevos hasta el horizonte indicado con reparto determinista `1×7` dossiers y ventana de 14 días, sin modificar jamás ningún día ya existente.
- `python -B spyle_tool.py normalizar`: normaliza claves, corrige puntuaciones heredadas fuera de escala y fusiona duplicados preservando la `ñ`.
- `python -B spyle_tool.py bulk lote.json --cleanup`: importación masiva agrupada por puntuación (formato recomendado) con borrado automático del lote temporal al finalizar.
- `python -B spyle_tool.py importar lote.json --cleanup`: importación por mapa palabra→puntuación y limpieza automática del JSON.
- `python -B spyle_tool.py sheets reclamaciones.csv`: incorpora reclamaciones calibradas exportadas desde Google Sheets (`CSV` o `TSV`).
- `python -B spyle_tool.py buscar "<termino>"`: busca un término normalizado en todo el banco `PROMPTS`.

---

## 📡 Pipeline de Crowdsourcing Blindado (Google Sheets + Apps Script)

Cuando un jugador introduce un término no reconocido que considera válido:

1. **Reclamación Unificada (En Vivo y Post-Partida):** El jugador puede remitir la palabra mediante `[ ✉️ Reclamar ]` tanto al instante tras finalizar la ronda como en el resumen final, enviando el término limpio introducido por el jugador sin alterar.
2. **Bloqueo Global Anti-Duplicados (`spyle_reclamaciones_globales`):** Impide volver a enviar la misma combinación `categoría::palabra` (considerando también variantes con o sin artículo inicial).
3. **Transmisión Serverless:** El cliente envía la sugerencia a un webhook en **Google Apps Script** mediante `fetch` con cabecera `text/plain` y modo `no-cors`.
4. **Hoja de Inteligencia:** Google Sheets registra fecha/hora, categoría, palabra sugerida y puntuación calibrada para reimportación directa con `python spyle_tool.py sheets`.

---

## 🚀 Arquitectura del Repositorio, Flujo Git Automático y Despliegue

### Estructura limpia del repositorio (`Spyle/`)

| Archivo | Función |
| :--- | :--- |
| `index.html` | Terminal táctica, cabecera, modales y recursos con cache-busting (`?v=1.2`) |
| `style.css` | Estética Guerra Fría, animaciones de `#depth-gauge` (`tier-*`) y soporte `--keyboard-offset` |
| `app.js` | Motor de juego, normalización morfológica, generador diario determinista (`1×7` dossiers, ventana 14 días), logros y UX |
| `prompts.js` | Banco `PROMPTS` (220 categorías, 93.816 respuestas) y `DAILY_MISSIONS` (`dia1`–`dia60` consolidados) |
| `favicon.jpg` | Recurso gráfico e icono de la aplicación |
| `spyle_tool.py` | CLI oficial de auditoría, consolidación de días (`consolidar-dias` / `generar-dias`), normalización, búsqueda e importación |
| `AGENTS.md` | Reglas operativas permanentes para agentes y protocolo obligatorio de cierre Git |
| `README.md` | Documentación técnica y operativa del proyecto |
| `.gitignore` | Excluye `.backups/`, `.archive/`, `__pycache__/`, `*.pyc`, `lote*.json`, `temp*.json`, `.DS_Store`, `Thumbs.db` |

### Ciclo automático de consolidación de días, Git y despliegue en GitHub Pages

- **Repositorio remoto:** `https://github.com/RONQUILLER007/Spyle.git` (rama principal `main`).
- **Doble garantía de disponibilidad diaria (Estática en `prompts.js` + Determinista en `app.js`):**
  1. **En vivo en el cliente (`app.js`):** Si se supera el último día materializado en `DAILY_MISSIONS`, `generarExpedienteMixto(day)` calcula en tiempo real exactamente el mismo set de 7 categorías (1 por dossier, semilla `mulberry32((d * 2654435761) >>> 0)`, ventana 14 días) en todos los navegadores sin requerir servidor ni cron externo.
  2. **Materialización permanente en `prompts.js` (`spyle_tool.py`):** Ejecutar `python -B spyle_tool.py consolidar-dias --hasta dia<N>` (o `generar-dias --hasta dia<N>`) congela y guarda en `DAILY_MISSIONS` dentro de `prompts.js` todas las jornadas nuevas hasta `dia<N>` usando exactamente el mismo algoritmo determinista, blindando para siempre las jornadas ya existentes.
- **Automatización Git (`AGENTS.md`):** tras cualquier modificación, consolidación de días o ampliación del banco dentro de `Spyle/` y una vez superada la auditoría (`python -B spyle_tool.py auditar` con `0` errores), se ejecuta automáticamente `git status`, `git add -A`, `git commit -m "<mensaje descriptivo>"` y `git push origin main` respetando `.gitignore`.
- **GitHub Pages (sin necesidad de `.github/workflows` YAML):** al tratarse de una aplicación estática pura en la raíz del repositorio, el despliegue continuo opera directamente desde **Settings → Pages → Build and deployment → Source: `Deploy from a branch` → Branch: `main` / `(root)`**; cada `git push origin main` publica al instante los nuevos días consolidados y el banco actualizado, manteniendo control de caché en `Spyle/index.html`:

```html
<link rel="stylesheet" href="style.css?v=1.2">
<script src="prompts.js?v=1.2" charset="UTF-8"></script>
<script src="app.js?v=1.2" charset="UTF-8"></script>
```

---

## ⚖️ Reconocimiento, Autoría y Disclaimer

**Spyle** constituye una **adaptación cultural independiente al español y una reimaginación temática de espionaje y contrainteligencia** inspirada en el concepto original del juego de navegador **Tinkle** ([tinkle.day](https://tinkle.day)), ideado y publicado por **u/Longjumping-Yam-6532** en la comunidad **r/wordgames** de Reddit.

- **Reconocimiento explícito al creador original:** La mecánica conceptual original de trivia inversa (*Reverse-Trivia / Pointless scoring*) pertenece a **Tinkle** (`u/Longjumping-Yam-6532` en `r/wordgames` / [tinkle.day](https://tinkle.day)). **Spyle** no pretende suplantar la identidad del autor ni atribuirse la autoría de la obra original.
- **Adaptación propia en español:** A partir de esa premisa inspiradora, **Spyle** desarrolla una ambientación propia de contrainteligencia en la Guerra Fría, reglas ampliadas en español (cláusula de disparo limpio, comodín operativo quemado, logros retroactivos, archivo histórico y modo diario infinito determinista desde el Día 32) y un banco propio calibrado en España de **200 categorías y 83.981 respuestas**.
- **Código y Arquitectura Independientes:** Toda la implementación técnica (interfaz de terminal táctica, animaciones en `#depth-gauge`, encuadre `visualViewport`, motor de normalización y flexibilidad morfológica, generador diario determinista, persistencia en `localStorage`, CLI `spyle_tool.py` e integración serverless con Google Sheets) ha sido escrita desde cero sin reutilizar código fuente ni recursos gráficos de **Tinkle**.
