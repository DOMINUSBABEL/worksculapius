/**
 * WORKSCLAPIUS - Aplicación Principal y Orquestador de Flujo
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionToken = urlParams.get('token');

  const state = {
    activeView: 'exam', // 'wa' | 'exam' | 'dashboard'
    examStep: 1, // 1: Anamnesis, 2: Visiometry, 3: Audiometry, 4: Diagnosis, 5: Payment/Cert
    sessionToken: sessionToken || null,
    candidate: {
      fullName: 'Juan Esteban Gómez',
      docNumber: '1.037.649.201',
      jobTitle: 'Operario de Planta',
      companyName: 'Industrias y Servicios S.A.S.'
    },
    questionnaire: null,
    visiometry: null,
    audiometry: null,
    evaluation: null,
    payment: null
  };

  // Nav Tabs
  const tabWA = document.getElementById('tabWA');
  const tabExam = document.getElementById('tabExam');
  const tabDashboard = document.getElementById('tabDashboard');

  const viewWA = document.getElementById('viewWA');
  const viewExam = document.getElementById('viewExam');
  const viewDashboard = document.getElementById('viewDashboard');

  const stepperBar = document.getElementById('stepperContainer');

  function switchMainView(viewName) {
    state.activeView = viewName;

    // Reset tabs classes
    [tabWA, tabExam, tabDashboard].forEach(tab => tab.classList.remove('active'));
    [viewWA, viewExam, viewDashboard].forEach(v => v.style.display = 'none');

    if (viewName === 'wa') {
      tabWA.classList.add('active');
      viewWA.style.display = 'block';
      stepperBar.style.display = 'none';
    } else if (viewName === 'exam') {
      tabExam.classList.add('active');
      viewExam.style.display = 'block';
      stepperBar.style.display = 'block';
    } else if (viewName === 'dashboard') {
      tabDashboard.classList.add('active');
      viewDashboard.style.display = 'block';
      stepperBar.style.display = 'none';
      if (window.ipsDashboardInstance) {
        window.ipsDashboardInstance.render();
      }
    }
  }

  tabWA.addEventListener('click', () => switchMainView('wa'));
  tabExam.addEventListener('click', () => switchMainView('exam'));
  tabDashboard.addEventListener('click', () => switchMainView('dashboard'));

  // Update Stepper Visuals
  function updateStepper(stepNumber) {
    state.examStep = stepNumber;
    for (let i = 1; i <= 5; i++) {
      const stepEl = document.getElementById(`stepNode${i}`);
      if (!stepEl) continue;
      stepEl.classList.remove('active', 'completed');
      if (i < stepNumber) {
        stepEl.classList.add('completed');
      } else if (i === stepNumber) {
        stepEl.classList.add('active');
      }
    }
  }

  // Stepper Clickable Nodes
  for (let i = 1; i <= 5; i++) {
    const stepEl = document.getElementById(`stepNode${i}`);
    if (stepEl) {
      stepEl.addEventListener('click', () => {
        // Can only jump to steps already unlocked or visited
        if (i <= state.examStep) {
          loadExamStep(i);
        }
      });
    }
  }

  // 1. Initialize WhatsApp Simulator
  const waSimulator = new WhatsAppSimulator('waChatContainer', (candidateData) => {
    state.candidate = candidateData;
    switchMainView('exam');
    loadExamStep(1);
  });

  // 2. Initialize Dashboard
  window.ipsDashboardInstance = new IPSDashboard('dashboardContainer');

  // 3. Load Exam Step Handler
  function loadExamStep(step) {
    updateStepper(step);
    const container = document.getElementById('examStepContainer');
    container.innerHTML = '';

    if (step === 1) {
      // Anamnesis
      new OccupationalQuestionnaire('examStepContainer', (qData) => {
        state.questionnaire = qData;
        loadExamStep(2);
      });
    } else if (step === 2) {
      // Visiometry
      new VisiometryTest('examStepContainer', (vData) => {
        state.visiometry = vData;
        loadExamStep(3);
      });
    } else if (step === 3) {
      // Audiometry
      new AudiometryTest('examStepContainer', (aData) => {
        state.audiometry = aData;
        loadExamStep(4);
      });
    } else if (step === 4) {
      // Clinical AI Diagnosis
      state.evaluation = ClinicalAIEngine.evaluateAptitude(
        state.candidate,
        state.questionnaire || {},
        state.visiometry || { binocular: '20/20', colorVision: 'Normal' },
        state.audiometry || { ptaRight: 20, ptaLeft: 20 }
      );

      ClinicalAIEngine.renderDiagnosisView('examStepContainer', state.evaluation, () => {
        // Trigger checkout modal
        const checkout = new PaymentCheckout((paymentData) => {
          state.payment = paymentData;
          loadExamStep(5);
        });
        checkout.showModal(state.candidate);
      });
    } else if (step === 5) {
      // Certificate Download and Success Screen
      renderCertificateSuccess();
    }
  }

  function renderCertificateSuccess() {
    const container = document.getElementById('examStepContainer');
    container.innerHTML = `
      <div class="glass-panel" style="padding: 36px; max-width: 680px; margin: 0 auto; text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: 12px;">🎉📜</div>
        <h2 style="font-size: 1.6rem; color: #fff; margin-bottom: 8px;">¡Certificado Médico Ocupacional Emitido!</h2>
        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-bottom: 24px;">
          El certificado médico de aptitud laboral para <strong>${state.candidate.fullName}</strong> ha sido generado con firma médica digital, código QR criptográfico y gráficos clínicos oficiales.
        </p>

        <div class="glass-panel-elevated" style="padding: 20px; text-align: left; margin-bottom: 28px; border: 1px solid rgba(16,185,129,0.3);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.8rem; color: #94a3b8;">Folio / Transacción:</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: #38bdf8;">${state.payment.transactionId}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.8rem; color: #94a3b8;">Concepto de Aptitud:</span>
            <span style="font-size: 0.85rem; font-weight: 800; color: ${state.evaluation.statusColor};">${state.evaluation.statusTitle}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 0.8rem; color: #94a3b8;">Empresa Destino:</span>
            <span style="font-size: 0.85rem; color: #fff;">${state.candidate.companyName}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 380px; margin: 0 auto 24px;">
          <button id="btnDownloadPDFAgain" class="btn-primary" style="padding: 16px; font-size: 1.05rem;">
            📥 Descargar Certificado Oficial en PDF
          </button>
          <button id="btnGoToDashboard" class="btn-secondary" style="padding: 12px; font-size: 0.9rem;">
            📊 Ver en Panel de Control de la IPS
          </button>
        </div>

        <div style="font-size: 0.75rem; color: #64748b;">
          Copia archivada en la base de datos central de Salud Laboral IPS bajo la Resolución 2346 de 2007.
        </div>
      </div>
    `;

    // Automatically trigger initial PDF generation
    CertificatePDFGenerator.generate(
      state.candidate,
      state.questionnaire,
      state.visiometry,
      state.audiometry,
      state.evaluation,
      state.payment
    ).then((pdfDoc) => {
      // Si hay backend y token de sesión, notificar al agente de WhatsApp
      if (pdfDoc && state.sessionToken) {
        try {
          const pdfBase64 = pdfDoc.output('datauristring');
          fetch('/api/exam/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: state.sessionToken,
              candidate: state.candidate,
              evaluation: state.evaluation,
              pdfBase64: pdfBase64
            })
          }).then(r => r.json()).then(data => {
            console.log('✅ Certificado despachado a WhatsApp:', data);
          }).catch(err => console.log('WhatsApp dispatch skip (local mode):', err));
        } catch (e) {
          console.log('PDF export string note:', e);
        }
      }
    });

    // Save into IPS Dashboard records
    if (window.ipsDashboardInstance) {
      window.ipsDashboardInstance.saveRecord({
        id: 'REC-' + Math.floor(1000 + Math.random() * 9000),
        fullName: state.candidate.fullName,
        docNumber: state.candidate.docNumber,
        companyName: state.candidate.companyName,
        jobTitle: state.candidate.jobTitle,
        date: new Date().toISOString().slice(0, 10),
        status: state.evaluation.status,
        statusTitle: state.evaluation.statusTitle,
        color: state.evaluation.statusColor,
        pta: `${state.audiometry.ptaRight} dB HL`,
        vision: `${state.visiometry.binocular} AO`,
        paid: true
      });
    }

    document.getElementById('btnDownloadPDFAgain').addEventListener('click', () => {
      CertificatePDFGenerator.generate(
        state.candidate,
        state.questionnaire,
        state.visiometry,
        state.audiometry,
        state.evaluation,
        state.payment
      );
    });

    document.getElementById('btnGoToDashboard').addEventListener('click', () => {
      switchMainView('dashboard');
    });
  }

  // Pre-carga si viene de WhatsApp mediante token
  if (state.sessionToken) {
    fetch(`/api/session/${state.sessionToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.session && data.session.candidate) {
          state.candidate = Object.assign(state.candidate, data.session.candidate);
          console.log('✅ Datos de postulante cargados desde WhatsApp:', state.candidate);
        }
        loadExamStep(1);
      })
      .catch(() => {
        loadExamStep(1);
      });
  } else {
    // Initial step start
    loadExamStep(1);
  }
});
