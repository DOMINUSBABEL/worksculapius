/**
 * WORKSCLAPIUS - Servidor Híbrido: Agente de WhatsApp (Baileys) + Portal Clínico Telemático
 * Conforme a la regla global de canal enlazado, anti-bucles y activación estricta
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

// Almacén de sesiones clínicas en memoria y archivo
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

// Desempaquetador seguro de mensajes
function extractMessageText(rawMsg) {
  if (!rawMsg) return '';
  const message = rawMsg.ephemeralMessage?.message ||
                  rawMsg.viewOnceMessage?.message ||
                  rawMsg.viewOnceMessageV2?.message ||
                  rawMsg.documentWithCaptionMessage?.message ||
                  rawMsg;

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.documentMessage?.caption ||
    ''
  ).trim();
}

// Express App
const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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

// Ignorar advertencias no críticas de Signal
const originalConsoleError = console.error;
console.error = function(...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : (a?.message || ''))).join(' ');
  if (msg.includes('Failed to decrypt message') || msg.includes('Bad MAC') || msg.includes('MessageCounterError') || msg.includes('SessionEntry')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('Connection Closed') || msg.includes('prekey') || msg.includes('SessionEntry') || msg.includes('428') || msg.includes('440')) {
    return;
  }
  console.warn('⚠️ [UnhandledRejection Warning]:', msg);
});

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
        const userJid = sock.user ? sock.user.id.replace(/:.*@/, '@') : 'Desconocido';
        console.log('\n========================================================================');
        console.log(`✅ [WhatsApp Conectado] Agente de Salud Laboral IPS en línea.`);
        console.log(`📱 Línea Activa Enlazada: [${userJid}]`);
        console.log(`🔑 Canal Autorizado: Conversación con el mismo número enlazado o comandos (!examen, !hola)`);
        console.log('========================================================================\n');
        isConnectingWA = false;
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message) continue;

        const senderJid = msg.key.remoteJid;
        if (!senderJid || isJidGroup(senderJid) || isJidBroadcast(senderJid) || isJidNewsletter(senderJid)) continue;

        const text = extractMessageText(msg.message);
        if (!text) continue;

        // Anti-Echo Guard: Si el texto contiene la firma del bot, ignorar para evitar bucles
        if (text.includes('Salud Laboral IPS') || text.includes('Worksculapius') || text.includes('EXAM-') || text.includes('Certificado_Aptitud_Laboral')) {
          continue;
        }

        // Identificación del canal enlazado propio (Self-Chat)
        const myJid = sock.user ? sock.user.id.replace(/:.*@/, '@') : '';
        const myLid = sock.user?.lid ? sock.user.lid.replace(/:.*@/, '@') : '';
        const myCleanNumber = myJid ? myJid.replace(/[^0-9]/g, '') : '';
        const senderNumber = senderJid.replace(/[^0-9]/g, '');

        const isSelfChat = (senderJid === myJid) || (myLid && senderJid === myLid) || (myCleanNumber && senderNumber.includes(myCleanNumber));
        const isActivationBang = text.toLowerCase().startsWith('!examen') || 
                                 text.toLowerCase().startsWith('!hola') || 
                                 text.toLowerCase().startsWith('!salud') || 
                                 text.toLowerCase().startsWith('!start');

        // REGLA GLOBAL: Solo atender si es el canal de conversación con el propio número enlazado
        // O si inicia con un comando de activación explícito en canales autorizados
        const isSessionOngoing = userConversations.has(senderJid);

        if (!isSelfChat && !isActivationBang && !isSessionOngoing) {
          // Ignorar conversaciones ajenas cotidianas para no interferir
          continue;
        }

        console.log(`\n📩 [WhatsApp Inbound] De: [${senderNumber}] | SelfChat: ${isSelfChat} | Msg: "${text}"`);

        await handleWhatsAppConversation(sock, senderJid, text, isSelfChat);
      }
    });

  } catch (e) {
    console.error('Error inicializando WhatsApp Baileys:', e);
    isConnectingWA = false;
  }
}

async function handleWhatsAppConversation(sock, senderJid, text, isSelfChat) {
  let userState = userConversations.get(senderJid) || { step: 0, candidate: {} };

  const cleanText = text.replace(/^!([a-zA-Z0-9]+)\s*/i, '').trim();

  // Si el usuario escribe "!examen" o "!reiniciar" en cualquier momento, reinicia el flujo
  if (text.toLowerCase().includes('!reiniciar') || text.toLowerCase() === '!examen' || text.toLowerCase() === '!start') {
    userState = { step: 0, candidate: {} };
    userConversations.delete(senderJid);
  }

  // Paso 0: Bienvenida inicial y entrega inmediata del enlace telemático
  if (userState.step === 0) {
    userState.step = 1;

    // Generar Token de sesión inmediatamente para permitir acceso rápido
    const token = 'EXAM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    userState.token = token;
    userState.candidate = {
      fullName: 'Postulante Ocupacional',
      docNumber: senderJid.replace(/[^0-9]/g, ''),
      jobTitle: 'Aspirante General',
      companyName: 'Empresa Contratante'
    };

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

    const welcomeMsg = 
      `¡Hola! 👋 Te damos la bienvenida a la línea oficial de *Salud Laboral IPS* asistida por *Worksculapius*.\n\n` +
      `Tu orden de *Examen Médico Preocupacional (Ingreso Laboral)* conforme a la *Resolución 2346 de 2007* ha sido habilitada.\n\n` +
      `🚀 *Puedes ingresar inmediatamente a realizar tus pruebas en:*\n` +
      `🔗 ${examUrl}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *¿Deseas personalizar tu ficha antes de iniciar?*\n` +
      `Por favor responde a este mensaje con tu *Nombre Completo* (o haz clic directo en el enlace de arriba).`;

    await sock.sendMessage(senderJid, { text: welcomeMsg });
    return;
  }

  // Paso 1: Captura de Nombre
  if (userState.step === 1) {
    if (cleanText) userState.candidate.fullName = cleanText;
    userState.step = 2;
    userConversations.set(senderJid, userState);

    // Actualizar sesión persistida
    if (examSessions.has(userState.token)) {
      const sess = examSessions.get(userState.token);
      sess.candidate = userState.candidate;
      persistSessions();
    }

    await sock.sendMessage(senderJid, {
      text: `Mucho gusto, *${userState.candidate.fullName}*. 📋\n\nPor favor indícanos tu *Número de Cédula o Documento de Identidad*:`
    });
    return;
  }

  // Paso 2: Captura de Documento
  if (userState.step === 2) {
    if (cleanText) userState.candidate.docNumber = cleanText;
    userState.step = 3;
    userConversations.set(senderJid, userState);

    if (examSessions.has(userState.token)) {
      const sess = examSessions.get(userState.token);
      sess.candidate = userState.candidate;
      persistSessions();
    }

    await sock.sendMessage(senderJid, {
      text: `Documento registrado: *${userState.candidate.docNumber}*.\n\n¿A qué *Cargo o Puesto de Trabajo* aspiras ingresar?\n_(Ejemplos: Conductor, Operario de Planta, Asistente Administrativo, Trabajo en Alturas)_:`
    });
    return;
  }

  // Paso 3: Captura de Cargo
  if (userState.step === 3) {
    if (cleanText) userState.candidate.jobTitle = cleanText;
    userState.step = 4;
    userConversations.set(senderJid, userState);

    if (examSessions.has(userState.token)) {
      const sess = examSessions.get(userState.token);
      sess.candidate = userState.candidate;
      persistSessions();
    }

    await sock.sendMessage(senderJid, {
      text: `Excelente. ¿Para cuál *Empresa o Razón Social* vas a laborar? _(O escribe 'Particular / Independiente')_:`
    });
    return;
  }

  // Paso 4: Captura de Empresa y Confirmación Final con Enlace Actualizado
  if (userState.step === 4) {
    if (cleanText) userState.candidate.companyName = cleanText;
    userState.step = 5;

    if (examSessions.has(userState.token)) {
      const sess = examSessions.get(userState.token);
      sess.candidate = userState.candidate;
      persistSessions();
    }
    userConversations.set(senderJid, userState);

    const examUrl = `http://localhost:${PORT}/?token=${userState.token}`;

    const linkMsg = 
      `✅ *¡Ficha Ocupacional Actualizada al 100%!* 🎉\n\n` +
      `👤 *Postulante:* ${userState.candidate.fullName}\n` +
      `🆔 *Documento:* ${userState.candidate.docNumber}\n` +
      `💼 *Cargo:* ${userState.candidate.jobTitle}\n` +
      `🏢 *Empresa:* ${userState.candidate.companyName}\n\n` +
      `🔗 *Haz clic aquí para ingresar a tu evaluación telemática:*\n` +
      `${examUrl}\n\n` +
      `_(Al finalizar tus pruebas de Visiometría y Audiometría en la página web, tu Certificado Oficial en PDF con firma médica y código QR se te despachará automáticamente por este mismo chat)._`;

    await sock.sendMessage(senderJid, { text: linkMsg });
    return;
  }

  // Paso 5: Ya tiene el enlace activo
  if (userState.step === 5) {
    const examUrl = `http://localhost:${PORT}/?token=${userState.token}`;
    await sock.sendMessage(senderJid, {
      text: `Tu orden de examen médico ocupacional sigue activa.\n\nPuedes ingresar a completar tus pruebas en:\n🔗 ${examUrl}\n\n_(Si deseas reiniciar tu registro con otros datos, escribe *!reiniciar*)_`
    });
  }
}

// Iniciar bot de WhatsApp Baileys
startWhatsAppBot();
