# SPYLE // PROTOCOLO DE CONTRAINTELIGENCIA 🗂️

**Spyle** es un juego diario de palabras y agilidad mental ejecutado íntegramente en el navegador web, ambientado en una terminal táctica de contrainteligencia de la Guerra Fría inspirada estéticamente en *Final Sentence*.

El objetivo no es acertar lo primero que viene a la mente, sino calibrar la rareza cultural de la respuesta: las palabras obvias apenas aportan puntuación, mientras que el conocimiento de nicho, local y profundo permite infiltrar al agente con la máxima calificación.

---

## 🕹️ Mecánicas de Juego

- **Inmersión Diaria:** 7 expedientes (prompts) consecutivos por misión.
- **Reloj de Interrogatorio:** 25 segundos por categoría.
- **Intentos Múltiples:** Puedes probar términos de forma continua mientras el cronómetro esté activo.
- **Regla de Velocidad (Speed Bonus):** Si respondes un término válido en los primeros 6 segundos de la ronda, recibes un **+20% de bonificación** en los puntos de ese expediente. *Nota táctica: cualquier intento fallido dentro de la ronda anula de forma irreversible esta bonificación y consume el comodín.*
- **Comodín Operativo (Wildcard):** Dispones de 1 comodín por partida para intentar duplicar la puntuación de un expediente si alcanzas el rango de Infiltración Profunda (≥65 pts).
- **Escala de Evaluación y Sellos:**
  - ⬛ **0 pts** · Delatado / Misión Fallida (Término no catalogado o tiempo agotado).
  - 📰 **10 pts** · Registro Turístico (Respuesta masiva y evidente).
  - 🎭 **25 pts** · Tapadera Chapucera (El cliché rebuscado que todo el mundo intenta usar).
  - 🗂️ **45–50 pts** · Conocimiento de Campo (Creíble y natural).
  - 🕵️ **65–70 pts** · Infiltración Profunda (Nivel de residente veterano).
  - 🗝️ **85 pts** · Alto Secreto / Archivo Reservado (Microcultura o datos de archivo).
  - 🎖️ **100 pts** · Agente Durmiente Perfecto (Nicho extremo / 1 en un billón).

---

## 🛠️ Modos Disponibles

1. **Expediente Diario:** Los mismos 7 retos para toda la comunidad cada 24 horas sincronizados con la fecha del sistema.
2. **Entrenamiento Ilimitado:** Rondas infinitas no repetitivas seleccionadas aleatoriamente del catálogo.
3. **Dossieres de Campo Temáticos:** Capítulos clasificados por áreas de conocimiento (*Palabras y Lenguaje*, *Películas*, *Deportes*, *Geografía*, *Música*).
4. **Archivo Histórico de Misiones:** Calendario de registros pasados accesible de forma permanente mediante el descubrimiento de palabras clave (*Easter Eggs*) ocultas en los expedientes diarios.

---

## 📡 Crowdsourcing e Inteligencia Colectiva

Al concluir una misión, el sistema permite reportar términos reales que no hayan sido catalogados mediante un enlace directo a contrainteligencia, enviando la sugerencia a través de una API serverless en Google Apps Script para su posterior validación y adición al motor `prompts.js`.

---

## ⚖️ Reconocimiento, Autoría y Disclaimer

Este proyecto nace como una **adaptación cultural independiente al español y reimaginación temática** del juego de navegador original **Tinkle** ([tinkle.day](https://tinkle.day)), ideado y publicado por el usuario **u/Longjumping-Yam-6532** en la comunidad **r/wordgames** de Reddit.

- **Sin suplantación:** Este proyecto **no** pretende suplantar la identidad del autor original, ni adjudicarse la autoría de la mecánica central de puntuación inversa (*Pointless/Reverse-Trivia*).
- **Código propio:** Toda la arquitectura de este repositorio (interfaz de usuario táctica, motor de normalización en español con soporte para caracteres como la 'ñ', sistema de intentos en vivo, penalización de multiplicadores y panel de auditoría) ha sido desarrollada desde cero sin utilizar código propietario ni assets del juego original.
