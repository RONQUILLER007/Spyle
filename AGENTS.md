# Instrucciones Permanentes para Agentes (Spyle / Contrainteligencia)

> **REGLA OBLIGATORIA:** Está prohibido crear scripts Python temporales para leer, auditar o editar `prompts.js`. Para cualquier inserción masiva o puntual de palabras, genera un JSON temporal agrupado por puntuación y ejecuta `python spyle_tool.py bulk lote.json --cleanup`. Para importar reclamos calibrados de Google Sheets, usa `python spyle_tool.py sheets archivo.csv`.
>
> **REGLA ESTRICTA DE EFICIENCIA:**
> - **PROHIBIDO leer o abrir `prompts.js` antes de importar**, ya que `spyle_tool.py` descarta duplicados automáticamente.
> - Usa siempre el formato agrupado **`bulk`** con `--cleanup` (`python spyle_tool.py bulk lote.json --cleanup`) para ahorrar tokens y tiempo de ejecución.
>
> **OBJETIVO MÍNIMO POR CATEGORÍA (`>= 400`):** El umbral mínimo para que una categoría esté **🟢 Completa / Activa** y quede habilitada en todos los modos de juego (`MIN_PALABRAS_CATEGORIA = 400` en `app.js` / `MIN_ACTIVE_WORDS = 400` en `spyle_tool.py`) es alcanzar **al menos 400 palabras únicas** en su objeto `answers` (incluyendo respuestas de `10 pts` y de `100 pts`).
>
> **REGLA OBLIGATORIA DE CIERRE GIT:** Siempre que se modifique, añada o elimine cualquier archivo dentro de `Documents\Antigravity\Spyle` (sin tocar proyectos hermanos como `Lokal` o `Inglés Sara`), y tras superar sin errores `python -B spyle_tool.py auditar`, ejecuta automáticamente `git status`, `git add -A`, `git commit -m "<mensaje descriptivo>"` y `git push origin main` (ver detalles en el protocolo de cierre al final de este documento).

---

## Estructura Limpia del Proyecto (`Spyle/`)

- `Spyle/index.html`, `Spyle/style.css`, `Spyle/app.js`, `Spyle/prompts.js`, `Spyle/favicon.jpg`: aplicación web estática (recursos referenciados de forma relativa con cache-busting `?v=1.2`).
- `Spyle/spyle_tool.py`: CLI oficial única para validar, auditar, normalizar e importar en `prompts.js` (localiza automáticamente `prompts.js`, `app.js` e `index.html` desde `Spyle/` o desde la raíz del workspace).
- `Spyle/AGENTS.md` y `Spyle/README.md`: documentación técnica y operativa del proyecto.
- `.backups/`, `.archive/`, `__pycache__/`, `*.pyc`, `lote*.json`, `temp*.json`: excluidos de Git en `Spyle/.gitignore`.

---

## Inventario Actual del Banco y Escala Oficial de Densidad (4 Niveles)

- **Banco completo de `PROMPTS`:** **200 categorías activas ($\ge 400$ palabras únicas; mínimo: `405`, media: `419,90`, máximo: `587`, total: `83.981` palabras)** distribuidas en los **6 dossieres temáticos**:
  - `gen-`: **40** categorías (`gen-001` a `gen-040`)
  - `pel-`: **32** categorías (`pel-001` a `pel-032`)
  - `dep-`: **32** categorías (`dep-001` a `dep-032`)
  - `geo-`: **32** categorías (`geo-001` a `geo-032`)
  - `mus-`: **32** categorías (`mus-001` a `mus-032`)
  - `pal-`: **32** categorías (`pal-001` a `pal-032`)
- **Calendario fijo (`DAILY_MISSIONS`):** **31 jornadas manuales completas (`dia1` a `dia31`)**, con 7 categorías activas por día y relevo determinista infinito a partir del **`Día 32`**.
- **Escala oficial por densidad:**
  - **🟢 Completo / Activo ($\ge 400$ palabras):** Habilitada para Modo Ilimitado, Dossieres Temáticos, Expediente Diario y Archivo Histórico.
  - **🟡 Intermedio ($130\text{--}399$ palabras):** Categoría avanzada en desarrollo (bloqueada en juego hasta alcanzar 400).
  - **🔴 Baja ($50\text{--}129$ palabras):** Categoría con base inicial insuficiente (bloqueada en juego).
  - **⚪ Crítica / Vacía ($0\text{--}49$ palabras):** Categoría sin poblar o en esqueleto (bloqueada en juego).

---

## Capacidades del Motor de Juego (`Spyle/app.js`)

- **Flexibilidad Morfológica en 2 Prioridades:**
  - `quitarArticulosIniciales(textoNorm)`: admite variantes con o sin artículo/determinante inicial en español e inglés (`el`, `la`, `los`, `las`, `un`, `una`, `unos`, `unas`, `al`, `del`, `the`, `a`, `an`) cuando queda una palabra de $\ge 2$ caracteres.
  - `generarVariantesNumero(textoNorm)`: acepta equivalencias regulares de singular y plural (`-s`, `-es`, `-z` ↔ `-ces`) en palabras de $\ge 4$ caracteres; se desactiva automáticamente en categorías que exigen explícitamente `"en singular"`, `"en plural"` o `"en infinitivo"`.
  - Control anti-doble puntuación por raíz canónica (`yaUsadaEnSesionActual`) dentro de la misma sesión, conservando el término original limpio al transmitir reclamaciones a Google Sheets.
- **Generador Determinista de Expedientes Diarios Infinitos (`generarExpedienteMixto`):**
  - Prioriza siempre las **31 entradas manuales** definidas en `DAILY_MISSIONS` (`dia1` a `dia31`); a partir del **`Día 32`** (o para cualquier día sin entrada manual), genera automáticamente `[ ARCHIVO MIXTO // DÍA X ]` usando `mulberry32` con semilla basada en el día (`seed = (d * 2654435761) >>> 0`), 1 categoría por cada uno de los 6 prefijos (`pel-`, `dep-`, `geo-`, `mus-`, `pal-`, `gen-`) más 1 comodín y ventana anti-repetición de 7 días (`N-1` a `N-7`).
- **Feedback Visual y Ergonomía Táctil:**
  - Animación progresiva de `#depth-gauge` según tramo de puntuación base (`tier-low`, `tier-mid`, `tier-high`, `tier-100`).
  - Encuadre automático ante teclado virtual (`ajustarEncuadreTeclado` con `visualViewport`).

---

## Guía Rápida de `spyle_tool.py`

Todos los comandos aplican respaldo automático previo en `.backups/`, normalización estricta (minúsculas, sin tildes vocálicas, conservando la `ñ`), validación de puntuaciones `{10, 25, 45, 65, 85, 100}`, regla anti-duplicados y rollback automático si falla la validación sintáctica/estructural.

- **Importación masiva optimizada (`bulk`) — formato recomendado (agrupado por puntuación):**
  ```bash
  python spyle_tool.py bulk lote.json --cleanup
  ```
  *Formato JSON agrupado admitido (por `id` o por `texto` exacto/normalizado):*
  ```json
  {
    "pel-001": {
      "10": ["el rey leon", "toy story", "nemo"],
      "25": ["coco", "up", "wall e"],
      "100": ["el planeta del tesoro", "atlantis"]
    }
  }
  ```
  Añade `--overwrite` solo si se solicita explícitamente sobrescribir puntuaciones existentes.

- **Importar JSON individual (crea el JSON y limpia automáticamente al finalizar):**
  ```bash
  python spyle_tool.py importar lote.json --cleanup
  ```
  *Formato JSON admitido (por `id` o por `texto` exacto/normalizado):*
  ```json
  {
    "geo-010": { "ebro": 10, "guadiaro": 100 },
    "Actor o actriz del cine español": { "fernando tejero": 25 }
  }
  ```
  Añade `--overwrite` solo si se solicita explícitamente sobrescribir puntuaciones existentes.

- **Importar reclamaciones calibradas desde Google Sheets (`CSV` o `TSV`):**
  ```bash
  python spyle_tool.py sheets reclamaciones.csv
  ```

- **Auditar el banco de categorías, integridad estructural (`prompts.js` / `app.js`) y días del calendario:**
  ```bash
  python spyle_tool.py auditar
  python spyle_tool.py auditar --incompletas --dias
  ```

- **Normalizar claves, ajustar puntuaciones heredadas y fusionar duplicados en `prompts.js`:**
  ```bash
  python spyle_tool.py normalizar
  ```

- **Buscar un término en todo `prompts.js`:**
  ```bash
  python spyle_tool.py buscar "fernando tejero"
  ```

---

## Protocolo Obligatorio de Cierre y Sincronización Git (`RONQUILLER007/Spyle`)

Al finalizar **cualquier tarea** en la que se modifique, añada o elimine algún archivo dentro de `Documents\Antigravity\Spyle`:

1. **Aislamiento estricto:** Trabaja exclusivamente dentro de `Documents\Antigravity\Spyle`, sin alterar carpetas hermanas (`Lokal`, `Inglés Sara`) ni dejar archivos temporales colgados (`lote*.json`, `temp*.json`, `__pycache__/`, etc.).
2. **Auditoría previa obligatoria (`0` errores):**
   ```bash
   python -B spyle_tool.py auditar
   ```
3. **Commit y Push automáticos a `origin main`:** Si la auditoría termina con código `0`, ejecuta de forma automática:
   ```bash
   git status
   git add -A
   git commit -m "<mensaje descriptivo>"
   git push origin main
   ```
   - Respeta estrictamente `Spyle/.gitignore` para garantizar que nunca se suban `.backups/`, `.archive/`, `__pycache__/`, `*.pyc`, `lote*.json`, `temp*.json`, `.DS_Store` ni `Thumbs.db`.
4. **Contingencia ante fallo de red o credenciales:** Si `git push origin main` falla por falta de credenciales o conectividad, asegúrate de que los cambios queden confirmados localmente (`git commit` hecho), elimina cualquier residuo temporal y **informa claramente al usuario** del motivo exacto del fallo en el `push`.
