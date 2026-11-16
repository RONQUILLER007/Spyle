#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spyle_tool.py — Herramienta CLI oficial y reutilizable para gestionar `prompts.js` en Spyle.

Protocolo de seguridad e integridad en cada escritura:
  1. Backup automático previo en `.backups/prompts_YYYYMMDD_HHMMSS.js` (mantiene últimas 10 copias).
  2. Normalización estricta de claves: minúsculas, colapso de espacios, eliminación de tildes
     vocálicas y diéresis (áéíóúü -> aeiouu) preservando intacta la letra "ñ".
  3. Validación estricta de puntuaciones contra la escala oficial: {10, 25, 45, 65, 85, 100}.
  4. Regla anti-duplicados por defecto (omite existentes salvo `--overwrite`).
  5. Verificación sintáctica tras escribir (`node -c prompts.js` cuando Node está disponible +
     validador estructural de llaves/comillas/pares en Python). Ante cualquier error, ejecuta
     rollback automático restaurando el backup y abortando con código 1.

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


def locate_prompts_js():
    """Localiza prompts.js desde el directorio actual o junto al script."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(os.getcwd(), "prompts.js"),
        os.path.join(os.getcwd(), "Spyle", "prompts.js"),
        os.path.join(script_dir, "prompts.js"),
        os.path.join(script_dir, "Spyle", "prompts.js"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return os.path.abspath(path)
    raise FileNotFoundError("No se encontro el archivo prompts.js en el proyecto.")


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


def find_matching_brace(text, open_idx):
    """Encuentra el índice de cierre '}' correspondiente al '{' en open_idx."""
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
        if ch == "{":
            depth += 1
        elif ch == "}":
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

    # Validacion sintactica con node -c si esta disponible
    node_bin = find_node_executable()
    if node_bin:
        res = subprocess.run([node_bin, "-c", prompts_path], capture_output=True, text=True)
        if res.returncode != 0:
            shutil.copy2(backup_path, prompts_path)
            print("[ERROR SINTACTICO] `node -c prompts.js` fallo. Rollback restaurado.", file=sys.stderr)
            if res.stderr:
                print(res.stderr.strip(), file=sys.stderr)
            sys.exit(1)
    else:
        print("[AVISO] Node.js no encontrado en el sistema; se ejecuta validacion sintactica estructural en Python.")

    ok, msg = validate_js_brackets(new_content)
    if not ok:
        shutil.copy2(backup_path, prompts_path)
        print(f"[ERROR ESTRUCTURAL] {msg}. Rollback restaurado.", file=sys.stderr)
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

    if not updates:
        print("[AVISO] No hay categorias validas que procesar.")
        return

    new_content, rows, modified_blocks = apply_category_updates(content, cats, updates, overwrite=overwrite)
    if modified_blocks > 0:
        guardar_prompts_seguro(prompts_path, new_content)
        print(f"[OK] Se actualizaron {modified_blocks} categoria(s) en prompts.js.")
    else:
        print("[INFO] Sin cambios nuevos en prompts.js (todas las claves validas ya existian).")

    print_summary_table(rows)

    if cleanup:
        try:
            os.remove(json_path)
            print(f"[CLEANUP] Archivo temporal eliminado: {json_path}")
        except OSError as exc:
            print(f"[AVISO] No se pudo eliminar {json_path}: {exc}")


def cmd_bulk(args):
    """python spyle_tool.py bulk <archivo.json> [--overwrite] [--cleanup]"""
    _run_json_import(args, "bulk", "{ categoria: { puntuacion: [palabras] } }")


def cmd_importar(args):
    """python spyle_tool.py importar <archivo.json> [--overwrite] [--cleanup]"""
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
    """python spyle_tool.py auditar [--incompletas] [--dias]"""
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

    for c in cats:
        pairs = c["pairs"]
        total = len(pairs)
        scores = {v for _, v in pairs}
        if total >= MIN_ACTIVE_WORDS:
            activas.append(c)
            missing = []
            if 10 not in scores:
                missing.append("10 pts")
            if 100 not in scores:
                missing.append("100 pts (Agente Durmiente)")
            if missing:
                alerts_balance.append((c["id"], c["texto"], missing))
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


def cmd_normalizar(_args):
    """python spyle_tool.py normalizar"""
    prompts_path = locate_prompts_js()
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    cats, _ = parse_prompts_file(content)
    replacements = []
    dirty_cats = 0
    merged_dups = 0
    normalized_keys = 0

    for c in cats:
        seen = {}
        ordered = []
        cat_changed = False
        for raw_k, score in c["pairs"]:
            nk = normalizar_clave(raw_k)
            if not nk:
                cat_changed = True
                continue
            if nk != raw_k:
                normalized_keys += 1
                cat_changed = True
            if nk in seen:
                merged_dups += 1
                cat_changed = True
            else:
                seen[nk] = score
                ordered.append(nk)

        if cat_changed:
            dirty_cats += 1
            new_pairs = [(k, seen[k]) for k in ordered]
            replacements.append((c["answers_start"], c["answers_end"], format_answers_block(new_pairs)))

    if not replacements:
        print("[OK] Todas las claves de prompts.js estan perfectamente normalizadas y sin duplicados ocultos.")
        return

    new_content = rebuild_prompts_content(content, replacements)
    guardar_prompts_seguro(prompts_path, new_content)
    print(f"[OK] Normalizacion completada en {dirty_cats} categoria(s):")
    print(f"  - Claves limpiadas (espacios/tildes/mayusculas): {normalized_keys}")
    print(f"  - Duplicados ocultos fusionados: {merged_dups}")


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
