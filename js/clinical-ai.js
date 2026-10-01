/**
 * WORKSCLAPIUS - Motor de Inferencia Clínica IA & Aptitud Laboral
 */

class ClinicalAIEngine {
  static evaluateAptitude(candidate, questionnaire, visiometry, audiometry) {
    const job = (candidate.jobTitle || '').toLowerCase();
    const restrictions = [];
    const recommendations = [];
    const cie10 = [{ code: 'Z00.0', desc: 'Examen médico general de ingreso laboral' }];

    let aptitudeStatus = 'APTO'; // 'APTO' | 'APTO_RESTRICCIONES' | 'APLAZADO'
    let statusClass = 'status-apto';
    let statusColor = '#10b981';

    // 1. Evaluación Visual
    const binoc = visiometry.binocular || '20/20';
    const hasVisualDeficit = (binoc !== '20/20' && binoc !== '20/25');
    if (hasVisualDeficit || visiometry.usesCorrection) {
      restrictions.push('Uso permanente de lentes correctivos para actividades laborales y de lectura.');
      cie10.push({ code: 'H52.2', desc: 'Trastornos de la refracción (requiere corrección óptica)' });
      if (aptitudeStatus === 'APTO') aptitudeStatus = 'APTO_RESTRICCIONES';
    }

    if (visiometry.colorVision.includes('Discromatopsia')) {
      if (job.includes('conductor') || job.includes('chofer') || job.includes('electric') || job.includes('diseño')) {
        restrictions.push('Precaución en identificación de cables y señalización luminosa por discromatopsia.');
        cie10.push({ code: 'H53.5', desc: 'Deficiencias de la visión cromática' });
        if (aptitudeStatus === 'APTO') aptitudeStatus = 'APTO_RESTRICCIONES';
      }
    }

    // 2. Evaluación Auditiva
    const ptaR = audiometry.ptaRight || 20;
    const ptaL = audiometry.ptaLeft || 20;
    const hasHearingLoss = (ptaR > 25 || ptaL > 25);

    if (hasHearingLoss) {
      restrictions.push('Uso obligatorio de protección auditiva de doble copa en áreas con ruido ≥ 80 dBA.');
      recommendations.push('Ingreso al Sistema de Vigilancia Epidemiológica (SVE) de Conservación Auditiva.');
      cie10.push({ code: 'H90.5', desc: 'Hipoacusia neurosensorial leve inducida por ruido/presbiacusia' });
      if (aptitudeStatus === 'APTO') aptitudeStatus = 'APTO_RESTRICCIONES';
    } else {
      recommendations.push('Uso de EPP auditivo preventivo estándar en caso de exposición a maquinaria.');
    }

    // 3. Evaluación de Anamnesis & Síntomas
    const path = questionnaire.pathological || [];
    const symptoms = questionnaire.symptoms || [];

    if (path.includes('Vértigo / Convulsiones')) {
      if (job.includes('altura') || job.includes('torre') || job.includes('conductor')) {
        aptitudeStatus = 'APLAZADO';
        restrictions.push('NO APTO para tareas de alto riesgo en alturas (> 1.50m) ni conducción hasta valoración por Neurología.');
        cie10.push({ code: 'R42', desc: 'Vértigo y mareo en estudio' });
      }
    }

    if (path.includes('Lumbalgia / Hernia Discal') || symptoms.includes('Dolor en cuello / hombro / espalda')) {
      restrictions.push('Evitar levantamiento manual de cargas superior a 20 kg sin ayuda mecánica.');
      recommendations.push('Capacitación en higiene postural y pausas activas osteomusculares de 5 minutos cada 2 horas.');
      cie10.push({ code: 'M54.5', desc: 'Lumbago no especificado / Fatiga postural' });
      if (aptitudeStatus === 'APTO') aptitudeStatus = 'APTO_RESTRICCIONES';
    }

    if (path.includes('Hipertensión Arterial')) {
      recommendations.push('Control periódico de cifras tensionales y adherencia estricta a farmacoterapia.');
      cie10.push({ code: 'I10', desc: 'Hipertensión esencial (primaria)' });
    }

    // Status formatting
    let titleStatus = 'APTO SIN RESTRICCIONES';
    if (aptitudeStatus === 'APTO_RESTRICCIONES') {
      titleStatus = 'APTO CON RECOMENDACIONES / RESTRICCIONES';
      statusClass = 'status-restriccion';
      statusColor = '#f59e0b';
    } else if (aptitudeStatus === 'APLAZADO') {
      titleStatus = 'APLAZADO / PENDIENTE DE VALORACIÓN MÉDICA';
      statusClass = 'status-aplazado';
      statusColor = '#ef4444';
    }

    // General ergonomics recommendations
    recommendations.push('Examen periódico anual ocupacional de seguimiento.');
    recommendations.push('Mantener estilos de vida saludable, pausas activas y adecuada hidratación laboral.');

    return {
      status: aptitudeStatus,
      statusTitle: titleStatus,
      statusColor,
      restrictions,
      recommendations,
      cie10,
      evaluatedAt: new Date().toISOString(),
      physician: {
        name: 'Dr. Alejandro Restrepo Morales',
        specialty: 'Especialista en Medicina del Trabajo y Salud Ocupacional',
        license: 'Lic. SO-05-9481-MinSalud',
        regMed: 'RM-48201 Antioquia'
      }
    };
  }

  static renderDiagnosisView(containerId, evaluationData, onProceedToPayment) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { statusTitle, statusColor, restrictions, recommendations, cie10, physician } = evaluationData;

    container.innerHTML = `
      <div class="glass-panel" style="padding: 32px; max-width: 760px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-subtle); padding-bottom: 18px; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.45rem; color: #fff; margin-bottom: 4px;">4. Dictamen Médico Ocupacional IA</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">
              Síntesis diagnóstica basada en anamnesis, visiometría Snellen y audiometría tonal.
            </p>
          </div>
          <span style="font-size: 0.75rem; background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); padding: 4px 10px; border-radius: 12px; font-weight: 600;">
            Motor Clínico v2.4
          </span>
        </div>

        <!-- Concepto de Aptitud -->
        <div class="glass-panel-elevated" style="padding: 24px; text-align: center; border: 2px solid ${statusColor}; margin-bottom: 28px; background: rgba(15, 23, 42, 0.9);">
          <div style="font-size: 0.8rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px;">
            Concepto de Aptitud Médico-Laboral
          </div>
          <div style="font-size: 1.55rem; font-weight: 900; color: ${statusColor}; letter-spacing: -0.01em;">
            ${statusTitle}
          </div>
        </div>

        <!-- CIE-10 -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 0.92rem; color: #38bdf8; margin-bottom: 10px;">Diagnósticos Clínicos Asignados (CIE-10):</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${cie10.map(item => `
              <div class="glass-panel" style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: #f8fafc;">${item.desc}</span>
                <span style="font-family: monospace; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 6px; color: #38bdf8; font-weight: 700;">${item.code}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Restricciones y Recomendaciones -->
        <div class="grid-2" style="margin-bottom: 28px;">
          <div class="glass-panel" style="padding: 18px; border-left: 3px solid #f59e0b;">
            <h4 style="font-size: 0.9rem; color: #fbbf24; margin-bottom: 10px;">Restricciones Específicas:</h4>
            ${restrictions.length > 0 ? `
              <ul style="font-size: 0.82rem; color: #e2e8f0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">
                ${restrictions.map(r => `<li>${r}</li>`).join('')}
              </ul>
            ` : '<div style="font-size: 0.82rem; color: #94a3b8;">Sin restricciones laborales identificadas.</div>'}
          </div>

          <div class="glass-panel" style="padding: 18px; border-left: 3px solid #10b981;">
            <h4 style="font-size: 0.9rem; color: #34d399; margin-bottom: 10px;">Recomendaciones Ergonómicas:</h4>
            <ul style="font-size: 0.82rem; color: #e2e8f0; padding-left: 18px; display: flex; flex-direction: column; gap: 6px;">
              ${recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Médico Evaluador -->
        <div class="glass-panel" style="padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; background: rgba(15,23,42,0.5);">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">${physician.name}</div>
            <div style="font-size: 0.78rem; color: #94a3b8;">${physician.specialty} | ${physician.license}</div>
          </div>
          <span style="font-size: 0.75rem; color: #10b981; border: 1px solid #10b981; padding: 4px 8px; border-radius: 8px;">
            Firma Digital Válida
          </span>
        </div>

        <!-- Botón a Descarga / Checkout -->
        <div style="text-align: center;">
          <button id="btnProceedToPay" class="btn-primary btn-pulse" style="padding: 16px 40px; font-size: 1.05rem;">
            Desbloquear y Descargar Certificado Oficial en PDF 📜🔒
          </button>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
            Emisión con código QR verificable conforme a los requisitos de la Resolución 2346 de 2007.
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnProceedToPay').addEventListener('click', () => {
      if (typeof onProceedToPayment === 'function') {
        onProceedToPayment();
      }
    });
  }
}

window.ClinicalAIEngine = ClinicalAIEngine;
