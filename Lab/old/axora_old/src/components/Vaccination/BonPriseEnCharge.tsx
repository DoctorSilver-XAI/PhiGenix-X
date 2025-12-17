import { useEffect, useState, useRef } from 'react';
import CardReaderControl from './CardReaderControl';
import { useCardReader } from '../../services/CardReaderService';
import { Printer, ChevronDown } from 'lucide-react';
import { VACCINES } from '../../data/vaccines';

export default function BonPriseEnCharge() {
    const { lastCardData } = useCardReader();
    const [formData, setFormData] = useState({
        immatriculation: '',
        cle: '',
        beneficiaire: '',
        dateNaissance: '',
        rang: '',
        codeOrganisme: '',
        specialite: '',
        prescripteur: '',
        datePrescription: new Date().toLocaleDateString('fr-FR')
    });

    useEffect(() => {
        if (lastCardData) {
            setFormData(prev => ({
                ...prev,
                immatriculation: lastCardData.nir,
                cle: lastCardData.cle,
                beneficiaire: `${lastCardData.nom} ${lastCardData.prenom}`,
                dateNaissance: lastCardData.dateNaissance,
                rang: lastCardData.rang,
                codeOrganisme: lastCardData.regime || prev.codeOrganisme
            }));
        }
    }, [lastCardData]);

    const handlePrint = () => {
        window.print();
    };

    const handleVaccineSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        if (selected) {
            setFormData(prev => ({ ...prev, specialite: selected }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center print:bg-white print:p-0">
            {/* Control Bar - Hidden when printing */}
            <div className="w-full max-w-[210mm] mb-6 print:hidden flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Vaccination</h1>
                <div className="flex gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        <Printer size={18} />
                        Imprimer
                    </button>
                </div>
            </div>

            {/* Reader Control - Hidden when printing */}
            <div className="w-full max-w-[210mm] mb-8 print:hidden">
                <CardReaderControl />
            </div>

            {/* THE FORM - Strict HTML Replica */}
            {/* Page container: A4 size approximately */}
            <div className="bg-white shadow-xl print:shadow-none print:m-0 w-[210mm] min-h-[297mm] p-[30pt] text-black font-arial mx-auto relative relative-form-container">
                {/* Styles injected locally to match reference exactly without polluting global scope */}
                <style>{`
                    .s1 { font-family:Arial, sans-serif; font-style: italic; font-weight: normal; font-size: 8pt; color: black; }
                    .s2 { font-family:Arial, sans-serif; font-style: normal; font-weight: normal; font-size: 11pt; color: black; }
                    .s3 { font-family:"Times New Roman", serif; font-size: 11pt; vertical-align: -2pt; }
                    .s4 { font-family:Arial, sans-serif; font-weight: bold; font-size: 12pt; text-align: center; }
                    .s5 { font-family:Arial, sans-serif; font-weight: bold; font-size: 10pt; }
                    .input-clean { background: transparent; border: none; font-family: inherit; font-size: inherit; color: inherit; width: 100%; outline: none; }
                    .input-overlay { position: absolute; background: rgba(0,0,0,0.05); bottom: 2px; height: 1.2em; }
                     @media print {
                        @page { margin: 0; size: auto; }
                        .print-hidden { display: none !important; }
                        body, html { background-color: white !important; margin: 0; padding: 0; }
                        .relative-form-container { box-shadow: none !important; margin: 0 !important; padding: 15mm !important; width: 100% !important; }
                        .no-print-border { border: none !important; }
                    }
                `}</style>

                <div style={{ paddingTop: '3pt', paddingLeft: '26pt', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '25pt', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', margin: 0 }}>Vaccination</h1>
                </div>

                <div style={{ paddingTop: '18pt', paddingLeft: '50pt', textAlign: 'left' }}>
                    <h2 style={{ fontSize: '16pt', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', margin: 0 }}>Bon de prise en charge vaccin (hors grippe et COVID)</h2>
                </div>

                <div style={{ paddingTop: '9pt' }}><br /></div>

                <p className="s1" style={{ paddingLeft: '26pt', textAlign: 'center', margin: 0 }}>
                    - Art. L.162-16-1 du code de la sécurité sociale et art. L.5125-1-1-A du code de la santé publique.
                </p>
                <p className="s1" style={{ paddingTop: '3pt', paddingLeft: '26pt', textAlign: 'center', margin: 0 }}>
                    - Arrêté du 8 août 2023 fixant la liste et les conditions de vaccinations donnant lieu à la tarification des honoraires de vaccination dus au pharmacien d'officine et application du 14° de l'article L.162-16-1 du code de la sécurité sociale
                </p>

                <div style={{ paddingTop: '30pt' }}><br /></div>

                {/* Numéro d'immatriculation */}
                <div className="s2" style={{ paddingLeft: '6pt', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                    <span>Numéro d'immatriculation : </span>
                    <div style={{ marginLeft: '10px', position: 'relative', width: '262px', height: '25px', borderBottom: '1px dotted #000', display: 'flex', alignItems: 'center' }}>
                        {/* Replaces Image_001.png with exact size input */}
                        <input
                            type="text"
                            className="input-clean"
                            style={{ textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                            value={formData.immatriculation}
                            onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                        />
                    </div>
                    <span className="s3" style={{ margin: '0 5px' }}> </span>
                    <div style={{ position: 'relative', width: '41px', height: '25px', borderBottom: '1px dotted #000', display: 'flex', alignItems: 'center' }}>
                        {/* Replaces Image_002.png */}
                        <input
                            type="text"
                            className="input-clean"
                            style={{ textAlign: 'center', fontWeight: 'bold' }}
                            value={formData.cle}
                            onChange={(e) => setFormData({ ...formData, cle: e.target.value })}
                        />
                    </div>
                </div>

                {/* Bénéficiaire */}
                <div className="s2" style={{ paddingTop: '10pt', paddingLeft: '5pt', textAlign: 'left', display: 'flex' }}>
                    <span>Bénéficiaire de la prise en charge : </span>
                    <input
                        type="text"
                        className="input-clean"
                        style={{ borderBottom: '1px dotted #000', marginLeft: '5px', flex: 1, fontWeight: 'bold' }}
                        value={formData.beneficiaire}
                        onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
                    />
                </div>

                {/* Date et rang de naissance */}
                <div className="s2" style={{ paddingTop: '10pt', paddingLeft: '5pt', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                    <span>Date et rang de naissance du bénéficiaire </span>
                    <div style={{ marginLeft: '10px', width: '162px', borderBottom: '1px dotted #000', display: 'flex', alignItems: 'center' }}>
                        {/* Replaces Image_003.png */}
                        <input
                            type="text"
                            className="input-clean"
                            value={formData.dateNaissance}
                            onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                            style={{ textAlign: 'center', fontWeight: 'bold' }}
                            placeholder="JJ/MM/AAAA"
                        />
                    </div>
                    <div style={{ marginLeft: '10px', width: '50px', borderBottom: '1px dotted #000', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="input-clean"
                            value={formData.rang}
                            onChange={(e) => setFormData({ ...formData, rang: e.target.value })}
                            style={{ textAlign: 'center', fontWeight: 'bold' }}
                            placeholder="Rang"
                        />
                    </div>
                </div>

                {/* Code organisme */}
                <div className="s2" style={{ paddingTop: '10pt', paddingLeft: '5pt', textAlign: 'left', display: 'flex' }}>
                    <span>Code organisme : </span>
                    <input
                        type="text"
                        className="input-clean"
                        style={{ borderBottom: '1px dotted #000', marginLeft: '5px', flex: 1, fontWeight: 'bold' }}
                        value={formData.codeOrganisme}
                        onChange={(e) => setFormData({ ...formData, codeOrganisme: e.target.value })}
                    />
                </div>

                <div style={{ paddingTop: '25pt' }}><br /></div>

                {/* TABLE */}
                <table style={{ borderCollapse: 'collapse', marginLeft: '19.834pt', width: 'calc(100% - 40pt)' }} cellSpacing="0">
                    <tbody>
                        <tr style={{ height: '20pt' }}>
                            <td style={{ width: '473pt', borderBottom: '1px solid #4F81BC', backgroundColor: '#92CDDC' }} colSpan={2}>
                                <p className="s4" style={{ paddingTop: '2pt', paddingLeft: '22pt', textIndent: '0pt', textAlign: 'center' }}>
                                    A compléter par le prescripteur
                                </p>
                            </td>
                        </tr>
                        <tr style={{ height: '32pt' }}>
                            <td style={{ width: '50%', border: '1px solid #4F81BC', backgroundColor: '#F1F1F1' }}>
                                <p className="s5" style={{ paddingTop: '9pt', paddingLeft: '10pt', textIndent: '0pt', textAlign: 'center' }}>
                                    Spécialité prescrite
                                </p>
                            </td>
                            <td style={{ width: '50%', border: '1px solid #4F81BC', backgroundColor: '#F1F1F1' }}>
                                <p className="s5" style={{ paddingTop: '3pt', paddingLeft: '10pt', textIndent: '0pt', textAlign: 'center' }}>
                                    Nom du prescripteur et identification de la structure dans laquelle il exerce
                                </p>
                            </td>
                        </tr>
                        <tr style={{ height: '200pt' }}>
                            <td style={{ border: '1px solid #4F81BC', verticalAlign: 'top', padding: '10px', position: 'relative' }}>
                                {/* Vaccine Selector (Hidden on Print) */}
                                <div className="print-hidden mb-2">
                                    <div className="relative">
                                        <select
                                            onChange={handleVaccineSelect}
                                            className="w-full p-2 border border-blue-200 rounded-md bg-blue-50 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500"
                                            value="" // Always show placeholder behavior
                                        >
                                            <option value="" disabled>▼ Sélectionner un vaccin...</option>
                                            {Object.entries(VACCINES).map(([category, vaccines]) => (
                                                <optgroup key={category} label={category}>
                                                    {vaccines.map(v => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1 italic text-center">
                                        Sélectionnez pour remplir ou saisissez manuellement ci-dessous
                                    </div>
                                </div>

                                <textarea
                                    className="input-clean"
                                    style={{ height: '100%', resize: 'none' }}
                                    value={formData.specialite}
                                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                                />
                            </td>
                            <td style={{ border: '1px solid #4F81BC', verticalAlign: 'top', padding: '10px' }}>
                                <textarea
                                    className="input-clean"
                                    style={{ height: '100%', resize: 'none' }}
                                    value={formData.prescripteur}
                                    onChange={(e) => setFormData({ ...formData, prescripteur: e.target.value })}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ paddingTop: '20pt' }}><br /></div>

                <div style={{ background: '#F1F1F1', display: 'block', minHeight: '22.5pt', width: '169.9pt', border: '1px solid #ccc', marginLeft: '20pt' }}>
                    <div className="s2" style={{ paddingTop: '5pt', paddingLeft: '10pt', fontWeight: 'bold', display: 'flex' }}>
                        Date de prescription :
                        <input
                            type="text"
                            className="input-clean"
                            style={{ marginLeft: '10px', width: '100px' }}
                            value={formData.datePrescription}
                            onChange={(e) => setFormData({ ...formData, datePrescription: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ paddingTop: '20pt' }}><br /></div>

                <h3 style={{ paddingLeft: '114pt', textIndent: '0pt', textAlign: 'center', fontSize: '11pt', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>Signature</h3>

                <div style={{ paddingTop: '40pt', paddingLeft: '40pt', borderBottom: '1px dotted #000', width: '200px', margin: '0 auto' }}></div>

                <div style={{ paddingTop: '40pt' }}><br /></div>

                <p style={{ paddingLeft: '19pt', textAlign: 'justify', fontSize: '7pt', fontFamily: 'Arial, sans-serif' }}>
                    Conformément au Règlement européen n°2016/679/UE du 27 avril 2016 et à la loi « informatique et libertés » du 6 janvier 1978 modifiée, vous disposez d’un droit d’accès et de rectification aux données vous concernant auprès du Directeur de votre organisme d’assurance maladie ou de son Délégué à la Protection des Données.
                </p>
                <p style={{ paddingLeft: '19pt', textAlign: 'justify', fontSize: '7pt', fontFamily: 'Arial, sans-serif' }}>
                    En cas de difficultés dans l’application de ces droits, vous pouvez introduire une réclamation auprès de la Commission nationale Informatique et Libertés. Quiconque se rend coupable de fraude ou de fausse déclaration est passible de pénalités financières, d'amende et/ou d'emprisonnement.
                </p>
                <p style={{ paddingTop: '1pt', paddingLeft: '19pt', textAlign: 'justify', fontSize: '7pt', fontFamily: 'Arial, sans-serif' }}>
                    (Articles 313-1 à 313-3, 433-19, 441-1 et suivants du Code pénal, article L.114-17-1 du Code de la sécurité sociale.)
                </p>

                <h4 style={{ textAlign: 'right', fontSize: '10pt', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginTop: '20pt' }}>611 CNAM - 09/2023</h4>
            </div>
        </div>
    );
}
