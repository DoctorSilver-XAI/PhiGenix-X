import { FileText, Pill, Syringe, Stethoscope, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CardReaderControl from '../components/Vaccination/CardReaderControl';

export function Pharmacy() {
    const navigate = useNavigate();

    const tools = [
        {
            id: 'ppp',
            title: 'Plan Personnalisé de Prévention',
            description: 'Générer un bilan de prévention complet',
            icon: FileText,
            color: 'bg-emerald-500',
            status: 'Beta',
            path: '/ppp/index.html' // External static link
        },
        {
            id: 'trod',
            title: 'TROD Angine',
            description: 'Dépistage angines à streptocoque A',
            icon: Stethoscope,
            color: 'bg-blue-500',
            status: 'Ready',
            path: '/trod'
        },
        {
            id: 'vaccin',
            title: 'Prescription Vaccinale',
            desc: 'Éligibilité et bon de vaccination.',
            icon: Syringe,
            color: 'bg-blue-500',
            status: 'Ready',
            path: '/vaccination/bon-prise-en-charge'
        }
    ];

    const handleToolClick = (tool: typeof tools[0]) => {
        if (tool.path) {
            if (tool.path.includes('.html')) {
                // Static external file
                window.location.href = tool.path;
            } else {
                // Internal React Route
                navigate(tool.path);
            }
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Outils Officine</h1>
                    <p className="text-gray-400">
                        Suite d'outils cliniques pour la Grande Pharmacie de Tassigny (Axora v0.2)
                    </p>
                </div>
                <div className="relative z-10">
                    <CardReaderControl variant="header" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <motion.div
                        key={tool.id}
                        whileHover={{ y: -5 }}
                        onClick={() => handleToolClick(tool)}
                        className={`
                            group cursor-pointer p-6 rounded-2xl bg-[#1a1c2e] border border-white/5 
                            transition-all hover:bg-[#20232b]
                            ${tool.path ? 'hover:border-blue-500/30' : 'hover:border-white/10'}
`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl ${tool.color} bg-opacity-20 flex items-center justify-center text-white`}>
                                <tool.icon size={24} className={tool.color.replace('bg-', 'text-')} />
                            </div>
                            {tool.status === 'Ready' ? (
                                <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wide border border-emerald-500/20">
                                    Disponible
                                </span>
                            ) : (
                                <span className="px-2 py-1 rounded-md bg-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                    Bientôt
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                            {tool.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                            {tool.desc}
                        </p>

                        <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-white transition-colors">
                            Lancer l'outil <ChevronRight size={16} className="ml-1" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
