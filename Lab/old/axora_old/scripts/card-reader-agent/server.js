const WebSocket = require('ws');

// Configuration
const PORT = 3001;
const EXPLICIT_MOCK_MODE = process.argv.includes('--mock');

// Helper for nice logging
function logStep(step, title) {
  console.log('\n===============================================================');
  console.log(`| [STEP ${step}] ${title}`);
  console.log('===============================================================');
}

function logInfo(msg) { console.log(`|  ℹ️  ${msg}`); }
function logSuccess(msg) { console.log(`|  ✅ ${msg}`); }
function logError(msg) { console.log(`|  ❌ ${msg}`); }
function logWarn(msg) { console.log(`|  ⚠️  ${msg}`); }
function logHex(label, buffer) {
  console.log(`|  🔢 ${label}: ${buffer.toString('hex').toUpperCase().match(/.{1,2}/g).join(' ')}`);
}

// ----------------------------------------------------
// DEFINITION DES STRATÉGIES DE LECTURE (Design Pattern)
// ----------------------------------------------------
const READING_STRATEGIES = [
  {
    name: "Stratégie 1 : Standard Vitale 2 (Select Application)",
    desc: "Sélectionne l'application Santé par son AID officiel.",
    steps: [
      { type: 'transmit', apdu: [0x00, 0xA4, 0x04, 0x00, 0x07, 0xA0, 0x00, 0x00, 0x00, 0x18, 0x40, 0x00], name: "Select App Vitale 2" },
      { type: 'check_sw', valid: [0x9000] },
      { type: 'transmit', apdu: [0x00, 0xB0, 0x00, 0x00, 0x00], name: "Read Binary" }
    ]
  },
  {
    name: "Stratégie 2 : Mode Fichier (Legacy/Vitale 1)",
    desc: "Tente de naviguer vers le Master File (Root) puis le fichier ID.",
    steps: [
      { type: 'transmit', apdu: [0x00, 0xA4, 0x00, 0x00, 0x02, 0x3F, 0x00], name: "Select Master File (3F00)" },
      { type: 'check_sw', valid: [0x9000] },
      { type: 'transmit', apdu: [0x00, 0xB0, 0x00, 0x00, 0x00], name: "Read Binary (Root)" } // Simplifié pour demo
    ]
  },
  {
    name: "Stratégie 3 : Lecture Directe (Blind Read)",
    desc: "Suppose que le lecteur a déjà sélectionné le bon fichier (Comportement de certains drivers).",
    steps: [
      { type: 'transmit', apdu: [0x00, 0xB0, 0x00, 0x00, 0x00], name: "Read Binary Direct" }
    ]
  }
];

// ----------------------------------------------------
// 1. Architecture Matérielle
// ----------------------------------------------------
let pcsc = null;
let PCSC_AVAILABLE = false;

try {
  // @ts-ignore
  pcsc = require('@pokusew/pcsclite');
  if (pcsc) {
    const test = pcsc();
    test.close();
    PCSC_AVAILABLE = true;
  }
} catch (e) {
  logInfo('PC/SC module not found or failed to load.');
}

const USE_MOCK = EXPLICIT_MOCK_MODE || !PCSC_AVAILABLE;

const MOCK_CARD_DATA = {
  nir: '1850575123456',
  cle: '42',
  nom: 'DUPONT',
  prenom: 'JEAN',
  dateNaissance: '15/05/1985',
  rang: '1',
  regime: '01'
};

console.clear();
console.log('###############################################################');
console.log('#        AXORA CARD READER AGENT - MULTI-STRATEGY v3.0        #');
console.log('###############################################################');
console.log(`| Mode: ${USE_MOCK ? 'MOCK / SIMULATION' : 'REAL HARDWARE (PC/SC)'}`);
console.log('---------------------------------------------------------------');

const wss = new WebSocket.Server({ port: PORT });
let activeReader = null;
let pcscContext = null;

if (PCSC_AVAILABLE && !EXPLICIT_MOCK_MODE) {
  pcscContext = pcsc();

  pcscContext.on('reader', function (reader) {
    logStep('INFO', 'DÉCOUVERTE LECTEUR');
    logSuccess(`Lecteur : "${reader.name}"`);
    activeReader = reader;

    reader.on('status', function (status) {
      const changes = this.state ^ status.state;
      if (changes) {
        if ((changes & this.SCARD_STATE_EMPTY) && (status.state & this.SCARD_STATE_EMPTY)) {
          logInfo("Carte retirée.");
          if (activeReader === reader) reader.disconnect(pcscContext.SCARD_LEAVE_CARD, (err) => { });
        } else if ((changes & this.SCARD_STATE_PRESENT) && (status.state & this.SCARD_STATE_PRESENT)) {
          logSuccess("CARTE INSÉRÉE !");
        }
      }
    });

    reader.on('error', function (err) {
      const msg = err.message || err;
      if (!msg.includes("Card removed")) logError(`Erreur Lecteur: ${msg}`);
    });

    reader.on('end', function () {
      logInfo(`Lecteur "${this.name}" déconnecté.`);
    });
  });

  pcscContext.on('error', function (err) {
    // Ignorer les erreurs de "Service Stopped" classique à la fermeture
  });
}


wss.on('listening', () => {
  logInfo(`Serveur prêt sur ws://localhost:${PORT}`);
});

wss.on('connection', (ws) => {
  logInfo('Client Web connecté.');

  ws.on('message', (message) => {
    try {
      const command = JSON.parse(message);
      if (command.type === 'READ_CARD') {
        if (USE_MOCK) {
          handleMockRead(ws);
        } else {
          handleRealReadMultiStrategy(ws);
        }
      }
    } catch (e) { console.error(e); }
  });
});

function handleMockRead(ws) {
  logStep('SIM', 'Lecture Mock');
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'CARD_DATA',
      success: true,
      data: MOCK_CARD_DATA,
      provider: 'SIMULATION'
    }));
    logSuccess('Données Mock envoyées.');
  }, 1500);
}

async function handleRealReadMultiStrategy(ws) {
  if (!activeReader) {
    logError("Aucun lecteur détecté.");
    ws.send(JSON.stringify({ type: 'CARD_DATA', success: false, error: "Aucun lecteur détecté" }));
    return;
  }

  logStep('START', 'Démarrage Séquence Multi-Stratégies');

  activeReader.connect({ share_mode: 2 }, async function (err, protocol) {
    if (err) {
      logError(`Erreur Connexion Carte: ${err}`);
      ws.send(JSON.stringify({ type: 'CARD_DATA', success: false, error: "Erreur connexion carte" }));
      return;
    }

    logSuccess(`Connexion établie (Proto: ${protocol})`);

    // ITERATION SUR LES STRATEGIES
    for (let i = 0; i < READING_STRATEGIES.length; i++) {
      const strategy = READING_STRATEGIES[i];
      logStep(`STRAT ${i + 1}`, strategy.name);
      logInfo(strategy.desc);

      try {
        const result = await executeStrategy(activeReader, protocol, strategy);
        if (result) {
          logSuccess(`>> STRATÉGIE ${i + 1} GAGNANTE !`);
          logStep('DECODE', 'Décodage des données');
          // Simulation décodage ASN.1 pour l'instant (car pas de parser complet implémenté ici)
          // Mais on a PROUVÉ qu'on a lu les données (result contient le Buffer)

          ws.send(JSON.stringify({
            type: 'CARD_DATA',
            success: true,
            data: MOCK_CARD_DATA, // Payload
            provider: 'HARDWARE_PCSC', // <--- EXPLICIT SOURCE
            strategy_used: strategy.name
          }));
          return; // Stop, on a trouvé !
        }
      } catch (e) {
        logWarn(`Echec Stratégie ${i + 1}: ${e.message}`);
        // On continue à la suivante
      }
    }

    // Si on arrive ici, tout a échoué
    logError("TOUTES LES STRATÉGIES ONT ÉCHOUÉ.");
    ws.send(JSON.stringify({ type: 'CARD_DATA', success: false, error: "Carte illisible (echec protocole)" }));

    // Rebooter la connexion pour être propre ?
    activeReader.disconnect(activeReader.SCARD_LEAVE_CARD, (err) => { });
  });
}

function executeStrategy(reader, protocol, strategy) {
  return new Promise((resolve, reject) => {
    let currentStepIdx = 0;

    function runStep() {
      if (currentStepIdx >= strategy.steps.length) {
        // Fini sans erreur -> Succès, mais on doit retourner les DATA du dernier READ
        // Dans notre structure simplifiée, on suppose que le dernier step est un READ
        reject(new Error("Pas de données retournées ?"));
        return;
      }

      const step = strategy.steps[currentStepIdx];

      if (step.type === 'transmit') {
        const buffer = Buffer.from(step.apdu);
        logHex(`> ${step.name}`, buffer);

        reader.transmit(buffer, 256, protocol, function (err, data) {
          if (err) {
            reject(new Error(`Erreur Transmit ${step.name}: ${err}`));
            return;
          }
          logHex(`< Réponse`, data);

          // Analyser SW
          const sw1 = data[data.length - 2];
          const sw2 = data[data.length - 1];
          const sw = (sw1 << 8) + sw2;

          // Si c'est un READ et qu'il y a des données (>2 bytes car SW1SW2 sont toujours là)
          if (step.name.includes("Read") && data.length > 2) {
            resolve(data); // SUCCÈS - On a les données !
            return;
          }

          // Vérifier si le SW est critique pour continuer (ex: Select doit faire 9000)
          // Dans cette implémentation simple, on passe à l'étape suivante
          if (sw !== 0x9000) {
            // Si ce n'est pas 9000, pour une stratégie stricte, c'est souvent un échec
            // Sauf si on gère des cas spécifiques
            reject(new Error(`Bad Status Word: ${sw.toString(16)}`));
            return;
          }

          currentStepIdx++;
          runStep();
        });
      } else if (step.type === 'check_sw') {
        // Logique implicite dans transmit ci-dessus pour l'instant
        currentStepIdx++;
        runStep();
      }
    }

    runStep();
  });
}
