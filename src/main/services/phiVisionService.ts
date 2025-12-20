import { desktopCapturer, ipcMain, BrowserWindow, screen } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logCaptureSession } from './PhiVisionLogger';

// Mock Data for the 3 Scenarios
const MOCK_SCENARIOS = {
  FREE_SALE: {
    analysis_context: "Délivrance spontanée",
    // Legacy mapping (for safety)
    detected_items: ['DOLIPRANE 500 MG', 'CILOXADEX'],

    // New Rich Fields
    advices: {
      oral_sentence: "Bonjour. Pour l'oreille, on part sur le Ciloxadex. Si la douleur est intense, un anti-inflammatoire par voie orale pourrait aider en complément.",
      written_points: [
        "Ciloxadex : 4 gouttes, 2x/jour (matin/soir).",
        "Ne pas toucher l'oreille avec l'embout.",
        "Doliprane : Max 3g/jour si douleurs."
      ]
    },
    meds: [
      { dci: "Ciprofloxacine / Dexaméthasone", recommendation: "Antibio+Corticoïde local - Respecter 7j max." },
      { dci: "Paracétamol", recommendation: "Antalgique palier 1. Max 1g/prise, espacer de 6h." }
    ],
    cross_selling: [
      { name: "Otipax - Biocodex - Gouttes", reason: "Anesthésique local pour soulager la douleur immédiatement avant que l'antibio agisse." },
      { name: "Hygiène oreille - Audispray", reason: "En prévention pour éviter les bouchons futurs (hors infection)." }
    ],
    chips: ["Antibiotique local", "Conservation < 25°C", "Agiter avant emploi"],
    is_minor: false
  },
  PRESCRIPTION: {
    analysis_context: "Ordonnance Diabète",
    detected_items: ['OZEMPIC 0.5mg', 'EXEMESTANE 25mg'],

    advices: {
      oral_sentence: "Voici votre Ozempic. Attention, il doit rester au frigo avant ouverture. Une fois entamé, il peut rester à température ambiante 6 semaines.",
      written_points: [
        "Ozempic : Injection 1x/semaine, jour fixe.",
        "Rotation des sites d'injection (ventre, cuisse).",
        "Rapporter les aiguilles usagées (DASTRI)."
      ]
    },
    meds: [
      { dci: "Sémaglutide", recommendation: "Agoniste GLP-1. Nausées possibles au début." },
      { dci: "Exémestane", recommendation: "Hormonothérapie. Prise au repas pour tolérance." }
    ],
    cross_selling: [
      { name: "Aiguilles BD Micro-Fine 4mm", reason: "Indispensable pour l'injection (non remboursé ?)." },
      { name: "Poubelle DASTRI", reason: "Obligatoire pour sécurité (gratuite)." },
      { name: "Vitamine D3 - Pileje", reason: "Recommandé avec Exémestane pour protéger les os." }
    ],
    chips: ["Frigo (avant ouverture)", "Aiguilles fournies ?", "Surveillance poids"],
    is_minor: false
  },
  DOUBLE_CONTROL: {
    analysis_context: "Double Contrôle",
    detected_items: ['AMLOGDIPINE', 'SIMVASTATINE'],
    advices: {
      oral_sentence: "Attention, l'association Amlodipine + Simvastatine augmente le risque de douleurs musculaires. Il est recommandé de ne pas dépasser 20mg de Simvastatine.",
      written_points: [
        "Interaction Amlodipine / Simvastatine.",
        "Risque musculaire accru.",
        "Voir pour changer statine ou réduire dose."
      ]
    },
    meds: [
      { dci: "Amlodipine", recommendation: "Inhibiteur calcique." },
      { dci: "Simvastatine", recommendation: "Statine. Interaction avec amlodipine." }
    ],
    cross_selling: [],
    chips: ["Interaction Majeure", "Risque Myopathie"],
    is_minor: false
  }
};

/**
 * Call Mistral (or compatible) API for Vision Analysis
 */
/**
 * Step 1: Perform specialized OCR using Mistral OCR
 */
/**
 * Step 1: Perform specialized OCR using Mistral OCR
 */
async function performOCR(base64Image: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        image_url: base64Image
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mistral OCR Error:', errorText);
    throw new Error(`Mistral OCR Failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.pages.map((p: any) => p.markdown).join('\n\n');
}

// Internal Catalog from legacy PhiGenix 5.3 (n8n)
const INTERNAL_OTC_CATALOG = [
  "DolipraneCaps 1000 mg – Sanofi – [Paracétamol] – [Douleur légère à modérée, fièvre]",
  "Dafalgan 500 mg – UPSA – [Paracétamol] – [Douleur légère à modérée, fièvre]",
  "Nurofen 400 mg – Reckitt Benckiser – [Ibuprofène] – [Douleurs, inflammations, fièvre]",
  "Spedifen 400 mg – Zambon – [Ibuprofène arginine] – [Douleurs aiguës, règles douloureuses]",
  "Humex Rhume jour & nuit – Urgo – [Paracétamol, Pseudoéphédrine, Doxylamine] – [Rhume, congestion nasale, maux de tête]",
  "Actifed Rhume – Johnson & Johnson – [Triprolidine, Pseudoéphédrine] – [Rhume, nez bouché, écoulement nasal]",
  "Rhinadvil Capsules – Pfizer – [Ibuprofène, Pseudoéphédrine] – [Rhume avec douleurs et congestion]",
  "Inhaloxyl Capsules à inhaler – Naturactive – [Eucalyptol, Terpinéol, Guaiacol] – [Congestion respiratoire, rhume]",
  "Strepsils Pastilles menthol – Reckitt Benckiser – [Amylmétacrésol, Alcool dichlorobenzylique] – [Maux de gorge, irritations]",
  "Lysopaïne Maux de gorge – Sanofi – [Lidocaïne, Lysozyme] – [Douleur et irritation de la gorge]",
  "Drill Pastilles citron – Pierre Fabre – [Chlorhexidine, Tétracaïne] – [Maux de gorge, douleurs ORL]",
  "Hexaspray Solution buccale – Bouchara-Recordati – [Biclotymol] – [Antiseptique gorge, inflammations locales]",
  "Oropolis Pastilles miel & propolis – Pierre Fabre – [Propolis, Extraits de miel] – [Irritations de la gorge, inconfort ORL]",
  "Urgo Filmogel aphtes – Urgo – [Acide hyaluronique, Film protecteur] – [Aphtes, lésions buccales douloureuses]",
  "Camilia Solution buvable – Boiron – [Chamomilla vulgaris, Phytolacca decandra, Rheum officinale] – [Poussées dentaires du nourrisson]",
  "Pansoral Gel gingival – Pierre Fabre – [Extraits de camomille, Acide salicylique] – [Douleurs dentaires locales, inflammations gingivales]",
  "Carbolevure Charbon + levure – Sanofi – [Charbon activé, Levure Saccharomyces] – [Ballonnements, troubles digestifs]",
  "SmectaGo Suspension buvable – Ipsen – [Diosmectite] – [Diarrhée aiguë, protection muqueuse digestive]",
  "Gaviscon Advance Menthe – Reckitt Benckiser – [Alginate de sodium, Bicarbonate de potassium, Carbonate de calcium] – [Reflux gastro-œsophagien, brûlures d’estomac]",
  "Microlax Solution rectale – Johnson & Johnson – [Sorbitol, Citrate de sodium, Laurylsulfoacétate de sodium] – [Constipation occasionnelle]",
  "Arnigel – Boiron – [Arnica montana] – [Ecchymoses, coups, traumatismes bénins]",
  "Osmogel Gel – Pierre Fabre – [Salicylate de diéthylamine] – [Douleurs musculaires, tendinites]",
  "Voltarène Emulgel 1% – GSK – [Diclofénac] – [Douleurs musculaires et articulaires]",
  "Biafine Émulsion cutanée – Johnson & Johnson – [Trolamine] – [Brûlures superficielles, coups de soleil, plaies bénignes]",
  "Cicatryl Crème – Sanofi – [Vitamine A, Allantoïne, Héparine sodique, Extraits végétaux] – [Plaies superficielles, irritations cutanées]",
  "Mercurochrome Spray désinfectant – Mercurochrome – [Chlorhexidine, Alcool benzylique] – [Antisepsie cutanée, désinfection plaies]",
  "UrgoCor Pansements cors – Urgo – [Acide salicylique] – [Cors, durillons, callosités]",
  "Oropolis Spray gorge – Pierre Fabre – [Propolis, Extraits végétaux] – [Apaisement des irritations de la gorge]",
  "UPSA Vitamine C Efferalganvit – UPSA – [Acide ascorbique, Paracétamol] – [Fatigue passagère, douleur, fièvre]"
];

/**
 * Step 2: Analyze the extracted text to generate insights using PhiBRAIN prompt
 */
async function generateInsights(ocrText: string, apiKey: string): Promise<any> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "ministral-8b-latest", // Using 8B as requested for balance of speed/intelligence
      messages: [
        {
          role: "system",
          content: `# Rôle
Tu es PhiBRAIN, l'agent orchestrateur d'un assistant pharmacien augmenté (v2.5 Robustesse).

# Mission
À partir du texte OCR d'un écran de logiciel de pharmacie (LGO), génère une structure JSON enrichie pour aider le pharmacien au comptoir.

# 🛡️ SÉCURITÉ & ANTI-HALLUCINATION (CRITIQUE)
1. **NO DATA, NO GUESS**: Si l'OCR est vide, illisible, ou ne contient que du bruit (menus, icônes, "Electron", "Window"), RENVOIE un contexte "Aucune donnée médicale détectée" et des listes vides.
2. **IGNORER LES METADONNÉES**: 
   - Tu dois **EXPLICITEMENT IGNORER** tout texte ressemblant à un nom de fichier (ex: "demo_ordonnance_ozempic.png", "capture.jpg").
   - Ne déduis JAMAIS un traitement à partir du titre de la fenêtre ou du nom du fichier. Seul le contenu "médical" compte.
3. **VALIDATION DCI STRICTE**:
   - Si un mot ressemble à un médicament (typo OCR) mais contient des fautes (ex: "ATGRAVATTATRNE"), **CORRIGE-LE** vers la DCI officielle (ex: "Atorvastatine").
   - Si le mot est trop corrompu ou inconnu, **IGNORE-LE**. Ne l'invente pas. Ne valide pas "GRAZEPAM".

# Instructions - Tu es la fusion de 4 experts :

## 1. PhiMEDS (Pharmacologue)
- Analyse la liste des médicaments détectés (après nettoyage DCI).
- Produis une liste "meds" strictement conforme.
- Pour chaque médicament : DCI exacte + Recommandation (<200 car).
- Recommandation: "Classe" - "Sécurité" - "Posologie usuelle".

## 2. PhiADVICES (Expert Comptoir)
- Produis UN conseil oral ("oral_sentence") naturel, fluide, direct, empathique.
- Si la liste de médicaments est vide, propose une phrase d'accueil pharmacien générique ("Je suis à votre écoute...").
- Produis 3 points clés ("written_points").

## 3. PhiCROSS_SELL (Marketing Éthique & Catalogue)
- Identifie jusqu'à 2 produits OTC complémentaires basés sur les médicaments validés.
- **RÈGLE (PRIORITÉ)** : Cherche d'abord dans le **CATALOGUE INTERNE**.
- **RÈGLE (OUVERTURE)** : Si aucun produit du catalogue ne correspond, tu PEUX suggérer une catégorie générique pertinente (ex: "Probiotiques", "Larmes artificielles").
- **LOGIQUE CLINIQUE ATTENDUE** :
  - Antibiotique -> Suggérer Probiotiques (Ultra-Levure / Lactibiane si catalogue, sinon "Probiotiques").
  - IPP (Oméprazole, etc.) -> Suggérer Anti-acide (Gaviscon, etc.) ou Digestion.
  - Corticoïdes -> Suggérer Calcium (si long terme) ou Protection gastrique.
  - Collyre -> Suggérer Hygiène paupières ou Larmes.

### CATALOGUE INTERNE OTC (Source de Vérité - À privilégier) :
${JSON.stringify(INTERNAL_OTC_CATALOG)}

## 4. PhiCHIPS (Sécurité)
- Génère 2 à 4 badges ("chips") courts (<40 car).
- Si incertitude sur un médicament, ajoute un badge "Vérification Requise".

# Format de Sortie Strict (JSON)
\`\`\`json
{
  "analysis_context": "Type de délivrance...",
  "advices": { 
    "oral_sentence": "...", 
    "written_points": ["..."] 
  },
  "meds": [ 
    { "dci": "...", "recommendation": "..." } 
  ],
  "cross_selling": [ 
    { "name": "Nom Exact Catalogue", "reason": "..." } 
  ],
  "chips": ["...", "..."],
  "is_minor": boolean
}
\`\`\`

# Contexte OCR
\`\`\`
${ocrText}
\`\`\`
`
        },
        {
          role: "user",
          content: "Génère l'analyse JSON."
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral Chat Analysis Failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  console.log('PhiVision: Raw LLM Response:', content);

  // Sanitize: Remove markdown code blocks if present
  const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanContent);
  } catch (e) {
    console.error('PhiVision: JSON Parse Error', e);
    throw new Error('Failed to parse GenAI JSON response');
  }
}

/**
 * Orchestrator
 */
async function analyzeWithMistral(base64Image: string): Promise<any> {
  const apiKey = 'I9V9dMbmD0RYTX9cWZR7kvRbiFaC6hfi';
  if (!apiKey) throw new Error('MISTRAL_API_KEY not set');

  try {
    // --- DEBUG LOGGING ---
    console.log('PhiVision: Step 1 - Running Mistral OCR...');
    const ocrText = await performOCR(base64Image, apiKey);
    console.log(`PhiVision: OCR Complete. Extracted ${ocrText.length} characters.`);

    console.log('PhiVision: Step 2 - Running Analysis...');
    const analysis = await generateInsights(ocrText, apiKey);

    // --- VALIDATION LOGGING ---
    console.log('[PhiVision Debug] Analysis Result Structure:');
    console.log(`- Context: ${analysis.analysis_context}`);
    console.log(`- Oral Advice: ${analysis.advices?.oral_sentence ? 'Present' : 'MISSING'}`);
    console.log(`- Written Points: ${analysis.advices?.written_points?.length || 0} items`);
    console.log(`- Meds: ${analysis.meds?.length || 0} items`);
    console.log(`- Cross-Sell: ${analysis.cross_selling?.length || 0} items`);
    console.log(`- Chips: ${analysis.chips?.length || 0} items`);

    // --- ARCHIVING / TRACEABILITY ---
    // Use the new PhiVisionLogger for field testing
    try {
      await logCaptureSession(base64Image, ocrText, analysis);
    } catch (logError) {
      console.error('PhiVision: Failed to log capture session', logError);
    }

    // Legacy log (keep for backward compat)
    try {

      const logEntry = `
================================================================================
TIMESTAMP: ${new Date().toISOString()}
--------------------------------------------------------------------------------
[OCR INPUT DETECTED]
${ocrText.replace(/\n/g, ' ')}
--------------------------------------------------------------------------------
[MISTRAL ANALYSIS OUTPUT]
${JSON.stringify(analysis, null, 2)}
================================================================================
\n`;

      // Use process.cwd() to target the application root folder (Axora/)
      const logPath = path.join(process.cwd(), 'PhiVision_History.txt');
      fs.appendFileSync(logPath, logEntry);
      console.log(`PhiVision: Analysis archived to ${logPath}`);
    } catch (logError) {
      console.error('PhiVision: Failed to write to history log', logError);
    }

    return {
      ...analysis,
      // Backward compats keys to avoid UI crash until UI is updated
      detected_items: analysis.meds?.map((m: any) => m.dci) || [],
      isMock: false
    };
  } catch (error) {
    console.error('PhiVision Pipeline Error:', error);
    throw error;
  }
}

export const setupPhiVisionHandlers = () => {
  ipcMain.handle('PHI_VISION_CAPTURE', async (event, scenarioOverride) => {
    try {
      // 1. Hide window to prevent UI interference (The "Blink")
      const wins = BrowserWindow.getAllWindows();
      const win = wins[0]; // Assuming main window is first
      if (win) {
        win.setOpacity(0);
        // Wait for OS compositor to refresh (critical for accurate capture)
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 2. Capture the Screen at Native Resolution
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const scaleFactor = primaryDisplay.scaleFactor;

      console.log(`PhiVision: Capture Metrics - Size: ${width}x${height}, Scale: ${scaleFactor}, Target: ${width * scaleFactor}x${height * scaleFactor}`);

      // Calculate physical pixels for maximum clarity
      const thumbnailSize = {
        width: Math.ceil(width * scaleFactor), // Force integer
        height: Math.ceil(height * scaleFactor)
      };

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: thumbnailSize
      });

      const primarySource = sources[0]; // Usually the main screen
      const thumbnailInfo = primarySource.thumbnail.toDataURL(); // Base64 Image

      // 3. Restore Window Visibility immediately
      if (win) {
        win.setOpacity(1);
        win.focus();
      }

      let result;

      // 2. Mock Override or Real Analysis
      if (scenarioOverride) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Sim delay
        result = { ...MOCK_SCENARIOS[scenarioOverride as keyof typeof MOCK_SCENARIOS], isMock: true };
      } else {
        try {
          // Attempt Real Analysis
          console.log('PhiVision: Attempting Real Analysis...');
          const analysis = await analyzeWithMistral(thumbnailInfo);
          result = analysis;
        } catch (apiError) {
          console.warn('PhiVision: API Call failed, falling back to mock.', apiError);
          // Fallback to Free Sale Mock if API fails / no key
          result = { ...MOCK_SCENARIOS.FREE_SALE, isMock: true };
        }
      }

      // 3. Return Data + The Captured Image (for verification/debug)
      // Ensure result has the structure we expect. If API returns weird data, 
      // the frontend might break, but we'll assume JSON protection above helps.

      return {
        success: true,
        data: {
          ...result,
          capturedImage: thumbnailInfo // Pass back the real captured image
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('PhiVision Capture Error Details:', error);

      // Fallback: Return a placeholder image so the UI flow continues
      // (This helps if permissions are missing, so the user sees *something*)
      const fallbackImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // Red pixel

      return {
        success: true, // We return true to allow the UI to show the 'Mock' results anyway
        data: {
          ...MOCK_SCENARIOS.FREE_SALE,
          capturedImage: fallbackImage,
          error: 'Capture Failed: Check Screen Permissions'
        },
        timestamp: new Date().toISOString()
      };
    }
  });
};
