# Loquendo Studio (PWA) — 100% Gratis + GitHub Pages + Sin APIs

Esta app genera narraciones tipo “loquendo” usando Web Speech (TTS) del navegador, graba el audio capturando el sonido de la pestaña, permite descargar el audio, aplicar efectos (FX) y renderizar un vídeo con subtítulos y watermark. También prepara el texto para publicar en X sin usar APIs.

## Flujo rápido (modo fácil)

1) Pega el guion en “Guion”.
2) Elige voz (Voz) + rate/pitch/volumen.
3) Pulsa **🚀 1-Click: Grabar→FX→Vídeo→X**
   - En el diálogo de captura: selecciona **esta pestaña** y activa **Compartir audio**.
4) Se genera el vídeo y te abre X con el tweet preparado.
   - Adjunta el vídeo manualmente (X no permite adjuntar desde enlace sin API).

## Descargar audio (loquendo completo)

- Tras grabar o cargar un audio:
  - **⬇ Descargar audio** descarga el audio actual (raw o con FX aplicado).
  - **Exportar WAV** saca WAV para edición (universal).

## FX (mejorar “loquendo”)

- El selector **FX** aplica procesado tipo:
  - Loquendo (clásico), Radio/AM, Megáfono, Oscuro/Grave, Brillante/Agudo, Limpio/Pro
- Controles: Drive / Claridad / Bajos / Air / Reverb / Compresión
- “Usar FX en vídeo” aplica FX automáticamente al render aunque estés usando el audio raw.

## “Más voces” (sin servicios externos)

La app SOLO puede usar las voces que aporte tu sistema/navegador (Web Speech).
Para tener más voces reales (gratis):
- Windows: instala voces adicionales (Idiomas -> Voz / Speech) y reinicia el navegador.
- Android: Ajustes -> Texto a voz -> Instalar voces.
- Prueba Edge/Chrome: a veces listan voces distintas según el motor del sistema.

## Notas

- La exportación de audio sin “captura” no es posible con Web Speech (no da el audio como archivo). Por eso grabamos el audio capturando la pestaña.
- MP4 se convierte con ffmpeg.wasm en el navegador (sin API, solo librería client-side). Puede consumir CPU.

## Deploy en GitHub Pages

Sube estos archivos a un repo, activa Pages y entra desde la URL del repo.
