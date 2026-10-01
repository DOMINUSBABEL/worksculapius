/**
 * WORKSCLAPIUS - Módulo de Anamnesis Ocupacional Estandarizada (Res. 2346/2007)
 */

class OccupationalQuestionnaire {
  constructor(containerId, onCompleteCallback) {
    this.container = document.getElementById(containerId);
    this.onComplete = onCompleteCallback;
    this.answers = {
      pathological: [],
      surgeries: 'No refiere',
      habits: {
        smoking: 'No',
        alcohol: 'Social / Ocasional',
        meds: 'Ninguno'
      },
      currentSymptoms: [],
      ergonomicRisks: 'Riesgo moderado'
    };
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 30px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.4rem; color: #fff;">1. Anamnesis Clínica y Factores Ocupacionales</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Cuestionario normativo oficial de Medicina del Trabajo (Resolución 2346 de 2007).
            </p>
          </div>
          <span class="version-tag" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(16,185,129,0.1); border: 1px solid #10b981; border-radius: 20px; color: #34d399;">
            Certificación Biomédica
          </span>
        </div>

        <form id="occupationalForm">
          <!-- Sección 1: Antecedentes Patológicos -->
          <div style="margin-bottom: 26px;">
            <label class="form-label" style="font-size: 0.95rem; color: #38bdf8;">
              A. Antecedentes Patológicos Personales (Marca los que apliquen):
            </label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 8px;">
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="pathological" value="Hipertensión Arterial">
                <span style="font-size: 0.88rem;">Hipertensión Arterial</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="pathological" value="Diabetes Mellitus">
                <span style="font-size: 0.88rem;">Diabetes Mellitus</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="pathological" value="Asma / Problemas Respiratorios">
                <span style="font-size: 0.88rem;">Afección Respiratoria / Asma</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="pathological" value="Lumbalgia / Hernia Discal">
                <span style="font-size: 0.88rem;">Dolor Lumbar Crónico / Hernia</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="pathological" value="Vértigo / Convulsiones">
                <span style="font-size: 0.88rem;">Vértigo / Desmayos / Mareos</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="pathological" value="Uso habitual de lentes/gafas">
                <span style="font-size: 0.88rem;">Uso habitual de Gafas / Lentes</span>
              </label>
            </div>
          </div>

          <!-- Sección 2: Quirúrgicos y Medicación -->
          <div class="grid-2" style="margin-bottom: 24px;">
            <div class="form-group">
              <label class="form-label">B. Antecedentes Quirúrgicos o Traumatológicos Recientes:</label>
              <input type="text" id="qSurgeries" class="form-control" placeholder="Ej: Apendicectomía (2020), o 'Ninguno'">
            </div>
            <div class="form-group">
              <label class="form-label">C. Medicamentos de Consumo Habitual:</label>
              <input type="text" id="qMeds" class="form-control" placeholder="Ej: Losartán 50mg, o 'Ninguno'">
            </div>
          </div>

          <!-- Sección 3: Síntomas y Riesgos Ocupacionales -->
          <div style="margin-bottom: 26px;">
            <label class="form-label" style="font-size: 0.95rem; color: #38bdf8;">
              D. Síntomas Ocupacionales Percibidos en los últimos 30 días:
            </label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 8px;">
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="symptoms" value="Fatiga visual o visión borrosa">
                <span style="font-size: 0.88rem;">Fatiga visual o visión borrosa</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="symptoms" value="Zumbidos o pitidos en el oído (Tinnitus)">
                <span style="font-size: 0.88rem;">Zumbidos en el oído (Tinnitus)</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="symptoms" value="Dolor en cuello / hombro / espalda">
                <span style="font-size: 0.88rem;">Dolor en cuello / espalda</span>
              </label>
              <label class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" name="symptoms" value="Dificultad auditiva en ambientes ruidosos">
                <span style="font-size: 0.88rem;">Dificultad auditiva con ruido</span>
              </label>
            </div>
          </div>

          <!-- Botón de Continuar -->
          <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
            <button type="submit" class="btn-primary" style="padding: 14px 32px; font-size: 1rem;">
              Guardar y Continuar a Visiometría Digital 👁️
            </button>
          </div>
        </form>
      </div>
    `;
  }

  attachEvents() {
    const form = document.getElementById('occupationalForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const pathological = Array.from(document.querySelectorAll('input[name="pathological"]:checked')).map(el => el.value);
      const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(el => el.value);
      const surgeries = document.getElementById('qSurgeries').value.trim() || 'No refiere';
      const meds = document.getElementById('qMeds').value.trim() || 'Ninguno';

      this.answers = {
        pathological,
        surgeries,
        meds,
        symptoms,
        completedAt: new Date().toISOString()
      };

      if (typeof this.onComplete === 'function') {
        this.onComplete(this.answers);
      }
    });
  }
}

window.OccupationalQuestionnaire = OccupationalQuestionnaire;
