import { useState, useEffect } from 'react';
import { Save, Cloud, Check } from 'lucide-react';
import { aiManager } from '../services/ai/manager';
import { OpenAIProvider } from '../services/ai/openai';

export function Settings() {
    const [activeTab, setActiveTab] = useState<'online' | 'mistral'>('online');
    const [apiKey, setApiKey] = useState('');
    const [models] = useState(aiManager.getAllModels());
    const [selectedModel, setSelectedModel] = useState<string>('');

    useEffect(() => {
        const savedKey = localStorage.getItem('axora_openai_key');
        if (savedKey) setApiKey(savedKey);

        setSelectedModel(aiManager.getActiveModelId());

        // Restore active tab from manager
        const provider = aiManager.getActiveProvider();
        if (aiManager.getProvider('mistral') === provider) setActiveTab('mistral');
        else setActiveTab('online');
    }, []);

    const handleSaveKey = () => {
        const provider = aiManager.getProvider('online') as OpenAIProvider;
        provider.configure(apiKey);
        alert('Clé API OpenAI sauvegardée !');
    };

    const handleModelSelect = (modelId: string) => {
        setSelectedModel(modelId);
        const model = models.find(m => m.id === modelId);
        if (model) {
            aiManager.setActiveModel(modelId, model.provider);
            if (model.provider === 'online' || model.provider === 'mistral') {
                setActiveTab(model.provider as 'online' | 'mistral');
            }
        }
    };



    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-8">Paramètres Intelligence</h1>

            <div className="bg-[#1a1c2e] rounded-2xl border border-white/5 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/5">

                    <button
                        onClick={() => setActiveTab('online')}
                        className={`flex-1 p-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'online' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:bg-white/5'
                            }`}
                    >
                        <Cloud size={20} />
                        OpenAI
                    </button>
                    <button
                        onClick={() => setActiveTab('mistral')}
                        className={`flex-1 p-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'mistral' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-400 hover:bg-white/5'
                            }`}
                    >
                        <Cloud size={20} />
                        Mistral AI
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'online' && (
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Clé API OpenAI</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                                />
                                <button
                                    onClick={handleSaveKey}
                                    className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 flex items-center gap-2 transition-colors"
                                >
                                    <Save size={18} /> Sauvegarder
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Votre clé est stockée localement dans votre navigateur.
                            </p>
                        </div>
                    )}

                    {activeTab === 'mistral' && (
                        <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-200">
                            <p>Le mode Mistral utilise le proxy backend sécurisé. Aucune configuration requise ici.</p>
                        </div>
                    )}

                    <h3 className="text-lg font-semibold mb-4">Modèles Disponibles</h3>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                        {models.filter(m => m.provider === activeTab).map(model => (
                            <div
                                key={model.id}
                                onClick={() => handleModelSelect(model.id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedModel === model.id
                                    ? 'bg-indigo-600/20 border-indigo-500'
                                    : 'bg-white/5 border-transparent hover:border-white/10'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold">{model.name}</div>
                                    <div className="text-sm text-gray-400">{model.description}</div>
                                </div>
                                {selectedModel === model.id && (
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>


                </div>
            </div>
        </div>
    );
}
