/**
 * WORKSCLAPIUS - Módulo de Visiometría Digital Interactiva (Snellen & Ishihara)
 */

class VisiometryTest {
  constructor(containerId, onCompleteCallback) {
    this.container = document.getElementById(containerId);
    this.onComplete = onCompleteCallback;
    
    this.stages = ['intro', 'eye_right', 'eye_left', 'binocular', 'ishihara', 'summary'];
    this.currentStageIdx = 0;

    // Test parameters
    this.snellenLevels = [
      { label: '20/100', sizePx: 80, points: 20 },
      { label: '20/50',  sizePx: 48, points: 40 },
      { label: '20/30',  sizePx: 30, points: 70 },
      { label: '20/20',  sizePx: 18, points: 100 }
    ];

    this.currentLevelIdx = 0;
    this.currentDirection = 'RIGHT'; // UP, DOWN, LEFT, RIGHT
    this.results = {
      eyeRight: '20/20',
      eyeLeft: '20/20',
      binocular: '20/20',
      colorVision: 'Normal (Tricrómata)',
      usesCorrection: false
    };

    // Ishihara plates
    this.ishiharaPlates = [
      { plateId: 1, correct: '12', description: 'Placa de demostración universal' },
      { plateId: 2, correct: '74', description: 'Placa de confusión rojo-verde' },
      { plateId: 3, correct: '6',  description: 'Placa de discriminación de saturación' }
    ];
    this.currentIshiharaIdx = 0;
    this.ishiharaAnswers = [];

    this.init();
  }

  init() {
    this.renderIntro();
  }

  renderIntro() {
    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 32px; max-width: 680px; margin: 0 auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 12px;">👁️</div>
        <h2 style="font-size: 1.5rem; color: #fff; margin-bottom: 8px;">2. Examen de Visiometría Digital</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 24px;">
          Esta prueba evalúa tu <strong>Agudeza Visual (Escala de Snellen)</strong> y tu <strong>Percepción de Colores (Test de Ishihara)</strong>.
        </p>

        <div class="glass-panel-elevated" style="padding: 20px; text-align: left; margin-bottom: 24px; border-left: 4px solid #06b6d4;">
          <h4 style="color: #38bdf8; margin-bottom: 10px; font-size: 0.95rem;">Instrucciones para la prueba:</h4>
          <ul style="color: #cbd5e1; font-size: 0.88rem; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li>Ubícate a una distancia de aproximadamente <strong>50 centímetros</strong> de la pantalla.</li>
            <li>Primero evaluaremos tu <strong>Ojo Derecho</strong> (debes tapar suavemente tu ojo izquierdo con la palma de la mano, sin presionar).</li>
            <li>Luego evaluaremos tu <strong>Ojo Izquierdo</strong> y posteriormente <strong>Ambos Ojos</strong>.</li>
            <li>En cada paso verás la letra <strong>E</strong> orientada en una dirección. Debes pulsar el botón correspondiente hacia donde apuntan las patitas.</li>
          </ul>
        </div>

        <div style="margin-bottom: 24px;">
          <label style="display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; color: #e2e8f0; font-size: 0.9rem;">
            <input type="checkbox" id="usesGlassesCheck" style="width: 18px; height: 18px;">
            ¿Estás usando gafas / lentes de contacto durante esta prueba?
          </label>
        </div>

        <button id="btnStartVisiometry" class="btn-primary" style="padding: 14px 36px; font-size: 1.05rem;">
          Comenzar Test de Agudeza Visual 🚀
        </button>
      </div>
    `;

    document.getElementById('btnStartVisiometry').addEventListener('click', () => {
      this.results.usesCorrection = document.getElementById('usesGlassesCheck').checked;
      this.currentStageIdx = 1; // eye_right
      this.startEyeTest();
    });
  }

  startEyeTest() {
    this.currentLevelIdx = 0;
    this.renderSnellenStep();
  }

  renderSnellenStep() {
    const stage = this.stages[this.currentStageIdx];
    let title = 'Ojo Derecho (Tapa tu Ojo Izquierdo 👁️✋)';
    let badgeColor = '#10b981';

    if (stage === 'eye_left') {
      title = 'Ojo Izquierdo (Tapa tu Ojo Derecho ✋👁️)';
      badgeColor = '#06b6d4';
    } else if (stage === 'binocular') {
      title = 'Visión Binocular (Ambos Ojos Abiertos 👁️👁️)';
      badgeColor = '#6366f1';
    }

    // Generate random orientation: UP, DOWN, LEFT, RIGHT
    const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    this.currentDirection = dirs[Math.floor(Math.random() * dirs.length)];

    let rotationDeg = 0;
    if (this.currentDirection === 'RIGHT') rotationDeg = 0;
    if (this.currentDirection === 'DOWN') rotationDeg = 90;
    if (this.currentDirection === 'LEFT') rotationDeg = 180;
    if (this.currentDirection === 'UP') rotationDeg = 270;

    const level = this.snellenLevels[this.currentLevelIdx];

    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 28px; max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <span style="font-size: 0.85rem; font-weight: 700; color: ${badgeColor}; text-transform: uppercase;">
            ${title}
          </span>
          <span style="font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 12px; color: #94a3b8;">
            Nivel: ${level.label}
          </span>
        </div>

        <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 24px;">
          ¿Hacia qué dirección apuntan las patitas de la letra <strong>E</strong>?
        </p>

        <!-- Optotype Presentation Stage -->
        <div class="optotype-stage" style="margin-bottom: 30px;">
          <div class="optotype-letter" style="font-size: ${level.sizePx}px; transform: rotate(${rotationDeg}deg);">
            E
          </div>
        </div>

        <!-- Directional Controls -->
        <div style="display: grid; grid-template-columns: repeat(3, 80px); gap: 10px; justify-content: center; margin: 0 auto 24px;">
          <div></div>
          <button class="btn-secondary dir-btn" data-dir="UP" style="padding: 16px; font-size: 1.4rem;">⬆️</button>
          <div></div>
          <button class="btn-secondary dir-btn" data-dir="LEFT" style="padding: 16px; font-size: 1.4rem;">⬅️</button>
          <button class="btn-secondary dir-btn" data-dir="DOWN" style="padding: 16px; font-size: 1.4rem;">⬇️</button>
          <button class="btn-secondary dir-btn" data-dir="RIGHT" style="padding: 16px; font-size: 1.4rem;">➡️</button>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-muted);">
          También puedes usar las flechas del teclado de tu computadora.
        </div>
      </div>
    `;

    // Event listeners for buttons
    const buttons = this.container.querySelectorAll('.dir-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dir = btn.getAttribute('data-dir');
        this.handleSnellenAnswer(dir);
      });
    });

    // Keydown listener
    this.keyHandler = (e) => {
      if (e.key === 'ArrowUp') this.handleSnellenAnswer('UP');
      else if (e.key === 'ArrowDown') this.handleSnellenAnswer('DOWN');
      else if (e.key === 'ArrowLeft') this.handleSnellenAnswer('LEFT');
      else if (e.key === 'ArrowRight') this.handleSnellenAnswer('RIGHT');
    };
    window.addEventListener('keydown', this.keyHandler, { once: true });
  }

  handleSnellenAnswer(selectedDir) {
    window.removeEventListener('keydown', this.keyHandler);

    const isCorrect = (selectedDir === this.currentDirection);
    const stage = this.stages[this.currentStageIdx];

    if (isCorrect) {
      if (this.currentLevelIdx < this.snellenLevels.length - 1) {
        this.currentLevelIdx++;
        this.renderSnellenStep();
        return;
      } else {
        // Reached 20/20 with full success
        this.recordEyeResult(stage, '20/20');
      }
    } else {
      // Failed at this level, record previous or minimum
      const achieved = this.currentLevelIdx > 0 ? this.snellenLevels[this.currentLevelIdx - 1].label : '20/100';
      this.recordEyeResult(stage, achieved);
    }

    // Advance to next eye stage or Ishihara
    this.currentStageIdx++;
    if (this.currentStageIdx <= 3) {
      this.startEyeTest();
    } else {
      this.startIshiharaTest();
    }
  }

  recordEyeResult(stage, fraction) {
    if (stage === 'eye_right') this.results.eyeRight = fraction;
    if (stage === 'eye_left') this.results.eyeLeft = fraction;
    if (stage === 'binocular') this.results.binocular = fraction;
  }

  startIshiharaTest() {
    this.currentIshiharaIdx = 0;
    this.ishiharaAnswers = [];
    this.renderIshiharaStep();
  }

  renderIshiharaStep() {
    const plate = this.ishiharaPlates[this.currentIshiharaIdx];

    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 28px; max-width: 600px; margin: 0 auto; text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 0.85rem; font-weight: 700; color: #f59e0b; text-transform: uppercase;">
            Test de Discriminación Cromática (Ishihara)
          </span>
          <span style="font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 4px 10px; border-radius: 12px; color: #94a3b8;">
            Lámina ${this.currentIshiharaIdx + 1} de 3
          </span>
        </div>

        <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 20px;">
          Observa el círculo cromático a continuación. ¿Qué <strong>número</strong> ves oculto entre los puntos?
        </p>

        <!-- Canvas Ishihara Plate Simulation -->
        <canvas id="ishiharaCanvas" width="220" height="220" style="margin: 0 auto 20px; display: block; border-radius: 50%; box-shadow: 0 8px 24px rgba(0,0,0,0.5);"></canvas>

        <div style="max-width: 260px; margin: 0 auto 20px;">
          <input type="text" id="ishiharaInput" class="form-control" style="text-align: center; font-size: 1.4rem; font-weight: 700; letter-spacing: 4px;" placeholder="¿Número?" maxlength="3" autofocus>
        </div>

        <button id="btnNextIshihara" class="btn-primary" style="padding: 12px 30px; font-size: 0.95rem;">
          Confirmar Número ➡️
        </button>
      </div>
    `;

    this.drawIshiharaPlate(plate);

    const input = document.getElementById('ishiharaInput');
    const btn = document.getElementById('btnNextIshihara');

    const handleConfirm = () => {
      const val = input.value.trim();
      this.ishiharaAnswers.push({
        plateId: plate.plateId,
        userAnswer: val,
        correct: plate.correct,
        isMatch: (val === plate.correct)
      });

      this.currentIshiharaIdx++;
      if (this.currentIshiharaIdx < this.ishiharaPlates.length) {
        this.renderIshiharaStep();
      } else {
        this.finishVisiometry();
      }
    };

    btn.addEventListener('click', handleConfirm);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConfirm();
    });
  }

  drawIshiharaPlate(plate) {
    const canvas = document.getElementById('ishiharaCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Draw background plate
    ctx.clearRect(0, 0, w, h);

    // Pseudoisochromatic dot pattern generation
    const bgColors = ['#84cc16', '#a3e635', '#65a30d', '#4d7c0f', '#facc15', '#ca8a04'];
    const numColors = ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#fb923c'];

    // Fill circular pattern
    const radius = 100;
    const centerX = 110;
    const centerY = 110;

    for (let i = 0; i < 480; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      const dotR = 2.5 + Math.random() * 4;

      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = bgColors[Math.floor(Math.random() * bgColors.length)];
      ctx.fill();
    }

    // Draw the number smoothly
    ctx.save();
    ctx.font = 'bold 78px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = numColors[1];
    ctx.globalAlpha = 0.85;
    ctx.fillText(plate.correct, centerX, centerY + 4);
    ctx.restore();
  }

  finishVisiometry() {
    const correctCount = this.ishiharaAnswers.filter(a => a.isMatch).length;
    if (correctCount >= 2) {
      this.results.colorVision = 'Normal (Tricrómata)';
    } else {
      this.results.colorVision = 'Discromatopsia Sugestiva (Requiere Test Farnsworth)';
    }

    this.renderSummary();
  }

  renderSummary() {
    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 32px; max-width: 650px; margin: 0 auto; text-align: center;">
        <div style="font-size: 2.8rem; margin-bottom: 8px;">✅</div>
        <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 6px;">Visiometría Finalizada con Éxito</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 24px;">
          Resultados consolidados de agudeza visual y discriminación cromática:
        </p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px;">
          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">Ojo Derecho</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #10b981;">${this.results.eyeRight}</div>
          </div>
          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">Ojo Izquierdo</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #06b6d4;">${this.results.eyeLeft}</div>
          </div>
          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px;">Visión Binocular</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #6366f1;">${this.results.binocular}</div>
          </div>
        </div>

        <div class="glass-panel" style="padding: 14px 20px; text-align: left; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Visión del Color (Ishihara):</div>
            <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">${this.results.colorVision}</div>
          </div>
          <span style="font-size: 0.8rem; color: #34d399; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 4px 10px; border-radius: 12px;">
            ${this.results.usesCorrection ? 'Con Corrección' : 'Sin Corrección'}
          </span>
        </div>

        <button id="btnProceedToAudio" class="btn-primary" style="padding: 14px 34px; font-size: 1rem;">
          Continuar a Audiometría Tonal Digital 🎧
        </button>
      </div>
    `;

    document.getElementById('btnProceedToAudio').addEventListener('click', () => {
      if (typeof this.onComplete === 'function') {
        this.onComplete(this.results);
      }
    });
  }
}

window.VisiometryTest = VisiometryTest;
