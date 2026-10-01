/**
 * WORKSCLAPIUS - Simulador de WhatsApp Business para Onboarding de IPS
 */

class WhatsAppSimulator {
  constructor(containerId, onExamStartCallback) {
    this.container = document.getElementById(containerId);
    this.onExamStart = onExamStartCallback;
    this.step = 0;
    this.candidateData = {
      fullName: '',
      docNumber: '',
      jobTitle: 'Operario de Planta',
      companyName: 'Industrias y Servicios S.A.S.'
    };
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
    this.simulateTypingAndReply('¡Hola! 👋 Te damos la bienvenida a la línea oficial de **Salud Laboral IPS** asistida por Worksculapius.\n\nPara iniciar tu **Examen Médico Preocupacional de Ingreso**, por favor indícanos tu **Nombre Completo**:');
  }

  render() {
    this.container.innerHTML = `
      <div class="wa-container">
        <div class="wa-header">
          <div class="wa-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Salud Laboral IPS (Oficial)</div>
            <div style="font-size: 0.72rem; color: #25d366; display: flex; align-items: center; gap: 4px;">
              <span style="display:inline-block; width:6px; height:6px; background:#25d366; border-radius:50%;"></span> en línea | Asistente IA 24/7
            </div>
          </div>
        </div>

        <div class="wa-chat-body" id="waChatBody">
          <!-- Messages will be injected dynamically -->
        </div>

        <div class="wa-footer">
          <input type="text" id="waInput" class="form-control" style="border-radius: 20px; font-size: 0.88rem;" placeholder="Escribe un mensaje aquí...">
          <button id="waSendBtn" class="btn-primary" style="padding: 10px 14px; border-radius: 50%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const input = document.getElementById('waInput');
    const sendBtn = document.getElementById('waSendBtn');

    sendBtn.addEventListener('click', () => this.handleUserSend());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleUserSend();
    });
  }

  handleUserSend() {
    const input = document.getElementById('waInput');
    const text = input.value.trim();
    if (!text) return;

    this.appendMessage(text, 'wa-outgoing');
    input.value = '';

    // Handle bot state
    setTimeout(() => {
      this.processConversation(text);
    }, 600);
  }

  processConversation(userInput) {
    if (this.step === 0) {
      this.candidateData.fullName = userInput;
      this.step = 1;
      this.simulateTypingAndReply(`Un gusto saludarte, **${userInput}**. 📋 Para completar tu ficha ocupacional, por favor digita tu **Número de Cédula o Documento de Identidad**:`);
    } else if (this.step === 1) {
      this.candidateData.docNumber = userInput;
      this.step = 2;
      this.simulateTypingAndReply(`Perfecto. ¿A qué **Cargo o Puesto de Trabajo** aspiras ingresar?\n\n*(Ejemplos: Conductor, Operario de Planta, Asistente Administrativo, Técnico de Alturas, Bodeguero)*:`);
    } else if (this.step === 2) {
      this.candidateData.jobTitle = userInput;
      this.step = 3;
      this.simulateTypingAndReply(`Excelente. ¿Para cuál **Empresa o Razón Social** realizarás el ingreso? *(O escribe 'Independiente')*:`);
    } else if (this.step === 3) {
      this.candidateData.companyName = userInput;
      this.step = 4;
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const reply = `✅ **¡Cita y Ficha Registrada con Éxito!**\n\n` +
        `👤 **Postulante:** ${this.candidateData.fullName}\n` +
        `🆔 **Documento:** ${this.candidateData.docNumber}\n` +
        `🏢 **Empresa:** ${this.candidateData.companyName}\n` +
        `💼 **Cargo:** ${this.candidateData.jobTitle}\n` +
        `⏰ **Horario de turno:** Hoy a las ${timeStr}\n\n` +
        `Tu orden de **Examen Médico Preocupacional con Visiometría y Audiometría Tonal** está lista en nuestra plataforma telemática.\n\n` +
        `Haz clic en el enlace seguro para iniciar tu evaluación:`;
      
      this.simulateTypingAndReply(reply, true);
    } else {
      this.simulateTypingAndReply(`Tu examen ya está generado. Pulsa el botón inferior para ingresar a la plataforma clínica.`);
    }
  }

  simulateTypingAndReply(text, includeLink = false) {
    const chatBody = document.getElementById('waChatBody');
    if (!chatBody) return;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'wa-bubble wa-incoming';
    typingIndicator.style.fontStyle = 'italic';
    typingIndicator.style.opacity = '0.7';
    typingIndicator.innerText = 'Salud Laboral está escribiendo...';
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typingIndicator.remove();
      this.appendMessage(text, 'wa-incoming');

      if (includeLink) {
        const linkBubble = document.createElement('div');
        linkBubble.className = 'wa-bubble wa-incoming';
        linkBubble.style.background = '#1e293b';
        linkBubble.style.border = '1px solid #10b981';
        linkBubble.innerHTML = `
          <div style="font-weight: 700; color: #34d399; margin-bottom: 6px;">🩺 Worksculapius Clinical Portal</div>
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 12px;">
            Acceso seguro autenticado para evaluación clínica, visiometría Snellen y audiometría digital.
          </div>
          <button id="waLaunchExamBtn" class="btn-primary" style="width: 100%; font-size: 0.85rem; padding: 10px;">
            Lanzar Examen Médico Ocupacional 🚀
          </button>
        `;
        chatBody.appendChild(linkBubble);
        chatBody.scrollTop = chatBody.scrollHeight;

        document.getElementById('waLaunchExamBtn').addEventListener('click', () => {
          if (typeof this.onExamStart === 'function') {
            this.onExamStart(this.candidateData);
          }
        });
      }
    }, 900);
  }

  appendMessage(text, className) {
    const chatBody = document.getElementById('waChatBody');
    if (!chatBody) return;

    const msg = document.createElement('div');
    msg.className = `wa-bubble ${className}`;
    
    // Simple markdown bold conversion
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msg.innerHTML = `<div>${formatted}</div><div class="wa-time">${timeStr}</div>`;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

window.WhatsAppSimulator = WhatsAppSimulator;
