# Instrucciones Permanentes para Agentes (Spyle / Contrainteligencia)

> **REGLA OBLIGATORIA:** Está prohibido crear scripts Python temporales para leer, auditar o editar `prompts.js`. Para cualquier inserción masiva o puntual de palabras, genera un JSON temporal y ejecuta `python spyle_tool.py importar lote.json --cleanup`. Para importar reclamos calibrados de Google Sheets, usa `python spyle_tool.py sheets archivo.csv`.
>
> **OBJETIVO MÍNIMO POR CATEGORÍA (`>= 250`):** El umbral mínimo para que una categoría esté **🟢 Completa / Activa** y quede habilitada en todos los modos de juego (`MIN_PALABRAS_CATEGORIA = 250` / `MIN_ACTIVE_WORDS = 250`) es alcanzar **al menos 250 palabras únicas** en su objeto `answers` (incluyendo respuestas de `10 pts` y de `100 pts`).

---

## Escala Oficial de Densidad (4 Niveles)

- **🟢 Completo / Activo ($\ge 250$ palabras):** Habilitada para Modo Ilimitado, Dossieres Temáticos, Expediente Diario y Archivo Histórico.
- **🟡 Intermedio ($130\text{--}249$ palabras):** Categoría avanzada en desarrollo (bloqueada en juego hasta alcanzar 250).
- **🔴 Baja ($50\text{--}129$ palabras):** Categoría con base inicial insuficiente (bloqueada en juego).
- **⚪ Crítica / Vacía ($0\text{--}49$ palabras):** Categoría sin poblar o en esqueleto (bloqueada en juego).

---

## Guía Rápida de `spyle_tool.py`

Todos los comandos aplican respaldo automático previo en `.backups/`, normalización estricta (minúsculas, sin tildes vocálicas, conservando la `ñ`), validación de puntuaciones `{10, 25, 45, 65, 85, 100}`, regla anti-duplicados y rollback automático si falla la validación sintáctica.

- **Importar JSON (crea el JSON y limpia automáticamente al finalizar):**
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

- **Auditar el banco de categorías y días del calendario:**
  ```bash
  python spyle_tool.py auditar
  python spyle_tool.py auditar --incompletas --dias
  ```

- **Normalizar y limpiar duplicados ocultos en todo `prompts.js`:**
  ```bash
  python spyle_tool.py normalizar
  ```

- **Buscar un término en todo `prompts.js`:**
  ```bash
  python spyle_tool.py buscar "fernando tejero"
  ```
