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
    Convierte a minúsculas, colapsa espacios múltiples y elimina tildes vocálicas
    y diéresis (á, é, í, ó, ú, ü -> a, e, i, o, u), preservando siempre la letra ñ.
    """
    if texto is None:
        return ""
    s = str(texto).strip().lower()
    s = re.sub(r"\s+", " ", s)
    token_enie = "__spyle_enie__"
    s = s.replace("ñ", token_enie)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace(token_enie, "ñ")
    return s


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
    }

    if cmd not in commands:
        print(f"[ERROR] Comando desconocido: '{cmd}'. Comandos validos: {', '.join(commands.keys())}", file=sys.stderr)
        sys.exit(1)

    commands[cmd](args)


if __name__ == "__main__":
    main()
