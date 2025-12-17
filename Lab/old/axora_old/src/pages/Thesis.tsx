import { BookOpen, Search, Upload } from 'lucide-react';

export function Thesis() {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Thèse & Recherche</h1>
                <p className="text-gray-400">
                    Base de connaissances : Doctorat TDAH / Troubles Bipolaires
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statistics / Summary Card */}
                <div className="p-6 rounded-2xl bg-[#1a1c2e] border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Corpus PRISMA</h3>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium">40 Articles</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 text-sm text-gray-300">
                            <BookOpen size={16} />
                            <span>32 Études Cliniques</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 text-sm text-gray-300">
                            <Search size={16} />
                            <span>8 Méta-analyses</span>
                        </div>
                    </div>
                    <button className="mt-4 w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white transition-colors">
                        <Upload size={16} />
                        <span>Ajouter un PDF</span>
                    </button>
                </div>

                {/* Action Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-[#1a1c2e] border border-indigo-500/20">
                    <h3 className="text-lg font-semibold text-white mb-2">Assistant de Rédaction</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        Besoin d'aide pour reformuler un paragraphe ou vérifier une citation ?
                    </p>
                    <button className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
                        Ouvrir l'éditeur
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center text-gray-600">
                <p>Le module d'analyse RAG sera disponible prochainement.</p>
            </div>
        </div>
    );
}
