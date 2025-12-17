#!/bin/bash
set -e
echo "➡️  Envoi d'un JSON de démonstration à http://localhost:5678/phigenix"
curl -s -X POST http://localhost:5678/phigenix \
  -H 'Content-Type: application/json' \
  -d '{
    "patient":{"prenom":"RAPHAËL","age_annees":10},
    "ordonnance":{"lignes":[{"produit":"DOLIPRANE 500 mg"}]},
    "advices":[
      "Posologie enfant: 15 mg/kg/prise, ≥6 h, max 60 mg/kg/j.",
      "Hydratation + suivi T° ; éviter doublons paracétamol.",
      "Solution orale si <6 ans."
    ],
    "alerts":["Hépatique/alcool/poids <50 kg → prudence/avis."],
    "ctas":[
      {"label":"Fiche posologie","url":"phigenix://poso_paracetamol"},
      {"label":"Conseils fièvre","url":"phigenix://fievre_enfant"},
      {"label":"+ Thermomètre","id":"add_thermo"}
    ]
  }' && echo -e "\n✅ Fait"
