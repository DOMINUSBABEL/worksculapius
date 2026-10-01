/**
 * WORKSCLAPIUS - Servidor Híbrido: Agente de WhatsApp (Baileys) + Portal Clínico Telemático
 * Arquitectura integrada estilo JusticIA / Alaricus
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Baileys WhatsApp Engine
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcodeTerminal = require('qrcode-terminal');

const PORT = process.env.PORT || 3000;
const AUTH_FOLDER = path.join(__dirname, 'whatsapp_auth_info');
const SESSIONS_FILE = path.join(__dirname, 'exam_sessions.json');

if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER, { recursive: true });

// Almacén de sesiones en memoria y archivo
let examSessions = new Map();
if (fs.existsSync(SESSIONS_FILE)) {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([k, v]) => examSessions.set(k, v));
  } catch (e) {
    examSessions = new Map();
  }
}

function persistSessions() {
  const obj = {};
  examSessions.forEach((v, k) => { obj[k] = v; });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
}

// Estados conversacionales de usuarios de WhatsApp: senderJid -> state
const userConversations = new Map();

// Express App
const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Servir archivos estáticos del portal clínico
app.use(express.static(__dirname));

// API: Obtener datos de sesión por token
app.get('/api/session/:token', (req, res) => {
  const token = req.params.token;
  if (examSessions.has(token)) {
    res.json({ success: true, session: examSessions.get(token) });
  } else {
    res.status(404).json({ success: false, message: 'Sesión no encontrada o expirada' });
  }
});

// API: Notificación de Examen Finalizado desde la Web (Dispara envío de PDF a WhatsApp)
app.post('/api/exam/complete', async (req, res) => {
  const { token, pdfBase64, candidate, evaluation } = req.body;
  console.log(`\n📥 [API Examen Completo] Recibido dictamen para token: ${token}`);

  let session = examSessions.get(token);
  if (!session) {
    session = { candidate, evaluation, token };
  } else {
    session.evaluation = evaluation;
    session.completedAt = new Date().toISOString();
  }
  examSessions.set(token, session);
  persistSessions();

  // Si hay un socket de WhatsApp activo y la sesión tiene JID de origen, despachar PDF
  if (waSocketInstance && session.senderJid && pdfBase64) {
    try {
      console.log(`📤 [WhatsApp Dispatch] Enviando Certificado PDF a: ${session.senderJid}...`);
      const pdfBuffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      
      const cleanName = (candidate.fullName || 'Postulante').replace(/\s+/g, '_');
      const fileName = `Certificado_Aptitud_Laboral_${cleanName}.pdf`;

      const captionMsg = 
        `🎉 *¡Tu Certificado Médico Ocupacional ha sido emitido!*\n\n` +
        `👤 *Postulante:* ${candidate.fullName}\n` +
        `🆔 *Cédula:* ${candidate.docNumber}\n` +
        `💼 *Cargo:* ${candidate.jobTitle}\n` +
        `🏢 *Empresa:* ${candidate.companyName}\n` +
        `📋 *Concepto de Aptitud:* *${evaluation.statusTitle}*\n\n` +
        `Adjunto encuentras tu documento oficial en formato PDF conforme a la *Resolución 2346 de 2007* con firma médica digital y código QR de validación legal.`;

      await waSocketInstance.sendMessage(session.senderJid, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: fileName,
        caption: captionMsg
      });

      console.log(`✅ [WhatsApp Dispatch] Certificado enviado con éxito.`);
    } catch (err) {
      console.error('❌ Error enviando PDF por WhatsApp:', err);
    }
  }

  res.json({ success: true, message: 'Examen registrado y certificado despachado' });
});

// Inicialización del Servidor HTTP
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`\n========================================================================`);
  console.log(`⚕️  WORKSCLAPIUS CLINICAL SERVER & WHATSAPP AGENT (RES. 2346/2007)`);
  console.log(`🌐 Portal Web Telemático activo en: http://localhost:${PORT}`);
  console.log(`========================================================================\n`);
});

// ============================================================================
// MOTOR DE WHATSAPP CON BAILEYS (Estilo JusticIA / Alaricus)
// ============================================================================

let waSocketInstance = null;
let isConnectingWA = false;

async function startWhatsAppBot() {
  if (isConnectingWA) return;
  isConnectingWA = true;

  try {
    const pinoLogger = pino({ level: 'silent' });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    const socketKeys = makeCacheableSignalKeyStore(state.keys, pinoLogger);

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: socketKeys
      },
      logger: pinoLogger,
      printQRInTerminal: true,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidNewsletter(jid) || isJidGroup(jid)
    });

    waSocketInstance = sock;
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n📲 [WhatsApp Auth] Escanea el siguiente código QR con tu WhatsApp para vincular el agente:\n');
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
        console.log(`⚠️ Conexión de WhatsApp cerrada. Reconectando: ${shouldReconnect}...`);
        isConnectingWA = false;
        if (shouldReconnect) {
          setTimeout(startWhatsAppBot, 5000);
        }
      } else if (connection === 'open') {
        console.log('\n✅ [WhatsApp Conectado] Agente de Salud Laboral IPS en línea y listo para recibir postulantes.');
        isConnectingWA = false;
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        if (!senderJid || senderJid.endsWith('@g.us')) continue;

        const text = (
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          ''
        ).trim();

        if (!text) continue;
        console.log(`📩 [WhatsApp Mensaje] De ${senderJid}: "${text}"`);

        await handleWhatsAppConversation(sock, senderJid, text);
      }
    });

  } catch (e) {
    console.error('Error inicializando WhatsApp Baileys:', e);
    isConnectingWA = false;
  }
}

async function handleWhatsAppConversation(sock, senderJid, text) {
  let userState = userConversations.get(senderJid) || { step: 0, candidate: {} };

  // Paso 0: Bienvenida inicial
  if (userState.step === 0) {
    userState.step = 1;
    userConversations.set(senderJid, userState);

    const welcomeMsg = 
      `¡Hola! 👋 Te damos la bienvenida a la línea oficial de *Salud Laboral IPS* asistida por *Worksculapius*.\n\n` +
      `Soy tu asistente médico virtual para la realización de tu *Examen Médico Preocupacional (Ingreso Laboral)* conforme a la Resolución 2346 de 2007.\n\n` +
      `Para comenzar, por favor escríbeme tu *Nombre Completo*:`;

    await sock.sendMessage(senderJid, { text: welcomeMsg });
    return;
  }

  // Paso 1: Captura de Nombre
  if (userState.step === 1) {
    userState.candidate.fullName = text;
    userState.step = 2;
    userConversations.set(senderJid, userState);

    await sock.sendMessage(senderJid, {
      text: `Mucho gusto, *${text}*. 📋\n\nPor favor indícanos tu *Número de Cédula o Documento de Identidad*:`
    });
    return;
  }

  // Paso 2: Captura de Documento
  if (userState.step === 2) {
    userState.candidate.docNumber = text;
    userState.step = 3;
    userConversations.set(senderJid, userState);

    await sock.sendMessage(senderJid, {
      text: `Gracias. ¿A qué *Cargo o Puesto de Trabajo* aspiras ingresar?\n\n_(Ejemplos: Conductor, Operario de Planta, Asistente Administrativo, Técnico de Alturas, Bodeguero)_:`
    });
    return;
  }

  // Paso 3: Captura de Cargo
  if (userState.step === 3) {
    userState.candidate.jobTitle = text;
    userState.step = 4;
    userConversations.set(senderJid, userState);

    await sock.sendMessage(senderJid, {
      text: `Excelente. ¿Para cuál *Empresa o Razón Social* vas a laborar? _(O escribe 'Particular / Independiente')_:`
    });
    return;
  }

  // Paso 4: Captura de Empresa y Generación del Token de Enlace Web
  if (userState.step === 4) {
    userState.candidate.companyName = text;
    userState.step = 5;

    // Generar Token de sesión único
    const token = 'EXAM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    const sessionData = {
      token,
      senderJid,
      candidate: userState.candidate,
      createdAt: new Date().toISOString()
    };

    examSessions.set(token, sessionData);
    persistSessions();
    userConversations.set(senderJid, userState);

    const examUrl = `http://localhost:${PORT}/?token=${token}`;

    const linkMsg = 
      `✅ *¡Cita Ocupacional Programada con Éxito!*\n\n` +
      `👤 *Postulante:* ${userState.candidate.fullName}\n` +
      `🆔 *Documento:* ${userState.candidate.docNumber}\n` +
      `💼 *Cargo:* ${userState.candidate.jobTitle}\n` +
      `🏢 *Empresa:* ${userState.candidate.companyName}\n\n` +
      `Tu evaluación telemática incluye:\n` +
      `1️⃣ *Anamnesis Ocupacional Oficial* (Res. 2346/2007)\n` +
      `2️⃣ *Visiometría Digital* (Agudeza Snellen + Ishihara para daltonismo)\n` +
      `3️⃣ *Audiometría Tonal Binaural* (Web Audio API en frecuencias 500-8000 Hz)\n\n` +
      `🔗 *Haz clic aquí para ingresar a la plataforma clínica y realizar tus exámenes:*\n` +
      `${examUrl}\n\n` +
      `_(Se recomienda realizar la prueba con audífonos puestos y a 50 cm de la pantalla. Al finalizar, tu certificado médico en PDF con código QR y firma digital se te enviará automáticamente por este mismo chat)._`;

    await sock.sendMessage(senderJid, { text: linkMsg });
    return;
  }

  // Si ya tiene sesión activa
  if (userState.step === 5) {
    await sock.sendMessage(senderJid, {
      text: `Ya tienes una orden de examen abierta. Ingresa al enlace enviado anteriormente para completar tus pruebas de visiometría y audiometría.`
    });
  }
}

// Iniciar bot de WhatsApp (si Baileys está instalado)
try {
  startWhatsAppBot();
} catch (e) {
  console.log('WhatsApp Baileys no inicializado aún.');
}
