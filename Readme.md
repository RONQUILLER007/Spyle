# SPYLE // PROTOCOLO DE CONTRAINTELIGENCIA 🗂️

**Spyle** es un juego diario de palabras, agilidad mental y calibración cultural ejecutado íntegramente en el navegador web (arquitectura *offline-first* sin dependencias de backend de pago). Está ambientado en una terminal táctica de escucha e interrogatorio de la Guerra Fría, con una dirección de arte fría, oscura y burocrática inspirada estéticamente en *Final Sentence*.

La premisa operativa sitúa al jugador como instructor de inteligencia formando y evaluando a agentes durmientes antes de su despliegue en territorio hispanohablante. El objetivo no es acertar lo primero que viene a la mente, sino calibrar la profundidad y autenticidad del término: las opciones turísticas o evidentes apenas otorgan puntuación, los clichés pretenciosos delatan la tapadera, y solo el conocimiento de nicho, la jerga callejera y los registros locales profundos permiten infiltrar al agente con la máxima calificación.

## 🕹️ Mecánicas de Juego y Dinámica Operativa

* **Estructura de Misión:** 7 expedientes (prompts) consecutivos por inmersión.

* **Reloj de Interrogatorio:** 25 segundos por expediente.

* **Intentos Múltiples en Tiempo Real:** Si un término no está catalogado, el reloj continúa corriendo. El jugador puede seguir probando términos alternativos hasta que el tiempo expire o acierte uno válido.

* **Visor de Intentos Fallidos:** Los términos no reconocidos se listan en vivo debajo del campo de texto (`[✕ término]`) para evitar repeticiones en esa misma ronda.

* **Cláusula de Disparo Limpio / Penalización de Multiplicadores:**

  * **Speed Bonus (+20%):** Se otorga si se introduce una respuesta válida en los primeros 6 segundos de la ronda.

  * **Anulación Inmediata:** Si el primer intento en una ronda resulta fallido o no catalogado, la bonificación de velocidad queda **anulada irreversiblemente** para esa ronda.

  * **Comodín Operativo Quemado:** Si el jugador había armado el comodín (*Wildcard*) y falla el primer intento, el comodín se consume y se quema de inmediato por fallo de infiltración. Cualquier acierto posterior puntuará exclusivamente a valor base (1.0x).

* **Comodín Operativo (Wildcard):** 1 uso por misión (disponible en Modo Diario y Dossieres de Campo; deshabilitado en Modo Ilimitado). Permite intentar duplicar la puntuación si se alcanza el rango de Infiltración Profunda ($\ge 65\text{ pts}$).

* **Escala de Evaluación y Sellos Tácticos:**

  * ⬛ **0 pts** · Delatado / Misión Fallida (Término no catalogado o tiempo agotado).

  * 📰 **10 pts** · Registro Turístico (Respuesta evidente y masiva que cualquier forastero sabría).

  * 🎭 **25 pts** · Tapadera Chapucera / Gesto Delatador (*Too Clever*: el cliché rebuscado que levanta sospechas).

  * 🗂️ **45–50 pts** · Conocimiento de Campo (Creíble, fluido y natural en conversación habitual).

  * 🕵️ **65–70 pts** · Infiltración Profunda (Nivel de residente veterano).

  * 🗝️ **85 pts** · Alto Secreto / Archivo Reservado (Microcultura, marcas o datos de archivo).

  * 🎖️ **100 pts** · Agente Durmiente Perfecto (Nicho extremo / 1 en un billón).

## 🛠️ Modos de Juego y Navegación

1. **Expediente Diario:** Los mismos 7 retos para toda la comunidad cada 24 horas, sincronizados con la fecha del calendario y rotación de preguntas.

2. **Entrenamiento Ilimitado:** Rondas infinitas no repetitivas seleccionadas aleatoriamente del catálogo global de preguntas (con comodín deshabilitado para entrenamiento puro).

3. **Dossieres de Campo Temáticos:** Expedientes clasificados agrupados por áreas específicas del conocimiento:

   * *Palabras y Lenguaje*

   * *Películas y Cine*

   * *Deportes y Competición*

   * *Geografía y Territorio*

   * *Música y Acústica*

4. **Archivo Histórico de Misiones:** Registro cronológico de misiones pasadas para consultar expedientes y volver a jugar misiones anteriores del calendario.

5. **Protocolo de Despliegue Operativo:** Ventana de confirmación táctica previa a cualquier partida con el resumen de reglas y advertencias antes de iniciar el cronómetro.

6. **Briefing Inicial:** Al acceder por primera vez a la terminal, se despliega automáticamente la *Directiva de Operaciones // Briefing*. Puede reabrirse en cualquier momento mediante el botón `[ ? ]` de la cabecera. El botón de estado de cabecera (`// EN ESPERA DE INTERROGATORIO`) permite abortar la misión activa y regresar al Cuartel General.

## 🎖️ Cámara de Archivos Clasificados (Logros Operativos)

Sistema integrado de condecoraciones persistentes en `localStorage` con notificaciones tácticas en pantalla (*toasts*):

 1. **Doble Agente Durmiente:** Clava dos respuestas de 100 puntos en una misma misión.

 2. **Informe Sobresaliente:** Obtén 500 o más puntos en una sola misión.

 3. **Operativo Impecable:** Logra un pleno perfecto de 700 puntos base en las 7 rondas.

 4. **Gatillo Rápido:** Responde de forma válida en menos de 2,0 segundos en cualquier ronda.

 5. **Carrera de Espías:** Consigue la bonificación de velocidad (+20%) en las 7 rondas de una misión.

 6. **Sin Rastro:** Completa una misión de 7 rondas con un 100% de efectividad al primer intento (0 fallos).

 7. **Extracción In Extremis:** Acierta una palabra válida quedando menos de 1,0 segundo en el temporizador.

 8. **Infiltración Duplicada:** Activa el comodín y duplica con éxito una puntuación de $\ge 65\text{ pts}$.

 9. **Red Durmiente:** Acumula un mínimo de 2.000 puntos históricos totales en el expediente.

10. **Desclasificación Total:** Obtén acceso completo y permanente al Archivo Histórico de Misiones.

## 📊 Telemetría y Persistencia en Cabecera

* **Marcador Histórico Acumulado:** Insignia táctica en la barra superior que suma y preserva todos los puntos obtenidos en partidas diarias, ilimitadas y dossiers (`spyle_puntos_totales`), con animación de pulso tras cada cierre de sesión.

* **Monitor de Enlace / Cobertura:** Indicador en tiempo real del estado de red del dispositivo (`navigator.onLine`), alertando si la estación opera en modo autónomo local o enlazada para reportes.

## ⚙️ Motor de Normalización y Búsqueda Dual

Para garantizar una evaluación justa y tolerante a la ortografía digital y el habla real en español:

* **Tratamiento Estricto de la 'Ñ':** Limpieza sistemática de tildes vocálicas ($á, é, í, ó, ú, ü \to a, e, i, o, u$), garantizando que la letra **`ñ`** / **`Ñ`** jamás sea descompuesta o convertida en `n`.

* **Estrategia Dual (Espacios vs. Colapso):** Evaluación simultánea con espacios normalizados y en formato colapsado (ej. `half-life` $\to$ `half life` y `halflife`).

* **Fuzzy Matching:** Distancia Levenshtein con tolerancia de 1 carácter tipográfico para términos de 5 o más letras.

* **Ampliación Coloquial:** Diccionarios reforzados con jerga callejera, marcas de consumidor, acrónimos cotidianos y expresiones habladas.

## 📡 Pipeline de Crowdsourcing (Google Sheets + Apps Script)

Cuando un jugador introduce un término no reconocido que considera válido:

1. En la pantalla final de resultados, cada intento fallido dispone de un botón directo: `[ ✉️ Reclamar ]`.

2. El modal transmite la sugerencia a un webhook serverless en **Google Apps Script** mediante `fetch` con cabecera `text/plain` y modo `no-cors` para evitar bloqueos del navegador.

3. La hoja de Google Sheets registra automáticamente las columnas:

   * **Columna A:** Fecha y hora.

   * **Columna B:** Categoría / Expediente.

   * **Columna C:** Palabra sugerida.

   * **Columna D:** Puntos Asignados (calibrados manualmente por el equipo de inteligencia).

   * **Columna E:** Fórmula matricial automática (`ARRAYFORMULA`) que redacta la orden directa lista para procesar en IA con modelos ligeros:
     `En la categoría "[Categoría]" añade la palabra "[Palabra]" con [Puntos] puntos en prompts.js.`

## 🚀 Despliegue y Control de Caché

El proyecto está diseñado para ejecutarse de forma estática en **GitHub Pages** o **Cloudflare Pages**:

* **Cache-Busting:** Para forzar a los navegadores a recibir las ampliaciones del diccionario `prompts.js` sin requerir que los usuarios borren su historial, se emplean parámetros de versión en los recursos:

  ```html
  <link rel="stylesheet" href="style.css?v=1.0">
  <script src="prompts.js?v=1.0" charset="UTF-8"></script>
  <script src="app.js?v=1.0" charset="UTF-8"></script>
  ```

  Incrementar el sufijo `?v=X.X` en `index.html` despliega los cambios a toda la base de jugadores de manera inmediata.

## ⚖️ Reconocimiento, Autoría y Disclaimer

Este proyecto constituye una **adaptación cultural independiente al español y una reimaginación temática/narrativa** del concepto original creado en el juego de navegador **Tinkle** ([tinkle.day](https://tinkle.day)), ideado y publicado por el usuario **u/Longjumping-Yam-6532** en la comunidad **r/wordgames** de Reddit.

* **Sin suplantación:** Este proyecto **no** pretende suplantar la identidad del autor original, ni atribuirse la autoría de la mecánica conceptual de trivia inversa (*Reverse-Trivia / Pointless scoring*).

* **Código y Arquitectura Propios:** Toda la implementación técnica (interfaz gráfica de terminal de inteligencia, motor de normalización diacrítica con preservación de la `ñ`, penalizaciones por fallo de disparo, persistencia de telemetría y condecoraciones, e integración serverless con Google Sheets) ha sido desarrollada desde cero sin emplear código fuente propietario ni recursos gráficos de la obra de referencia.