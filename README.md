# ⚕️ WORKSCLAPIUS
### Plataforma y Motor Autónomo de Exámenes Médicos Ocupacionales Asistidos por IA

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Normative](https://img.shields.io/badge/Normatividad-Res.%202346%2F2007%20MinSalud-blue.svg)](https://www.minsalud.gov.co)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-Binaural%20Puro-cyan.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> **Worksculapius** es una solución telemática de salud ocupacional diseñada para digitalizar, automatizar y escalar la realización de exámenes médicos preocupacionales (ingreso laboral) para **IPSs (Instituciones Prestadoras de Salud)**, empresas y trabajadores particulares.

---

## 📌 1. El Concepto y Modelo de Negocio

En el modelo tradicional de medicina del trabajo:
1. Una empresa envía a sus postulantes a una sede física de una IPS.
2. El candidato pierde entre 3 a 5 horas esperando turno en salas saturadas para pruebas estandarizadas (cuestionario, visiometría, audiometría).
3. La IPS incurre en altos costos fijos de personal, infraestructura y equipos de audiometría/optometría física.

**Worksculapius transforma este flujo:**
- **Venta B2B a IPSs:** La IPS adquiere la plataforma como marca blanca o canal digital adicional, multiplicando su capacidad de atención sin aumentar nómina ni espacio físico.
- **Canal Omnicanal por WhatsApp:** Un chatbot inteligente agenda al trabajador, recopila sus datos y genera un enlace seguro de acceso inmediato.
- **Examen Telemático Guiado:** El postulante realiza desde su computadora o móvil:
  - **Anamnesis clínica legal** (Res. 2346/2007).
  - **Visiometría digital** (Agudeza Snellen + Ishihara para daltonismo).
  - **Audiometría tonal interactiva** (Web Audio API binaural con frecuencias 500-8000 Hz y tonos puros en cadencia).
- **Dictamen Clínico IA & Emisión de Certificado:** Un motor clínico evalúa la aptitud laboral (*Apto*, *Apto con restricciones*, *Aplazado*), asigna códigos CIE-10 y expide el Certificado Oficial de Aptitud Laboral en PDF con **firma digital y código QR de validación criptográfica**, tras la confirmación de pago o liquidación corporativa.

---

## 🚀 2. Arquitectura de Módulos

```
worksculapius/
├── index.html                   # Shell SPA con router de vistas y diseño Glassmorphism
├── css/
│   └── styles.css               # Sistema de diseño clínico de alta gama (Impeccable Taste)
├── js/
│   ├── app.js                   # Orquestador central, máquina de estados y persistencia
│   ├── whatsapp-simulator.js   # Simulador interactivo de bot de WhatsApp para agendamiento
│   ├── questionnaire.js         # Anamnesis ocupacional oficial (Res. 2346/2007)
│   ├── visiometry.js            # Visiometría (Agudeza Snellen interactiva + Ishihara daltonismo)
│   ├── audiometry.js            # Audiómetro digital nativo con Web Audio API y trazado de Audiograma
│   ├── clinical-ai.js           # Inferencia clínica IA, triaje de aptitud laboral y CIE-10
│   ├── payment.js               # Checkout simulado para desbloqueo y monetización
│   ├── certificate-pdf.js       # Generador de Certificado Oficial en PDF con audiograma incrustado y QR
│   └── dashboard.js             # Panel B2B para la IPS con KPIs, filtros y exportación CSV
└── vercel.json                  # Configuración para despliegue serverless instantáneo
```

---

## 🧪 3. Especificaciones Técnicas

### Audiometría Tonal con Web Audio API
- **Generación de Frecuencias Puras:** Osciladores sinusoidales en frecuencias vocales e industriales: `500 Hz, 1000 Hz, 2000 Hz, 3000 Hz, 4000 Hz, 8000 Hz`.
- **Canalización Estéreo Real:** Aislamiento de canal mediante `StereoPannerNode` (`pan = 1.0` para Oído Derecho, `pan = -1.0` para Oído Izquierdo).
- **Cadencia de Pulsos:** Secuencia periódica de 3 beeps sucesivos de 200 ms con intervalos de silencio (*"pi-pi-pi"*) para máxima perceptibilidad contra acúfenos.
- **Audiograma Clínico Vectorial:** Trazado en Canvas con escala logarítmica de frecuencia vs. nivel de audición en dB HL invertido (estándar ISO 8253-1).

### Visiometría Digital
- **Optotipos Dinámicos:** Letra E de Snellen rotatoria en 4 cuadrantes angulares con escalado progresivo (20/100 hasta 20/20).
- **Test de Ishihara:** Láminas pseudo-isocromáticas generadas algorítmicamente para detección de discromatopsias rojo-verde.

---

## 💻 4. Ejecución Local y Despliegue

### Ejecución Local Rápida:
```powershell
# En PowerShell:
python -m http.server 3000 --directory "C:\Users\jegom\.gemini\antigravity\scratch\worksculapius"
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Despliegue en la Nube (Vercel):
```powershell
cd C:\Users\jegom\.gemini\antigravity\scratch\worksculapius
npx vercel --prod
```

---

## ⚖️ 5. Cumplimiento Normativo (Colombia / Internacional)
- **Resolución 2346 de 2007** del Ministerio de la Protección Social de Colombia.
- **Criterios OIT** para la vigilancia de la salud en el lugar de trabajo.
- **Ley Estatutaria 1581 de 2012** (Tratamiento y protección de datos médicos sensibles).
