import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, AlertCircle, Check, X, HelpCircle, FileText, User, Calendar, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCardReader } from '../../services/CardReaderService';

export default function TrodAngine() {
    const navigate = useNavigate();
    const { lastCardData } = useCardReader();

    // Local state for form fields that aren't from the card
    const [pharmacien, setPharmacien] = useState('');
    const [testName, setTestName] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [result, setResult] = useState<string | null>(null);

    // Auto-fill form date
    const today = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen bg-gray-50/50 font-[Inter] pb-20 print:bg-white print:pb-0 print:p-0">
            {/* Global Print Styles to reset margins and backgrounds */}
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body, html { background-color: white !important; margin: 0; padding: 0; }
                    .print-reset { margin: 0 !important; padding: 15mm !important; width: 100% !important; max-width: none !important; }
                    .print-hidden { display: none !important; }
                }
            `}</style>

            {/* ---------------- SCREEN HEADER (Hidden on Print) ---------------- */}
            <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/pharma')}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100/80 text-gray-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-none">TROD Angine</h1>
                            <p className="text-xs text-gray-500 mt-1">Dépistage à Streptocoque A</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Card Reader */}
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${lastCardData ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {lastCardData ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                            <span className="text-sm font-medium">
                                {lastCardData ? `${lastCardData.nom} ${lastCardData.prenom}` : 'En attente carte vitale'}
                            </span>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="flex items-center bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 font-medium"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimer Fiche
                        </button>
                    </div>
                </div>
            </div>

            {/* ---------------- MAIN CONTENT ---------------- */}
            <div className="max-w-5xl mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:max-w-none print:px-0 print:mt-0 print-reset">

                {/* LEFT COLUMN: Input Form (Screen) / Full Doc (Print) */}
                <div className="lg:col-span-8 space-y-6 print:w-full print:space-y-0">

                    {/* Fiche Traçabilité Wrapper */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:rounded-none print:border-none">

                        {/* SCREEN TITLE SECTION */}
                        <div className="bg-slate-50 p-6 border-b border-gray-100 flex items-center justify-between print:hidden">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Informations de Traçabilité
                            </h2>
                            <span className="text-xs font-mono text-slate-400">{new Date().toLocaleDateString()}</span>
                        </div>

                        {/* PRINT TITLE SECTION */}
                        <div className="hidden print:block mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                            <h1 className="text-xl font-bold text-center border-2 border-black p-2 bg-gray-50 mb-4">
                                FICHE DE TRAÇABILITÉ - TROD ANGINES
                                <br /><span className="text-sm font-normal uppercase">(À CONSERVER PAR LE PHARMACIEN)</span>
                            </h1>
                            <div className="text-xs flex justify-between">
                                <span><b>Date :</b> {today}</span>
                                <span><b>Structure :</b> Grande Pharmacie de Tassigny</span>
                            </div>
                        </div>

                        <div className="p-8 print:p-0">
                            {/* BLOCK 1: Identité */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:gap-2 print:mb-4">
                                <div className="space-y-4 print:space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 print:hidden">Pharmacien Réalisateur</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none print:hidden">
                                            <User className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm print:border-none print:pl-0 print:p-0 print:text-base"
                                            value={pharmacien}
                                            onChange={(e) => setPharmacien(e.target.value)}
                                            placeholder="Nom Prénom du pharmacien"
                                        />
                                        {/* Print Label Override */}
                                        <span className="hidden print:inline font-bold mr-2 text-sm">Pharmacien :</span>
                                        <span className="hidden print:inline">{pharmacien}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 print:space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 print:hidden">Patient (Carte Vitale)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none print:hidden">
                                            <ShieldCheck className={`h-4 w-4 ${lastCardData ? 'text-emerald-500' : 'text-gray-400'}`} />
                                        </div>
                                        <input
                                            type="text"
                                            readOnly
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-gray-50 print:border-none print:bg-transparent print:pl-0 print:p-0 print:text-base ${lastCardData ? 'text-gray-900 border-emerald-200' : 'text-gray-400 border-gray-200'}`}
                                            value={lastCardData ? `${lastCardData.nom} ${lastCardData.prenom} (${lastCardData.dateNaissance})` : ''}
                                            placeholder="En attente de lecture..."
                                        />
                                        <span className="hidden print:inline font-bold mr-2 text-sm">Patient :</span>
                                        <span className="hidden print:inline">{lastCardData ? `${lastCardData.nom} ${lastCardData.prenom} (${lastCardData.dateNaissance})` : '______________________'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 2: Critères (Checkbox Grid) */}
                            <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100 print:border-none print:bg-transparent print:p-0 print:mb-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 print:hidden">Critères d'Inclusion & Score</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <span className="text-sm text-gray-700 print:text-xs">Présentation ordonnance conditionnelle ?</span>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center text-sm cursor-pointer"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 mx-1" /> Oui</label>
                                            <label className="inline-flex items-center text-sm cursor-pointer"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 mx-1" /> Non</label>
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <span className="text-sm text-gray-700 print:text-xs">Si non (et patient ≥ 15 ans) : Score Mac Isaac ≥ 2 ?</span>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center text-sm cursor-pointer"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 mx-1" /> Oui</label>
                                            <label className="inline-flex items-center text-sm cursor-pointer"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 mx-1" /> Non</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 3: Matériel */}
                            <div className="grid grid-cols-2 gap-6 mb-8 print:grid-cols-2 print:gap-x-8 print:gap-y-2 print:text-xs print:mb-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 print:mb-0">Nom du Test (CE)</label>
                                    <input type="text" className="block w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 text-sm bg-transparent" value={testName} onChange={e => setTestName(e.target.value)} placeholder="Ex: Strep A Test" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 print:mb-0">Modèle Écouvillon</label>
                                    <input type="text" className="block w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 text-sm bg-transparent" defaultValue="Standard (fourni)" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 print:mb-0">Numéro de Lot</label>
                                    <input type="text" className="block w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 text-sm bg-transparent" value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="Lot #..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 print:mb-0">Date de Péremption</label>
                                    <input type="text" className="block w-full border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 text-sm bg-transparent" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder="JJ/MM/AAAA" />
                                </div>
                            </div>

                            {/* BLOCK 4: RESULTAT (Interactive on Screen / Checkbox on Print) */}
                            <div className="mb-8 print:mb-4 print:border-2 print:border-black print:p-2 print:rounded-none">
                                <h3 className="tex-sm font-bold text-gray-900 mb-4 print:inline print:mr-4">RÉSULTAT DU TEST :</h3>

                                {/* Screen Interactive Buttons */}
                                <div className="grid grid-cols-3 gap-4 print:hidden">
                                    <button
                                        onClick={() => setResult(result === 'POS' ? null : 'POS')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${result === 'POS' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 bg-white text-gray-400 hover:border-red-200 hover:text-red-400'}`}
                                    >
                                        <AlertCircle className={`w-8 h-8 mb-2 ${result === 'POS' ? 'fill-red-500 text-white' : ''}`} />
                                        <span className="font-bold">POSITIF (+)</span>
                                    </button>
                                    <button
                                        onClick={() => setResult(result === 'NEG' ? null : 'NEG')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${result === 'NEG' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-white text-gray-400 hover:border-emerald-200 hover:text-emerald-400'}`}
                                    >
                                        <Check className={`w-8 h-8 mb-2 ${result === 'NEG' ? 'bg-emerald-500 text-white rounded-full p-1' : ''}`} />
                                        <span className="font-bold">NÉGATIF (-)</span>
                                    </button>
                                    <button
                                        onClick={() => setResult(result === 'INC' ? null : 'INC')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${result === 'INC' ? 'border-gray-800 bg-gray-50 text-gray-900' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
                                    >
                                        <HelpCircle className={`w-8 h-8 mb-2 ${result === 'INC' ? 'fill-gray-800 text-white' : ''}`} />
                                        <span className="font-bold">NON CONCLUANT</span>
                                    </button>
                                </div>

                                {/* Print Checkboxes (Hidden on Screen) */}
                                <div className="hidden print:inline-flex print:items-center">
                                    <label className="inline-flex items-center mx-4"><input type="checkbox" checked={result === 'POS'} className="mr-1" /> <span className={result === 'POS' ? 'font-bold' : ''}>POSITIF (+)</span></label>
                                    <label className="inline-flex items-center mx-4"><input type="checkbox" checked={result === 'NEG'} className="mr-1" /> <span className={result === 'NEG' ? 'font-bold' : ''}>NÉGATIF (-)</span></label>
                                    <label className="inline-flex items-center mx-4"><input type="checkbox" checked={result === 'INC'} className="mr-1" /> <span className={result === 'INC' ? 'font-bold' : ''}>NON CONCLUANT</span></label>
                                </div>
                            </div>

                            {/* BLOCK 5: Suite Donnée */}
                            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 print:bg-transparent print:border-none print:p-0">
                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 print:hidden">Orientation & Prise en Charge</h3>
                                <div className="space-y-3 print:text-xs">
                                    <strong className="hidden print:block underline mb-1">Suite donnée :</strong>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">Orientation vers le médecin traitant ?</span>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center text-sm"><input type="checkbox" className="mx-1" /> Oui</label>
                                            <label className="inline-flex items-center text-sm"><input type="checkbox" className="mx-1" /> Non</label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">Délivrance antibiotiques (si ordo. cond.) ?</span>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center text-sm"><input type="checkbox" className="mx-1" /> Oui</label>
                                            <label className="inline-flex items-center text-sm"><input type="checkbox" className="mx-1" /> Non</label>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">Traitement symptomatique ?</span>
                                        <div className="flex items-center gap-4">
                                            <label className="inline-flex items-center text-sm"><input type="checkbox" className="mx-1" /> Oui</label>
                                            <label className="inline-flex items-center text-sm"><input type="checkbox" className="mx-1" /> Non</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Attestations */}
                            <div className="mt-6 text-xs text-gray-500 border-t border-gray-200 pt-4 print:text-[10px] print:leading-tight">
                                <p className="font-bold mb-2">Attestations :</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Je suis formé à la réalisation de ce TROD, j'ai pris connaissance de la notice et respecté la procédure.</li>
                                    <li>J'ai éliminé les déchets (DASRI) conformément à la réglementation.</li>
                                    <li>J'ai remis le document de résultat au patient (Annexe IV ci-dessous) et transmis tout positif au médecin.</li>
                                </ul>
                            </div>

                            <div className="mt-8 flex justify-between items-end print:text-xs print:mt-4">
                                <div>Fait le : {new Date().toLocaleDateString('fr-FR')}</div>
                                <div className="text-center">
                                    <div className="mb-8 print:mb-4">Signature / Cachet</div>
                                    <div className="w-48 border-b border-black"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ANNEXE IV PRINT ONLY BLOCK */}
                    <div className="hidden print:block print:break-before-page">
                        <h1 className="text-xl font-bold text-center border-2 border-black p-2 bg-gray-50 mb-6">
                            RÉSULTAT DU TEST (ANNEXE IV)
                            <br /><span className="text-sm font-normal uppercase">(REMIS AU PATIENT)</span>
                        </h1>

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="font-bold">Date :</span> {today}</div>
                                <div><span className="font-bold">Pharmacie :</span> Grande Pharmacie de Tassigny</div>
                            </div>

                            <div className="border p-4 bg-gray-50 rounded">
                                <div className="mb-2"><span className="font-bold">Pharmacien :</span> {pharmacien}</div>
                                <div className="mb-2"><span className="font-bold">Patient :</span> {lastCardData ? `${lastCardData.nom} ${lastCardData.prenom}` : '______________________'}</div>
                            </div>

                            <table className="w-full border-collapse border border-gray-300 mt-4">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 p-2 text-left">Test utilisé</th>
                                        <th className="border border-gray-300 p-2 text-left">Lot</th>
                                        <th className="border border-gray-300 p-2 text-left">Exp.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 p-2">{testName}</td>
                                        <td className="border border-gray-300 p-2">{lotNumber}</td>
                                        <td className="border border-gray-300 p-2">{expiryDate}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="mt-8 p-6 border-2 border-gray-800 rounded bg-white text-center">
                                <h3 className="text-lg font-bold mb-4 uppercase underline">RÉSULTAT DU DÉPISTAGE</h3>
                                <div className="flex justify-center space-x-8 text-lg">
                                    <div className={`flex items-center ${result === 'POS' ? 'font-bold' : ''}`}>[{result === 'POS' ? 'X' : ' '}] POSITIF</div>
                                    <div className={`flex items-center ${result === 'NEG' ? 'font-bold' : ''}`}>[{result === 'NEG' ? 'X' : ' '}] NÉGATIF</div>
                                    <div className={`flex items-center ${result === 'INC' ? 'font-bold' : ''}`}>[{result === 'INC' ? 'X' : ' '}] NON CONCLUANT</div>
                                </div>
                            </div>

                            <div className="mt-8 text-center italic text-gray-500 text-xs">
                                "J'ai bien été informé(e) que ce test ne constitue qu'une orientation diagnostique."
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Helper / instructions (Screen Only) */}
                <div className="hidden lg:block lg:col-span-4 space-y-6 print:hidden">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <HelpCircle className="w-5 h-5 mr-2 text-indigo-500" />
                            Aide Mémo
                        </h3>
                        <div className="space-y-4 text-sm text-gray-600">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="font-bold text-slate-700 block mb-1">Score Mac Isaac</span>
                                <ul className="list-disc pl-4 space-y-1 text-xs">
                                    <li>Température &gt; 38°C (+1)</li>
                                    <li>Absence de toux (+1)</li>
                                    <li>Adénopath. cervic. sensibles (+1)</li>
                                    <li>Atteinte amygdalienne (+1)</li>
                                    <li>Age 15-44 ans (0) / ≥ 45 ans (-1)</li>
                                </ul>
                                <div className="mt-2 pt-2 border-t border-slate-200 text-xs font-bold text-indigo-600">
                                    Faire le TROD si Score ≥ 2
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-lg text-amber-800">
                                <span className="font-bold block mb-1">Attention</span>
                                Si le test est POSITIF, orienter vers le médecin ou délivrer sous ordonnance conditionnelle.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
