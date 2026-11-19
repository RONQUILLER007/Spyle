# Instrucciones Permanentes para Agentes (Spyle / Contrainteligencia)

> **REGLA OBLIGATORIA:** Está prohibido crear scripts Python temporales para leer, auditar o editar `prompts.js`. Para cualquier inserción masiva o puntual de palabras, genera un JSON temporal agrupado por puntuación y ejecuta `python spyle_tool.py bulk lote.json --cleanup`. Para importar reclamos calibrados de Google Sheets, usa `python spyle_tool.py sheets archivo.csv`.
>
> **REGLA ESTRICTA DE EFICIENCIA:**
> - **PROHIBIDO leer o abrir `prompts.js` antes de importar**, ya que `spyle_tool.py` descarta duplicados automáticamente.
> - Usa siempre el formato agrupado **`bulk`** con `--cleanup` (`python spyle_tool.py bulk lote.json --cleanup`) para ahorrar tokens y tiempo de ejecución.
>
> **OBJETIVO MÍNIMO POR CATEGORÍA (`>= 250`):** El umbral mínimo para que una categoría esté **🟢 Completa / Activa** y quede habilitada en todos los modos de juego (`MIN_PALABRAS_CATEGORIA = 250` en `app.js` / `MIN_ACTIVE_WORDS = 250` en `spyle_tool.py`) es alcanzar **al menos 250 palabras únicas** en su objeto `answers` (incluyendo respuestas de `10 pts` y de `100 pts`).

---

## Estructura Limpia del Proyecto

- `Spyle/index.html`, `Spyle/style.css`, `Spyle/app.js`, `Spyle/prompts.js`: aplicación web estática (recursos referenciados de forma relativa con cache-busting `?v=1.2`).
- `spyle_tool.py` / `Spyle/spyle_tool.py`: CLI oficial única para validar, auditar, normalizar e importar en `prompts.js` (localiza automáticamente `prompts.js` y `app.js` en raíz, `spyle/`, `Spyle/` o `Tinkle/`).
- `.backups/`, `.archive/`, `__pycache__/`, `lote*.json`, `temp*.json`: excluidos de Git en `.gitignore`.

---

## Escala Oficial de Densidad (4 Niveles)

- **🟢 Completo / Activo ($\ge 250$ palabras):** Habilitada para Modo Ilimitado, Dossieres Temáticos, Expediente Diario y Archivo Histórico.
- **🟡 Intermedio ($130\text{--}249$ palabras):** Categoría avanzada en desarrollo (bloqueada en juego hasta alcanzar 250).
- **🔴 Baja ($50\text{--}129$ palabras):** Categoría con base inicial insuficiente (bloqueada en juego).
- **⚪ Crítica / Vacía ($0\text{--}49$ palabras):** Categoría sin poblar o en esqueleto (bloqueada en juego).

---

## Capacidades del Motor de Juego (`Spyle/app.js`)

- **Flexibilidad Morfológica en 2 Prioridades:**
  - `quitarArticulosIniciales(textoNorm)`: admite variantes con o sin artículo/determinante inicial en español e inglés (`el`, `la`, `los`, `las`, `un`, `una`, `unos`, `unas`, `al`, `del`, `the`, `a`, `an`) cuando queda una palabra de $\ge 2$ caracteres.
  - `generarVariantesNumero(textoNorm)`: acepta equivalencias regulares de singular y plural (`-s`, `-es`, `-z` ↔ `-ces`) en palabras de $\ge 4$ caracteres; se desactiva automáticamente en categorías que exigen explícitamente `"en singular"`, `"en plural"` o `"en infinitivo"`.
  - Control anti-doble puntuación por raíz canónica (`yaUsadaEnSesionActual`) dentro de la misma sesión, conservando el término original limpio al transmitir reclamaciones a Google Sheets.
- **Generador Determinista de Expedientes Diarios Infinitos (`generarExpedienteMixto`):**
  - Prioriza siempre entradas manuales definidas en `DAILY_MISSIONS`; cuando no existe entrada manual, genera automáticamente `[ ARCHIVO MIXTO // DÍA X ]` usando `mulberry32` con semilla basada en el día (`seed = (d * 2654435761) >>> 0`), 1 categoría por cada uno de los 6 prefijos (`pel-`, `dep-`, `geo-`, `mus-`, `pal-`, `gen-`) más 1 comodín y ventana anti-repetición de 7 días (`N-1` a `N-7`).

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
