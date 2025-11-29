
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Sector, PoolComment } from '../../types';
import { Sparkles, Save, Trash2, Copy, RefreshCw, Layers, Database, Building2, Pencil } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Modal } from '../../components/Modal';

export const CommentPool: React.FC = () => {
    const { poolComments, addPoolComment, deletePoolComment, updatePoolComment, generateAIComments, businesses } = useData();

    // Generator State
    const [sector, setSector] = useState<Sector>(Sector.RESTAURANT);
    const [selectedGenBusinessId, setSelectedGenBusinessId] = useState<string>('');
    const [businessName, setBusinessName] = useState('');
    const [keywordsStr, setKeywordsStr] = useState('');
    const [tone, setTone] = useState<'formal' | 'casual' | 'excited'>('casual');
    const [count, setCount] = useState(5);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResults, setGeneratedResults] = useState<string[]>([]);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingComment, setEditingComment] = useState<PoolComment | null>(null);

    // Pool Filtering
    const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
    const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>('all');

    const handleBusinessSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bId = e.target.value;
        setSelectedGenBusinessId(bId);
        if (bId) {
            const b = businesses.find(bz => bz.id === bId);
            if (b) setBusinessName(b.name);
        }
    }

    const handleGenerate = async () => {
        setIsGenerating(true);
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
        const results = await generateAIComments(sector, businessName, keywords, count, tone);
        setGeneratedResults(results);
        setIsGenerating(false);
    };

    const handleSaveToPool = (content: string) => {
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
        const newComment: PoolComment = {
            id: uuidv4(),
            content: content,
            sector: sector,
            tags: keywords,
            businessId: selectedGenBusinessId || undefined
        };
        addPoolComment(newComment);
        setGeneratedResults(prev => prev.filter(c => c !== content));
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const openEditModal = (comment: PoolComment) => {
        setEditingComment(comment);
        setIsEditModalOpen(true);
    }

    const handleUpdateComment = () => {
        if (editingComment) {
            updatePoolComment(editingComment);
            setIsEditModalOpen(false);
            setEditingComment(null);
        }
    }

    // Filter Logic
    const filteredPool = poolComments.filter(c => {
        const matchesSector = selectedSectorFilter === 'all' || c.sector === selectedSectorFilter;
        const matchesBusiness = selectedBusinessFilter === 'all' 
            ? true 
            : selectedBusinessFilter === 'general' 
                ? !c.businessId 
                : c.businessId === selectedBusinessFilter;

        return matchesSector && matchesBusiness;
    });

    return (
        <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yorum Havuzu & AI Oluşturucu</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* --- Left Column: Generator --- */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
                            Otomatik Yorum Oluşturucu
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sektör</label>
                                <select 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value as Sector)}
                                >
                                    {Object.values(Sector).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İşletme Seç (Opsiyonel)</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <select
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
                                        value={selectedGenBusinessId}
                                        onChange={handleBusinessSelect}
                                    >
                                        <option value="">Genel (İşletme Seçili Değil)</option>
                                        {businesses.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Seçilirse, oluşturulan yorumlar bu işletmeye özel olarak havuza eklenir.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İşletme Adı (Yapay Zeka İçin)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Örn: Lezzet Durağı"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anahtar Kelimeler</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="virgül ile ayırın: hızlı, lezzetli, temiz"
                                    value={keywordsStr}
                                    onChange={(e) => setKeywordsStr(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ton</label>
                                    <select 
                                        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as any)}
                                    >
                                        <option value="casual">Samimi / Doğal</option>
                                        <option value="formal">Resmi / Kurumsal</option>
                                        <option value="excited">Heyecanlı / Çok Memnun</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adet</label>
                                    <input 
                                        type="number" 
                                        min="1" max="10"
                                        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={count}
                                        onChange={(e) => setCount(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-md transition-all active:scale-95 disabled:opacity-70"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="animate-spin mr-2" size={20} />
                                        Yapay Zeka Düşünüyor...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2" size={20} />
                                        Yorumları Oluştur
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Generated Results */}
                    {generatedResults.length > 0 && (
                        <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Oluşturulan Taslaklar</h3>
                            {generatedResults.map((result, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 group hover:border-blue-300 transition-colors">
                                    <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">
                                        {result}
                                    </p>
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleCopyToClipboard(result)}
                                            className="text-gray-500 hover:text-blue-600 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Kopyala"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleSaveToPool(result)}
                                            className="text-green-600 hover:text-green-700 flex items-center text-xs font-medium px-3 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded transition-colors"
                                        >
                                            <Save size={14} className="mr-1.5" />
                                            Havuza Ekle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Right Column: Pool List --- */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 h-fit">
                    <div className="flex flex-col gap-4 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <Layers className="w-5 h-5 mr-2 text-green-500" />
                            Yorum Havuzu ({filteredPool.length})
                        </h2>
                        
                        <div className="flex gap-2 flex-col sm:flex-row">
                            <select 
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
                                value={selectedBusinessFilter}
                                onChange={(e) => setSelectedBusinessFilter(e.target.value)}
                            >
                                <option value="all">Tüm İşletmeler</option>
                                <option value="general">Genel (İşletmesiz)</option>
                                {businesses.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>

                            <select 
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
                                value={selectedSectorFilter}
                                onChange={(e) => setSelectedSectorFilter(e.target.value)}
                            >
                                <option value="all">Tüm Sektörler</option>
                                {Object.values(Sector).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredPool.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <Database size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Havuzda eşleşen yorum yok.</p>
                                <p className="text-xs mt-1">Filtreleri değiştirin veya yeni oluşturun.</p>
                            </div>
                        ) : (
                            filteredPool.map(comment => (
                                <div key={comment.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-700/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {comment.sector}
                                            </span>
                                            {comment.businessId && (() => {
                                                const b = businesses.find(bz => bz.id === comment.businessId);
                                                return b ? (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center">
                                                        <Building2 size={10} className="mr-1" />
                                                        {b.name}
                                                    </span>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => openEditModal(comment)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                onClick={() => deletePoolComment(comment.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                                        {comment.content}
                                    </p>
                                    {comment.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {comment.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] text-gray-500 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Yorumu Düzenle"
                footer={
                    <>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleUpdateComment}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Güncelle
                        </button>
                    </>
                }
            >
                {editingComment && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yorum İçeriği</label>
                            <textarea
                                rows={4}
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={editingComment.content}
                                onChange={(e) => setEditingComment({...editingComment, content: e.target.value})}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anahtar Kelimeler (Etiketler)</label>
                             <input 
                                type="text"
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={editingComment.tags.join(', ')}
                                onChange={(e) => setEditingComment({...editingComment, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sektör</label>
                             <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={editingComment.sector}
                                onChange={(e) => setEditingComment({...editingComment, sector: e.target.value as Sector})}
                             >
                                {Object.values(Sector).map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                             </select>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
