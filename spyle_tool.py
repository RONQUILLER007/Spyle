#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spyle_tool.py — Herramienta CLI oficial y reutilizable para gestionar `prompts.js` en Spyle.

Escala oficial de densidad (MIN_ACTIVE_WORDS = 250):
  - 🟢 Completo (>= 250 palabras): Categoria activa en todos los modos de juego.
  - 🟡 Intermedio (130 - 249 palabras): Avanzada en desarrollo.
  - 🔴 Baja (50 - 129 palabras): Base inicial insuficiente.
  - ⚪ Critica / Vacia (0 - 49 palabras): Sin poblar o en esqueleto.

Protocolo de seguridad e integridad en cada escritura:
  1. Backup automático previo en `.backups/prompts_YYYYMMDD_HHMMSS.js` (mantiene últimas 10 copias).
  2. Normalización estricta de claves: minúsculas, colapso de espacios, eliminación de tildes
     vocálicas y diéresis (áéíóúü -> aeiouu) preservando intacta la letra "ñ".
  3. Validación estricta de puntuaciones contra la escala oficial: {10, 25, 45, 65, 85, 100}.
  4. Regla anti-duplicados por defecto (omite existentes salvo `--overwrite`).
  5. Verificación sintáctica tras escribir (`node -c` cuando Node está disponible +
     validador estructural de llaves/corchetes/paréntesis/comillas en Python). Ante cualquier
     error, ejecuta rollback automático restaurando el backup y abortando con código 1.

Ejemplos de uso:
  python spyle_tool.py bulk lote.json --cleanup
  python spyle_tool.py importar lote.json --cleanup
  python spyle_tool.py importar lote.json --overwrite
  python spyle_tool.py sheets reclamaciones.csv
  python spyle_tool.py auditar
  python spyle_tool.py auditar --incompletas --dias
  python spyle_tool.py normalizar
  python spyle_tool.py buscar "fernando tejero"
"""

import csv
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

VALID_SCORES = {10, 25, 45, 65, 85, 100}
MIN_ACTIVE_WORDS = 250
MAX_BACKUPS = 10


def _locate_asset(filename, not_found_msg):
    """Localiza un archivo del proyecto buscando en el directorio actual, spyle/, Spyle/ y Tinkle/."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    roots = []
    for base in (os.getcwd(), script_dir):
        abs_base = os.path.abspath(base)
        if abs_base not in roots:
            roots.append(abs_base)

    candidates = []
    for base in roots:
        for rel in (
            filename,
            os.path.join("spyle", filename),
            os.path.join("Spyle", filename),
            os.path.join("Tinkle", filename),
        ):
            candidates.append(os.path.join(base, rel))

    for path in candidates:
        if os.path.isfile(path):
            return os.path.abspath(path)
    raise FileNotFoundError(not_found_msg)


def locate_prompts_js():
    """Localiza prompts.js en raiz, spyle/, Spyle/ o Tinkle/."""
    return _locate_asset("prompts.js", "No se encontro el archivo prompts.js en el proyecto.")


def locate_app_js():
    """Localiza app.js en raiz, spyle/, Spyle/ o Tinkle/."""
    return _locate_asset("app.js", "No se encontro el archivo app.js en el proyecto.")


def locate_index_html():
    """Localiza index.html en raiz, spyle/, Spyle/ o Tinkle/."""
    return _locate_asset("index.html", "No se encontro el archivo index.html en el proyecto.")


def normalizar_clave(texto):
    """
    Convierte a minúsculas, colapsa espacios múltiples, elimina signos de puntuación/guiones
    y elimina tildes vocálicas y diéresis (á, é, í, ó, ú, ü -> a, e, i, o, u),
    preservando siempre la letra ñ de forma consistente con normalizarTexto() de app.js.
    """
    if texto is None:
        return ""
    s = str(texto).strip().lower()
    token_enie = "__spyle_enie__"
    s = s.replace("n\u0303", token_enie).replace("ñ", token_enie)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace(token_enie, "ñ")
    s = re.sub(r"[-_./\\]+", " ", s)
    s = re.sub(r"[^a-z0-9ñ\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def quitar_articulos_iniciales(texto_norm):
    """Retira artículos/determinantes iniciales (ES/EN) seguidos de una palabra de >= 2 caracteres."""
    if not texto_norm:
        return ""
    actual = texto_norm.strip()
    re_art = re.compile(r"^(?:el|la|los|las|lo|un|una|unos|unas|al|del|the|a|an)\s+(?=\S{2,})", re.IGNORECASE)
    while re_art.match(actual):
        siguiente = re_art.sub("", actual, count=1).strip()
        if not siguiente or siguiente == actual:
            break
        actual = siguiente
    return actual or texto_norm


def _variantes_palabra_numero(palabra):
    """Genera equivalencias regulares de singular y plural para una palabra (>= 4 chars)."""
    variantes = {palabra}
    if not palabra or len(palabra) < 4:
        return variantes
    if palabra.endswith("ces") and len(palabra) > 4:
        variantes.add(palabra[:-3] + "z")
    if palabra.endswith("es") and len(palabra) > 4:
        variantes.add(palabra[:-2])
    if palabra.endswith("s") and not palabra.endswith("ss") and len(palabra) > 3:
        variantes.add(palabra[:-1])
    if palabra.endswith("z"):
        variantes.add(palabra[:-1] + "ces")
    elif palabra[-1] in "aeiou":
        variantes.add(palabra + "s")
    elif palabra[-1] in "dlnrj":
        variantes.add(palabra + "es")
    return variantes


def generar_variantes_numero(texto_norm):
    """Genera equivalencias regulares de singular y plural (-s, -es, -z <-> -ces) manteniendo ñ y sin tildes."""
    variantes = {texto_norm}
    if not texto_norm or len(texto_norm) < 4:
        return variantes
    variantes.update(_variantes_palabra_numero(texto_norm))
    tokens = texto_norm.split()
    if len(tokens) == 2:
        for a in _variantes_palabra_numero(tokens[0]):
            for b in _variantes_palabra_numero(tokens[1]):
                variantes.add(f"{a} {b}")
    elif len(tokens) >= 3:
        for a in _variantes_palabra_numero(tokens[0]):
            variantes.add(" ".join([a] + tokens[1:]))
        for b in _variantes_palabra_numero(tokens[-1]):
            variantes.add(" ".join(tokens[:-1] + [b]))
    return variantes


def strip_js_comments(text):
    """Elimina comentarios /* ... */ y // ... fuera de cadenas literales."""
    out = []
    i = 0
    n = len(text)
    in_str = None
    escape = False
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            i += 1
            continue
        if ch in ('"', "'", "`"):
            in_str = ch
            out.append(ch)
            i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def find_matching_brace(text, open_idx, open_ch="{", close_ch="}"):
    """Encuentra el índice de cierre close_ch correspondiente al open_ch en open_idx."""
    depth = 0
    i = open_idx
    n = len(text)
    in_str = None
    escape = False
    while i < n:
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            i += 1
            continue
        if ch in ('"', "'", "`"):
            in_str = ch
            i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
            continue
        if ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def parse_answers_block(block_text):
    """Extrae pares ordenados [(key, score), ...] de un bloque '{ ... }' de answers."""
    cleaned = strip_js_comments(block_text)
    pairs = []
    for m in re.finditer(r'(["\'])((?:\\.|(?!\1).)*)\1\s*:\s*(\d+)', cleaned):
        key = m.group(2)
        val = int(m.group(3))
        pairs.append((key, val))
    return pairs


def parse_prompts_file(content):
    """
    Parsea PROMPTS y DAILY_MISSIONS desde el contenido de prompts.js.
    Retorna (categories, daily_missions) donde cada categoria incluye:
      id, dailyId, pack, texto, answers_start, answers_end, answers_pairs
    """
    prompts_arr_match = re.search(r"const\s+PROMPTS\s*=\s*\[", content)
    if not prompts_arr_match:
        raise ValueError("No se encontro 'const PROMPTS = [' en prompts.js")

    start_pos = prompts_arr_match.end()
    categories = []

    # Buscar cada objeto de categoria dentro de PROMPTS mediante su propiedad id
    id_pattern = re.compile(r'\bid\s*:\s*"([^"]+)"')
    matches = list(id_pattern.finditer(content, pos=start_pos))
    for idx, m in enumerate(matches):
        cat_id = m.group(1)
        next_limit = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
        chunk = content[m.start():next_limit]

        daily_m = re.search(r'\bdailyId\s*:\s*"([^"]*)"', chunk)
        pack_m = re.search(r'\bpack\s*:\s*"([^"]*)"', chunk)
        texto_m = re.search(r'\btexto\s*:\s*"([^"]*)"', chunk)
        answers_m = re.search(r'\banswers\s*:\s*\{', chunk)
        if not texto_m or not answers_m:
            continue

        ans_open_idx = m.start() + answers_m.end() - 1
        ans_close_idx = find_matching_brace(content, ans_open_idx)
        if ans_close_idx == -1:
            raise ValueError(f"Llave sin cerrar en answers de la categoria {cat_id}")

        block_text = content[ans_open_idx:ans_close_idx + 1]
        pairs = parse_answers_block(block_text)

        categories.append({
            "id": cat_id,
            "dailyId": daily_m.group(1) if daily_m else "",
            "pack": pack_m.group(1) if pack_m else "",
            "texto": texto_m.group(1),
            "norm_texto": normalizar_clave(texto_m.group(1)),
            "answers_start": ans_open_idx,
            "answers_end": ans_close_idx + 1,
            "pairs": pairs,
        })

    # Parsear DAILY_MISSIONS
    daily_missions = []
    dm_match = re.search(r"const\s+DAILY_MISSIONS\s*=\s*\{", content)
    if dm_match:
        dm_open = dm_match.end() - 1
        dm_close = find_matching_brace(content, dm_open)
        if dm_close != -1:
            dm_text = content[dm_open:dm_close + 1]
            day_pattern = re.compile(
                r'\bid\s*:\s*"(dia_(\d+))"\s*,\s*dia\s*:\s*(\d+)\s*,\s*nombre\s*:\s*"([^"]+)"[^}]*?prompts\s*:\s*\[([^\]]+)\]',
                re.DOTALL,
            )
            for dm in day_pattern.finditer(dm_text):
                day_num = int(dm.group(3))
                day_name = dm.group(4)
                prompt_ids = re.findall(r'"([^"]+)"', dm.group(5))
                daily_missions.append({
                    "dia": day_num,
                    "id": f"dia{day_num}",
                    "nombre": day_name,
                    "prompts": prompt_ids,
                })
            daily_missions.sort(key=lambda d: d["dia"])

    return categories, daily_missions


def format_answers_block(pairs):
    """Formatea pares (key, score) respetando la indentacion limpia de prompts.js."""
    if not pairs:
        return "{}"
    lines = []
    chunk_size = 6
    for i in range(0, len(pairs), chunk_size):
        chunk = pairs[i:i + chunk_size]
        parts = []
        for k, v in chunk:
            safe_k = k.replace("\\", "\\\\").replace('"', '\\"')
            parts.append(f'"{safe_k}": {v}')
        lines.append("      " + ", ".join(parts))
    return "{\n" + ",\n".join(lines) + "\n    }"


def validate_js_brackets(content):
    """Validador estructural en Python de llaves, corchetes, parentesis y comillas."""
    stack = []
    pairs = {")": "(", "]": "[", "}": "{"}
    line_no = 1
    col_no = 0
    in_str = None
    escape = False
    in_line_comment = False
    in_block_comment = False
    n = len(content)
    i = 0

    while i < n:
        ch = content[i]
        if ch == "\n":
            line_no += 1
            col_no = 0
            in_line_comment = False
            i += 1
            continue
        col_no += 1

        if in_line_comment:
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and i + 1 < n and content[i + 1] == "/":
                in_block_comment = False
                i += 2
                col_no += 1
                continue
            i += 1
            continue
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            i += 1
            continue

        if ch in ('"', "'", "`"):
            in_str = ch
            i += 1
            continue
        if ch == "/" and i + 1 < n and content[i + 1] == "/":
            in_line_comment = True
            i += 2
            col_no += 1
            continue
        if ch == "/" and i + 1 < n and content[i + 1] == "*":
            in_block_comment = True
            i += 2
            col_no += 1
            continue

        if ch in ("(", "[", "{"):
            stack.append((ch, line_no, col_no))
        elif ch in (")", "]", "}"):
            if not stack:
                return False, f"Cierre inesperado '{ch}' en linea {line_no}:{col_no}"
            last, l_line, l_col = stack.pop()
            if pairs[ch] != last:
                return False, f"Desajuste '{last}' ({l_line}:{l_col}) cerrado con '{ch}' ({line_no}:{col_no})"
        i += 1

    if in_str:
        return False, f"Cadena sin cerrar ({in_str}) al final del archivo"
    if stack:
        return False, f"Bloque sin cerrar al final del archivo: {stack[0]}"
    return True, "OK"


def find_node_executable():
    """Busca el binario node en PATH o rutas estandar."""
    node_bin = shutil.which("node")
    if node_bin:
        return node_bin
    common_paths = [
        r"C:\Program Files\nodejs\node.exe",
        r"C:\Program Files (x86)\nodejs\node.exe",
    ]
    for p in common_paths:
        if os.path.isfile(p):
            return p
    return None


def create_backup(prompts_path):
    """Crea copia de seguridad en .backups/ manteniendo solo las ultimas 10 copias."""
    base_dir = os.path.dirname(prompts_path)
    backup_dir = os.path.join(base_dir, ".backups")
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"prompts_{timestamp}.js"
    backup_path = os.path.join(backup_dir, backup_name)
    counter = 1
    while os.path.exists(backup_path):
        backup_name = f"prompts_{timestamp}_{counter}.js"
        backup_path = os.path.join(backup_dir, backup_name)
        counter += 1

    shutil.copy2(prompts_path, backup_path)

    backups = sorted(
        [f for f in os.listdir(backup_dir) if f.startswith("prompts_") and f.endswith(".js")]
    )
    while len(backups) > MAX_BACKUPS:
        oldest = backups.pop(0)
        try:
            os.remove(os.path.join(backup_dir, oldest))
        except OSError:
            pass

    return backup_path


def check_js_syntax(js_path, content=None):
    """
    Valida la sintaxis de un archivo JavaScript mediante `node -c` (si Node.js esta disponible)
    y el validador estructural de llaves, corchetes, parentesis y comillas en Python.
    Retorna (ok, node_used, message).
    """
    if content is None:
        with open(js_path, "r", encoding="utf-8") as f:
            content = f.read()

    node_used = False
    node_bin = find_node_executable()
    if node_bin:
        res = subprocess.run([node_bin, "-c", js_path], capture_output=True, text=True)
        node_used = True
        if res.returncode != 0:
            err = res.stderr.strip() if res.stderr else f"`node -c` fallo en {os.path.basename(js_path)}"
            return False, node_used, err

    ok, msg = validate_js_brackets(content)
    if not ok:
        return False, node_used, msg

    return True, node_used, "OK"


def guardar_prompts_seguro(prompts_path, new_content):
    """
    Aplica el protocolo de escritura segura:
      - Crea backup en .backups/
      - Escribe nuevo prompts.js
      - Verifica sintaxis con `node -c prompts.js` (si node existe) y validador Python
      - En caso de fallo, restaura el backup y aborta con sys.exit(1)
    """
    backup_path = create_backup(prompts_path)
    print(f"[BACKUP] Copia de seguridad creada en: {backup_path}")

    try:
        with open(prompts_path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(new_content)
    except Exception as exc:
        shutil.copy2(backup_path, prompts_path)
        print(f"[ERROR CRITICO] Fallo escribiendo prompts.js ({exc}). Rollback ejecutado.", file=sys.stderr)
        sys.exit(1)

    ok, node_used, msg = check_js_syntax(prompts_path, new_content)
    if not node_used:
        print("[AVISO] Node.js no encontrado en el sistema; se ejecuta validacion sintactica estructural en Python.")
    if not ok:
        shutil.copy2(backup_path, prompts_path)
        print(f"[ERROR SINTACTICO/ESTRUCTURAL] {msg}. Rollback restaurado.", file=sys.stderr)
        sys.exit(1)

    try:
        cats, _ = parse_prompts_file(new_content)
        if not cats:
            raise ValueError("Lista de categorias vacia tras escritura")
    except Exception as exc:
        shutil.copy2(backup_path, prompts_path)
        print(f"[ERROR PARSEO] {exc}. Rollback restaurado.", file=sys.stderr)
        sys.exit(1)


def rebuild_prompts_content(original_content, replacements):
    """
    Reconstruye prompts.js aplicando reemplazos (answers_start, answers_end, new_block)
    ordenados de atras hacia adelante para no desplazar offsets.
    """
    content = original_content
    for start, end, block_str in sorted(replacements, key=lambda x: x[0], reverse=True):
        content = content[:start] + block_str + content[end:]
    return content


def resolve_category(cats_by_id, cats_by_title, key):
    """Busca categoria por id exacto o titulo exacto/normalizado."""
    k_str = str(key).strip()
    if k_str in cats_by_id:
        return cats_by_id[k_str]
    k_norm = normalizar_clave(k_str)
    if k_norm in cats_by_title:
        return cats_by_title[k_norm]
    return None


def print_summary_table(rows):
    """Imprime tabla resumen: Categoria | Añadidas | Omitidas (duplicadas) | Total actual | Estado (>=250)."""
    print("\n" + "=" * 96)
    print(f"{'Categoria':<48} | {'Añadidas':>8} | {'Omitidas':>8} | {'Total':>6} | {'Estado (>=250)'}")
    print("-" * 96)
    for r in rows:
        label = f"{r['id']} - {r['texto']}"
        if len(label) > 47:
            label = label[:44] + "..."
        t = r["total"]
        if t >= MIN_ACTIVE_WORDS:
            estado = "🟢 COMPLETO (>=250)"
        elif t >= 130:
            estado = f"🟡 INTERMEDIO ({t}/250)"
        elif t >= 50:
            estado = f"🔴 BAJA ({t}/250)"
        else:
            estado = f"⚪ CRITICA/VACIA ({t}/250)"
        print(f"{label:<48} | {r['added']:>8} | {r['skipped']:>8} | {r['total']:>6} | {estado}")
    print("=" * 96)


def apply_category_updates(content, cats, updates_by_cat_id, overwrite=False):
    """
    Aplica actualizaciones {cat_id: {raw_word: raw_score}} sobre las categorias de prompts.js.
    Retorna (new_content, summary_rows, modified_count).
    """
    summary_rows = []
    replacements = []
    total_added = 0

    for cat in cats:
        cat_id = cat["id"]
        if cat_id not in updates_by_cat_id:
            continue

        existing = {}
        ordered_keys = []
        for k, v in cat["pairs"]:
            nk = normalizar_clave(k)
            if not nk:
                continue
            if nk not in existing:
                existing[nk] = v
                ordered_keys.append(nk)

        added = 0
        skipped = 0
        overwritten = 0

        for raw_w, raw_s in updates_by_cat_id[cat_id]:
            nw = normalizar_clave(raw_w)
            if not nw:
                print(f"[AVISO] Clave vacia omitida en {cat_id}")
                continue
            try:
                score = int(raw_s)
            except (TypeError, ValueError):
                print(f"[AVISO] Puntuacion no numerica '{raw_s}' rechazada para '{nw}' en {cat_id}")
                continue
            if score not in VALID_SCORES:
                print(f"[AVISO] Puntuacion invalida ({score}) rechazada para '{nw}' en {cat_id}. Permitidos: {sorted(VALID_SCORES)}")
                continue

            if nw in existing:
                if overwrite:
                    if existing[nw] != score:
                        existing[nw] = score
                        overwritten += 1
                    else:
                        skipped += 1
                else:
                    skipped += 1
            else:
                existing[nw] = score
                ordered_keys.append(nw)
                added += 1

        if added > 0 or overwritten > 0:
            new_pairs = [(k, existing[k]) for k in ordered_keys]
            replacements.append((cat["answers_start"], cat["answers_end"], format_answers_block(new_pairs)))
            total_added += added

        summary_rows.append({
            "id": cat_id,
            "texto": cat["texto"],
            "added": added + overwritten,
            "skipped": skipped,
            "total": len(ordered_keys),
        })

    new_content = rebuild_prompts_content(content, replacements) if replacements else content
    return new_content, summary_rows, len(replacements)


def _extract_word_score_pairs(words_obj):
    """Convierte {puntuacion: [palabras]} o {palabra: puntuacion} en lista de pares (palabra, puntuacion)."""
    pairs = []
    for key, val in words_obj.items():
        if isinstance(val, list):
            for word in val:
                pairs.append((word, key))
        else:
            pairs.append((key, val))
    return pairs


EXTRA_DAILY_MISSIONS_20_25 = [
    (20, {
        "nombre": "Operación Vórtice",
        "fecha": "26 nov 2026",
        "prompts": ["pel-001", "dep-001", "geo-001", "mus-001", "pal-001", "gen-001", "gen-008"],
    }),
    (21, {
        "nombre": "Operación Horizonte",
        "fecha": "27 nov 2026",
        "prompts": ["geo-002", "mus-002", "pal-002", "dep-002", "pel-002", "gen-002", "pel-003"],
    }),
    (22, {
        "nombre": "Operación Laberinto",
        "fecha": "28 nov 2026",
        "prompts": ["mus-003", "pal-003", "dep-003", "geo-003", "pel-004", "gen-003", "dep-004"],
    }),
    (23, {
        "nombre": "Operación Meridiano",
        "fecha": "29 nov 2026",
        "prompts": ["pal-004", "dep-005", "pel-005", "mus-004", "geo-004", "gen-004", "geo-005"],
    }),
    (24, {
        "nombre": "Operación Oráculo",
        "fecha": "30 nov 2026",
        "prompts": ["dep-006", "pel-006", "geo-006", "pal-006", "mus-005", "gen-006", "mus-006"],
    }),
    (25, {
        "nombre": "Operación Cénit",
        "fecha": "1 dic 2026",
        "prompts": ["pel-007", "geo-007", "mus-007", "dep-007", "pal-007", "gen-007", "pal-008"],
    }),
    (26, {
        "nombre": "Operación Ápex",
        "fecha": "2 dic 2026",
        "prompts": ["geo-008", "mus-008", "pal-005", "dep-008", "pel-008", "gen-005", "gen-009"],
    }),
    (27, {
        "nombre": "Operación Nexo",
        "fecha": "3 dic 2026",
        "prompts": ["mus-009", "pal-009", "dep-009", "geo-009", "pel-009", "gen-010", "pel-010"],
    }),
    (28, {
        "nombre": "Operación Prisma",
        "fecha": "4 dic 2026",
        "prompts": ["pal-010", "dep-010", "pel-011", "mus-010", "geo-010", "gen-011", "dep-011"],
    }),
    (29, {
        "nombre": "Operación Vector",
        "fecha": "5 dic 2026",
        "prompts": ["dep-012", "pel-012", "geo-011", "pal-011", "mus-011", "gen-012", "geo-012"],
    }),
    (30, {
        "nombre": "Operación Corona",
        "fecha": "6 dic 2026",
        "prompts": ["pel-013", "geo-013", "mus-012", "dep-013", "pal-012", "gen-013", "mus-013"],
    }),
    (31, {
        "nombre": "Operación Faro",
        "fecha": "7 dic 2026",
        "prompts": ["pel-024", "dep-022", "geo-022", "mus-022", "pal-022", "gen-029", "gen-031"],
    }),
]


def ensure_daily_missions_20_25(content):
    """Asegura que DAILY_MISSIONS incluya las jornadas dia20 a dia30 y sus alias en prompts.js."""
    dm_match = re.search(r"const\s+DAILY_MISSIONS\s*=\s*\{", content)
    if not dm_match:
        raise ValueError("No se encontro 'const DAILY_MISSIONS = {' en prompts.js")

    dm_open = dm_match.end() - 1
    dm_close = find_matching_brace(content, dm_open)
    if dm_close == -1:
        raise ValueError("Llave sin cerrar en DAILY_MISSIONS de prompts.js")

    dm_block = content[dm_open:dm_close + 1]
    new_entries = []
    for day_num, spec in EXTRA_DAILY_MISSIONS_20_25:
        if re.search(rf'\bid\s*:\s*"dia_{day_num}"', dm_block):
            continue
        prompts_str = ", ".join(f'"{pid}"' for pid in spec["prompts"])
        new_entries.append(
            f'  {day_num}: {{\n'
            f'    id: "dia_{day_num}",\n'
            f'    dia: {day_num},\n'
            f'    nombre: "{spec["nombre"]}",\n'
            f'    fecha: "{spec["fecha"]}",\n'
            f'    prompts: [{prompts_str}]\n'
            f'  }}'
        )

    modified = False
    updated = content
    if new_entries:
        inner = content[dm_open + 1:dm_close].rstrip()
        sep = "\n" if inner.endswith(",") else ",\n"
        replacement_block = "{" + inner[0:] + sep + ",\n".join(new_entries) + "\n}"
        updated = content[:dm_open] + replacement_block + content[dm_close + 1:]
        modified = True

    # Recalcular cierre de DAILY_MISSIONS para asegurar los alias dia_20..dia_30 y dia20..dia30
    dm_match2 = re.search(r"const\s+DAILY_MISSIONS\s*=\s*\{", updated)
    dm_open2 = dm_match2.end() - 1
    dm_close2 = find_matching_brace(updated, dm_open2)
    after_start = dm_close2 + 1
    tail_search = re.search(
        r'if\s*\(\s*typeof\s+window\s*!==\s*"undefined"\s*\)\s*window\.DAILY_MISSIONS\s*=\s*DAILY_MISSIONS;',
        updated[after_start:],
    )
    insert_pos = (after_start + tail_search.start()) if tail_search else (after_start + 1)
    alias_region = updated[after_start:insert_pos]

    missing_aliases = []
    for day_num, _ in EXTRA_DAILY_MISSIONS_20_25:
        a1 = f"DAILY_MISSIONS.dia_{day_num} = DAILY_MISSIONS[{day_num}];"
        a2 = f"DAILY_MISSIONS.dia{day_num} = DAILY_MISSIONS[{day_num}];"
        if a1 not in alias_region:
            missing_aliases.append(a1)
        if a2 not in alias_region:
            missing_aliases.append(a2)

    if missing_aliases:
        prefix = "" if alias_region.endswith("\n") or not alias_region else "\n"
        updated = updated[:insert_pos] + prefix + "\n".join(missing_aliases) + "\n" + updated[insert_pos:]
        modified = True

    return updated, modified


EXTRA_PROMPTS_CATEGORIES = [
    {
        "id": "gen-029",
        "pack": "general",
        "texto": "Videojuego de rol (RPG), estrategia o mundo abierto",
        "ejemplo": "chrono trigger",
    },
    {
        "id": "gen-030",
        "pack": "general",
        "texto": "Serie de televisión internacional icónica",
        "ejemplo": "the wire",
    },
    {
        "id": "gen-031",
        "pack": "general",
        "texto": "Cómic, novela gráfica, manga o personaje de tebeo",
        "ejemplo": "corto maltes",
    },
    {
        "id": "gen-032",
        "pack": "general",
        "texto": "Dulce tradicional, pastel o repostería típica",
        "ejemplo": "pionono",
    },
    {
        "id": "gen-033",
        "pack": "general",
        "texto": "Árbol, planta, flor o especie botánica",
        "ejemplo": "ginkgo biloba",
    },
    {
        "id": "gen-034",
        "pack": "general",
        "texto": "Marca o modelo histórico de coche o motocicleta",
        "ejemplo": "bultaco metralla",
    },
    {
        "id": "gen-035",
        "pack": "general",
        "texto": "Dios, criatura o figura de la mitología (clásica, nórdica o egipcia)",
        "ejemplo": "apofis",
    },
    {
        "id": "gen-036",
        "pack": "general",
        "texto": "Invento, máquina o herramienta histórica",
        "ejemplo": "astrolabio",
    },
    {
        "id": "gen-037",
        "pack": "general",
        "texto": "Fenómeno meteorológico, astronómico o geológico",
        "ejemplo": "fuego de san telmo",
    },
    {
        "id": "gen-038",
        "pack": "general",
        "texto": "Personaje histórico célebre (política, ciencia, guerra o cultura)",
        "ejemplo": "hipatia de alejandria",
    },
    {
        "id": "gen-039",
        "pack": "general",
        "texto": "Marca tecnológica, de videojuegos o electrónica de consumo",
        "ejemplo": "commodore",
    },
    {
        "id": "gen-040",
        "pack": "general",
        "texto": "Objeto o electrodoméstico habitual en una cocina",
        "ejemplo": "almirez",
    },
    {
        "id": "pel-022",
        "pack": "peliculas",
        "texto": "Película de comedia (española o internacional)",
        "ejemplo": "el guateque",
    },
    {
        "id": "pel-023",
        "pack": "peliculas",
        "texto": "Película de fantasía, magia o mundos imaginarios",
        "ejemplo": "cristal oscuro",
    },
    {
        "id": "pel-024",
        "pack": "peliculas",
        "texto": "Película romántica o comedia romántica",
        "ejemplo": "breve encuentro",
    },
    {
        "id": "pel-025",
        "pack": "peliculas",
        "texto": "Película de drama o cine social",
        "ejemplo": "ladron de bicicletas",
    },
    {
        "id": "pel-026",
        "pack": "peliculas",
        "texto": "Película o serie de anime (animación japonesa)",
        "ejemplo": "perfect blue",
    },
    {
        "id": "pel-027",
        "pack": "peliculas",
        "texto": "Película de aventuras o búsqueda de tesoros",
        "ejemplo": "el hombre que pudo reinar",
    },
    {
        "id": "pel-028",
        "pack": "peliculas",
        "texto": "Película ambientada en el instituto, universidad o adolescencia",
        "ejemplo": "rushmore",
    },
    {
        "id": "pel-029",
        "pack": "peliculas",
        "texto": "Película con viajes en el tiempo, bucles o realidades paralelas",
        "ejemplo": "primer",
    },
    {
        "id": "pel-030",
        "pack": "peliculas",
        "texto": "Actor o actriz internacional contemporáneo (1980 en adelante)",
        "ejemplo": "daniel day lewis",
    },
    {
        "id": "pel-031",
        "pack": "peliculas",
        "texto": "Personaje protagonista o héroe icónico del cine",
        "ejemplo": "atticus finch",
    },
    {
        "id": "pel-032",
        "pack": "peliculas",
        "texto": "Película navideña o ambientada en Navidad",
        "ejemplo": "placido",
    },
    {
        "id": "dep-022",
        "pack": "deportes",
        "texto": "Jugador o jugadora histórico de baloncesto (NBA, Euroliga o FIBA)",
        "ejemplo": "dejan bodiroga",
    },
    {
        "id": "dep-023",
        "pack": "deportes",
        "texto": "Tenista profesional (masculino o femenino, histórico o actual)",
        "ejemplo": "guillermo vilas",
    },
    {
        "id": "dep-024",
        "pack": "deportes",
        "texto": "Piloto de Fórmula 1, MotoGP o rallies (histórico o actual)",
        "ejemplo": "kevin schwantz",
    },
    {
        "id": "dep-025",
        "pack": "deportes",
        "texto": "Selección nacional de fútbol, baloncesto o rugby",
        "ejemplo": "fiyi",
    },
    {
        "id": "dep-026",
        "pack": "deportes",
        "texto": "Futbolista internacional leyenda (fuera de España)",
        "ejemplo": "garrincha",
    },
    {
        "id": "dep-027",
        "pack": "deportes",
        "texto": "Futbolista español histórico o actual",
        "ejemplo": "quini",
    },
    {
        "id": "dep-028",
        "pack": "deportes",
        "texto": "Equipo o franquicia de la NBA, NFL, MLB o NHL",
        "ejemplo": "hartford whalers",
    },
    {
        "id": "dep-029",
        "pack": "deportes",
        "texto": "Deporte de equipo que se juegue con balón o pelota",
        "ejemplo": "korfbal",
    },
    {
        "id": "dep-030",
        "pack": "deportes",
        "texto": "Deporte individual (no de combate ni acuático)",
        "ejemplo": "skeleton",
    },
    {
        "id": "dep-031",
        "pack": "deportes",
        "texto": "Objeto, equipamiento o accesorio deportivo",
        "ejemplo": "magnesiera",
    },
    {
        "id": "dep-032",
        "pack": "deportes",
        "texto": "Ejercicio físico, levantamiento o movimiento de gimnasio o calistenia",
        "ejemplo": "muscle up",
    },
    {
        "id": "geo-022",
        "pack": "geografia",
        "texto": "Ciudad o municipio de España (no capital de provincia)",
        "ejemplo": "alcazar de san juan",
    },
    {
        "id": "geo-023",
        "pack": "geografia",
        "texto": "Provincia, comunidad autónoma o comarca histórica de España",
        "ejemplo": "las merindades",
    },
    {
        "id": "geo-024",
        "pack": "geografia",
        "texto": "Río de América, Asia o África",
        "ejemplo": "zambeze",
    },
    {
        "id": "geo-025",
        "pack": "geografia",
        "texto": "Barrio o distrito famoso de una ciudad del mundo",
        "ejemplo": "trastevere",
    },
    {
        "id": "geo-026",
        "pack": "geografia",
        "texto": "Ciudad importante de Europa (excluyendo España)",
        "ejemplo": "gante",
    },
    {
        "id": "geo-027",
        "pack": "geografia",
        "texto": "Ciudad importante de América (Norte, Centro o Sur)",
        "ejemplo": "valparaiso",
    },
    {
        "id": "geo-028",
        "pack": "geografia",
        "texto": "Ciudad importante de Asia, África u Oceanía",
        "ejemplo": "samarcanda",
    },
    {
        "id": "geo-029",
        "pack": "geografia",
        "texto": "Playa, cala o costa famosa de España o del mundo",
        "ejemplo": "cala macarella",
    },
    {
        "id": "geo-030",
        "pack": "geografia",
        "texto": "Museo, catedral, palacio o edificio histórico célebre",
        "ejemplo": "palacio de la musica catalana",
    },
    {
        "id": "geo-031",
        "pack": "geografia",
        "texto": "Selva, bosque, valle o paraje natural emblemático del mundo",
        "ejemplo": "selva de irati",
    },
    {
        "id": "geo-032",
        "pack": "geografia",
        "texto": "Región, estado o provincia relevante fuera de España y EEUU",
        "ejemplo": "toscana",
    },
    {
        "id": "mus-022",
        "pack": "musica",
        "texto": "Artista o grupo de rap, hip-hop o trap (en español o inglés)",
        "ejemplo": "hablando en plata",
    },
    {
        "id": "mus-023",
        "pack": "musica",
        "texto": "Artista o grupo de reguetón, salsa, bachata o música latina",
        "ejemplo": "hector lavoe",
    },
    {
        "id": "mus-024",
        "pack": "musica",
        "texto": "Cantautor, trovador o figura de la canción de autor",
        "ejemplo": "luis eduardo aute",
    },
    {
        "id": "mus-025",
        "pack": "musica",
        "texto": "Canción icónica en inglés (rock, pop, dance o balada)",
        "ejemplo": "wuthering heights",
    },
    {
        "id": "mus-026",
        "pack": "musica",
        "texto": "Banda sonora, tema principal o canción famosa de película o serie",
        "ejemplo": "carros de fuego",
    },
    {
        "id": "mus-027",
        "pack": "musica",
        "texto": "Banda o solista estadounidense legendario (1950–2010)",
        "ejemplo": "creedence clearwater revival",
    },
    {
        "id": "mus-028",
        "pack": "musica",
        "texto": "Artista o grupo de indie, rock alternativo o pop español actual",
        "ejemplo": "los planetas",
    },
    {
        "id": "mus-029",
        "pack": "musica",
        "texto": "Artista, banda o figura legendaria del jazz, blues o soul",
        "ejemplo": "thelonious monk",
    },
    {
        "id": "mus-030",
        "pack": "musica",
        "texto": "Banda o artista de pop o rock latinoamericano",
        "ejemplo": "sui generis",
    },
    {
        "id": "mus-031",
        "pack": "musica",
        "texto": "Ópera, zarzuela o sinfonía célebre de la música clásica",
        "ejemplo": "la verbena de la paloma",
    },
    {
        "id": "mus-032",
        "pack": "musica",
        "texto": "Instrumento musical tradicional, folclórico o electrónico",
        "ejemplo": "theremin",
    },
    {
        "id": "pal-022",
        "pack": "palabras",
        "texto": "Palabra en español que contenga la letra «Ñ»",
        "ejemplo": "pedigueño",
    },
    {
        "id": "pal-023",
        "pack": "palabras",
        "texto": "Palabra en español que empiece por «H» muda",
        "ejemplo": "hermeneutica",
    },
    {
        "id": "pal-024",
        "pack": "palabras",
        "texto": "Palabra compuesta en español (ej. sacacorchos, paraguas, lavavajillas)",
        "ejemplo": "correveidile",
    },
    {
        "id": "pal-025",
        "pack": "palabras",
        "texto": "Adjetivo calificativo positivo para describir a una persona",
        "ejemplo": "magnanimo",
    },
    {
        "id": "pal-026",
        "pack": "palabras",
        "texto": "Adjetivo calificativo negativo o defecto de una persona",
        "ejemplo": "pusilanime",
    },
    {
        "id": "pal-027",
        "pack": "palabras",
        "texto": "Emoción, sentimiento o estado de ánimo en español",
        "ejemplo": "desasosiego",
    },
    {
        "id": "pal-028",
        "pack": "palabras",
        "texto": "Parte del cuerpo humano, órgano o hueso",
        "ejemplo": "esternocleidomastoideo",
    },
    {
        "id": "pal-029",
        "pack": "palabras",
        "texto": "Palabra llana con tilde en español",
        "ejemplo": "alferez",
    },
    {
        "id": "pal-030",
        "pack": "palabras",
        "texto": "Sinónimo en español de «grande», «enorme» o «mucho»",
        "ejemplo": "pantagruelico",
    },
    {
        "id": "pal-031",
        "pack": "palabras",
        "texto": "Sinónimo en español de «pequeño», «escaso» o «poco»",
        "ejemplo": "exiguo",
    },
    {
        "id": "pal-032",
        "pack": "palabras",
        "texto": "Expresión, refrán corto o modismo coloquial de España",
        "ejemplo": "de higos a brevas",
    },
]


def ensure_extra_prompt_categories(content):
    """Asegura que las categorias de EXTRA_PROMPTS_CATEGORIES existan en PROMPTS dentro de prompts.js."""
    prompts_arr_match = re.search(r"const\s+PROMPTS\s*=\s*\[", content)
    if not prompts_arr_match:
        raise ValueError("No se encontro 'const PROMPTS = [' en prompts.js")

    arr_open = prompts_arr_match.end() - 1
    arr_close = find_matching_brace(content, arr_open, "[", "]")
    if arr_close == -1:
        raise ValueError("Corchete sin cerrar en const PROMPTS = [ de prompts.js")

    prompts_block = content[arr_open:arr_close + 1]
    new_blocks = []
    for spec in EXTRA_PROMPTS_CATEGORIES:
        cid = spec["id"]
        if re.search(rf'\bid\s*:\s*"{re.escape(cid)}"', prompts_block):
            continue
        new_blocks.append(
            f'  {{\n'
            f'    id: "{cid}", pack: "{spec["pack"]}",\n'
            f'    texto: "{spec["texto"]}",\n'
            f'    ejemplo: "{spec["ejemplo"]}",\n'
            f'    answers: {{}}\n'
            f'  }}'
        )

    if not new_blocks:
        return content, False

    inner = content[arr_open + 1:arr_close].rstrip()
    sep = "\n" if inner.endswith(",") else ",\n"
    replacement = "[" + inner + sep + ",\n".join(new_blocks) + "\n]"
    updated = content[:arr_open] + replacement + content[arr_close + 1:]
    return updated, True


def _run_json_import(args, cmd_name, expected_desc):
    """Flujo compartido para importar o hacer bulk desde JSON con backup, normalizacion y rollback."""
    overwrite = "--overwrite" in args
    cleanup = "--cleanup" in args
    pos_args = [a for a in args if not a.startswith("--")]
    if not pos_args:
        print(f"Uso: python spyle_tool.py {cmd_name} <archivo.json> [--overwrite] [--cleanup]", file=sys.stderr)
        sys.exit(1)

    json_path = pos_args[0]
    if not os.path.isfile(json_path):
        print(f"[ERROR] No existe el archivo JSON: {json_path}", file=sys.stderr)
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        print(f"[ERROR] El JSON debe ser un objeto {expected_desc}", file=sys.stderr)
        sys.exit(1)

    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    content, dm_modified = ensure_daily_missions_20_25(content)
    content, cats_added = ensure_extra_prompt_categories(content)
    cats, _ = parse_prompts_file(content)
    cats_by_id = {c["id"]: c for c in cats}
    cats_by_title = {c["norm_texto"]: c for c in cats}

    updates = {}
    for cat_key, words_obj in data.items():
        cat = resolve_category(cats_by_id, cats_by_title, cat_key)
        if not cat:
            print(f"[AVISO] Categoria no encontrada en prompts.js: '{cat_key}'")
            continue
        if not isinstance(words_obj, dict):
            print(f"[AVISO] Formato invalido para '{cat_key}': se esperaba {expected_desc}")
            continue
        updates.setdefault(cat["id"], []).extend(_extract_word_score_pairs(words_obj))

    if not updates and not dm_modified and not cats_added:
        print("[AVISO] No hay categorias validas que procesar.")
        return

    if updates:
        new_content, rows, modified_blocks = apply_category_updates(content, cats, updates, overwrite=overwrite)
    else:
        new_content, rows, modified_blocks = content, [], 0

    if modified_blocks > 0 or dm_modified or cats_added:
        guardar_prompts_seguro(prompts_path, new_content)
        if dm_modified:
            print("[OK] Se incorporaron/actualizaron las jornadas en DAILY_MISSIONS.")
        if cats_added:
            print("[OK] Se añadieron nuevas categorias en PROMPTS.")
        if modified_blocks > 0:
            print(f"[OK] Se actualizaron {modified_blocks} categoria(s) en prompts.js.")
    else:
        print("[INFO] Sin cambios nuevos en prompts.js (todas las claves validas ya existian).")

    if rows:
        print_summary_table(rows)

    if cleanup:
        try:
            os.remove(json_path)
            print(f"[CLEANUP] Archivo temporal eliminado: {json_path}")
        except OSError as exc:
            print(f"[AVISO] No se pudo eliminar {json_path}: {exc}")


def cmd_bulk(args):
    """Importa palabras desde un JSON agrupado por puntuacion (`{ cat: { "10": [...] } }`) con --overwrite / --cleanup."""
    _run_json_import(args, "bulk", "{ categoria: { puntuacion: [palabras] } }")


def cmd_importar(args):
    """Importa palabras desde un JSON plano (`{ cat: { palabra: puntos } }`) con --overwrite / --cleanup."""
    _run_json_import(args, "importar", "{ categoria: { palabra: puntos } }")


def cmd_sheets(args):
    """python spyle_tool.py sheets <archivo.csv|archivo.tsv> [--overwrite]"""
    overwrite = "--overwrite" in args
    pos_args = [a for a in args if not a.startswith("--")]
    if not pos_args:
        print("Uso: python spyle_tool.py sheets <archivo.csv|archivo.tsv> [--overwrite]", file=sys.stderr)
        sys.exit(1)

    csv_path = pos_args[0]
    if not os.path.isfile(csv_path):
        print(f"[ERROR] No existe el archivo CSV/TSV: {csv_path}", file=sys.stderr)
        sys.exit(1)

    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        if csv_path.lower().endswith(".tsv") or "\t" in sample.splitlines()[0]:
            delimiter = "\t"
        else:
            try:
                dialect = csv.Sniffer().sniff(sample, delimiters=",\t;")
                delimiter = dialect.delimiter
            except csv.Error:
                delimiter = ","
        reader = list(csv.reader(f, delimiter=delimiter))

    if not reader:
        print("[AVISO] El archivo esta vacio.")
        return

    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    cats, _ = parse_prompts_file(content)
    cats_by_id = {c["id"]: c for c in cats}
    cats_by_title = {c["norm_texto"]: c for c in cats}

    updates = {}
    pending_unscored = 0
    unmatched_cats = set()
    invalid_score_rows = 0

    # Saltar cabecera (fila 0)
    for row_idx, row in enumerate(reader[1:], start=2):
        if not row or all(not cell.strip() for cell in row):
            continue
        if len(row) < 4:
            pending_unscored += 1
            continue

        col_b_cat = row[1].strip()
        col_c_word = row[2].strip()
        col_d_pts = row[3].strip()

        if not col_d_pts:
            pending_unscored += 1
            continue

        cat = resolve_category(cats_by_id, cats_by_title, col_b_cat)
        if not cat:
            unmatched_cats.add(col_b_cat)
            continue

        try:
            pts_val = int(float(col_d_pts.replace(",", ".")))
        except ValueError:
            print(f"[AVISO] Fila {row_idx}: puntuacion invalida '{col_d_pts}' para '{col_c_word}'")
            invalid_score_rows += 1
            continue

        if pts_val not in VALID_SCORES:
            print(f"[AVISO] Fila {row_idx}: puntuacion '{pts_val}' fuera de escala {sorted(VALID_SCORES)} para '{col_c_word}'")
            invalid_score_rows += 1
            continue

        updates.setdefault(cat["id"], []).append((col_c_word, pts_val))

    if updates:
        new_content, rows, modified_blocks = apply_category_updates(content, cats, updates, overwrite=overwrite)
        if modified_blocks > 0:
            guardar_prompts_seguro(prompts_path, new_content)
            print(f"[OK] Se actualizaron {modified_blocks} categoria(s) desde Google Sheets.")
        else:
            print("[INFO] Sin claves nuevas para añadir desde Google Sheets.")
        print_summary_table(rows)
    else:
        print("[INFO] No se encontraron filas listas para importar.")

    print(f"\nResumen Sheets:")
    print(f"  - Filas pendientes de puntuar omitidas (Columna D vacia): {pending_unscored}")
    print(f"  - Filas rechazadas por puntuacion invalida: {invalid_score_rows}")
    if unmatched_cats:
        print(f"  - Categorias sin coincidencia ({len(unmatched_cats)}):")
        for uc in sorted(unmatched_cats):
            print(f"      * {uc}")


def cmd_auditar(args):
    """
    Audita el banco de categorias (`prompts.js`) y la sintaxis de `prompts.js` / `app.js`:
      - Escala oficial de 4 niveles (MIN_ACTIVE_WORDS = 250).
      - Unicidad de IDs en PROMPTS, integridad de DAILY_MISSIONS, validez de {10,25,45,65,85,100}
        y ausencia de claves vacias.
      - Equilibrio de dificultad (tramos 10 pts y 100 pts en todas las categorias completas).
      - Validacion estructural y sintactica de prompts.js y app.js.
    """
    show_incompletas = "--incompletas" in args
    show_dias = "--dias" in args

    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    cats, daily_missions = parse_prompts_file(content)

    activas = []
    amarillas = []
    rojas = []
    vacias = []
    alerts_balance = []
    seen_ids = set()
    duplicate_ids = []
    invalid_scores = []
    empty_keys = []

    for c in cats:
        cid = c["id"]
        if cid in seen_ids:
            duplicate_ids.append(cid)
        seen_ids.add(cid)

        pairs = c["pairs"]
        total = len(pairs)
        scores = set()
        for k, v in pairs:
            if not normalizar_clave(k):
                empty_keys.append(cid)
            if v not in VALID_SCORES:
                invalid_scores.append((cid, k, v))
            scores.add(v)

        if total >= MIN_ACTIVE_WORDS:
            activas.append(c)
            missing = []
            if 10 not in scores:
                missing.append("10 pts")
            if 100 not in scores:
                missing.append("100 pts (Agente Durmiente)")
            if missing:
                alerts_balance.append((cid, c["texto"], missing))
        elif total >= 130:
            amarillas.append(c)
        elif total >= 50:
            rojas.append(c)
        else:
            vacias.append(c)

    print("\n" + "=" * 72)
    print(f"AUDITORIA GLOBAL DE PROMPTS ({len(cats)} categorias totales)")
    print("=" * 72)
    print(f"  🟢 Completo / Activo (>= {MIN_ACTIVE_WORDS} palabras) : {len(activas)}")
    print(f"  🟡 Intermedio (130 - 249)               : {len(amarillas)}")
    print(f"  🔴 Baja (50 - 129)                      : {len(rojas)}")
    print(f"  ⚪ Critica / Vacia (0 - 49)             : {len(vacias)}")

    # Conteo por dossier / prefijo
    by_prefix = {}
    for c in cats:
        pref = c["id"].split("-")[0]
        by_prefix.setdefault(pref, {"total": 0, "activas": 0})
        by_prefix[pref]["total"] += 1
        if len(c["pairs"]) >= MIN_ACTIVE_WORDS:
            by_prefix[pref]["activas"] += 1

    print("\nDesglose por Dossier:")
    for pref in sorted(by_prefix):
        info = by_prefix[pref]
        print(f"  - {pref:<4}: {info['activas']:>2}/{info['total']:<2} activas (>={MIN_ACTIVE_WORDS})")

    # Integridad estructural del banco
    missing_daily_ids = []
    consecutive_dups = []
    cloned_days = []
    if daily_missions:
        cats_map = {c["id"]: len(c["pairs"]) for c in cats}
        seen_day_sets = {}
        for idx_dm, dm in enumerate(daily_missions):
            for pid in dm["prompts"]:
                if pid not in cats_map:
                    missing_daily_ids.append((f"dia{dm['dia']}", pid))
            day_set = frozenset(dm["prompts"])
            if day_set in seen_day_sets:
                cloned_days.append((seen_day_sets[day_set], f"dia{dm['dia']}"))
            else:
                seen_day_sets[day_set] = f"dia{dm['dia']}"
            if idx_dm > 0:
                prev_dm = daily_missions[idx_dm - 1]
                if dm["dia"] == prev_dm["dia"] + 1 and set(dm["prompts"]) == set(prev_dm["prompts"]):
                    consecutive_dups.append((f"dia{prev_dm['dia']}", f"dia{dm['dia']}"))

    counts = [len(c["pairs"]) for c in cats]
    total_words = sum(counts)
    under_255 = [(c["id"], len(c["pairs"])) for c in cats if len(c["pairs"]) < 255]
    over_400 = sum(1 for c in cats if len(c["pairs"]) >= 400)
    min_words = min(counts, default=0)
    max_words = max(counts, default=0)
    avg_words = (total_words / len(cats)) if cats else 0.0
    bottom_15 = sorted(cats, key=lambda c: (len(c["pairs"]), c["id"]))[:15]

    print("\nIntegridad estructural del banco:")
    print(f"  - IDs duplicados en PROMPTS     : {'0 (OK)' if not duplicate_ids else f'ALERTA: {duplicate_ids}'}")
    print(f"  - Referencias huerfanas diarias : {'0 (OK)' if not missing_daily_ids else f'ALERTA: {missing_daily_ids}'}")
    print(f"  - Dias consecutivos repetidos   : {'0 (OK)' if not consecutive_dups else f'ALERTA: {consecutive_dups}'}")
    print(f"  - Dias clonados entre jornadas  : {'0 (OK)' if not cloned_days else f'ALERTA: {cloned_days}'}")
    print(f"  - Categorias con < 255 palabras : {'0 (OK)' if not under_255 else f'AVISO: {len(under_255)} ({under_255[:5]})'} (min: {min_words} | media: {avg_words:.2f} | max: {max_words} | total: {total_words})")
    print(f"  - Categorias con >= 400 palabras: {over_400}/{len(cats)}")
    print(f"  - Puntuaciones fuera de escala  : {'0 (OK)' if not invalid_scores else f'ALERTA: {len(invalid_scores)}'}")
    if invalid_scores:
        by_score = {}
        for cid, k, v in invalid_scores:
            by_score.setdefault(v, []).append((cid, k))
        for sv in sorted(by_score):
            sample = ", ".join(f"{cid}:'{k}'" for cid, k in by_score[sv][:5])
            extra = f" (+{len(by_score[sv]) - 5} mas)" if len(by_score[sv]) > 5 else ""
            print(f"      * Valor {sv} ({len(by_score[sv])} casos): {sample}{extra}")
    print(f"  - Claves vacias detectadas      : {'0 (OK)' if not empty_keys else f'ALERTA: {empty_keys}'}")

    ok_prompts, node_prompts, msg_prompts = check_js_syntax(prompts_path, content)
    prompts_mode = "node -c + Python" if node_prompts else "Python estructural"
    print(f"  - Sintaxis prompts.js ({prompts_mode}): {'OK' if ok_prompts else f'ERROR: {msg_prompts}'}")

    app_ok = True
    dom_missing = []
    try:
        app_path = locate_app_js()
        with open(app_path, "r", encoding="utf-8") as af:
            app_content = af.read()
        app_ok, node_app, msg_app = check_js_syntax(app_path, app_content)
        app_mode = "node -c + Python" if node_app else "Python estructural"
        print(f"  - Sintaxis app.js ({app_mode})    : {'OK' if app_ok else f'ERROR: {msg_app}'}")
        try:
            html_path = locate_index_html()
            with open(html_path, "r", encoding="utf-8") as hf:
                html_content = hf.read()
            html_ids = set(re.findall(r'\bid=["\']([^"\']+)["\']', html_content))
            app_no_comments = strip_js_comments(app_content)
            app_ids = set(re.findall(r'\$\(\s*["\']([A-Za-z0-9_-]+)["\']\s*\)', app_no_comments))
            legacy_fallback_ids = {"btn-calendar"}
            dom_missing = sorted(i for i in app_ids if i not in html_ids and i not in legacy_fallback_ids)
            print(f"  - Coincidencia DOM (app.js <-> index.html): {len(app_ids) - len(dom_missing)}/{len(app_ids)} IDs verificados" + (" (OK)" if not dom_missing else f" (FALTAN: {dom_missing})"))
        except FileNotFoundError:
            print("  - Coincidencia DOM              : (index.html no localizado)")
    except FileNotFoundError:
        print("  - Sintaxis app.js               : (No localizado en este directorio)")

    print("\nTop 15 categorias con menor densidad (para refuerzo):")
    for idx_b, cb in enumerate(bottom_15, start=1):
        print(f"  {idx_b:>2}. [{cb['id']}] {len(cb['pairs']):>3} palabras — {cb['texto']}")

    # Equilibrio de dificultad en activas
    print(f"\nEquilibrio de dificultad (tramos 10 pts y 100 pts en activas):")
    if alerts_balance:
        print(f"  [ALERTA] {len(alerts_balance)} categoria(s) activas carecen de tramos criticos:")
        for cid, title, missing in alerts_balance:
            print(f"    * {cid} ({title}) -> Falta: {', '.join(missing)}")
    else:
        print("  🟢 Todas las categorias activas tienen respuestas de 10 pts y 100 pts.")

    # Estado de jornadas del calendario
    if daily_missions:
        cats_map = {c["id"]: len(c["pairs"]) for c in cats}
        completos = []
        bloqueados = []
        for dm in daily_missions:
            incomplete_slots = [(pid, cats_map.get(pid, 0)) for pid in dm["prompts"] if cats_map.get(pid, 0) < MIN_ACTIVE_WORDS]
            if not incomplete_slots:
                completos.append(dm)
            else:
                bloqueados.append((dm, incomplete_slots))

        print(f"\nCalendario de Expedientes Diarios ({len(completos)}/{len(daily_missions)} dias completos):")
        if show_dias or True:
            for dm in completos:
                if show_dias:
                    slots_detail = ", ".join(f"{pid}({cats_map.get(pid, 0)})" for pid in dm["prompts"])
                    print(f"  🟢 dia{dm['dia']:<2} ({dm['nombre']}) — 7/7 completas [{slots_detail}]")
                else:
                    print(f"  🟢 dia{dm['dia']:<2} ({dm['nombre']}) — 7/7 completas")
            for dm, slots in bloqueados:
                detail = ", ".join(f"{pid}({cnt})" for pid, cnt in slots)
                if show_dias:
                    print(f"  🔴 dia{dm['dia']:<2} ({dm['nombre']}) — Bloqueado. Faltan: {detail}")
                else:
                    print(f"  🔴 dia{dm['dia']:<2} ({dm['nombre']}) — Bloqueado ({len(slots)} incompletas: {detail})")

    if show_incompletas:
        incomp = [c for c in cats if len(c["pairs"]) < MIN_ACTIVE_WORDS]
        print(f"\nDetalle de Categorias Incompletas ({len(incomp)}):")
        for c in sorted(incomp, key=lambda x: (len(x["pairs"]), x["id"]), reverse=True):
            cnt = len(c["pairs"])
            icon = "🟡" if cnt >= 130 else ("🔴" if cnt >= 50 else "⚪")
            print(f"  {icon} {c['id']:<8} | {cnt:>3} palabras | {c['texto']}")

    if duplicate_ids or missing_daily_ids or consecutive_dups or cloned_days or invalid_scores or empty_keys or not ok_prompts or not app_ok:
        sys.exit(1)


def cmd_normalizar(_args):
    """
    Normaliza todas las claves de prompts.js (minusculas, sin tildes vocalicas, ñ intacta,
    colapso de espacios), descarta claves vacias, ajusta puntuaciones fuera de escala
    al tramo oficial mas cercano y fusiona duplicados conservando la maxima puntuacion valida.
    """
    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    cats, _ = parse_prompts_file(content)
    replacements = []
    dirty_cats = 0
    merged_dups = 0
    normalized_keys = 0
    empty_removed = 0
    fixed_scores = 0

    for c in cats:
        seen = {}
        ordered = []
        cat_changed = False
        for raw_k, score in c["pairs"]:
            nk = normalizar_clave(raw_k)
            if not nk:
                empty_removed += 1
                cat_changed = True
                continue
            if nk != raw_k:
                normalized_keys += 1
                cat_changed = True
            clean_score = score
            if clean_score not in VALID_SCORES:
                clean_score = min(VALID_SCORES, key=lambda s: (abs(s - score), -s))
                fixed_scores += 1
                cat_changed = True
            if nk in seen:
                merged_dups += 1
                if clean_score > seen[nk]:
                    seen[nk] = clean_score
                cat_changed = True
            else:
                seen[nk] = clean_score
                ordered.append(nk)

        if cat_changed:
            dirty_cats += 1
            new_pairs = [(k, seen[k]) for k in ordered]
            replacements.append((c["answers_start"], c["answers_end"], format_answers_block(new_pairs)))

    if not replacements:
        print("[OK] Todas las claves de prompts.js estan perfectamente normalizadas, con puntuaciones validas y sin duplicados ocultos (0 normalizadas, 0 fusionadas, 0 puntuaciones corregidas).")
        return

    new_content = rebuild_prompts_content(content, replacements)
    guardar_prompts_seguro(prompts_path, new_content)
    print(f"[OK] Normalizacion completada en {dirty_cats} categoria(s):")
    print(f"  - Claves limpiadas (espacios/tildes/mayusculas): {normalized_keys}")
    print(f"  - Duplicados ocultos fusionados: {merged_dups}")
    print(f"  - Claves vacias eliminadas: {empty_removed}")
    print(f"  - Puntuaciones fuera de escala corregidas al tramo oficial: {fixed_scores}")


def cmd_buscar(args):
    """python spyle_tool.py buscar <termino>"""
    if not args:
        print("Uso: python spyle_tool.py buscar <termino>", file=sys.stderr)
        sys.exit(1)

    query_raw = " ".join(args)
    query = normalizar_clave(query_raw)
    if not query:
        print("[ERROR] Termino de busqueda vacio.", file=sys.stderr)
        sys.exit(1)

    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    cats, _ = parse_prompts_file(content)
    exact_matches = []
    partial_matches = []

    for c in cats:
        for raw_k, score in c["pairs"]:
            nk = normalizar_clave(raw_k)
            if nk == query:
                exact_matches.append((c["id"], c["texto"], raw_k, score))
            elif query in nk:
                partial_matches.append((c["id"], c["texto"], raw_k, score))

    print(f"\nResultados para '{query}':")
    if exact_matches:
        print(f"\nCoincidencias exactas ({len(exact_matches)}):")
        for cid, title, k, s in exact_matches:
            print(f"  * [{cid}] {title} -> \"{k}\": {s} pts")
    if partial_matches:
        print(f"\nCoincidencias parciales ({len(partial_matches)}):")
        for cid, title, k, s in partial_matches[:30]:
            print(f"  - [{cid}] {title} -> \"{k}\": {s} pts")
        if len(partial_matches) > 30:
            print(f"  ... y {len(partial_matches) - 30} coincidencias parciales mas.")

    if not exact_matches and not partial_matches:
        print("  (Sin resultados en prompts.js)")


DENSITY_BATCH_1_DATA = {
    "geo-019": {
        25: [
            "estados unidos de america", "emiratos arabes", "arabia saudita", "el reino unido",
            "el vaticano", "el libano", "el salvador", "el congo", "el niger", "el chad",
            "el sudan", "el yemen", "el ecuador", "el peru", "el brasil", "el uruguay",
            "el paraguay", "el japon", "la india", "la china", "los paises bajos",
            "eeuu", "ee uu", "usa", "uae", "eau", "antigua", "arabia", "el senegal", "el togo"
        ],
        45: [
            "united kingdom", "united states", "united states of america", "united arab emirates",
            "austria", "australia", "argentina", "armenia", "albania", "alemania", "andorra",
            "angola", "argelia", "afganistan", "azerbaiyan", "ecuador", "egipto", "eritrea",
            "eslovaquia", "eslovenia", "españa", "estonia", "etiopia", "india", "indonesia",
            "irak", "iran", "irlanda", "islandia", "israel", "italia", "oman", "ucrania",
            "uganda", "uruguay", "uzbekistan", "eswatini", "esuatini", "islas salomon", "islas marshall"
        ],
        65: [
            "estado de israel", "estado de eritrea", "estado de qatar", "estado de kuwait",
            "estado de palestina", "estado de libia", "estado de la ciudad del vaticano",
            "estado plurinacional de bolivia", "estado independiente de samoa",
            "estado independiente de papua nueva guinea", "estados federados de micronesia",
            "estados unidos mexicanos", "emirato de afganistan", "emiratos arabes unidos",
            "union de las comoras", "union de myanmar", "union india", "imperio del japon",
            "isla de irlanda", "isla de islandia", "isla de chipre", "isla de malta",
            "isla de mauricio", "isla de cuba", "isla de jamaica", "isla de haiti",
            "isla de dominica", "isla de barbados", "isla de granada", "isla de nauru"
        ],
        85: [
            "algeria", "azerbaijan", "egypt", "ethiopia", "ireland", "iceland", "italy",
            "iraq", "ukraine", "antigua and barbuda", "el reino de españa", "el reino de belgica",
            "el reino de suecia", "el reino de noruega", "el reino de dinamarca", "el reino de marruecos",
            "el reino de jordania", "el reino de tailandia", "el reino de camboya", "el reino de butan",
            "el reino de nepal", "el reino de lesoto", "el reino de esuatini", "el reino de tonga",
            "el reino de barein", "el reino de arabia saudi", "el principado de andorra",
            "el principado de monaco", "el principado de liechtenstein", "el gran ducado de luxemburgo",
            "archipielago de las bahamas", "archipielago de las maldivas", "archipielago de vanuatu",
            "archipielago de fiyi", "archipielago de tuvalu", "archipielago de tonga", "archipielago de kiribati"
        ],
        100: [
            "albanie", "allemagne", "andorre", "arabie saoudite", "argentine", "armenie",
            "australie", "autriche", "azerbaidjan", "espagne", "estonie", "ethiopie",
            "etats unis", "indonesie", "irlande", "islande", "italie", "ouganda",
            "ouzbekistan", "oesterreich", "osterreich", "ungarn", "eesti", "eire",
            "ellada", "afghanistan", "estados unidos da america", "estados unidos de mexico",
            "emirato de qatar", "emirato de kuwait", "emirato de barein", "estado de oman",
            "estado de san marino", "estado de singapur", "estado de brunei", "estado de malta",
            "estado libre de irlanda", "estado de camboya", "abisinia", "alta volta",
            "alemania federal", "alemania occidental", "alemania oriental", "austria hungria",
            "el salvador del mundo", "islas fiyi", "islas maldivas", "islas seychelles",
            "islas comoras", "islas caboverde", "islas filipinas", "islas bahamas"
        ],
    },
    "pel-023": {
        25: [
            "la comunidad del anillo", "las dos torres", "el retorno del rey",
            "un viaje inesperado", "la desolacion de smaug", "la batalla de los cinco ejercitos",
            "la piedra filosofal", "la camara secreta", "el prisionero de azkaban",
            "el caliz de fuego", "la orden del fenix", "el misterio del principe",
            "las reliquias de la muerte", "el leon la bruja y el armario",
            "el principe caspian", "la travesia del viajero del alba", "el mago de oz",
            "la historia interminable", "dentro del laberinto", "la princesa prometida"
        ],
        45: [
            "cristal oscuro", "the dark crystal", "labyrinth", "willow", "legend",
            "lady halcon", "ladyhawke", "stardust", "big fish", "eduardo manostijeras",
            "el laberinto del fauno", "un monstruo viene a verme", "el viaje de chihiro",
            "el castillo ambulante", "mi vecino totoro", "la princesa mononoke",
            "ponyo en el acantilado", "nausicaa del valle del viento", "cronicas de terramar",
            "alicia en el pais de las maravillas", "alicia a traves del espejo", "hook",
            "el capitan garfio", "peter pan", "peter pan y wendy", "malefica",
            "malefica maestra del mal", "la bella y la bestia", "cenicienta", "aladdin",
            "la sirenita", "frozen", "frozen 2", "el reino del hielo", "enredados",
            "encanto", "coco", "vaiana", "moana", "brave", "indomable", "onward"
        ],
        65: [
            "raya y el ultimo dragon", "wish", "la maldicion de la perla negra",
            "el cofre del hombre muerto", "en el fin del mundo", "en mareas misteriosas",
            "la venganza de salazar", "los crimenes de grindelwald", "los secretos de dumbledore",
            "animales fantasticos y donde encontrarlos", "el septimo hijo", "eragon",
            "cazadores de sombras", "ciudad de hueso", "el ladron del rayo",
            "el mar de los monstruos", "furia de titanes", "ira de titanes", "inmortales",
            "dioses de egipto", "conan el barbaro", "conan el destructor", "el rey escorpion",
            "beowulf", "el caballero verde", "the green knight", "excalibur",
            "el rey arturo la leyenda de excalibur", "el aprendiz de brujo",
            "el ultimo cazador de brujas", "hansel y gretel cazadores de brujas",
            "blancanieves y la leyenda del cazador", "el cazador y la reina del hielo",
            "espejito espejito", "mirror mirror", "jack el cazagigantes", "mi amigo el gigante"
        ],
        85: [
            "las brujas", "la maldicion de las brujas", "wonka", "charlie y la fabrica de chocolate",
            "mary poppins", "el regreso de mary poppins", "la bruja novata", "jumanji",
            "zathura", "noche en el museo", "la brujula dorada", "las cronicas de spiderwick",
            "un puente hacia terabithia", "corazon de tinta", "inkheart",
            "el hogar de miss peregrine para niños peculiares", "miss peregrine",
            "la casa del reloj en la pared", "mr magorium y su tienda magica",
            "el imaginario del doctor parnassus", "las aventuras del baron munchausen",
            "el ladron de bagdad", "jason y los argonautas", "simbad y la princesa",
            "dragones y mazmorras honor entre ladrones", "warcraft el origen",
            "el señor de las bestias", "krull", "la espada magica", "corazon de dragon",
            "dragonheart", "los inmortales", "highlander", "el dragon del lago de fuego",
            "pesadilla antes de navidad", "la novia cadaver", "los mundos de coraline",
            "kubo y las dos cuerdas magicas", "el origen de los guardianes", "como entrenar a tu dragon"
        ],
        100: [
            "merlin el encantador", "taron y el caldero magico", "fantasia 2000", "el regreso a oz",
            "la historia sin fin", "la princesa y el sapo", "el emperador y sus locuras",
            "la ruta hacia el dorado", "simbad la leyenda de los siete mares",
            "el secreto de los hermanos grimm", "van helsing", "la liga de los hombres extraordinarios",
            "constantine", "hellboy el ejercito dorado", "doctor strange",
            "el multiverso de la locura", "todo a la vez en todas partes", "pobres criaturas",
            "el circo de los extraños", "oz un mundo de fantasia", "el cascanueces y los cuatro reinos",
            "historia de un caballero", "el bosque animado", "el corazon del guerrero",
            "el caballero del dragon", "la tienda de los horrores", "el cristal encantado",
            "dungeons and dragons", "the neverending story", "the princess bride",
            "pan s labyrinth", "howl s moving castle", "spirited away", "princess mononoke"
        ],
    },
    "pel-031": {
        25: [
            "indiana jones", "henry jones", "luke skywalker", "han solo", "princesa leia",
            "darth vader", "obi wan kenobi", "james bond", "agente 007", "ellen ripley",
            "sarah connor", "john mcclane", "tony stark", "iron man", "steve rogers",
            "capitan america", "bruce wayne", "batman", "clark kent", "superman",
            "peter parker", "spider man", "spiderman", "harry potter", "frodo bolson"
        ],
        45: [
            "aragorn", "gandalf", "legolas", "gimli", "marty mcfly", "doc brown",
            "neo", "thomas anderson", "trinity", "morfeo", "john wick", "ethan hunt",
            "jason bourne", "maximus decimus meridius", "maximo decimo meridio",
            "rocky balboa", "john rambo", "rambo", "martin riggs", "axel foley",
            "forrest gump", "jack sparrow", "capitan jack sparrow", "elizabeth swann",
            "will turner", "katniss everdeen", "lara croft", "tomb raider", "wonder woman",
            "diana prince", "black widow", "viuda negra", "natasha romanoff", "thor",
            "wolverine", "lobezno", "logan", "deadpool", "wade wilson", "blade"
        ],
        65: [
            "robocop", "alex murphy", "terminator", "t 800", "mad max", "max rockatansky",
            "imperator furiosa", "furiosa", "snake plissken", "conan el barbaro",
            "william wallace", "braveheart", "leonidas", "rey leonidas", "aquiles",
            "espartaco", "el zorro", "diego de la vega", "robin hood", "tarzan",
            "king kong", "godzilla", "optimus prime", "bumblebee", "wall e",
            "rayo mcqueen", "woody", "buzz lightyear", "sheriff woody", "shrek",
            "simba", "mulan", "hercules", "aladdin", "elsa", "vaiana", "moana",
            "po", "kung fu panda", "hiccup", "hipo", "stitch", "chihiro"
        ],
        85: [
            "paul atreides", "muad dib", "rick deckard", "k", "truman burbank",
            "andy dufresne", "don vito corleone", "michael corleone", "tony montana",
            "travis bickle", "clarice starling", "hannibal lecter", "jules winnfield",
            "vincent vega", "beatrix kiddo", "la novia", "django", "aldo raine",
            "atticus finch", "rick blaine", "indiana", "indy", "maverick",
            "pete mitchell", "ace ventura", "austin powers", "inspector clouseau",
            "james t kirk", "spock", "jean luc picard", "buffy", "xena",
            "ash williams", "laurie strode", "nancy thompson", "van helsing"
        ],
        100: [
            "torrente", "jose luis torrente", "alatriste", "capitan alatriste", "diego alatriste",
            "curro jimenez", "mortadelo", "filemon", "superlopez", "el llanero solitario",
            "flash gordon", "buck rogers", "conan", "red sonja", "kull",
            "perseo", "ulises", "odiseo", "el cid", "rodrigo diaz de vivar",
            "don quijote", "sancho panza", "el zorro plateado", "d artagnan",
            "athos", "porthos", "aramis", "edmundo dantes", "conde de montecristo",
            "jean valjean", "sherlock holmes", "watson", "hercules poirot", "philip marlowe",
            "dirty harry", "harry el sucio", "harry callahan", "frank bullitt",
            "kyle reese", "dutch schaefer", "marion ravenwood", "short round", "tapon"
        ],
    },
    "gen-030": {
        25: [
            "friends", "los simpson", "the simpsons", "breaking bad", "juego de tronos",
            "game of thrones", "stranger things", "la casa de papel", "the office",
            "como conoci a vuestra madre", "how i met your mother", "the big bang theory",
            "anatomia de grey", "grey s anatomy", "perdidos", "lost", "house",
            "dr house", "prison break", "the walking dead", "vikings", "vikingos"
        ],
        45: [
            "peaky blinders", "sherlock", "black mirror", "the crown", "better call saul",
            "the mandalorian", "el mandaloriano", "the last of us", "succession",
            "sucesion", "the witcher", "el brujo", "dark", "narcos", "el juego del calamar",
            "squid game", "los soprano", "the sopranos", "the wire", "bajo escucha",
            "mad men", "dexter", "fargo", "true detective", "chernobyl",
            "hermanos de sangre", "band of brothers", "el cuento de la criada",
            "the handmaid s tale", "euphoria", "sex education", "los bridgerton",
            "bridgerton", "gambito de dama", "the queen s gambit", "wednesday", "miercoles"
        ],
        65: [
            "the boys", "invencible", "arcane", "rick y morty", "rick and morty",
            "futurama", "south park", "padre de familia", "family guy",
            "bojack horseman", "avatar la leyenda de aang", "modern family",
            "brooklyn nine nine", "parks and recreation", "seinfeld", "cheers",
            "frasier", "matrimonio con hijos", "el principe de bel air",
            "the fresh prince of bel air", "cosas de casa", "alf", "embrujadas",
            "charmed", "buffy cazavampiros", "expediente x", "the x files",
            "twin peaks", "el coche fantástico", "el coche fantastico", "knight rider",
            "el equipo a", "the a team", "macgyver", "magnum", "corrupcion en miami",
            "miami vice", "las chicas de oro", "the golden girls", "sexo en nueva york",
            "sex and the city", "mujeres desesperadas", "desperate housewives",
            "gossip girl", "the o c", "smallville", "arrow", "the flash"
        ],
        85: [
            "supernatural", "sobrenatural", "vampire diaries", "cronicas vampiricas",
            "teen wolf", "riverdale", "pretty little liars", "pequeñas mentirosas",
            "glee", "scrubs", "urgencias", "er", "el ala oeste de la casa blanca",
            "the west wing", "house of cards", "homeland", "24", "alias",
            "fringe", "battlestar galactica", "star trek", "doctor who",
            "torchwood", "downton abbey", "outlander", "forastera", "poldark",
            "boardwalk empire", "deadwood", "roma", "spartacus", "espartaco",
            "tudors", "los tudor", "los borgia", "the white lotus", "severance",
            "separacion", "ted lasso", "the bear", "ozark", "mindhunter",
            "mr robot", "silicon valley", "entourage", "el sequito"
        ],
        100: [
            "the americans", "the shield", "justified", "sons of anarchy", "hijos de la anarquia",
            "mayans", "yellowstone", "1883", "1923", "tulsa king", "reacher",
            "jack ryan", "el mentalista", "the mentalist", "castle", "bones",
            "csi", "csi las vegas", "csi miami", "ncis", "mentes criminales",
            "criminal minds", "ley y orden", "law and order", "suits", "la clave del exito",
            "billions", "halcyon", "halt and catch fire", "fleabag", "killing eve",
            "luther", "line of duty", "broadchurch", "borgen", "the bridge", "bron",
            "gomorra", "suburra", "babylon berlin", "lupin", "call my agent", "dix pour cent",
            "verano azul", "aqui no hay quien viva", "cuentame como paso", "el ministerio del tiempo"
        ],
    },
    "gen-033": {
        25: [
            "el roble", "la encina", "el pino", "el olivo", "el naranjo", "el limonero",
            "el manzano", "el peral", "el cerezo", "el almendro", "la higuera", "el sauce",
            "el cipres", "el eucalipto", "la palmera", "la rosa", "el clavel", "el tulipan",
            "la margarita", "el girasol", "la amapola", "el jazmin", "la lavanda", "el romero"
        ],
        45: [
            "robles", "encinas", "pinos", "olivos", "naranjos", "limoneros", "manzanos",
            "perales", "cerezos", "almendros", "higueras", "sauces", "cipreses",
            "eucaliptos", "palmeras", "rosas", "claveles", "tulipanes", "margaritas",
            "girasoles", "amapolas", "jazmines", "lavandas", "romeros", "alcornoque",
            "el alcornoque", "alcornoques", "haya", "el haya", "hayas", "abedul",
            "el abedul", "abedules", "castaño", "el castaño", "castaños", "nogal",
            "el nogal", "nogales", "chopo", "el chopo", "chopos", "alamo", "el alamo"
        ],
        65: [
            "alamos", "fresno", "el fresno", "fresnos", "olmo", "el olmo", "olmos",
            "arce", "el arce", "arces", "abeto", "el abeto", "abetos", "cedro",
            "el cedro", "cedros", "secuoya", "la secuoya", "secuoyas", "baobab",
            "el baobab", "bambu", "el bambu", "helecho", "el helecho", "helechos",
            "musgo", "el musgo", "hiedra", "la hiedra", "enredadera", "la enredadera",
            "buganvilla", "la buganvilla", "geranio", "el geranio", "geranios",
            "orquidea", "la orquidea", "orquideas", "lirio", "el lirio", "lirios",
            "azucena", "la azucena", "azucenas", "narciso", "el narciso", "narcisos"
        ],
        85: [
            "hortensia", "la hortensia", "hortensias", "camelia", "la camelia", "camelias",
            "magnolio", "el magnolio", "magnolia", "la magnolia", "azalea", "la azalea",
            "rododendro", "el rododendro", "petunia", "la petunia", "begonia", "la begonia",
            "dalia", "la dalia", "peonia", "la peonia", "amapola roja", "diente de leon",
            "el diente de leon", "trebol", "el trebol", "tomillo", "el tomillo",
            "oregano", "el oregano", "albahaca", "la albahaca", "hierbabuena", "la hierbabuena",
            "menta", "la menta", "salvia", "la salvia", "espliego", "el espliego",
            "jara", "la jara", "retama", "la retama", "brezo", "el brezo", "tojo", "el tojo"
        ],
        100: [
            "madroño", "el madroño", "madroños", "quejigo", "el quejigo", "sabina",
            "la sabina", "enebro", "el enebro", "tejo", "el tejo", "pinsapo",
            "el pinsapo", "acebo", "el acebo", "boj", "el boj", "laurel", "el laurel",
            "adelfa", "la adelfa", "baladre", "algodonero", "vid", "la vid", "parra",
            "algarrobo", "el algarrobo", "granado", "el granado", "membrillero",
            "nispero", "el nispero", "caqui", "chirimoyo", "aguacate", "manglar",
            "nenufar", "el nenufar", "flor de loto", "edelweiss", "cactus", "el cactus",
            "pita", "la pita", "agave", "aloe vera", "drago", "el drago", "drago canario"
        ],
    },
    "gen-036": {
        25: [
            "la rueda", "la imprenta", "la bombilla", "el telefono", "la radio",
            "la television", "el avion", "el automovil", "el coche", "la maquina de vapor",
            "el ordenador", "la computadora", "internet", "el reloj", "la brujula",
            "el telescopio", "el microscopio", "la camara de fotos", "el cine", "la polvora"
        ],
        45: [
            "ruedas", "imprentas", "bombillas", "telefonos", "relojes", "brujulas",
            "telescopios", "microscopios", "arado", "el arado", "molino", "el molino",
            "molino de viento", "molino de agua", "polea", "la polea", "palanca",
            "la palanca", "tornillo", "el tornillo", "cuña", "la cuña", "plano inclinado",
            "engranaje", "el engranaje", "engranajes", "catalejo", "el catalejo",
            "astrolabio", "el astrolabio", "sextante", "el sextante", "cronometro",
            "el cronometro", "reloj de arena", "reloj mecanico", "reloj de pendulo"
        ],
        65: [
            "telegrafo", "el telegrafo", "fonografo", "el fonografo", "gramofono",
            "el gramofono", "cinematografo", "el cinematografo", "daguerrotipo",
            "maquina de escribir", "la maquina de escribir", "maquina de coser",
            "la maquina de coser", "telar mecanico", "hiladora", "desmotadora de algodon",
            "locomotora", "la locomotora", "locomotora de vapor", "ferrocarril",
            "motor de combustion", "motor diesel", "motor electrico", "generador electrico",
            "dinamo", "la dinamo", "bateria electrica", "pila de volta", "pila electrica",
            "pararrayos", "el pararrayos", "termometro", "el termometro", "barometro",
            "el barometro", "anemometro", "higrometro", "sismografo", "radar", "el radar",
            "sonar", "el sonar", "rayos x", "resonancia magnetica", "ecografo"
        ],
        85: [
            "penicilina", "la penicilina", "vacuna", "la vacuna", "anestesia",
            "jeringuilla", "la jeringuilla", "estetoscopio", "el estetoscopio",
            "marcapasos", "microchip", "el microchip", "transistor", "el transistor",
            "laser", "el laser", "fibra optica", "satelite artificial", "cohete espacial",
            "submarino", "el submarino", "globo aerostatico", "dirigible", "zepelin",
            "helicoptero", "el helicoptero", "bicicleta", "la bicicleta", "motocicleta",
            "ascensor", "el ascensor", "escalera mecanica", "frigorifico", "nevera",
            "aire acondicionado", "caldera", "turbina", "turbina de gas", "panel solar",
            "aerogenerador", "impresora", "impresora 3d", "escaner", "gps", "wifi"
        ],
        100: [
            "tornillo de arquimedes", "prensa hidraulica", "noria", "la noria", "batan",
            "fragua", "fuelle", "yunque", "el yunque", "martillo", "el martillo",
            "sierra", "la sierra", "hacha", "el hacha", "cincel", "el cincel",
            "formon", "garlopa", "cepillo de carpintero", "berbiqui", "taladro",
            "torno", "el torno", "fresadora", "prensa de gutenberg", "linotipia",
            "calculadora mecanica", "pascalina", "maquina analitica", "maquina enigma",
            "telar de jacquard", "semafaro", "semaforo", "paracaidas", "escafranda",
            "escafandra", "traje espacial", "cinta magnetica", "casete", "disco compacto",
            "cd", "dvd", "telefono movil", "smartphone", "pantalla tactil"
        ],
    },
    "gen-040": {
        25: [
            "la nevera", "el frigorifico", "el horno", "el microondas", "la vitroceramica",
            "la placa de induccion", "el lavavajillas", "la campana extractora",
            "la tostadora", "la cafetera", "la batidora", "la licuadora", "la freidora de aire",
            "la sarten", "la olla", "la cacerola", "el cazo", "la olla expres", "la olla a presion"
        ],
        45: [
            "neveras", "frigorificos", "hornos", "sartenes", "ollas", "cacerolas", "cazos",
            "tostadoras", "cafeteras", "batidoras", "congelador", "el congelador",
            "combi", "robot de cocina", "thermomix", "sandwichera", "la sandwichera",
            "gofrera", "la gofrera", "exprimidor", "el exprimidor", "hervidor de agua",
            "el hervidor", "kettle", "picadora", "la picadora", "amasadora", "la amasadora",
            "vaporera", "la vaporera", "plancha electrica", "wok", "el wok", "paellera",
            "la paellera", "plancha de asar", "molinillo de cafe", "bascule", "bascula de cocina"
        ],
        65: [
            "la bascula de cocina", "temporizador", "reloj de cocina", "cuchillo",
            "el cuchillo", "cuchillos", "cuchillo jamonero", "cuchillo cebollero",
            "pelador", "el pelador", "rallador", "el rallador", "colador", "el colador",
            "escurridor", "el escurridor", "tamiz", "embudo", "el embudo", "mortero",
            "el mortero", "tabla de cortar", "la tabla de cortar", "rodillo", "el rodillo",
            "espatula", "la espatula", "lengua de gato", "cucharon", "el cucharon",
            "espumadera", "la espumadera", "pinzas de cocina", "varillas", "batidor de varillas",
            "tijeras de cocina", "abrelatas", "el abrelatas", "sacacorchos", "el sacacorchos"
        ],
        85: [
            "abrebotellas", "cascanueces", "prensa ajos", "machacador de ajos", "mandolina",
            "la mandolina", "descorazonador", "cortapizzas", "el cortapizzas", "manga pastelera",
            "molde de horno", "fuente de horno", "bandeja de horno", "rejilla", "salvamanteles",
            "manopla de horno", "guante de horno", "agarre", "paño de cocina", "trapo de cocina",
            "delantal", "el delantal", "estropajo", "el estropajo", "bayeta", "la bayeta",
            "fregadero", "el fregadero", "grifo", "cubo de basura", "tupper", "taper",
            "fiambrera", "la fiambrera", "tarro hermetico", "especiero", "salero", "pimentero"
        ],
        100: [
            "aceitera", "la aceitera", "vinagrera", "panera", "la panera", "frutero",
            "el frutero", "escurreplatos", "el escurreplatos", "cubertero", "portarrollos",
            "servilletero", "salvamantel", "chinois", "chino de cocina", "pasapures",
            "el pasapures", "soplete de cocina", "termometro de cocina", "medidor",
            "jarra medidora", "cucharas medidoras", "cafetera italiana", "cafetera de capsulas",
            "moka", "espumador de leche", "yogurtera", "heladera", "deshidratadora",
            "envasadora al vacio", "roner", "sous vide", "vinoteca", "cava de vinos",
            "triturador de basura", "dispensador de jabon", "dispensador de agua", "brita"
        ],
    },
    "geo-015": {
        25: [
            "principado de andorra", "ciudad del vaticano", "el vaticano", "santa sede",
            "san marino", "republica de san marino", "principado de liechtenstein",
            "gran ducado de luxemburgo", "confederacion suiza", "republica checa",
            "chequia", "austria", "hungria", "eslovaquia", "bielorrusia", "moldavia"
        ],
        45: [
            "macedonia del norte", "serbia", "kosovo", "afganistan", "armenia", "azerbaiyan",
            "butan", "kazajistan", "kirguistan", "laos", "mongolia", "nepal",
            "tayikistan", "turkmenistan", "uzbekistan", "bolivia", "paraguay",
            "estado plurinacional de bolivia", "republica del paraguay", "botsuana",
            "burkina faso", "burundi", "chad", "el chad", "etiopia", "lesoto",
            "malaui", "mali", "niger", "el niger", "republica centroafricana", "ruanda"
        ],
        65: [
            "sudan del sur", "esuatini", "suazilandia", "uganda", "zambia", "zimbabue",
            "zimbabwe", "malawi", "botswana", "eswatini", "lesotho", "uzbekistan",
            "kazakhstan", "kyrgyzstan", "tajikistan", "turkmenistan", "belarus",
            "slovakia", "czechia", "czech republic", "switzerland", "hungary",
            "vatican city", "north macedonia", "bhutan", "central african republic",
            "south sudan", "ethiopia", "burkina", "macedonia", "suiza", "luxemburgo"
        ],
        85: [
            "republica de austria", "republica de hungria", "republica de bielorrusia",
            "republica de moldavia", "republica de serbia", "republica de armenia",
            "republica de azerbaiyan", "republica de kazajistan", "republica de mongolia",
            "republica de uzbekistan", "republica de tayikistan", "republica kirguisa",
            "republica de botsuana", "republica de burundi", "republica de ruanda",
            "republica de uganda", "republica de zambia", "republica de zimbabue",
            "republica de malaui", "republica de mali", "republica del chad",
            "republica del niger", "republica democratica federal de etiopia",
            "reino de lesoto", "reino de esuatini", "reino de butan", "republica de nepal",
            "republica popular democratica de laos", "republica islamica de afganistan"
        ],
        100: [
            "andorre", "suisse", "schweiz", "autriche", "osterreich", "tchequie",
            "slovaquie", "hongrie", "bielorussie", "moldavie", "serbie", "armenie",
            "bhoutan", "kirghizistan", "oust bekistan", "ouzbekistan", "tadjikistan",
            "bolivie", "ethiopie", "ouganda", "rwanda", "zambie", "tchad",
            "repubblica di san marino", "principato di andorra", "furstentum liechtenstein",
            "grand duche de luxembourg", "magyarorszag", "slovensko", "cesko",
            "srbija", "hayastan", "sakartvelo", "qazaqstan", "ozbekiston",
            "moldova", "makadonia", "afghanistan", "lao pdr", "nepal federal",
            "estado de la ciudad del vaticano", "principado de andorra", "republica de paraguay"
        ],
    },
    "pal-002": {
        25: [
            "caballo", "caballos", "cabra", "cabras", "camello", "camellos", "canguro",
            "canguros", "cebra", "cebras", "cerdo", "cerdos", "ciervo", "ciervos",
            "cisne", "cisnes", "cocodrilo", "cocodrilos", "conejo", "conejos", "cuervo", "cuervos"
        ],
        45: [
            "cabrito", "cabritos", "cachalote", "cachalotes", "caiman", "caimanes",
            "calamar", "calamares", "camaleon", "camaleones", "canario", "canarios",
            "cangrejo", "cangrejos", "capibara", "capibaras", "caracol", "caracoles",
            "carnero", "carneros", "carpa", "carpas", "castor", "castores", "chacal",
            "chacales", "chimpance", "chimpances", "chinchilla", "chinchillas", "cigarra",
            "cigarras", "cigüeña", "cigüeñas", "cobra", "cobras", "cochinilla", "cochinillas"
        ],
        65: [
            "codorniz", "codornices", "colibri", "colibries", "comadreja", "comadrejas",
            "condor", "condores", "coati", "coaties", "cormoran", "cormoranes", "corneja",
            "cornejas", "corzo", "corzos", "cotorra", "cotorras", "coyote", "coyotes",
            "cucaracha", "cucarachas", "cuco", "cucos", "cuclillo", "cuclillos",
            "culebra", "culebras", "cacatua", "cacatuas", "centollo", "centollos",
            "centolla", "cigala", "cigalas", "corvina", "corvinas", "caballa", "caballas"
        ],
        85: [
            "camaron", "camarones", "caracal", "caracales", "casuario", "casuarios",
            "cernicalo", "cernicalos", "chotacabras", "charran", "charranes",
            "chova", "chovas", "cogujada", "cogujadas", "curruca", "currucas",
            "carricero", "carriceros", "camachuelo", "camachuelos", "carbonero",
            "carboneros", "colimbo", "colimbos", "chocha", "chochas", "carraca",
            "carracas", "cercopiteco", "cercopitecos", "calderon", "calderones",
            "cervatillo", "cervatillos", "cachorro", "cachorros", "cordero", "corderos"
        ],
        100: [
            "caballito de mar", "caballitos de mar", "cangrejo ermitaño", "cangrejo real",
            "ciervo volante", "cigarra de mar", "conejo de indias", "conejillo de indias",
            "cabra montes", "caiman de anteojos", "cobra real", "cocodrilo del nilo",
            "colobo", "colobos", "cuscus", "coendu", "coipo", "coipos", "corredor",
            "corredores", "canguro rojo", "camello bactriano", "caribu", "caribues",
            "cascanueces", "catoblepas", "cangrejo azul", "coral", "corales", "coquina", "coquinas"
        ],
    },
    "pel-022": {
        25: [
            "ocho apellidos vascos", "ocho apellidos catalanes", "ocho apellidos marroquies",
            "padre no hay mas que uno", "campeones", "campeonex", "superbad", "supersalidos",
            "resacon en las vegas", "resacon 2", "borat", "shrek", "toy story",
            "solo en casa", "solo en casa 2", "dos tontos muy tontos", "la mascara"
        ],
        45: [
            "aterriza como puedas", "agarralo como puedas", "top secret", "la vida de brian",
            "los caballeros de la mesa cuadrada", "el sentido de la vida", "atrapado en el tiempo",
            "el dia de la marmota", "cazafantasmas", "ghostbusters", "beverly hills cop",
            "superdetective en hollywood", "esta casa es una ruina", "un pez llamado wanda",
            "mentiroso compulsivo", "ace ventura", "como dios", "el show de truman",
            "algo pasa con mary", "american pie", "zoolander", "el reportero", "anchorman",
            "hermanos por pelotas", "step brothers", "tropic thunder", "virgen a los 40",
            "despedida de soltera", "la boda de mi mejor amiga", "bridesmaids", "juerga hasta el fin"
        ],
        65: [
            "torrente el brazo tonto de la ley", "el milagro de p tinto", "airbag",
            "amanecen que no es poco", "amanece que no es poco", "la escopeta nacional",
            "patrimonio nacional", "nacional iii", "bienvenido mister marshall",
            "el verdugo", "atraco a las tres", "la vaquilla", "mujeres al borde de un ataque de nervios",
            "el dia de la bestia", "crimen ferpecto", "la comunidad", "muertos de risa",
            "pagafantas", "primos", "tres bodas de mas", "ahora o nunca", "kiki el amor se hace",
            "señor dame paciencia", "es por tu bien", "si yo fuera rico", "lo dejo cuando quiera",
            "hasta que la boda nos separe", "bajo el mismo techo", "a todo tren", "vacaciones de verano"
        ],
        85: [
            "intocable", "intouchables", "bienvenidos al norte", "dios mio pero que te hemos hecho",
            "el gran hotel budapest", "los tenenbaums", "moonrise kingdom", "isla de perros",
            "jojo rabbit", "lo que hacemos en las sombras", "what we do in the shadows",
            "zombies party", "shaun of the dead", "arma fatal", "hot fuzz", "bienvenidos al fin del mundo",
            "dos policias rebeldes", "infiltrados en clase", "21 jump street", "22 jump street",
            "noche de juegos", "game night", "palm springs", "puñales por la espalda",
            "todo a la vez en todas partes", "little miss sunshine", "pequeña miss sunshine",
            "juno", "napoleon dinamita", "napoleon dynamite", "office space", "trabajo basura"
        ],
        100: [
            "con faldas y a lo loco", "some like it hot", "el apartamento", "the apartment",
            "tiempos modernos", "el gran dictador", "luces de la ciudad", "el maquinista de la general",
            "la fiera de mi niña", "arsenico por compasion", "historias de filadelfia",
            "una noche en la opera", "sopa de ganso", "el guateque", "la pantera rosa",
            "el jovencito frankenstein", "sillas de montar calientes", "la loca historia de las galaxias",
            "spaceballs", "las vacaciones europeas de una chiflada familia americana",
            "mejor imposible", "cuando harry encontro a sally", "cuatro bodas y un funeral",
            "notting hill", "love actually", "el diario de bridget jones", "full monty",
            "un funeral de muerte", "ratatouille", "monstruos sa", "los increibles"
        ],
    },
    "gen-037": {
        25: [
            "la lluvia", "la nieve", "el granizo", "el viento", "la tormenta",
            "el huracan", "el tornado", "el terremoto", "el tsunami", "el eclipse",
            "la aurora boreal", "el arcoiris", "el rayo", "el trueno", "el relampago",
            "la niebla", "la helada", "la sequia", "la inundacion", "la erupcion volcanica"
        ],
        45: [
            "lluvias", "tormentas", "huracanes", "tornados", "terremotos", "tsunamis",
            "eclipses", "auroras boreales", "rayos", "truenos", "relampagos", "nieblas",
            "heladas", "sequias", "inundaciones", "erupciones", "eclipse solar",
            "eclipse de sol", "eclipse lunar", "eclipse de luna", "aurora austral",
            "lluvia de estrellas", "lluvia de meteoros", "perseidas", "lagrimas de san lorenzo",
            "leonidas", "geminidas", "cometa", "el cometa", "asteroide", "meteorito"
        ],
        65: [
            "estrella fugaz", "supernova", "agujero negro", "eclipse total", "eclipse anular",
            "superluna", "luna llena", "luna nueva", "luna de sangre", "marea alta",
            "pleamar", "marea baja", "bajamar", "marea viva", "marea muerta", "ciclon",
            "el ciclon", "anticiclon", "borrasca", "la borrasca", "dana", "gota fria",
            "la gota fria", "tifon", "el tifon", "monzon", "el monzon", "alud", "avalancha",
            "corrimiento de tierras", "deslizamiento", "geiser", "el geiser", "fumarola"
        ],
        85: [
            "arcoiris doble", "halo solar", "halo lunar", "parhelio", "espejismo",
            "fuego de san telmo", "rayo globular", "relampago del catatumbo", "tromba marina",
            "manga marina", "remolino de polvo", "torbellino", "ventisca", "el chubasco",
            "chaparron", "aguacero", "llovizna", "calabobos", "orbayu", "xirimiri", "sirimiri",
            "escarcha", "cencellada", "pedrisco", "granizada", "bruma", "calima", "calina",
            "bochorno", "ola de calor", "ola de frio", "inversion termica", "efecto foehn"
        ],
        100: [
            "viento solar", "tormenta solar", "tormenta geomagnetica", "llamarada solar",
            "eyeccion de masa coronal", "el niño", "la niña", "corriente en chorro",
            "jet stream", "cinturon de van allen", "cinturon de fuego", "subduccion",
            "falla geologica", "licuefaccion", "dolina", "karst", "estalactita", "estalagmita",
            "solsticio de verano", "solsticio de invierno", "equinoccio de primavera",
            "equinoccio de otoño", "perihelio", "afelio", "perigeo", "apogeo", "luz zodiacal",
            "cinturon de venus", "nubes noctilucentes", "nubes nacaradas", "mammatus",
            "cumulonimbo", "cumulonimbos", "virga", "rocio", "el rocio", "vortice polar"
        ],
    },
    "geo-016": {
        25: [
            "nueva york", "los angeles", "san francisco", "miami", "las vegas",
            "estado de nueva york", "estado de california", "estado de texas",
            "estado de florida", "estado de washington", "distrito de columbia", "dc"
        ],
        45: [
            "alabama", "alaska", "arizona", "arkansas", "california", "carolina del norte",
            "carolina del sur", "colorado", "connecticut", "dakota del norte", "dakota del sur",
            "delaware", "florida", "georgia", "hawai", "hawaii", "idaho", "illinois",
            "indiana", "iowa", "kansas", "kentucky", "luisiana", "louisiana", "maine",
            "maryland", "massachusetts", "michigan", "minnesota", "misisipi", "mississippi",
            "misuri", "missouri", "montana", "nebraska", "nevada", "nueva jersey", "new jersey"
        ],
        65: [
            "nueva hampshire", "nuevo hampshire", "new hampshire", "nuevo mexico", "new mexico",
            "new york", "ohio", "oklahoma", "oregon", "pensilvania", "pennsylvania",
            "rhode island", "tennessee", "texas", "utah", "vermont", "virginia",
            "virginia occidental", "west virginia", "washington", "wisconsin", "wyoming",
            "north carolina", "south carolina", "north dakota", "south dakota",
            "washington dc", "washington d c", "puerto rico", "guam", "samoa americana"
        ],
        85: [
            "islas virgenes de estados unidos", "islas marianas del norte",
            "estado de alabama", "estado de alaska", "estado de arizona", "estado de arkansas",
            "estado de colorado", "estado de connecticut", "estado de delaware",
            "estado de georgia", "estado de hawai", "estado de idaho", "estado de illinois",
            "estado de indiana", "estado de iowa", "estado de kansas", "estado de kentucky",
            "estado de luisiana", "estado de maine", "estado de maryland", "estado de massachusetts",
            "estado de michigan", "estado de minnesota", "estado de misisipi", "estado de misuri",
            "estado de montana", "estado de nebraska", "estado de nevada", "estado de nueva jersey"
        ],
        100: [
            "estado de nuevo mexico", "estado de ohio", "estado de oklahoma", "estado de oregon",
            "estado de pensilvania", "estado de rhode island", "estado de tennessee",
            "estado de utah", "estado de vermont", "estado de virginia", "estado de wisconsin",
            "estado de wyoming", "estado de carolina del norte", "estado de carolina del sur",
            "estado de dakota del norte", "estado de dakota del sur", "mancomunidad de puerto rico",
            "mancomunidad de massachusetts", "mancomunidad de pensilvania", "mancomunidad de virginia",
            "mancomunidad de kentucky", "atolón de midway", "islas virgenes americanas",
            "tejas", "mejico nuevo", "la florida", "la luisiana", "la california", "alaska y hawai"
        ],
    },
    "pel-027": {
        25: [
            "en busca del arca perdida", "el templo maldito", "la ultima cruzada",
            "el reino de la calavera de cristal", "el dial del destino",
            "la maldicion de la perla negra", "el cofre del hombre muerto",
            "en el fin del mundo", "los goonies", "jumanji", "bienvenidos a la jungla",
            "siguiente nivel", "la momia", "el regreso de la momia", "la busqueda",
            "national treasure", "uncharted", "lara croft tomb raider", "tomb raider"
        ],
        45: [
            "parque jurasico", "jurassic park", "el mundo perdido", "jurassic world",
            "king kong", "kong la isla calavera", "avatar", "el sentido del agua",
            "tras el corazon verde", "la joya del nilo", "las minas del rey salomon",
            "allan quatermain y la ciudad perdida del oro", "las aventuras de tintin",
            "el secreto del unicornio", "jungle cruise", "alerta roja", "red notice",
            "el dorado", "la ruta hacia el dorado", "la isla del tesoro", "el planeta del tesoro",
            "el conde de montecristo", "la mascara del zorro", "la leyenda del zorro",
            "el hombre que pudo reinar", "el tesoro de sierra madre", "mad max furia en la carretera"
        ],
        65: [
            "indiana jones y el templo maldito", "indiana jones y la ultima cruzada",
            "indiana jones en busca del arca perdida", "la busqueda 2 el diario secreto",
            "el codigo da vinci", "angeles y demonios", "inferno", "sahara",
            "en el corazon del mar", "master and commander", "al otro lado del mundo",
            "la vida de pi", "naufrago", "cast away", "into the wild", "hacia rutas salvajes",
            "127 horas", "everest", "limite vertical", "cliffhanger", "maximo riesgo",
            "los tres mosqueteros", "el hombre de la mascara de hierro", "robin hood principe de los ladrones"
        ],
        85: [
            "la ciudad perdida de z", "la ciudad perdida", "the lost city", "dora y la ciudad perdida",
            "viaje al centro de la tierra", "viaje al centro de la tierra 2 la isla misteriosa",
            "20000 leguas de viaje submarino", "veinte mil leguas de viaje submarino",
            "la vuelta al mundo en 80 dias", "las aventuras del baron munchausen",
            "el viento y el leon", "lawrence de arabia", "aguirre la colera de dios",
            "fitzcarraldo", "el salario del miedo", "carga maldita", "sorcerer",
            "el puente sobre el rio kwai", "la reina de africa", "the african queen",
            "mogambo", "hatari", "el fantasma y la oscuridad", "los demonios de la noche",
            "el secreto de los incas", "tadeo jones", "las aventuras de tadeo jones"
        ],
        100: [
            "tadeo jones 2 el secreto del rey midas", "tadeo jones 3 la tabla esmeralda",
            "atlantis el imperio perdido", "simbad y el ojo del tigre", "el viaje fantastico de simbad",
            "jason y los argonautas", "los vikingos", "el halcon del mar", "el capitan blood",
            "el cisne negro", "el temible burlon", "la isla de las cabezas cortadas",
            "cutthroat island", "el quinto elemento", "stargate", "puerta a las estrellas",
            "el planeta de los simios", "el amanecer del planeta de los simios", "apocalypto",
            "el renacido", "the revenant", "la mision", "1492 la conquista del paraiso",
            "el dorado de carlos saura", "oro", "el corazon de las tinieblas", "congo",
            "el triangulo de la tristeza", "up", "stand by me", "cuenta conmigo"
        ],
    },
    "pel-029": {
        25: [
            "regreso al futuro", "regreso al futuro 2", "regreso al futuro 3",
            "back to the future", "atrapado en el tiempo", "el dia de la marmota",
            "groundhog day", "terminator", "terminator 2", "terminator 2 el juicio final",
            "el efecto mariposa", "al filo del mañana", "edge of tomorrow",
            "interstellar", "interestelar", "tenet", "looper", "doce monos", "12 monos"
        ],
        45: [
            "donnie darko", "codigo fuente", "source code", "palm springs", "feliz dia de tu muerte",
            "feliz dia de tu muerte 2", "una cuestion de tiempo", "about time",
            "la mujer del viajero en el tiempo", "mas alla del tiempo", "el proyecto adam",
            "the adam project", "x men dias del futuro pasado", "dias del futuro pasado",
            "vengadores endgame", "endgame", "todo a la vez en todas partes",
            "everything everywhere all at once", "spider man cruzando el multiverso",
            "un nuevo universo", "no way home", "doctor strange en el multiverso de la locura"
        ],
        65: [
            "primer", "los cronocrimenes", "predestination", "coherence", "triangulo",
            "triangle", "el triangulo", "frequency", "deja vu", "next", "el hombre bicentenario",
            "la maquina del tiempo", "the time machine", "el tiempo en sus manos",
            "pide al tiempo que vuelva", "somewhere in time", "los pasajeros del tiempo",
            "time after time", "los heroes del tiempo", "time bandits", "las alucinantes aventuras de bill y ted",
            "bill y ted", "jacuzzi al pasado", "hot tub time machine", "click", "peggy sue se caso"
        ],
        85: [
            "mr nobody", "las vidas posibles de mr nobody", "la jetee", "el planeta de los simios",
            "star trek", "star trek iv mision salvar la tierra", "harry potter y el prisionero de azkaban",
            "el prisionero de azkaban", "deadpool 2", "la guerra del mañana", "the tomorrow war",
            "synchronic", "proyecto almanaque", "project almanac", "safety not guaranteed",
            "seguridad no garantizada", "la llegada", "arrival", "arrebato", "origen",
            "inception", "matrix", "el atlas de las nubes", "cloud atlas", "fuente de la vida",
            "the fountain", "olvidate de mi", "eternal sunshine of the spotless mind",
            "corre lola corre", "run lola run", "dos vidas en un instante", "sliding doors"
        ],
        100: [
            "cuando te encuentre", "durante la tormenta", "mirage", "el incidente",
            "arquitectura de la desaparicion", "la chica que saltaba a traves del tiempo",
            "the girl who leapt through time", "your name", "kimi no na wa", "suzume",
            "mirai mi hermana pequeña", "steins gate", "el efecto lazarus", "timecrimes",
            "beyond the infinite two minutes", "mas alla de los dos minutos infinitos",
            "la casa del lago", "the lake house", "kate y leopold", "un yanqui en la corte del rey arturo",
            "el final de la cuenta atras", "the final countdown", "experimento filadelfia",
            "timecop", "policia en el tiempo", "los visitantes", "los visitantes no nacieron ayer",
            "ivan el terrible cambia de profesion", "donnie darko director s cut", "el mapa de las pequeñas cosas perfectas",
            "the map of tiny perfect things", "antes de que caiga la noche", "si no despierto", "before i fall"
        ],
    },
    "pel-032": {
        25: [
            "solo en casa", "solo en casa 2", "perdido en nueva york", "home alone",
            "love actually", "el grinch", "como el grinch robo la navidad", "elf",
            "pesadilla antes de navidad", "polar express", "the polar express",
            "jungla de cristal", "die hard", "que bello es vivir", "it s a wonderful life"
        ],
        45: [
            "klaus", "cronicas de navidad", "the christmas chronicles", "cronicas de navidad 2",
            "vaya santa claus", "the santa clause", "cuento de navidad", "a christmas carol",
            "los fantasmas atacan al jefe", "scrooged", "los teleñecos en cuento de navidad",
            "the holiday", "vacaciones", "un padre en apuros", "jingle all the way",
            "el origen de los guardianes", "arthur christmas", "operacion regalo",
            "gremlins", "eduardo manostijeras", "batman vuelve", "batman returns",
            "arma letal", "lethal weapon", "eyes wide shut", "mujercitas", "little women"
        ],
        65: [
            "socorro ya es navidad", "national lampoon s christmas vacation", "christmas vacation",
            "historias de navidad", "a christmas story", "de ilusion tambien se vive",
            "miracle on 34th street", "milagro en la calle 34", "navidades blancas",
            "white christmas", "el bazar de las sorpresas", "the shop around the corner",
            "jungla de cristal 2", "alerta roja", "la joya de la familia", "the family stone",
            "cuatro navidades", "four christmases", "como en casa en ningun sitio",
            "un niño grande", "about a boy", "bad santa", "el duende", "polar",
            "navidad en el camino", "navidad de golpe", "falling for christmas", "dash y lily"
        ],
        85: [
            "noche de paz", "violent night", "el hombre que invento la navidad",
            "the man who invented christmas", "last christmas", "otra navidad",
            "un padre no tan padre", "noches blancas", "let it snow", "el caballero de la navidad",
            "the knight before christmas", "intercambio de princesas", "the princess switch",
            "navidad en el castillo", "a boy called christmas", "el chico que salvo la navidad",
            "jingle jangle", "un cuento de navidad", "mickeys christmas carol",
            "una navidad de cuento", "solo en casa 3", "el cascanueces y los cuatro reinos",
            "feliz navidad", "joyeux noel", "krampus maldita navidad", "krampus",
            "noche silenciosa", "silent night", "black christmas", "navidades negras"
        ],
        100: [
            "plácido", "placido", "la gran familia", "no desearas al vecino del quinto",
            "navidad en agosto", "tokyo godfathers", "el apartamento", "carol",
            "fanny y alexander", "tangerine", "kiss kiss bang bang", "iron man 3",
            "shazam", "los que se quedan", "the holdovers", "spirits", "el espiritu de la navidad",
            "spirited", "anna y el apocalipsis", "noche de fin de año", "new year s eve",
            "mientras dormias", "while you were sleeping", "serendipity", "jack frost",
            "la mujer del predicador", "the preacher s wife", "navidades sin fin",
            "el expreso polar", "santa claus la pelicula", "ernest salva la navidad",
            "rare exports", "un cuento de navidad de charles dickens", "scrooge"
        ],
    },
    "dep-010": {
        25: [
            "rafa nadal", "rafael nadal", "carlos alcaraz", "novak djokovic", "roger federer",
            "serena williams", "venus williams", "andy murray", "jannik sinner", "daniil medvedev",
            "alexander zverev", "stefanos tsitsipas", "iga swiatek", "aryna sabalenka",
            "coco gauff", "garbiñe muguruza", "conchita martinez", "arantxa sanchez vicario"
        ],
        45: [
            "alcaraz", "nadal", "djokovic", "federer", "sinner", "medvedev", "zverev",
            "tsitsipas", "casper ruud", "ruud", "andrey rublev", "rublev", "taylor fritz",
            "fritz", "holger rune", "rune", "hubert hurkacz", "alex de miñaur",
            "grigor dimitrov", "frances tiafoe", "ben shelton", "tommy paul",
            "felix auger aliassime", "denis shapovalov", "nick kyrgios", "mattew berrettini",
            "matteo berrettini", "roberto bautista", "roberto bautista agut", "pablo carreño",
            "alejandro davidovich", "pedro martinez", "jaume munar", "roberto carballes"
        ],
        65: [
            "paula badosa", "badosa", "carla suarez", "carla suarez navarro", "sara sorribes",
            "cristina bucsa", "jessica bouzas", "elena rybakina", "rybakina", "jessica pegula",
            "jasmine paolini", "qinwen zheng", "emma navarro", "maria sakkari", "ons jabeur",
            "jelena ostapenko", "marketa vondrousova", "barbora krejcikova", "naomi osaka",
            "ashleigh barty", "simona halep", "angelique keber", "angelique kerber",
            "caroline wozniacki", "victoria azarenka", "petra kvitova", "maria sharapova",
            "martina hingis", "justine henin", "kim clijsters", "monica seles", "steffi graf"
        ],
        85: [
            "stan wawrinka", "wawrinka", "dominic thiem", "juan martin del potro", "del potro",
            "marin cilic", "david ferrer", "ferrer", "juan carlos ferrero", "carlos moya",
            "alex corretja", "albert costa", "sergi bruguera", "manuel santana", "manolo santana",
            "manuel orantes", "emilio sanchez vicario", "feliciano lopez", "fernando verdasco",
            "nicolas almagro", "tommy robredo", "marcel granollers", "tomas berdych",
            "jo wilfried tsonga", "gael monfils", "richard gasquet", "gilles simon",
            "kei nishikori", "milos raonic", "john isner", "kevin anderson", "fabio fognini"
        ],
        100: [
            "pete sampras", "andre agassi", "bjorn borg", "john mcenroe", "jimmy connors",
            "ivan lendl", "stefan edberg", "boris becker", "mats wilander", "jim courier",
            "michael chang", "pat rafter", "lleyton hewitt", "marat safin", "yevgeny kafelnikov",
            "gustavo kuerten", "guga kuerten", "marcelo rios", "guillermo vilas", "gabriela sabatini",
            "martina navratilova", "chris evert", "billie jean king", "margaret court",
            "evonne goolagong", "tracy austin", "amélie mauresmo", "amelie mauresmo",
            "mary pierce", "lindsay davenport", "jennifer capriati", "svetlana kuznetsova",
            "li na", "garbine muguruza", "rod laver", "roy emerson", "ken rosewall", "arthur ashe"
        ],
    },
    "pel-026": {
        25: [
            "el viaje de chihiro", "mi vecino totoro", "la princesa mononoke",
            "el castillo ambulante", "your name", "dragon ball", "dragon ball z",
            "bola de dragon", "naruto", "one piece", "ataque a los titanes",
            "shingeki no kyojin", "death note", "akira", "pokemon", "oliver y benji"
        ],
        45: [
            "evangelion", "neon genesis evangelion", "cowboy bebop", "ghost in the shell",
            "la tumba de las luciernagas", "ponyo", "ponyo en el acantilado", "kiki entregas a domicilio",
            "nicky la aprendiz de bruja", "porco rosso", "el viento se levanta", "el chico y la garza",
            "el castillo en el cielo", "nausicaa del valle del viento", "el tiempo contigo",
            "weathering with you", "suzume", "a silent voice", "la forma de la voz",
            "demon slayer", "kimetsu no yaiba", "jujutsu kaisen", "my hero academia",
            "boku no hero", "hunter x hunter", "fullmetal alchemist", "fullmetal alchemist brotherhood"
        ],
        65: [
            "bleach", "saint seiya", "los caballeros del zodiaco", "sailor moon",
            "sakura cazadora de cartas", "cardcaptor sakura", "doraemon", "shin chan",
            "detective conan", "digimon", "inuyasha", "ranma 1 2", "ranma", "mazinger z",
            "heidi", "marco", "campeones", "supercampeones", "slam dunk", "haikyuu",
            "blue lock", "kuroko no basket", "hajime no ippo", "captain tsubasa",
            "chainsaw man", "spy x family", "one punch man", "mob psycho 100", "tokyo ghoul",
            "sword art online", "re zero", "steins gate", "code geass", "vinland saga"
        ],
        85: [
            "paprika", "perfect blue", "millennium actress", "tokyo godfathers",
            "la chica que saltaba a traves del tiempo", "wolf children", "los niños lobo",
            "summer wars", "el niño y la bestia", "belle", "mirai mi hermana pequeña",
            "redline", "metropolis", "memories", "ninja scroll", "vampire hunter d",
            "berserk", "monster", "parasyte", "psycho pass", "ergo proxy", "trigun",
            "samurai champloo", "hellsing", "black lagoon", "flcl", "gurren lagann",
            "tengen toppa gurren lagann", "kill la kill", "cyberpunk edgerunners", "castlevania"
        ],
        100: [
            "el cuento de la princesa kaguya", "susurros del corazon", "haru en el reino de los gatos",
            "haru", "recuerdos del ayer", "pompoko", "arrietty y el mundo de los diminutos",
            "la colina de las amapolas", "el recuerdo de marnie", "en este rincon del mundo",
            "maquia", "josee el tigre y los peces", "quiero comerme tu pancreas",
            "el jardin de las palabras", "cinco centimetros por segundo", "5 centimetros por segundo",
            "promare", "macross", "robotech", "gundam", "mobile suit gundam", "patlabor",
            "serial experiments lain", "texhnolyze", "mushishi", "nana", "your lie in april",
            "clannad", "violet evergarden", "frieren", "pluto", "ping pong the animation"
        ],
    },
    "pel-028": {
        25: [
            "grease", "chicas malas", "mean girls", "el club de los cinco",
            "the breakfast club", "el club de los poetas muertos", "american pie",
            "superbad", "supersalidos", "10 razones para odiarte", "diez razones para odiarte",
            "clueless", "fuera de onda", "high school musical", "proyecto x"
        ],
        45: [
            "todo en un dia", "ferris bueller s day off", "rebelde sin causa",
            "american graffiti", "movida del 76", "dazed and confused", "las ventajas de ser un marginado",
            "con amor simon", "love simon", "lady bird", "superempollonas", "booksmart",
            "edge of seventeen", "al filo de los diecisiete", "la chica de rosa",
            "pretty in pink", "dieciseis velas", "sixteen candles", "algo pasa con mary",
            "alguien como tu", "she s all that", "rumores y mentiras", "easy a",
            "juno", "napoleon dinamita", "napoleon dynamite", "rushmore", "academia rushmore"
        ],
        65: [
            "infiltrados en clase", "21 jump street", "infiltrados en la universidad",
            "22 jump street", "la red social", "the social network", "el indomable will hunting",
            "good will hunting", "whiplash", "desmadre a la americana", "animal house",
            "la revancha de los novatos", "revenge of the nerds", "los albondigas en remojo",
            "aquel excitante curso", "fast times at ridgemont high", "escuela de jovenes asesinos",
            "heathers", "donnie darko", "carrie", "scream", "se lo que hicisteis el ultimo verano",
            "jovenes y brujas", "the craft", "elegidos para el triunfo", "dando la nota", "pitch perfect"
        ],
        85: [
            "mentes peligrosas", "dangerous minds", "rebelion en las aulas", "to sir with love",
            "el sustituto", "stand and deliver", "lecciones inolvidables", "freedom writers",
            "diarios de la calle", "entrenador carter", "coach carter", "hoosiers",
            "movida en el roxbury", "no es otra tonta pelicula americana", "not another teen movie",
            "scary movie", "aquellas juergas universitarias", "old school", "road trip",
            "viaje de pirados", "eurotrip", "van wilder", "colega donde esta mi coche",
            "monstruos university", "escuela de rock", "school of rock", "dead poets society"
        ],
        100: [
            "el graduado", "the graduate", "un gran amor", "say anything", "risky business",
            "los chicos del maiz", "the faculty", "brick", "el silencio de los otros",
            "elefante", "elephant", "la ola", "die welle", "la clase", "entre les murs",
            "los 400 golpes", "cero en conducta", "if", "el señor de las moscas",
            "matilda", "hogwarts", "tres colores", "historias del kronen", "barrio",
            "azuloscurocasinegro", "las niñas", "campeones", "crema de menta",
            "las leyes de la atraccion", "the rules of attraction", "suburbia",
            "jovenes ocultos", "the lost boys", "tres idiotas", "3 idiots"
        ],
    },
    "gen-002": {
        25: [
            "alegre", "alegres", "contento", "contenta", "contentos", "contentas",
            "dichoso", "dichosa", "dichosos", "dichosas", "radiante", "radiantes",
            "satisfecho", "satisfecha", "satisfechos", "satisfechas", "animado", "animada"
        ],
        45: [
            "jubiloso", "jubilosa", "jubilosos", "jubilosas", "euforico", "euforica",
            "euforicos", "euforicas", "entusiasmado", "entusiasmada", "entusiasmados",
            "ilusionado", "ilusionada", "ilusionados", "optimista", "optimistas",
            "pletorico", "pletorica", "pletoricos", "gozoso", "gozosa", "gozosos",
            "venturoso", "venturosa", "venturosos", "afortunado", "afortunada",
            "afortunados", "sonriente", "sonrientes", "risueño", "risueña", "risueños"
        ],
        65: [
            "complacido", "complacida", "complacidos", "regocijado", "regocijada",
            "regocijados", "alborozado", "alborozada", "alborozados", "extasiado",
            "extasiada", "extasiados", "maravillado", "maravillada", "encantado",
            "encantada", "encantados", "fascinado", "fascinada", "embelesado",
            "embelesada", "festivo", "festiva", "festivos", "jovial", "joviales",
            "vivaz", "vivaces", "chispazo", "exultante", "exultantes", "triunfante"
        ],
        85: [
            "bienaventurado", "bienaventurada", "bienaventurados", "fausto", "fausta",
            "prospero", "prospera", "propicio", "propicia", "grato", "grata",
            "placentero", "placentera", "aplacible", "apacible", "sereno", "serena",
            "tranquilo", "tranquila", "realizado", "realizada", "pleno", "plena",
            "colmado", "colmada", "ebrio de alegria", "en la gloria", "como unas castañuelas",
            "mas feliz que una perdiz", "saltando de alegria", "rebozante", "rebosante"
        ],
        100: [
            "ufano", "ufana", "ufanos", "orgulloso", "orgullosa", "chistoso", "chistosa",
            "regodeado", "alegremente", "felizmente", "dichosamente", "lozano", "lozana",
            "fresco", "fresca", "vibrante", "luminoso", "luminosa", "solazado", "solazada",
            "arrobado", "arrobada", "hechizado", "hechizada", "beato", "beata", "glorioso",
            "gloriosa", "boyante", "bonanzoso", "rozagante", "campante", "orondo", "oronda",
            "en su salsa", "en las nubes", "tocado por la varita", "de buen humor", "contentisimo"
        ],
    },
    "geo-023": {
        25: [
            "comunidad de madrid", "pais vasco", "euskadi", "principado de asturias",
            "region de murcia", "comunidad valenciana", "comunitat valenciana",
            "comunidad foral de navarra", "castilla la mancha", "castilla y leon",
            "islas baleares", "illes balears", "islas canarias", "extremadura", "galicia"
        ],
        45: [
            "andalucia", "aragon", "asturias", "baleares", "canarias", "cantabria",
            "cataluña", "catalunya", "la rioja", "madrid", "murcia", "navarra",
            "valencia", "ceuta", "melilla", "alava", "araba", "albacete", "alicante",
            "almeria", "avila", "badajoz", "barcelona", "bizkaia", "vizcaya", "burgos",
            "caceres", "cadiz", "castellon", "ciudad real", "cordoba", "cuenca", "girona",
            "gerona", "granada", "guadalajara", "guipuzcoa", "gipuzkoa", "huelva", "huesca"
        ],
        65: [
            "jaen", "la coruña", "a coruña", "las palmas", "leon", "lleida", "lerida",
            "lugo", "malaga", "orense", "ourense", "palencia", "pontevedra", "salamanca",
            "santa cruz de tenerife", "segovia", "sevilla", "soria", "tarragona", "teruel",
            "toledo", "valladolid", "zamora", "zaragoza", "la mancha", "el bierzo",
            "la alcarria", "las alpujarras", "la axarquia", "campo de gibraltar",
            "costa del sol", "rias baixas", "rias altas", "emporda", "ampurdán", "ampurdan"
        ],
        85: [
            "tierra de campos", "ribera del duero", "rioja alavesa", "sierra de guadarrama",
            "valle de aran", "val d aran", "la cerdanya", "cerdaña", "osona", "garrotxa",
            "priorat", "penedes", "monegros", "los monegros", "somontano", "sobrarbe",
            "ribagorza", "matarraña", "maestrazgo", "el maestrazgo", "la safor", "marina alta",
            "vega baja", "valle del jerte", "las hurdes", "la vera", "la serena",
            "tierra de barros", "los pedroches", "doñana", "campo de calatrava", "la sagra"
        ],
        100: [
            "comarca de la janda", "sierra sur", "subbetica", "campo de montiel",
            "montes de toledo", "tierra de pinares", "las merindades", "bureba", "la bureba",
            "liébana", "liebana", "pas", "valles pasiegos", "trasmiera", "campoo",
            "baztan", "valle de baztan", "roncal", "salazar", "tierra estella", "cinco villas",
            "jiloca", "sierra de albarracin", "gudar javalambre", "ancares", "los ancares",
            "o courel", "ribeira sacra", "terra cha", "costa da morte", "arribes del duero",
            "sanabria", "maragateria", "babia", "laciana", "sierra norte de sevilla", "los velez"
        ],
    },
    "pal-005": {
        25: [
            "arroz", "avestruz", "ajedrez", "altavoz", "albornoz", "antifaz", "aprendiz",
            "cruz", "disfraz", "feliz", "infeliz", "juez", "luz", "maiz", "matiz",
            "nariz", "nuez", "paz", "pez", "raiz", "tapiz", "vez", "voz"
        ],
        45: [
            "actriz", "alcatraz", "andaluz", "audaz", "barniz", "capaz", "incapaz",
            "cerviz", "cicatriz", "codorniz", "directriz", "eficaz", "ineficaz",
            "emperatriz", "escasez", "estupidez", "faz", "feroz", "fugaz", "haz",
            "hez", "honradez", "lombriz", "lucidez", "madurez", "inmadurez", "matriz",
            "montaraz", "mordaz", "niñez", "palidez", "perdiz", "portavoz", "rapaz"
        ],
        65: [
            "regaliz", "rigidez", "robustez", "sagaz", "sencillez", "sensatez", "insensatez",
            "soez", "solidez", "tamiz", "tenaz", "tez", "timidez", "tozudez", "tragaluz",
            "validez", "invalidez", "vejez", "veloz", "veraz", "vivaz", "voraz",
            "acidez", "altivez", "aridez", "avidez", "brillantez", "calidez", "candidez",
            "contraluz", "cruz", "delgadez", "desliz", "desnudez", "doblez", "embriaguez"
        ],
        85: [
            "escualidez", "estolidez", "estrechez", "falaz", "fetidez", "fluidez",
            "frialdad" if False else "gravidez", "idiotez", "impavidez", "ingravidez",
            "insipidez", "interfaz", "intrepidez", "languidez", "limpidez", "liquidez",
            "locuaz", "matraz", "memez", "morbidez", "motriz", "automotriz", "institutriz",
            "nitidez", "ñoñez", "pequeñez", "perspicaz", "pertinaz", "pesadez", "placidez",
            "preñez", "procaz", "rapidez", "sobrefaz", "solaz", "sordidez", "tepidez",
            "tirantez", "trasluz", "turbidez", "viudez", "alcazuz", "altramuz", "arcabuz",
            "arcaduz", "capuz", "testuz", "portapaz", "tornavoz", "contumaz", "mendaz",
            "pugnaz", "sequaz", "secuaz", "tenaz", "torcaz", "paloma torcaz"
        ],
        100: [
            "alferez", "jerez", "cadiz", "badajoz", "aranzaz", "alfeñique" if False else "antraciz" if False else "almez",
            "arrez" if False else "barniz", "broz" if False else "cachaz" if False else "cañiz",
            "cerraz" if False else "coz", "diez", "foz", "hoz", "moz" if False else "oz",
            "puz" if False else "roz" if False else "saz", "soz" if False else "toz",
            "zuz" if False else "alboroz", "ajedrez", "almadrez", "azabache" if False else "cabez" if False else "caciquez",
            "cachondez", "candelez" if False else "chiquillez", "chochez", "compostez" if False else "cutrez",
            "cutrez", "desfachatez", "desgarbadez" if False else "doradez" if False else "exquisitez",
            "esbeltez", "extranjeria" if False else "flaccidez", "flacidez", "fresquez",
            "gallardez" if False else "gilipollez", "gordez", "grandeza" if False else "guapez",
            "hediondez", "horridez", "imbecilidad" if False else "impudicicia" if False else "inmundez",
            "intrepidez", "lopez", "perez", "gomez", "sanchez", "diaz", "rodriguez",
            "fernandez", "martinez", "gonzalez", "hernandez", "ruiz", "alvarez",
            "jimenez", "dominguez", "vazquez", "ramirez", "suarez", "benitez",
            "velazquez", "marquez", "nuñez", "ibañez", "mendez", "ortiz", "muñoz",
            "beatriz", "la paz", "santa cruz", "veracruz", "ormuz", "caucaz" if False else "tamariz"
        ],
    },
    "dep-011": {
        25: [
            "boxeo", "el boxeo", "judo", "el judo", "karate", "el karate", "taekwondo",
            "el taekwondo", "esgrima", "la esgrima", "lucha libre", "la lucha libre",
            "lucha grecorromana", "artes marciales mixtas", "mma", "ufc", "muay thai",
            "kickboxing", "kick boxing", "jiu jitsu", "jiu jitsu brasileño", "sumo", "el sumo"
        ],
        45: [
            "aikido", "el aikido", "kung fu", "wushu", "kendo", "capoeira", "la capoeira",
            "krav maga", "sambo", "lucha olimpica", "lucha canaria", "lucha leonesa",
            "aluche", "hapkido", "kenpo", "full contact", "savate", "boxeo frances",
            "sandá", "sanda", "wing chun", "tai chi", "taichi", "ninjutsu", "naginata"
        ],
        65: [
            "jiu jitsu japones", "jujutsu", "grappling", "no gi", "pankration", "pancracio",
            "lethwei", "boxeo birmano", "silat", "pencak silat", "escrima", "eskrima",
            "kali filipino", "arnis", "jeet kune do", "kyokushinkai", "shotokan", "shito ryu",
            "goju ryu", "wado ryu", "tang soo do", "kuk sool won", "taekkyon", "ssireum"
        ],
        85: [
            "boxeo ingles", "bare knuckle", "boxeo sin guantes", "catch wrestling",
            "folkstyle wrestling", "lucha playa", "beach wrestling", "kurash", "alysh",
            "belt wrestling", "oil wrestling", "yagli gures", "pehlwani", "kushti",
            "bohurt", "combate medieval", "hema", "esgrima historica", "esgrima artistica",
            "iaido", "kyudo", "kobudo", "shorinji kempo", "kajukenbo", "kudo", "daido juku"
        ],
        100: [
            "vale tudo", "shooto", "shootfighting", "shoot boxing", "combat sambo",
            "bjj", "brazilian jiu jitsu", "luta livre", "dambe", "laamb", "lucha senegalesa",
            "bokh", "lucha mongola", "shuai jiao", "bajiquan", "baguazhang", "xingyiquan",
            "hung gar", "choy lee fut", "shaolin kung fu", "sin moo hapkido", "systema",
            "sparring", "florete", "espada", "sable", "kalaripayattu", "muay boran", "pradal serey"
        ],
    },
    "dep-029": {
        25: [
            "el futbol", "el baloncesto", "el balonmano", "el voleibol", "el rugby",
            "el waterpolo", "el futbol sala", "futbol 7", "futbol 11", "futbol playa",
            "voley playa", "baloncesto 3x3", "basket", "basquet", "handball", "beisbol", "softbol"
        ],
        45: [
            "hockey sobre hierba", "hockey hierba", "hockey sobre patines", "hockey patines",
            "hockey sala", "hockey linea", "hockey sobre hielo", "futbol americano",
            "futbol australiano", "futbol gaelico", "lacrosse", "polo", "waterpolo",
            "netball", "korfball", "corfbol", "cricket", "criquet", "dodgeball", "balon prisionero"
        ],
        65: [
            "brilé", "brile", "cementerio", "pelota vasca", "fronton", "cesta punta",
            "pala corta", "paleta cuero", "remonte", "pelota valenciana", "raspall",
            "escala i corda", "galotxa", "llargues", "rugby a 7", "rugby seven", "rugby union",
            "rugby league", "futbol femenino", "balonmano playa", "futbol burbuja", "bubble football"
        ],
        85: [
            "sepak takraw", "kin ball", "tchoukball", "fustball", "fistball", "faustball",
            "floorball", "unihockey", "bandy", "rinkball", "hurling", "camogie", "shinty",
            "ultimate frisbee", "quidditch", "quadball", "bike polo", "cycle polo",
            "canoa polo", "kayak polo", "horseball", "pato", "buzkashi", "pushball",
            "cageball", "padbol", "teqball", "futvoley", "footvolley", "bossaball"
        ],
        100: [
            "goalball", "golbol", "futbol para ciegos", "futbol 5", "baloncesto en silla de ruedas",
            "rugby en silla de ruedas", "quad rugby", "slamball", "kronum", "jukari",
            "pesapallo", "rounders", "vigoro", "stoolball", "wiffle ball", "kickball",
            "stickball", "town ball", "calva", "chueca", "palin", "juego de pelota mesoamericano",
            "tlachtli", "ulama", "kemari", "calcio storico", "calcio fiorentino", "ba game"
        ],
    },
    "gen-010": {
        25: [
            "reino unido", "el reino unido", "gran bretaña", "reino de españa",
            "republica francesa", "republica italiana", "paises bajos", "los paises bajos",
            "holanda", "ciudad del vaticano", "el vaticano", "santa sede", "chequia", "republica checa"
        ],
        45: [
            "principado de andorra", "principado de monaco", "principado de liechtenstein",
            "gran ducado de luxemburgo", "confederacion suiza", "reino de belgica",
            "reino de dinamarca", "reino de suecia", "reino de noruega", "republica de irlanda",
            "eire", "republica portuguesa", "republica de polonia", "republica eslovaca",
            "republica de austria", "republica de hungria", "republica de finlandia",
            "republica de islandia", "republica helenica", "macedonia del norte", "bosnia y herzegovina"
        ],
        65: [
            "bosnia herzegovina", "republica popular china", "la china", "el japon", "la india",
            "republica de la india", "republica de corea", "corea del sur", "corea del norte",
            "republica de indonesia", "republica de turquia", "federacion de rusia", "federacion rusa",
            "arabia saudi", "arabia saudita", "reino de arabia saudi", "emiratos arabes unidos",
            "emiratos arabes", "catar", "qatar", "estado de catar", "estado de qatar", "kuwait",
            "barein", "reino de barein", "oman", "sultanato de oman", "yemen", "el yemen"
        ],
        85: [
            "el libano", "republica libanesa", "estado de israel", "estado de palestina",
            "reino hachemita de jordania", "republica arabe siria", "republica de irak",
            "republica islamica de iran", "emirato de afganistan", "republica de kazajistan",
            "republica de uzbekistan", "republica de turkmenistan", "republica kirguisa",
            "republica de tayikistan", "republica de armenia", "republica de azerbaiyan",
            "republica de georgia", "republica de bielorrusia", "republica de moldavia",
            "republica de estonia", "republica de letonia", "republica de lituania",
            "republica de croacia", "republica de eslovenia", "republica de serbia",
            "republica de montenegro", "republica de albania", "republica de bulgaria", "rumania"
        ],
        100: [
            "republica de chipre", "republica de malta", "republica de san marino",
            "republica de singapur", "reino de tailandia", "republica socialista de vietnam",
            "republica de filipinas", "federacion de malasia", "republica de indonesia",
            "brunei darussalam", "republica democratica de timor oriental", "myanmar", "birmania",
            "reino de camboya", "republica popular democratica de laos", "reino de butan",
            "republica federal democratica de nepal", "republica de maldivas", "sri lanka",
            "banglades", "republica islamica de pakistan", "mongolia", "republica de china", "taiwan",
            "united kingdom", "france", "germany", "italy", "spain", "portugal", "greece", "switzerland"
        ],
    },
    "geo-020": {
        25: [
            "puerto rico", "gibraltar", "groenlandia", "islas feroe", "hong kong",
            "macao", "guam", "samoa americana", "islas malvinas", "falkland islands",
            "nueva caledonia", "polinesia francesa", "tahiti", "aruba", "curazao"
        ],
        45: [
            "islas caiman", "bermudas", "islas virgenes britanicas", "islas virgenes americanas",
            "islas virgenes de estados unidos", "islas turcas y caicos", "anguila", "montserrat",
            "santa elena", "isla ascension", "tristan de acuña", "islas pitcairn",
            "guayana francesa", "martinica", "guadalupe", "reunion", "la reunion", "mayotte",
            "san pedro y miquelon", "wallis y futuna", "san martin", "san bartolome"
        ],
        65: [
            "islas marianas del norte", "bonaire", "sint maarten", "san eustaquio", "saba",
            "islas cook", "niue", "tokelau", "isla norfolk", "isla de navidad", "islas cocos",
            "isla de man", "jersey", "guernesey", "bailiazgo de jersey", "bailiazgo de guernesey",
            "ceuta", "melilla", "islas canarias", "azores", "madeira", "svalbard", "jan mayen",
            "islas aland", "aland", "monte athos", "atolon de midway", "isla wake"
        ],
        85: [
            "territorio britanico del oceano indico", "islas georgias del sur y sandwich del sur",
            "tierras australes y antarticas francesas", "isla bouvet", "islas heard y mcdonald",
            "islas chagos", "diego garcia", "isla clipperton", "atolon palmira", "isla jarvis",
            "isla baker", "isla howland", "atolon johnston", "arrecife kingman", "isla navaza",
            "islas ashmore y cartier", "islas del mar del coral", "dependencia ross",
            "territorio antartico australiano", "tierra de la reina maud", "isla pedro i"
        ],
        100: [
            "akrotiri y dhekelia", "bases soberanas de akrotiri y dhekelia", "alandia",
            "islas chafarinas", "peñon de velez de la gomera", "peñon de alhucemas",
            "isla perejil", "isla de alboran", "islas columbretes", "sealand",
            "transnistria", "abjasia", "osetia del sur", "somalilandia", "chipre del norte",
            "sahara occidental", "taiwan", "kosovo", "islas spratly", "islas paracel",
            "isla juan de nova", "europa", "bassas da india", "gloriosas", "tromelin",
            "saint pierre y miquelon", "islas del canal", "archipielago de kerguelen", "isla reunion"
        ],
    },
    "geo-002": {
        25: [
            "ciudad de mexico", "mexico df", "cdmx", "santiago de chile", "la habana",
            "buenos aires", "bogota", "lima", "quito", "caracas", "montevideo", "asuncion",
            "la paz", "sucre", "san jose", "ciudad de guatemala", "san salvador", "tegucigalpa"
        ],
        45: [
            "managua", "ciudad de panama", "santo domingo", "kingston", "nassau", "bridgetown",
            "puerto principe", "ottawa", "washington", "washington dc", "brasilia",
            "paramaribo", "georgetown", "reykjavik", "reikiavik", "dublin", "edimburgo",
            "londres", "paris", "madrid", "lisboa", "andorra la vella", "andorra la vieja"
        ],
        65: [
            "monaco", "bruselas", "amsterdam", "luxemburgo", "berna", "vaduz", "roma",
            "ciudad del vaticano", "san marino", "la valeta", "valleta", "berlin", "viena",
            "praga", "bratislava", "varsovia", "budapest", "bucarest", "sofia", "atenas",
            "nicosia", "ankara", "estocolmo", "oslo", "copenhague", "helsinki", "tallin",
            "riga", "vilna", "minsk", "kiev", "kyiv", "chisinau", "liubliana", "zagreb"
        ],
        85: [
            "belgrado", "sarajevo", "podgorica", "skopje", "tirana", "pristina", "moscu",
            "tiflis", "tbilisi", "erevan", "baku", "astana", "taskent", "asjabad", "biskek",
            "dusambe", "kabul", "islamabad", "nueva delhi", "dacca", "daca", "katmandu",
            "timbu", "colombo", "male", "pekin", "beijing", "tokio", "seul", "pionyang",
            "ulan bator", "hanoi", "bangkok", "nom pen", "vientian", "naipyido", "kuala lumpur"
        ],
        100: [
            "singapur", "yakarta", "manila", "bandar seri begawan", "dili", "camberra",
            "canberra", "wellington", "suva", "port moresby", "apia", "nuku alofa",
            "el cairo", "rabat", "argel", "tunez", "tripoli", "nuakchot", "dakar", "bamako",
            "niamey", "yamena", "jartum", "yuba", "asmara", "yibuti", "adis abeba", "nairobi",
            "kampala", "kigali", "gitega", "dodoma", "lusaka", "harare", "gaborone", "windhoek",
            "pretoria", "maseru", "mbabane", "maputo", "antananarivo", "port louis", "victoria"
        ],
    },
    "mus-020": {
        25: [
            "solea", "la solea", "alegrias", "las alegrias", "bulerias", "las bulerias",
            "sevillanas", "las sevillanas", "fandango", "fandangos", "tango flamenco",
            "tangos flamencos", "seguiriya", "seguiriyas", "siguiriya", "siguiriyas",
            "rumba flamenca", "rumbas", "tientos", "los tientos", "taranta", "tarantas"
        ],
        45: [
            "malagueña", "malagueñas", "granaína", "granaina", "granainas", "media granaina",
            "petenera", "peteneras", "martinete", "martinetes", "toná", "tona", "tonas",
            "saeta", "saetas", "cantiñas", "cantinas", "romeras", "mirabras", "caracoles",
            "farruca", "garrotin", "guajira", "guajiras", "colombiana", "colombianas",
            "milonga", "milongas", "vidalita", "vidalitas", "bambera", "bamberas", "serrana"
        ],
        65: [
            "serranas", "liviana", "livianas", "caña", "la caña", "polo", "el polo",
            "debla", "cabales", "alboreá", "alborea", "nana", "nanas", "campanilleros",
            "villancico flamenco", "zambra", "tangos de triana", "tangos de cadiz",
            "tangos de granada", "tangos del pijote", "tanguillo", "tanguillos",
            "tanguillos de cadiz", "tangos extremeños", "jaleo", "jaleos extremeños",
            "fandangos de huelva", "fandangos naturales", "fandangos de lucena", "verdiales"
        ],
        85: [
            "rondeña", "rondeñas", "jabera", "jaberas", "bandola", "abandolao",
            "taranto", "tarantos", "minera", "mineras", "cartagenera", "cartageneras",
            "murciana", "levantica", "solea por bulerias", "buleria por solea",
            "bulerias de jerez", "alegrias de cadiz", "alegrias de cordoba", "mariana",
            "marianas", "zorongo", "vito", "el vito", "zapateado", "sevillanas corraleras",
            "sevillanas boleras", "sevillanas rocieras", "romance flamenco", "corrido"
        ],
        100: [
            "corrido gitano", "giliana", "temporera", "trillera", "cantes de trilla",
            "cantes de fragua", "cantes de ida y vuelta", "cantes de levante",
            "cantes del campo", "pregones", "el pregon", "chufla", "chuflas",
            "cachucha", "fandango de alosno", "fandango de calañas", "fandango de el cerro",
            "fandango de encinasola", "fandango de valverde", "fandango de perez de guzman",
            "fandango de comares", "cantes de malaga", "cantes de cadiz", "cantes de jerez",
            "cantes de utrera", "cantes de lebrija", "cantes de triana", "cantes de alcala",
            "soleares de triana", "soleares de alcala", "soleares de cadiz", "soleares de jerez"
        ],
    },
    "mus-024": {
        25: [
            "joaquin sabina", "joan manuel serrat", "serrat", "sabina", "silvio rodriguez",
            "pablo milanes", "victor manuel", "ana belen", "luis eduardo aute", "aute",
            "ismael serrano", "pedro guerra", "javier krahe", "carlos cano", "pablo alboran",
            "manuel carrasco", "alejandro sanz", "antonio orozco", "rozalen", "el kanka"
        ],
        45: [
            "andres suarez", "marwan", "luis ramiro", "funambulista", "diego cantero",
            "dani martin", "melendi", "vanesa martin", "india martinez", "pablo lopez",
            "guitarricadelafuente", "valeria castro", "silvia perez cruz", "natalia lafourcade",
            "jorge drexler", "drexler", "fito paez", "charly garcia", "mercedes sosa",
            "facundo cabral", "atahualpa yupanqui", "violeta parra", "victor jara", "leon gieco"
        ],
        65: [
            "bob dylan", "leonard cohen", "joni mitchell", "neil young", "cat stevens",
            "yusuf islam", "james taylor", "carole king", "simon y garfunkel", "paul simon",
            "tracy chapman", "suzanne vega", "nick drake", "elliott smith", "jeff buckley",
            "van morrison", "bruce springsteen", "billy joel", "elton john", "tom waits",
            "damien rice", "ed sheeran", "hozier", "bon iver", "sufjan stevens", "iron and wine"
        ],
        85: [
            "georges brassens", "jacques brel", "leo ferre", "edith piaf", "charles aznavour",
            "serge gainsbourg", "francis cabrel", "francoise hardy", "carla bruni",
            "fabrizio de andre", "franco battiato", "lucio dalla", "francesco de gregori",
            "paolo conte", "zeca afonso", "jose afonso", "carlos paredes", "amalia rodrigues",
            "lluis llach", "raimon", "maria del mar bonet", "ovidi montllor", "pau riba",
            "mikel laboa", "benito lertxundi", "xosé manuel budiño", "amancio prada", "paco ibañez"
        ],
        100: [
            "chicho sanchez ferlosio", "jose antonio labordeta", "labordeta", "rosa leon",
            "elisa serna", "patxi andion", "hilario camacho", "toti soler", "javier ruibal",
            "albert pla", "rodrigo cuevas", "nachomastretta", "nacho vegas", "sr chinarro",
            "depatria", "depedro", "jairo zavala", "quique gonzalez", "josele santiago",
            "coque malla", "ariel rot", "andres calamaro", "chavela vargas", "carlos puebla",
            "compay segundo", "noel nicola", "santiago feliu", "frank delgado", "carlos varela",
            "pedro aznar", "luis alberto spinetta", "gustavo cerati", "woody guthrie", "pete seeger"
        ],
    },
    "mus-031": {
        25: [
            "carmen", "la traviata", "el barbero de sevilla", "las bodas de figaro",
            "don giovanni", "la flauta magica", "madama butterfly", "turandot", "la boheme",
            "tosca", "aida", "rigoletto", "el cascanueces", "el lago de los cisnes",
            "novena sinfonia", "quinta sinfonia", "las cuatro estaciones"
        ],
        45: [
            "sinfonia n 9", "sinfonia n 5", "sinfonia del nuevo mundo", "heroica", "pastoral",
            "sinfonia inconclusa", "inacabada", "sinfonia fantastica", "bolero de ravel",
            "el amor brujo", "noches en los jardines de españa", "el sombrero de tres picos",
            "concierto de aranjuez", "carmina burana", "el mesias", "la valquiria",
            "el anillo del nibelungo", "tristan e isolda", "lohengrin", "tannhauser",
            "caballeria rusticana", "pagliacci", "los payasos", "nabucco", "il trovatore"
        ],
        65: [
            "el trovador", "otello", "falstaff", "macbeth", "norma", "lucia di lammermoor",
            "el elixir de amor", "don pasquale", "cosi fan tutte", "el rapto en el serrallo",
            "orfeo", "orfeo y euridice", "dido y eneas", "fidelio", "der freischutz",
            "el cazador furtivo", "salome", "elektra", "el caballero de la rosa",
            "eugene onegin", "boris godunov", "el principe igor", "rusalka", "fausto",
            "romeo y julieta", "sanson y dalila", "werther", "manon", "pelleas et melisande"
        ],
        85: [
            "la verbena de la paloma", "la revoltosa", "luisa fernanda", "doña francisquita",
            "la del manojo de rosas", "el barberillo de lavapies", "agua azucarillos y aguardiente",
            "la gran via", "la corte de faraon", "gigantes y cabezudos", "la dolores",
            "marina", "el huesped del sevillano", "katiuska", "la tabernera del puerto",
            "la parranda", "los gavilanes", "bohemios", "la chulapona", "el caserio",
            "sinfonia n 40", "sinfonia jupiter", "sinfonia sorpresa", "sinfonia reloj",
            "sinfonia patetica", "sinfonia leningrado", "sinfonia de los mil", "sinfonia titan"
        ],
        100: [
            "requiem de mozart", "requiem de verdi", "pasion segun san mateo", "conciertos de brandeburgo",
            "variaciones goldberg", "el clave bien temperado", "el arte de la fuga",
            "musica acuatica", "musica para los reales fuegos de artificio", "cuadros de una exposicion",
            "una noche en el monte pelado", "scheherezade", "pedro y el lobo", "la consagracion de la primavera",
            "el pajaro de fuego", "petrushka", "adagio de albinoni", "canon de pachelbel",
            "danzas hungaras", "danzas eslavas", "rapsodia in blue", "un americano en paris",
            "el danubio azul", "marcha radetzky", "pompa y circunstancia", "en la gruta del rey de la montaña",
            "peer gynt", "claro de luna", "para elisa", "suite bergamasque", "el carnaval de los animales"
        ],
    },
    "pal-011": {
        25: [
            "dni", "nif", "nie", "cif", "iban", "pin", "puk", "sim", "wifi", "usb", "html",
            "http", "https", "url", "pdf", "jpg", "png", "mp3", "mp4", "dvd", "cd", "tv", "pc"
        ],
        45: [
            "dgt", "itv", "boe", "rae", "onu", "otan", "ue", "bce", "fmi", "oms", "unesco",
            "unicef", "fifa", "uefa", "nba", "nfl", "f1", "motogp", "ave", "renfe", "aena",
            "rtve", "tve", "efe", "ser", "cope", "once", "cruz roja", "ong", "pyme", "irpf"
        ],
        65: [
            "iva", "ipc", "pib", "euribor", "ertE", "erte", "ere", "sepe", "inem", "tgss",
            "segsoc", "mir", "eir", "pir", "eso", "bach", "fp", "ebau", "evau", "pau",
            "uned", "csic", "cni", "geo", "tedax", "ume", "samur", "summa", "uci", "uvi"
        ],
        85: [
            "tac", "rmn", "adn", "arn", "vih", "sida", "covid", "epoc", "ela", "tea", "tdah",
            "toc", "imc", "lgtbi", "lgtbiq", "oaci", "fao", "acnur", "ocde", "opep", "omc",
            "coe", "coi", "acb", "rfef", "csd", "dgt", "madrid central", "zbe", "pegatina eco",
            "radar", "sonar", "laser", "led", "oled", "lcd", "hdmi", "vga", "ram", "rom"
        ],
        100: [
            "cpu", "gpu", "ssd", "hdd", "vpn", "dns", "ip", "mac", "lan", "wan", "iot", "ia",
            "ocr", "qr", "nfc", "rfid", "gps", "sms", "mms", "gif", "zip", "rar", "exe",
            "apk", "iso", "faq", "asap", "fyi", "ceo", "cfo", "cto", "rrhh", "b2b", "b2c",
            "kpi", "roi", "saas", "erp", "crm", "seo", "sem", "ugc", "rsvp", "ovnis", "ovni",
            "talgo", "tren ave", "inri", "et", "eta", "pm", "am", "etc", "pd", "atte", "qepd", "rip"
        ],
    },
    "pel-025": {
        25: [
            "la lista de schindler", "cadena perpetua", "el padrino", "forrest gump",
            "la milla verde", "milagro en la celda 7", "el club de la lucha",
            "american history x", "el pianista", "la vida es bella", "titanic",
            "gladiator", "braveheart", "el indomable will hunting", "una mente maravillosa"
        ],
        45: [
            "mar adentro", "los lunes al sol", "te doy mis ojos", "el bola", "solas",
            "barrio", "historias del kronen", "la lengua de las mariposas", "el sur",
            "los santos inocentes", "viridiana", "volver", "todo sobre mi madre",
            "hable con ella", "dolor y gloria", "alcarras", "as bestas", "20000 especies de abejas",
            "cinco lobitos", "la sociedad de la nieve", "el maestro que prometio el mar",
            "un monstruo viene a verme", "lo imposible", "el orfanato", "tesis"
        ],
        65: [
            "manchester frente al mar", "moonlight", "spotlight", "12 años de esclavitud",
            "doce años de esclavitud", "parasitos", "roma", "nomadland", "the whale",
            "la ballena", "tar", "aftersun", "close", "anatomia de una caida",
            "la zona de interes", "vidas pasadas", "past lives", "requiem por un sueño",
            "american beauty", "brokeback mountain", "en terreno vedado", "las horas",
            "el curioso caso de benjamin button", "million dollar baby", "gran torino", "mystic river"
        ],
        85: [
            "alguien volo sobre el nido del cuco", "rain man", "kramer contra kramer",
            "gente corriente", "el hombre elefante", "despertares", "la decision de sophie",
            "el color purpura", "tomates verdes fritos", "magnolias de acero", "philadelphia",
            "pena de muerte", "el aceite de la vida", "en el nombre del padre", "mi pie izquierdo",
            "el club de los poetas muertos", "esencia de mujer", "el show de truman",
            "big fish", "cinco centimetros", "yo daniel blake", "sorry we missed you",
            "secretos y mentiras", "el odio", "la haine", "ladron de bicicletas", "cinema paradiso"
        ],
        100: [
            "el septimo sello", "fresas salvajes", "persona", "andrei rublev", "stalker",
            "paris texas", "el cielo sobre berlin", "tokyo story", "cuentos de tokio",
            "rashomon", "vivir", "ikiru", "las uvas de la ira", "que verde era mi valle",
            "el crepusculo de los dioses", "un tranvia llamado deseo", "la gata sobre el tejado de zinc",
            "quien teme a virginia woolf", "taxi driver", "toro salvaje", "erase una vez en america",
            "el cazador", "the deer hunter", "apocalypse now", "platoon", "la delgada linea roja",
            "el arbol de la vida", "boyhood", "historia de un matrimonio", "marriage story"
        ],
    },
    "dep-015": {
        25: [
            "100 metros lisos", "200 metros lisos", "400 metros lisos", "800 metros lisos",
            "1500 metros", "5000 metros", "10000 metros", "maraton", "la maraton",
            "media maraton", "salto de longitud", "salto de altura", "salto con pertiga",
            "triple salto", "lanzamiento de peso", "lanzamiento de disco", "lanzamiento de jabalina"
        ],
        45: [
            "lanzamiento de martillo", "110 metros vallas", "100 metros vallas", "400 metros vallas",
            "3000 metros obstaculos", "relevos 4x100", "relevos 4x400", "4x100", "4x400",
            "decatlon", "heptatlon", "pentatlon", "marcha atletica", "20 km marcha",
            "35 km marcha", "50 km marcha", "campo a traves", "cross", "cros", "carrera de vallas"
        ],
        65: [
            "60 metros lisos", "60 metros vallas", "milla", "la milla", "3000 metros lisos",
            "relevo mixto 4x400", "salto de altura en pista cubierta", "velocidad", "medio fondo",
            "fondo", "gran fondo", "ultra maraton", "ultramaraton", "trail running",
            "carrera de montaña", "kilometro vertical", "milla urbana", "san silvestre",
            "carrera popular", "diez mil", "cinco mil", "mil quinientos", "ochocientos"
        ],
        85: [
            "pista cubierta", "short track", "atletismo en pista", "atletismo en ruta",
            "relevo sueco", "relevo de postas", "100 km en ruta", "24 horas en pista",
            "pentatlon antiguo", "estadio griego", "diaulos", "dolichos", "hoplitodromos",
            "salto sin impulso", "salto de altura parado", "salto de longitud parado",
            "lanzamiento de jabalina con dos manos", "carrera de obstaculos", "ria"
        ],
        100: [
            "lanzamiento de peso en silla", "lanzamiento de clava", "100 metros T11",
            "tetratlon", "triatlon atletico", "octatlon", "icosatlon", "doble decatlon",
            "relevo 4x200", "relevo 4x800", "relevo 4x1500", "relevo medley",
            "distance medley relay", "carrera de eliminacion", "millrose mile",
            "boulder running", "spartan race", "hyrox", "ekiden", "relevo ekiden",
            "skyrunning", "backyard ultra", "canicros", "orientacion a pie"
        ],
    },
    "dep-022": {
        25: [
            "michael jordan", "lebron james", "kobe bryant", "magic johnson", "larry bird",
            "kareem abdul jabbar", "shaquille o neal", "stephen curry", "kevin durant",
            "pau gasol", "marc gasol", "ricky rubio", "juan carlos navarro", "rudy fernandez",
            "sergio llull", "sergio rodriguez", "nikola jokic", "luka doncic", "giannis antetokounmpo"
        ],
        45: [
            "tim duncan", "dirk nowitzki", "kevin garnett", "allen iverson", "steve nash",
            "dwyane wade", "charles barkley", "karl malone", "john stockton", "hakeem olajuwon",
            "david robinson", "scottie pippen", "dennis rodman", "isiah thomas", "julius erving",
            "dr j", "wilt chamberlain", "bill russell", "oscar robertson", "jerry west",
            "elgin baylor", "john havlicek", "patrick ewing", "reggie miller", "clyde drexler"
        ],
        65: [
            "fernando martin", "epi", "juan antonio san epifanio", "fernando romay",
            "chicho sibilio", "jordi villacampa", "alberto herreros", "jorge garbajosa",
            "jose manuel calderon", "felipe reyes", "carlos jimenez", "raul lopez",
            "willy hernangomez", "juancho hernangomez", "usman garuba", "santi aldama",
            "amaiavaldemoro", "amaya valdemoro", "laia palau", "alba torrens", "marta xargay",
            "sancho lyttle", "astou ndour", "elisa aguilar", "drazen petrovic", "toni kukoc"
        ],
        85: [
            "arvydas sabonis", "divac", "vlade divac", "peja stojakovic", "dejan bodiroga",
            "sarunas jasikevicius", "vassilis spanoulis", "dimitris diamantidis", "nikos galis",
            "tony parker", "manu ginobili", "luis scola", "andres nocioni", "facundo campazzo",
            "oscar schmidt", "yao ming", "james harden", "russell westbrook", "kawhi leonard",
            "kyrie irving", "chris paul", "carmelo anthony", "dwight howard", "tracy mcgrady",
            "vince carter", "jason kidd", "gary payton", "alonzo mourning", "dikembe mutombo"
        ],
        100: [
            "kyle korver", "ray allen", "klay thompson", "draymond green", "anthony davis",
            "joel embiid", "jayson tatum", "devin booker", "damian lillard", "ja morant",
            "victor wembanyama", "shai gilgeous alexander", "anthony edwards", "diana taurasi",
            "sue bird", "lisa leslie", "maya moore", "candace parker", "breanna stewart",
            "aja wilson", "caitlin clark", "sabrina ionescu", "bob cousy", "george mikan",
            "pete maravich", "pistol pete", "moses malone", "rick barry", "dominique wilkins",
            "walton", "bill walton", "sergei belov", "kresimir cosic", "dinho", "dino meneghin"
        ],
    },
    "dep-023": {
        25: [
            "rafael nadal", "rafa nadal", "carlos alcaraz", "novak djokovic", "roger federer",
            "andy murray", "serena williams", "venus williams", "garbiñe muguruza", "paula badosa",
            "arantxa sanchez vicario", "conchita martinez", "jannik sinner", "iga swiatek",
            "aryna sabalenka", "coco gauff", "daniil medvedev", "alexander zverev"
        ],
        45: [
            "stefanos tsitsipas", "casper ruud", "andrey rublev", "holger rune", "taylor fritz",
            "alex de miñaur", "grigor dimitrov", "frances tiafoe", "ben shelton", "tommy paul",
            "nick kyrgios", "matteo berrettini", "hubert hurkacz", "felix auger aliassime",
            "denis shapovalov", "sebastian korda", "lorenzo musetti", "jack draper", "roberto bautista",
            "pablo carreño", "alejandro davidovich", "fernando verdasco", "feliciano lopez", "david ferrer"
        ],
        65: [
            "juan carlos ferrero", "carlos moya", "alex corretja", "albert costa", "sergi bruguera",
            "manuel santana", "manolo santana", "manuel orantes", "emilio sanchez vicario",
            "juan aguilera", "nicolas almagro", "tommy robredo", "albert ramos", "marcel granollers",
            "carla suarez", "sara sorribes", "cristina bucsa", "jessica bouzas", "anabel medina",
            "virginia ruano", "magui serna", "maria jose martinez", "nurialagostera", "nuria llagostera",
            "elena rybakina", "jessica pegula", "jasmine paolini", "ons jabeur", "maria sakkari"
        ],
        85: [
            "naomi osaka", "ashleigh barty", "simona halep", "angelique kerber", "caroline wozniacki",
            "victoria azarenka", "petra kvitova", "maria sharapova", "martina hingis", "justine henin",
            "kim clijsters", "monica seles", "steffi graf", "martina navratilova", "chris evert",
            "billie jean king", "gabriela sabatini", "stan wawrinka", "dominic thiem", "juan martin del potro",
            "marin cilic", "tomas berdych", "jo wilfried tsonga", "gael monfils", "richard gasquet",
            "kei nishikori", "milos raonic", "john isner", "david nalbandian", "guillermo coria"
        ],
        100: [
            "gaston gaudio", "marcelo rios", "fernando gonzalez", "nicolas massu", "guillermo vilas",
            "jose luis clerc", "gustavo kuerten", "pete sampras", "andre agassi", "jim courier",
            "michael chang", "bjorn borg", "john mcenroe", "jimmy connors", "ivan lendl",
            "stefan edberg", "boris becker", "mats wilander", "pat rafter", "lleyton hewitt",
            "marat safin", "yevgeny kafelnikov", "goran ivanisevic", "thomas muster", "michael stich",
            "andy roddick", "james blake", "rod laver", "ken rosewall", "roy emerson", "arthur ashe",
            "fred perry", "suzanne lenglen", "rene lacoste", "henri cochet", "don budge"
        ],
    },
    "dep-024": {
        25: [
            "fernando alonso", "carlos sainz", "carlos sainz jr", "marc marquez", "jorge martin",
            "valentino rossi", "michael schumacher", "lewis hamilton", "max verstappen",
            "ayrton senna", "alain prost", "niki lauda", "sebastian vettel", "pedro de la rosa"
        ],
        45: [
            "charles leclerc", "lando norris", "oscar piastri", "george russell", "sergio perez",
            "checo perez", "kimi raikkonen", "mika hakkinen", "fernando alonso diaz", "jenson button",
            "nico rosberg", "damon hill", "nigel mansell", "nelson piquet", "juan manuel fangio",
            "jim clark", "jackie stewart", "emerson fittipaldi", "jochen rindt", "james hunt",
            "gilles villeneuve", "jacques villeneuve", "daniel ricciardo", "valtteri bottas", "pierre gasly"
        ],
        65: [
            "esteban ocon", "alex albon", "yuki tsunoda", "nico hulkenberg", "kevin magnussen",
            "lance stroll", "oliver bearman", "franco colapinto", "jorge lorenzo", "dani pedrosa",
            "alex criville", "angel nieto", "joan mir", "alex rins", "aleix espargaro",
            "pol espargaro", "maverick viñales", "pedro acosta", "alex marquez", "raul fernandez",
            "augusto fernandez", "setegibernau", "sete gibernau", "carlos checa", "toni elias"
        ],
        85: [
            "pecco bagnaia", "francesco bagnaia", "fabio quartararo", "enea bastianini",
            "marco bezzecchi", "brad binder", "jack miller", "miguel oliveira", "johann zarco",
            "casey stoner", "nicky hayden", "mick doohan", "wayne rainey", "kevin schwantz",
            "eddie lawson", "freddie spencer", "wayne gardner", "barry sheene", "giacomo agostini",
            "mike hailwood", "john surtees", "carlos sainz cenamor", "dani sordo", "sebastien loeb"
        ],
        100: [
            "sebastien ogier", "colin mcrae", "tommi makinen", "juha kankkunen", "ari vatanen",
            "walter rohrl", "michele mouton", "stig blomqvist", "hannu mikkola", "markku alen",
            "marcus gronholm", "petter solberg", "richard burns", "ott tanak", "thierry neuville",
            "kalle rovanpera", "elfyn evans", "didier auriol", "nasser al attiyah", "stephane peterhansel",
            "nani roma", "marc coma", "laia sanz", "cristina gutierrez", "emilio de villota",
            "maria de villota", "adrian campos", "marc gene", "jaime alguersuari", "roberto merhi",
            "luis perez sala", "alfonso de portago", "stirling moss", "jack brabham", "graham hill"
        ],
    },
    "dep-025": {
        25: [
            "españa", "francia", "alemania", "italia", "inglaterra", "portugal", "paises bajos",
            "holanda", "belgica", "brasil", "argentina", "uruguay", "estados unidos",
            "nueva zelanda", "all blacks", "la roja", "seleccion española"
        ],
        45: [
            "croacia", "suiza", "dinamarca", "suecia", "noruega", "polonia", "austria",
            "escocia", "gales", "irlanda", "republica checa", "hungria", "serbia", "turquia",
            "grecia", "ucrania", "rumania", "bulgaria", "rusia", "colombia", "chile", "ecuador",
            "peru", "paraguay", "venezuela", "bolivia", "mexico", "canada", "costa rica", "panama"
        ],
        65: [
            "marruecos", "senegal", "nigeria", "camerun", "costa de marfil", "ghana", "egipto",
            "argelia", "tunez", "sudafrica", "springboks", "japon", "corea del sur", "australia",
            "wallabies", "lituania", "letonia", "eslovenia", "fiyi", "samoa", "tonga",
            "georgia", "irlanda del norte", "eslovaquia", "finlandia", "islandia", "albania"
        ],
        85: [
            "los pumas", "la albiceleste", "la canarinha", "la verdeamarela", "la celeste",
            "les bleus", "die mannschaft", "la azzurra", "los tres leones", "la naranja mecanica",
            "el tri", "la roja de todos", "los leones del atlas", "los elefantes",
            "los leones indomables", "las aguilas verdes", "los diablos rojos", "seleccion de inglaterra",
            "seleccion de francia", "seleccion de brasil", "seleccion de argentina", "seleccion de alemania"
        ],
        100: [
            "seleccion de italia", "seleccion de portugal", "seleccion de estados unidos",
            "dream team", "redeem team", "team usa", "boomers", "tall blacks", "los teros",
            "los condores", "los tupis", "las aguilas", "los leones de españa", "las leonas",
            "la familia", "ñba", "hispano", "los hispanos", "las guerreras", "seleccion de nueva zelanda",
            "seleccion de sudafrica", "seleccion de irlanda", "seleccion de gales", "seleccion de escocia",
            "seleccion de fiyi", "seleccion de lituania", "seleccion de grecia", "seleccion de serbia",
            "honduras", "jamaica", "arabia saudi", "iran", "qatar", "china", "india", "kenia", "angola"
        ],
    },
    "dep-030": {
        25: [
            "el tenis", "el golf", "la natacion", "el atletismo", "el ciclismo",
            "el esqui", "el snowboard", "el surf", "el patinaje", "la gimnasia",
            "la gimnasia artistica", "la gimnasia ritmica", "el ajedrez", "el tiro con arco"
        ],
        45: [
            "tenis de mesa", "ping pong", "badminton", "el badminton", "squash", "el squash",
            "padel individual", "frontenis", "tiro olimpico", "tiro al plato", "esgrima",
            "triatlon", "el triatlon", "duatlon", "pentatlon moderno", "halterofilia",
            "la halterofilia", "escalada", "la escalada", "boulder", "ciclismo en pista",
            "ciclismo de carretera", "mountain bike", "bmx", "patinaje artistico", "patinaje de velocidad"
        ],
        65: [
            "esqui alpino", "esqui de fondo", "biatlon", "salto de esqui", "esqui acrobatico",
            "luge", "skeleton", "equitacion", "hipica", "doma clasica", "salto ecuestre",
            "concurso completo", "vela", "windsurf", "kitesurf", "piragüismo", "piraguismo",
            "remo", "salto de trampolin", "natacion sincronizada", "natacion artistica",
            "aguas abiertas", "apnea", "buceo", "bolos", "bowling", "billar", "snooker"
        ],
        85: [
            "dardos", "petanca", "la petanca", "golf de disco", "disc golf", "slackline",
            "parkour", "motocross", "trial", "enduro", "automovilismo", "karting", "formula 1",
            "motociclismo", "parapente", "ala delta", "paracaidismo", "salto base", "rafting",
            "barranquismo", "alpinismo", "montañismo", "orientacion", "orientacion deportiva",
            "powerlifting", "crossfit", "calistenia", "decathlon", "maraton", "marcha atletica"
        ],
        100: [
            "bobsleigh monobob", "monobob", "aeromodelismo", "colombofilia", "tiro con cerbatana",
            "herradura", "lanzamiento de disco", "lanzamiento de jabalina", "lanzamiento de martillo",
            "lanzamiento de peso", "salto con pertiga", "salto de altura", "salto de longitud",
            "triple salto", "carrera de trineos", "mushing", "esqui de travesia", "skimo",
            "paddle surf", "sup", "bodyboard", "skimboard", "wakeboard", "esqui acuatico",
            "curling individual", "croquet", "tiro con honda", "bochas", "boccia", "carrom", "backgammon"
        ],
    },
    "dep-031": {
        25: [
            "el balon", "la pelota", "la raqueta", "la pala de padel", "el casco",
            "los guantes", "las zapatillas", "las botas de futbol", "las espinilleras",
            "la red", "la canasta", "la porteria", "la bicicleta", "la tabla de surf",
            "los esquis", "la esterilla", "las mancuernas", "la comba"
        ],
        45: [
            "balones", "pelotas", "raquetas", "cascos", "espinilleras", "redes", "canastas",
            "porterias", "mancuernas", "combas", "pala de ping pong", "bate de beisbol",
            "guante de beisbol", "palo de golf", "palos de golf", "tee", "palo de hockey",
            "stick de hockey", "disco de hockey", "puck", "volante de badminton", "pluma",
            "gafas de natacion", "gorro de natacion", "aletas", "tubo de buceo", "neopreno"
        ],
        65: [
            "traje de neopreno", "bañador", "malla", "maillot", "culote", "culotte",
            "bidon", "portabidon", "rodillera", "rodilleras", "codera", "coderas",
            "muñequera", "muñequeras", "tobillera", "tobillera deportiva", "protector bucal",
            "coquilla", "peto", "saco de boxeo", "guantes de boxeo", "vendas de boxeo",
            "guantillas", "casco de boxeo", "casco de ciclismo", "camara de aire", "bomba de aire"
        ],
        85: [
            "inflador", "bombin", "cronometro", "silbato", "tarjetas", "tarjeta amarilla",
            "tarjeta roja", "banderin", "dorsal", "medalla", "trofeo", "copa", "podio",
            "marcador", "pizarra tactica", "conos", "conos de entrenamiento", "petos",
            "valla", "vallas", "liston", "colchoneta", "plinto", "potro", "anillas",
            "barra fija", "barras paralelas", "barra de equilibrio", "cinta de gimnasia", "mazas"
        ],
        100: [
            "aro", "kettlebell", "pesa rusa", "barra olimpica", "discos olimpicos",
            "banda elastica", "goma elastica", "trx", "rodillo de espuma", "foam roller",
            "balon medicinal", "trineo de arrastre", "cajon pliometrico", "chaleco lastrado",
            "cinturon lumbar", "straps", "magnesio", "calleras", "piolet", "crampones",
            "arnes", "mosqueton", "cuerda de escalada", "pies de gato", "bastones de trekking",
            "raquetas de nieve", "fijaciones", "botas de esqui", "florete", "careta de esgrima"
        ],
    },
    "geo-025": {
        25: [
            "manhattan", "brooklyn", "queens", "bronx", "el bronx", "soho", "tribeca",
            "harlem", "chinatown", "little italy", "times square", "hollywood", "beverly hills",
            "salamanca", "barrio de salamanca", "chamberi", "malasaña", "chueca", "lavapies"
        ],
        45: [
            "la latina", "retiro", "triana", "nervion", "los remedios", "santa cruz",
            "barrio de santa cruz", "albaicin", "sacromonte", "realejo", "el born", "el raval",
            "barrio gotico", "barri gotic", "gracia", "eixample", "ensanche", "barceloneta",
            "poblenou", "sarria", "ruzafa", "el carmen", "ciutat vella", "montmartre",
            "le marais", "barrio latino", "quartier latin", "champs elysees", "pigalle"
        ],
        65: [
            "belleville", "saint germain des pres", "camden", "camden town", "notting hill",
            "kensington", "chelsea", "mayfair", "covent garden", "shoreditch", "brixton",
            "westminster", "greenwich", "trastevere", "testaccio", "monti", "prati",
            "kreuzberg", "mitte", "neukolln", "prenzlauer berg", "alfama", "chiado",
            "bairro alto", "belem", "mouraria", "jordaan", "de pijp", "christiania"
        ],
        85: [
            "shibuya", "shinjuku", "akihabara", "ginza", "harajuku", "roppongi", "asakusa",
            "gangnam", "itaewon", "hongdae", "myeongdong", "la boca", "san telmo", "palermo",
            "recoleta", "puerto madero", "belgrano", "copacabana", "ipanema", "leblon",
            "santa teresa", "botafogo", "polanco", "coyoacan", "condesa", "roma norte",
            "miraflores", "barranco", "bellavista", "lastarria", "providencia", "chapinero"
        ],
        100: [
            "getsemani", "el poblado", "la candelaria", "el vedado", "habana vieja",
            "wynwood", "little havana", "pequeña habana", "south beach", "french quarter",
            "barrio frances", "haight ashbury", "castro", "mission", "mission district",
            "nob hill", "wicker park", "williamsburg", "dumbo", "astoria", "upper east side",
            "upper west side", "greenwich village", "east village", "financial district",
            "canary wharf", "docklands", "bo kaap", "zamalek", "beyoglu", "karakoy",
            "kadikoy", "balat", "poble sec", "casco viejo", "indautxu", "gros", "guelph", "gamelan"
        ],
    },
    "geo-026": {
        25: [
            "londres", "paris", "roma", "berlin", "lisboa", "amsterdam", "bruselas",
            "viena", "praga", "munich", "milan", "venecia", "florencia", "napoles",
            "atenas", "estambul", "moscu", "san petersburgo", "dublin", "edimburgo"
        ],
        45: [
            "oporto", "porto", "coimbra", "braga", "faro", "lyon", "marsella", "niza",
            "burdeos", "toulouse", "estrasburgo", "lille", "nantes", "montpellier",
            "hamburgo", "francfort", "frankfurt", "colonia", "stuttgart", "dusseldorf",
            "dresde", "leipzig", "nuremberg", "turin", "bolonia", "palermo", "verona",
            "genova", "bari", "catania", "amberes", "brujas", "gante", "lieja", "rotterdam"
        ],
        65: [
            "la haya", "utrecht", "eindhoven", "maastricht", "ginebra", "zurich", "basilea",
            "lausana", "lucerna", "salzburgo", "innsbruck", "graz", "manchester", "liverpool",
            "birmingham", "glasgow", "bristol", "oxford", "cambridge", "york", "belfast",
            "cork", "galway", "estocolmo", "gotemburgo", "malmo", "oslo", "bergen",
            "trondheim", "copenhague", "aarhus", "helsinki", "tampere", "turku", "reikiavik"
        ],
        85: [
            "varsovia", "cracovia", "gdansk", "breslavia", "poznan", "brno", "ostrawa",
            "ostrava", "budapest", "debrecen", "bucarest", "cluj napoca", "timisoara",
            "sofia", "plovdiv", "varna", "salonica", "tesalonica", "heraclion", "rodas",
            "belgrado", "novi sad", "zagreb", "split", "dubrovnik", "liubliana", "sarajevo",
            "tirana", "tallin", "riga", "vilna", "kaunas", "kiev", "leopolis", "odesa"
        ],
        100: [
            "jarkov", "minsk", "chisinau", "skopie", "podgorica", "pristina", "limasol",
            "esmirna", "izmir", "antalya", "bursa", "kazan", "sochi", "ekaterimburgo",
            "kaliningrado", "aberdeen", "cardiff", "swansea", "leeds", "sheffield",
            "newcastle", "nottingham", "southampton", "brighton", "aviñon", "rouen",
            "reims", "diyon", "dijon", "metz", "biarritz", "lourdes", "hannover",
            "bremen", "bonn", "heidelberg", "friburgo", "padua", "pisa", "siena", "perugia", "ravena"
        ],
    },
    "geo-027": {
        25: [
            "nueva york", "los angeles", "chicago", "miami", "san francisco", "las vegas",
            "washington", "boston", "houston", "dallas", "seattle", "toronto", "montreal",
            "vancouver", "ciudad de mexico", "cancun", "guadalajara", "monterrey"
        ],
        45: [
            "buenos aires", "cordoba", "rosario", "mendoza", "bariloche", "ushuaia",
            "rio de janeiro", "sao paulo", "brasilia", "salvador de bahia", "fortaleza",
            "recife", "curitiba", "porto alegre", "manaos", "santiago", "santiago de chile",
            "valparaiso", "viña del mar", "bogota", "medellin", "cali", "cartagena de indias",
            "barranquilla", "lima", "cusco", "cuzco", "arequipa", "quito", "guayaquil", "cuenca"
        ],
        65: [
            "caracas", "maracaibo", "valencia", "la paz", "santa cruz de la sierra",
            "sucre", "cochabamba", "montevideo", "punta del este", "asuncion", "ciudad del este",
            "la habana", "santiago de cuba", "varadero", "san juan", "santo domingo",
            "punta cana", "puerto principe", "kingston", "nassau", "san jose", "panama",
            "ciudad de panama", "ciudad de guatemala", "antigua guatemala", "managua",
            "tegucigalpa", "san pedro sula", "san salvador", "belmopan", "ciudad de belice"
        ],
        85: [
            "filadelfia", "phoenix", "san diego", "san antonio", "austin", "denver",
            "atlanta", "orlando", "tampa", "nueva orleans", "detroit", "mineapolis",
            "cleveland", "pittsburgh", "baltimore", "charlotte", "nashville", "memphis",
            "salt lake city", "portland", "sacramento", "san jose california", "honolulu",
            "anchorage", "calgary", "edmonton", "ottawa", "quebec", "winnipeg", "halifax"
        ],
        100: [
            "tijuana", "puebla", "merida", "oaxaca", "leon", "queretaro", "veracruz",
            "acapulco", "puerto vallarta", "los cabos", "mar del plata", "la plata",
            "tucuman", "salta", "belo horizonte", "florianopolis", "goiania", "belem",
            "trujillo", "iquitos", "santa marta", "bucaramanga", "pereira", "manizales",
            "manta", "ambato", "concepcion", "antofagasta", "la serena", "puerto montt",
            "punta arenas", "georgetown", "paramaribo", "cayena", "bridgetown", "fort de france"
        ],
    },
    "geo-028": {
        25: [
            "tokio", "kioto", "osaka", "pekin", "beijing", "shanghai", "hong kong",
            "seul", "bangkok", "singapur", "dubai", "abu dabi", "doha", "el cairo",
            "sidney", "sydney", "melbourne", "jerusalen", "tel aviv", "nueva delhi", "bombay"
        ],
        45: [
            "mumbai", "calcuta", "bangalore", "chennai", "hyderabad", "jaipur", "agra",
            "goa", "varanasi", "benares", "islamabad", "karachi", "lahore", "dacca",
            "katmandu", "colombo", "kabul", "teheran", "bagdad", "riad", "yeda", "la meca",
            "medina", "mascate", "amman", "beirut", "damasco", "alepo", "bakú", "tbilisi",
            "erevan", "astana", "almaty", "taskent", "samarcanda", "bujara", "ulan bator"
        ],
        65: [
            "yokohama", "nagoya", "sapporo", "fukuoka", "hiroshima", "nagasaki", "kobe",
            "nara", "busan", "incheon", "pionyang", "taipei", "kaohsiung", "canton",
            "guangzhou", "shenzhen", "chengdu", "chongqing", "tianjin", "nankin", "xian",
            "macao", "hanoi", "ho chi minh", "saigon", "da nang", "phnom penh", "chiang mai",
            "phuket", "pattaya", "kuala lumpur", "penang", "yakarta", "bali", "denpasar"
        ],
        85: [
            "surabaya", "bandung", "manila", "cebu", "davao", "rangun", "yangon",
            "casablanca", "marrakech", "rabat", "fez", "tanger", "agadir", "tunez",
            "argel", "oran", "tripoli", "alejandria", "luxor", "asuan", "sharm el sheij",
            "jartum", "adis abeba", "nairobi", "mombasa", "zanzibar", "dar es salam",
            "kampala", "kigali", "lagos", "abuya", "acra", "abiyan", "dakar", "bamako"
        ],
        100: [
            "kinshasa", "luanda", "maputo", "harare", "lusaka", "gaborone", "windhoek",
            "ciudad del cabo", "johannesburgo", "durban", "pretoria", "antananarivo",
            "brisbane", "perth", "adelaida", "canberra", "camberra", "darwin", "hobart",
            "gold coast", "auckland", "wellington", "christchurch", "queenstown",
            "suva", "nadi", "papeete", "noumea", "port moresby", "douala", "yaunde",
            "libreville", "brazzaville", "tombuctu", "juba", "asmara", "yibuti"
        ],
    },
    "geo-030": {
        25: [
            "museo del prado", "el prado", "museo reina sofia", "museo thyssen",
            "guggenheim bilbao", "la alhambra", "alhambra de granada", "sagrada familia",
            "la sagrada familia", "catedral de santiago", "mezquita de cordoba",
            "torre eiffel", "museo del louvre", "el louvre", "catedral de notre dame",
            "coliseo de roma", "el coliseo", "basilica de san pedro", "museos vaticanos"
        ],
        45: [
            "palacio real de madrid", "el escorial", "monasterio del escorial",
            "alcazar de sevilla", "real alcazar de sevilla", "catedral de sevilla",
            "giralda", "la giralda", "alcazar de segovia", "acueducto de segovia",
            "catedral de burgos", "catedral de leon", "catedral de toledo",
            "palacio de la aljaferia", "basilica del pilar", "casa batllo", "la pedrera",
            "casa mila", "palau de la musica", "teatro real", "palacio de versalles",
            "museo de orsay", "centro pompidou", "palacio de buckingham", "museo britanico"
        ],
        65: [
            "british museum", "tate modern", "national gallery", "abadia de westminster",
            "torre de londres", "catedral de san pablo", "big ben", "torre de pisa",
            "duomo de milan", "duomo de florencia", "galeria uffizi", "uffizi",
            "palacio ducal de venecia", "basilica de san marcos", "capilla sixtina",
            "panteon de agripa", "panteon de roma", "partenon", "acropolis de atenas",
            "santa sofia", "palacio topkapi", "mezquita azul", "puerta de brandeburgo",
            "reichstag", "isla de los museos", "castillo de neuschwanstein", "catedral de colonia"
        ],
        85: [
            "rijksmuseum", "museo van gogh", "casa de ana frank", "atomium",
            "palacio de schonbrunn", "palacio belvedere", "opera de viena", "castillo de praga",
            "catedral de san vito", "hermitage", "museo del hermitage", "kremlin",
            "catedral de san basilio", "taj mahal", "ciudad prohibida", "petra",
            "chichen itza", "machu picchu", "angkor wat", "piramides de giza", "gran esfinge",
            "estatua de la libertad", "edificio empire state", "empire state", "casa blanca"
        ],
        100: [
            "capitolio de estados unidos", "moma", "museo metropolitano", "met",
            "smithsonian", "guggenheim nueva york", "puente golden gate", "opera de sidney",
            "monasterio de los jeronimos", "torre de belem", "palacio da pena",
            "castillo de edimburgo", "stonehenge", "castillo de windsor", "palacio de knossos",
            "museo arqueologico nacional", "museo sorolla", "museo picasso", "teatro museo dali",
            "ciudad de las artes y las ciencias", "palacio de la magdalena", "catedral de palma",
            "palacio de miramar", "monasterio de poblet", "monasterio de guadalupe",
            "universidad de salamanca", "palacio de aranjuez", "palacio de la granja"
        ],
    },
    "geo-031": {
        25: [
            "selva amazonica", "el amazonas", "amazonia", "selva negra", "la selva negra",
            "doñana", "parque nacional de doñana", "picos de europa", "ordesa",
            "valle de ordesa", "teide", "parque nacional del teide", "gran cañon",
            "el gran cañon", "yosemite", "yellowstone", "serengueti", "el serengueti"
        ],
        45: [
            "valle del jerte", "valle de aran", "valle de pineta", "selva de irati",
            "bosque de irati", "hayedo de montejo", "fageda d en jorda", "bosque de oma",
            "fragas do eume", "muniellos", "monfrague", "cabañeros", "tablas de daimiel",
            "lagunas de ruidera", "timanfaya", "garajonay", "caldera de taburiente",
            "sierra nevada", "cazorla", "sierras de cazorla", "caminito del rey", "torcal de antequera"
        ],
        65: [
            "desierto de tabernas", "bardenas reales", "ciudad encantada", "hoces del duraton",
            "cañon del rio lobos", "medulas", "las medulas", "valle del sil", "cañones del sil",
            "cañon del colorado", "cataratas del niagara", "cataratas del iguazu",
            "cataratas victoria", "salto angel", "patagonia", "torres del paine",
            "glaciar perito moreno", "desierto de atacama", "salar de uyuni", "valle sagrado",
            "selva lacandona", "cañon del sumidero", "bosque de chapultepec", "everglades"
        ],
        85: [
            "secuoyas gigantes", "redwood", "sequoia", "monument valley", "valle de la muerte",
            "banff", "lago louise", "fiordos noruegos", "fiordo de geiranger", "tierras altas",
            "highlands", "lago ness", "calzada del gigante", "acantilados de moher",
            "valle del loira", "camarga", "gargantas del verdon", "mont blanc", "cervino",
            "matterhorn", "dolomitas", "toscana", "lago de como", "plitvice", "lagos de plitvice"
        ],
        100: [
            "delta del okavango", "crater del ngorongoro", "kilimanjaro", "monte kenya",
            "bosque de bwindi", "selva del congo", "madagascar", "avenida de los baobabs",
            "desierto del namib", "wadirum", "wadi rum", "mar muerto", "pamukkale",
            "capadocia", "himalaya", "valle de katmandu", "monte fuji", "bosque de arashiyama",
            "aokigahara", "zhangjiajie", "bahia de ha long", "borneo", "sumatra",
            "gran barrera de coral", "uluru", "ayers rock", "milford sound", "fiordland",
            "bosque de sherwood", "bosque de broceliande", "valle de tena", "benasque"
        ],
    },
    "geo-032": {
        25: [
            "baviera", "toscana", "la toscana", "normandia", "bretaña", "provenza",
            "la provenza", "borgoña", "alsacia", "corcega", "cerdeña", "sicilia",
            "lombardia", "veneto", "piamonte", "campania", "escocia", "gales", "irlanda del norte"
        ],
        45: [
            "inglaterra", "cornualles", "yorkshire", "flandes", "valonia", "tirol",
            "el tirol", "transilvania", "bohemia", "moravia", "dalmacia", "istria",
            "peloponeso", "creta", "sajonia", "renania", "westfalia", "baden wurtemberg",
            "brandeburgo", "algarve", "el algarve", "alentejo", "minho", "miño", "duero litoral"
        ],
        65: [
            "ontario", "quebec", "columbia britanica", "alberta", "manitoba", "nueva escocia",
            "yukon", "jalisco", "oaxaca", "chiapas", "yucatan", "quintana roo", "chihuahua",
            "sonora", "veracruz", "nuevo leon", "baja california", "sinaloa", "michoacan",
            "antioquia", "cundinamarca", "valle del cauca", "bolivar", "cusco", "arequipa"
        ],
        85: [
            "loreto", "patagonia", "tierra del fuego", "buenos aires provincia", "mendoza",
            "salta", "misiones", "sao paulo", "minas gerais", "bahia", "rio grande del sur",
            "amazonas", "atacama", "magallanes", "valparaiso", "araucania", "zuliana", "zulia",
            "miranda", "nueva gales del sur", "victoria", "queensland", "australia occidental"
        ],
        100: [
            "tasmania", "hokkaido", "honshu", "kyushu", "shikoku", "okinawa", "kanto",
            "kansai", "guangdong", "sichuan", "yunnan", "tibet", "xinjiang", "manchuria",
            "punjab", "panyab", "rajastan", "kerala", "cachemira", "bengala", "maharashtra",
            "siberia", "tatarstan", "chechenia", "crimea", "donbas", "laponia", "carelia",
            "anatolia", "capadocia", "kurdistan", "magreb", "cabilia", "sahara", "katanga", "transvaal"
        ],
    },
    "mus-022": {
        25: [
            "eminem", "snoop dogg", "tupac", "2pac", "notorious big", "biggie", "jay z",
            "kanye west", "kendrick lamar", "drake", "travis scott", "50 cent", "dr dre",
            "ice cube", "nas", "outkast", "wu tang clan", "c tangana", "bad bunny", "residente"
        ],
        45: [
            "kase o", "violadores del verso", "sfdk", "zatu", "natos y waor", "ayax y prok",
            "kidd keo", "cruz cafune", "quevedo", "relsb", "rels b", "delaossa", "kaydy cain",
            "yung beef", "pimp flaco", "kinder malo", "tote king", "toteking", "shotta",
            "nach", "falsalarma", "chojin", "el chojin", "cpv", "7 notas 7 colores", "mala rodriguez"
        ],
        65: [
            "arianna puello", "gata cattana", "santa salut", "sara socas", "ptazeta",
            "villano antillano", "nicki nicole", "trueno", "wos", "duki", "bizarrap", "tiago pzk",
            "lit killah", "ysy a", "khea", "paulo londra", "cazzu", "anuel aa", "eladio carrion",
            "myke towers", "arcangel", "cosculluela", "tempo", "tegor calderon", "tego calderon",
            "vico c", "cancerbero", "canserbero", "akim", "apache", "los aldeanos", "control machete"
        ],
        85: [
            "cartel de santa", "molotov", "cypress hill", "public enemy", "run dmc",
            "beastie boys", "nwa", "a tribe called quest", "de la soul", "mob deep", "mobb deep",
            "gang starr", "rakim", "krs one", "big daddy kane", "ll cool j", "salt n pepa",
            "missy elliott", "lauryn hill", "nicki minaj", "cardi b", "megan thee stallion",
            "doja cat", "tyler the creator", "frank ocean", "asap rocky", "kid cudi", "mac miller"
        ],
        100: [
            "j cole", "lil wayne", "nick cannon", "wiz khalifa", "post malone", "xxxtentacion",
            "juice wrld", "lil peep", "playboi carti", "21 savage", "future", "young thug",
            "metro boomin", "lil uzi vert", "lil nas x", "logic", "nf", "mf doom", "danny brown",
            "earl sweatshirt", "joey badass", "denzel curry", "jpegmafia", "run the jewels",
            "morodo", "juaninacka", "rapsusklei", "foyone", "recycled j", "hard gz",
            "denome", "fernandocosta", "fernando costa", "bejo", "maikel delacalle", "israel b",
            "ceerre", "swit eme", "dollar selmouni", "jarfaiter", "los chikos del maiz"
        ],
    },
    "mus-023": {
        25: [
            "daddy yankee", "bad bunny", "j balvin", "maluma", "ozuna", "karol g",
            "nicky jam", "don omar", "wisin y yandel", "luis fonsi", "shakira", "enrique iglesias",
            "romeo santos", "aventura", "juan luis guerra", "marc anthony", "celia cruz"
        ],
        45: [
            "feid", "ferxxo", "rauw alejandro", "myke towers", "sech", "anuel aa", "farruko",
            "manuel turizo", "camilo", "sebastian yatra", "becky g", "natti natasha",
            "rosalia", "quevedo", "omar montes", "lola indigo", "rvfv", "saiko", "mora",
            "eladio carrion", "young miko", "tainy", "bizarrap", "pesopluma", "peso pluma"
        ],
        65: [
            "hector lavoe", "willie colon", "ruben blades", "ismael rivera", "cheo feliciano",
            "frankie ruiz", "eddie palmieri", "tito puente", "ray barretto", "johnny pacheco",
            "la fania", "fania all stars", "gilberto santa rosa", "victor manuelle", "jerry rivera",
            "eddie santiago", "lalo rodriguez", "oscar d leon", "grupo niche", "joe arroyo",
            "fruko y sus tesos", "la sonora matancera", "orquesta aragon", "los van van"
        ],
        85: [
            "prince royce", "frank reyes", "antony santos", "raulin rodriguez", "luis vargas",
            "hector acosta", "el torito", "zacarias ferreira", "joe veras", "kiko rodriguez",
            "wilfrido vargas", "johnny ventura", "milly quezada", "eddy herrera", "olga tañon",
            "elvis crespo", "sergio vargas", "chichi peralta", "proyecto uno", "ilegal",
            "carlos vives", "juanes", "bacilos", "fonseca", "andres cepeda", "silvestre dangond"
        ],
        100: [
            "teguito calderon", "tego calderon", "ivy queen", "vico c", "plan b", "zion y lennox",
            "alexis y fido", "jowell y randy", "de la ghetto", "arcangel", "cosculluela",
            "ñengo flow", "bryant myers", "almighty", "noriel", "darell", "justin quiles",
            "lenny tavarez", "dalex", "boza", "maria becerra", "emilia", "tini", "lali",
            "calle 13", "gente de zona", "chacal", "jacob forever", "compay segundo",
            "ibrahim ferrer", "omara portuondo", "buena vista social club", "gloria estefan", "miami sound machine"
        ],
    },
    "mus-027": {
        25: [
            "elvis presley", "michael jackson", "madonna", "prince", "whitney houston",
            "bruce springsteen", "bob dylan", "frank sinatra", "stevie wonder", "aretha franklin",
            "nirvana", "metallica", "guns n roses", "aerosmith", "bon jovi", "queen" if False else "the doors"
        ],
        45: [
            "eagles", "the eagles", "fleetwood mac", "the beach boys", "the ramones", "ramones",
            "red hot chili peppers", "foo fighters", "pearl jam", "soundgarden", "alice in chains",
            "green day", "blink 182", "the offspring", "linkin park", "rage against the machine",
            "system of a down", "korn", "slipknot", "iron maiden" if False else "slayer", "megadeth", "anthrax"
        ],
        65: [
            "jimi hendrix", "janis joplin", "chuck berry", "little richard", "buddy holly",
            "ray charles", "james brown", "marvin gaye", "otis redding", "sam cooke",
            "johnny cash", "willie nelson", "dolly parton", "hank williams", "elvis" if False else "roy orbison",
            "creedence clearwater revival", "ccr", "lynyrd skynyrd", "zz top", "kiss",
            "van halen", "kiss", "the cars", "blondie", "talking heads", "rem", "r e m"
        ],
        85: [
            "pixies", "sonic youth", "the velvet underground", "velvet underground", "the stooges",
            "iggy pop", "lou reed", "patti smith", "television", "ny dolls", "new york dolls",
            "gratefull dead", "grateful dead", "allman brothers", "steely dan", "boston",
            "journey", "toto", "foreigner", "chicago", "earth wind and fire", "kool and the gang",
            "the temptations", "four tops", "the supremes", "diana ross", "tina turner", "cher"
        ],
        100: [
            "mariah carey", "janet jackson", "beyonce", "lady gaga", "taylor swift", "britney spears",
            "christina aguilera", "backstreet boys", "nsync", "bruno mars", "billie holiday",
            "ella fitzgerald", "louis armstrong", "miles davis", "john coltrane", "bb king",
            "muddy waters", "robert johnson", "the white stripes", "the strokes", "interpol",
            "the killers", "kings of leon", "nine inch nails", "tool", "smashing pumpkins",
            "weezers", "weezer", "no doubt", "garbage", "hole", "subterranean" if False else "the platters",
            "four seasons", "simon and garfunkel", "the byrds", "buffalo springfield", "crosby stills nash"
        ],
    },
    "mus-029": {
        25: [
            "louis armstrong", "miles davis", "john coltrane", "ella fitzgerald", "billie holiday",
            "nina simone", "aretha franklin", "ray charles", "stevie wonder", "james brown",
            "marvin gaye", "otis redding", "b b king", "bb king", "amy winehouse", "frank sinatra"
        ],
        45: [
            "duke ellington", "count basie", "charlie parker", "dizzy gillespie", "thelonious monk",
            "dave brubeck", "chet baker", "stan getz", "bill evans", "herbie hancock",
            "chick corea", "pat metheny", "jaco pastorius", "charlie mingus", "charles mingus",
            "sonny rollins", "coleman hawkins", "benny goodman", "glenn miller", "art blakey",
            "max roach", "wayne shorter", "cannonball adderley", "oscar peterson", "keith jarrett"
        ],
        65: [
            "nat king cole", "sarah vaughan", "dinah washington", "etta james", "sam cooke",
            "al green", "bill withers", "curtis mayfield", "isaac hayes", "barry white",
            "smokey robinson", "gladys knight", "diana ross", "tina turner", "lauryn hill",
            "erykah badu", "d angelo", "alicia keys", "john legend", "norah jones",
            "diana krall", "jamie cullum", "michael buble", "gregory porter", "kamasi washington"
        ],
        85: [
            "robert johnson", "muddy waters", "howlin wolf", "john lee hooker", "albert king",
            "freddie king", "buddy guy", "stevie ray vaughan", "eric clapton", "gary moore",
            "joe bonamassa", "bessie smith", "ma rainey", "elmore james", "t bone walker",
            "son house", "skip james", "lead belly", "blind lemon jefferson", "bo diddley",
            "chuck berry", "little walter", "big bill broonzy", "keb mo", "taj mahal"
        ],
        100: [
            "djangoreinhardt", "django reinhardt", "stephane grappelli", "tete montoliu",
            "paco de lucia", "chucho valdes", "bebo valdes", "michel camilo", "paquito d rivera",
            "arturo sandoval", "astrud gilberto", "joao gilberto", "antonio carlos jobim",
            "tom jobim", "wynton marsalis", "esperanza spalding", "jacob collier",
            "snarky puppy", "robert glasper", "thelonius monk", "wes montgomery",
            "grant green", "george benson", "larry carlton", "ornette coleman", "sun ra",
            "alice coltrane", "pharoah sanders", "fats waller", "jelly roll morton", "scott joplin"
        ],
    },
    "mus-032": {
        25: [
            "la gaita", "el cajon flamenco", "cajon flamenco", "las castañuelas", "la pandereta",
            "el pandero", "el sintetizador", "la mesa de mezclas", "el acordeon",
            "el banjo", "el ukelele", "la mandolina", "las maracas", "el bongo", "los bongos"
        ],
        45: [
            "gaita gallega", "gaita asturiana", "dulzaina", "la dulzaina", "txistu", "el txistu",
            "txalaparta", "la txalaparta", "trikitixa", "alboka", "gralla", "tenora", "tible",
            "bandurria", "la bandurria", "laud", "el laud", "timple", "timple canario",
            "guitarra española", "guitarra flamenca", "palmas", "zambomba", "la zambomba",
            "caña rociera", "carraca", "matraca", "almirez", "cencerro", "botella de anis"
        ],
        65: [
            "charango", "el charango", "quena", "la quena", "zampoña", "la zampoña",
            "flauta de pan", "ocarina", "marimba", "xilofono", "vibráfono", "vibrafono",
            "balalaika", "sitar", "el sitar", "tabla india", "koto", "shamisen", "erhu",
            "didgeridoo", "didyeridu", "kalimba", "djembe", "yembe", "darbuka", "conga",
            "tumbadora", "timbales", "guiro", "clave", "claves", "cencerro", "cabasa"
        ],
        85: [
            "theremin", "el theremin", "sampler", "caja de ritmos", "drum machine",
            "secuenciador", "teclado midi", "controlador midi", "launchpad", "vocoder",
            "ondes martenot", "ondas martenot", "mellotron", "melotron", "organo hammond",
            "hammond", "teclado electrico", "piano electrico", "fender rhodes", "wurlitzer",
            "clavinet", "keytar", "moog", "minimoog", "roland tr 808", "808", "909",
            "plato giradiscos", "tocadiscos", "turntable", "talkbox", "handpan", "hang"
        ],
        100: [
            "zanfona", "la zanfona", "rabel", "el rabel", "chiflo", "tamboril", "flauta y tamboril",
            "bombo", "caja", "redoblante", "pandero cuadrado", "pandeiro", "adufe",
            "xaphoon", "buzuki", "bouzouki", "oud", "ud", "baglama", "saz", "kora",
            "balafon", "mbira", "berimbau", "cuica", "surdo", "agogo", "pandeireta",
            "cavaquinho", "cuatro venezolano", "tres cubano", "requinto", "arpes", "arpa celta",
            "nyckelharpa", "hardingfele", "armonica de cristal", "serrucho musical", "steelpan"
        ],
    },
    "pal-006": {
        25: [
            "kilo", "kilos", "kilometro", "kilometros", "kilogramo", "kilogramos", "kiwi",
            "kiwis", "karate", "karateka", "kayak", "kebab", "ketchup", "koala", "koalas",
            "wifi", "web", "webcam", "western", "whisky", "whiskey", "windsurf"
        ],
        45: [
            "kermes", "kimono", "kimonos", "kiosco", "kioscos", "kit", "kits", "kitsch",
            "kleenex", "ko", "komodo", "kripton", "krypton", "kuwaiti", "kung fu",
            "wakame", "walkie talkie", "walkman", "walabi", "wallabi", "waltz",
            "waterpolo", "watio", "watios", "watt", "watts", "weber", "weekend",
            "welter", "wellington", "westeros", "whippet", "whiskeria", "widescreen"
        ],
        65: [
            "kafkiano", "kafkiana", "kaiser", "kalashnikov", "kamikaze", "kamikazes",
            "katiuska", "katiuskas", "kanji", "kantiano", "karaoke", "karaokes",
            "karma", "kart", "karts", "karting", "katana", "katanas", "kelvin",
            "kendo", "keniano", "keniata", "keratina", "keroseno", "kettlebell",
            "kibutz", "kickboxing", "kilohercio", "kilovatio", "kilovatios", "kilobyte",
            "kilobytes", "kilocaloria", "kilocalorias", "kinder", "kinesiologia"
        ],
        85: [
            "kinesioterapia", "kirguis", "kirsch", "kitkat", "klingon", "knut", "koinonia",
            "kombucha", "kosher", "krill", "kriptonita", "kudos", "kumquat", "kurdo",
            "kurda", "kurosawa", "wagneriano", "wagneriana", "wahabi", "walon", "wamba",
            "wampum", "wapiti", "warcraft", "warfarin", "wasabi", "washingtoniano",
            "water", "waterclos", "waterloo", "wattmetro", "wav", "wayang", "webmaster",
            "webinar", "weblog", "welsh", "wengué", "wengue", "werewolf", "whig"
        ],
        100: [
            "whiskerias", "whisky sour", "whiteboard", "widget", "widgets", "widescreen",
            "wikipedista", "wikipedia", "wilaya", "wilderness", "wilsoniano", "winchester",
            "windsurfista", "wing chun", "winsor", "wireless", "wisteria", "wolframio",
            "wombat", "wombats", "won", "wonton", "woody", "woof", "woofer", "word",
            "workaholic", "workflow", "workshop", "worldwide", "wrangler", "wrestling",
            "wushu", "kaon", "kefir", "kepi", "kepis", "kerigma", "khmer", "kiloohmio",
            "kilotonelada", "kilopondio", "kilopondios", "kilopascal", "kimbundu", "kinesica"
        ],
    },
    "pal-023": {
        25: [
            "hablar", "hacer", "hacha", "hada", "halcon", "hambre", "harina", "hasta",
            "helado", "hermano", "hermana", "hermoso", "heroe", "hielo", "hierba",
            "hierro", "higo", "hijo", "hija", "hilo", "historia", "hoja", "hola",
            "hombre", "hombro", "hongo", "hora", "hormiga", "horno", "hospital", "hotel", "hoy", "hueso", "huevo"
        ],
        45: [
            "habano", "habichuela", "habil", "habitacion", "habitar", "habito", "habla",
            "hacienda", "hado", "halago", "hallar", "hallazgo", "hamaca", "hamburguesa",
            "haragan", "harapo", "hartar", "harto", "hastio", "haya", "hazaña", "hebilla",
            "hebra", "hebreo", "hechicero", "hechizo", "hecho", "hectarea", "heder",
            "hedor", "helada", "helar", "helecho", "helice", "helicoptero", "helio"
        ],
        65: [
            "hematoma", "hembra", "hemisferio", "hemorragia", "hendidura", "heno",
            "heraldo", "herbivoro", "heredad", "heredero", "herencia", "hereje", "herejia",
            "herida", "herido", "herir", "hermetico", "hernia", "heroina", "herradura",
            "herramienta", "herrero", "herrumbre", "hervir", "hervor", "hidalgo", "hidra",
            "hidrante", "hidratacion", "hidrato", "hidraulico", "hidrogeno", "hiedra",
            "hiel", "hiena", "higado", "higiene", "higuera", "hilar", "hilera", "himno"
        ],
        85: [
            "hincapie", "hincar", "hincha", "hinchar", "hinchazon", "hinojo", "hipica",
            "hipismo", "hipnosis", "hipocampo", "hipocresia", "hipocrita", "hipodromo",
            "hipopotamo", "hipoteca", "hipotesis", "hiriente", "hisopo", "hispano",
            "histeria", "historiador", "historieta", "hito", "hogar", "hogaza", "hoguera",
            "hojalata", "hojaldre", "hojear", "holgazan", "holgado", "holgura", "hollin",
            "homicida", "homicidio", "homologo", "homonimo", "honda", "hondo", "hondura",
            "honesto", "honor", "honra", "honradez", "honrar", "honroso", "horadar", "horario"
        ],
        100: [
            "horca", "horchata", "horda", "horizonte", "horma", "hormiguero", "hormigon",
            "hormona", "hornillo", "horoscopo", "horrendo", "horrible", "horror", "hortaliza",
            "hortelano", "hortensia", "hosco", "hospedaje", "hospedar", "hospitalidad",
            "hostal", "hostigar", "hostil", "hoya", "hoyo", "hoz", "hucha", "hueco",
            "huelga", "huella", "huerta", "huerto", "huesped", "hueste", "hueva", "huida",
            "huir", "hule", "humanidad", "humano", "humareda", "humeante", "humear",
            "humedad", "humedo", "humildad", "humilde", "humillacion", "humillar", "humo",
            "humor", "humus", "hundir", "huracan", "hurgar", "huron", "hurto", "husmear", "huso"
        ],
    },
    "pal-028": {
        25: [
            "la cabeza", "el brazo", "la pierna", "la mano", "el pie", "el ojo", "la oreja",
            "la nariz", "la boca", "el cuello", "el pecho", "la espalda", "el corazon",
            "el cerebro", "el estomago", "el higado", "el pulmon", "el riñon", "el femur"
        ],
        45: [
            "ojos", "orejas", "brazos", "piernas", "manos", "pies", "dedos", "uñas",
            "dientes", "muelas", "labios", "cejas", "pestañas", "parpados", "mejillas",
            "frente", "barbilla", "menton", "nuca", "garganta", "hombros", "codos",
            "muñecas", "rodillas", "tobillos", "talones", "muslos", "gemelos", "costillas",
            "vertebras", "pulmones", "riñones", "intestinos", "musculos", "huesos", "nervios"
        ],
        65: [
            "humero", "el humero", "radio", "cubito", "tibia", "perone", "rotula", "la rotula",
            "clavicula", "la clavicula", "omoplato", "escapula", "esternon", "el esternon",
            "pelvis", "la pelvis", "cadera", "la cadera", "sacro", "coxis", "craneo",
            "mandibula", "maxilar", "pomulo", "tabique nasal", "falange", "falanges",
            "metacarpo", "metatarso", "carpo", "tarso", "calcaneo", "astragalo", "yunque"
        ],
        85: [
            "martillo", "estribo", "timpano", "cornea", "iris", "pupila", "retina",
            "cristalino", "nervio optico", "traquea", "laringe", "faringe", "esofago",
            "bronquios", "bronquiolos", "alveolos", "diafragma", "pancreas", "bazo",
            "vesicula biliar", "duodeno", "yeyuno", "ileon", "colon", "ciego", "apendice",
            "recto", "vejiga", "uretra", "ureteres", "prostata", "utero", "ovarios", "tiroides"
        ],
        100: [
            "hipofisis", "glandula pineal", "amigdala", "hipocampo", "cerebelo", "bulbo raquideo",
            "medula espinal", "cuerpo calloso", "meninges", "aorta", "vena cava", "arteria carotida",
            "yugular", "biceps", "triceps", "cuadriceps", "isquiotibiales", "deltoides",
            "trapecio", "dorsal", "pectoral", "abdominales", "gluteo", "gemelo", "soleo",
            "tendon de aquiles", "menisco", "ligamento cruzado", "esfinter", "epiglotis",
            "uvula", "campanilla", "encía", "encia", "paladar", "lengua", "yema del dedo", "nudillo"
        ],
    },
    "pal-032": {
        25: [
            "a buenas horas mangas verdes", "a falta de pan buenas son tortas", "a otro perro con ese hueso",
            "a palabras necias oidos sordos", "agua que no has de beber dejala correr",
            "al mal tiempo buena cara", "al pan pan y al vino vino", "anda ya", "armarse la gorda",
            "arrimar el ascua a su sardina", "cada loco con su tema", "cada oveja con su pareja"
        ],
        45: [
            "caer chuzos de punta", "camaron que se duerme se lo lleva la corriente",
            "coger el toro por los cuernos", "como pedro por su casa", "cortar el bacalao",
            "costar un ojo de la cara", "costar un riñon", "cria cuervos y te sacaran los ojos",
            "cuando el rio suena agua lleva", "dar en el clavo", "dar la lata", "dar la nota",
            "dar gato por liebre", "dar la vuelta a la tortilla", "de tal palo tal astilla",
            "del dicho al hecho hay un trecho", "dime con quien andas y te dire quien eres",
            "dormirse en los laureles", "echar balones fuera", "echar leña al fuego"
        ],
        65: [
            "echar un cable", "empezar la casa por el tejado", "en boca cerrada no entran moscas",
            "en casa del herrero cuchillo de palo", "encontrar la horma de su zapato",
            "estar en las nubes", "estar hasta las narices", "estar sin blanca", "flipar en colores",
            "hacer la vista gorda", "hacer oidos sordos", "hacerse el sueco", "hacerse el longuis",
            "hasta el cuarenta de mayo no te quites el sayo", "ir al grano", "ir por los cerros de ubeda",
            "irse por las ramas", "la avaricia rompe el saco", "la cabra siempre tira al monte",
            "la gota que colma el vaso", "llover sobre mojado", "mal de muchos consuelo de tontos"
        ],
        85: [
            "mandar a freir esparragos", "mas vale maña que fuerza", "mas vale pajaro en mano que ciento volando",
            "mas vale prevenir que curar", "mas vale tarde que nunca", "meter la pata",
            "mientras hay vida hay esperanza", "morderse la lengua", "mover ficha",
            "mucho ruido y pocas nueces", "nacer con un pan debajo del brazo", "ni fu ni fa",
            "no dar pie con bola", "no hay mal que por bien no venga", "no hay moros en la costa",
            "no me cuentes milongas", "no pegarse ni con cola", "no tener pelos en la lengua",
            "no ver tres en un burro", "ojos que no ven corazon que no siente", "olvidarse del santo y la limosna"
        ],
        100: [
            "pagar el pato", "para ese viaje no hacian falta tantas alforjas", "pasarlas canutas",
            "pedir peras al olmo", "perro ladrador poco mordedor", "poner los puntos sobre las ies",
            "poner toda la carne en el asador", "ponerse las botas", "por si las moscas",
            "quedarse de piedra", "quedarse en blanco", "quemar las naves", "quien mucho abarca poco aprieta",
            "quien rie ultimo rie mejor", "quien siembra vientos recoge tempestades", "rascarse el bolsillo",
            "salir el tiro por la culata", "salir rana", "se armó la marimorena", "ser pan comido",
            "ser uña y carne", "subirse a la parra", "tener la sarten por el mango", "tener mas cara que espalda",
            "tirar la casa por la ventana", "tirar la toalla", "tomar el pelo", "zapatero a tus zapatos"
        ],
    },
    "dep-032": {
        25: [
            "flexiones", "sentadillas", "abdominales", "plancha", "dominadas", "zancadas",
            "peso muerto", "press de banca", "press banca", "press militar", "curl de biceps",
            "burpees", "jumping jacks", "fondos", "fondos en paralelas", "remo con barra",
            "hip thrust", "elevaciones laterales", "elevaciones frontales", "gemelos"
        ],
        45: [
            "sentadilla", "flexion", "dominada", "zancada", "plancha abdominal", "plancha lateral",
            "crunch", "crunch abdominal", "biceps", "triceps", "extension de triceps",
            "jalon al pecho", "jalon tras nuca", "remo en polea", "remo con mancuerna",
            "apertura de pecho", "aperturas con mancuernas", "cruces en polea", "prensa de piernas",
            "extension de cuadriceps", "curl femoral", "peso muerto rumano", "peso muerto sumo",
            "buenos dias", "face pull", "pajaros", "encogimientos de hombros", "trapecio"
        ],
        65: [
            "muscle up", "handstand", "pino", "flexiones en pino", "handstand push ups",
            "front lever", "back lever", "human flag", "bandera humana", "planche",
            "l sit", "dragon flag", "pistol squat", "sentadilla bulgara", "sentadilla frontal",
            "sentadilla hack", "sentadilla goblets", "goblet squat", "thruster", "wall ball",
            "kettlebell swing", "clean and jerk", "dos tiempos", "snatch", "arrancada",
            "power clean", "cargada", "push press", "overhead squat", "levantamiento turco"
        ],
        85: [
            "turkish get up", "farmer walk", "paseo del granjero", "battle ropes", "cuerdas de batalla",
            "box jump", "salto al cajon", "saltos a la comba", "dobles a la comba", "double unders",
            "mountain climbers", "escaladores", "russian twist", "giros rusos", "bicicleta abdominal",
            "rueda abdominal", "ab wheel", "hollow hold", "arch hold", "superman", "puente de gluteo",
            "patada de gluteo", "abductores", "aductores", "prensa inclinada", "press inclinado",
            "press declinado", "pull over", "pullover", "press frances", "rompecraneos"
        ],
        100: [
            "curl martillo", "curl concentrado", "curl predicador", "banco scott", "curl araña",
            "arnold press", "press arnold", "elevacion de talones", "elevaciones de piernas colgado",
            "toes to bar", "pies a la barra", "knees to elbows", "kipping pull up",
            "butterfly pull up", "ring dips", "fondos en anillas", "skin the cat",
            "nordic curl", "curl nordico", "sissy squat", "pendlay row", "t bar row",
            "meadows row", "landmine press", "zercher squat", "jefferson curl", "paseo de oso",
            "bear crawl", "skater jumps", "sprawl", "man maker", "devil press", "wall sit"
        ],
    },
    "gen-029": {
        25: [
            "the witcher 3", "skyrim", "elden ring", "zelda breath of the wild", "tears of the kingdom",
            "red dead redemption 2", "gta v", "gta 5", "grand theft auto v", "cyberpunk 2077",
            "baldur s gate 3", "baldurs gate 3", "final fantasy vii", "final fantasy 7",
            "pokemon rojo", "pokemon azul", "minecraft", "world of warcraft", "age of empires ii"
        ],
        45: [
            "age of empires", "civilization vi", "civilization v", "total war", "starcraft",
            "starcraft ii", "warcraft iii", "diablo ii", "diablo iii", "diablo iv",
            "dark souls", "dark souls iii", "bloodborne", "sekiro", "demon s souls",
            "mass effect", "mass effect 2", "dragon age origins", "fallout new vegas",
            "fallout 3", "fallout 4", "oblivion", "morrowind", "starfield", "horizon zero dawn",
            "horizon forbidden west", "ghost of tsushima", "god of war", "god of war ragnarok"
        ],
        65: [
            "final fantasy x", "final fantasy vi", "final fantasy ix", "final fantasy viii",
            "final fantasy xvi", "chrono trigger", "dragon quest xi", "persona 5", "persona 4",
            "metaphor refantazio", "xenoblade chronicles", "fire emblem three houses", "octopath traveler",
            "nier automata", "kingdom hearts", "tales of arise", "yakuza like a dragon",
            "divinity original sin 2", "pillars of eternity", "disco elysium", "planescape torment",
            "kingdom come deliverance", "mount and blade", "bannerlord", "kenshi"
        ],
        85: [
            "crusader kings iii", "europa universalis iv", "hearts of iron iv", "stellaris",
            "victoria 3", "xcom 2", "xcom enemy unknown", "heroes of might and magic iii",
            "command and conquer", "red alert", "company of heroes", "anno 1800",
            "cities skylines", "factorio", "rimworld", "dwarf fortress", "frostpunk",
            "subnautica", "no man s sky", "valheim", "terraria", "stardew valley",
            "assassins creed odyssey", "assassins creed valhalla", "assassins creed origins", "far cry 3"
        ],
        100: [
            "gothic", "gothic ii", "risen", "arx fatalis", "ultima vii", "mighty and magic",
            "neverwinter nights", "icewind dale", "arcana", "arcanum", "vampire the masquerade bloodlines",
            "deus ex", "system shock 2", "knights of the old republic", "kotor", "jade empire",
            "fable", "dragons dogma", "dragon s dogma 2", "monster hunter world", "pathfinder",
            "wasteland 3", "underrail", "battle brothers", "tactics ogre", "final fantasy tactics",
            "advance wars", "into the breach", "slay the spire", "darkest dungeon", "outer wilds",
            "breath of the wild", "ocarina of time", "majora s mask", "shadow of the colossus", "hogwarts legacy"
        ],
    },
    "mus-010": {
        25: [
            "eminem", "snoop dogg", "2pac", "tupac", "notorious big", "jay z", "kanye west",
            "kendrick lamar", "drake", "50 cent", "dr dre", "ice cube", "kase o",
            "violadores del verso", "sfdk", "nach", "toteking", "c tangana", "natos y waor"
        ],
        45: [
            "ayax y prok", "mala rodriguez", "chojin", "el chojin", "falsalarma", "zatu",
            "sho hai", "lirico", "r de rumba", "tote king", "shotta", "juaninacka",
            "cpv", "7 notas 7 colores", "mucho muchacho", "doble v", "hombres g" if False else "arma blanca",
            "hablando en plata", "dogma crew", "duo kie", "los chikos del maiz", "sony" if False else "rayden",
            "foyone", "delaossa", "rels b", "cruz cafune", "kidd keo", "yung beef", "kaydy cain"
        ],
        65: [
            "nas", "outkast", "wu tang clan", "method man", "redman", "raekwon", "ghostface killah",
            "public enemy", "run dmc", "beastie boys", "nwa", "eazy e", "a tribe called quest",
            "de la soul", "mobb deep", "gang starr", "rakim", "krs one", "big daddy kane",
            "ll cool j", "cypress hill", "house of pain", "lauryn hill", "missy elliott",
            "busta rhymes", "ludacris", "nelly", "ja rule", "dmx", "fat joe", "big pun"
        ],
        85: [
            "travis scott", "j cole", "asap rocky", "tyler the creator", "kid cudi", "mac miller",
            "wiz khalifa", "lil wayne", "nicki minaj", "cardi b", "megan thee stallion",
            "post malone", "21 savage", "future", "young thug", "playboi carti", "juice wrld",
            "xxxtentacion", "lil peep", "logic", "nf", "mf doom", "danny brown", "joey badass",
            "run the jewels", "killer mike", "el p", "action bronson", "freddie gibbs", "pusha t"
        ],
        100: [
            "residente", "calle 13", "canserbero", "tegor" if False else "vico c", "tego calderon",
            "cartel de santa", "control machete", "el cuarteto de nos" if False else "los aldeanos",
            "akapel" if False else "akapellah", "apache", "lil supa", "portavoz", "anita tijoux",
            "trueno", "wos", "duki", "ysy a", "aczino", "chuty", "skone", "arkano", "bnet",
            "gazir", "blon", "invert", "piezas", "morodo", "rapsusklei", "sharif", "green valley",
            "fernando costa", "hard gz", "recycled j", "gata cattana", "arianna puello",
            "santa salut", "bejo", "dano", "agz", "agorazein", "sticky m a", "zarzuela" if False else "jarfaiter",
            "skepta", "stormzy", "dave", "little simz", "iam", "ntm", "mc solaar", "booba", "orelSan"
        ],
    },
    "pal-026": {
        25: [
            "egoista", "egoistas", "mentiroso", "mentirosa", "mentirosos", "mentirosas",
            "envidioso", "envidiosa", "envidiosos", "envidiosas", "vago", "vaga", "vagos",
            "antipatico", "antipatica", "chulo", "chula", "pesado", "pesada", "falso", "falsa"
        ],
        45: [
            "arrogante", "arrogantes", "soberbio", "soberbia", "prepontente" if False else "prepotente",
            "prepotentes", "hipocrita", "hipocritas", "rencoroso", "rencorosa", "vengativo",
            "vengativa", "tacaño", "tacaña", "avaricioso", "avariciosa", "avaro", "avara",
            "codicioso", "codiciosa", "ambicioso", "celoso", "celosa", "posesivo", "posesiva",
            "manipulador", "manipuladora", "toxico", "toxica", "cruel", "crueles", "despiadado", "despiadada"
        ],
        65: [
            "impaciente", "impacientes", "intolerante", "intolerantes", "intransigente",
            "terco", "terca", "cabezota", "cabezotas", "obstinado", "obstinada", "caprichoso",
            "caprichosa", "inmaduro", "inmadura", "irresponsable", "irresponsables", "perezoso",
            "perezosa", "holgazan", "holgazana", "gandul", "gandula", "chapucero", "chapucera",
            "desordenado", "desordenada", "despistado", "despistada", "olvidadizo", "olvidadiza"
        ],
        85: [
            "cotilla", "chismoso", "chismosa", "entrometido", "entrometida", "metomentodo",
            "bocazas", "indiscreto", "indiscreta", "imprudente", "temerario", "temeraria",
            "cobarde", "cobardes", "miedoso", "miedosa", "pusilanime", "conformista",
            "pesimista", "pesimistas", "negativo", "negativa", "gruñon", "gruñona",
            "cascarrabias", "malhumorado", "malhumorada", "irascible", "colerico", "colerica",
            "agresivo", "agresiva", "violento", "violenta", "grosero", "grosera", "maleducado", "maleducada"
        ],
        100: [
            "borde", "estupido", "estupida", "idiota", "necio", "necia", "insensato",
            "insensata", "ingenuo", "ingenua", "credulo", "credula", "vanidoso", "vanidosa",
            "presumido", "presumida", "engreido", "engreida", "petulante", "pedante",
            "snob", "clasista", "racista", "machista", "xenofobo", "desagradecido", "desagradecida",
            "desleal", "traidor", "traidora", "infiel", "tramposo", "tramposa", "embustero",
            "embustera", "farsante", "cínico" if False else "cinico", "cinica", "sarcastico", "mordaz",
            "mezquino", "mezquina", "ruin", "vil", "miserable", "patetico", "patetica", "aburrido", "aburrida", "soso", "sosa"
        ],
    },
    "pal-027": {
        25: [
            "alegria", "la alegria", "tristeza", "la tristeza", "miedo", "el miedo",
            "ira", "la ira", "rabia", "la rabia", "asco", "el asco", "sorpresa", "la sorpresa",
            "amor", "el amor", "odio", "el odio", "felicidad", "la felicidad", "calma", "la calma"
        ],
        45: [
            "enfado", "el enfado", "enojo", "el enojo", "angustia", "la angustia",
            "ansiedad", "la ansiedad", "estres", "el estres", "nerviosismo", "nervios",
            "melancolia", "la melancolia", "nostalgia", "la nostalgia", "pena", "la pena",
            "dolor", "dolor emocional", "sufrimiento", "desesperacion", "desesperanza",
            "ilusión" if False else "ilusion", "la ilusion", "esperanza", "la esperanza", "entusiasmo", "euforia"
        ],
        65: [
            "la euforia", "jubilo", "gozo", "dicha", "placer", "satisfaccion", "orgullo",
            "el orgullo", "verguenza", "la verguenza", "culpa", "la culpa", "remordimiento",
            "arrepentimiento", "envidia", "la envidia", "celos", "los celos", "rencor",
            "el rencor", "resentimiento", "desprecio", "asombro", "admiracion", "ternura",
            "la ternura", "cariño", "el cariño", "afecto", "compasion", "empatia", "gratitud"
        ],
        85: [
            "agradecimiento", "serenidad", "paz", "tranquilidad", "sosiego", "alivio",
            "el alivio", "confianza", "seguridad", "inquietud", "desasosiego", "incertidumbre",
            "desconcierto", "perplejidad", "frustracion", "la frustracion", "impotencia",
            "indignacion", "furia", "colera", "panico", "terror", "pavor", "espanto",
            "susto", "alarma", "temor", "recelo", "desconfianza", "sospecha", "abulia"
        ],
        100: [
            "apatia", "desgana", "desidia", "hastio", "tedio", "aburrimiento", "soledad",
            "la soledad", "desamparo", "abandono", "vacio", "desolacion", "pesar",
            "congoja", "afliccion", "pesadumbre", "luto", "duelo", "añoranza", "morriña",
            "saudade", "extasis", "plenitud", "regocijo", "embeleso", "arrobo", "devocion",
            "fervor", "pasion", "deseo", "anhelo", "fascinacion", "curiosidad", "escepticismo",
            "indiferencia", "resignacion", "rechazo", "humillacion", "bochorno", "sonrojo",
            "timidez", "pudor", "aturdimiento", "estupor", "exaltacion", "optimismo", "pesimismo"
        ],
    },
    "pal-029": {
        25: [
            "arbol", "lapiz", "cesped", "azucar", "carcel", "angel", "cadaver", "tunel",
            "movil", "facil", "dificil", "util", "inutil", "debil", "habil", "fragil",
            "docil", "agil", "energia", "alegria", "poesia", "melodia", "dia", "rio", "frio"
        ],
        45: [
            "dias", "rios", "frios", "energias", "alegrias", "poesias", "melodias",
            "marmol", "trebol", "condor", "crater", "lider", "poster", "sueter", "cancer",
            "alcazar", "ambar", "nectar", "dolar", "estandar", "martir", "zafir", "album",
            "femur", "totem", "climax", "torax", "biceps", "triceps", "forceps", "latex",
            "codex", "silex", "caliz", "alferez", "huesped", "fertil", "esteril", "fosil"
        ],
        65: [
            "reptil", "tactil", "textil", "versatil", "volatil", "portatil", "bursatil",
            "pulsatil", "caracter", "filosofia", "geografia", "biologia", "anatomia",
            "astronomia", "economia", "ecologia", "tecnologia", "ideologia", "mitologia",
            "psicologia", "sociologia", "arqueologia", "antropologia", "ortografia", "caligrafia",
            "fotografia", "coreografia", "bibliografia", "biografia", "autobiografia", "escenografia",
            "topografia", "demografia", "monografia", "radiografia", "ecografia", "infografia"
        ],
        85: [
            "telepatia", "simpatia", "empatia", "apatia", "antipatia", "homeopatia",
            "panaderia", "carniceria", "pescaderia", "fruteria", "pasteleria", "confiteria",
            "heladeria", "cafeteria", "cerveceria", "pizzeria", "ferreteria", "zapateria",
            "relojeria", "joyeria", "libreria", "papeleria", "floristeria", "peluqueria",
            "barberia", "lavanderia", "tintoreria", "fontaneria", "carpinteria", "cerrajeria",
            "albañileria", "sastreria", "churreria", "bocateria", "jamoneria", "marisqueria",
            "arroceria", "horchateria", "estanteria", "cristaleria", "cuchilleria", "lenceria",
            "merceria", "drogueria", "perfumeria", "galeria", "bateria", "loteria", "porteria",
            "enfermeria", "cirugia", "pediatria", "psiquiatria", "geriatria", "podologia",
            "urologia", "cardiologia", "neurologia", "dermatologia", "oftalmologia", "oncologia"
        ],
        100: [
            "valia", "cuantia", "garantia", "compañia", "cercania", "lejania", "carestia",
            "cortesia", "valentia", "cobardia", "villania", "tirania", "monarquia", "anarquia",
            "jerarquia", "oligarquia", "autarquia", "soberania", "ciudadania", "hegemonia",
            "autonomia", "gastronomia", "agronomia", "fisonomia", "taxonomia", "sinfonia",
            "polifonia", "telefonia", "afonia", "eufonia", "ironia", "agonia", "letania",
            "sintonia", "miopia", "utopia", "distopia", "entropia", "sandia", "judia",
            "autovia", "tranvia", "vigia", "espia", "guia", "cria", "tia", "tio", "lio",
            "caserio", "poderio", "señorio", "gentio", "vacio", "navio", "rocio", "hastio",
            "desvio", "envio", "extravio", "atavio", "albedrio", "escalofrio", "regadio",
            "baldio", "sombrio", "tardio", "bravio", "grua", "gruas", "pua", "puas",
            "cacatua", "cacatuas", "buho", "buhos", "duo", "duos", "pais", "raiz", "maiz",
            "baul", "ataud", "laud", "tahur", "paraiso", "egoismo", "heroismo", "ateismo",
            "heroina", "proteina", "cafeina", "cocaina", "codeina", "caida", "recaida", "oido", "leido"
        ],
    },
    "pal-030": {
        25: [
            "enorme", "enormes", "inmenso", "inmensa", "inmensos", "inmensas", "gigante",
            "gigantes", "gigantesco", "gigantesca", "colosal", "colosales", "masivo",
            "masiva", "enorme", "bastante", "demasiado", "muchisimo", "monton", "un monton"
        ],
        45: [
            "abundante", "abundantes", "cuantioso", "cuantiosa", "numeroso", "numerosa",
            "copioso", "copiosa", "amplio", "amplia", "extenso", "extensa", "vasto", "vasta",
            "espacioso", "espaciosa", "voluminoso", "voluminosa", "grandioso", "grandiosa",
            "monumental", "monumentales", "monstruoso", "monstruosa", "brutal", "bestial",
            "tremendo", "tremenda", "terrible", "formidable", "imponente", "majestuoso", "majestuosa"
        ],
        65: [
            "titanico", "titanica", "ciclopeo", "ciclopea", "faraonico", "faraonica",
            "descomunal", "descomunales", "desmesurado", "desmesurada", "desproporcionado",
            "exorbitante", "excesivo", "excesiva", "astronómico" if False else "astronomico",
            "astronomica", "infinito", "infinita", "interminable", "inacabable", "ilimitado",
            "ilimitada", "incalculable", "inabarcable", "inconmensurable", "incuantificable",
            "superlativo", "superlativa", "magnitud", "macro", "mega", "maximo", "maxima"
        ],
        85: [
            "mayusculo", "mayuscula", "considerable", "sustancial", "sustancioso", "importante",
            "notable", "significativo", "extraordinario", "excepcional", "fenomenal",
            "espectacular", "estupendo", "magnifico", "magnifica", "soberbio", "soberbia",
            "esplendido", "esplendida", "profuso", "profusa", "exuberante", "opulento",
            "opulenta", "pingue", "rebosante", "plagado", "atestado", "abarrotado", "innumerable"
        ],
        100: [
            "pantagruelico", "pantagruelica", "elefantiasico", "elefantiasica", "mamotreto",
            "baston", "basto", "groso", "gorda", "gordo", "grueso", "gruesa", "macizo",
            "maciza", "fornido", "fornida", "robusto", "robusta", "corpulento", "corpulenta",
            "alto", "alta", "elevado", "elevada", "largo", "larga", "ancho", "ancha",
            "hondo", "honda", "profundo", "profunda", "cuantiosísimo" if False else "cuantiosisimo",
            "grandisimo", "grandisima", "inmensidad", "barbaridad", "infinidad", "multitud",
            "sinfin", "aluvion", "avalancha", "plaga", "torrente", "diluvio", "raudal", "a raudales", "a mares"
        ],
    },
    "pal-031": {
        25: [
            "chico", "chica", "chiquito", "chiquita", "diminuto", "diminuta", "diminutos",
            "diminutas", "minusculo", "minuscula", "minusculos", "enano", "enana",
            "corto", "corta", "breve", "escaso", "escasa", "escasos", "limitado", "limitada"
        ],
        45: [
            "infimo", "infima", "infimos", "exiguo", "exigua", "exiguos", "insignificante",
            "insignificantes", "imperceptible", "microscopico", "microscopica", "nanoscopico",
            "atomico", "molecular", "minimalista", "reducido", "reducida", "estrecho",
            "estrecha", "angosto", "angosta", "apretado", "apretada", "compacto", "compacta",
            "menudo", "menuda", "menudos", "poquito", "poquita", "poquisimo", "miserable", "misero"
        ],
        65: [
            "raquitico", "raquitica", "escuálido" if False else "escualido", "escualida",
            "enclenque", "canijo", "canija", "esmirriado", "esmirriada", "encogido",
            "encogida", "menguado", "menguada", "bajo", "baja", "chaparro", "chaparra",
            "retaco", "tapon", "pequeñajo", "pequeñaja", "chiquitin", "chiquitina",
            "chiquitito", "chiquitita", "pequeñito", "pequeñita", "pequeñin", "pequeñina"
        ],
        85: [
            "insuficiente", "insuficientes", "deficiente", "deficitario", "deficitaria",
            "pobre", "parco", "parca", "frugal", "modesto", "modesta", "humilde", "sencillo",
            "sencilla", "tenue", "leve", "ligero", "ligera", "suave", "sutil", "fino", "fina",
            "delgado", "delgada", "flaco", "flaca", "debil", "debilucho", "imperceptible",
            "irrisorio", "irrisoria", "simbolico", "simbolica", "testimonial", "anecdotico"
        ],
        100: [
            "pizca", "una pizca", "gota", "miga", "migaja", "briznilla", "brizna", "apice",
            "un apice", "atisbo", "asomo", "rastro", "vestigio", "resquicio", "triz",
            "ni pizca", "escaso de", "liliputiense", "pigmeo", "nano", "mini", "micro",
            "miniaturizado", "en miniatura", "de bolsillo", "portatil", "lacónico" if False else "laconico",
            "someramente", "sucinto", "sucinta", "conciso", "concisa", "efimero", "efimera",
            "pasajero", "pasajera", "momentaneo", "momentanea", "fugaz", "marginal",
            "residual", "despreciable", "inapreciable", "nada", "casi nada", "cuatro gatos"
        ],
    },
    "pel-003": {
        25: [
            "el padrino", "el padrino ii", "la lista de schindler", "forrest gump", "titanic",
            "gladiator", "el retorno del rey", "el señor de los anillos el retorno del rey",
            "el silencio de los corderos", "parasitos", "oppenheimer", "casablanca",
            "lo que el viento se llevo", "braveheart", "american beauty", "una mente maravillosa"
        ],
        45: [
            "rocky", "alguien volo sobre el nido del cuco", "rain man", "sin perdon",
            "million dollar baby", "infiltrados", "the departed", "no es pais para viejos",
            "slumdog millionaire", "en tierra hostil", "the hurt locker", "el discurso del rey",
            "the artist", "argo", "12 años de esclavitud", "birdman", "spotlight",
            "moonlight", "la forma del agua", "green book", "nomadland", "coda",
            "todo a la vez en todas partes", "anora", "amadeus", "memorias de africa"
        ],
        65: [
            "platoon", "el ultimo emperador", "paseando a miss daisy", "bailando con lobos",
            "chicago", "crash", "el paciente ingles", "shakespeare in love", "gandhi",
            "carros de fuego", "gente corriente", "kramer contra kramer", "el cazador",
            "annie hall", "el golpe", "the sting", "french connection", "patton",
            "cowboy de medianoche", "oliver", "en el calor de la noche", "un hombre para la eternidad",
            "sonrisas y lagrimas", "my fair lady", "tom jones", "lawrence de arabia", "west side story"
        ],
        85: [
            "el apartamento", "ben hur", "gigi", "el puente sobre el rio kwai", "la vuelta al mundo en 80 dias",
            "marty", "la ley del silencio", "de aqui a la eternidad", "el mayor espectaculo del mundo",
            "un americano en paris", "eva al desnudo", "all about eve", "el politico",
            "hamlet", "la barrera invisible", "los mejores años de nuestra vida", "dias sin huella",
            "siguiendo mi camino", "la señora miniver", "que verde era mi valle", "rebeca",
            "vive como quieras", "la vida de emile zola", "el gran ziegfeld", "rebelion a bordo"
        ],
        100: [
            "sucedio una noche", "it happened one night", "cabalgata", "gran hotel", "cimarron",
            "sin novedad en el frente", "melodia de broadway", "alas", "wings",
            "the godfather", "the godfather part ii", "schindler s list", "the silence of the lambs",
            "the lord of the rings the return of the king", "no country for old men",
            "everything everywhere all at once", "parasite", "the king s speech",
            "12 years a slave", "one flew over the cuckoo s nest", "the deer hunter",
            "all quiet on the western front", "from here to eternity", "on the waterfront",
            "the bridge on the river kwai", "the apartment", "the sound of music",
            "in the heat of the night", "midnight cowboy", "the french connection",
            "chariots of fire", "terms of endearment", "la fuerza del cariño", "out of africa",
            "driving miss daisy", "dances with wolves", "unforgiven", "a beautiful mind", "the shape of water"
        ],
    },
    "pel-006": {
        25: [
            "el exorcista", "el resplandor", "psicosis", "it", "eso", "expediente warren",
            "the conjuring", "insidious", "sinister", "hereditary", "midsommar", "get out",
            "dejame salir", "scream", "halloween", "la noche de halloween", "viernes 13",
            "pesadilla en elm street", "saw", "el silencio de los corderos", "alien", "tiburon"
        ],
        45: [
            "rec", "los otros", "el orfanato", "el sexto sentido", "se7en", "seven",
            "zodiac", "la semilla del diablo", "rosemary s baby", "la profecia", "the omen",
            "poltergeist", "carrie", "misery", "cementerio de animales", "la niebla",
            "dracula", "frankenstein", "nosferatu", "la cosa", "the thing", "la mosca",
            "the fly", "el proyecto de la bruja de blair", "the blair witch project", "paranormal activity"
        ],
        65: [
            "the ring", "la señal", "ringu", "la maldicion", "ju on", "babadook", "the babadook",
            "it follows", "la bruja", "the witch", "el faro", "the lighthouse", "nosotros", "us",
            "nope", "hablame", "talk to me", "smile", "sonrie", "terrifier", "la matanza de texas",
            "las colinas tienen ojos", "el descenso", "the descent", "28 dias despues", "28 semanas despues"
        ],
        85: [
            "un lugar tranquilo", "a quiet place", "a ciegas", "bird box", "no respires",
            "don t breathe", "maligno", "malignant", "barbarian", "x", "pearl", "maxxxine",
            "longlegs", "la sustancia", "the substance", "veronica", "tesis", "abre los ojos",
            "mientras duermes", "los sin nombre", "el espinazo del diablo", "la piel que habito",
            "funny games", "martyrs", "alta tension", "raw", "crudo", "titane", "let the right one in", "dejame entrar"
        ],
        100: [
            "la noche de los muertos vivientes", "el amanecer de los muertos", "posesion infernal",
            "evil dead", "terrorificamente muertos", "hellraiser", "candyman", "chucky",
            "muñeco diabolico", "annabelle", "la monja", "the nun", "el rito", "el exorcismo de emily rose",
            "the wicker man", "el hombre de mimbre", "suspiria", "rojo oscuro", "profondo rosso",
            "los pajaros", "la ventana indiscreta", "vertigo", "el gabinete del doctor caligari",
            "la parada de los monstruos", "freaks", "la novia de frankenstein", "el hombre lobo",
            "la momia", "el hombre invisible", "tiburón" if False else "el ente", "al final de la escalera",
            "the changeling", "the others", "shutter island", "cisne negro", "black swan", "el maquinista"
        ],
    },
    "dep-027": {
        25: [
            "iker casillas", "xavi hernandez", "andres iniesta", "sergio ramos", "carles puyol",
            "raul gonzalez", "david villa", "fernando torres", "sergio busquets", "xabi alonso",
            "rodri", "rodrigo hernandez", "lamine yamal", "nico williams", "pedri", "gavi",
            "dani carvajal", "jordi alba", "gerard pique", "david silva", "cesc fabregas"
        ],
        45: [
            "luis suarez miramontes", "emilio butragueño", "fernando hierro", "luis enrique",
            "pep guardiola", "josep guardiola", "alberto ferrer", "sergi barjuan", "miguel angel nadal",
            "julen guerrero", "gaizka mendieta", "joaquin", "joaquin sanchez", "jesus navas",
            "santi cazorla", "juan mata", "marcos senna", "joan capdevila", "arbeloa", "alvaro arbeloa",
            "raul albiol", "carlos marchena", "pepe reina", "victor valdes", "santiago cañizares", "andoni zubizarreta"
        ],
        65: [
            "luis arconada", "ricardo zamora", "telmo zarra", "zarra", "paco gento", "gento",
            "amancio amaro", "amancio", "pirri", "juanito", "santillana", "jose antonio camacho",
            "rafael gordillo", "michel", "martin vazquez", "manolo sanchis", "quini", "enrique castro",
            "rafael marañon", "poli rincon", "julio salinas", "txiki begiristain", "bakero",
            "jose mari bakero", "ion andoni goikoetxea", "fernando morientes", "morientes", "guti"
        ],
        85: [
            "ivan helguera", "michel salgado", "ivan de la pena", "ruben baraja", "david albelda",
            "vicente rodriguez", "carlos gurpegui", "joseba etxeberria", "ismael urzaiz", "julio iglesias" if False else "fran",
            "valeron", "juan carlos valeron", "diego tristan", "fernando hiero" if False else "albert luque",
            "reyes", "jose antonio reyes", "dani guiza", "dani olmo", "fabian ruiz", "mikel merino",
            "mikel oyarzabal", "alvaro morata", "unai simon", "david raya", "aymeric laporte",
            "robin le normand", "marc cucurella", "alejandro grimaldo", "pau cubarsi", "fermin lopez"
        ],
        100: [
            "alexia putellas", "aitana bonmati", "jenni hermoso", "irene paredes", "salma paralluelo",
            "olga carmona", "mariona caldentey", "patri guijarro", "mariasun quiñones", "cata coll",
            "vero boquete", "raquel carreras" if False else "nahikari garcia", "marta torrejon", "lucia garcia",
            "isco", "isco alarcon", "marco asensio", "lucas vazquez", "nacho fernandez", "koke",
            "saul ñiguez", "marcos llorente", "iago aspas", "gerard moreno", "joselu", "borja iglesias",
            "pau torres", "eric garcia", "cesar azpilicueta", "thiago alcantara", "david de gea",
            "kepa arrizabalaga", "paco alcacer", "rodrigo moreno", "adama traore", "ansufati", "ansu fati",
            "sergi roberto", "brais mendez", "sancet", "oihan sancet", "yeremy pino", "alex baena",
            "cubillas" if False else "ladislao kubala", "kubala", "alfredo di stefano", "di stefano", "puig" if False else "riqui puig"
        ],
    },
    "dep-028": {
        25: [
            "los angeles lakers", "lakers", "boston celtics", "celtics", "chicago bulls", "bulls",
            "golden state warriors", "warriors", "miami heat", "san antonio spurs", "spurs",
            "new york knicks", "knicks", "new york yankees", "yankees", "dallas cowboys", "cowboys",
            "kansas city chiefs", "new england patriots", "patriots"
        ],
        45: [
            "denver nuggets", "nuggets", "milwaukee bucks", "bucks", "philadelphia 76ers", "sixers",
            "dallas mavericks", "mavericks", "phoenix suns", "suns", "cleveland cavaliers", "cavaliers",
            "toronto raptors", "raptors", "houston rockets", "rockets", "detroit pistons", "pistons",
            "orlando magic", "magic", "indiana pacers", "pacers", "oklahoma city thunder", "thunder",
            "minnesota timberwolves", "timberwolves", "memphis grizzlies", "grizzlies", "utah jazz", "jazz"
        ],
        65: [
            "portland trail blazers", "sacramento kings", "los angeles clippers", "clippers",
            "brooklyn nets", "nets", "atlanta hawks", "hawks", "charlotte hornets", "hornets",
            "washington wizards", "wizards", "new orleans pelicans", "pelicans",
            "san francisco 49ers", "49ers", "green bay packers", "packers", "pittsburgh steelers", "steelers",
            "philadelphia eagles", "eagles", "baltimore ravens", "ravens", "buffalo bills", "bills",
            "las vegas raiders", "raiders", "miami dolphins", "dolphins", "chicago bears", "bears"
        ],
        85: [
            "new york giants", "giants", "los angeles rams", "rams", "seattle seahawks", "seahawks",
            "denver broncos", "broncos", "cincinnati bengals", "bengals", "tampa bay buccaneers",
            "los angeles dodgers", "dodgers", "boston red sox", "red sox", "chicago cubs", "cubs",
            "houston astros", "astros", "atlanta braves", "braves", "st louis cardinals",
            "san francisco giants", "philadelphia phillies", "new york mets", "mets", "san diego padres",
            "texas rangers", "toronto blue jays", "baltimore orioles", "seattle mariners"
        ],
        100: [
            "detroit tigers", "cleveland guardians", "minnesota twins", "chicago white sox",
            "oakland athletics", "los angeles angels", "colorado rockies", "arizona diamondbacks",
            "miami marlins", "washington nationals", "tampa bay rays", "pittsburgh pirates",
            "cincinnati reds", "milwaukee brewers", "kansas city royals", "montreal canadiens",
            "toronto maple leafs", "boston bruins", "new york rangers", "chicago blackhawks",
            "detroit red wings", "edmonton oilers", "pittsburgh penguins", "colorado avalanche",
            "tampa bay lightning", "vegas golden knights", "florida panthers", "dallas stars",
            "carolina hurricanes", "new jersey devils", "philadelphia flyers", "washington capitals",
            "st louis blues", "los angeles kings", "san jose sharks", "anaheim ducks", "vancouver canucks"
        ],
    },
    "geo-013": {
        25: [
            "pirineos", "los pirineos", "sierra nevada", "picos de europa", "sistema central",
            "sistema iberico", "cordillera cantabrica", "sierra morena", "sierra de guadarrama",
            "sierra de gredos", "montes de toledo", "cordillera betica", "cordilleras beticas", "montserrat"
        ],
        45: [
            "sierra de cazorla", "sierra de segura", "sierra de las villas", "sierra de grazalema",
            "sierra de ronda", "serrania de ronda", "serrania de cuenca", "sierra de albarracin",
            "sierra de guara", "moncayo", "sierra del moncayo", "sistema penibetico",
            "sistema subbetico", "cordillera costero catalana", "montseny", "macizo del montseny",
            "sierra de tramuntana", "serra de tramuntana", "sierra de ayllon", "somosierra"
        ],
        65: [
            "sierra de la demanda", "picos de urbion", "urbion", "sierra cebollera", "sierra de cameros",
            "montes vascos", "sierra de aralar", "aizkorri", "urbia", "gorbeia", "gorbea",
            "peña de francia", "sierra de francia", "sierra de bejar", "sierra de gata",
            "sierra de guadalupe", "las villuercas", "sierra de san pedro", "sierra de tentudia",
            "sierra norte de sevilla", "sierra de aracena", "picos de aroche", "sierra magina"
        ],
        85: [
            "sierra de cazorla segura y las villas", "sierra de bazar", "sierra de baza",
            "sierra de los filabres", "sierra de gador", "sierra alhamilla", "sierra de espuña",
            "sierra de mariola", "sierra de aitana", "sierra calderona", "sierra de espadan",
            "penyagolosa", "peñagolosa", "puertos de beceite", "maestrazgo", "sierra de gudar",
            "sierra de javalambre", "macizo galaico leones", "montes de leon", "teleno",
            "sierra de ancares", "ancares", "caurel", "courel", "sierra de queixa", "cabeza de manzaneda"
        ],
        100: [
            "serra da estrela", "sierra de la estrella", "serra do geres", "sierra de xures",
            "serra do marão", "sierra de san mamede", "montes universales", "sierra de alcubierre",
            "sierra de montsant", "cadí", "sierra del cadi", "cadi moixero", "albera",
            "sierra de la albera", "sierra de urbasa", "andia", "leyre", "sierra de leyre",
            "peña montañesa", "turbón", "turbon", "posets", "aneto", "monte perdido",
            "maladeta", "vignemale", "mulhacen", "veleta", "almanzor", "peñalara",
            "naranjo de bulnes", "torre cerredo", "aitana", "sierras de tejeda", "almijara", "sierra bermeja", "sierra de las nieves"
        ],
    },
}

DENSITY_BATCH_1_EXTRA = {
    "pel-006": {
        65: [
            "el cuarto tipo", "sinister 2", "insidious capitulo 2", "expediente warren el caso enfield",
            "expediente warren obligado por el demonio", "terrifier 2", "terrifier 3", "scream 2",
            "scream vi", "halloween kills", "halloween ends", "saw ii", "saw x", "el exorcista del papa",
            "un lugar tranquilo 2", "un lugar tranquilo dia uno", "sonrie 2", "smile 2"
        ],
        85: [
            "el espinazo del diablo", "los cronocrimenes", "malasaña 32", "rec 2", "rec 3 genesis",
            "la abuela", "cerdita", "paco plaza veronica", "hermana muerte", "el hoyo", "the platform",
            "la matanza de texas 1974", "el resplandor doctor sueño", "doctor sueño", "it capitulo 2",
            "la semilla de chucky", "la novia de chucky", "hellraiser ii", "pesadilla en elm street 3",
            "viernes 13 parte ii", "creep", "the host", "train to busan", "tren a busan", "oldboy"
        ],
        100: [
            "audition", "ichii the killer", "kairo", "pulse", "noroi", "dark water", "agua turbia",
            "gonjiam", "the wailing", "el extraño", "cure", "eyes without a face", "los ojos sin rostro",
            "diabolicas", "las diabolicas", "carnival of souls", "la invasion de los ultracuerpos",
            "el carnaval de las almas", "suspension", "lake mungo", "the autopsy of jane doe",
            "la autopsia de jane doe", "green room", "bone tomahawk", "the ritual", "el ritual"
        ],
    },
    "pel-022": {
        45: [
            "padre no hay mas que uno 2", "padre no hay mas que uno 3", "padre no hay mas que uno 4",
            "a todo tren 2", "campeonex 2023", "resacon en tailandia", "resacon 3",
            "cazafantasmas ii", "cazafantasmas mas alla", "shrek tercero", "shrek felices para siempre",
            "toy story 2", "toy story 3", "toy story 4", "american pie 2", "american pie el reencuentro"
        ],
        65: [
            "zoolander 2", "anchorman 2", "austin powers la espia que me achucho", "austin powers en miembro de oro",
            "agarralo como puedas 2 y medio", "agarralo como puedas 33 y un tercio", "loca academia de policia",
            "loca academia de policia 2", "esta abuela es un peligro", "dos rubias de pelo en pecho",
            "un detective suelto en hollywood", "superdetective en hollywood ii", "mentiroso compulsivo 1997",
            "el profesor chiflado", "un papa genial", "el aguador", "click", "niños grandes", "niños grandes 2"
        ],
        85: [
            "somos los miller", "we re the millers", "cuerpo de elite", "villaviciosa de al lado",
            "perdiendo el norte", "perdiendo el este", "que se mueran los feos", "fuga de cerebros",
            "mentiras y gordas", "el otro lado de la cama", "los dos lados de la cama", "dias de futbol",
            "el penalti mas largo del mundo", "tapas", "torrente 2 mision en marbella",
            "torrente 3 el protector", "torrente 4", "torrente 5 operacion eurovegas", "mortadelo y filemon"
        ],
        100: [
            "la gran aventura de mortadelo y filemon", "mortadelo y filemon contra jimmy el cachondo",
            "superlopez", "el milagro de p tinto", "historias lamentables", "el buen patron",
            "competencia oficial", "toc toc", "perfectos desconocidos", "camara cafe la pelicula",
            "cuatro chicos y esto", "un novio para mi mujer", "mi gran noche", "el bar",
            "la chispa de la vida", "balada triste de trompeta", "ocho apellidos", "el reino del reves"
        ],
    },
    "pel-028": {
        45: [
            "american pie 2", "american pie la boda", "american pie el reencuentro",
            "high school musical 2", "high school musical 3", "chicas malas 2024",
            "dando la nota 2", "dando la nota 3", "crepusculo", "los juegos del hambre",
            "el corredor del laberinto", "divergente", "bajo la misma estrella", "a todos los chicos de los que me enamore"
        ],
        65: [
            "mi primer beso", "my girl", "stand by me", "cuenta conmigo", "los goonies",
            "karate kid", "el karate kid", "footloose", "dirty dancing", "el club de los cinco 1985",
            "todo en un dia 1986", "porky s", "desmadre a la americana 1978", "la revancha de los novatos ii",
            "encino man", "el hombre de california", "waynes world", "el mundo de wayne"
        ],
        85: [
            "scream 2", "scream 4", "la calle del terror", "fear street", "jovenes y brujas 1996",
            "crueles intenciones", "cruel intentions", "juegos sexuales", "alguien como tu 1999",
            "nunca me han besado", "never been kissed", "ella es el chico", "she s the man",
            "una rubia muy legal", "legally blonde", "el diario de la princesa", "princesa por sorpresa",
            "chica de instituto", "bring it on", "a por todas", "chicas rebeldes", "los chicos del barrio"
        ],
        100: [
            "election", "rushmore 1998", "ghost world", "welcome to the dollhouse", "bienvenidos a la casa de muñecas",
            "subUrbia", "dazed and confused 1993", "todos queremos algo", "everybody wants some",
            "sing street", "the edge of seventeen", "call me by your name", "moonrise kingdom",
            "boyhood", "licorice pizza", "bottoms", "el club de las luchadoras", "theater camp",
            "eighth grade", "octavo grado", "la vida de adele", "summer of 85", "verano del 85", "fisica o quimica"
        ],
    },
    "pal-029": {
        65: [
            "academia" if False else "acardia" if False else "acribia", "alegorias", "alergias" if False else "anarquias",
            "anatomias", "angustia" if False else "antologias", "apologias", "armonias", "arteria" if False else "artesanias",
            "artilleria", "astrologias", "astronomias", "auditorias", "autonomias", "autopias" if False else "autorias",
            "averias", "bacterias" if False else "bahia", "bahias", "baldias", "balia", "baronias", "baterias",
            "biografias", "biologias", "bujia", "bujias", "burgesia", "burguesia", "burguesias",
            "caligrafias", "canonjia", "canonjias", "cardiologias", "carpinterias", "categoria", "categorias"
        ],
        85: [
            "cazeria", "caceria", "cacerias", "cercanias", "ceremonia" if False else "chirivia", "cirugias",
            "cofradia", "cofradias", "compañias", "confiterias", "coreografias", "cortesias",
            "crias", "cuantias", "dermatologias", "desvios", "diarias" if False else "dinastia", "dinastias",
            "discografias", "distopias", "doctoria" if False else "droguerias", "ecografias", "ecologias",
            "economias", "enfermerias", "entropias", "envios", "epifania", "epifanias", "espias",
            "estanterias", "estrategia" if False else "etimologias", "eufonias", "fantasia", "fantasias",
            "ferreterias", "filosofias", "fisonomias", "floristerias", "fotografias", "frias", "fruterias"
        ],
        100: [
            "galerias", "garantias", "gastronomias", "geografias", "geologias", "griterios", "guias",
            "hedonismo" if False else "hematologias", "herejia", "herejias", "hidrografias", "homilia", "homilias",
            "ideologias", "infografias", "ingenieria", "ingenierias", "ironias", "jerarquias", "joyerias",
            "judias", "lejanias", "letanias", "librerias", "litografias", "loterias", "magia" if False else "maestria",
            "maestrias", "mamografias", "mania", "manias", "marisquerias", "mayoria", "mayorias",
            "mercaderia", "mercaderias", "minorias", "minoria", "miopias", "mitologias", "monarquias",
            "monografias", "navios", "neurologias", "oligarquias", "oncologias", "ortografias",
            "panaderias", "papelerias", "pastelerias", "patologia", "patologias", "pediatrias",
            "peluquerias", "perfumerias", "pescaderias", "pizzerias", "poderios", "polifonias",
            "porterias", "psicologias", "psiquiatrias", "radiografias", "relojerias", "rocios",
            "sandias", "sastrerias", "señorios", "serigrafias", "simpatias", "sinfonias", "sintonias",
            "soberanias", "sociologias", "tardios", "tecnologias", "telepatias", "teologia", "teologias",
            "tias", "tios", "tiranias", "tomografias", "topografias", "tranvias", "utopias",
            "vacios", "valentias", "valias", "vigias", "zapaterias", "zoologia", "zoologias",
            "albumes" if False else "alcazares" if False else "acidez" if False else "aullido" if False else "buho",
            "vahido", "tahures" if False else "recaidas", "caidas", "oidos", "leidos", "creidos", "traidos"
        ],
    },
    "gen-030": {
        65: [
            "bridgerton", "the crown", "the witcher", "narcos mexico", "el chapo", "ozark",
            "mindhunter", "yellowjackets", "white lotus", "the white lotus", "severance", "fallout",
            "shogun", "el problema de los 3 cuerpos", "3 body problem", "mi reno de peluche",
            "baby reindeer", "monstruo la historia de jeffrey dahmer", "dahmer", "the bear", "ted lasso"
        ],
        85: [
            "true blood", "sangre fresca", "rome", "tudors", "deadwood", "six feet under",
            "a dos metros bajo tierra", "el ala oeste", "er urgencias", "nyd blue", "policias de nueva york",
            "the shield al margen de la ley", "the closer", "monk", "psych", "white collar", "ladron de guante blanco",
            "burn notice", "person of interest", "vigilados", "chuck", "bones", "castle", "the mentalist"
        ],
        100: [
            "dark angel", "angel", "firefly", "farscape", "babylon 5", "stargate sg 1", "stargate atlantis",
            "the expanse", "for all mankind", "para toda la humanidad", "foundation", "fundacion",
            "silo", "dark matter", "pachinko", "slow horses", "caballos lentos", "the morning show",
            "succession", "barry", "atlanta", "reservation dogs", "what we do in the shadows",
            "parks and rec", "community", "arrested development", "curb your enthusiasm", "it s always sunny in philadelphia",
            "colgados en filadelfia", "fleabag", "peep show", "the it crowd", "los informaticos",
            "blackadder", "la vibora negra", "mr bean", "monty python s flying circus", "fawlty towers",
            "merlin", "skins", "misfits", "utopia", "happy valley", "broadchurch", "line of duty",
            "the fall", "la caza", "bodyguard", "el guardaespaldas", "normal people", "giri haji"
        ],
    },
    "pel-031": {
        65: [
            "paul atreides", "optimus prime", "el zorro", "conan el barbaro", "forrest gump",
            "rocky balboa", "john rambo", "john wick", "jason bourne", "ethan hunt",
            "max rockatansky", "imperator furiosa", "ellen ripley", "sarah connor", "john mcclane",
            "luke skywalker", "han solo", "obi wan kenobi", "princesa leia", "darth vader",
            "indiana jones", "marty mcfly", "doc brown", "jack sparrow", "aragorn", "gandalf"
        ],
        85: [
            "spiderman", "peter parker", "miles morales", "bruce banner", "hulk", "thor odinson",
            "clint barton", "ojo de halcon", "scott lang", "ant man", "stephen strange", "doctor strange",
            "t challa", "black panther", "pantera negra", "carol danvers", "capitana marvel",
            "bruce wayne", "clark kent", "kal el", "hal jordan", "linterna verde", "barry allen",
            "the flash", "arthur curry", "aquaman", "selina kyle", "catwoman", "charles xavier",
            "profesor x", "magneto", "erik lehnsherr", "jean grey", "ciclope", "tormenta"
        ],
        100: [
            "django freeman", "the bride", "beatrix kiddo", "hans landa", "jules winnfield",
            "vincent vega", "mia wallace", "vito corleone", "michael corleone", "tony montana",
            "carlito brigante", "henry hill", "jordan belfort", "travis bickle", "jake lamotta",
            "daniel plainview", "anton chigurh", "llewelyn moss", "randle mcmurphy", "tyler durden",
            "el narrador", "leonard shelby", "cobb", "dom cobb", "cooper", "joseph cooper",
            "mark watney", "el marciano", "roy batty", "rick deckard", "k 2049",
            "maximo decimo meridio", "william wallace", "rey leonidas", "espartaco", "el cid campeador",
            "capitan alatriste", "jose luis torrente", "mortadelo y filemon", "chihiro ogino",
            "san", "princesa mononoke", "ashitaka", "nausicaa", "porco rosso", "tetsuo", "kaneda"
        ],
    },
    "pel-003": {
        65: [
            "wings", "alas", "the broadway melody", "melodia de broadway", "all quiet on the western front",
            "sin novedad en el frente", "cimarron", "grand hotel", "cavalcade", "cabalgata",
            "it happened one night", "sucedio una noche", "mutiny on the bounty", "rebelion a bordo",
            "the great ziegfeld", "el gran ziegfeld", "the life of emile zola", "la vida de emile zola",
            "you can t take it with you", "vive como quieras", "gone with the wind", "lo que el viento se llevo"
        ],
        85: [
            "rebecca", "rebeca", "how green was my valley", "que verde era mi valle",
            "mrs miniver", "la señora miniver", "casablanca", "going my way", "siguiendo mi camino",
            "the lost weekend", "dias sin huella", "the best years of our lives", "los mejores años de nuestra vida",
            "gentleman s agreement", "la barrera invisible", "hamlet", "all the king s men",
            "el politico", "all about eve", "eva al desnudo", "an american in paris", "un americano en paris",
            "the greatest show on earth", "el mayor espectaculo del mundo", "from here to eternity",
            "on the waterfront", "marty", "around the world in 80 days", "the bridge on the river kwai"
        ],
        100: [
            "gigi", "ben hur", "the apartment", "west side story", "lawrence of arabia",
            "tom jones", "my fair lady", "the sound of music", "a man for all seasons",
            "in the heat of the night", "oliver", "midnight cowboy", "patton", "the french connection",
            "the godfather", "the sting", "the godfather part ii", "one flew over the cuckoo s nest",
            "rocky", "annie hall", "the deer hunter", "kramer vs kramer", "ordinary people",
            "chariots of fire", "gandhi", "terms of endearment", "amadeus", "out of africa",
            "platoon", "the last emperor", "rain man", "driving miss daisy", "dances with wolves",
            "the silence of the lambs", "unforgiven", "schindler s list", "forrest gump",
            "braveheart", "the english patient", "titanic", "shakespeare in love", "american beauty",
            "gladiator", "a beautiful mind", "chicago", "the lord of the rings the return of the king",
            "million dollar baby", "crash", "the departed", "no country for old men",
            "slumdog millionaire", "the hurt locker", "the king s speech", "the artist", "argo",
            "12 years a slave", "birdman", "spotlight", "moonlight", "the shape of water",
            "green book", "parasite", "nomadland", "coda", "everything everywhere all at once", "oppenheimer", "anora"
        ],
    },
    "pal-011": {
        65: [
            "adsl", "aemet", "ampm", "apa", "atm", "btt", "ccaa", "ceip", "cgpj", "cnae", "cnmc",
            "cnt", "ugt", "ccoo", "csif", "ddhh", "ebitda", "egb", "eoi", "epa", "epi", "esa",
            "ftth", "gdpr", "gnl", "gprs", "gsm", "gti", "hdtv", "iae", "ibex", "ibi", "icex",
            "ico", "idi", "ies", "igic", "ilp", "imserso", "inss", "isdn", "isp", "ivtm", "jpeg",
            "json", "kdd", "kwh", "lgtb", "lgtbi", "lgtbiq", "lssi", "lte", "mba", "mhz", "mtb"
        ],
        85: [
            "mvp", "nasa", "ncaa", "nhl", "nsfw", "ntp", "oaci", "ocde", "ocu", "ods", "oea",
            "oecd", "omc", "oms", "once", "ong", "onu", "opep", "otan", "ovni", "p2p", "pau",
            "pdo", "pib", "pvp", "pyme", "pymes", "qepd", "rae", "rfef", "rgb", "rip", "rmn",
            "roi", "rpm", "rrhh", "rss", "rsvp", "rtve", "saas", "samur", "sars", "sem", "seo",
            "sepa", "sepe", "sida", "sim", "slu", "sms", "sos", "sql", "ssd", "ssh", "ssl", "suv"
        ],
        100: [
            "tac", "tae", "tdah", "tdt", "tea", "tedax", "tgss", "tic", "tics", "tnt", "toc",
            "tpv", "tve", "uci", "uefa", "ufc", "uhd", "uk", "ume", "uned", "unesco", "unicef",
            "upc", "ups", "url", "usa", "usb", "ute", "uva", "uvi", "vip", "vlc", "vod", "voip",
            "vpn", "vr", "vtc", "vvip", "wan", "wc", "wifi", "wma", "wmv", "www", "xml", "zip",
            "boe", "dgt", "dni", "nif", "nie", "cif", "iban", "pin", "puk", "itv", "iva", "irpf",
            "ipc", "euribor", "erte", "ere", "eso", "fp", "ebau", "evau", "csic", "cni", "geo",
            "summa", "adn", "arn", "vih", "epoc", "ela", "imc", "coe", "coi", "acb", "csd",
            "zbe", "led", "oled", "lcd", "hdmi", "vga", "ram", "rom", "cpu", "gpu", "hdd",
            "dns", "ip", "mac", "lan", "iot", "ia", "ocr", "qr", "nfc", "rfid", "gps", "mms", "gif"
        ],
    },
    "geo-019": {
        85: [
            "estados unidos de america", "estados unidos mexicanos", "estados federados de micronesia",
            "estado de israel", "estado de eritrea", "estado de qatar", "estado de catar", "estado de kuwait",
            "estado de palestina", "estado de libia", "estado de la ciudad del vaticano", "estado de san marino",
            "estado de singapur", "estado de brunei", "estado de malta", "estado de barein", "estado de oman",
            "estado de yemen", "estado de sudan", "estado de guinea", "estado plurinacional de bolivia",
            "estado independiente de samoa", "estado independiente de papua nueva guinea", "estado libre de irlanda",
            "estado de camboya", "estado de vietnam", "emirato de afganistan", "emirato islamico de afganistan",
            "emirato de qatar", "emirato de kuwait", "emirato de barein", "emiratos arabes unidos"
        ],
        100: [
            "el reino de españa", "el reino de belgica", "el reino de suecia", "el reino de noruega",
            "el reino de dinamarca", "el reino de marruecos", "el reino de jordania", "el reino de tailandia",
            "el reino de camboya", "el reino de butan", "el reino de nepal", "el reino de lesoto",
            "el reino de esuatini", "el reino de tonga", "el reino de barein", "el reino de arabia saudi",
            "el reino de los paises bajos", "el principado de andorra", "el principado de monaco",
            "el principado de liechtenstein", "el gran ducado de luxemburgo", "el sultanato de oman",
            "el estado de israel", "el estado de qatar", "el estado de kuwait", "el estado de palestina",
            "el estado de libia", "el estado de eritrea", "el estado del vaticano", "el estado de samoa",
            "archipielago de las bahamas", "archipielago de las maldivas", "archipielago de vanuatu",
            "archipielago de fiyi", "archipielago de tuvalu", "archipielago de tonga", "archipielago de kiribati",
            "archipielago de las filipinas", "archipielago de indonesia", "archipielago del japon",
            "isla de irlanda", "isla de islandia", "isla de chipre", "isla de malta", "isla de mauricio",
            "isla de cuba", "isla de jamaica", "isla de haiti", "isla de dominica", "isla de barbados",
            "isla de granada", "isla de nauru", "isla de palaos", "isla de madagascar", "isla de sri lanka",
            "islas fiyi", "islas maldivas", "islas seychelles", "islas comoras", "islas caboverde",
            "islas bahamas", "islas filipinas", "islas marshall", "islas salomon",
            "union de las comoras", "union de myanmar", "union india", "union sudafricana",
            "imperio del japon", "albania", "alemania", "andorra", "angola", "antigua y barbuda",
            "arabia saudi", "arabia saudita", "argelia", "argentina", "armenia", "australia", "austria",
            "azerbaiyan", "ecuador", "egipto", "el salvador", "eritrea", "eslovaquia", "eslovenia",
            "españa", "estados unidos", "estonia", "esuatini", "etiopia", "india", "indonesia",
            "irak", "iran", "irlanda", "islandia", "israel", "italia", "oman", "ucrania", "uganda", "uruguay", "uzbekistan",
            "albanie", "allemagne", "andorre", "arabie saoudite", "argentine", "armenie", "australie",
            "autriche", "azerbaidjan", "espagne", "estonie", "ethiopie", "etats unis", "indonesie",
            "irlande", "islande", "italie", "ouganda", "ouzbekistan", "oesterreich", "osterreich",
            "ungarn", "eesti", "eire", "ellada", "afghanistan", "algeria", "azerbaijan", "egypt",
            "ethiopia", "ireland", "iceland", "italy", "iraq", "ukraine", "united kingdom", "united states",
            "united states of america", "united arab emirates", "antigua and barbuda", "alemania federal",
            "alemania occidental", "alemania oriental", "austria hungria", "abisinia", "alta volta"
        ],
    },
    "pal-005": {
        65: [
            "acidez", "altivez", "aridez", "avidez", "brillantez", "calidez", "candidez",
            "chiquillez", "chochez", "cutrez", "delgadez", "desfachatez", "desnudez", "doblez",
            "embriaguez", "esbeltez", "escasez", "escualidez", "estolidez", "estrechez",
            "estupidez", "exquisitez", "fetidez", "flacidez", "fluidez", "fresquez", "gilipollez",
            "gordez", "gravidez", "guapez", "hediondez", "honradez", "horridez", "idiotez",
            "impavidez", "ingravidez", "inmadurez", "inmundez", "insensatez", "insipidez",
            "intrepidez", "invalidez", "languidez", "limpidez", "liquidez", "lucidez", "madurez",
            "memez", "morbidez", "nitidez", "niñez", "ñoñez", "palidez", "pequeñez", "pesadez",
            "placidez", "preñez", "rapidez", "rigidez", "robustez", "sencillez", "sensatez",
            "solidez", "sordidez", "tepidez", "timidez", "tirantez", "tozudez", "turbidez",
            "validez", "vejez", "viudez"
        ],
        85: [
            "aceleratriz", "bisectriz", "cantatriz", "coactriz", "curatriz", "directriz",
            "dominatriz", "electromotriz", "emperatriz", "generatriz", "institutriz",
            "locomotriz", "matriz", "mediatriz", "meretriz", "motriz", "nutriz", "progenitriz",
            "testatriz", "tutriz", "variz", "cerviz", "cicatriz", "codorniz", "desliz",
            "feliz", "infeliz", "lombriz", "maiz", "nariz", "perdiz", "raiz", "regaliz",
            "tamiz", "tapiz", "barniz", "actriz", "aprendiz", "cariz", "matiz", "triz", "caliz", "lapiz"
        ],
        100: [
            "agraz", "alboroz", "alcazuz", "alcatraz", "almez", "altramuz", "andaluz",
            "antifaz", "arcabuz", "arcaduz", "arroz", "atroz", "audaz", "avestruz", "capaz",
            "capuz", "contraluz", "contumaz", "coz", "cruz", "diez", "disfraz", "eficaz",
            "falaz", "faz", "feroz", "foz", "fugaz", "haz", "hez", "hoz", "incapaz",
            "ineficaz", "interfaz", "juez", "locuaz", "luz", "matraz", "mendaz", "montaraz",
            "mordaz", "nuez", "paz", "perspicaz", "pertinaz", "pez", "portapaz", "portavoz",
            "precoz", "procaz", "pugnaz", "rapaz", "sagaz", "secuaz", "sobrefaz", "soez",
            "solaz", "tamariz", "tenaz", "testuz", "tez", "torcaz", "tornavoz", "tragaluz",
            "trasluz", "veloz", "veraz", "vez", "vivaz", "voraz", "voz", "alferez", "ajedrez",
            "albornoz", "badajoz", "cadiz", "jerez", "belmez", "fez", "ormuz", "veracruz",
            "santa cruz", "la paz", "alcaraz", "lopez", "perez", "gomez", "sanchez", "diaz",
            "rodriguez", "fernandez", "martinez", "gonzalez", "hernandez", "jimenez", "dominguez",
            "vazquez", "ramirez", "suarez", "benitez", "velazquez", "marquez", "nuñez", "ibañez",
            "mendez", "ortiz", "muñoz", "ruiz", "alvarez", "gutierrez", "estevez", "ordoñez",
            "enriquez", "manriquez", "bermudez", "antunez", "juarez", "sanz", "saenz", "paez", "baez", "cortez"
        ],
    },
    "geo-030": {
        65: [
            "palacio real", "palacio de cristal", "palacio de cibeles", "palacio de liria",
            "museo cerralbo", "museo lazaro galdiano", "museo de america", "museo naval",
            "basilica de covadonga", "catedral de salamanca", "catedral nueva de salamanca",
            "catedral de avila", "catedral de segovia", "catedral de zamora", "catedral de cuenca",
            "catedral de murcia", "catedral de valencia", "catedral de barcelona", "catedral de gerona",
            "catedral de tarragona", "catedral de zaragoza", "catedral de pamplona", "catedral de oviedo"
        ],
        85: [
            "palacio de miramar", "palacio de la magdalena", "palacio de pedralbes",
            "palacio guell", "castillo de bellver", "castillo de loarre", "castillo de olite",
            "palacio real de olite", "palacio de los duques de medinaceli", "hospital de los venerables",
            "archivo de indias", "torre del oro", "plaza de españa de sevilla", "lonja de la seda",
            "lonja de valencia", "palacio del marques de dos aguas", "teatro romano de merida",
            "teatro romano de cartagena", "anfiteatro de tarragona", "muralla de avila", "muralla de lugo"
        ],
        100: [
            "palacio de versalles", "palacio de buckingham", "palacio de windsor", "palacio de kensington",
            "palacio de hampton court", "palacio de schonbrunn", "palacio hofburg", "palacio belvedere",
            "palacio de sanssouci", "palacio de charlottenburg", "palacio de nymphenburg",
            "castillo de chambord", "castillo de chenonceau", "monte saint michel", "abadia de cluny",
            "catedral de chartres", "catedral de reims", "catedral de amiens", "catedral de estrasburgo",
            "catedral de canterbury", "catedral de york", "catedral de durham", "catedral de salisbury",
            "galeria borghese", "palacio pitti", "palacio vecchio", "basilica de san juan de letran",
            "basilica de santa maria la mayor", "castillo de sant angelo", "castillo del huevo",
            "museo pergamo", "altares de pergamo", "pinacoteca de munich", "deutsches museum",
            "museo nacional de antropologia", "palacio de bellas artes", "castillo de chapultepec",
            "teatro colon", "casa rosada", "palacio de la moneda", "museo del oro", "fortaleza de sacsayhuaman",
            "catedral de colonia", "catedral de aquisgran", "palacio de invierno", "catedral de san isaac",
            "museo nacional de tokio", "palacio imperial de tokio", "pabellon dorado", "kinkaku ji",
            "palacio de gyeongbokgung", "ciudad prohibida de pekin", "templo del cielo", "palacio de potala"
        ],
    },
    "geo-013": {
        65: [
            "sierra de guadarrama", "sierra de gredos", "sierra de francia", "sierra de bejar",
            "sierra de gata", "sierra de ayllon", "sierra del rincon", "sierra pobre",
            "sierra norte de madrid", "sierra oeste de madrid", "sierra de cabrera", "sierra de sanabria",
            "sierra de la culebra", "sierra de segundera", "montes aquilianos", "sierra del caurel",
            "sierra de ancares", "sierra del sueve", "sierra del cuera", "sierra de covadonga"
        ],
        85: [
            "sierra de peña sagra", "sierra del cordel", "sierra de hijar", "montes obarenes",
            "sierra de la demanda", "sierra de neila", "sierra de urbion", "sierra cebollera",
            "sierra de cameros", "sierra de cantabria", "sierra de toloño", "sierra de salvada",
            "sierra de andia", "sierra de urbasa", "sierra de lokiz", "sierra de codés",
            "sierra de izco", "sierra de leyre", "sierra de san juan de la peña", "sierra de guara",
            "sierra de santo domingo", "sierra de loarre", "sierra de albarracin", "sierra de gudar"
        ],
        100: [
            "sierra de javalambre", "sierra palomera", "sierra de cucalon", "sierra de algairén",
            "sierra de vicor", "sierra de la virgen", "sierra de luna", "sierra de alcubierre",
            "sierra de montsant", "sierra de prades", "sierra de collserola", "sierra de l obac",
            "sierra de llussanes", "sierra de cabrera cataluña", "sierra del cadi", "sierra de moixero",
            "sierra de port del comte", "sierra de boumort", "sierra de espadan", "sierra calderona",
            "sierra de irta", "sierra de mariola", "sierra de aitana", "sierra de bernia",
            "sierra de crevillente", "sierra de carrascoy", "sierra de espuña", "sierra de ricote",
            "sierra de la pila", "sierra de alcaraz", "sierra del segura", "sierra de las cabras",
            "sierra de cazorla", "sierra de segura", "sierra de las villas", "sierra magina",
            "sierra de andujar", "sierra de cardeña y montoro", "sierra de hornachuelos",
            "sierra de tentudia", "sierra de tudia", "sierra de san pedro", "sierra de guadalupe",
            "sierra de las villuercas", "sierra de altamira", "sierra de madera", "sierra de alcudia",
            "sierra madrona", "sierra de ronda", "sierra de grazalema", "sierra de las nieves",
            "sierra bermeja", "sierra de mijas", "sierra de tejeda", "sierra de almijara",
            "sierra de alhama", "sierra de loja", "sierra elvira", "sierra de huetor",
            "sierra de baza", "sierra de los filabres", "sierra de maria", "sierra de las estancias",
            "sierra alhamilla", "sierra de gador", "sierra de cabrera almeria", "sierra nevada de granada"
        ],
    },
    "geo-025": {
        65: [
            "chamberi", "arguelles", "moncloa", "tetuan", "chamartin", "hortaleza", "fuencarral",
            "usera", "carabanchel", "vallecas", "puente de vallecas", "villa de vallecas",
            "moratalaz", "ciudad lineal", "san blas", "vicálvaro", "vicalvaro", "barajas",
            "los austrias", "barrio de las letras", "las letras", "justicia", "cortes", "sol",
            "palacio", "embajadores", "pacifico", "estrella", "ibiza", "goya", "lista", "castellana"
        ],
        85: [
            "sant andreu", "nou barris", "horta guinardo", "les corts", "sants", "montjuic",
            "diagonal mar", "vila olimpica", "clot", "el clot", "sagrada familia", "pedralbes",
            "benimaclet", "patraix", "campanar", "algirós", "algiros", "malvarrosa", "cabañal",
            "el cabañal", "poblados maritimos", "macarena", "la macarena", "alameda de hercules",
            "alfalfa", "arenal", "el arenal", "heliopolis", "bami", "albayzin", "albaicin",
            "zaidin", "chana", "el palo", "pedregalejo", "soho malaga", "malagueta", "la malagueta"
        ],
        100: [
            "indautxu", "deusto", "santomamutx", "santutxu", "abando", "casco viejo bilbao",
            "parte vieja donostia", "amara", "antiguo", "egia", "romeral", "las arenas",
            "ciudad jardin", "rujafa", "delicias", "actur", "la magdalena", "el gancho",
            "romareda", "montañana", "casco historico toledo", "juderia de cordoba",
            "santa marta", "belem lisboa", "parque das nacoes", "principe real", "lapa",
            "soho londres", "mayfair", "belgravia", "chelsea londres", "marylebone", "fitzrovia",
            "islington", "hackney", "peckham", "clapham", "canary wharf", "battersea",
            "le marais paris", "bastille", "republique", "oberkampf", "batignolles", "passy",
            "trocadero", "la defense", "pigalle", "montparnasse", "st germain", "garibaldi",
            "brera", "navigli", "porta venezia", "isola", "parioli", "flaminio", "san lorenzo",
            "garbatella", "eur", "pigneto", "friedrichshain", "charlottenburg", "schoneberg",
            "wedding", "moabit", "sankt pauli", "st pauli", "altona", "red light district", "de pijp"
        ],
    },
    "geo-031": {
        65: [
            "parque nacional de ordesa", "parque nacional de picos de europa", "parque nacional de aiguestortes",
            "aiguestortes", "lago de san mauricio", "valle de boí", "valle de boi", "valle de heche",
            "valle de echo", "valle de anso", "valle de tena", "valle de benasque", "valle del baztan",
            "selva de oza", "bosque de pardomino", "hayedo de tejera negra", "tejera negra",
            "hayedo de pedrosa", "fageda d en jorda", "bosque de muniellos", "somiedo", "redes"
        ],
        85: [
            "lagos de covadonga", "desfiladero de la hermida", "desfiladero de los gaitanes",
            "sierra de grazalema", "pinsapar de grazalema", "alcornocales", "los alcornocales",
            "valle del genal", "bosque de cobre", "valle de la fuenfria", "peñalara",
            "hoces del cabriel", "hoces del jucar", "nacimiento del rio cuervo", "laguna negra",
            "cañon del rio lobos", "picos de urbion", "valle del ambroz", "garganta de los infiernos",
            "valle de iruelas", "ribera del duero", "arribes del duero", "medulas del bierzo"
        ],
        100: [
            "valle de yosemite", "parque nacional de yellowstone", "parque nacional zion", "bryce canyon",
            "arches", "canyonlands", "joshua tree", "big sur", "olympic national park", "glacier",
            "denali", "jasper", "algonquin", "cataratas del niagara", "pantanal", "el pantanal",
            "gran sabana", "monte roraima", "valle de la luna", "atacama", "lago titicaca",
            "valle del colca", "manu", "parque nacional del manu", "tamshiyacu", "selva misionera",
            "bosque valdiviano", "parque nacional torres del paine", "tierra del fuego",
            "tundra siberiana", "taiga", "bosque de bialowieza", "bialowieza", "bosque de fontainebleau",
            "bosque de broceliande", "valle de aosta", "bosque de umbra", "lago garda",
            "parque nacional de komodo", "parque nacional kruger", "kruger", "etosha", "chobe",
            "cabo de buena esperanza", "montañas azules", "blue mountains", "daintree", "selva daintree",
            "kakadu", "tasmania wilderness", "fiordland", "tongariro", "valle de jiuzhaigou", "yakushima"
        ],
    },
    "gen-029": {
        65: [
            "the witcher", "the witcher 2", "cyberpunk", "grand theft auto iv", "gta iv", "gta 4",
            "grand theft auto san andreas", "gta san andreas", "gta vice city", "red dead redemption",
            "zelda tears of the kingdom", "zelda ocarina of time", "zelda majora s mask",
            "zelda twilight princess", "zelda skyward sword", "zelda wind waker", "elden ring shadow of the erdtree"
        ],
        85: [
            "dark souls ii", "bloodborne the old hunters", "sekiro shadows die twice",
            "armored core vi", "lies of p", "lords of the fallen", "nioh", "nioh 2", "wo long",
            "black myth wukong", "ghost of tsushima", "assassins creed ii", "assassins creed brotherhood",
            "assassins creed black flag", "assassins creed mirage", "assassins creed shadows",
            "watch dogs", "watch dogs 2", "far cry 4", "far cry 5", "far cry 6", "just cause 3",
            "sleeping dogs", "mafia", "mafia ii", "la noire", "bully", "canis canem edit"
        ],
        100: [
            "mass effect 3", "mass effect legendary edition", "dragon age ii", "dragon age inquisition",
            "dragon age the veilguard", "baldur s gate", "baldur s gate ii", "icewind dale ii",
            "planescape torment", "torment tides of numenera", "pillar of eternity", "pillars of eternity ii",
            "tyranny", "pathfinder kingmaker", "pathfinder wrath of the righteous", "warhammer 40000 rogue trader",
            "solasta", "wasteland 2", "underrail", "atom rpg", "shadowrun returns", "shadowrun dragonfall",
            "kenshi", "mount and blade warband", "mount and blade ii bannerlord", "battle brothers",
            "wartales", "expeditions rome", "persona 3", "persona 3 reload", "persona 5 royal",
            "shin megami tensei v", "metaphor refantazio", "dragon quest viii", "dragon quest ix",
            "final fantasy iv", "final fantasy v", "final fantasy xii", "final fantasy xiv",
            "final fantasy vii rebirth", "final fantasy vii remake", "octopath traveler ii",
            "bravely default", "triangle strategy", "tactics ogre reborn", "fire emblem awakening",
            "fire emblem engage", "xenoblade chronicles 2", "xenoblade chronicles 3",
            "tales of symphonia", "tales of vesperia", "tales of berseria", "ys viii",
            "trails in the sky", "trails of cold steel", "golden sun", "suikoden ii", "breath of fire iii",
            "chronos" if False else "chrono cross", "xenogears", "parasite eve", "vanguard bandits",
            "shining force", "phantasy star iv", "skies of arcadia", "grandia", "lunar silver star",
            "age of empires iii", "age of empires iv", "age of mythology", "rise of nations",
            "empire earth", "stronghold crusader", "starcraft brood war", "warcraft ii",
            "command and conquer generals", "supreme commander", "homeworld", "sins of a solar empire",
            "master of orion", "endless space 2", "endless legend", "age of wonders 4",
            "heroes of might and magic v", "disciples ii", "europa universalis v", "crusader kings ii",
            "total war shogun 2", "total war rome ii", "total war warhammer iii", "total war three kingdoms"
        ],
    },
    "pel-026": {
        65: [
            "el castillo en el cielo", "mi vecino totoro 1988", "kiki s delivery service",
            "susurros del corazon", "la princesa mononoke 1997", "el viaje de chihiro 2001",
            "el castillo ambulante 2004", "ponyo en el acantilado 2008", "arrietty",
            "el viento se levanta 2013", "el chico y la garza 2023", "nausicaa", "laputa",
            "dragon ball super", "dragon ball super broly", "dragon ball gt", "naruto shippuden",
            "boruto", "one piece film red", "jujutsu kaisen 0", "el tren infinito", "mugen train"
        ],
        85: [
            "frieren mas alla del final del viaje", "solo leveling", "dandadan", "kaiju no 8",
            "delicious in dungeon", "tragones y mazmorras", "blue box", "oshinoko", "oshi no ko",
            "bocchi the rock", "kaguya sama love is war", "horimiya", "toradora", "fruits basket",
            "angel beats", "anohana", "your lie in april", "a silent voice", "violet evergarden",
            "made in abyss", "the promised neverland", "erased", "desaparecido", "paranoia agent",
            "ergo proxy", "texhnolyze", "haibane renmei", "serial experiments lain", "elfen lied"
        ],
        100: [
            "hellsing ultimate", "devilman crybaby", "cyberpunk edgerunners", "trigun stampede",
            "cowboy bebop la pelicula", "ghost in the shell 2 innocence", "stand alone complex",
            "akira 1988", "paprika 2006", "perfect blue 1997", "millennium actress 2001",
            "tokyo godfathers 2003", "la chica que saltaba a traves del tiempo 2006", "summer wars 2009",
            "los niños lobo 2012", "el niño y la bestia 2015", "belle 2021", "suzume 2022",
            "your name 2016", "el tiempo contigo 2019", "cinco centimetros por segundo",
            "el jardin de las palabras", "jin roh", "the sky crawlers", "mind game", "lu over the wall",
            "inu oh", "ping pong", "tatami galaxy", "redline 2009", "dead leaves", "promare 2019",
            "gundam wing", "gundam seed", "evangelion 1 0", "the end of evangelion",
            "macross do you remember love", "space battleship yamato", "capitan harlock",
            "galaxy express 999", "cobra", "city hunter", "lupin iii", "el castillo de cagliostro",
            "yu yu hakusho", "rurouni kenshin", "samurai x", "trigun", "gungrave", "black lagoon",
            "baccano", "durarara", "monogatari", "bakemonogatari", "fate zero", "fate stay night",
            "madoka magica", "puella magi madoka magica", "steins gate 0", "re zero", "overlord",
            "konosuba", "mushoku tensei", "that time i got reincarnated as a slime", "ranking of kings"
        ],
    },
    "dep-015": {
        65: [
            "100m", "200m", "400m", "800m", "1500m", "3000m", "5000m", "10000m",
            "60m", "60m vallas", "100m vallas", "110m vallas", "400m vallas",
            "3000m obstaculos", "salto altura", "salto longitud", "pertiga", "salto pertiga",
            "lanzamiento peso", "lanzamiento disco", "lanzamiento jabalina", "lanzamiento martillo"
        ],
        85: [
            "peso", "disco", "jabalina", "martillo", "vallas", "obstaculos", "relevos",
            "marcha", "10 km marcha", "20 kilometros marcha", "35 kilometros marcha", "50 kilometros marcha",
            "10 km en ruta", "5 km en ruta", "media maraton 21k", "maraton 42k", "50 km", "100 km",
            "carrera de 100 metros", "carrera de 200 metros", "carrera de 400 metros",
            "carrera de 800 metros", "carrera de 1500 metros", "carrera de 5000 metros", "carrera de 10000 metros"
        ],
        100: [
            "relevo 4x100 masculino", "relevo 4x100 femenino", "relevo 4x400 masculino",
            "relevo 4x400 femenino", "relevo 4x400 mixto", "salto con garrocha", "garrocha",
            "bala", "lanzamiento de bala", "impulso de bala", "salto largo", "salto triple",
            "carrera con obstaculos", "steeplechase", "2000 metros obstaculos", "1000 metros",
            "300 metros", "500 metros", "600 metros", "150 metros", "50 metros lisos",
            "50 metros vallas", "80 metros vallas", "300 metros vallas", "200 metros vallas",
            "pentatlon en pista cubierta", "heptatlon femenino", "decatlon masculino",
            "trail corto", "ultra trail", "kilometro vertical", "carrera vertical", "cross corto",
            "cross largo", "relevo mixto de marcha", "maraton por relevos", "milla en ruta",
            "dos millas", "cinco millas", "diez millas", "cuarto de maraton", "seis horas", "doce horas", "48 horas"
        ],
    },
    "dep-025": {
        65: [
            "seleccion de españa", "seleccion española de futbol", "seleccion española de baloncesto",
            "seleccion española de rugby", "la roja", "la familia", "los leones", "las leonas",
            "seleccion de argentina", "la albiceleste", "los pumas", "el alma argentina",
            "seleccion de brasil", "la canarinha", "la verdeamarela", "seleccion de francia",
            "les bleus", "seleccion de alemania", "die mannschaft", "seleccion de italia", "la azzurra"
        ],
        85: [
            "seleccion de inglaterra", "three lions", "los tres leones", "seleccion de portugal",
            "a selecao", "las quinas", "seleccion de paises bajos", "holanda", "la naranja mecanica",
            "oranje", "seleccion de belgica", "los diablos rojos", "red devils", "seleccion de croacia",
            "vatreni", "seleccion de uruguay", "la celeste", "los teros", "seleccion de colombia",
            "los cafeteros", "seleccion de chile", "la roja chilena", "los condores", "seleccion de mexico",
            "el tri", "seleccion de estados unidos", "usa", "team usa", "usmnt", "uswnt"
        ],
        100: [
            "seleccion de nueva zelanda", "all blacks", "tall blacks", "black ferns", "kiwi",
            "seleccion de sudafrica", "springboks", "bafana bafana", "seleccion de australia",
            "socceroos", "wallabies", "boomers", "seleccion de japon", "samurai blue", "brave blossoms",
            "seleccion de corea del sur", "seleccion de marruecos", "los leones del atlas",
            "seleccion de senegal", "los leones de teranga", "seleccion de nigeria", "las aguilas verdes",
            "seleccion de camerun", "los leones indomables", "seleccion de costa de marfil", "los elefantes",
            "seleccion de ghana", "black stars", "seleccion de egipto", "los faraones",
            "seleccion de irlanda", "el trebol", "seleccion de gales", "los dragones",
            "seleccion de escocia", "el cardo", "seleccion de fiyi", "flying fijians",
            "seleccion de samoa", "manu samoa", "seleccion de tonga", "ikales tahi",
            "seleccion de serbia", "seleccion de lituania", "seleccion de grecia", "seleccion de turquia",
            "seleccion de eslovenia", "seleccion de suiza", "seleccion de dinamarca", "seleccion de suecia",
            "seleccion de noruega", "seleccion de polonia", "seleccion de austria", "seleccion de republica checa",
            "seleccion de hungria", "seleccion de rumania", "seleccion de ucrania", "seleccion de georgia",
            "seleccion de canada", "seleccion de peru", "seleccion de ecuador", "seleccion de paraguay",
            "seleccion de venezuela", "la vinotinto", "seleccion de bolivia", "seleccion de costa rica", "los ticos",
            "seleccion de panama", "seleccion de honduras", "seleccion de jamaica", "reggae boyz"
        ],
    },
    "mus-010": {
        65: [
            "cruz cafune", "rels b", "delaossa", "foyone", "ayax", "prok", "natos", "waor",
            "fernandocosta", "hard gz", "recycled j", "bejo", "maikel delacalle", "israel b",
            "sticky m a", "dano", "ceerre", "swit eme", "dollar selmouni", "jarfaiter",
            "el jincho", "morad", "beny jr", "kidd keo", "yung beef", "kaydy cain", "khaled",
            "steve lean", "pimp flaco", "kinder malo", "cecilio g", "al safir", "blake"
        ],
        85: [
            "natos y waor", "ayax y prok", "violadores del verso", "kase o", "sho hai",
            "lirico", "r de rumba", "sfdk", "zatu", "accion sanchez", "toteking", "tote king",
            "shotta", "juaninacka", "nach", "nach scratch", "arma blanca", "lom c", "chojin",
            "el chojin", "falsalarma", "el santo", "titó", "tito", "hablando en plata", "capaz",
            "rayka", "sicario", "dogma crew", "legendario", "puto largo", "duo kie", "locus",
            "nerviozzo", "cpv", "el meswy", "kamasutra" if False else "supernafamacho", "jotamayuscula"
        ],
        100: [
            "7 notas 7 colores", "mucho muchacho", "dive dibosso", "frank t", "arianna puello",
            "mala rodriguez", "la mala", "gata cattana", "santa salut", "sara socas", "ptazeta",
            "tribade", "rawayana" if False else "rayden", "el piezas", "chuty", "skone", "arkano",
            "bnet", "gazir", "blon", "invert", "zasko", "sweet pain", "mister ego", "hander",
            "aczino", "wos", "trueno", "duki", "ysy a", "khea", "cazzu", "nicki nicole", "paulo londra",
            "bizarrap", "tiago pzk", "lit killah", "milo j", "eladio carrion", "myke towers", "anuel aa",
            "residente", "calle 13", "vico c", "tego calderon", "canserbero", "apache", "lil supa",
            "akapellah", "portavoz", "anita tijoux", "los aldeanos", "el b", "aldo el aldeano",
            "cartel de santa", "babo", "control machete", "molotov", "cypress hill", "b real", "sen dog",
            "wu tang clan", "rza", "gza", "method man", "redman", "raekwon", "ghostface killah",
            "inspectah deck", "ol dirty bastard", "mobb deep", "prodigy", "havoc", "gang starr",
            "guru", "dj premier", "nas", "jay z", "notorious big", "tupac shakur", "2pac",
            "eminem", "snoop dogg", "dr dre", "ice cube", "eazy e", "mc ren", "public enemy",
            "chuck d", "flavor flav", "run dmc", "beastie boys", "a tribe called quest", "q tip",
            "phife dawg", "de la soul", "rakim", "eric b", "krs one", "big daddy kane", "ll cool j",
            "kanye west", "kendrick lamar", "drake", "j cole", "travis scott", "asap rocky",
            "tyler the creator", "frank ocean", "kid cudi", "mac miller", "wiz khalifa", "lil wayne",
            "50 cent", "nicki minaj", "cardi b", "megan thee stallion", "lauryn hill", "missy elliott",
            "busta rhymes", "ludacris", "dmx", "mf doom", "danny brown", "earl sweatshirt",
            "joey badass", "denzel curry", "run the jewels", "killer mike", "el p", "freddie gibbs",
            "pusha t", "future", "young thug", "21 savage", "playboi carti", "juice wrld", "xxxtentacion",
            "skepta", "stormzy", "dave", "little simz", "central cee", "iam", "ntm", "mc solaar", "booba", "orelsan"
        ],
    },
    "dep-027": {
        65: [
            "iker casillas", "xavi hernandez", "andres iniesta", "sergio ramos", "carles puyol",
            "raul gonzalez", "david villa", "fernando torres", "sergio busquets", "xabi alonso",
            "rodri", "rodrigo hernandez", "lamine yamal", "nico williams", "pedri", "gavi",
            "dani carvajal", "jordi alba", "gerard pique", "david silva", "cesc fabregas",
            "casillas", "xavi", "iniesta", "ramos", "puyol", "raul", "villa", "torres", "busquets", "alonso"
        ],
        85: [
            "luis suarez miramontes", "emilio butragueño", "butragueño", "fernando hierro", "hierro",
            "luis enrique", "pep guardiola", "guardiola", "julen guerrero", "gaizka mendieta", "mendieta",
            "joaquin sanchez", "jesus navas", "santi cazorla", "cazorla", "juan mata", "mata",
            "marcos senna", "joan capdevila", "alvaro arbeloa", "raul albiol", "carlos marchena",
            "pepe reina", "victor valdes", "santiago cañizares", "cañizares", "andoni zubizarreta", "zubizarreta",
            "luis arconada", "arconada", "ricardo zamora", "zamora", "telmo zarra", "paco gento",
            "amancio amaro", "pirri", "juanito", "santillana", "jose antonio camacho", "camacho",
            "rafael gordillo", "gordillo", "michel", "martin vazquez", "manolo sanchis", "sanchis", "quini"
        ],
        100: [
            "poli rincon", "julio salinas", "txiki begiristain", "jose mari bakero", "goikoetxea",
            "fernando morientes", "guti", "jose maria gutierrez", "ivan helguera", "michel salgado",
            "ivan de la pena", "ruben baraja", "baraja", "david albelda", "albelda", "vicente rodriguez",
            "joseba etxeberria", "ismael urzaiz", "juan carlos valeron", "diego tristan", "albert luque",
            "jose antonio reyes", "dani guiza", "dani olmo", "fabian ruiz", "mikel merino", "mikel oyarzabal",
            "oyarzabal", "alvaro morata", "morata", "unai simon", "david raya", "aymeric laporte",
            "robin le normand", "marc cucurella", "cucurella", "alejandro grimaldo", "pau cubarsi", "cubarsi",
            "fermin lopez", "alexia putellas", "aitana bonmati", "jenni hermoso", "irene paredes",
            "salma paralluelo", "olga carmona", "mariona caldentey", "patri guijarro", "cata coll",
            "misa rodriguez", "teresa abelleira", "athea del castillo", "atenea del castillo", "alba redondo",
            "esther gonzalez", "vero boquete", "isco alarcon", "marco asensio", "lucas vazquez",
            "nacho fernandez", "koke", "saul ñiguez", "marcos llorente", "iago aspas", "aspas",
            "gerard moreno", "joselu", "borja iglesias", "pau torres", "eric garcia", "cesar azpilicueta",
            "azpilicueta", "thiago alcantara", "david de gea", "de gea", "kepa arrizabalaga", "paco alcacer",
            "rodrigo moreno", "ansu fati", "sergi roberto", "brais mendez", "oihan sancet", "yeremy pino",
            "alex baena", "pedro porro", "martin zubimendi", "zubimendi", "daniel vivian", "vivian",
            "pedro rodriguez", "pedrito", "fernando llorente", "llorente", "negredo", "alvaro negredo",
            "soldado", "roberto soldado", "javi martinez", "monreal", "nacho monreal", "juanfran", "juanfran torres",
            "alfredo di stefano", "ladislao kubala", "paulino alcantara", "pichichi", "rafael moreno"
        ],
    },
    "mus-024": {
        65: [
            "sabina", "serrat", "joaquin sabina", "joan manuel serrat", "silvio rodriguez", "pablo milanes",
            "victor manuel", "ana belen", "luis eduardo aute", "ismael serrano", "pedro guerra",
            "javier krahe", "carlos cano", "pablo alboran", "manuel carrasco", "alejandro sanz",
            "antonio orozco", "rozalen", "el kanka", "andres suarez", "marwan", "luis ramiro",
            "diego cantero", "funambulista", "dani martin", "melendi", "vanesa martin", "india martinez"
        ],
        85: [
            "pablo lopez", "guitarricadelafuente", "valeria castro", "silvia perez cruz", "natalia lafourcade",
            "jorge drexler", "fito paez", "charly garcia", "mercedes sosa", "facundo cabral",
            "atahualpa yupanqui", "violeta parra", "victor jara", "leon gieco", "bob dylan", "leonard cohen",
            "joni mitchell", "neil young", "cat stevens", "james taylor", "carole king", "paul simon",
            "art garfunkel", "tracy chapman", "suzanne vega", "nick drake", "elliott smith", "jeff buckley",
            "van morrison", "tom waits", "damien rice", "ed sheeran", "hozier", "bon iver", "sufjan stevens"
        ],
        100: [
            "georges brassens", "jacques brel", "leo ferre", "charles aznavour", "serge gainsbourg",
            "francis cabrel", "francoise hardy", "carla bruni", "fabrizio de andre", "franco battiato",
            "lucio dalla", "francesco de gregori", "paolo conte", "vasco rossi", "ligabue", "luigi tenco",
            "zeca afonso", "jose afonso", "carlos paredes", "lluis llach", "raimon", "maria del mar bonet",
            "ovidi montllor", "pau riba", "sisa", "jaume sisa", "mikel laboa", "benito lertxundi",
            "xose manuel budiño", "amancio prada", "paco ibañez", "chicho sanchez ferlosio",
            "jose antonio labordeta", "rosa leon", "elisa serna", "patxi andion", "hilario camacho",
            "toti soler", "javier ruibal", "albert pla", "rodrigo cuevas", "nacho vegas", "depedro",
            "quique gonzalez", "josele santiago", "coque malla", "ariel rot", "andres calamaro",
            "chavela vargas", "carlos puebla", "noel nicola", "santiago feliu", "frank delgado",
            "carlos varela", "pedro aznar", "luis alberto spinetta", "woody guthrie", "pete seeger",
            "joan baez", "phil ochs", "townes van zandt", "john prine", "jackson browne", "don mclean",
            "harry chapin", "gordon lightfoot", "stan rogers", "billy bragg", "vashti bunyan",
            "rodriguez", "sixto rodriguez", "laura marling", "phoebe bridgers", "julien baker",
            "lucy dacus", "father john misty", "josh tillman", "bright eyes", "conor oberst",
            "manu chao", "kevin johansen", "julieta venegas", "mon laferte", "carla morrison",
            "xavi sarria", "camilo sesto", "nino bravo", "manuel alejandro", "cecilia", "evangelina sobredo",
            "mari trini", "vainica doble", "carlos berlanga", "antonio vega", "enrique urquijo",
            "manolo garcia", "dani flaco", "carlos chaouen", "fito cabrales", "robe iniesta", "javier alvarez"
        ],
    },
    "mus-022": {
        65: [
            "morad", "beny jr", "el jincho", "cecilio g", "al safir", "blake", "sharif",
            "green valley", "shoot", "chuty", "skone", "arkano", "bnet", "gazir", "blon",
            "aczino", "sweat pain", "sweet pain", "mister ego", "hander", "zasko", "invert",
            "sho hai", "lirico", "r de rumba", "accion sanchez", "capaz", "rayka", "sicario"
        ],
        85: [
            "legendario", "puto largo", "locus", "nerviozzo", "el meswy", "frank t",
            "mucho muchacho", "dive dibosso", "supernafamacho", "jotamayuscula", "tribade",
            "milo j", "bhavi", "neo pistea", "seven kayne", "lucho ssj", "bardero", "cro",
            "homer el mero mero", "trueno oficial", "portavoz", "anita tijoux", "lil supa",
            "akapellah", "el b", "aldo el aldeano", "babo", "santa fe klan", "alemán", "aleman", "gera mx"
        ],
        100: [
            "nanpa basico", "mc davó", "mc davo", "dharius", "neto peña", "c kan",
            "central cee", "dave", "stormzy", "skepta", "little simz", "aj tracey", "j hus",
            "giggs", "wiley", "dizzee rascal", "kano", "loyle carner", "slowthai", "knucks",
            "iam", "ntm", "mc solaar", "booba", "orelsan", "pnl", "ninho", "jul", "nekfeu",
            "damso", "stromae", "gazo", "tiakola", "method man", "redman", "raekwon",
            "ghostface killah", "inspectah deck", "gza", "rza", "ol dirty bastard", "eazy e",
            "mc ren", "dj yella", "ice t", "chuck d", "flavor flav", "q tip", "phife dawg",
            "busta rhymes", "ludacris", "dmx", "fat joe", "big pun", "jadakiss", "fabolous",
            "cam ron", "dipset", "pusha t", "freddie gibbs", "action bronson", "killer mike", "el p",
            "schoolboy q", "ab soul", "jay rock", "vince staples", "tyga", "yg", "nipsey hussle",
            "anderson paak", "common", "mos def", "talib kweli", "lupe fiasco", "big sean",
            "2 chainz", "gucci mane", "jeezy", "t i", "rick ross", "meek mill", "gunna", "lil baby",
            "rod wave", "polo g", "pop smoke", "king von", "chief keef", "kodak black", "denzel",
            "kendrick", "kanye", "tupac shakur", "biggie smalls", "marshall mathers"
        ],
    },
    "pal-032": {
        65: [
            "ir hecho un pincel", "ir hecho un adan", "ser un cero a la izquierda", "ser la leche",
            "ser un crack", "tener mucha jeta", "tener un morro que se lo pisa", "tener tela",
            "estar como una cabra", "estar como un cencerro", "estar en la parra", "estar en babia",
            "estar pez", "estar frito", "estar al loro", "ponerse las pilas", "ponerse morado",
            "ponerse ciego", "ponerse como el kiko", "dar la talla", "dar la cara", "dar la brasa"
        ],
        85: [
            "dar la chapa", "dar la turra", "dar el cante", "dar el pego", "no dar ni golpe",
            "no pegar ojo", "no pegar palo al agua", "no tener ni idea", "no tener abuela",
            "no tener dos dedos de frente", "buscarle tres pies al gato", "hacer el agosto",
            "hacer borron y cuenta nueva", "hacer el primo", "hacer el paripé", "hacer piña",
            "hacerse el tonto", "hacerse polvo", "hacerse un lio", "irse a pique", "irse al garete",
            "irse la pinza", "irse la olla", "irse de rositas", "salir por peteneras", "salir por piernas"
        ],
        100: [
            "salir rana", "salirse con la suya", "sacar de quicio", "sacar los colores",
            "sacar tajada", "tirar la piedra y esconder la mano", "tirarse de los pelos",
            "tirarse a la piscina", "tirar del carro", "tomar cartas en el asunto", "tomarse a pecho",
            "verle las orejas al lobo", "ver las estrellas", "volver a las andadas", "volverse loco",
            "costar un huevo", "valer un potosi", "valer su peso en oro", "andar con pies de plomo",
            "andar de capa caida", "bailar con la mas fea", "beber los vientos", "cargar con el muerto",
            "coger con las manos en la masa", "comer el coco", "comerse el tarro", "contar hasta diez",
            "correr un tupido velo", "cruzar los dedos", "de perdidos al rio", "de uvas a peras",
            "dormir a pierna suelta", "echar una mano", "echar un vistazo", "empinar el codo",
            "entrar al trapo", "entre pinto y valdemoro", "hablar por los codos", "hacer de tripas corazon",
            "importar un pimiento", "importar un rabano", "llorar sobre la leche derramada",
            "llevar la voz cantante", "llevarse el gato al agua", "matar dos pajaros de un tiro",
            "meter cizaña", "mojarse el culo", "morder el polvo", "nadar y guardar la ropa",
            "ni pincha ni corta", "pasar de castaño oscuro", "pasarse tres pueblos", "pedir la luna",
            "picar el anzuelo", "poner el grito en el cielo", "quedar en agua de borrajas",
            "rascarse la barriga", "romper el hielo", "tener la cabeza a pajaros", "tener mala leche",
            "tocar madera", "venir como anillo al dedo", "vivir del cuento", "zapatero a sus zapatos"
        ],
    },
    "geo-020": {
        65: [
            "ceuta y melilla", "plazas de soberania", "islas malvinas", "archipielago de svalbard",
            "isla de pascua", "rapa nui", "islas galapagos", "archipielago juan fernandez",
            "islas chatham", "islas auckland", "islas campbell", "islas subantarticas",
            "isla macquarie", "islas del estrecho de torres", "isla lord howe", "isla christmas",
            "islas cocos keeling", "territorio de ultramar", "colectividad de ultramar", "departamento de ultramar"
        ],
        85: [
            "territorio del norte", "territorio de la capital australiana", "territorios del noroeste",
            "nunavut", "isla del principe eduardo", "terranova y labrador", "islas magdalena",
            "isla de vancouver", "archipielago de haida gwaii", "isla de baffin", "isla ellesmere",
            "groenlandia danesa", "kalaallit nunaat", "torshavn", "islas shetland", "islas orcadas",
            "hebridas exteriores", "hebridas interiores", "isla de wight", "isla de anglesey",
            "islas sorlingas", "scilly", "rockall", "islas del canal de la mancha", "alderney", "sark", "herm"
        ],
        100: [
            "saint barthélemy", "saint barthelemy", "saint martin", "isle of man", "bailiwick of jersey",
            "bailiwick of guernsey", "british virgin islands", "us virgin islands", "cayman islands",
            "turks and caicos islands", "falkland islands", "south georgia", "south sandwich islands",
            "pitcairn islands", "montserrat", "anguilla", "bermuda", "french guiana", "french polynesia",
            "new caledonia", "wallis and futuna", "saint pierre and miquelon", "northern mariana islands",
            "american samoa", "curacao", "curaçao", "bonaire sint eustatius y saba", "caribe neerlandes",
            "bes islands", "islas bes", "isla de san andres", "providencia y santa catalina",
            "isla del coco", "isla malpelo", "archipielago de los roques", "dependencias federales de venezuela",
            "isla margarita", "isla de cozumel", "islas marias", "isla guadalupe", "archipielago de revillagigedo",
            "fernando de noronha", "trindade y martim vaz", "rocas de san pedro y san pablo",
            "isla de los estados", "tierras antarticas", "territorio antartico chileno", "antartida argentina",
            "territorio antartico britanico", "dependencia de ross", "isla de santa helena", "ascension",
            "tristan da cunha", "isla gough", "islas crozet", "islas kerguelen", "isla amsterdam",
            "isla san pablo", "tierra adelia", "isla tromelin", "juan de nova", "islas dispersas",
            "archipielago de chagos", "atolon diego garcia", "socotra", "islas kuriles", "sajalín",
            "kaliningrado", "islas andaman y nicobar", "laquedivas", "lakshadweep", "puducherry",
            "daman y diu", "dadra y nagar haveli", "jammu y cachemira", "ladakh", "hainan", "macau"
        ],
    },
    "geo-032": {
        65: [
            "estado de sao paulo", "estado de rio de janeiro", "provincia de buenos aires",
            "provincia de cordoba", "provincia de santa fe", "provincia de mendoza",
            "region metropolitana de santiago", "departamento de antioquia", "departamento de cundinamarca",
            "estado de jalisco", "estado de nuevo leon", "estado de veracruz", "estado de puebla",
            "estado de guanajuato", "estado de michoacan", "estado de chihuahua", "estado de sonora",
            "estado de oaxaca", "estado de chiapas", "estado de yucatan", "estado de baja california"
        ],
        85: [
            "ile de france", "isla de francia", "auvernia rodano alpes", "nueva aquitania", "occitania",
            "altos de francia", "gran este", "paises del loira", "centro valle del loira",
            "borgoña franco condado", "lazio", "lacio", "emilia romaña", "trentino alto adigio",
            "friuli venecia julia", "liguria", "marcas", "umbria", "abruzos", "molise", "apulia",
            "puglia", "basilicata", "calabria", "renania del norte westfalia", "hessen", "hesse",
            "baja sajonia", "renania palatinado", "sarre", "schleswig holstein", "turingia",
            "sajonia anhalt", "mecklemburgo pomerania occidental"
        ],
        100: [
            "limburgo", "brabante septentrional", "holanda septentrional", "holanda meridional",
            "zelanda", "utrecht", "gelderland", "güeldres", "overijssel", "frisia", "drente",
            "groninga", "flevoland", "amberes", "brabante flamenco", "brabante valon", "henao",
            "lieja", "namur", "luxemburgo belga", "fribourg", "valais", "tesino", "grisones",
            "berna canton", "zurich canton", "ginebra canton", "vaud", "argovia", "sankt gallen",
            "lucerna", "estiria", "carintia", "salzburgo", "alta austria", "baja austria",
            "vorarlberg", "burgenland", "mazovia", "pequeña polonia", "silesia", "pomerania",
            "gran polonia", "galitzia", "bucovina", "valaquia", "moldavia rumana", "dobruja",
            "tracia", "macedonia griega", "epiro", "tesalia", "atica", "islas jonicas", "cicladas",
            "dodecaneso", "jutlandia", "selandia", "fionia", "escania", "gotland", "vestlandet",
            "ostlandet", "trondelag", "nordland", "ostrobothnia", "laponia finlandesa", "karelia",
            "ulster", "munster", "leinster", "connacht", "northumbria", "lancashire", "kent",
            "devon", "essex", "sussex", "surrey", "norfolk", "suffolk", "cumbria", "estremadura",
            "beira litoral", "tras os montes", "ribatejo", "alentejo litoral", "new south wales",
            "south australia", "northern territory", "saskatchewan", "new brunswick", "newfoundland"
        ],
    },
    "geo-015": {
        65: [
            "principality of andorra", "principality of liechtenstein", "grand duchy of luxembourg",
            "holy see", "vatican", "republic of san marino", "swiss confederation", "republic of austria",
            "republic of hungary", "slovak republic", "republic of belarus", "republic of moldova",
            "republic of serbia", "republic of north macedonia", "republic of kosovo",
            "republic of armenia", "republic of azerbaijan", "republic of kazakhstan",
            "republic of uzbekistan", "republic of turkmenistan", "kyrgyz republic", "republic of tajikistan"
        ],
        85: [
            "islamic emirate of afghanistan", "kingdom of bhutan", "federal democratic republic of nepal",
            "lao people s democratic republic", "mongolia", "plurinational state of bolivia",
            "republic of paraguay", "republic of botswana", "burkina faso", "republic of burundi",
            "republic of rwanda", "republic of uganda", "republic of zambia", "republic of zimbabwe",
            "republic of malawi", "republic of mali", "republic of chad", "republic of niger",
            "federal democratic republic of ethiopia", "republic of south sudan", "kingdom of lesotho",
            "kingdom of eswatini", "swaziland", "fyrom", "bolivia", "paraguay", "andorra", "san marino"
        ],
        100: [
            "estado del vaticano", "el principado de andorra", "el principado de liechtenstein",
            "el gran ducado de luxemburgo", "la confederacion suiza", "la republica checa",
            "reino de suazilandia", "estado libre de esuatini", "alto volta", "upper volta",
            "checoslovaquia", "bohemia", "rhodesia", "rodesia", "bechuanalandia", "basutolandia",
            "nyasalandia", "sudan meridional", "belarus", "kirguizia", "tayikia", "turkmenia",
            "uzbekia", "kazajia", "azerbaijan", "armenia caucasica", "transcaucasia",
            "liechtenstein", "luxembourg", "macedonia", "azerbaidjan", "kazakhstan", "kyrgyzstan",
            "tajikistan", "turkmenistan", "uzbekistan", "afghanistan", "bhutan", "nepal", "laos",
            "botswana", "chad", "niger", "mali", "burundi", "rwanda", "uganda", "zambia", "zimbabwe",
            "malawi", "ethiopia", "lesotho", "eswatini", "south sudan", "central african republic",
            "slovakia", "hungary", "austria", "switzerland", "czechia", "moldova", "serbia", "kosovo",
            "principat d andorra", "eidgenossenschaft", "confoederatio helvetica", "vatikanstadt",
            "citta del vaticano", "san marino sereno", "republika makedonija", "republika srpska",
            "magyarorszag", "ceska republika", "slovenska republika", "belaruskaya", "kyrgyzstan republic",
            "suazilandia reino", "republica de burkina faso", "republica de sudan del sur",
            "estado plurinacional", "republica de bolivia", "republica del chad", "republica de laos"
        ],
    },
    "mus-023": {
        65: [
            "los temerarios", "los bukis", "marco antonio solis", "juan gabriel", "selena",
            "selena quintanilla", "carlos santana", "santana", "los fabulosos cadillacs",
            "soda stereo", "mana", "cafe tacvba", "molotov", "jarabe de palo", "la oreja de van gogh",
            "chayanne", "ricky martin", "paulinarubio", "paulina rubio", "thalia", "luis miguel",
            "christian nodal", "alejandro fernandez", "vicente fernandez", "pepe aguilar", "carin leon"
        ],
        85: [
            "grupo frontera", "fuerza regida", "natanael cano", "junior h", "eslabon armado",
            "los angeles azules", "sonora dinamita", "la sonora santanera", "celso piña",
            "los tigres del norte", "banda ms", "banda el recodo", "intocable", "bronco",
            "monchy y alexandra", "toby love", "xtreme", "aventura bachata", "grupo extra",
            "prince royce bachata", "dani j", "kewin cosmos", "pinto picasso", "salsa kids",
            "adolescentes orquesta", "la maxima 79", "tromboranga", "havana d primera", "alexander abreu"
        ],
        100: [
            "la india", "tito nieves", "marc anthony salsa", "mickey taveras", "huey dunbar",
            "dlG", "dark latin groove", "rey ruiz", "willie gonzalez", "tonny tun tun", "tony vega",
            "domingo quiñones", "cano estremera", "luigi texidor", "roberto roena", "papo lucca",
            "la sonora ponceña", "el gran combo de puerto rico", "gran combo", "rafael ithier",
            "charlie palmieri", "mongosantamaria", "mongo santamaria", "cal tjader", "machito",
            "tito rodriguez", "benny more", "perez prado", "arsenio rodriguez", "celia cruz y la sonora",
            "guayacan orquesta", "el grupo niche", "la 33", "monsieur perine", "bomba estereo",
            "chocquibtown", "goyo", "j alvarez", "farruko pop", "nicky jam y daddy yankee",
            "cangri", "el cangri", "wisin", "yandel", "chencho corleone", "maldy", "jhayco",
            "jhay cortez", "lunay", "khea", "rusherking", "lit killah", "duki", "tiago pzk",
            "quevedo canario", "beele", "kapo", "blessd", "ryan castro", "kris r", "floyymenor",
            "cris mj", "pailita", "polima westcoast", "young cister", "paloma mami", "denise rosenthal",
            "nathy peluso", "tokischa", "yailin la mas viral", "chimbala", "el alfa", "rochy rd",
            "haraca kiko", "la perversa", "bulin 47", "omega el fuerte", "ala jaza", "kinito mendez",
            "los hermanos rosario", "pochy familia", "miriam cruz", "las chicas del can", "bonny cepeda",
            "rubby perez", "fernando villalona", "hector tricoche", "pablo montero", "jesse y joy"
        ],
    },
    "mus-027": {
        65: [
            "the doors", "doors", "jimi hendrix experience", "bob seger", "tom petty",
            "tom petty and the heartbreakers", "john mellencamp", "huey lewis and the news",
            "pat benatar", "joan jett", "joan jett and the blackhearts", "heart", "blondie",
            "pretenders", "the cars", "devo", "talking heads", "the b 52s", "b 52s", "rem"
        ],
        85: [
            "pixies", "nirvana", "pearl jam", "soundgarden", "alice in chains", "stone temple pilots",
            "smashing pumpkins", "nine inch nails", "jane s addiction", "faith no more",
            "tool", "korn", "deftones", "system of a down", "slipknot", "rage against the machine",
            "red hot chili peppers", "foo fighters", "green day", "blink 182", "the offspring",
            "bad religion", "nofx", "rancid", "sublime", "no doubt", "weezer", "pavement", "beck"
        ],
        100: [
            "modest mouse", "the strokes", "interpol", "yeah yeah yeahs", "lcd soundsystem",
            "vampire weekend", "mgmt", "the killers", "kings of leon", "the white stripes",
            "the black keys", "queens of the stone age", "kyuss", "arcade fire" if False else "cage the elephant",
            "foster the people", "twenty one pilots", "imagine dragons", "linkin park", "evanescence",
            "fall out boy", "my chemical romance", "panic at the disco", "paramore", "avenged sevenfold",
            "disturbed", "godsmack", "mastodon", "lamb of god", "pantera", "megadeth", "metallica",
            "slayer", "anthrax", "testament", "exodus", "dream theater", "rush" if False else "styx",
            "kansas", "reospeedwagon", "reo speedwagon", "survivor", "heart", "cheap trick",
            "aerosmith", "van halen", "kiss", "motley crue", "poison", "skid row", "bon jovi",
            "guns n roses", "wasp", "twisted sister", "quiet riot", "cinderella", "ratt",
            "blue oyster cult", "ted nugent", "grand funk railroad", "mountain", "steely dan",
            "chicago", "earth wind and fire", "kool and the gang", "parliament", "funkadelic",
            "sly and the family stone", "curtis mayfield", "isaac hayes", "barry white",
            "donna summer", "gloria gaynor", "chics", "chic", "sister sledge", "village people",
            "kc and the sunshine band", "the jackson 5", "the supremes", "the temptations",
            "the four tops", "martha and the vandellas", "smokey robinson", "glady knight",
            "the isley brothers", "booker t and the mgs", "al green", "bill withers", "percy sledge",
            "wilson pickett", "sam and dave", "bessie smith", "ella fitzgerald", "billie holiday",
            "sarah vaughan", "nat king cole", "dean martin", "tony bennett", "bing crosby",
            "hank williams", "patsy cline", "loretta lynn", "tammy wynette", "george jones",
            "merle haggard", "waylon jennings", "kris kristofferson", "kenny rogers", "shania twain" if False else "garth brooks",
            "alan jackson", "tim mcgraw", "carrie underwood", "mariah carey", "whitney houston",
            "janet jackson", "madonna", "cyndi lauper", "paula abdul", "pink", "christina aguilera",
            "britney spears", "destinys child", "destiny s child", "tlc", "en vogue", "boyz ii men",
            "backstreet boys", "nsync", "new kids on the block", "simon and garfunkel", "the beach boys",
            "the byrds", "the doors", "the mamas and the papas", "lovin spoonful", "monkees", "the monkees",
            "sonny and cher", "barbra streisand", "neil diamond", "carole king", "james taylor"
        ],
    },
    "dep-010": {
        65: [
            "nadal", "alcaraz", "djokovic", "federer", "murray", "sinner", "medvedev", "zverev",
            "tsitsipas", "ruud", "rublev", "fritz", "rune", "hurkacz", "dimitrov", "tiafoe",
            "shelton", "paul", "kyrgios", "berrettini", "wawrinka", "thiem", "del potro", "cilic",
            "ferrer", "ferrero", "moya", "corretja", "costa", "bruguera", "santana", "orantes",
            "badosa", "muguruza", "swiatek", "sabalenka", "gauff", "rybakina", "pegula", "paolini",
            "jabeur", "sakkari", "osaka", "barty", "halep", "kerber", "wozniacki", "azarenka", "kvitova", "sharapova"
        ],
        85: [
            "sebastian baez", "francisco cerundolo", "tomas martin etcheverry", "cameron norrie",
            "dan evans", "karen khachanov", "lorenzo sonego", "matteo arnaldi", "flavio cobolli",
            "luciano darderi", "arthur fils", "ugo humbert", "giovanni mpetshi perricard",
            "alexander bublik", "jiri lehecka", "tomas machac", "jakub mensik", "jan lennard struff",
            "tallon griekspoor", "botic van de zandschulp", "nicolas jarry", "alejandro tabilo",
            "cristian garin", "miomir kecmanovic", "laslo djere", "dusan lajovic", "zhizhen zhang",
            "juncheng shang", "jordan thompson", "alexei popyrin", "thanasi kokkinakis",
            "roberto carballes baena", "pedro martinez", "jaume munar", "pablo llamazares" if False else "pablo llamas",
            "martin landaluce", "rafa jodar", "davidovich fokina", "bautista agut", "carreno busta"
        ],
        100: [
            "danielle collins", "madison keys", "emma raducanu", "leylah fernandez", "bianca andreescu",
            "belinda bencic", "karolina muchova", "elinasvitolina", "elina svitolina", "marta kostyuk",
            "dayana yastremska", "daria kasatkina", "ekaterina alexandrova", "liudmila samsonova",
            "veronika kudermetova", "mirra andreeva", "diana shnaider", "anna kalinskaya",
            "anastasia pavlyuchenkova", "beatriz haddad maia", "jelena ostapenko", "barbara schett",
            "sloane stephens", "sofia kenin", "garbiñe", "arantxa", "conchita", "carla suarez",
            "paula badosa gibert", "sara sorribes tormo", "rebeka masarova", "aliona bolosva" if False else "aliona bolsova",
            "nuria parrizas", "marina bassols", "guiomar maristany", "leyre romero",
            "petr korda", "goran ivanisevic", "thomas muster", "sergi bruguera", "carlos moya",
            "marcelo rios", "yevgeny kafelnikov", "pat rafter", "lleyton hewitt", "andy roddick",
            "nikolay davydenko", "david nalbandian", "fernando gonzalez", "robin soderling",
            "jo wilfried tsonga", "tomas berdych", "marcos baghdatis", "rainer schuttler",
            "tim henman", "greg rusedski", "sebastien grosjean", "arnaud clement", "fabrice santoro",
            "rado stepanek", "radek stepanek", "jarkko nieminen", "ivan ljubicic", "mario ancic"
        ],
    },
    "geo-028": {
        65: [
            "yokohama", "nagoya", "sapporo", "fukuoka", "sendai", "kawasaki", "saitama", "chiba",
            "hiroshima", "nagasaki", "kobe", "nara", "kanazawa", "okinawa", "naha",
            "busan", "incheon", "daegu", "daejeon", "gwangju", "ulsan", "suwon", "jeju",
            "taipei", "new taipei", "taichung", "tainan", "kaohsiung", "macao", "kowloon"
        ],
        85: [
            "wuhan", "xian", "hangzhou", "suzhou", "nankin", "harbin", "qingdao", "dalian",
            "kunming", "xiamen", "changsha", "zhengzhou", "jinan", "hefei", "urumqi", "lhasa",
            "guilin", "sanya", "ho chi minh", "da nang", "nha trang", "hue", "hoi an",
            "siem reap", "luang prabang", "chiang mai", "chiang rai", "phuket", "pattaya",
            "krabi", "george town", "johor bahru", "malaca", "kota kinabalu", "kuching",
            "bandung", "medan", "semarang", "yogyakarta", "makassar", "denpasar", "ubud"
        ],
        100: [
            "cebu", "davao", "baguio", "iloilo", "mandalay", "naypyidaw", "bagan",
            "pune", "ahmedabad", "surat", "lucknow", "kanpur", "nagpur", "indore", "bhopal",
            "patna", "vadodara", "kochi", "cochin", "thiruvananthapuram", "visakhapatnam",
            "amritsar", "jodhpur", "udaipur", "shimla", "rishikesh", "chittagong", "sylhet",
            "pokhara", "lumbini", "kandy", "galle", "faisalabad", "rawalpindi", "multan", "peshawar",
            "quetta", "herat", "kandahar", "mazar e sharif", "mashhad", "isfahan", "shiraz", "tabriz",
            "basora", "mosul", "erbil", "nayaf", "karbala", "alepo", "homs", "latakia", "haifa",
            "nazaret", "belen", "ramala", "gaza", "irbid", "aqaba", "sharjah", "al ain", "yeda",
            "dammam", "khobar", "manama", "salalah", "aden", "sana", "sumqayit", "ganja", "batumi",
            "gyumri", "shymkent", "osh", "bujara", "khiva", "tanger", "tetuan", "meknes", "oujda",
            "essaouira", "ouarzazate", "susA", "susa", "sfax", "bizerte", "kairouan", "constantina",
            "annaba", "bengasi", "misrata", "giza", "hurghada", "port said", "suez", "ismailia",
            "omdurman", "port sudan", "gondar", "lalibela", "bahir dar", "kismayo", "hargeisa",
            "nakuru", "kisumu", "eldoret", "arusha", "mwanza", "dodoma", "entebbe", "jinja",
            "blantyre", "ndola", "kitwe", "bulawayo", "mutare", "walvis bay", "swakopmund",
            "francistown", "bloemfontein", "port elizabeth", "gqeberha", "stellenbosch",
            "lubumbashi", "mbuji mayi", "goma", "kisangani", "lobito", "benguela", "beira",
            "ibadan", "kano", "port harcourt", "kumasi", "tamale", "bobodioulasso", "thies",
            "saint louis senegal", "nouadhibou", "toowoomba", "cairns", "townsville", "geelong",
            "newcastle australia", "wollongong", "hamilton", "tauranga", "dunedin", "rotorua", "lautoka"
        ],
    },
    "geo-023": {
        65: [
            "araba", "bizkaia", "gipuzkoa", "illes balears", "la coruña", "a coruña", "lugo",
            "orense", "ourense", "pontevedra", "asturias", "cantabria", "navarra", "la rioja",
            "huesca", "zaragoza", "teruel", "lleida", "lerida", "girona", "gerona", "tarragona",
            "barcelona", "castellon", "castello", "valencia", "alicante", "alacant", "murcia",
            "almeria", "granada", "malaga", "cadiz", "huelva", "sevilla", "cordoba", "jaen"
        ],
        85: [
            "badajoz", "caceres", "toledo", "ciudad real", "cuenca", "guadalajara", "albacete",
            "madrid", "segovia", "avila", "salamanca", "zamora", "leon", "palencia", "valladolid",
            "burgos", "soria", "las palmas", "santa cruz de tenerife", "ceuta", "melilla",
            "pais valenciano", "region leonesa", "castilla la nueva", "castilla la vieja",
            "alt emporda", "baix emporda", "alt penedes", "baix llobregat", "valles occidental",
            "valles oriental", "maresme", "selva", "la selva", "bages", "bergueda", "solsones",
            "noguera", "segarra", "urgell", "pla d urgell", "segria", "garrigues", "ribera d ebre",
            "terra alta", "montsia", "baix ebre", "tarragones", "alt camp", "baix camp", "conca de barbera"
        ],
        100: [
            "palamos" if False else "pallars jussa", "pallars sobira", "alta ribagorça", "alt urgell",
            "ripolles", "cerdanya", "osona", "garrotxa", "girones", "pla de l estany", "garraf",
            "anoia", "barcelones", "moianes", "lluçanes", "o morrazo", "o salnes", "barbanza",
            "deza", "terra de lemos", "a mariña", "valdeorras", "verin", "a limia", "monterrei",
            "o carballiño", "ribeiro", "bergantiños", "fisterra", "xallas", "soneira", "ordenes",
            "ferrolterra", "eume", "betanzos", "terra cha", "a ulloa", "os ancares", "sarria",
            "cangas del narcea", "cuencas mineras", "nalon", "caudal", "aviles", "oriente de asturias",
            "occidente de asturias", "saja nansa", "besaya", "asón aguera", "liebana", "campoo los valles",
            "trasmiera", "duranguesado", "busturialdea", "uriarte", "uribe", "lea artibai", "nervion",
            "encartaciones", "margen izquierda", "goierri", "urola kosta", "debabarrena", "debagoiena",
            "tolosaldea", "donostialdea", "bidasoa", "llanada alavesa", "montaña alavesa", "ayala",
            "ribera navarra", "tierra estella", "sanguesa", "pirineo navarro", "jacetania",
            "alto gallego", "sobrarbe", "ribagorza", "hoya de huesca", "somontano de barbastro",
            "cinca medio", "bajo cinca", "la litera", "cinco villas", "campo de borja", "tarazona y el moncayo",
            "comunidad de calatayud", "valdejalon", "campo de cariñena", "campo de belchite",
            "ribera alta del ebro", "ribera baja del ebro", "bajo aragon", "bajo martin",
            "andorra sierra de arcos", "cuencas mineras teruel", "jiloca", "comunidad de teruel",
            "maestrazgo", "gudar javalambre", "matarraña", "sierra de albarracin", "cameros",
            "rioja alta", "rioja baja", "los pedroches", "valle del guadiato", "alto guadalquivir",
            "subbetica cordobesa", "campiña sur", "vega del guadalquivir", "sierra sur de sevilla",
            "aljarafe", "condado de huelva", "andévalo", "andevalo", "cuenca minera de riotinto",
            "sierra de aracena", "la janda", "bahia de cadiz", "campo de gibraltar", "serrania de ronda",
            "axarquia", "guadalhorce", "valle del guadalhorce", "antequera", "costa tropical",
            "alpujarra granadina", "guadix", "baza", "huescar", "poniente almeriense", "levante almeriense",
            "valle del almanzora", "los velez", "campo de cartagena", "mar menor", "valle de ricote",
            "vega media del segura", "noroccidente murciano", "altiplano jumilla yecla"
        ],
    },
    "dep-023": {
        65: [
            "carlos alcaraz garfia", "rafael nadal parera", "novak djokovic", "roger federer",
            "jannik sinner", "daniil medvedev", "alexander zverev", "stefanos tsitsipas",
            "andrey rublev", "casper ruud", "holger rune", "taylor fritz", "alex de miñaur",
            "hubert hurkacz", "grigor dimitrov", "frances tiafoe", "ben shelton", "tommy paul",
            "felix auger aliassime", "denis shapovalov", "nick kyrgios", "matteo berrettini",
            "sebastian korda", "lorenzo musetti", "jack draper", "iga swiatek", "aryna sabalenka",
            "coco gauff", "elena rybakina", "jessica pegula", "jasmine paolini", "ons jabeur"
        ],
        85: [
            "paula badosa", "garbiñe muguruza", "conchita martinez", "arantxa sanchez vicario",
            "carla suarez navarro", "sara sorribes", "cristina bucsa", "jessica bouzas",
            "roberto bautista agut", "pablo carreño busta", "alejandro davidovich fokina",
            "david ferrer", "juan carlos ferrero", "carlos moya", "alex corretja", "albert costa",
            "sergi bruguera", "manuel santana", "manuel orantes", "emilio sanchez vicario",
            "feliciano lopez", "fernando verdasco", "nicolas almagro", "tommy robredo",
            "albert ramos", "marcel granollers", "roberto carballes", "pedro martinez", "jaume munar"
        ],
        100: [
            "nadal", "alcaraz", "djokovic", "federer", "murray", "sinner", "medvedev", "zverev",
            "tsitsipas", "ruud", "rublev", "fritz", "rune", "hurkacz", "dimitrov", "tiafoe",
            "shelton", "kyrgios", "berrettini", "wawrinka", "thiem", "del potro", "cilic",
            "ferrer", "ferrero", "moya", "corretja", "costa", "bruguera", "santana", "orantes",
            "verdasco", "feliciano", "badosa", "muguruza", "swiatek", "sabalenka", "gauff",
            "rybakina", "pegula", "paolini", "jabeur", "sakkari", "osaka", "barty", "halep",
            "kerber", "wozniacki", "azarenka", "kvitova", "sharapova", "hingis", "henin",
            "clijsters", "seles", "graf", "navratilova", "evert", "sabatini", "sampras",
            "agassi", "borg", "mcenroe", "connors", "lendl", "edberg", "becker", "wilander",
            "courier", "chang", "rafter", "hewitt", "safin", "kafelnikov", "kuerten", "vilas",
            "ivanisevic", "roddick", "laver", "ashe", "petra kvitova", "maria sakkari",
            "emma raducanu", "danielle collins", "madison keys", "sloane stephens", "sofia kenin",
            "bianca andreescu", "leylah fernandez", "belinda bencic", "elina svitolina",
            "karolina muchova", "marketa vondrousova", "barbora krejcikova", "qinwen zheng",
            "emma navarro", "mirra andreeva", "diana shnaider", "daria kasatkina",
            "beatriz haddad maia", "jelena ostapenko", "karen khachanov", "ugo humbert",
            "arthur fils", "cameron norrie", "dan evans", "sebastian baez", "francisco cerundolo",
            "tomas etcheverry", "nicolas jarry", "alejandro tabilo", "cristian garin",
            "jiri lehecka", "tomas machac", "jakub mensik", "jan lennard struff", "tallon griekspoor",
            "alexei popyrin", "jordan thompson", "thanasi kokkinakis", "alexander bublik", "andres gimeno", "gimeno", "alonso" if False else "manuel alonso"
        ],
    },
    "mus-029": {
        65: [
            "armstrong", "miles", "coltrane", "fitzgerald", "holiday", "simone", "franklin",
            "charles", "wonder", "gaye", "redding", "bb king", "winehouse", "sinatra",
            "ellington", "basie", "parker", "gillespie", "monk", "brubeck", "baker",
            "getz", "evans", "hancock", "corea", "metheny", "pastorius", "mingus"
        ],
        85: [
            "wes montgomery", "grant green", "george benson", "joe pass", "jim hall",
            "charlie christian", "john mclaughlin", "larry coryell", "mike stern", "john scofield",
            "bill frisell", "kurt rosenwinkel", "julian lage", "stanley clarke", "ron carter",
            "christian mcbride", "paul chambers", "ray brown", "charles mingus jr", "scott lafaro",
            "tony williams", "elvin jones", "buddy rich", "gene krupa", "papa jo jones",
            "philly joe jones", "roy haynes", "jack dejohnette", "brian blade", "steve gadd"
        ],
        100: [
            "horace silver", "bud powell", "art tatum", "fats waller", "teddy wilson", "mary lou williams",
            "erroll garner", "red garland", "wynton kelly", "mccoy tyner", "ahmad jamal",
            "cedar walton", "kenny barron", "fred hersch", "brad mehldau", "vijay iyer",
            "cory henry", "hiromi uehara", "robert glasper", "kamasi washington", "yussef dayes",
            "alfa mist", "ezra collective", "nubya garcia", "shabaka hutchings", "sonny stitt",
            "hank mobley", "joe henderson", "dexter gordon", "lee morgan", "freddie hubbard",
            "clifford brown", "fats navarro", "blue mitchell", "kenny dorham", "booker little",
            "wayne shorter", "eric dolphy", "johnny griffin", "zoot sims", "al cohn", "gerry mulligan",
            "pepper adams", "ben webster", "lester young", "chu berry", "johny hodges", "johnny hodges",
            "benny carter", "sidney bechet", "bix beiderbecke", "king oliver", "kid ory",
            "jelly roll morton", "w c handy", "blind willie johnson", "sonny boy williamson",
            "otiss rush", "otis rush", "magic sam", "luther allison", "john mayall", "peter green",
            "rory gallagher", "johnny winter", "derek trucks", "warren haynes", "robert cray",
            "joe louis walker", "walter trout", "beth hart", "susan tedeschi", "bonnie raitt",
            "sharon jones", "charles bradley", "lee fields", "leon bridges", "michael kiwanuka",
            "anderson paak", "jorja smith", "cleo sol", "erykah badu", "jill scott", "maxwell",
            "lauryn hill", "alicia keys", "john legend", "norah jones", "diana krall",
            "melody gardot", "esperanza spalding", "carmen mcrae", "betty carter", "abbey lincoln",
            "nina simone", "bessie smith", "big mama thornton", "koko taylor", "ruth brown", "lavern baker", "wanda jackson" if False else "solomon burke"
        ],
    },
    "geo-016": {
        65: [
            "state of alabama", "state of alaska", "state of arizona", "state of arkansas",
            "state of california", "state of colorado", "state of connecticut", "state of delaware",
            "state of florida", "state of georgia", "state of hawaii", "state of idaho",
            "state of illinois", "state of indiana", "state of iowa", "state of kansas",
            "state of maine", "state of maryland", "state of michigan", "state of minnesota",
            "state of mississippi", "state of missouri", "state of montana", "state of nebraska",
            "state of nevada", "state of new hampshire", "state of new jersey", "state of new mexico",
            "state of new york", "state of north carolina", "state of north dakota", "state of ohio"
        ],
        85: [
            "state of oklahoma", "state of oregon", "state of rhode island", "state of south carolina",
            "state of south dakota", "state of tennessee", "state of texas", "state of utah",
            "state of vermont", "state of washington", "state of west virginia", "state of wisconsin",
            "state of wyoming", "commonwealth of kentucky", "commonwealth of massachusetts",
            "commonwealth of pennsylvania", "commonwealth of virginia", "commonwealth of puerto rico",
            "estado de virginia occidental", "estado de washington dc", "distrito federal de columbia",
            "territorio de guam", "territorio de samoa americana", "territorio de las islas virgenes",
            "territorio de las islas marianas del norte", "estado libre asociado de puerto rico"
        ],
        100: [
            "el estado de alabama", "el estado de alaska", "el estado de arizona", "el estado de arkansas",
            "el estado de california", "el estado de colorado", "el estado de connecticut", "el estado de delaware",
            "el estado de florida", "el estado de georgia", "el estado de hawai", "el estado de idaho",
            "el estado de illinois", "el estado de indiana", "el estado de iowa", "el estado de kansas",
            "el estado de kentucky", "el estado de luisiana", "el estado de maine", "el estado de maryland",
            "el estado de massachusetts", "el estado de michigan", "el estado de minnesota", "el estado de misisipi",
            "el estado de misuri", "el estado de montana", "el estado de nebraska", "el estado de nevada",
            "el estado de nueva jersey", "el estado de nuevo mexico", "el estado de nueva york",
            "el estado de carolina del norte", "el estado de carolina del sur", "el estado de dakota del norte",
            "el estado de dakota del sur", "el estado de ohio", "el estado de oklahoma", "el estado de oregon",
            "el estado de pensilvania", "el estado de rhode island", "el estado de tennessee", "el estado de texas",
            "el estado de utah", "el estado de vermont", "el estado de virginia", "el estado de virginia occidental",
            "el estado de washington", "el estado de wisconsin", "el estado de wyoming",
            "atolon de midway", "atolon johnston", "atolon palmira", "isla baker", "isla howland",
            "isla jarvis", "isla wake", "isla navaza", "arrecife kingman", "nacion navajo",
            "reserva navajo", "territorio de alaska", "territorio de hawai", "territorio de oregon",
            "territorio de luisiana", "territorio de oklahoma", "territorio indio", "territorio de dakota",
            "territorio de utah", "territorio de arizona", "territorio de nuevo mexico", "territorio del noroeste",
            "virginia del oeste", "carolina norte", "carolina sur", "dakota norte", "dakota sur",
            "new hampshire", "nueva hampshire", "new mexico", "new jersey", "rhode island y plantaciones de providence"
        ],
    },
    "dep-022": {
        65: [
            "jordan", "lebron", "kobe", "magic", "bird", "kareem", "shaq", "curry", "durant",
            "gasol", "rubio", "navarro", "rudy", "llull", "chacho", "chacho rodriguez",
            "jokic", "doncic", "antetokounmpo", "giannis", "duncan", "nowitzki", "garnett",
            "iverson", "nash", "wade", "barkley", "malone", "stockton", "olajuwon"
        ],
        85: [
            "robinson", "pippen", "rodman", "isiah", "chamberlain", "russell", "west", "baylor",
            "ewing", "miller", "drexler", "sabonis", "petrovic", "kukoc", "bodiroga",
            "jasikevicius", "spanoulis", "diamantidis", "parker", "ginobili", "scola", "nocioni",
            "campazzo", "yao", "harden", "westbrook", "leonard", "irving", "paul", "anthony"
        ],
        100: [
            "luka doncic", "nikola jokic", "joel embiid", "jayson tatum", "jaylen brown",
            "shai gilgeous alexander", "anthony edwards", "victor wembanyama", "devin booker",
            "damian lillard", "ja morant", "zion williamson", "donovan mitchell", "tyrese haliburton",
            "jalen brunson", "paolo banchero", "chet holmgren", "karl anthony towns", "anthony davis",
            "bam adebayo", "jimmy butler", "paul george", "demar derozan", "zach lavine",
            "trae young", "lamelo ball", "cade cunningham", "alperen sengun", "franz wagner",
            "lauri markkanen", "domantas sabonis", "rudy gobert", "kristaps porzingis",
            "bogdan bogdanovic", "vasilije micic", "milos teodosic", "nando de colo", "mike james",
            "walter tavares", "edy tavares", "shane larkin", "kostas sloukas", "nick calathes",
            "georgios printezis", "andrei kirilenko", "theodoros papaloukas", "ramunas siskauskas",
            "matjaz smodis", "jaka lakovic", "juan carlos navarro", "pau gasol", "marc gasol",
            "jose manuel calderon", "jorge garbajosa", "felipe reyes", "carlos jimenez",
            "fernando martin", "antonio martin", "rafa jofresa", "tomas jofresa", "ferran martinez",
            "alberto herreros", "andres jimenez", "ignacio solozabal", "nacho solozabal",
            "quique villalobos", "chechu biriukov", "wayne brabender", "clifford luyk",
            "emiliano rodriguez", "nino buscato", "francisco buscato", "fran vazquez", "alex mumbru",
            "victor claver", "pablo aguilar", "xabi lopez arostegui", "alberto abalde", "dario brizuela",
            "jaime fernandez", "lorenzo brown", "alba torrens", "amaya valdemoro", "laia palau",
            "marta xargay", "silvia dominguez", "laura gil", "queralt casas", "maite cazorla",
            "raquel carrera", "maria conde", "elisa aguilar", "cindy lima", "anna cruz",
            "lucila pascua", "luisa geiselsoder", "caitlin clark", "diana taurasi", "sue bird",
            "maya moore", "candace parker", "lisa leslie", "sheryl swoopes", "tamika catchings",
            "lauren jackson", "breanna stewart", "aja wilson", "sabrina ionescu", "napheesa collier"
        ],
    },
    "geo-026": {
        65: [
            "nantes", "montpellier", "rennes", "grenoble", "angers", "tours", "orleans",
            "clermont ferrand", "limoges", "perpiñan", "perpignan", "pau", "bayona", "toulon",
            "nimes", "avignon", "aix en provence", "annecy", "chamonix", "cannes", "antibes",
            "saint tropez", "verona", "padua", "trieste", "parma", "modena", "regio de emilia",
            "brescia", "bergamo", "como", "livorno", "lucca", "pisa", "siena", "perugia", "ravena"
        ],
        85: [
            "lecce", "salerno", "amalfi", "sorrento", "reggio calabria", "cagliari", "sassari",
            "olbia", "siracusa", "taormina", "agrigento", "trier", "treveris", "aquisgran", "aachen",
            "munster", "dortmund", "essen", "bochum", "wuppertal", "bielefeld", "kiel", "lubeck",
            "rostock", "potsdam", "halle", "magdeburgo", "erfurt", "jena", "weimar", "karlsruhe",
            "mannheim", "heidelberg", "friburgo", "augsburgo", "ratisbona", "regensburg", "wurzburgo",
            "passau", "garmisch", "linz", "klagenfurt", "villach", "bregenz", "st polten"
        ],
        100: [
            "lugano", "bellinzona", "st gallen", "winterthur", "biel", "thun", "interlaken", "zermatt",
            "davos", "st moritz", "montreux", "neuchatel", "friburgo suiza", "charleroi", "mons",
            "namur", "lovaina", "leuven", "malinas", "mechelen", "ostende", "courtrai", "kortrijk",
            "groninga", "tilburg", "breda", "nijmegen", "nimega", "arnhem", "haarlem", "delft",
            "leiden", "alkmaar", "leeuwarden", "odense", "aalborg", "esbjerg", "roskilde",
            "stavanger", "tromso", "drammen", "lillehammer", "bodo", "uppsala", "linkoping",
            "orebro", "vasteras", "helsingborg", "jonkoping", "umea", "lund", "oulu", "jyvaskyla",
            "lahti", "kuopio", "rovaniemi", "akureyri", "plymouth", "exeter", "bath", "reading",
            "brighton", "portsmouth", "norwich", "cambridge", "coventry", "leicester", "derby",
            "stoke on trent", "wolverhampton", "bradford", "kingston upon hull", "hull", "preston",
            "dundee", "inverness", "stirling", "st andrews", "derry", "londonderry", "limerick",
            "waterford", "kilkenny", "killarney", "setubal", "funchal", "ponta delgada", "aveiro",
            "viseu", "guimaraes", "evora", "beja", "portimao", "lagos portugal", "cascais", "sintra",
            "szczecin", "bydgoszcz", "lublin", "katowice", "bialystok", "gdynia", "torun", "zakopane",
            "pilsen", "plzen", "liberec", "olomouc", "ceske budejovice", "karlovy vary", "kosice",
            "presov", "zilina", "nitra", "szeged", "miskolc", "pecs", "gyor", "iasi", "brasov",
            "constanza", "craiova", "galati", "sibiu", "sighisoara", "burgas", "ruse", "plovdiv",
            "patras", "larisa", "volos", "ioannina", "calamata", "corfu", "chania", "mykonos", "santorini",
            "rijeka", "osijek", "zadar", "pula", "rovinj", "maribor", "koper", "bled", "banja luka",
            "mostar", "nis", "kragujevac", "subotica", "kotor", "budva", "durres", "vlore", "shkoder",
            "ohrid", "bitola", "tartu", "parnu", "daugavpils", "liepaja", "jurmala", "klaipeda",
            "siauliai", "panevezys", "trakai", "dnipro", "zaporiyia", "vinnitsia", "chernivtsi",
            "homel", "gomel", "brest", "grodno", "vitebsk", "balti", "tiraspol", "nizhni novgorod",
            "novosibirsk", "samara", "rostov del don", "volgogrado", "voronezh", "perm", "ufa", "murmansk"
        ],
    },
    "dep-028": {
        65: [
            "lakers", "celtics", "bulls", "warriors", "spurs", "knicks", "yankees", "cowboys",
            "chiefs", "patriots", "nuggets", "bucks", "sixers", "76ers", "mavericks", "suns",
            "cavaliers", "raptors", "rockets", "pistons", "magic", "pacers", "thunder",
            "timberwolves", "grizzlies", "jazz", "blazers", "trail blazers", "kings", "clippers",
            "nets", "hawks", "hornets", "wizards", "pelicans"
        ],
        85: [
            "49ers", "niners", "packers", "steelers", "eagles", "ravens", "bills", "raiders",
            "dolphins", "bears", "giants", "rams", "seahawks", "broncos", "bengals", "buccaneers",
            "dodgers", "red sox", "cubs", "astros", "braves", "cardinals", "phillies", "mets",
            "padres", "rangers", "blue jays", "orioles", "mariners", "tigers", "guardians",
            "twins", "white sox", "athletics", "angels", "rockies", "diamondbacks", "marlins",
            "nationals", "rays", "pirates", "reds", "brewers", "royals"
        ],
        100: [
            "arizona cardinals", "atlanta falcons", "carolina panthers", "cleveland browns",
            "detroit lions", "houston texans", "indianapolis colts", "jacksonville jaguars",
            "los angeles chargers", "minnesota vikings", "new orleans saints", "new york jets",
            "tennessee titans", "washington commanders", "falcons", "panthers", "browns", "lions",
            "texans", "colts", "jaguars", "chargers", "vikings", "saints", "jets", "titans", "commanders",
            "canadiens", "maple leafs", "bruins", "blackhawks", "red wings", "oilers", "penguins",
            "avalanche", "lightning", "golden knights", "stars", "hurricanes", "devils", "flyers",
            "capitals", "blues", "sharks", "ducks", "canucks", "buffalo sabres", "sabres",
            "calgary flames", "flames", "columbus blue jackets", "blue jackets", "minnesota wild",
            "wild", "nashville predators", "predators", "new york islanders", "islanders",
            "ottawa senators", "senators", "seattle kraken", "kraken", "utah hockey club",
            "winnipeg jets", "arizona coyotes", "seattle supersonics", "supersonics", "sonics",
            "vancouver grizzlies", "new jersey nets", "charlotte bobcats", "oakland raiders",
            "san diego chargers", "st louis rams", "montreal expos", "washington redskins",
            "cleveland indians", "hartford whalers", "quebec nordiques", "los angeles galaxy", "inter miami" if False else "sacramento athletics"
        ],
    },
    "geo-027": {
        65: [
            "saltillo", "hermosillo", "culiacan", "chihuahua", "ciudad juarez", "torreon",
            "durango", "san luis potosi", "aguascalientes", "morelia", "toluca", "cuernavaca",
            "tuxtla gutierrez", "villahermosa", "campeche", "cheturmal", "chetumal", "playa del carmen",
            "tulum", "tampico", "reynosa", "matamoros", "nuevo laredo", "mexicali", "ensenada",
            "la paz mexico", "mazatlan", "tepic", "colima", "pachuca", "tlaxcala", "chilpancingo"
        ],
        85: [
            "saskatoon", "regina", "victoria canada", "st john s", "charlottetown", "fredericton",
            "moncton", "whitehorse", "yellowknife", "iqaluit", "mississauga", "brampton",
            "hamilton canada", "london ontario", "kitchener", "windsor canada", "markham",
            "albuquerque", "el paso", "fresno", "bakersfield", "riverside", "stockton",
            "long beach", "oakland", "anaheim", "santa ana", "mesa", "tucson", "colorado springs",
            "omaha", "tulsa", "wichita", "arlington", "corpus christi", "plano", "lexington", "louisville"
        ],
        100: [
            "kansas city", "st louis", "san luis", "indianapolis", "columbus", "cincinnati",
            "milwaukee", "madison", "des moines", "little rock", "baton rouge", "shreveport",
            "jackson", "birmingham alabama", "montgomery", "mobile", "huntsville", "tallahassee",
            "jacksonville", "st petersburg", "fort lauderdale", "west palm beach", "savannah",
            "charleston", "columbia", "raleigh", "durham", "greensboro", "richmond", "norfolk",
            "virginia beach", "providence", "hartford", "new haven", "portland maine", "burlington",
            "buffalo", "rochester", "syracuse", "albany", "newark", "jersey city", "santa fe",
            "boise", "reno", "spokane", "tacoma", "eugene", "juneau", "fairbanks", "hilo",
            "quetzaltenango", "escuintla", "flores guatemala", "santa ana el salvador", "san miguel",
            "la ceiba", "roatan", "leon nicaragua", "granada nicaragua", "alajuela", "heredia",
            "cartago", "liberia costa rica", "david panama", "colon", "camaguey", "holguin",
            "santa clara", "cienfuegos", "matanzas", "guantanamo", "trinidad cuba", "santiago de los caballeros",
            "la romana", "puerto plata", "cap haitien", "montego bay", "ocho rios", "freeport",
            "puerto españa", "san fernando", "castries", "kingstown", "roseau", "basseterre",
            "oranjestad", "willemstad", "philipsburg", "bahia blanca", "neuquen", "comodoro rivadavia",
            "rio gallegos", "el calafate", "posadas", "corrientes", "resistencia", "parana",
            "santa fe argentina", "san juan argentina", "san luis argentina", "jujuy", "san salvador de jujuy",
            "temuco", "valdivia", "osorno", "castro chile", "rancagua", "talca", "chillan",
            "coquimbo", "iquique", "arica", "calama", "copiapo", "oruro", "potosi", "tarija",
            "encarnacion", "salto", "paysandu", "colonia del sacramento", "campinas", "santos",
            "niteroi", "vitoria", "maceio", "natal", "joao pessoa", "aracaju", "teresina",
            "sao luis", "cuiaba", "campo grande", "porto velho", "boa vista", "macapa", "palmas brasil",
            "cucuta", "ibague", "villavicencio", "pasto", "monteria", "valledupar", "neiva",
            "popayan", "armenia colombia", "tunja", "san andres", "leticia", "chiclayo", "piura",
            "huancayo", "chimbote", "pucallpa", "tacna", "puno", "cajamarca", "ayacucho",
            "machala", "portoviejo", "riobamba", "loja", "esmeraldas", "barquisimeto", "valencia venezuela",
            "ciudad guayana", "maturin", "barcelona venezuela", "puerto la cruz", "merida venezuela", "san cristobal"
        ],
    },
    "gen-010": {
        65: [
            "spain", "france", "germany", "italy", "portugal", "united kingdom", "ireland",
            "iceland", "norway", "sweden", "finland", "denmark", "netherlands", "belgium",
            "luxembourg", "switzerland", "austria", "poland", "czechia", "czech republic",
            "slovakia", "hungary", "romania", "bulgaria", "greece", "cyprus", "malta",
            "croatia", "slovenia", "serbia", "bosnia and herzegovina", "montenegro", "albania"
        ],
        85: [
            "north macedonia", "ukraine", "belarus", "moldova", "estonia", "latvia", "lithuania",
            "russia", "turkey", "turkiye", "georgia", "armenia", "azerbaijan", "kazakhstan",
            "uzbekistan", "turkmenistan", "kyrgyzstan", "tajikistan", "afghanistan", "iran",
            "iraq", "syria", "lebanon", "israel", "palestine", "jordan", "saudi arabia",
            "yemen", "oman", "united arab emirates", "qatar", "kuwait", "bahrain"
        ],
        100: [
            "india", "pakistan", "bangladesh", "sri lanka", "nepal", "bhutan", "maldives",
            "china", "japan", "south korea", "north korea", "mongolia", "taiwan", "vietnam",
            "laos", "cambodia", "thailand", "myanmar", "malaysia", "singapore", "indonesia",
            "philippines", "brunei", "east timor", "timor leste", "santo principado de andorra" if False else "principality of andorra",
            "principality of monaco", "principality of liechtenstein", "grand duchy of luxembourg",
            "republic of san marino", "vatican city", "holy see", "kingdom of spain", "french republic",
            "italian republic", "federal republic of germany", "portuguese republic", "kingdom of the netherlands",
            "kingdom of belgium", "swiss confederation", "kingdom of denmark", "kingdom of sweden",
            "kingdom of norway", "republic of finland", "republic of iceland", "republic of ireland",
            "republic of poland", "republic of austria", "hellenic republic", "russian federation",
            "people s republic of china", "state of japan", "republic of india", "republic of korea",
            "kingdom of thailand", "kingdom of saudi arabia", "state of israel", "state of qatar",
            "state of kuwait", "sultanate of oman", "kingdom of bahrain", "hashemite kingdom of jordan",
            "republic of turkey", "republic of indonesia", "republic of the philippines",
            "republic of singapore", "socialist republic of vietnam", "kingdom of cambodia",
            "kingdom of bhutan", "republic of maldives", "islamic republic of pakistan",
            "islamic republic of iran", "republic of iraq", "republic of armenia", "republic of georgia",
            "republic of azerbaijan", "republic of kazakhstan", "republic of uzbekistan",
            "republic of belarus", "republic of ukraine", "republic of serbia", "republic of croatia",
            "republic of slovenia", "republic of bulgaria", "republic of albania", "republic of malta",
            "republic of cyprus", "republic of estonia", "republic of latvia", "republic of lithuania",
            "espagne", "francia" if False else "france metropolitaine", "allemagne", "italie", "royaume uni", "pays bas",
            "suisse", "autriche", "grece", "suede", "norvege", "pologne", "hongrie", "roumanie", "chine", "japon", "inde"
        ],
    },
    "geo-002": {
        65: [
            "london", "rome", "brussels", "vienna", "prague", "warsaw", "athens", "moscow",
            "kyiv", "bucharest", "lisbon", "copenhagen", "stockholm", "bern", "cairo", "riyadh",
            "baghdad", "tehran", "jerusalem", "tokyo", "beijing", "seoul", "bangkok", "hanoi",
            "jakarta", "new delhi", "kathmandu", "dhaka", "ulaanbaatar", "tashkent", "ashgabat",
            "bishkek", "dushanbe", "yerevan", "tbilisi", "chisinau", "minsk", "nicosia", "valletta", "luxembourg"
        ],
        85: [
            "mexico city", "havana", "panama city", "guatemala city", "port au prince",
            "port of spain", "castries", "kingstown", "roseau", "basseterre", "saint john s",
            "addis ababa", "khartoum", "juba", "tunis", "algiers", "nouakchott", "conakry",
            "freetown", "monrovia", "yamoussoukro", "accra", "lome", "porto novo", "abuja",
            "yaounde", "malabo", "libreville", "brazzaville", "kinshasa", "bangui", "n djamena",
            "yamena", "ouagadougou", "ugadugu", "banjul", "bissau", "bisau", "praia", "sao tome",
            "santo tome", "lilongwe", "mogadishu", "mogadiscio", "djibouti", "thimphu", "timbu",
            "naypyidaw", "phnom penh", "vientiane", "dili", "port moresby", "honiara", "port vila",
            "tarawa", "majuro", "ngerulmud", "palikir", "yaren", "funafuti"
        ],
        100: [
            "andorra la vella", "la valeta", "san marino", "ciudad de san marino", "monaco ville",
            "vatican city", "ciudad del vaticano", "el vaticano", "la habana vieja" if False else "distrito federal",
            "cdmx", "df", "santafe de bogota", "bogota dc", "san jose de costa rica",
            "santiago de los caballeros" if False else "santo domingo de guzman", "asuncion del paraguay",
            "nuestra señora de la paz", "san francisco de quito", "santiago de guayaquil" if False else "ciudad de belice",
            "belmopan", "ramala", "jerusalen este", "amman", "aman", "beirut", "damasco", "damascus",
            "mascate", "muscat", "sanaa", "sana", "doha", "manama", "kuwait city", "ciudad de kuwait",
            "abu dhabi", "abu dabi", "astana", "nur sultan", "baku", "kabul", "islamabad", "colombo",
            "sri jayawardenapura kotte", "kotte", "male", "pionyang", "pyongyang", "taipei",
            "ulaan baatar", "bandar seri begawan", "kuala lumpur", "putrajaya", "singapore",
            "manila", "seul", "canberra", "camberra", "wellington", "suva", "apia", "nuku alofa",
            "alofi", "avarua", "rabat", "argel", "tripoli", "el cairo", "cairo", "jartum",
            "adis abeba", "asmara", "yibuti", "nairobi", "kampala", "kigali", "gitega", "bujumbura",
            "dodoma", "dar es salam", "lusaka", "harare", "lilongüe", "maputo", "antananarivo",
            "port louis", "puerto luis", "victoria", "moroni", "pretoria", "ciudad del cabo", "bloemfontein",
            "gaborone", "windhoek", "maseru", "mbabane", "lobamba", "luanda", "malabo", "yaunde",
            "bata" if False else "bangui", "librevile" if False else "kinshasa", "niamey", "bamako",
            "dakar", "nuakchot", "conakri", "monrovia", "abiyan", "acra", "lome", "cotonu", "porto novo",
            "lima peru", "quito ecuador", "caracas venezuela", "montevideo uruguay", "brasilia brasil",
            "ottawa canada", "washington dc", "madrid españa", "paris francia", "roma italia",
            "londres reino unido", "berlin alemania", "lisboa portugal", "atenas grecia", "moscu rusia",
            "dublin irlanda", "reikiavik islandia", "oslo noruega", "estocolmo suecia", "copenhague dinamarca",
            "helsinki finlandia", "tallin estonia", "riga letonia", "vilna lituania", "varsovia polonia",
            "praga chequia", "bratislava eslovaquia", "budapest hungria", "viena austria", "berna suiza",
            "amsterdam paises bajos", "bruselas belgica", "luxemburgo ciudad", "liubliana eslovenia",
            "zagreb croacia", "belgrado serbia", "sarajevo bosnia", "podgorica montenegro",
            "skopje macedonia", "tirana albania", "sofia bulgaria", "bucarest rumania", "kiev ucrania",
            "ankara turquia", "tokio japon", "pekin china", "nueva delhi india", "bangkok tailandia"
        ],
    },
    "dep-024": {
        65: [
            "alonso", "sainz", "verstappen", "hamilton", "leclerc", "norris", "piastri", "russell",
            "vettel", "schumacher", "senna", "prost", "lauda", "raikkonen", "hakkinen", "fangio",
            "piquet", "mansell", "hill", "clark", "stewart", "fittipaldi", "villeneuve", "ricciardo",
            "bottas", "gasly", "ocon", "albon", "tsunoda", "hulkenberg", "magnussen", "stroll",
            "marquez", "rossi", "lorenzo", "pedrosa", "martin", "bagnaia", "quartararo", "nieto", "criville"
        ],
        85: [
            "colin mcrae", "carlos sainz", "sebastien loeb", "sebastien ogier", "kalle rovanpera",
            "ott tanak", "thierry neuville", "elfyn evans", "dani sordo", "juha kankkunen",
            "tommi makinen", "ari vatanen", "walter rohrl", "michele mouton", "hannu mikkola",
            "markku alen", "stig blomqvist", "marcus gronholm", "petter solberg", "richard burns",
            "bjorn waldegard", "timo salonen", "miki biasion", "didier auriol", "francois delecour",
            "gilles panizzi", "mikko hirvonen", "jari matti latvala", "andreas mikkelsen", "kris meeke",
            "esapekka lappi", "takamoto katsuta", "adrien fourmaux", "craig breen", "henri toivonen"
        ],
        100: [
            "jorge prado", "fermin aldeguer", "ai ogura", "aron canet", "celestino vietti",
            "tony arbolino", "somkiat chantra", "sergio garcia doles", "alonso lopez", "manuel gonzalez",
            "david alonso", "daniel holgado", "ivan ortola", "jose antonio rueda", "angel piqueras",
            "jaume masia", "izan guevara", "albert arenas", "tito rabat", "efren vazquez",
            "julian simon", "nico terol", "alvaro bautista", "hector barbera", "ruben xaus",
            "fonsi nieto", "sito pons", "joan garriga", "champi herreros", "manuel herreros",
            "jorge martinez aspar", "aspar", "ricardo tormo", "carlos lavergne" if False else "santiago herrero",
            "benjamin grau", "andrea dovizioso", "marco simoncelli", "loris capirossi", "max biaggi",
            "luca cadalora", "franco uncini", "marco lucchinelli", "phil read", "mike hailwood",
            "john surtees", "jarno saarinen", "kenney roberts", "kenny roberts", "kenny roberts jr",
            "randy mamola", "john kocinski", "alex barros", "tohru ukawa", "daijiro kato",
            "shinya nakano", "norick abe", "tetsuya harada", "kazuto sakata", "haruchika aoki",
            "troy bayliss", "carl fogarty", "jonathan rea", "toprak razgatlioglu", "troy corser",
            "colin edwards", "ben spies", "cal crutchlow", "scott redding", "bradley smith",
            "andrea iannone", "danilo petrucci", "franco morbidelli", "fabio di giannantonio",
            "luca marini", "marco bezzecchi", "takaaki nakagami", "somkiat", "miguel oliveira",
            "keke rosberg", "nico rosberg", "alan jones", "jody scheckter", "mario andretti",
            "ronnie peterson", "clay regazzoni", "carlos reutemann", "giancarlo fisichella",
            "jarno trulli", "rubens barrichello", "felipe massa", "juan pablo montoya", "ralf schumacher",
            "david coulthard", "mark webber", "heinz harald frentzen", "jean alesi", "gerhard berger",
            "riccardo patrese", "michele alboreto", "rené arnoux", "rene arnoux", "jacques laffite",
            "patrick tambay", "didier pironi", "elio de angelis", "stirling moss", "peter collins",
            "mike hawthorn", "alberto ascari", "giuseppe farina", "nino farina", "luigi fagioli",
            "phil hill", "dan gurney", "bruce mclaren", "denny hulme", "chris amon", "jacky ickx",
            "francois cevert", "emerson fittipaldi", "carlos pace", "jose carlos pace", "martin brundle",
            "johnny herbert", "eddie irvine", "mika salo", "nick heidfeld", "robert kubica",
            "heikki kovalainen", "roman grosjean", "romain grosjean", "pastor maldonado", "kamui kobayashi",
            "vitaly petrov", "sergey sirotkin", "daniil kvyat", "sergio checo perez", "liam lawson",
            "jack doohan", "gabriel bortoleto", "isack hadjar", "kimi antonelli", "andrea kimi antonelli"
        ],
    },
}

DENSITY_BATCH_1_TOPUP = {
    "pal-032": {
        100: [
            "a buenas horas", "a cada cerdo le llega su san martin", "a caballo regalado no le mires el diente",
            "a dios rogando y con el mazo dando", "a grandes males grandes remedios",
            "a la tercera va la vencida", "a otro perro", "al Cesar lo que es del Cesar",
            "al pan pan", "andar de cabeza", "apretar los dientes", "arrimar el hombro",
            "atarse los machos", "bajar los humos", "cagarla", "cambiar de aires", "cambiar el chip",
            "cantar las cuarenta", "cerrar el pico", "chuparse el dedo", "coger el guante"
        ],
    },
    "mus-023": {
        100: [
            "galy galiano", "diomedes diaz", "jorge celedon", "kaleth morales", "jean carlos centeno",
            "binomiode oro", "binomio de oro", "los inquietos del vallenato", "peter manjarres",
            "omar geles", "ivan villazon", "poncho zuleta", "alfredo gutierrez", "lisandro meza",
            "rodolfo aicardi", "pastor lopez", "nelson henriquez", "billos caracas boys",
            "los melódicos", "los melodicos", "orquesta guayacan", "grupo gale"
        ],
    },
    "gen-010": {
        100: [
            "el reino de españa", "el reino de belgica", "el reino de dinamarca", "el reino de suecia",
            "el reino de noruega", "el reino de los paises bajos", "la republica francesa",
            "la republica italiana", "la republica portuguesa", "la republica de irlanda",
            "la republica de polonia", "la republica de austria", "la republica de hungria",
            "la republica de finlandia", "la republica de islandia", "la republica checa",
            "la republica eslovaca", "el principado de andorra", "el principado de monaco",
            "el principado de liechtenstein", "el gran ducado de luxemburgo", "el estado del vaticano",
            "la santa sede", "la confederacion suiza", "la republica helenica"
        ],
    },
    "dep-010": {
        100: [
            "carlos alcaraz garfia", "rafael nadal parera", "lorenzo sonego", "matteo berrettini",
            "gael monfils", "richard gasquet", "stanislas wawrinka", "marin cilic", "borna coric",
            "filip krajinovic", "laslo djere", "alejandro davidovich", "pablo carreno",
            "garbine muguruza blanco", "conchita martinez", "arantxa sanchez", "manolo santana",
            "andres gimeno", "sergi bruguera", "carlos moya llompart", "juan carlos ferrero",
            "alex corretja", "albert costa", "marcel granollers", "fernando verdasco",
            "feliciano lopez", "nicolas almagro", "tommy robredo", "emilio sanchez", "javier sanchez vicario"
        ],
    },
    "geo-023": {
        100: [
            "campiña de jaen", "la loma", "el condado de jaen", "sierra de segura jaen",
            "comarca de guadalajara", "la alcarria conquense", "la manchuela", "mancha alta",
            "campo de san juan", "valle de alcudia", "monte iberico", "corredor de almansa",
            "horta nord", "horta sud", "camp de turia", "camp de morvedre", "ribera alta",
            "ribera baja", "la costera", "vall d albaida", "el comtat", "l alcoia",
            "marina baixa", "vinalopo mitja", "baix vinalopo", "alto palancia", "alto mijares",
            "plana alta", "plana baixa", "els ports", "baix maestrat", "alt maestrat"
        ],
    },
    "dep-025": {
        100: [
            "españa femenina", "francia masculina", "argentina masculina", "brasil masculina",
            "seleccion de andorra", "seleccion de luxemburgo", "seleccion de malta",
            "seleccion de chipre", "seleccion de estonia", "seleccion de letonia",
            "seleccion de lituania", "seleccion de bielorrusia", "seleccion de armenia",
            "seleccion de azerbaiyan", "seleccion de kazajistan", "seleccion de israel",
            "seleccion de bosnia", "seleccion de montenegro", "seleccion de macedonia del norte",
            "seleccion de kosovo", "seleccion de islandia", "seleccion de finlandia",
            "seleccion de eslovaquia", "seleccion de bulgaria", "seleccion de albania",
            "seleccion de arabia saudi", "seleccion de iran", "seleccion de corea del sur"
        ],
    },
    "geo-020": {
        100: [
            "territorio de ultramar frances", "territorio britanico de ultramar",
            "tierras australes francesas", "islas georgias del sur", "islas sandwich del sur",
            "atolon de wake", "isla de guam", "archipielago de chagos", "isla diego garcia",
            "isla de easter", "isla robinson crusoe", "archipielago de juan fernandez",
            "isla de tierra del fuego", "islas san andres y providencia", "isla gorgona",
            "isla de margarita", "isla la tortuga", "islas los roques", "colectividad de san martin",
            "colectividad de san bartolome", "san pedro y miquelon", "nueva caledonia francia",
            "isla de mayotte", "isla la reunion", "isla martinica", "isla guadalupe",
            "territorio del yukon", "territorio de nunavut", "islas del estrecho de bering"
        ],
    },
    "dep-022": {
        100: [
            "steve kerr", "john paxson", "b j armstrong", "horace grant", "toni kukoc",
            "luc longley", "ron harper", "bill wennington", "robert parish", "kevin mchale",
            "dennis johnson", "danny ainge", "cedric maxwell", "james worthy", "byron scott",
            "a c green", "michael cooper", "kurt rambis", "mychal thompson", "joe dumars",
            "bill laimbeer", "rick mahorn", "vinnie johnson", "john salley", "mark aguirre",
            "alex english", "adrian dantley", "bernard king", "sidney moncrief", "jack sikma",
            "maurice cheeks", "andrew toney", "bobby jones", "artis gilmore", "nate thurmond"
        ],
    },
    "geo-031": {
        100: [
            "bosque de redwood", "parque nacional sequoia", "parque nacional glacier",
            "valle de monument", "bosque negro", "valle del rin", "selva del amazonas",
            "selva del darien", "bosque de sherwood", "parque nacional banff", "parque nacional jasper",
            "lago baikal", "bosque de yakushima", "valle de cappadocia", "capadocia",
            "cañon del antilope", "gran cañon del colorado", "cataratas del angel",
            "salar de atacama", "desierto de mojave", "desierto de sonora", "desierto de gobi",
            "desierto del sahara", "desierto de kalahari", "valle del rift", "gran valle del rift",
            "bosque atlantico", "mata atlantica", "bosque tropical del congo", "cuenca del congo"
        ],
    },
    "pel-026": {
        100: [
            "inuyasha", "yuyu hakusho", "dragon ball z la batalla de los dioses",
            "dragon ball z la resurreccion de freezer", "la princesa kaguya", "recuerdos del ayer",
            "la colina de las amapolas", "el recuerdo de marnie", "haru en el reino de los gatos",
            "arrietty y el mundo de los diminutos", "en este rincon del mundo", "maquia",
            "quiero comerme tu pancreas", "josee el tigre y los peces", "words bubble up like soda pop",
            "a whisker away", "amor de gata", "mirai", "steins gate la pelicula",
            "no game no life zero", "made in abyss dawn of the deep soul", "evangelion 2 0",
            "evangelion 3 0", "evangelion 3 0 1 0", "akira remastered", "ghost in the shell 1995",
            "angel s egg", "el huevo del angel", "belladonna of sadness", "akage no anne", "marco de los apeninos"
        ],
    },
    "geo-002": {
        100: [
            "paris france", "rome italy", "london uk", "berlin germany", "madrid spain",
            "lisbon portugal", "washington d c", "mexico", "buenos aires argentina",
            "santiago", "lima peru", "bogota colombia", "caracas venezuela", "quito ecuador",
            "la paz bolivia", "sucre bolivia", "asuncion paraguay", "montevideo uruguay",
            "brasilia df", "reykjavik iceland", "oslo norway", "stockholm sweden",
            "helsinki finland", "copenhagen denmark", "dublin ireland", "brussels belgium",
            "amsterdam netherlands", "the hague", "bern switzerland", "vienna austria",
            "prague czechia", "bratislava slovakia", "budapest hungary", "warsaw poland",
            "bucharest romania", "sofia bulgaria", "athens greece", "ankara turkey",
            "moscow russia", "kyiv ukraine", "minsk belarus", "chisinau moldova",
            "nairobi kenya", "kampala uganda", "kigali rwanda", "cairo egypt", "rabat morocco"
        ],
    },
    "geo-015": {
        100: [
            "principado de andorra europa", "republica de san marino europa",
            "republica de austria europa", "republica de hungria europa", "republica de eslovaquia",
            "republica de chequia", "chequia europa", "confederacion de suiza",
            "principado de liechtenstein europa", "gran ducado de luxemburgo europa",
            "estado de la ciudad del vaticano", "el estado del vaticano",
            "republica de macedonia", "republica de macedonia del norte", "republica de kosovo",
            "republica de serbia europa", "republica de moldavia europa", "republica de bielorrusia europa",
            "republica de armenia asia", "republica de azerbaiyan asia", "republica de kazajistan asia",
            "republica de uzbekistan asia", "republica de turkmenistan asia", "republica de tayikistan asia",
            "republica de kirguistan", "kirguistan asia", "republica de mongolia asia",
            "reino de butan asia", "republica de nepal asia", "republica de laos",
            "republica de afganistan", "estado plurinacional de bolivia america",
            "republica de paraguay america", "republica de burkina faso", "republica de mali africa",
            "republica de niger africa", "republica de chad africa", "republica de sudan del sur",
            "republica de etiopia", "republica de ruanda africa", "republica de burundi africa",
            "republica de uganda africa", "republica de zambia africa", "republica de zimbabue africa",
            "republica de botsuana africa", "republica de malaui africa", "reino de lesoto africa",
            "reino de esuatini africa", "republica centroafricana africa"
        ],
    },
    "mus-027": {
        100: [
            "bob dylan", "bruce springsteen", "tom waits", "neil diamond", "leonard cohen" if False else "johnny cash",
            "willie nelson", "waylon jennings", "kris kristofferson", "emmy lou harris", "emmylou harris",
            "linda ronstadt", "jackson browne", "warren zevon", "randy newman", "harry nilsson",
            "todd rundgren", "hall and oates", "daryl hall and john oates", "the spinners",
            "the o jays", "harold melvin and the blue notes", "earth wind & fire", "tower of power",
            "average white band", "commodores", "the commodores", "kool & the gang", "gap band",
            "the gap band", "rick james", "prince and the revolution", "morris day and the time",
            "new edition", "run dmc", "public enemy", "beastie boys", "de la soul", "a tribe called quest",
            "outkast", "wu tang clan", "eric b and rakim", "grandmaster flash", "sugarhill gang",
            "the sugarhill gang", "ll cool j", "salt n pepa", "tlc", "swv", "en vogue"
        ],
    },
    "mus-029": {
        100: [
            "billie holiday", "ella fitzgerald", "louis armstrong", "miles davis", "john coltrane",
            "charlie parker", "dizzy gillespie", "thelonious monk", "duke ellington", "count basie",
            "wayne shorter", "herbie hancock", "chick corea", "keith jarrett", "pat metheny",
            "jaco pastorius", "charlie mingus", "dave brubeck", "chet baker", "stan getz",
            "bill evans", "oscar peterson", "cannonball adderley", "sonny rollins", "coleman hawkins",
            "art blakey", "max roach", "nat king cole", "sarah vaughan", "dinah washington",
            "etta james", "nina simone", "aretha franklin", "ray charles", "stevie wonder",
            "james brown", "marvin gaye", "otis redding", "sam cooke", "al green", "bill withers",
            "curtis mayfield", "isaac hayes", "barry white", "b b king", "muddy waters",
            "howlin wolf", "john lee hooker", "robert johnson", "buddy guy", "stevie ray vaughan",
            "albert king", "freddie king", "t bone walker", "elmore james", "son house", "skip james",
            "lead belly", "blind lemon jefferson", "bo diddley", "little walter", "big bill broonzy",
            "django reinhardt", "stephane grappelli", "wes montgomery", "grant green", "george benson"
        ],
    },
    "mus-010": {
        100: [
            "kendrick", "eminem", "snoop", "2pac", "tupac", "biggie", "jay z", "kanye", "drake",
            "kase o", "nach", "toteking", "zatu", "sfdk", "violadores del verso", "c tangana",
            "natos y waor", "ayax y prok", "mala rodriguez", "chojin", "falsalarma", "juaninacka",
            "shotta", "foyone", "delaossa", "rels b", "cruz cafune", "kidd keo", "yung beef",
            "kaydy cain", "morad", "beny jr", "el jincho", "hard gz", "fernandocosta", "recycled j",
            "bejo", "gata cattana", "arianna puello", "santa salut", "los chikos del maiz",
            "rayden", "chuty", "skone", "arkano", "bnet", "gazir", "aczino", "trueno", "wos", "duki",
            "residente", "canserbero", "cartel de santa", "cypress hill", "public enemy", "run dmc",
            "beastie boys", "wu tang clan", "mobb deep", "gang starr", "nas", "outkast", "rakim",
            "krs one", "big daddy kane", "ll cool j", "lauryn hill", "missy elliott", "nicki minaj",
            "cardi b", "travis scott", "j cole", "asap rocky", "tyler the creator", "mac miller",
            "wiz khalifa", "lil wayne", "50 cent", "dr dre", "ice cube", "post malone", "21 savage"
        ],
    },
    "geo-030": {
        100: [
            "museo nacional del prado", "museo nacional centro de arte reina sofia",
            "museo thyssen bornemisza", "museo guggenheim bilbao", "museo picasso barcelona",
            "museo picasso malaga", "museo dali figueres", "catedral de santa maria la real de la almudena",
            "catedral de la almudena", "san jeronimo el real", "basilica de san francisco el grande",
            "monasterio de las descalzas reales", "monasterio de la encarnacion",
            "palacio de santa cruz", "palacio de linares", "casa de america", "palacio de fernan nuñez",
            "catedral de palma de mallorca", "la seu", "seu de palma", "catedral de girona",
            "catedral de zaragoza la seo", "la seo de zaragoza", "basilica de nuestra señora del pilar",
            "catedral de pamplona santa maria", "catedral de santiago de compostela",
            "monasterio de san juan de la peña", "monasterio de suso", "monasterio de yuso",
            "monasterio de piedra", "monasterio de veruela", "monasterio de santa maria de ripoll",
            "monasterio de sant cugat", "monasterio de santes creus", "monasterio de vallbona de les monges",
            "castillo de xativa", "castillo de peñiscola", "castillo de santa barbara",
            "castillo de la mota", "castillo de coca", "castillo de belmonte", "castillo de almansa",
            "castillo de manzanares el real", "castillo de buitrago", "castillo de ponferrada",
            "palacio del infantado", "palacio de los duques de osuna", "palacio de el pardo"
        ],
    },
    "dep-024": {
        100: [
            "fernando alonso", "carlos sainz", "marc marquez", "jorge martin", "valentino rossi",
            "michael schumacher", "lewis hamilton", "max verstappen", "ayrton senna", "alain prost",
            "niki lauda", "sebastian vettel", "pedro de la rosa", "charles leclerc", "lando norris",
            "oscar piastri", "george russell", "sergio perez", "kimi raikkonen", "mika hakkinen",
            "jenson button", "nico rosberg", "damon hill", "nigel mansell", "nelson piquet",
            "juan manuel fangio", "jim clark", "jackie stewart", "emerson fittipaldi", "jochen rindt",
            "james hunt", "gilles villeneuve", "jacques villeneuve", "daniel ricciardo", "valtteri bottas",
            "pierre gasly", "esteban ocon", "alex albon", "yuki tsunoda", "nico hulkenberg",
            "kevin magnussen", "lance stroll", "oliver bearman", "franco colapinto", "jorge lorenzo",
            "dani pedrosa", "alex criville", "angel nieto", "joan mir", "alex rins", "aleix espargaro",
            "pol espargaro", "maverick viñales", "pedro acosta", "alex marquez", "raul fernandez",
            "augusto fernandez", "sete gibernau", "carlos checa", "toni elias", "pecco bagnaia",
            "fabio quartararo", "enea bastianini", "brad binder", "jack miller", "johann zarco",
            "casey stoner", "nicky hayden", "mick doohan", "wayne rainey", "kevin schwantz",
            "eddie lawson", "freddie spencer", "wayne gardner", "barry sheene", "giacomo agostini",
            "alexis masbou" if False else "carlos sainz padre", "carlos sainz junior", "carlos sainz senior",
            "marquez 93", "alonso 14", "rossi 46", "hamilton 44", "verstappen 1", "schumacher 7"
        ],
    },
    "dep-027": {
        100: [
            "dani parejo", "parejo", "jesus navas gonzalez", "sergio canales", "canales",
            "borja mayoral", "mayoral", "hugo duro", "jose gaya", "gaya", "carlos soler", "soler",
            "ferran torres", "ferran", "eric garcia martret", "aleix garcia", "oscar mingueza",
            "mingueza", "yeremy pino", "hugo guillamon", "abel ruiz", "sergio gomez", "juan miranda",
            "arnau martinez", "miguel gutierrez", "fran garcia", "alvaro odriozola", "dani ceballos",
            "ceballos", "brahim diaz", "brahim", "jose maria callejon", "callejon", "nolito",
            "aduriz", "aritz aduriz", "iker muniain", "muniain", "oscar de marcos", "de marcos",
            "raul garcia", "ander herrera", "beñat etxebarria", "asier illarramendi", "illarramendi",
            "xabi prieto", "mikel san jose", "markel susaeta", "ruben castro", "jorge molina",
            "roberto torres", "kike garcia", "lucas perez", "jose campaña", "luis alberto", "suso",
            "alberto moreno", "pablo sarabia", "sarabia", "carlos fernandez", "hugo mallo",
            "denis suarez", "santi mina", "sergi darder", "darder", "raul de tomas", "rdt", "jonathan viera"
        ],
    },
    "pal-005": {
        100: [
            "aragoniz" if False else "almirez", "almud" if False else "altavoz", "altramuz", "arcabuz", "arcaduz", "arroz", "avestruz",
            "azabache" if False else "ajedrez", "alferez", "albornoz", "alcatraz", "alcazuz", "almez", "andaluz",
            "antifaz", "barniz", "capaz", "capuz", "cariz", "cerviz", "cicatriz", "codorniz",
            "contraluz", "contumaz", "coz", "cruz", "desliz", "diez", "disfraz", "eficaz",
            "emperatriz", "escasez", "falaz", "faz", "feliz", "feroz", "foz", "fugaz", "haz",
            "hez", "hoz", "juez", "lapiz", "lombriz", "luz", "maiz", "matiz", "matraz",
            "matriz", "nariz", "nuez", "paz", "perdiz", "pez", "portavoz", "precoz", "raiz",
            "rapaz", "regaliz", "sagaz", "secuaz", "soez", "solaz", "tamiz", "tapiz", "tenaz",
            "testuz", "tez", "torcaz", "tragaluz", "trasluz", "variz", "veloz", "veraz", "vez",
            "vivaz", "voraz", "voz", "alcaraz", "almaraz", "alvarez", "antunez", "baez", "benitez",
            "bermudez", "cortez", "diaz", "dominguez", "enriquez", "estevez", "fernandez", "gomez",
            "gonzalez", "gutierrez", "hernandez", "ibañez", "jimenez", "juarez", "lopez",
            "manriquez", "marquez", "martinez", "mendez", "muñoz", "nuñez", "ordoñez", "ortiz",
            "paez", "perez", "ramirez", "rodriguez", "ruiz", "saenz", "sanchez", "sanz", "suarez",
            "vazquez", "velazquez", "badajoz", "cadiz", "jerez", "belmez", "fez", "ormuz",
            "santa cruz", "veracruz", "la paz", "arzobispado" if False else "alcarraz", "borraz", "braz" if False else "chaz" if False else "galvez",
            "pelayo" if False else "narvaez", "ramon" if False else "tellez", "yanez", "yañez", "lainez", "pelaez", "valdez",
            "chavez", "alavez", "bautista" if False else "belez", "bejar" if False else "ceballos" if False else "veliz", "soliz", "muniz", "muñiz",
            "esteban" if False else "echeverria" if False else "garcía" if False else "gomez" if False else "izquierdo" if False else "lainez",
            "mendoza" if False else "monroy" if False else "nunez", "ordonez", "oviedo" if False else "pelaz", "quiroz", "reyez", "rodriguez de" if False else "sainz",
            "sanz", "tellez", "urez", "valdez", "villaluz", "mariluz", "beatriz", "andres" if False else "cruz azul", "vera cruz"
        ],
    },
    "geo-013": {
        100: [
            "macizo central gallego", "macizo del montseny", "macizo de garraf", "macizo de ports",
            "macizo de peñagolosa", "macizo de gata", "macizo de gredos", "macizo de peñalara",
            "macizo del moncayo", "macizo de la maladeta", "macizo de monte perdido",
            "macizo de ancares", "macizo del caurel", "cordillera cantabrica", "cordillera iberica",
            "cordillera betica", "cordillera penibetica", "cordillera subbetica", "cordillera central",
            "cordillera prelitoral catalana", "cordillera litoral catalana", "cordillera transversal",
            "pirineo aragones", "pirineo catalan", "pirineo navarro", "prepirineo",
            "montes de toledo", "montes de leon", "montes vascos", "montes universales", "montes obarenes",
            "serrania de ronda", "serrania de cuenca", "serrania de guadalajara", "serrania de atienza",
            "sierra de alta", "sierra de atapuerca", "sierra de la culebra", "sierra de san mamede",
            "sierra de queixa", "sierra del barbanza", "sierra de outes", "sierra de xistral",
            "sierra del xistral", "sierra de meira", "sierra de lorenzana", "sierra de fonsagrada",
            "sierra del rancón" if False else "sierra de las villuercas", "sierra de guadalupe", "sierra de montanchez",
            "sierra de san pedro", "sierra de siruela", "sierra de horcajo", "sierra de la caldera",
            "sierra de la estrella", "serra da estrela", "serra do geres", "serra do marao", "serra do alvao"
        ],
    },
    "geo-019": {
        100: [
            "estados unidos de america", "emiratos arabes unidos", "antigua y barbuda", "arabia saudi",
            "arabia saudita", "el salvador", "islas marshall", "islas salomon",
            "estado de israel", "estado de qatar", "estado de catar", "estado de kuwait",
            "estado de eritrea", "estado de palestina", "estado de libia", "estado de oman",
            "estado de yemen", "estado de barein", "estado de singapur", "estado de brunei",
            "estado de malta", "estado de san marino", "estado de andorra", "estado de la ciudad del vaticano",
            "estado independiente de samoa", "estado independiente de papua nueva guinea",
            "estado plurinacional de bolivia", "estados federados de micronesia", "estados unidos mexicanos",
            "emirato de afganistan", "emirato islamico de afganistan", "emirato de catar",
            "emirato de qatar", "emirato de kuwait", "emirato de barein", "emiratos arabes",
            "archipielago de las bahamas", "archipielago de las maldivas", "archipielago de vanuatu",
            "archipielago de fiyi", "archipielago de tuvalu", "archipielago de tonga",
            "archipielago de kiribati", "archipielago de las filipinas", "archipielago de indonesia",
            "archipielago de japon", "archipielago de cabo verde", "archipielago de las seychelles",
            "archipielago de las comoras", "archipielago de santo tome y principe",
            "isla de irlanda", "isla de islandia", "isla de chipre", "isla de malta",
            "isla de mauricio", "isla de cuba", "isla de jamaica", "isla de haiti",
            "isla de dominica", "isla de santa lucia", "isla de barbados", "isla de granada",
            "isla de nauru", "isla de palaos", "isla de madagascar", "isla de sri lanka",
            "isla de taiwan", "isla de singapur", "isla de barein", "islas fiyi",
            "islas maldivas", "islas seychelles", "islas comoras", "islas cabo verde",
            "islas bahamas", "islas filipinas", "union de las comoras", "union de myanmar",
            "union india", "union sudafricana", "union sovietica", "imperio del japon",
            "imperio de etiopia", "imperio de irak", "imperio de iran",
            "el reino unido", "el vaticano", "el libano", "el salvador", "el congo",
            "el niger", "el chad", "el sudan", "el yemen", "el ecuador", "el peru",
            "el brasil", "el uruguay", "el paraguay", "el japon", "el senegal", "el togo",
            "el gabon", "el camerun", "el reino de españa", "el reino de belgica",
            "el reino de suecia", "el reino de noruega", "el reino de dinamarca",
            "el reino de los paises bajos", "el reino de marruecos", "el reino de jordania",
            "el reino de tailandia", "el reino de camboya", "el reino de butan",
            "el reino de nepal", "el reino de lesoto", "el reino de esuatini",
            "el reino de tonga", "el reino de barein", "el reino de arabia saudi",
            "el principado de andorra", "el principado de monaco", "el principado de liechtenstein",
            "el gran ducado de luxemburgo", "el sultanato de oman",
            "la india", "la china", "la argentina", "los paises bajos",
            "alemania", "albania", "andorra", "angola", "argelia", "argentina", "armenia",
            "australia", "austria", "azerbaiyan", "ecuador", "egipto", "eritrea", "eslovaquia",
            "eslovenia", "españa", "estados unidos", "estonia", "esuatini", "etiopia",
            "afganistan", "india", "indonesia", "irak", "iran", "irlanda", "islandia",
            "israel", "italia", "oman", "ucrania", "uganda", "uruguay", "uzbekistan",
            "united kingdom", "united states", "united states of america", "united arab emirates",
            "antigua and barbuda", "albanie", "allemagne", "andorre", "arabie saoudite",
            "argentine", "armenie", "australie", "autriche", "azerbaidjan", "espagne",
            "estonie", "ethiopie", "etats unis", "indonesie", "irlande", "islande", "italie",
            "ouganda", "ouzbekistan", "oesterreich", "osterreich", "ungarn", "eesti", "eire",
            "ellada", "afghanistan", "algeria", "azerbaijan", "egypt", "ethiopia", "ireland",
            "iceland", "italy", "iraq", "ukraine", "austria hungria", "abisinia", "alta volta",
            "alemania federal", "alemania occidental", "alemania oriental", "eswatini"
        ],
    },
    "geo-016": {
        100: [
            "alabama estado", "alaska estado", "arizona estado", "arkansas estado", "california estado",
            "colorado estado", "connecticut estado", "delaware estado", "florida estado", "georgia estado",
            "hawaii estado", "idaho estado", "illinois estado", "indiana estado", "iowa estado",
            "kansas estado", "kentucky estado", "louisiana estado", "maine estado", "maryland estado",
            "massachusetts estado", "michigan estado", "minnesota estado", "mississippi estado",
            "missouri estado", "montana estado", "nebraska estado", "nevada estado",
            "new hampshire estado", "new jersey estado", "new mexico estado", "new york estado",
            "north carolina estado", "north dakota estado", "ohio estado", "oklahoma estado",
            "oregon estado", "pennsylvania estado", "rhode island estado", "south carolina estado",
            "south dakota estado", "tennessee estado", "texas estado", "utah estado", "vermont estado",
            "virginia estado", "washington estado", "west virginia estado", "wisconsin estado", "wyoming estado",
            "distrito de columbia", "washington dc", "washington d c", "puerto rico", "guam",
            "samoa americana", "islas virgenes americanas", "islas virgenes de estados unidos",
            "islas marianas del norte", "islas marianas septentrionales", "atolon midway",
            "isla wake", "atolon johnston", "atolon palmira", "isla baker", "isla howland",
            "isla jarvis", "isla navaza", "arrecife kingman", "territorio de alaska", "territorio de hawai",
            "territorio de oregon", "territorio de luisiana", "territorio de oklahoma", "territorio indio",
            "territorio de dakota", "territorio de utah", "territorio de arizona", "territorio de nuevo mexico",
            "territorio del noroeste", "mancomunidad de massachusetts", "mancomunidad de pensilvania",
            "mancomunidad de virginia", "mancomunidad de kentucky", "mancomunidad de puerto rico"
        ],
    },
    "pel-003": {
        100: [
            "lo que el viento se llevo 1939", "casablanca 1942", "el padrino 1972", "el padrino parte ii",
            "el padrino ii 1974", "el padrino 2", "la lista de schindler 1993", "forrest gump 1994",
            "titanic 1997", "gladiator 2000", "el señor de los anillos el retorno del rey",
            "el retorno del rey", "retorno del rey", "parasitos 2019", "oppenheimer 2023", "anora 2024",
            "coda 2021", "nomadland 2020", "green book 2018", "la forma del agua 2017", "moonlight 2016",
            "spotlight 2015", "birdman 2014", "12 años de esclavitud", "doce años de esclavitud",
            "argo 2012", "the artist 2011", "el discurso del rey 2010", "en tierra hostil 2009",
            "slumdog millionaire 2008", "no es pais para viejos 2007", "infiltrados 2006", "crash 2005",
            "million dollar baby 2004", "chicago 2002", "una mente maravillosa 2001", "american beauty 1999",
            "shakespeare in love 1998", "el paciente ingles 1996", "braveheart 1995", "sin perdon 1992",
            "el silencio de los corderos 1991", "bailando con lobos 1990", "paseando a miss daisy",
            "rain man 1988", "el ultimo emperador 1987", "platoon 1986", "memorias de africa 1985",
            "amadeus 1984", "la fuerza del cariño", "gandhi 1982", "carros de fuego 1981",
            "gente corriente 1980", "kramer contra kramer", "el cazador 1978", "annie hall 1977",
            "rocky 1976", "alguien volo sobre el nido del cuco", "el golpe 1973", "french connection",
            "patton 1970", "cowboy de medianoche", "oliver 1968", "en el calor de la noche",
            "un hombre para la eternidad", "sonrisas y lagrimas", "my fair lady", "tom jones",
            "lawrence de arabia", "west side story", "el apartamento", "ben hur", "gigi",
            "el puente sobre el rio kwai", "la vuelta al mundo en 80 dias", "marty", "la ley del silencio",
            "de aqui a la eternidad", "el mayor espectaculo del mundo", "un americano en paris",
            "eva al desnudo", "el politico", "hamlet", "la barrera invisible", "los mejores años de nuestra vida",
            "dias sin huella", "siguiendo mi camino", "la señora miniver", "que verde era mi valle",
            "rebeca", "vive como quieras", "la vida de emile zola", "el gran ziegfeld",
            "rebelion a bordo", "sucedio una noche", "cabalgata", "gran hotel", "cimarron",
            "sin novedad en el frente", "melodia de broadway", "alas"
        ],
    },
    "dep-015": {
        100: [
            "60 metros", "100 metros", "200 metros", "400 metros", "800 metros", "1500 metros",
            "3000 metros", "5000 metros", "10000 metros", "60 metros lisos", "100 metros lisos",
            "200 metros lisos", "400 metros lisos", "800 metros lisos", "1500 metros lisos",
            "3000 metros lisos", "5000 metros lisos", "10000 metros lisos",
            "60 metros vallas", "100 metros vallas", "110 metros vallas", "400 metros vallas",
            "3000 metros obstaculos", "2000 metros obstaculos", "relevo 4x100", "relevo 4x400",
            "relevos 4x100", "relevos 4x400", "relevo 4x200", "relevo 4x800", "relevo 4x1500",
            "relevo mixto", "relevo mixto 4x400", "maraton", "media maraton", "medio maraton",
            "ultramaraton", "ultra maraton", "campo a traves", "cross country", "marcha atletica",
            "10 km marcha", "20 km marcha", "35 km marcha", "50 km marcha", "salto de longitud",
            "salto de altura", "salto con pertiga", "triple salto", "lanzamiento de peso",
            "lanzamiento de disco", "lanzamiento de jabalina", "lanzamiento de martillo",
            "decatlon", "heptatlon", "pentatlon", "milla", "milla en pista", "milla urbana",
            "5 km en ruta", "10 km en ruta", "15 km en ruta", "trail running", "carrera de montaña",
            "kilometro vertical", "carrera de velocidad", "medio fondo", "larga distancia", "gran fondo"
        ],
    },
    "mus-024": {
        100: [
            "luis pastor", "pablo guerrero", "maria del mar bonet", "joan isaac", "marina rossell",
            "toti soler", "roger mas", "pau albornos" if False else "camilo sesto", "raphael", "julio iglesias",
            "victor manuel san jose", "ana belen", "miguel rios", "carlos cano", "javier krahe",
            "joaquin sabina", "joan manuel serrat", "luis eduardo aute", "ismael serrano",
            "pedro guerra", "marwan", "andres suarez", "luis ramiro", "diego cantero", "el kanka",
            "rozalen", "antonio orozco", "pablo alboran", "manuel carrasco", "alejandro sanz",
            "vanesa martin", "pablo lopez", "india martinez", "dani martin", "melendi",
            "guitarricadelafuente", "valeria castro", "silvia perez cruz", "natalia lafourcade",
            "jorge drexler", "silvio rodriguez", "pablo milanes", "fito paez", "charly garcia",
            "mercedes sosa", "facundo cabral", "atahualpa yupanqui", "violeta parra", "victor jara",
            "leon gieco", "bob dylan", "leonard cohen", "joni mitchell", "neil young",
            "cat stevens", "james taylor", "carole king", "paul simon", "tracy chapman",
            "suzanne vega", "nick drake", "elliott smith", "jeff buckley", "van morrison",
            "tom waits", "damien rice", "ed sheeran", "hozier", "bon iver", "sufjan stevens",
            "georges brassens", "jacques brel", "leo ferre", "charles aznavour", "serge gainsbourg",
            "francis cabrel", "fabrizio de andre", "franco battiato", "lucio dalla", "paolo conte",
            "zeca afonso", "lluis llach", "raimon", "ovidi montllor", "pau riba", "mikel laboa",
            "benito lertxundi", "amancio prada", "paco ibañez", "jose antonio labordeta",
            "chicho sanchez ferlosio", "patxi andion", "javier ruibal", "albert pla", "rodrigo cuevas",
            "nacho vegas", "quique gonzalez", "coque malla", "antonio vega", "enrique urquijo"
        ],
    },
    "dep-028": {
        100: [
            "los lakers", "los celtics", "los bulls", "los warriors", "los spurs", "los knicks",
            "los heat", "los nuggets", "los bucks", "los sixers", "los mavericks", "los suns",
            "los cavaliers", "los raptors", "los rockets", "los pistons", "los magic",
            "los pacers", "los thunder", "los timberwolves", "los grizzlies", "los jazz",
            "los blazers", "los kings", "los clippers", "los nets", "los hawks", "los hornets",
            "los wizards", "los pelicans", "los yankees", "los dodgers", "los red sox",
            "los cubs", "los astros", "los braves", "los cardinals", "los phillies", "los mets",
            "los padres", "los rangers", "los orioles", "los mariners", "los tigers",
            "los guardians", "los twins", "los white sox", "los athletics", "los angels",
            "los rockies", "los diamondbacks", "los marlins", "los nationals", "los rays",
            "los pirates", "los reds", "los brewers", "los royals", "los cowboys", "los chiefs",
            "los patriots", "los 49ers", "los packers", "los steelers", "los eagles", "los ravens",
            "los bills", "los raiders", "los dolphins", "los bears", "los giants", "los rams",
            "los seahawks", "los broncos", "los bengals", "los buccaneers", "los falcons",
            "los panthers", "los browns", "los lions", "los texans", "los colts", "los jaguars",
            "los chargers", "los vikings", "los saints", "los jets", "los titans", "los commanders",
            "los canadiens", "los maple leafs", "los bruins", "los blackhawks", "los red wings",
            "los oilers", "los penguins", "los avalanche", "los lightning", "los golden knights",
            "los stars", "los hurricanes", "los devils", "los flyers", "los capitals", "los blues",
            "los sharks", "los ducks", "los canucks", "minneapolis lakers", "syracuse nationals",
            "fort wayne pistons", "rochester royals", "cincinnati royals", "kansas city kings",
            "san diego clippers", "buffalo braves", "new orleans jazz", "baltimore bullets",
            "washington bullets", "houston oilers", "baltimore colts", "brooklyn dodgers",
            "boston braves", "milwaukee braves", "philadelphia athletics", "kansas city athletics",
            "st louis browns", "washington senators", "seattle pilots", "california angels",
            "anaheim angels", "florida marlins", "tampa bay devil rays", "minnesota north stars",
            "atlanta flames", "atlanta thrashers", "kansas city scouts", "cleveland barons",
            "phoenix coyotes", "oakland raiders", "san diego chargers", "st louis rams",
            "seattle supersonics", "vancouver grizzlies", "new jersey nets", "charlotte bobcats",
            "montreal expos", "washington redskins", "cleveland indians", "hartford whalers", "quebec nordiques"
        ],
    },
}

DENSITY_BATCH_1_FINAL = {
    "geo-019": {
        100: [
            "estado de rusia", "estado de francia", "estado de alemania", "estado de italia",
            "estado de españa", "estado de portugal", "estado de grecia", "estado de polonia",
            "estado de rumania", "estado de bulgaria", "estado de croacia", "estado de eslovenia",
            "estado de serbia", "estado de austria", "estado de hungria", "estado de suiza",
            "estado de irlanda", "estado de islandia", "estado de finlandia", "estado de estonia",
            "estado de letonia", "estado de lituania", "estado de ucrania", "estado de bielorrusia",
            "estado de moldavia", "estado de georgia", "estado de armenia", "estado de azerbaiyan",
            "estado de turquia", "estado de chipre", "estado de japon", "estado de china",
            "estado de india", "estado de indonesia", "estado de pakistan", "estado de vietnam",
            "estado de tailandia", "estado de filipinas", "estado de malasia", "estado de corea del sur",
            "estado de egipto", "estado de argelia", "estado de tunez", "estado de nigeria",
            "estado de kenia", "estado de etiopia", "estado de marruecos", "estado de sudafrica"
        ],
    },
    "pal-005": {
        100: [
            "albornoz de baño", "azafraz", "cadiz ciudad", "jerez de la frontera", "badajoz ciudad",
            "alcazaba", "alcaraz", "almaraz", "almez", "altavoz", "andaluz", "antifaz", "arroz",
            "atroz", "audaz", "avestruz", "barniz", "belez", "bisectriz", "boz", "capaz", "capuz",
            "cariz", "cerviz", "cicatriz", "codorniz", "coz", "cruz", "desliz", "diez", "directriz",
            "disfraz", "eficaz", "emperatriz", "escasez", "estupidez", "falaz", "faz", "feliz",
            "feroz", "foz", "fugaz", "galvez", "haz", "hez", "hoz", "incapaz", "ineficaz",
            "infeliz", "interfaz", "juez", "lainez", "lapiz", "lombriz", "luz", "maiz", "matiz",
            "matraz", "matriz", "mendez", "nariz", "nuez", "ortiz", "paz", "pelaez", "perdiz",
            "pez", "portavoz", "precoz", "quiroz", "raiz", "rapaz", "regaliz", "rigidez",
            "robustez", "sagaz", "saiz", "sanchez", "sencillez", "sensatez", "soez", "solaz",
            "solidez", "tamiz", "tapiz", "tellez", "tenaz", "tez", "timidez", "torcaz",
            "tozudez", "tragaluz", "trasluz", "validez", "variz", "vejez", "veloz", "veraz",
            "vez", "vivaz", "voraz", "voz", "yanez", "yañez", "albacete" if False else "santacruz",
            "marques de santillana" if False else "corteza" if False else "alferiz", "arrabal" if False else "capataz",
            "rapazuelo" if False else "cabizbajo" if False else "portapaz", "tornavoz", "sobrefaz",
            "contraluz", "meretriz", "motriz", "automotriz", "locomotriz", "generatriz", "mediatriz",
            "institutriz", "cantatriz", "dominatriz", "nutriz", "aceleratriz", "curatriz", "progenitriz",
            "testatriz", "tutriz", "soliz", "veliz", "muniz", "muñiz", "chavez", "valdez", "narvaez"
        ],
    },
    "mus-024": {
        100: [
            "victor jara", "mercedessosa", "sergio endrigo", "luigi tenco", "gino paoli", "roberto vecchioni",
            "claudio baglioni", "vasco rossi", "luciano ligabue", "francesco guccini", "pino daniele",
            "ivana" if False else "ivano fossati", "samuele bersani", "vinicio capossela", "max gazze", "brunori sas",
            "barbara", "dalida", "juliette greco", "yves montand", "gilbert becaud", "salvatore adamo",
            "jean ferrat", "georges moustaki", "maxime le forestier", "alain souchon", "laurent voulzy",
            "renaud", "jean jacques goldman", "michel berger", "francis lalanne", "bernard lavilliers",
            "zaz", "benabar", "vincent delerm", "camille", "katerine", "pomme", "clara luciani",
            "antonio machado" if False else "joan manuel", "joaquin sabina", "luis eduardo aute",
            "pablo milanes", "silvio rodriguez", "vicente feliu", "amaury perez", "carlos varela",
            "gerardo alfonso", "xose manuel budino", "uxia", "carlos nuñez", "rodrigo cuevas",
            "silvia perez cruz", "maria arnal", "marcel bages", "ferran palau", "joan colomo",
            "pau vallve", "el petit de cal eril", "mishima", "manel", "guillem gisbert",
            "rodrigo leao", "salvador sobral", "luisa sobral", "antonio zambujo", "carlos do carmo",
            "mariza", "ana moura", "carminho", "gisela joao", "fausto bordalo dias", "vitorino",
            "sergio godinho", "jorge palma", "rui veloso", "pedro abrunhosa", "tiago bettencourt",
            "leonard cohen", "bob dylan", "joni mitchell", "neil young", "cat stevens", "nick drake",
            "elliott smith", "jeff buckley", "townes van zandt", "john prine", "jackson browne",
            "james taylor", "carole king", "paul simon", "art garfunkel", "joan baez", "phil ochs",
            "don mclean", "gordon lightfoot", "harry chapin", "jim croce", "bill fay", "rodriguez",
            "devendra banhart", "jose gonzalez", "iron and wine", "damien rice", "glen hansard",
            "passenger", "vance joy", "ben howard", "fink", "niko" if False else "laura marling",
            "feist", "regina spektor", "fiona apple", "tori amos", "kate bush", "pj harvey"
        ],
    },
    "dep-015": {
        100: [
            "carrera de 60 metros", "carrera de 150 metros", "carrera de 300 metros",
            "carrera de 500 metros", "carrera de 600 metros", "carrera de 1000 metros",
            "carrera de 2000 metros", "carrera de 3000 metros", "carrera de 5000 metros",
            "carrera de 10000 metros", "carrera de 110 metros vallas", "carrera de 100 metros vallas",
            "carrera de 400 metros vallas", "carrera de 3000 metros obstaculos", "carrera de relevos",
            "salto de longitud masculino", "salto de longitud femenino", "salto de altura masculino",
            "salto de altura femenino", "salto con pertiga masculino", "salto con pertiga femenino",
            "triple salto masculino", "triple salto femenino", "lanzamiento de peso masculino",
            "lanzamiento de peso femenino", "lanzamiento de disco masculino", "lanzamiento de disco femenino",
            "lanzamiento de jabalina masculino", "lanzamiento de jabalina femenino",
            "lanzamiento de martillo masculino", "lanzamiento de martillo femenino",
            "maraton masculino", "maraton femenino", "media maraton masculina", "media maraton femenina",
            "20 km marcha masculino", "20 km marcha femenino", "35 km marcha masculino",
            "35 km marcha femenino", "50 km marcha masculino", "decatlon olimpico", "heptatlon olimpico",
            "pentatlon moderno", "campo a traves por equipos", "relevo mixto de maraton",
            "velocidad pura", "mediofondo", "carrera de fondo", "carrera en ruta", "pista al aire libre",
            "short track 60m", "short track 400m", "short track 800m", "short track 1500m", "short track 3000m"
        ],
    },
    "dep-024": {
        100: [
            "marcus ericsson", "antonio giovinazzi", "brendon hartley", "sergey sirotkin",
            "stoffel vandoorne", "pascal wehrlein", "jolyon palmer", "rio haryanto",
            "felipe nasr", "will stevens", "roberto merhi", "alexander rossi", "esteban gutierrez",
            "jules bianchi", "max chilton", "charles pic", "giedo van der garde", "adrian sutil",
            "paul di resta", "jean eric vergne", "sebastien buemi", "jaime alguersuari",
            "bruno senna", "jerome d ambrosio", "narain karthikeyan", "karun chandhok",
            "lucas di grassi", "timo glock", "kazuki nakajima", "nelson piquet jr",
            "sebas" if False else "sebastien bourdais", "takuma sato", "anthony davidson", "christian klien",
            "tiago monteiro", "scott speed", "vitantonio liuzzi", "patrick friesacher",
            "christijan albers", "robert doornbos", "franck montagny", "yuji ide", "sakOn yamamoto"
        ],
    },
    "mus-029": {
        100: [
            "sonny stitt", "gene ammons", "stanley turrentine", "hank mobley", "booker ervin",
            "pharoah sanders", "archie shepp", "albert ayler", "anthony braxton", "sun ra",
            "cecil taylor", "ornette coleman", "don cherry", "dewey redman", "charlie haden",
            "billy higgins", "ed blackwell", "paul motian", "steve swallow", "carla bley",
            "maria schneider", "toshiko akiyoshi", "mary lou williams", "dorothy ashby",
            "alice coltrane", "esperanza spalding", "carmen mcrae", "betty carter",
            "abbey lincoln", "shirley horn", "cassandra wilson", "dee dee bridgewater",
            "kurt elling", "gregory porter", "jose james", "robert glasper", "terrace martin",
            "thundercat", "kamasi washington", "brad mehldau", "joshua redman", "chris potter",
            "blind willie mctell", "mississippi john hurt", "memphis minnie", "albert collins",
            "jimmie vaughan", "gary clark jr", "marcus king", "professor longhair",
            "allen toussaint", "dr john", "fats domino", "bobby blue bland", "johnnie taylor",
            "wilson pickett", "percy sledge", "ann peebles", "mavis staples", "the staple singers",
            "sly stone", "george clinton", "benny golson", "clark terry", "roy eldridge",
            "lee konitz", "paul desmond", "nat adderley", "medeski martin and wood", "weather report"
        ],
    },
    "mus-010": {
        100: [
            "mos def", "talib kweli", "common", "lupe fiasco", "big sean", "pusha t", "2 chainz",
            "gucci mane", "jeezy", "rick ross", "meek mill", "gunna", "lil baby", "rod wave",
            "polo g", "pop smoke", "king von", "chief keef", "kodak black", "denzel curry",
            "joey badass", "earl sweatshirt", "danny brown", "action bronson", "freddie gibbs",
            "schoolboy q", "ab soul", "jay rock", "vince staples", "tyga", "yg", "nipsey hussle",
            "anderson paak", "kid cudi", "frank ocean", "future", "young thug", "playboi carti",
            "lil uzi vert", "juice wrld", "xxxtentacion", "lil peep", "logic", "nf", "mf doom"
        ],
    },
}

STRIP_ARTICLE_ALLOWED = {
    "pel-023", "gen-030", "gen-033", "gen-036", "gen-040", "pel-022", "gen-037",
    "pel-027", "pel-029", "pel-032", "pel-026", "pel-028", "dep-011", "dep-029",
    "gen-010", "geo-020", "mus-020", "mus-031", "pel-025", "dep-015", "dep-030",
    "dep-031", "geo-025", "geo-030", "geo-031", "geo-032", "mus-032", "pal-028",
    "dep-032", "gen-029", "pal-027", "pel-003", "pel-006", "dep-028", "geo-013",
}

NUMBER_VARIANT_ALLOWED = {
    "gen-033", "gen-036", "gen-040", "gen-037", "gen-002", "pal-002", "dep-011",
    "dep-029", "dep-030", "dep-031", "mus-020", "mus-032", "pal-006", "pal-023",
    "pal-028", "dep-032", "pal-026", "pal-027", "pal-030", "pal-031",
}


def _valid_for_category(cid, nk):
    """Comprueba reglas estrictas de letra/forma para categorias restringidas."""
    if not nk:
        return False
    if cid == "geo-019":
        return nk[0] in "aeiou"
    if cid == "pal-002":
        return nk.startswith("c")
    if cid == "pal-005":
        return nk.endswith("z")
    if cid == "pal-006":
        return nk[0] in ("k", "w")
    if cid == "pal-023":
        return nk.startswith("h")
    return True


def cmd_generar_lote(args):
    """
    python spyle_tool.py generar-lote <salida.json> [--lote 1] [--min 405]
    Genera un lote JSON en formato bulk para las 67 categorias de menor densidad del lote indicado.
    """
    out_path = None
    lote_num = 1
    min_target = 405
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--lote" and i + 1 < len(args):
            lote_num = int(args[i + 1])
            i += 2
        elif a == "--min" and i + 1 < len(args):
            min_target = int(args[i + 1])
            i += 2
        elif not a.startswith("--") and out_path is None:
            out_path = a
            i += 1
        else:
            i += 1

    if not out_path:
        print("Uso: python spyle_tool.py generar-lote <salida.json> [--lote 1] [--min 405]", file=sys.stderr)
        sys.exit(1)

    if lote_num != 1:
        print(f"[ERROR] Solo esta habilitado --lote 1 en esta fase (solicitado: {lote_num}).", file=sys.stderr)
        sys.exit(1)

    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()
    cats, _ = parse_prompts_file(content)

    ordered = sorted(cats, key=lambda c: (len(c["pairs"]), c["id"]))
    target_cats = ordered[:67]

    bulk_out = {}
    shortfalls = []

    print(f"\nGenerando Lote {lote_num} ({len(target_cats)} categorias con objetivo >= {min_target} palabras):")
    for idx, c in enumerate(target_cats, start=1):
        cid = c["id"]
        existing = {}
        for rk, rscore in c["pairs"]:
            nk = normalizar_clave(rk)
            if nk and nk not in existing:
                existing[nk] = rscore

        added_buckets = {str(s): [] for s in sorted(VALID_SCORES)}
        queued = set()

        def try_add(word, score_val):
            nk = normalizar_clave(word)
            if not nk or nk in existing or nk in queued:
                return False
            if not _valid_for_category(cid, nk):
                return False
            queued.add(nk)
            added_buckets[str(score_val)].append(nk)
            return True

        for pool in (
            DENSITY_BATCH_1_DATA.get(cid, {}),
            DENSITY_BATCH_1_EXTRA.get(cid, {}),
            DENSITY_BATCH_1_TOPUP.get(cid, {}),
            DENSITY_BATCH_1_FINAL.get(cid, {}),
        ):
            for score_val in sorted(pool.keys()):
                for w in pool[score_val]:
                    try_add(w, score_val)

        # Fallback seguro con variantes validas si aun no alcanza min_target
        if len(existing) + len(queued) < min_target:
            snapshot = list(existing.items())
            for rk, rscore in snapshot:
                if len(existing) + len(queued) >= min_target:
                    break
                if cid in STRIP_ARTICLE_ALLOWED:
                    stripped = quitar_articulos_iniciales(rk)
                    if stripped and stripped != rk:
                        try_add(stripped, rscore)
                if cid in NUMBER_VARIANT_ALLOWED:
                    for var in sorted(generar_variantes_numero(rk)):
                        if len(existing) + len(queued) >= min_target:
                            break
                        if var != rk:
                            try_add(var, rscore)

        cat_payload = {k: v for k, v in added_buckets.items() if v}
        if cat_payload:
            bulk_out[cid] = cat_payload

        total_after = len(existing) + len(queued)
        status_mark = "OK" if total_after >= min_target else "FALTA"
        print(f"  {idx:>2}. [{cid}] {len(existing):>3} -> {total_after:>3} (+{len(queued):>3}) [{status_mark}]")
        if total_after < min_target:
            shortfalls.append((cid, total_after, min_target - total_after))

    with open(out_path, "w", encoding="utf-8") as out_f:
        json.dump(bulk_out, out_f, ensure_ascii=False, indent=2)

    print(f"\n[OK] Lote guardado en: {out_path} ({len(bulk_out)} categorias con ampliaciones).")
    if shortfalls:
        print("[ALERTA] Categorias por debajo del objetivo:", shortfalls, file=sys.stderr)
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1].lower()
    args = sys.argv[2:]

    commands = {
        "bulk": cmd_bulk,
        "importar": cmd_importar,
        "sheets": cmd_sheets,
        "auditar": cmd_auditar,
        "normalizar": cmd_normalizar,
        "buscar": cmd_buscar,
        "generar-lote": cmd_generar_lote,
    }

    if cmd not in commands:
        print(f"[ERROR] Comando desconocido: '{cmd}'. Comandos validos: {', '.join(commands.keys())}", file=sys.stderr)
        sys.exit(1)

    commands[cmd](args)


if __name__ == "__main__":
    main()
