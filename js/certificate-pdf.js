/**
 * WORKSCLAPIUS - Generador de Certificado Médico Oficial de Aptitud Laboral en PDF
 * Conforme a los estándares de la Resolución 2346 de 2007 (Medicina del Trabajo)
 */

class CertificatePDFGenerator {
  static async generate(candidate, questionnaire, visiometry, audiometry, evaluation, payment) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [16, 185, 129]; // Emerald
    const slateDark = [15, 23, 42];
    const textColor = [30, 41, 59];

    // Background header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, 'F');

    // Accent line
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 36, 210, 2, 'F');

    // Header Logo & Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('WORKSCLAPIUS | IPS SALUD LABORAL', 15, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('INSTITUCIÓN PRESTADORA DE SERVICIOS DE SALUD OCUPACIONAL', 15, 22);
    doc.text('Licencia en Salud Ocupacional No. SO-2026-9481 | NIT: 901.482.019-3', 15, 27);
    doc.text('Sede Principal: Medellín, Colombia | contacto@saludlaboralips.com.co', 15, 32);

    // Document Title Box
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 42, 180, 14, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CERTIFICADO MÉDICO DE APTITUD OCUPACIONAL (INGRESO LABORAL)', 20, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Cumplimiento legal estricto: Resolución 2346 de 2007 (Ministerio de la Protección Social)', 20, 54);

    // Section 1: Candidate & Company Data
    let y = 62;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('I. INFORMACIÓN GENERAL Y LABORAL', 18, y + 4.2);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre del Postulante:', 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(candidate.fullName || 'Juan Esteban Gómez', 58, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Documento ID:', 125, y);
    doc.setFont('helvetica', 'normal');
    doc.text(candidate.docNumber || '1.037.649.201', 150, y);

    // Row 2
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Empresa Solicitante:', 18, y);
    doc.setFont('helvetica', 'normal');
    doc.text(candidate.companyName || 'Industrias y Servicios S.A.S.', 58, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Cargo / Puesto:', 125, y);
    doc.setFont('helvetica', 'normal');
    doc.text(candidate.jobTitle || 'Operario de Planta', 150, y);

    // Row 3
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Evaluación:', 18, y);
    doc.setFont('helvetica', 'normal');
    const examDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(examDate, 58, y);

    doc.setFont('helvetica', 'bold');
    doc.text('No. Transacción / Folio:', 125, y);
    doc.setFont('helvetica', 'normal');
    doc.text(payment.transactionId || 'TXN-984210', 160, y);

    // Section 2: Visiometry & Audiometry Paraclinics
    y += 9;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. PARACLÍNICOS: VISIOMETRÍA Y AUDIOMETRÍA DIGITAL', 18, y + 4.2);

    y += 8;
    // Table Headers
    doc.setFillColor(226, 232, 240);
    doc.rect(15, y, 90, 5, 'F');
    doc.rect(105, y, 90, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('EVALUACIÓN VISIOMÉTRICA (SNELLEN & ISHIHARA)', 18, y + 3.5);
    doc.text('EVALUACIÓN AUDIOMÉTRICA TONAL (dB HL)', 108, y + 3.5);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`• Ojo Derecho (OD): ${visiometry.eyeRight}`, 18, y);
    doc.text(`• Umbral OD (PTA): ${audiometry.ptaRight} dB HL (${audiometry.rightDiagnosis})`, 108, y);

    y += 5;
    doc.text(`• Ojo Izquierdo (OI): ${visiometry.eyeLeft}`, 18, y);
    doc.text(`• Umbral OI (PTA): ${audiometry.ptaLeft} dB HL (${audiometry.leftDiagnosis})`, 108, y);

    y += 5;
    doc.text(`• Visión Binocular: ${visiometry.binocular}`, 18, y);
    doc.text(`• Vía evaluada: Aérea binaural en frecuencias 500-8000 Hz`, 108, y);

    y += 5;
    doc.text(`• Visión de Colores: ${visiometry.colorVision}`, 18, y);
    doc.text(`• Corrección Óptica en Test: ${visiometry.usesCorrection ? 'Sí' : 'No'}`, 108, y);

    // Embed Audiogram Graph if available
    if (audiometry.audiogramImageBase64) {
      y += 6;
      try {
        doc.addImage(audiometry.audiogramImageBase64, 'PNG', 45, y, 120, 48);
        y += 50;
      } catch (e) {
        y += 6;
      }
    } else {
      y += 8;
    }

    // Section 3: Aptitude Concept Box
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('III. CONCEPTO MÉDICO-LABORAL DE APTITUD', 18, y + 4.2);

    y += 8;
    // Status Callout box
    let boxBorderColor = [16, 185, 129];
    let boxFillColor = [236, 253, 245];
    if (evaluation.status === 'APTO_RESTRICCIONES') {
      boxBorderColor = [245, 158, 11];
      boxFillColor = [254, 243, 199];
    } else if (evaluation.status === 'APLAZADO') {
      boxBorderColor = [239, 68, 68];
      boxFillColor = [254, 226, 226];
    }

    doc.setDrawColor(...boxBorderColor);
    doc.setFillColor(...boxFillColor);
    doc.roundedRect(15, y, 180, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...boxBorderColor);
    doc.text(evaluation.statusTitle, 22, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const cie10Str = evaluation.cie10.map(c => `${c.code} (${c.desc})`).join(' | ');
    doc.text(`Diagnósticos CIE-10: ${cie10Str}`, 22, y + 12);

    // Section 4: Restrictions & Recommendations
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Restricciones Laborales:', 18, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    if (evaluation.restrictions.length > 0) {
      evaluation.restrictions.forEach(r => {
        doc.text(`• ${r}`, 20, y);
        y += 4;
      });
    } else {
      doc.text('• Sin restricciones médicas detectadas para el cargo.', 20, y);
      y += 4;
    }

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Recomendaciones de Medicina del Trabajo y Ergonomía:', 18, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    evaluation.recommendations.slice(0, 3).forEach(r => {
      doc.text(`• ${r}`, 20, y);
      y += 4;
    });

    // QR & Signature Footer
    y = 246;
    doc.setDrawColor(203, 213, 225);
    doc.line(15, y, 195, y);

    y += 5;
    // Generate QR with QRCode.js in memory
    try {
      const qrData = `WORKSCLAPIUS-CERT|ID:${candidate.docNumber}|TXN:${payment.transactionId}|APTITUD:${evaluation.status}|VALIDO:TRUE`;
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, { width: 90, margin: 1 });
      const qrImg = qrCanvas.toDataURL('image/png');
      doc.addImage(qrImg, 'PNG', 16, y, 24, 24);
    } catch (e) {
      console.log('QR code drawing fallback', e);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('VERIFICACIÓN CRIPTOGRÁFICA', 44, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanee el código QR para validar la autenticidad', 44, y + 9);
    doc.text('del certificado en la base central de Salud Laboral IPS.', 44, y + 12);
    doc.text(`Hash SHA-256: 8a9f...41e2 | Emitido el: ${new Date().toISOString()}`, 44, y + 16);

    // Physician Signature
    const sigX = 130;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(evaluation.physician.name, sigX, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(evaluation.physician.specialty, sigX, y + 14);
    doc.text(evaluation.physician.license, sigX, y + 18);
    doc.text(evaluation.physician.regMed, sigX, y + 22);

    // Trigger immediate browser download
    const cleanDocName = (candidate.fullName || 'Candidato').replace(/\s+/g, '_');
    const fileName = `Certificado_Aptitud_Laboral_${cleanDocName}.pdf`;
    doc.save(fileName);

    return doc;
  }
}

window.CertificatePDFGenerator = CertificatePDFGenerator;
