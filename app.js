(() => {
  "use strict";

  const APP_VERSION = "loquendo-studio-v2.1.0";
  const BUILD_ID = "2026-01-17";

  if (window.__LOQUENDO_STUDIO_LOADED__?.tag === `${APP_VERSION}:${BUILD_ID}`) return;
  window.__LOQUENDO_STUDIO_LOADED__ = { tag: `${APP_VERSION}:${BUILD_ID}` };

  const $ = (id) => document.getElementById(id);

  const el = {
    btnInstall: $("btnInstall"),
    btnUpdateSW: $("btnUpdateSW"),

    inpTitle: $("inpTitle"),
    txtScript: $("txtScript"),
    btnAuto: $("btnAuto"),

    selVoice: $("selVoice"),
    selLang: $("selLang"),
    rngRate: $("rngRate"),
    rngPitch: $("rngPitch"),
    rngVol: $("rngVol"),
    lblRate: $("lblRate"),
    lblPitch: $("lblPitch"),
    lblVol: $("lblVol"),

    btnSpeak: $("btnSpeak"),
    btnStopSpeak: $("btnStopSpeak"),
    btnRecordSpeak: $("btnRecordSpeak"),

    fileAudio: $("fileAudio"),
    btnClearAudio: $("btnClearAudio"),
    audioPlayer: $("audioPlayer"),
    audioMeta: $("audioMeta"),
    lnkDownloadAudio: $("lnkDownloadAudio"),
    btnSaveAudio: $("btnSaveAudio"),
    btnExportWav: $("btnExportWav"),
    btnApplyFx: $("btnApplyFx"),
    btnResetFx: $("btnResetFx"),

    selFx: $("selFx"),
    chkFxOn: $("chkFxOn"),
    rngFxDrive: $("rngFxDrive"),
    rngFxClarity: $("rngFxClarity"),
    rngFxReverb: $("rngFxReverb"),
    rngFxBass: $("rngFxBass"),
    rngFxAir: $("rngFxAir"),
    rngFxComp: $("rngFxComp"),
    lblFxDrive: $("lblFxDrive"),
    lblFxClarity: $("lblFxClarity"),
    lblFxReverb: $("lblFxReverb"),
    lblFxBass: $("lblFxBass"),
    lblFxAir: $("lblFxAir"),
    lblFxComp: $("lblFxComp"),
    voicesMeta: $("voicesMeta"),

    selFormat: $("selFormat"),
    selStyle: $("selStyle"),
    chkCaptions: $("chkCaptions"),
    chkWatermark: $("chkWatermark"),
    chkProAudio: $("chkProAudio"),
    chkMp4: $("chkMp4"),
    chkAutoDlAudio: $("chkAutoDlAudio"),
    chkAutoDlVideo: $("chkAutoDlVideo"),

    fileBg: $("fileBg"),
    inpAccent: $("inpAccent"),
    btnRender: $("btnRender"),
    btnOneClick: $("btnOneClick"),
    btnAbort: $("btnAbort"),

    cnv: $("cnv"),
    renderMeta: $("renderMeta"),
    vidOut: $("vidOut"),
    lnkDownload: $("lnkDownload"),
    btnShare: $("btnShare"),

    btnGenTweet: $("btnGenTweet"),
    btnCopyTweet: $("btnCopyTweet"),
    btnOpenX: $("btnOpenX"),
    txtTpl: $("txtTpl"),
    txtTweet: $("txtTweet"),
    tweetCount: $("tweetCount"),

    toast: $("toast"),
  };

  const state = {
    audioRawBlob: null,
    audioRawName: "",
    audioBlob: null,
    audioName: "",
    audioUrl: "",
    audioDuration: 0,

    bgImg: null,
    abort: false,

    lastVideoUrl: "",
    lastVideoBlob: null,
    lastVideoName: "",
  };

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.toast.hidden = true), 2400);
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function formatBytes(bytes) {
    const b = Number(bytes || 0);
    if (!b) return "0 B";
    const u = ["B", "KB", "MB", "GB"];
    const i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
    return `${(b / Math.pow(1024, i)).toFixed(i ? 2 : 0)} ${u[i]}`;
  }

  function normalizeText(raw) {
    let t = (raw || "").replace(/\r/g, "").trim();
    t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    t = t.replace(/[ \t]{2,}/g, " ");
    t = t.replace(/([,!?])([^\s])/g, "$1 $2");
    return t.trim();
  }

  function revokeUrl(url) {
    try { if (url) URL.revokeObjectURL(url); } catch {}
  }

  function insertAtCursor(textarea, text) {
    const s = textarea.selectionStart ?? textarea.value.length;
    const e = textarea.selectionEnd ?? textarea.value.length;
    const v = textarea.value;
    textarea.value = v.slice(0, s) + text + v.slice(e);
    textarea.selectionStart = textarea.selectionEnd = s + text.length;
    textarea.focus();
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-insert]");
    if (!b) return;
    insertAtCursor(el.txtScript, b.getAttribute("data-insert") || "");
  });

  function proPolish() {
    const title = (el.inpTitle.value || "").trim();
    let t = normalizeText(el.txtScript.value);
    if (!t) { toast("Escribe un guion primero."); return; }
    t = t
      .replace(/\b(URGENTE|ÚLTIMA HORA)\b/gi, "🚨 ÚLTIMA HORA")
      .replace(/\bEN VIVO\b/gi, "🔴#ENVIVO")
      .replace(/\n\n+/g, "\n\n");
    el.txtScript.value = t;
    if (!title) el.inpTitle.value = "🚨 ÚLTIMA HORA";
    toast("Limpieza pro aplicada.");
  }
  el.btnAuto.addEventListener("click", proPolish);

  function updateSliders() {
    el.lblRate.textContent = Number(el.rngRate.value).toFixed(2);
    el.lblPitch.textContent = Number(el.rngPitch.value).toFixed(2);
    el.lblVol.textContent = Number(el.rngVol.value).toFixed(2);
  }
  el.rngRate.addEventListener("input", updateSliders);
  el.rngPitch.addEventListener("input", updateSliders);
  el.rngVol.addEventListener("input", updateSliders);
  updateSliders();

  function updateFxUI() {
    el.lblFxDrive.textContent = Number(el.rngFxDrive.value).toFixed(2);
    el.lblFxClarity.textContent = Number(el.rngFxClarity.value).toFixed(2);
    el.lblFxReverb.textContent = Number(el.rngFxReverb.value).toFixed(2);
    el.lblFxBass.textContent = Number(el.rngFxBass.value).toFixed(2);
    el.lblFxAir.textContent = Number(el.rngFxAir.value).toFixed(2);
    el.lblFxComp.textContent = Number(el.rngFxComp.value).toFixed(2);
  }
  ["input","change"].forEach(evt => {
    el.rngFxDrive.addEventListener(evt, updateFxUI);
    el.rngFxClarity.addEventListener(evt, updateFxUI);
    el.rngFxReverb.addEventListener(evt, updateFxUI);
    el.rngFxBass.addEventListener(evt, updateFxUI);
    el.rngFxAir.addEventListener(evt, updateFxUI);
    el.rngFxComp.addEventListener(evt, updateFxUI);
  });
  updateFxUI();

  let voices = [];
  function refreshVoices() {
    try { voices = window.speechSynthesis?.getVoices?.() || []; } catch { voices = []; }
    el.selVoice.innerHTML = "";
    const langPref = (el.selLang.value || "auto").toLowerCase();

    const pickList = (langPref === "auto")
      ? voices
      : voices.filter(v => (v.lang || "").toLowerCase().startsWith(langPref));

    for (const v of pickList) {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang || "?"})${v.default ? " ★" : ""}`;
      el.selVoice.appendChild(opt);
    }

    const metaList = pickList.length ? pickList : voices;
    el.voicesMeta.textContent = `Voces: ${metaList.length} (motor del navegador / sistema)`;
    if (el.selVoice.options.length === 0 && voices.length) {
      for (const v of voices) {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang || "?"})${v.default ? " ★" : ""}`;
        el.selVoice.appendChild(opt);
      }
    }
  }

  el.selLang.addEventListener("change", refreshVoices);
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = () => refreshVoices();
    setTimeout(refreshVoices, 400);
    setTimeout(refreshVoices, 1200);
  } else {
    el.voicesMeta.textContent = "Voces: no disponible (tu navegador no soporta Web Speech)";
  }

  function pickVoice() {
    const name = el.selVoice.value;
    return voices.find(v => v.name === name) || voices.find(v => v.default) || voices[0] || null;
  }

  function getSegments(text) {
    const t = normalizeText(text);
    if (!t) return [];
    const out = [];
    const re = /\[PAUSA=(\d+)\]/ig;
    let last = 0;
    let m;
    while ((m = re.exec(t)) !== null) {
      const before = t.slice(last, m.index).trim();
      if (before) out.push({ type: "say", text: before });
      out.push({ type: "pause", ms: clamp(Number(m[1] || 0), 0, 20000) });
      last = re.lastIndex;
    }
    const rest = t.slice(last).trim();
    if (rest) out.push({ type: "say", text: rest });
    return out;
  }

  function stopSpeak() {
    try { window.speechSynthesis?.cancel?.(); } catch {}
  }
  el.btnStopSpeak.addEventListener("click", () => { stopSpeak(); toast("Parado."); });

  async function speakSegments(segs) {
    if (!("speechSynthesis" in window)) { toast("TTS no disponible."); return; }
    stopSpeak();

    const voice = pickVoice();
    const rate = Number(el.rngRate.value);
    const pitch = Number(el.rngPitch.value);
    const vol = Number(el.rngVol.value);

    for (const s of segs) {
      if (s.type === "pause") {
        await new Promise(r => setTimeout(r, s.ms));
        continue;
      }
      const u = new SpeechSynthesisUtterance(s.text);
      if (voice) u.voice = voice;
      u.rate = clamp(rate, 0.1, 2);
      u.pitch = clamp(pitch, 0, 2);
      u.volume = clamp(vol, 0, 1);

      await new Promise((resolve) => {
        u.onend = resolve;
        u.onerror = resolve;
        window.speechSynthesis.speak(u);
      });
    }
  }

  el.btnSpeak.addEventListener("click", async () => {
    const segs = getSegments(el.txtScript.value);
    if (!segs.length) { toast("Escribe un guion."); return; }
    toast("Reproduciendo…");
    await speakSegments(segs);
  });

  function enableAudioActions(enabled) {
    el.lnkDownloadAudio.setAttribute("aria-disabled", enabled ? "false" : "true");
    if (!enabled) {
      el.lnkDownloadAudio.removeAttribute("href");
      el.lnkDownloadAudio.href = "#";
    }
    el.btnSaveAudio.disabled = !enabled;
    el.btnExportWav.disabled = !enabled;
    el.btnApplyFx.disabled = !enabled;
    if (!enabled) el.btnResetFx.disabled = true;
  }

  async function getBlobDurationSeconds(blob) {
    try {
      const ab = await blob.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ctx.decodeAudioData(ab.slice(0));
      const d = buf.duration || 0;
      await ctx.close();
      return d;
    } catch {
      return 0;
    }
  }

  async function setAudioBlob(blob, filename, { asRaw = false } = {}) {
    if (asRaw) {
      state.audioRawBlob = blob;
      state.audioRawName = filename;
    }

    state.audioBlob = blob;
    state.audioName = filename;

    revokeUrl(state.audioUrl);
    state.audioUrl = URL.createObjectURL(blob);
    el.audioPlayer.src = state.audioUrl;

    el.lnkDownloadAudio.href = state.audioUrl;
    el.lnkDownloadAudio.download = filename;

    const d = await getBlobDurationSeconds(blob);
    state.audioDuration = d;

    el.audioMeta.textContent = `Audio: ${filename} · ${d ? d.toFixed(2) + "s" : "—"} · ${formatBytes(blob.size)} · (en memoria)`;

    enableAudioActions(true);

    if (el.chkAutoDlAudio.checked) {
      downloadBlob(blob, filename);
    }
  }

  function resetToRawAudio() {
    if (!state.audioRawBlob) return;
    setAudioBlob(state.audioRawBlob, state.audioRawName || "loquendo_raw.webm", { asRaw: true });
    el.btnResetFx.disabled = true;
    toast("Audio restaurado.");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function saveBlobWithPicker(blob, filename) {
    try {
      if (!window.showSaveFilePicker) {
        downloadBlob(blob, filename);
        toast("Tu navegador no soporta ‘Guardar…’. Descargado.");
        return;
      }
      const ext = (filename.split(".").pop() || "webm").toLowerCase();
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: "Audio",
          accept: { "audio/*": [`.${ext}`] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      toast("Guardado ✅");
    } catch {
      toast("Guardado cancelado.");
    }
  }

  el.lnkDownloadAudio.addEventListener("click", (e) => {
    const disabled = el.lnkDownloadAudio.getAttribute("aria-disabled") === "true";
    if (disabled) {
      e.preventDefault();
      toast("Primero graba o carga un audio.");
      return;
    }
  });

  el.btnSaveAudio.addEventListener("click", async () => {
    if (!state.audioBlob) { toast("No hay audio."); return; }
    await saveBlobWithPicker(state.audioBlob, state.audioName || "loquendo_audio.webm");
  });

  el.fileAudio.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await setAudioBlob(f, f.name, { asRaw: true });
    el.btnResetFx.disabled = true;
    toast("Audio cargado.");
    el.fileAudio.value = "";
  });

  el.btnClearAudio.addEventListener("click", () => {
    state.audioRawBlob = null;
    state.audioRawName = "";
    state.audioBlob = null;
    state.audioName = "";
    state.audioDuration = 0;

    revokeUrl(state.audioUrl);
    state.audioUrl = "";
    el.audioPlayer.removeAttribute("src");
    el.audioPlayer.load();
    el.audioMeta.textContent = "Audio: —";

    enableAudioActions(false);
    toast("Audio quitado.");
  });

  function audioBufferToWavBlob(buffer) {
    const numCh = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitsPerSample = 16;

    const samples = buffer.length;
    const blockAlign = numCh * bitsPerSample / 8;
    const dataSize = samples * blockAlign;

    const headerSize = 44;
    const ab = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(ab);

    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };

    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);

    const chData = [];
    for (let ch = 0; ch < numCh; ch++) chData.push(buffer.getChannelData(ch));

    let peak = 0;
    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numCh; ch++) peak = Math.max(peak, Math.abs(chData[ch][i]));
    }
    const norm = peak > 0 ? Math.min(1, 0.98 / peak) : 1;

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        let v = chData[ch][i] * norm;
        v = Math.max(-1, Math.min(1, v));
        view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
        offset += 2;
      }
    }
    return new Blob([ab], { type: "audio/wav" });
  }

  async function decodeToBuffer(blob) {
    const ab = await blob.arrayBuffer();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await ctx.decodeAudioData(ab.slice(0));
    await ctx.close();
    return buf;
  }

  function makeImpulse(ctx, seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return impulse;
  }

  function makeSaturationCurve(amount) {
    const k = clamp(amount, 0, 1) * 400;
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2 / n) - 1;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    return curve;
  }

  function fxPresetDefaults(name) {
    switch (name) {
      case "radio": return { hp: 240, lp: 3600, drive: 0.45, clarity: 0.25, bass: 0.00, air: 0.05, reverb: 0.00, comp: 0.85 };
      case "megaphone": return { hp: 320, lp: 4200, drive: 0.70, clarity: 0.30, bass: 0.00, air: 0.15, reverb: 0.05, comp: 0.90 };
      case "dark": return { hp: 80, lp: 9000, drive: 0.35, clarity: 0.15, bass: 0.65, air: 0.05, reverb: 0.10, comp: 0.65 };
      case "bright": return { hp: 120, lp: 14000, drive: 0.25, clarity: 0.55, bass: 0.10, air: 0.55, reverb: 0.08, comp: 0.55 };
      case "clean": return { hp: 90, lp: 15000, drive: 0.15, clarity: 0.55, bass: 0.25, air: 0.35, reverb: 0.06, comp: 0.55 };
      case "loquendo":
      default: return { hp: 95, lp: 12000, drive: 0.40, clarity: 0.45, bass: 0.30, air: 0.25, reverb: 0.10, comp: 0.70 };
    }
  }

  async function applyFxOffline(inputBlob) {
    const preset = el.selFx.value || "none";
    if (preset === "none") return null;

    const base = fxPresetDefaults(preset);

    const drive = clamp(Number(el.rngFxDrive.value), 0, 1);
    const clarity = clamp(Number(el.rngFxClarity.value), 0, 1);
    const reverb = clamp(Number(el.rngFxReverb.value), 0, 1);
    const bass = clamp(Number(el.rngFxBass.value), 0, 1);
    const air = clamp(Number(el.rngFxAir.value), 0, 1);
    const comp = clamp(Number(el.rngFxComp.value), 0, 1);

    const buf = await decodeToBuffer(inputBlob);
    const ch = buf.numberOfChannels;
    const rate = buf.sampleRate;
    const len = buf.length;

    const offline = new OfflineAudioContext(ch, len, rate);
    const src = offline.createBufferSource();
    src.buffer = buf;

    const inGain = offline.createGain();
    inGain.gain.value = 1 + (base.drive * 1.2) + (drive * 1.6);

    const hp = offline.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = clamp(base.hp, 40, 600);

    const lp = offline.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = clamp(base.lp, 1800, 16000);

    const lowShelf = offline.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 140;
    lowShelf.gain.value = (base.bass * 14) + (bass * 18);

    const presence = offline.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2400;
    presence.Q.value = 1.0;
    presence.gain.value = (base.clarity * 8) + (clarity * 12);

    const airShelf = offline.createBiquadFilter();
    airShelf.type = "highshelf";
    airShelf.frequency.value = 9000;
    airShelf.gain.value = (base.air * 8) + (air * 14);

    const shaper = offline.createWaveShaper();
    shaper.curve = makeSaturationCurve(clamp(base.drive * 0.55 + drive, 0, 1));
    shaper.oversample = "2x";

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -28 + (1 - comp) * 10;
    compressor.knee.value = 18;
    compressor.ratio.value = 3.6 + comp * 2.4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.16;

    const dryGain = offline.createGain();
    const wetGain = offline.createGain();
    const wet = clamp(base.reverb * 0.8 + reverb, 0, 1);
    dryGain.gain.value = 1 - wet;
    wetGain.gain.value = wet;

    const convolver = offline.createConvolver();
    convolver.buffer = makeImpulse(offline, 0.55 + wet * 1.25, 2.2 + wet * 2.5);

    const outGain = offline.createGain();
    outGain.gain.value = 0.92;

    src.connect(inGain);
    inGain.connect(hp);
    hp.connect(lowShelf);
    lowShelf.connect(presence);
    presence.connect(airShelf);
    airShelf.connect(shaper);
    shaper.connect(compressor);
    compressor.connect(lp);

    lp.connect(dryGain);
    lp.connect(convolver);
    convolver.connect(wetGain);

    const sum = offline.createGain();
    dryGain.connect(sum);
    wetGain.connect(sum);
    sum.connect(outGain);
    outGain.connect(offline.destination);

    src.start(0);
    const rendered = await offline.startRendering();
    return rendered;
  }

  el.btnApplyFx.addEventListener("click", async () => {
    if (!state.audioRawBlob) { toast("Primero graba o carga un audio."); return; }
    try {
      el.btnApplyFx.disabled = true;
      toast("Aplicando FX…");
      const rendered = await applyFxOffline(state.audioRawBlob);
      if (!rendered) { toast("FX: Ninguno."); return; }
      const wav = audioBufferToWavBlob(rendered);
      await setAudioBlob(wav, "loquendo_fx.wav", { asRaw: false });
      el.btnResetFx.disabled = false;
      toast("FX aplicado ✅");
    } catch {
      toast("No se pudo aplicar FX.");
    } finally {
      el.btnApplyFx.disabled = false;
    }
  });

  el.btnResetFx.addEventListener("click", resetToRawAudio);

  el.btnExportWav.addEventListener("click", async () => {
    if (!state.audioBlob) { toast("No hay audio."); return; }
    try {
      const buf = await decodeToBuffer(state.audioBlob);
      const wav = audioBufferToWavBlob(buf);
      downloadBlob(wav, "loquendo_export.wav");
      toast("WAV exportado.");
    } catch {
      toast("No se pudo exportar WAV.");
    }
  });

  async function recordTabAudioWhileSpeaking() {
    stopSpeak();
    state.abort = false;

    const segs = getSegments(el.txtScript.value);
    if (!segs.length) { toast("Escribe un guion primero."); return null; }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast("Tu navegador no soporta captura de audio de pestaña.");
      return null;
    }

    let displayStream = null;
    let recorder = null;
    const chunks = [];

    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      const at = displayStream.getAudioTracks();
      if (!at || !at.length) {
        displayStream.getTracks().forEach(t => t.stop());
        toast("No llegó audio. En el selector marca ‘Compartir audio’.");
        return null;
      }

      const audioStream = new MediaStream([at[0]]);
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      let mime = "";
      for (const m of mimeCandidates) {
        if (window.MediaRecorder?.isTypeSupported?.(m)) { mime = m; break; }
      }

      recorder = new MediaRecorder(audioStream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

      recorder.start(200);
      toast("Grabando…");

      await speakSegments(segs);

      try { recorder.requestData(); } catch {}
      await new Promise(r => setTimeout(r, 120));

      await new Promise((resolve) => {
        recorder.onstop = () => resolve();
        try { recorder.stop(); } catch { resolve(); }
      });

      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (!blob.size) {
        toast("La grabación salió vacía (¿Compartir audio?).");
        return null;
      }

      const ext = (blob.type.includes("ogg")) ? "ogg" : "webm";
      const name = `loquendo_audio.${ext}`;

      await setAudioBlob(blob, name, { asRaw: true });
      toast("Audio listo ✅");

      return { blob, filename: name };
    } catch {
      toast("No se pudo grabar.");
      return null;
    } finally {
      try { if (displayStream) displayStream.getTracks().forEach(t => t.stop()); } catch {}
      stopSpeak();
    }
  }

  el.btnRecordSpeak.addEventListener("click", async () => {
    await recordTabAudioWhileSpeaking();
  });

  function getRenderSize() {
    const fmt = el.selFormat.value;
    if (fmt === "16x9") return { w: 1920, h: 1080, ar: "16:9" };
    if (fmt === "1x1") return { w: 1080, h: 1080, ar: "1:1" };
    return { w: 1080, h: 1920, ar: "9:16" };
  }

  function stylePreset() {
    const s = el.selStyle.value;
    const accent = el.inpAccent.value || "#5cc8ff";
    if (s === "neon") return { accent, bgA:"#030512", bgB:"#081a2a", captionBg:"rgba(0,0,0,0.55)", captionStroke:"rgba(92,200,255,0.35)", titleColor:"rgba(255,255,255,0.94)" };
    if (s === "clean") return { accent, bgA:"#05070f", bgB:"#0b1020", captionBg:"rgba(255,255,255,0.10)", captionStroke:"rgba(255,255,255,0.18)", titleColor:"rgba(255,255,255,0.92)" };
    return { accent, bgA:"#060812", bgB:"#0b1020", captionBg:"rgba(0,0,0,0.55)", captionStroke:"rgba(255,255,255,0.16)", titleColor:"rgba(255,255,255,0.95)" };
  }

  function splitForCaptions(text) {
    const t = normalizeText(text);
    if (!t) return [];
    const raw = t
      .replace(/\[PAUSA=\d+\]/ig, " ")
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

    const chunks = [];
    for (const line of raw) {
      const parts = line.split(/(?<=[.!?…])\s+/).filter(Boolean);
      for (const p of parts) {
        const s = p.trim();
        if (!s) continue;
        if (s.length <= 56) chunks.push(s);
        else {
          const words = s.split(" ");
          let cur = "";
          for (const w of words) {
            const test = (cur ? cur + " " : "") + w;
            if (test.length > 56 && cur) { chunks.push(cur); cur = w; }
            else cur = test;
          }
          if (cur) chunks.push(cur);
        }
      }
    }
    return chunks.slice(0, 999);
  }

  function buildCaptionCues(script, totalDur) {
    const lines = splitForCaptions(script);
    if (!lines.length) return [];
    const dur = Math.max(1, totalDur || 1);
    const per = dur / lines.length;
    return lines.map((text, i) => ({ t0: i * per, t1: (i + 1) * per, text }));
  }

  async function loadBgImage(file) {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      try { URL.revokeObjectURL(url); } catch {}
    }
  }

  function drawFrame(ctx, W, H, t, cues, opts) {
    const st = stylePreset();

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, st.bgA);
    g.addColorStop(1, st.bgB);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (state.bgImg) {
      const img = state.bgImg;
      const s = Math.max(W / img.width, H / img.height);
      const iw = img.width * s, ih = img.height * s;
      const x = (W - iw) / 2, y = (H - ih) / 2;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(img, x, y, iw, ih);
      ctx.globalAlpha = 1;
    }

    const title = (el.inpTitle.value || "🚨 ÚLTIMA HORA").trim();
    ctx.save();
    ctx.font = `800 ${Math.floor(H * 0.040)}px ${getComputedStyle(document.documentElement).getPropertyValue("--sans") || "system-ui"}`;
    ctx.fillStyle = st.titleColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const pad = Math.floor(W * 0.04);
    ctx.fillText(title, pad, Math.floor(H * 0.045));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = st.accent;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(2, Math.floor(W * 0.004));
    ctx.beginPath();
    ctx.moveTo(pad, Math.floor(H * 0.11));
    ctx.lineTo(W - pad, Math.floor(H * 0.11));
    ctx.stroke();
    ctx.restore();

    if (opts.captions && cues?.length) {
      const cue = cues.find(c => t >= c.t0 && t < c.t1) || null;
      if (cue) {
        const boxW = Math.floor(W * 0.92);
        const boxH = Math.floor(H * 0.22);
        const x = Math.floor((W - boxW) / 2);
        const y = Math.floor(H * 0.72);

        ctx.save();
        ctx.fillStyle = st.captionBg;
        roundRect(ctx, x, y, boxW, boxH, Math.floor(H * 0.02));
        ctx.fill();

        ctx.strokeStyle = st.captionStroke;
        ctx.lineWidth = Math.max(2, Math.floor(W * 0.003));
        ctx.stroke();

        ctx.font = `900 ${Math.floor(H * 0.050)}px ${getComputedStyle(document.documentElement).getPropertyValue("--sans") || "system-ui"}`;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = (cue.text || "").toUpperCase();
        const words = text.split(" ");
        const lines = [];
        let cur = "";
        for (const w of words) {
          const test = (cur ? cur + " " : "") + w;
          if (ctx.measureText(test).width > boxW * 0.92 && cur) { lines.push(cur); cur = w; }
          else cur = test;
        }
        if (cur) lines.push(cur);

        const lh = Math.floor(H * 0.055);
        const cx = x + boxW / 2;
        const cy = y + boxH / 2;
        const startY = cy - (lines.length - 1) * lh / 2;
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], cx, startY + i * lh);

        ctx.restore();
      }
    }

    if (opts.watermark) {
      ctx.save();
      ctx.font = `700 ${Math.floor(H * 0.022)}px ${getComputedStyle(document.documentElement).getPropertyValue("--sans") || "system-ui"}`;
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("GlobalEyeTV", W - Math.floor(W * 0.04), H - Math.floor(H * 0.03));
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  async function convertWebmToMp4(webmBlob) {
    const CDN = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm";
    try {
      const { FFmpeg } = await import(`${CDN}/index.js`);
      const { fetchFile } = await import(`${CDN}/utils.js`);

      const ffmpeg = new FFmpeg();
      await ffmpeg.load();

      const inName = "in.webm";
      const outName = "out.mp4";
      await ffmpeg.writeFile(inName, await fetchFile(webmBlob));
      await ffmpeg.exec(["-i", inName, "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", outName]);
      const data = await ffmpeg.readFile(outName);
      const mp4 = new Blob([data.buffer], { type: "video/mp4" });
      return mp4;
    } catch {
      toast("No se pudo convertir a MP4 (FFmpeg wasm).");
      return webmBlob;
    }
  }

  function setVideoOutput(blob, filename) {
    revokeUrl(state.lastVideoUrl);
    const url = URL.createObjectURL(blob);
    state.lastVideoUrl = url;
    state.lastVideoBlob = blob;
    state.lastVideoName = filename;

    el.vidOut.src = url;
    el.lnkDownload.href = url;
    el.lnkDownload.download = filename;
    el.lnkDownload.setAttribute("aria-disabled", "false");

    const canShare = !!navigator.share && !!navigator.canShare;
    el.btnShare.disabled = !canShare;

    el.btnShare.onclick = async () => {
      try {
        const file = new File([blob], filename, { type: blob.type || "video/mp4" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
        } else {
          toast("Tu navegador no permite compartir aquí.");
        }
      } catch {}
    };
  }

  async function renderVideo() {
    state.abort = false;
    el.btnAbort.disabled = false;
    el.btnRender.disabled = true;
    el.btnOneClick.disabled = true;

    try {
      const script = normalizeText(el.txtScript.value);
      if (!script) { toast("Escribe un guion."); return null; }
      if (!state.audioBlob) { toast("Necesitas audio: grábalo o súbelo."); return null; }

      el.renderMeta.textContent = "Preparando…";

      const bgFile = el.fileBg.files?.[0] || null;
      state.bgImg = await loadBgImage(bgFile).catch(() => null);

      const { w: W, h: H } = getRenderSize();
      el.cnv.width = W;
      el.cnv.height = H;
      const ctx2d = el.cnv.getContext("2d", { alpha: false, desynchronized: true });

      let audioBlobToUse = state.audioBlob;
      if (el.chkFxOn.checked && state.audioRawBlob && el.selFx.value !== "none") {
        try {
          const rendered = await applyFxOffline(state.audioRawBlob);
          if (rendered) audioBlobToUse = audioBufferToWavBlob(rendered);
        } catch {}
      }

      const ab = await audioBlobToUse.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuf = await audioCtx.decodeAudioData(ab.slice(0));
      const totalDur = audioBuf.duration || 0;

      const cues = buildCaptionCues(script, totalDur || 1);

      const fps = 30;
      const canvasStream = el.cnv.captureStream(fps);
      const dest = audioCtx.createMediaStreamDestination();

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuf;

      let node = source;

      if (el.chkProAudio.checked) {
        const hp = audioCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 90;

        const presence = audioCtx.createBiquadFilter();
        presence.type = "peaking";
        presence.frequency.value = 2500;
        presence.Q.value = 1.0;
        presence.gain.value = 3.2;

        const comp = audioCtx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 18;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.004;
        comp.release.value = 0.18;

        node.connect(hp);
        hp.connect(presence);
        presence.connect(comp);
        node = comp;
      }

      node.connect(dest);

      const tracks = [
        ...canvasStream.getVideotracks?.() ?? [],
      ];

      // Compat: algunos navegadores no tienen getTracks en el typo anterior (depende del motor)
      const vTracks = canvasStream.getVideoTracks ? canvasStream.getVideoTracks() : [];
      const aTracks = dest.stream.getAudioTracks ? dest.stream.getAudioTracks() : [];
      const mixed = new MediaStream([...vTracks, ...aTracks]);

      const mimeCandidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
      ];
      let mime = "";
      for (const m of mimeCandidates) {
        if (window.MediaRecorder?.isTypeSupported?.(m)) { mime = m; break; }
      }

      const rec = new MediaRecorder(mixed, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

      const opts = {
        captions: !!el.chkCaptions.checked,
        watermark: !!el.chkWatermark.checked
      };

      let startCtxTime = 0;

      const drawLoop = () => {
        if (state.abort) return;
        const t = audioCtx.currentTime - startCtxTime;
        drawFrame(ctx2d, W, H, t, cues, opts);
        if (t < totalDur + 0.05) requestAnimationFrame(drawLoop);
      };

      el.renderMeta.textContent = `Generando… (${totalDur ? totalDur.toFixed(2) + "s" : "—"})`;

      rec.start(200);
      await audioCtx.resume();

      startCtxTime = audioCtx.currentTime + 0.08;
      source.start(startCtxTime);
      requestAnimationFrame(drawLoop);

      await new Promise((resolve) => {
        const ms = Math.max(500, Math.floor((totalDur + 0.25) * 1000));
        setTimeout(resolve, ms);
      });

      if (state.abort) {
        try { rec.stop(); } catch {}
        try { source.stop(); } catch {}
        toast("Cancelado.");
        return null;
      }

      await new Promise((resolve) => {
        rec.onstop = () => resolve();
        try { rec.stop(); } catch { resolve(); }
      });

      try { await audioCtx.close(); } catch {}

      const webm = new Blob(chunks, { type: rec.mimeType || "video/webm" });

      let finalBlob = webm;
      let finalExt = "webm";

      if (el.chkMp4.checked) {
        el.renderMeta.textContent = "Convirtiendo a MP4…";
        finalBlob = await convertWebmToMp4(webm);
        finalExt = finalBlob.type.includes("mp4") ? "mp4" : "webm";
      }

      const filename = `loquendo_video.${finalExt}`;
      setVideoOutput(finalBlob, filename);

      el.renderMeta.textContent = "Listo ✅";
      toast("Vídeo generado.");

      if (el.chkAutoDlVideo.checked) {
        downloadBlob(finalBlob, filename);
      }

      return { blob: finalBlob, filename };
    } catch {
      el.renderMeta.textContent = "Error al generar.";
      toast("Error generando el vídeo.");
      return null;
    } finally {
      el.btnAbort.disabled = true;
      el.btnRender.disabled = false;
      el.btnOneClick.disabled = false;
      el.fileBg.value = "";
    }
  }

  el.btnRender.addEventListener("click", renderVideo);

  el.btnAbort.addEventListener("click", () => {
    state.abort = true;
    el.btnAbort.disabled = true;
    toast("Cancelando…");
  });

  function genTweet() {
    const tpl = el.txtTpl.value || "";
    const title = (el.inpTitle.value || "🚨 ÚLTIMA HORA").trim();
    const script = normalizeText(el.txtScript.value || "");
    const resumen = script.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 2).join(" ");

    const out = tpl
      .replaceAll("{TITULO}", title)
      .replaceAll("{RESUMEN}", resumen || script.slice(0, 180))
      .replaceAll("{FUENTE}", "—")
      .replaceAll("{HASHTAGS}", "#ENVIVO #Noticias");

    el.txtTweet.value = out.trim();
    updateTweetCount();
  }

  function updateTweetCount() {
    const n = (el.txtTweet.value || "").length;
    el.tweetCount.textContent = `${n}/280`;
    el.tweetCount.style.color = n > 280 ? "var(--danger)" : "var(--muted)";
  }
  el.txtTweet.addEventListener("input", updateTweetCount);

  el.btnGenTweet.addEventListener("click", () => { genTweet(); toast("Texto listo."); });

  el.btnCopyTweet.addEventListener("click", async () => {
    const t = el.txtTweet.value || "";
    if (!t) { toast("No hay texto."); return; }
    try { await navigator.clipboard.writeText(t); toast("Copiado."); }
    catch { toast("No se pudo copiar."); }
  });

  el.btnOpenX.addEventListener("click", () => {
    if (!(el.txtTweet.value || "").trim()) genTweet();
    const text = encodeURIComponent(el.txtTweet.value || "");
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  });

  async function oneClickPipeline() {
    state.abort = false;

    if (!normalizeText(el.txtScript.value)) {
      toast("Escribe un guion.");
      return;
    }

    await recordTabAudioWhileSpeaking();
    if (!state.audioBlob) return;

    if (el.selFx.value !== "none" && state.audioRawBlob) {
      try { await new Promise(r => setTimeout(r, 50)); } catch {}
      try { await el.btnApplyFx.click(); } catch {}
    }

    await renderVideo();
    genTweet();

    try {
      await navigator.clipboard.writeText(el.txtTweet.value || "");
      toast("Tweet copiado + listo.");
    } catch {}

    const text = encodeURIComponent(el.txtTweet.value || "");
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  }

  el.btnOneClick.addEventListener("click", oneClickPipeline);

  enableAudioActions(false);

  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    el.btnInstall.hidden = false;
  });

  el.btnInstall.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch {}
    deferredPrompt = null;
    el.btnInstall.hidden = true;
  });

  async function regSW() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      const showUpdate = () => { el.btnUpdateSW.hidden = false; };

      if (reg.waiting) showUpdate();

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) showUpdate();
        });
      });

      el.btnUpdateSW.onclick = async () => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          toast("Actualizando…");
          setTimeout(() => location.reload(), 900);
        } else {
          toast("No hay actualización pendiente.");
        }
      };
    } catch {}
  }
  regSW();
})();
