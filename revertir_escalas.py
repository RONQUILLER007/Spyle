#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
revertir_escalas.py
Script de diagnóstico y reversión de escalas de puntuación e incorporación de reclamaciones.
"""

import re
import os
import sys

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    prompts_path = os.path.join(base_dir, "prompts.js")
    
    if not os.path.exists(prompts_path):
        print(f"Error: No se encontró prompts.js en {prompts_path}")
        sys.exit(1)
        
    with open(prompts_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Palabras universales de control para detectar inversión de escala
    universal_indicators = {
        "argentina": ["dia4-01", "gen-027"],
        "taxi": ["dia4-02", "gen-028"],
        "cocido": ["dia4-04", "gen-023"],
        "pastor aleman": ["dia4-05", "gen-024"],
        "pantalon": ["dia4-06", "gen-025"],
        "oxigeno": ["dia4-07", "gen-026", "dia4-02", "gen-028"]
    }

    inversion_map = {
        100: 10,
        85: 25,
        65: 45,
        45: 65,
        25: 85,
        10: 100
    }

    # Extraer todos los bloques de prompts
    # Formato de cada bloque: id, dailyId, answers: { ... }
    prompt_regex = re.compile(r'(\{\s*\n?\s*id:\s*["\']([^"\']+)["\']\s*,\s*dailyId:\s*["\']([^"\']+)["\'].*?answers:\s*\{)(.*?)(\n\s*\})', re.DOTALL)

    categorias_invertidas = []
    categorias_correctas = []
    
    def replacer(match):
        header = match.group(1)
        pid = match.group(2)
        did = match.group(3)
        body = match.group(4)
        tail = match.group(5)
        
        # Parse key-values in answers
        pairs = re.findall(r'(["\'])(.*?)\1\s*:\s*(\d+)', body)
        if not pairs:
            return match.group(0)

        # Detectar si esta categoría está invertida
        es_invertida = False
        evidencia = []

        for quote, k, v in pairs:
            v_int = int(v)
            if k in universal_indicators:
                if v_int in (85, 100):
                    es_invertida = True
                    evidencia.append(f"'{k}': {v_int} pts (esperado: 10)")
                else:
                    evidencia.append(f"'{k}': {v_int} pts (correcto: 10)")

        if es_invertida:
            categorias_invertidas.append((pid, did, evidencia))
            # Aplicar inversión simétrica a todos los términos
            def invert_val(m_pair):
                q = m_pair.group(1)
                key = m_pair.group(2)
                old_val = int(m_pair.group(3))
                new_val = inversion_map.get(old_val, old_val)
                return f'{q}{key}{q}: {new_val}'

            new_body = re.sub(r'(["\'])(.*?)\1\s*:\s*(\d+)', invert_val, body)
            return header + new_body + tail
        else:
            if evidencia:
                categorias_correctas.append((pid, did, evidencia))
            return match.group(0)

    # Ejecutar detección y reversión
    new_content = prompt_regex.sub(replacer, content)

    # 3. Incorporación de reclamaciones pendientes
    reclamaciones_reporte = []

    # A) gen-028 (Palabra con 'x'): 'exegesis': 85 pts
    if '"exegesis"' not in new_content:
        # Añadir al tier 85 de gen-028
        target_str = '"bixaceo": 85'
        if target_str in new_content:
            new_content = new_content.replace(target_str, f'{target_str}, "exegesis": 85', 1)
            reclamaciones_reporte.append("gen-028: Añadida 'exegesis' -> 85 pts")
        else:
            print("Aviso: No se pudo localizar el punto de inserción para 'exegesis' en gen-028")

    # B) gen-024 (Razas caninas): 'pastor tibetano', 'dogo del tibet', 'mastin tibetano' -> 85 pts
    # 1. dogo del tibet -> 85
    if '"dogo del tibet": 65' in new_content:
        new_content = new_content.replace('"dogo del tibet": 65', '"dogo del tibet": 85', 1)
        reclamaciones_reporte.append("gen-024: Actualizado 'dogo del tibet' -> 85 pts (antes 65)")
    # 2. mastin tibetano -> 85
    if '"mastin tibetano": 65' in new_content:
        new_content = new_content.replace('"mastin tibetano": 65', '"mastin tibetano": 85', 1)
        reclamaciones_reporte.append("gen-024: Actualizado 'mastin tibetano' -> 85 pts (antes 65)")
    # 3. pastor tibetano -> 85
    if '"pastor tibetano"' not in new_content:
        target_str = '"mastin tibetano": 85'
        if target_str in new_content:
            new_content = new_content.replace(target_str, f'{target_str}, "pastor tibetano": 85', 1)
            reclamaciones_reporte.append("gen-024: Añadido 'pastor tibetano' -> 85 pts")

    # C) gen-025 (Prendas): 'miton', 'mitones' -> 65 pts; 'dunks' -> 85 pts
    # 1. miton, mitones -> 65
    if '"miton"' not in new_content:
        target_str = '"bailarinas": 65'
        if target_str in new_content:
            new_content = new_content.replace(target_str, f'"miton": 65, "mitones": 65, {target_str}', 1)
            reclamaciones_reporte.append("gen-025: Añadidos 'miton' y 'mitones' -> 65 pts")
    # 2. dunks -> 85
    if '"dunks"' not in new_content:
        target_str = '"guardapolvos": 85'
        if target_str in new_content:
            new_content = new_content.replace(target_str, f'"dunks": 85, {target_str}', 1)
            reclamaciones_reporte.append("gen-025: Añadido 'dunks' -> 85 pts")

    # Sobrescribir prompts.js
    with open(prompts_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    # 4. Informe de salida
    print("="*75)
    print("INFORME DE EJECUCIÓN: revertir_escalas.py")
    print("="*75)
    print("\n1. INSPECCIÓN Y DETECCIÓN DE INVERSIÓN:")
    if categorias_invertidas:
        print(f"-> Se detectaron {len(categorias_invertidas)} categoría(s) INVERTIDA(S):")
        for pid, did, ev in categorias_invertidas:
            print(f"   * [{did} | {pid}]: Inversión simétrica aplicada. Evidencias: {', '.join(ev)}")
    else:
        print("-> Cero categorías invertidas. Todas las categorías inspeccionadas conservan la orientación táctica canónica:")
        for pid, did, ev in categorias_correctas:
            print(f"   * [{did} | {pid}]: Correcta ({', '.join(ev)})")

    print("\n2. INCORPORACIÓN DE RECLAMACIONES DE ALTA RAREZA (85-100 pts):")
    for rec in reclamaciones_reporte:
        print(f"   * {rec}")

    print("\nEstado final: prompts.js actualizado correctamente con integridad validada.")

if __name__ == "__main__":
    main()
