(() => {
  "use strict";

  const $ = (q) => document.querySelector(q);

  const el = {
    btnInstall: $("#btnInstall"),
    btnUpdateSW: $("#btnUpdateSW"),

    inpTitle: $("#inpTitle"),
    txtScript: $("#txtScript"),
    btnAuto: $("#btnAuto"),

    selVoice: $("#selVoice"),
    selLang: $("#selLang"),
    rngRate: $("#rngRate"),
    rngPitch: $("#rngPitch"),
    rngVol: $("#rngVol"),
    lblRate: $("#lblRate"),
    lblPitch: $("#lblPitch"),
    lblVol: $("#lblVol"),

    btnSpeak: $("#btnSpeak"),
    btnStopSpeak: $("#btnStopSpeak"),
    btnRecordSpeak: $("#btnRecordSpeak"),

    fileAudio: $("#fileAudio"),
    btnClearAudio: $("#btnClearAudio"),
    audioPlayer: $("#audioPlayer"),
    audioMeta: $("#audioMeta"),

    selFormat: $("#selFormat"),
    selStyle: $("#selStyle"),
    chkCaptions: $("#chkCaptions"),
    chkWatermark: $("#chkWatermark"),
    chkProAudio: $("#chkProAudio"),
    chkMp4: $("#chkMp4"),
    fileBg: $("#fileBg"),
    inpAccent: $("#inpAccent"),
    btnRender: $("#btnRender"),
    btnAbort: $("#btnAbort"),
    cnv: $("#cnv"),
    renderMeta: $("#renderMeta"),
    vidOut: $("#vidOut"),
    lnkDownload: $("#lnkDownload"),
    btnShare: $("#btnShare"),

    btnGenTweet: $("#btnGenTweet"),
    btnCopyTweet: $("#btnCopyTweet"),
    btnOpenX: $("#btnOpenX"),
    txtTpl: $("#txtTpl"),
    txtTweet: $("#txtTweet"),
    tweetCount: $("#tweetCount"),

    toast: $("#toast")
  };

  const state = {
    voices: [],
    utterQueue: [],
    speaking: false,

    audioBlob: null,
    audioUrl: "",
    audioDuration: 0,

    bgImg: null,
    abort: false,

    lastVideoUrl: ""
  };

  function toast(msg){
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.hidden = true, 2200);
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function normalizeText(raw){
    let t = (raw || "").replace(/\r/g, "").trim();
    t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    t = t.replace(/[ \t]{2,}/g, " ");
    t = t.replace(/([,.!?])([^\s])/g, "$1 $2");
    return t.trim();
  }

  function proPolish(){
    const title = (el.inpTitle.value || "").trim();
    let t = normalizeText(el.txtScript.value);
    if(!t){
      toast("Escribe un guion primero.");
      return;
    }
    t = t
      .replace(/\b(URGENTE|ÚLTIMA HORA)\b/gi, "🚨 ÚLTIMA HORA")
      .replace(/\bEN VIVO\b/gi, "🔴#ENVIVO")
      .replace(/\n\n+/g, "\n\n");
    el.txtScript.value = t;
    if(!title) el.inpTitle.value = "🚨 ÚLTIMA HORA";
    toast("Limpieza pro aplicada.");
  }

  function insertAtCursor(textarea, text){
    const s = textarea.selectionStart ?? textarea.value.length;
    const e = textarea.selectionEnd ?? textarea.value.length;
    const v = textarea.value;
    textarea.value = v.slice(0, s) + text + v.slice(e);
    textarea.selectionStart = textarea.selectionEnd = s + text.length;
    textarea.focus();
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-insert]");
    if(!b) return;
    insertAtCursor(el.txtScript, b.getAttribute("data-insert"));
  });

  function updateSliders(){
    el.lblRate.textContent = Number(el.rngRate.value).toFixed(2);
    el.lblPitch.textContent = Number(el.rngPitch.value).toFixed(2);
    el.lblVol.textContent = Number(el.rngVol.value).toFixed(2);
  }
  el.rngRate.addEventListener("input", updateSliders);
  el.rngPitch.addEventListener("input", updateSliders);
  el.rngVol.addEventListener("input", updateSliders);
  updateSliders();

  function getSegments(text){
    const t = normalizeText(text);
    if(!t) return [];

    const lines = t.split("\n");
    const out = [];
    for(const line of lines){
      const L = line.trim();
      if(!L){
        out.push({type:"pause", ms: 250});
        continue;
      }
      const parts = L.split(/(\[PAUSA=\d+\])/i).filter(Boolean);
      for(const p of parts){
        const m = p.match(/^\[PAUSA=(\d+)\]$/i);
        if(m){
          out.push({type:"pause", ms: clamp(parseInt(m[1],10) || 0, 0, 5000)});
        } else {
          out.push({type:"say", text: p.trim()});
        }
      }
      out.push({type:"pause", ms: 120});
    }
    while(out.length && out[out.length-1].type==="pause") out.pop();
    return out;
  }

  function pickVoice(){
    const vid = el.selVoice.value;
    const v = state.voices.find(x => x.voiceURI === vid) || state.voices[0] || null;
    return v;
  }

  function filterByLang(voices){
    const sel = el.selLang.value;
    if(sel === "auto") return voices;
    return voices.filter(v => (v.lang || "").toLowerCase().startsWith(sel));
  }

  function refreshVoices(){
    let voices = window.speechSynthesis?.getVoices?.() || [];
    voices = filterByLang(voices);

    state.voices = voices;

    const cur = el.selVoice.value;
    el.selVoice.innerHTML = "";
    if(!voices.length){
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No hay voces disponibles";
      el.selVoice.appendChild(opt);
      return;
    }

    for(const v of voices){
      const opt = document.createElement("option");
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} · ${v.lang}${v.localService ? "" : " · online"}`;
      el.selVoice.appendChild(opt);
    }

    if(cur && voices.some(v => v.voiceURI === cur)) el.selVoice.value = cur;
  }

  el.selLang.addEventListener("change", refreshVoices);

  if("speechSynthesis" in window){
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = () => refreshVoices();
  } else {
    toast("Tu navegador no soporta Web Speech TTS.");
  }

  function stopSpeak(){
    try{ window.speechSynthesis.cancel(); } catch {}
    state.utterQueue = [];
    state.speaking = false;
  }

  function speakNow(){
    stopSpeak();
    const segs = getSegments(el.txtScript.value);
    if(!segs.length){
      toast("Escribe un guion para previsualizar.");
      return;
    }
    const voice = pickVoice();
    const rate = Number(el.rngRate.value);
    const pitch = Number(el.rngPitch.value);
    const vol = Number(el.rngVol.value);

    state.speaking = true;

    const queue = [];
    for(const s of segs){
      if(s.type === "pause"){
        queue.push({kind:"pause", ms: s.ms});
      } else {
        queue.push({kind:"say", text: s.text});
      }
    }
    state.utterQueue = queue;

    const step = () => {
      if(!state.utterQueue.length || state.abort){
        state.speaking = false;
        return;
      }
      const item = state.utterQueue.shift();
      if(item.kind === "pause"){
        setTimeout(step, item.ms);
        return;
      }
      const u = new SpeechSynthesisUtterance(item.text);
      if(voice) u.voice = voice;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = vol;
      u.onend = () => step();
      u.onerror = () => step();
      window.speechSynthesis.speak(u);
    };

    step();
  }

  el.btnSpeak.addEventListener("click", () => {
    state.abort = false;
    speakNow();
  });

  el.btnStopSpeak.addEventListener("click", () => {
    stopSpeak();
    toast("Parado.");
  });

  el.btnAuto.addEventListener("click", proPolish);

  async function recordTabAudioWhileSpeaking(){
    stopSpeak();
    state.abort = false;

    const segs = getSegments(el.txtScript.value);
    if(!segs.length){
      toast("Escribe un guion primero.");
      return;
    }

    if(!navigator.mediaDevices?.getDisplayMedia){
      toast("Tu navegador no soporta captura de audio de pestaña.");
      return;
    }

    let displayStream = null;
    let recorder = null;
    const chunks = [];

    try{
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const at = displayStream.getAudioTracks();
      if(!at || !at.length){
        displayStream.getTracks().forEach(t => t.stop());
        toast("No llegó audio. En el selector marca 'Compartir audio'.");
        return;
      }

      const audioStream = new MediaStream([at[0]]);
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus"
      ];
      let mime = "";
      for(const m of mimeCandidates){
        if(MediaRecorder.isTypeSupported(m)){ mime = m; break; }
      }

      recorder = new MediaRecorder(audioStream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => { if(e.data && e.data.size) chunks.push(e.data); };
      recorder.start(200);

      toast("Grabando… ahora habla la voz.");

      const voice = pickVoice();
      const rate = Number(el.rngRate.value);
      const pitch = Number(el.rngPitch.value);
      const vol = Number(el.rngVol.value);

      const queue = [];
      for(const s of segs){
        if(s.type === "pause") queue.push({kind:"pause", ms: s.ms});
        else queue.push({kind:"say", text: s.text});
      }

      state.speaking = true;
      state.utterQueue = queue;

      await new Promise((resolve) => {
        const step = () => {
          if(!state.utterQueue.length || state.abort){
            state.speaking = false;
            resolve();
            return;
          }
          const item = state.utterQueue.shift();
          if(item.kind === "pause"){
            setTimeout(step, item.ms);
            return;
          }
          const u = new SpeechSynthesisUtterance(item.text);
          if(voice) u.voice = voice;
          u.rate = rate;
          u.pitch = pitch;
          u.volume = vol;
          u.onend = () => step();
          u.onerror = () => step();
          window.speechSynthesis.speak(u);
        };
        step();
      });

      await new Promise((resolve) => {
        recorder.onstop = () => resolve();
        try{ recorder.stop(); } catch { resolve(); }
      });

      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      setAudioBlob(blob, "grabado_loquendo.webm");
      toast("Audio grabado.");
    } catch(e){
      toast("Grabación cancelada o fallida.");
    } finally{
      try{ if(displayStream) displayStream.getTracks().forEach(t => t.stop()); } catch {}
      stopSpeak();
    }
  }

  el.btnRecordSpeak.addEventListener("click", recordTabAudioWhileSpeaking);

  function revokeUrl(u){
    try{ if(u) URL.revokeObjectURL(u); } catch {}
  }

  async function getBlobDurationSeconds(blob){
    try{
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

  async function setAudioBlob(blob, filename){
    state.audioBlob = blob;
    revokeUrl(state.audioUrl);
    state.audioUrl = URL.createObjectURL(blob);
    el.audioPlayer.src = state.audioUrl;

    const d = await getBlobDurationSeconds(blob);
    state.audioDuration = d;
    el.audioMeta.textContent = `Audio: ${filename} · ${d ? d.toFixed(2) + "s" : "—"}`;
  }

  el.fileAudio.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    await setAudioBlob(f, f.name);
    toast("Audio cargado.");
    el.fileAudio.value = "";
  });

  el.btnClearAudio.addEventListener("click", () => {
    state.audioBlob = null;
    state.audioDuration = 0;
    revokeUrl(state.audioUrl);
    state.audioUrl = "";
    el.audioPlayer.removeAttribute("src");
    el.audioPlayer.load();
    el.audioMeta.textContent = "Audio: —";
    toast("Audio quitado.");
  });

  function getRenderSize(){
    const fmt = el.selFormat.value;
    if(fmt === "16x9") return { w: 1920, h: 1080, ar: "16:9" };
    if(fmt === "1x1") return { w: 1080, h: 1080, ar: "1:1" };
    return { w: 1080, h: 1920, ar: "9:16" };
  }

  function stylePreset(){
    const s = el.selStyle.value;
    const accent = el.inpAccent.value || "#5cc8ff";
    if(s === "neon"){
      return {
        accent,
        bgA: "#030512",
        bgB: "#081a2a",
        captionBg: "rgba(0,0,0,.55)",
        captionStroke: "rgba(92,200,255,.35)",
        titleColor: "rgba(255,255,255,.94)"
      };
    }
    if(s === "clean"){
      return {
        accent,
        bgA: "#05070f",
        bgB: "#0b1020",
        captionBg: "rgba(255,255,255,.10)",
        captionStroke: "rgba(255,255,255,.18)",
        titleColor: "rgba(255,255,255,.92)"
      };
    }
    return {
      accent,
      bgA: "#060812",
      bgB: "#0b1020",
      captionBg: "rgba(0,0,0,.55)",
      captionStroke: "rgba(255,255,255,.16)",
      titleColor: "rgba(255,255,255,.95)"
    };
  }

  function splitForCaptions(text){
    const t = normalizeText(text);
    if(!t) return [];
    const raw = t
      .replace(/\[PAUSA=\d+\]/ig, " ")
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

    const chunks = [];
    for(const line of raw){
      const parts = line.split(/(?<=[.!?…])\s+/).filter(Boolean);
      for(const p of parts){
        const s = p.trim();
        if(!s) continue;
        if(s.length <= 56) chunks.push(s);
        else{
          const words = s.split(" ");
          let cur = "";
          for(const w of words){
            if((cur + " " + w).trim().length > 56){
              chunks.push(cur.trim());
              cur = w;
            } else {
              cur = (cur + " " + w).trim();
            }
          }
          if(cur.trim()) chunks.push(cur.trim());
        }
      }
    }
    return chunks.slice(0, 240);
  }

  function buildCaptionCues(text, totalDur){
    const items = splitForCaptions(text);
    if(!items.length) return [];

    const weights = items.map(s => Math.max(1, s.split(/\s+/).length));
    const sum = weights.reduce((a,b) => a+b, 0);

    const cues = [];
    let t = 0;
    for(let i=0;i<items.length;i++){
      const frac = weights[i] / sum;
      const dur = Math.max(0.55, frac * totalDur);
      cues.push({ start:t, end:t+dur, text: items[i] });
      t += dur;
    }
    if(cues.length){
      const last = cues[cues.length-1];
      last.end = Math.max(last.end, totalDur);
    }
    return cues;
  }

  function roundRect(ctx, x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  async function loadBgImage(file){
    if(!file) return null;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    await new Promise((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("bg load fail"));
      img.src = url;
    });
    URL.revokeObjectURL(url);
    return img;
  }

  function drawFrame(ctx, W, H, t, cues, opts){
    const st = stylePreset();

    // bg
    if(state.bgImg){
      const img = state.bgImg;
      const ir = img.width / img.height;
      const r = W / H;
      let dw=W, dh=H, dx=0, dy=0;
      if(ir > r){
        dh = H;
        dw = H * ir;
        dx = (W - dw)/2;
      } else {
        dw = W;
        dh = W / ir;
        dy = (H - dh)/2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(0,0,W,H);
    } else {
      const g = ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0, st.bgA);
      g.addColorStop(1, st.bgB);
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);

      const glow = ctx.createRadialGradient(W*0.2, H*0.1, 0, W*0.2, H*0.1, Math.max(W,H));
      glow.addColorStop(0, st.accent + "22");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0,0,W,H);
    }

    // top title
    const title = (el.inpTitle.value || "").trim();
    if(title){
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(0, 0, W, Math.floor(H*0.12));
      ctx.fillStyle = st.titleColor;
      ctx.font = `800 ${Math.floor(H*0.035)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(title, Math.floor(W*0.06), Math.floor(H*0.06));
      ctx.restore();
    }

    // progress bar
    if(opts.totalDur > 0){
      const p = clamp(t / opts.totalDur, 0, 1);
      ctx.save();
      const barH = Math.max(6, Math.floor(H*0.006));
      const y = H - barH;
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.fillRect(0, y, W, barH);
      ctx.fillStyle = st.accent;
      ctx.fillRect(0, y, Math.floor(W*p), barH);
      ctx.restore();
    }

    // captions
    if(opts.captions && cues.length){
      const cue = cues.find(c => t >= c.start && t < c.end) || cues[cues.length-1];
      if(cue && cue.text){
        const padX = Math.floor(W*0.06);
        const boxW = W - padX*2;
        const boxH = Math.floor(H*0.16);
        const x = padX;
        const y = H - boxH - Math.floor(H*0.05);

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = st.captionBg;
        ctx.strokeStyle = st.captionStroke;
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, boxW, boxH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,.96)";
        ctx.font = `800 ${Math.floor(H*0.042)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const text = cue.text.toUpperCase();
        const cx = x + boxW/2;
        const cy = y + boxH/2;

        // wrap
        const words = text.split(" ");
        const lines = [];
        let cur = "";
        for(const w of words){
          const test = (cur ? cur + " " : "") + w;
          if(ctx.measureText(test).width > boxW*0.92 && cur){
            lines.push(cur);
            cur = w;
          } else cur = test;
        }
        if(cur) lines.push(cur);

        const lh = Math.floor(H*0.052);
        const startY = cy - (lines.length-1)*lh/2;
        for(let i=0;i<lines.length;i++){
          ctx.fillText(lines[i], cx, startY + i*lh);
        }

        ctx.restore();
      }
    }

    // watermark
    if(opts.watermark){
      ctx.save();
      ctx.font = `700 ${Math.floor(H*0.022)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("GlobalEyeTV", W - Math.floor(W*0.04), H - Math.floor(H*0.03));
      ctx.restore();
    }
  }

  async function renderVideo(){
    state.abort = false;
    el.btnAbort.disabled = false;
    el.btnRender.disabled = true;

    try{
      const script = normalizeText(el.txtScript.value);
      if(!script){
        toast("Escribe un guion.");
        return;
      }
      if(!state.audioBlob){
        toast("Necesitas audio: grábalo o súbelo.");
        return;
      }

      el.renderMeta.textContent = "Preparando…";

      const bgFile = el.fileBg.files?.[0] || null;
      state.bgImg = await loadBgImage(bgFile).catch(() => null);

      const {w:W,h:H} = getRenderSize();
      const cnv = el.cnv;
      cnv.width = W;
      cnv.height = H;

      const ctx2d = cnv.getContext("2d", { alpha:false, desynchronized:true });

      const ab = await state.audioBlob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      const audioBuf = await audioCtx.decodeAudioData(ab.slice(0));
      const totalDur = audioBuf.duration || 0;

      const cues = buildCaptionCues(script, totalDur || 1);

      const fps = 30;
      const canvasStream = cnv.captureStream(fps);

      const dest = audioCtx.createMediaStreamDestination();

      let source = audioCtx.createBufferSource();
      source.buffer = audioBuf;

      let node = source;

      if(el.chkProAudio.checked){
        const comp = audioCtx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 18;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.004;
        comp.release.value = 0.18;

        const hp = audioCtx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 80;

        const presence = audioCtx.createBiquadFilter();
        presence.type = "peaking";
        presence.frequency.value = 3100;
        presence.Q.value = 0.9;
        presence.gain.value = 3.0;

        node.connect(hp);
        hp.connect(presence);
        presence.connect(comp);
        comp.connect(dest);
      } else {
        node.connect(dest);
      }

      // monitor (opcional): lo conecto suave al output para que se escuche al generar
      try{
        const gain = audioCtx.createGain();
        gain.gain.value = 0.5;
        dest.connect(gain);
        gain.connect(audioCtx.destination);
      } catch {}

      const mixed = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const mimeCandidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
      ];
      let mime = "";
      for(const m of mimeCandidates){
        if(MediaRecorder.isTypeSupported(m)){ mime = m; break; }
      }

      const rec = new MediaRecorder(mixed, mime ? { mimeType: mime, videoBitsPerSecond: 6_000_000 } : { videoBitsPerSecond: 6_000_000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if(e.data && e.data.size) chunks.push(e.data); };

      let startCtxTime = 0;
      const opts = {
        captions: !!el.chkCaptions.checked,
        watermark: !!el.chkWatermark.checked,
        totalDur
      };

      const drawLoop = () => {
        if(state.abort) return;
        const t = audioCtx.currentTime - startCtxTime;
        drawFrame(ctx2d, W, H, t, cues, opts);
        if(t < totalDur + 0.05){
          requestAnimationFrame(drawLoop);
        }
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

      if(state.abort){
        try{ rec.stop(); } catch {}
        try{ source.stop(); } catch {}
        toast("Cancelado.");
        return;
      }

      await new Promise((resolve) => {
        rec.onstop = () => resolve();
        try{ rec.stop(); } catch { resolve(); }
      });

      try{ await audioCtx.close(); } catch {}

      const webm = new Blob(chunks, { type: rec.mimeType || "video/webm" });

      let finalBlob = webm;
      let finalExt = "webm";
      if(el.chkMp4.checked){
        el.renderMeta.textContent = "Convirtiendo a MP4…";
        finalBlob = await convertWebmToMp4(webm);
        finalExt = "mp4";
      }

      setVideoOutput(finalBlob, `loquendo_video.${finalExt}`);
      el.renderMeta.textContent = "Listo ✅";
      toast("Vídeo generado.");
    } catch (e){
      el.renderMeta.textContent = "Error al generar.";
      toast("Error generando el vídeo.");
    } finally {
      el.btnAbort.disabled = true;
      el.btnRender.disabled = false;
      el.fileBg.value = "";
    }
  }

  el.btnRender.addEventListener("click", renderVideo);
  el.btnAbort.addEventListener("click", () => {
    state.abort = true;
    el.btnAbort.disabled = true;
    toast("Cancelando…");
  });

  function setVideoOutput(blob, filename){
    revokeUrl(state.lastVideoUrl);
    const url = URL.createObjectURL(blob);
    state.lastVideoUrl = url;

    el.vidOut.src = url;

    el.lnkDownload.href = url;
    el.lnkDownload.download = filename;
    el.lnkDownload.setAttribute("aria-disabled", "false");

    const canShare = !!navigator.share && !!navigator.canShare;
    el.btnShare.disabled = !canShare;

    el.btnShare.onclick = async () => {
      try{
        const file = new File([blob], filename, { type: blob.type || "video/mp4" });
        if(navigator.canShare && navigator.canShare({ files: [file] })){
          await navigator.share({ files: [file], title: filename });
        } else {
          toast("Tu navegador no permite compartir archivo aquí.");
        }
      } catch {}
    };
  }

  async function convertWebmToMp4(webmBlob){
    // ffmpeg.wasm desde CDN (gratis). No API externa, solo librería client-side.
    const FF_URL = "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js";

    const { createFFmpeg, fetchFile } = await import(FF_URL);
    const ffmpeg = createFFmpeg({ log: false });

    if(!ffmpeg.isLoaded()) await ffmpeg.load();

    const inName = "in.webm";
    const outName = "out.mp4";

    ffmpeg.FS("writeFile", inName, await fetchFile(webmBlob));
    await ffmpeg.run(
      "-i", inName,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "160k",
      outName
    );

    const data = ffmpeg.FS("readFile", outName);
    try{
      ffmpeg.FS("unlink", inName);
      ffmpeg.FS("unlink", outName);
    } catch {}
    return new Blob([data.buffer], { type: "video/mp4" });
  }

  function genTweet(){
    const tpl = el.txtTpl.value || "";
    const title = (el.inpTitle.value || "").trim() || "🚨 ÚLTIMA HORA";
    const script = normalizeText(el.txtScript.value);
    const resumen = (script.split("\n").find(x => x.trim()) || script).slice(0, 160);

    const out = tpl
      .replaceAll("{TITULO}", title)
      .replaceAll("{RESUMEN}", resumen || "Actualización en desarrollo.")
      .replaceAll("{FUENTE}", "—")
      .replaceAll("{HASHTAGS}", "#ENVIVO #Noticias");

    el.txtTweet.value = out.trim();
    updateTweetCount();
    toast("Texto listo.");
  }

  function updateTweetCount(){
    const n = (el.txtTweet.value || "").length;
    el.tweetCount.textContent = `${n}/280`;
    el.tweetCount.style.color = n > 280 ? "var(--danger)" : "var(--muted)";
  }
  el.txtTweet.addEventListener("input", updateTweetCount);

  el.btnGenTweet.addEventListener("click", genTweet);

  el.btnCopyTweet.addEventListener("click", async () => {
    const t = el.txtTweet.value || "";
    if(!t){ toast("No hay texto."); return; }
    try{
      await navigator.clipboard.writeText(t);
      toast("Copiado.");
    } catch {
      toast("No se pudo copiar.");
    }
  });

  el.btnOpenX.addEventListener("click", () => {
    const t = el.txtTweet.value || "";
    if(!t){ genTweet(); }
    const text = encodeURIComponent(el.txtTweet.value || "");
    const url = `https://x.com/intent/tweet?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  // PWA install
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    el.btnInstall.hidden = false;
  });

  el.btnInstall.addEventListener("click", async () => {
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    try{ await deferredPrompt.userChoice; } catch {}
    deferredPrompt = null;
    el.btnInstall.hidden = true;
  });

  // SW
  async function regSW(){
    if(!("serviceWorker" in navigator)) return;
    try{
      const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      const showUpdate = () => { el.btnUpdateSW.hidden = false; };
      if(reg.waiting) showUpdate();
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if(!sw) return;
        sw.addEventListener("statechange", () => {
          if(sw.state === "installed" && navigator.serviceWorker.controller) showUpdate();
        });
      });
      el.btnUpdateSW.onclick = async () => {
        if(reg.waiting){
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
          toast("Actualizando… recarga en 1s.");
          setTimeout(() => location.reload(), 900);
        }
      };
    } catch {}
  }
  regSW();

})();
