/**
 * WORKSCLAPIUS - Módulo de Audiometría Tonal Interactiva (Web Audio API)
 */

class AudiometryTest {
  constructor(containerId, onCompleteCallback) {
    this.container = document.getElementById(containerId);
    this.onComplete = onCompleteCallback;

    this.audioCtx = null;
    this.frequencies = [500, 1000, 2000, 3000, 4000, 8000];
    this.currentEar = 'RIGHT'; // 'RIGHT' (Rojo/OD) then 'LEFT' (Azul/OI)
    this.freqIdx = 0;
    
    // Intensity simulation steps in dB HL
    this.currentDbLevel = 20; // Starts at safe audible threshold
    this.dbSteps = [15, 20, 25, 30, 40, 50];

    // Store measured thresholds
    this.thresholds = {
      right: {}, // freq: dB
      left: {}
    };

    // Initialize defaults
    this.frequencies.forEach(f => {
      this.thresholds.right[f] = 20;
      this.thresholds.left[f] = 20;
    });

    this.isPlaying = false;
    this.init();
  }

  init() {
    this.renderIntro();
  }

  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  renderIntro() {
    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 32px; max-width: 680px; margin: 0 auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🎧</div>
        <h2 style="font-size: 1.5rem; color: #fff; margin-bottom: 8px;">3. Examen de Audiometría Tonal Ocupacional</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px;">
          Esta prueba mide la capacidad auditiva en frecuencias vocales e industriales mediante la emisión de tonos puros binaurales.
        </p>

        <div class="glass-panel-elevated" style="padding: 20px; text-align: left; margin-bottom: 24px; border-left: 4px solid #10b981;">
          <h4 style="color: #34d399; margin-bottom: 8px; font-size: 0.95rem;">Requisitos obligatorios:</h4>
          <ul style="color: #cbd5e1; font-size: 0.88rem; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>Usa audífonos estéreo</strong> (auriculares o diademas). Los altavoces externos no son válidos para evaluación por oído separado.</li>
            <li>Ubícate en un entorno silencioso libre de ruido de fondo.</li>
            <li>Durante la prueba escucharás una secuencia de pitidos suaves (<em>"pi-pi-pi"</em>). En cuanto los percibas, presiona el botón de confirmación.</li>
          </ul>
        </div>

        <div style="margin-bottom: 24px;">
          <button id="btnCalibrateAudio" class="btn-secondary" style="padding: 10px 20px; font-size: 0.9rem;">
            🔊 Probar Tono de Calibración (1000 Hz)
          </button>
        </div>

        <button id="btnStartAudioExam" class="btn-primary" style="padding: 14px 36px; font-size: 1.05rem;">
          Comenzar Audiometría (Oído Derecho Primero) 🚀
        </button>
      </div>
    `;

    document.getElementById('btnCalibrateAudio').addEventListener('click', () => {
      this.ensureAudioContext();
      this.playBeepSequence(1000, 0, 0.08); // Center pan
    });

    document.getElementById('btnStartAudioExam').addEventListener('click', () => {
      this.ensureAudioContext();
      this.currentEar = 'RIGHT';
      this.freqIdx = 0;
      this.currentDbLevel = 20;
      this.renderTestInterface();
    });
  }

  playBeepSequence(frequency, panValue, gainAmplitude = 0.05) {
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, t);

    // Stereo Panning
    let panner = null;
    if (this.audioCtx.createStereoPanner) {
      panner = this.audioCtx.createStereoPanner();
      panner.pan.setValueAtTime(panValue, t);
      osc.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.audioCtx.destination);
    } else {
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
    }

    // 3 successive beeps (pi, pi, pi)
    gainNode.gain.setValueAtTime(0, t);
    
    // Beep 1
    gainNode.gain.linearRampToValueAtTime(gainAmplitude, t + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.20);

    // Beep 2
    gainNode.gain.linearRampToValueAtTime(gainAmplitude, t + 0.32);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.50);

    // Beep 3
    gainNode.gain.linearRampToValueAtTime(gainAmplitude, t + 0.62);
    gainNode.gain.linearRampToValueAtTime(0, t + 0.80);

    osc.start(t);
    osc.stop(t + 0.90);
  }

  renderTestInterface() {
    const isRight = (this.currentEar === 'RIGHT');
    const earTitle = isRight ? 'Oído Derecho (Lado Rojo - OD)' : 'Oído Izquierdo (Lado Azul - OI)';
    const earColor = isRight ? '#ef4444' : '#06b6d4';
    const currentFreq = this.frequencies[this.freqIdx];

    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 28px; max-width: 650px; margin: 0 auto; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 0.9rem; font-weight: 800; color: ${earColor}; display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${earColor};"></span>
            ${earTitle}
          </span>
          <span style="font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 4px 12px; border-radius: 12px; color: #94a3b8;">
            Frecuencia: ${currentFreq} Hz (${this.freqIdx + 1}/${this.frequencies.length})
          </span>
        </div>

        <p style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 20px;">
          Se emitirá un estímulo sonoro de prueba en tu <strong>${isRight ? 'oído derecho' : 'oído izquierdo'}</strong>.
        </p>

        <!-- Dynamic Sound Wave Indicator -->
        <div class="sound-wave-box sound-wave-active" id="soundWaveBox" style="margin-bottom: 24px;">
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
          <div class="sound-bar"></div>
        </div>

        <!-- Big Response Buttons -->
        <div style="display: flex; flex-direction: column; gap: 14px; max-width: 360px; margin: 0 auto 24px;">
          <button id="btnEmitTone" class="btn-secondary" style="padding: 12px; font-size: 0.95rem;">
            🔊 Reproducir Tono (${currentFreq} Hz)
          </button>
          
          <button id="btnHearYes" class="btn-primary btn-pulse" style="padding: 16px; font-size: 1.1rem; background: linear-gradient(135deg, #10b981 0%, #047857 100%);">
            👂 ¡Sí, escucho el pito!
          </button>

          <button id="btnHearNo" class="btn-secondary" style="padding: 12px; font-size: 0.9rem; opacity: 0.8;">
            ❌ No lo escucho (Aumentar volumen)
          </button>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted);">
          Umbral auditivo estimado en prueba: <strong>${this.currentDbLevel} dB HL</strong>
        </div>
      </div>
    `;

    // Automatically emit the tone when entering the step
    setTimeout(() => {
      this.emitCurrentTone();
    }, 400);

    document.getElementById('btnEmitTone').addEventListener('click', () => {
      this.emitCurrentTone();
    });

    document.getElementById('btnHearYes').addEventListener('click', () => {
      this.handleHearingResponse(true);
    });

    document.getElementById('btnHearNo').addEventListener('click', () => {
      this.handleHearingResponse(false);
    });
  }

  emitCurrentTone() {
    const pan = (this.currentEar === 'RIGHT') ? 1.0 : -1.0;
    const freq = this.frequencies[this.freqIdx];
    
    // Scale gain with dB level (logarithmic)
    const gainVal = Math.min(0.25, 0.002 * Math.pow(10, (this.currentDbLevel - 10) / 20));
    this.playBeepSequence(freq, pan, gainVal);

    // Visual wave glow
    const waveBox = document.getElementById('soundWaveBox');
    if (waveBox) {
      waveBox.classList.add('sound-wave-active');
      setTimeout(() => waveBox.classList.remove('sound-wave-active'), 1000);
    }
  }

  handleHearingResponse(perceived) {
    const freq = this.frequencies[this.freqIdx];

    if (perceived) {
      // Record threshold
      if (this.currentEar === 'RIGHT') {
        this.thresholds.right[freq] = this.currentDbLevel;
      } else {
        this.thresholds.left[freq] = this.currentDbLevel;
      }

      // Next frequency
      this.freqIdx++;
      this.currentDbLevel = 20; // reset for next freq

      if (this.freqIdx < this.frequencies.length) {
        this.renderTestInterface();
      } else {
        // Switch ears or complete
        if (this.currentEar === 'RIGHT') {
          this.currentEar = 'LEFT';
          this.freqIdx = 0;
          this.currentDbLevel = 20;
          this.renderEarTransition();
        } else {
          this.finishAudiometry();
        }
      }
    } else {
      // Increase dB level
      if (this.currentDbLevel < 55) {
        this.currentDbLevel += 10;
        this.renderTestInterface();
      } else {
        // Ceiling reached
        if (this.currentEar === 'RIGHT') {
          this.thresholds.right[freq] = 60;
        } else {
          this.thresholds.left[freq] = 60;
        }
        this.freqIdx++;
        this.currentDbLevel = 20;
        if (this.freqIdx < this.frequencies.length) {
          this.renderTestInterface();
        } else {
          if (this.currentEar === 'RIGHT') {
            this.currentEar = 'LEFT';
            this.freqIdx = 0;
            this.renderEarTransition();
          } else {
            this.finishAudiometry();
          }
        }
      }
    }
  }

  renderEarTransition() {
    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 32px; max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="font-size: 2.8rem; margin-bottom: 8px;">🔄</div>
        <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 10px;">Oído Derecho Finalizado</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px;">
          Ahora evaluaremos tu <strong>Oído Izquierdo (Lado Azul - OI)</strong>. Asegúrate de tener el auricular izquierdo bien posicionado.
        </p>
        <button id="btnStartLeftEar" class="btn-primary" style="padding: 14px 34px; font-size: 1rem; background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%);">
          Continuar con Oído Izquierdo 🎧
        </button>
      </div>
    `;

    document.getElementById('btnStartLeftEar').addEventListener('click', () => {
      this.renderTestInterface();
    });
  }

  finishAudiometry() {
    // Calculate Pure Tone Average (PTA) at 500, 1000, 2000, 4000 Hz
    const ptaRight = Math.round(
      (this.thresholds.right[500] + this.thresholds.right[1000] + this.thresholds.right[2000] + this.thresholds.right[4000]) / 4
    );
    const ptaLeft = Math.round(
      (this.thresholds.left[500] + this.thresholds.left[1000] + this.thresholds.left[2000] + this.thresholds.left[4000]) / 4
    );

    const rightDiagnosis = ptaRight <= 25 ? 'Audición Normal' : (ptaRight <= 40 ? 'Hipoacusia Leve' : 'Hipoacusia Moderada');
    const leftDiagnosis = ptaLeft <= 25 ? 'Audición Normal' : (ptaLeft <= 40 ? 'Hipoacusia Leve' : 'Hipoacusia Moderada');

    this.audiometryResults = {
      thresholds: this.thresholds,
      ptaRight,
      ptaLeft,
      rightDiagnosis,
      leftDiagnosis,
      frequencies: this.frequencies,
      audiogramImageBase64: null
    };

    this.renderAudiogramSummary();
  }

  renderAudiogramSummary() {
    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 30px; max-width: 720px; margin: 0 auto; text-align: center;">
        <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 4px;">Audiograma Clínico Ocupacional</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
          Curvas de respuesta auditiva por vía aérea en frecuencias estándar (ISO 8253-1).
        </p>

        <!-- Canvas for Audiogram -->
        <div class="audiogram-card" style="margin-bottom: 24px;">
          <canvas id="audiogramCanvas" width="560" height="300"></canvas>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; text-align: left;">
          <div class="glass-panel" style="padding: 16px; border-left: 4px solid #ef4444;">
            <div style="font-size: 0.8rem; color: #ef4444; font-weight: 700;">OÍDO DERECHO (OD)</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${this.audiometryResults.ptaRight} dB HL</div>
            <div style="font-size: 0.82rem; color: #94a3b8;">${this.audiometryResults.rightDiagnosis}</div>
          </div>
          <div class="glass-panel" style="padding: 16px; border-left: 4px solid #06b6d4;">
            <div style="font-size: 0.8rem; color: #06b6d4; font-weight: 700;">OÍDO IZQUIERDO (OI)</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${this.audiometryResults.ptaLeft} dB HL</div>
            <div style="font-size: 0.82rem; color: #94a3b8;">${this.audiometryResults.leftDiagnosis}</div>
          </div>
        </div>

        <button id="btnProceedToDiagnosis" class="btn-primary" style="padding: 14px 36px; font-size: 1rem;">
          Generar Dictamen Clínico IA & Aptitud Laboral 🤖🩺
        </button>
      </div>
    `;

    setTimeout(() => {
      this.drawAudiogram();
    }, 100);

    document.getElementById('btnProceedToDiagnosis').addEventListener('click', () => {
      if (typeof this.onComplete === 'function') {
        this.onComplete(this.audiometryResults);
      }
    });
  }

  drawAudiogram() {
    const canvas = document.getElementById('audiogramCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid coordinates
    const padLeft = 50;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 40;

    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Freq mapping (logarithmic scale)
    const freqs = [250, 500, 1000, 2000, 3000, 4000, 8000];
    const freqX = (f) => {
      const idx = freqs.indexOf(f);
      return padLeft + (idx / (freqs.length - 1)) * plotW;
    };

    // dB mapping (-10 to 90 dB, inverted)
    const dbMin = -10;
    const dbMax = 90;
    const dbY = (db) => {
      return padTop + ((db - dbMin) / (dbMax - dbMin)) * plotH;
    };

    // Normal zone fill (-10 to 25 dB HL)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(padLeft, dbY(-10), plotW, dbY(25) - dbY(-10));

    // Horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    for (let db = 0; db <= 80; db += 10) {
      const y = dbY(db);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(`${db} dB`, padLeft - 6, y + 3);
    }

    // Vertical grid lines
    ctx.textAlign = 'center';
    freqs.forEach(f => {
      const x = freqX(f);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, h - padBottom);
      ctx.stroke();
      ctx.fillText(`${f}`, x, h - padBottom + 16);
    });

    // Axis titles
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Outfit, sans-serif';
    ctx.fillText('Frecuencia (Hz)', padLeft + plotW / 2, h - 8);

    // Normal threshold threshold line (25 dB)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, dbY(25));
    ctx.lineTo(w - padRight, dbY(25));
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot Right Ear (Red, Circles O, Solid)
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let first = true;
    this.frequencies.forEach(f => {
      const val = this.thresholds.right[f] || 20;
      const x = freqX(f);
      const y = dbY(val);
      if (first) { ctx.moveTo(x, y); first = false; }
      else { ctx.lineTo(x, y); }
    });
    ctx.stroke();

    // Right ear circle markers
    this.frequencies.forEach(f => {
      const val = this.thresholds.right[f] || 20;
      const x = freqX(f);
      const y = dbY(val);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#050913';
      ctx.fill();
      ctx.stroke();
    });

    // Plot Left Ear (Cyan/Blue, Crosses X, Dashed)
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    first = true;
    this.frequencies.forEach(f => {
      const val = this.thresholds.left[f] || 20;
      const x = freqX(f);
      const y = dbY(val);
      if (first) { ctx.moveTo(x, y); first = false; }
      else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Left ear cross markers
    this.frequencies.forEach(f => {
      const val = this.thresholds.left[f] || 20;
      const x = freqX(f);
      const y = dbY(val);
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 4);
      ctx.lineTo(x + 4, y + 4);
      ctx.moveTo(x + 4, y - 4);
      ctx.lineTo(x - 4, y + 4);
      ctx.stroke();
    });

    // Save image Base64 for the PDF Certificate
    this.audiometryResults.audiogramImageBase64 = canvas.toDataURL('image/png');
  }
}

window.AudiometryTest = AudiometryTest;
