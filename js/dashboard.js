/**
 * WORKSCLAPIUS - Panel de Control B2B para IPS y Empresas Contratantes
 */

class IPSDashboard {
  constructor(containerId, onSelectCandidate) {
    this.container = document.getElementById(containerId);
    this.onSelectCandidate = onSelectCandidate;
    this.records = this.loadRecords();
    this.init();
  }

  loadRecords() {
    const saved = localStorage.getItem('worksculapius_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default seed records for IPS showcase
    return [
      {
        id: 'REC-101',
        fullName: 'Juan Esteban Gómez',
        docNumber: '1.037.649.201',
        companyName: 'Industrias y Servicios S.A.S.',
        jobTitle: 'Operario de Planta',
        date: '2026-10-01',
        status: 'APTO_RESTRICCIONES',
        statusTitle: 'Apto con Restricciones',
        color: '#f59e0b',
        pta: '28 dB HL (OI)',
        vision: '20/25 AO',
        paid: true
      },
      {
        id: 'REC-102',
        fullName: 'Carolina Valencia Ríos',
        docNumber: '43.910.822',
        companyName: 'Bancolombia S.A.',
        jobTitle: 'Analista de Sistemas',
        date: '2026-10-01',
        status: 'APTO',
        statusTitle: 'Apto sin Restricciones',
        color: '#10b981',
        pta: '18 dB HL',
        vision: '20/20 AO',
        paid: true
      },
      {
        id: 'REC-103',
        fullName: 'Carlos Alberto Martínez',
        docNumber: '71.284.990',
        companyName: 'Transportes Rápido Ochoa',
        jobTitle: 'Conductor Intermunicipal',
        date: '2026-09-30',
        status: 'APLAZADO',
        statusTitle: 'Aplazado (Vértigo)',
        color: '#ef4444',
        pta: '35 dB HL',
        vision: '20/40 AO',
        paid: true
      },
      {
        id: 'REC-104',
        fullName: 'María Fernanda Henao',
        docNumber: '1.152.483.910',
        companyName: 'Constructora Capital S.A.',
        jobTitle: 'Supervisora de Obras',
        date: '2026-09-30',
        status: 'APTO',
        statusTitle: 'Apto sin Restricciones',
        color: '#10b981',
        pta: '16 dB HL',
        vision: '20/20 AO',
        paid: true
      }
    ];
  }

  saveRecord(newRecord) {
    this.records.unshift(newRecord);
    localStorage.setItem('worksculapius_records', JSON.stringify(this.records));
    this.render();
  }

  init() {
    this.render();
  }

  render() {
    const totalExams = this.records.length;
    const totalApto = this.records.filter(r => r.status === 'APTO').length;
    const totalRestr = this.records.filter(r => r.status === 'APTO_RESTRICCIONES').length;
    const totalAplazado = this.records.filter(r => r.status === 'APLAZADO').length;
    const totalRevenue = totalExams * 45000;

    this.container.innerHTML = `
      <div class="glass-panel" style="padding: 28px;">
        <!-- Top header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.4rem; color: #fff;">📊 Panel de Control Ocupacional (IPS / Empresa)</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Supervisión en tiempo real de exámenes médicos preocupacionales y emisión de certificados.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="btnExportCSV" class="btn-secondary" style="font-size: 0.85rem; padding: 8px 16px;">
              📥 Exportar Excel/CSV
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px;">
          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Total Evaluaciones</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #fff; margin-top: 4px;">${totalExams}</div>
            <div style="font-size: 0.72rem; color: #10b981; margin-top: 2px;">↑ 100% Digitalizadas</div>
          </div>

          <div class="glass-panel" style="padding: 16px; border-left: 3px solid #10b981;">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Aptos Directos</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #10b981; margin-top: 4px;">${totalApto}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${Math.round((totalApto / totalExams) * 100)}% del total</div>
          </div>

          <div class="glass-panel" style="padding: 16px; border-left: 3px solid #f59e0b;">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Con Restricciones</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #f59e0b; margin-top: 4px;">${totalRestr}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Lentes / EPP Ruido</div>
          </div>

          <div class="glass-panel" style="padding: 16px; border-left: 3px solid #ef4444;">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Aplazados</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #ef4444; margin-top: 4px;">${totalAplazado}</div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Remisión clínica</div>
          </div>

          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Facturación IPS</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8; margin-top: 4px;">$ ${totalRevenue.toLocaleString()} COP</div>
            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Cobro por examen</div>
          </div>
        </div>

        <!-- Filter and Search -->
        <div style="display: flex; gap: 14px; margin-bottom: 20px; align-items: center; justify-content: space-between;">
          <input type="text" id="dashboardSearch" class="form-control" style="max-width: 380px; font-size: 0.88rem; padding: 10px 14px;" placeholder="🔍 Buscar por nombre, cédula o empresa...">
          <div style="font-size: 0.8rem; color: #94a3b8;">
            Mostrando <strong>${totalExams}</strong> postulantes
          </div>
        </div>

        <!-- Records Table -->
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-subtle); color: #94a3b8;">
                <th style="padding: 12px 14px;">Postulante / Cédula</th>
                <th style="padding: 12px 14px;">Empresa / Cargo</th>
                <th style="padding: 12px 14px;">Visiometría</th>
                <th style="padding: 12px 14px;">Audiometría</th>
                <th style="padding: 12px 14px;">Aptitud Médica</th>
                <th style="padding: 12px 14px; text-align: right;">Acción</th>
              </tr>
            </thead>
            <tbody id="dashboardTableBody">
              ${this.records.map(r => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                  <td style="padding: 14px;">
                    <div style="font-weight: 700; color: #fff;">${r.fullName}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">ID: ${r.docNumber}</div>
                  </td>
                  <td style="padding: 14px;">
                    <div style="color: #cbd5e1;">${r.companyName}</div>
                    <div style="font-size: 0.75rem; color: #38bdf8;">${r.jobTitle}</div>
                  </td>
                  <td style="padding: 14px; color: #cbd5e1;">
                    ${r.vision || '20/20 AO'}
                  </td>
                  <td style="padding: 14px; color: #cbd5e1;">
                    ${r.pta || '18 dB HL'}
                  </td>
                  <td style="padding: 14px;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: ${r.color}; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 12px; border: 1px solid ${r.color};">
                      ${r.statusTitle}
                    </span>
                  </td>
                  <td style="padding: 14px; text-align: right;">
                    <button class="btn-secondary btn-table-pdf" data-id="${r.id}" style="padding: 6px 12px; font-size: 0.78rem;">
                      📄 Ver PDF
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const searchInput = document.getElementById('dashboardSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#dashboardTableBody tr');
        rows.forEach(tr => {
          const text = tr.innerText.toLowerCase();
          tr.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }

    const exportBtn = document.getElementById('btnExportCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        let csv = 'ID,Nombre,Cedula,Empresa,Cargo,Fecha,Aptitud,Visiometria,Audiometria\n';
        this.records.forEach(r => {
          csv += `"${r.id}","${r.fullName}","${r.docNumber}","${r.companyName}","${r.jobTitle}","${r.date}","${r.statusTitle}","${r.vision}","${r.pta}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Worksculapius_Reporte_IPS_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      });
    }

    const pdfButtons = document.querySelectorAll('.btn-table-pdf');
    pdfButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        alert('Generando copia certificada con firma digital para este registro...');
      });
    });
  }
}

window.IPSDashboard = IPSDashboard;
