# -*- coding: utf-8 -*-
"""
filtrar_diccionario.py
Script para procesar el diccionario oficial es_ES.dic y extraer conjuntos de palabras
filtradas para las categorías de Spyle.

Reglas aplicadas:
1. Lectura del archivo es_ES.dic descartando la cabecera numérica inicial.
2. Extracción de la palabra base antes de la barra '/' (reglas morfológicas Hunspell).
3. Normalización a minúsculas y validación de palabras compuestas únicamente por letras
   del abecedario en español (incluyendo vocales con o sin tilde, diéresis y la letra 'ñ').
4. Descarte de números, signos de puntuación o entradas no alfabéticas.
5. Extracción para las 6 categorías de Spyle especificadas:
   - panvocalicas.txt: Palabras que contengan las 5 vocales (a, e, i, o, u).
   - palindromos.txt: Palabras de 3 o más letras que se lean igual al revés.
   - terminan_z.txt: Palabras que terminen en la letra 'z'.
   - contienen_x.txt: Palabras que contengan la letra 'x'.
   - empiezan_k_w.txt: Palabras que empiecen por 'k' o 'w'.
   - empiezan_z.txt: Palabras que empiecen por 'z'.
6. Exportación de archivos en formato UTF-8, ordenados alfabéticamente y sin duplicados.
"""

import os
import re
import sys

def desacentuar(texto):
    """Elimina tildes de vocales y diéresis, conservando siempre la letra 'ñ'."""
    reemplazos = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u',
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u'
    }
    for orig, dest in reemplazos.items():
        texto = texto.replace(orig, dest)
    return texto

def procesar_diccionario(nombre_dic="es_ES.dic"):
    # Resolver ruta relativa al directorio donde reside este script o en el directorio de trabajo
    directorio_script = os.path.dirname(os.path.abspath(__file__))
    ruta_dic = os.path.join(directorio_script, nombre_dic)
    if not os.path.exists(ruta_dic):
        ruta_dic = os.path.abspath(nombre_dic)

    if not os.path.exists(ruta_dic):
        print(f"[ERROR] No se encontró el archivo '{nombre_dic}' en:\n  - {os.path.join(directorio_script, nombre_dic)}\n  - {os.path.abspath(nombre_dic)}")
        sys.exit(1)

    # Lectura del archivo es_ES.dic probando codificaciones compatibles
    lineas = None
    for codificacion in ['iso-8859-1', 'latin-1', 'windows-1252', 'utf-8']:
        try:
            with open(ruta_dic, 'r', encoding=codificacion) as f:
                lineas = f.readlines()
            print(f"[OK] Archivo '{nombre_dic}' cargado con codificación: {codificacion}")
            break
        except Exception:
            continue

    if lineas is None:
        print(f"[ERROR] No se pudo decodificar el archivo '{nombre_dic}'.")
        sys.exit(1)

    patron_letras = re.compile(r'^[a-záéíóúüñ]+$')
    palabras_unicas = set()

    for linea in lineas:
        linea = linea.strip()
        if not linea or linea.isdigit():
            continue

        # Extraer palabra base antes de la barra '/'
        base = linea.split('/')[0].strip().lower()

        # Descartar palabras que contengan caracteres no alfabéticos (guiones, números, etc.)
        if patron_letras.match(base):
            palabras_unicas.add(base)

    total_validas = len(palabras_unicas)
    print(f"[INFO] Palabras base únicas extraídas válidas: {total_validas}")

    # Definición de filtros para las categorías
    # 1. Panvocálicas: contienen las 5 vocales (a, e, i, o, u)
    panvocalicas = sorted([
        pal for pal in palabras_unicas
        if all(v in desacentuar(pal) for v in 'aeiou')
    ])

    # 2. Palíndromos: longitud >= 3 y se leen igual al derecho y al revés
    palindromos = sorted([
        pal for pal in palabras_unicas
        if len(pal) >= 3 and desacentuar(pal) == desacentuar(pal)[::-1]
    ])

    # 3. Terminan en Z
    terminan_z = sorted([
        pal for pal in palabras_unicas
        if desacentuar(pal).endswith('z')
    ])

    # 4. Contienen X
    contienen_x = sorted([
        pal for pal in palabras_unicas
        if 'x' in desacentuar(pal)
    ])

    # 5. Empiezan por K o W
    empiezan_k_w = sorted([
        pal for pal in palabras_unicas
        if desacentuar(pal).startswith(('k', 'w'))
    ])

    # 6. Empiezan por Z
    empiezan_z = sorted([
        pal for pal in palabras_unicas
        if desacentuar(pal).startswith('z')
    ])

    archivos_salida = {
        "panvocalicas.txt": panvocalicas,
        "palindromos.txt": palindromos,
        "terminan_z.txt": terminan_z,
        "contienen_x.txt": contienen_x,
        "empiezan_k_w.txt": empiezan_k_w,
        "empiezan_z.txt": empiezan_z
    }

    print("\n" + "=" * 50)
    print("RESUMEN DE EXTRACCIÓN POR CATEGORÍA:")
    print("=" * 50)

    for nombre_archivo, lista_palabras in archivos_salida.items():
        ruta_salida = os.path.join(directorio_script, nombre_archivo)
        with open(ruta_salida, 'w', encoding='utf-8') as f:
            for palabra in lista_palabras:
                f.write(palabra + '\n')
        print(f"  * {nombre_archivo:<18}: {len(lista_palabras):>5} palabras extraídas")

    print("=" * 50)
    print("[ÉXITO] Todos los archivos se han generado y guardado en UTF-8.")

if __name__ == "__main__":
    procesar_diccionario("es_ES.dic")
