/**
 * WORKSCLAPIUS - Módulo de Checkout y Pasarela de Pago
 */

class PaymentCheckout {
  constructor(onSuccessCallback) {
    this.onSuccess = onSuccessCallback;
  }

  showModal(candidateData) {
    const modalId = 'paymentModalOverlay';
    let overlay = document.getElementById(modalId);
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; background: #10b981; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #042f2e;">
              $
            </div>
            <h3 style="color: #fff; font-size: 1.15rem;">Pasarela de Pago Segura</h3>
          </div>
          <button id="btnCloseModal" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer;">&times;</button>
        </div>

        <div class="glass-panel" style="padding: 16px; margin-bottom: 20px; background: rgba(15, 23, 42, 0.6);">
          <div style="font-size: 0.8rem; color: #94a3b8;">Servicio Facturado:</div>
          <div style="font-weight: 700; color: #f8fafc; font-size: 0.95rem; margin-top: 2px;">
            Certificado Médico Ocupacional de Ingreso (Visiometría + Audiometría + Res. 2346)
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <span style="font-size: 0.85rem; color: #cbd5e1;">Total a pagar:</span>
            <span style="font-size: 1.35rem; font-weight: 900; color: #10b981;">$ 45.000 COP <span style="font-size: 0.8rem; font-weight: 400; color: #94a3b8;">($12 USD)</span></span>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 8px; font-weight: 600;">Selecciona método de pago:</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="btn-secondary payment-method active" data-method="card" style="padding: 10px; font-size: 0.8rem; border-color: #10b981; color: #34d399;">
              💳 Tarjeta
            </button>
            <button class="btn-secondary payment-method" data-method="pse" style="padding: 10px; font-size: 0.8rem;">
              🏛️ PSE / Banco
            </button>
            <button class="btn-secondary payment-method" data-method="nequi" style="padding: 10px; font-size: 0.8rem;">
              📱 Nequi / Davi
            </button>
          </div>
        </div>

        <div id="cardFields" style="margin-bottom: 20px;">
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" style="font-size: 0.78rem;">Número de Tarjeta:</label>
            <input type="text" class="form-control" placeholder="•••• •••• •••• 4242" value="4532 8901 2345 8192">
          </div>
          <div class="grid-2">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem;">Vencimiento:</label>
              <input type="text" class="form-control" placeholder="MM/AA" value="12/28">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.78rem;">CVC:</label>
              <input type="text" class="form-control" placeholder="CVC" value="892">
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btnSimulatePaySuccess" class="btn-primary btn-pulse" style="padding: 14px; font-size: 0.95rem; width: 100%;">
            ⚡ Pagar Ahora y Desbloquear Certificado PDF
          </button>
        </div>

        <div style="font-size: 0.7rem; color: #64748b; text-align: center; margin-top: 14px; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Transacción encriptada con SSL de 256 bits y bóveda segura.
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('btnCloseModal').addEventListener('click', () => overlay.remove());

    const methods = overlay.querySelectorAll('.payment-method');
    methods.forEach(btn => {
      btn.addEventListener('click', () => {
        methods.forEach(m => {
          m.classList.remove('active');
          m.style.borderColor = 'var(--border-subtle)';
          m.style.color = 'var(--text-main)';
        });
        btn.classList.add('active');
        btn.style.borderColor = '#10b981';
        btn.style.color = '#34d399';
      });
    });

    document.getElementById('btnSimulatePaySuccess').addEventListener('click', () => {
      const btn = document.getElementById('btnSimulatePaySuccess');
      btn.innerHTML = '⏳ Procesando transacción bancaria...';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = '✅ ¡Pago Aprobado con Éxito!';
        btn.style.background = '#10b981';
        
        // Play payment chime with Web Audio API
        this.playSuccessChime();

        setTimeout(() => {
          overlay.remove();
          if (typeof this.onSuccess === 'function') {
            this.onSuccess({
              transactionId: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
              amount: 45000,
              paidAt: new Date().toISOString()
            });
          }
        }, 800);
      }, 1000);
    });
  }

  playSuccessChime() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const t = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc2.frequency.setValueAtTime(659.25, t + 0.12); // E5

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(t);
      osc2.start(t + 0.12);
      osc1.stop(t + 0.5);
      osc2.stop(t + 0.5);
    } catch (e) {
      console.log('Chime sound fallback');
    }
  }
}

window.PaymentCheckout = PaymentCheckout;
