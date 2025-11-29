

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Business, TaskStatus, CITIES } from '../../types';
import { Pencil, Trash2, Plus, ExternalLink, TrendingUp, MapPin } from 'lucide-react';
import { Modal } from '../../components/Modal';

export const Businesses: React.FC = () => {
    const { businesses, tasks, addBusiness, updateBusiness, deleteBusiness } = useData();

    // State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mapsUrl: '',
        city: 'İstanbul',
        targetReviewCount: 10
    });

    const openAddModal = () => {
        setEditingBusiness(null);
        setFormData({ name: '', mapsUrl: '', city: 'İstanbul', targetReviewCount: 10 });
        setIsModalOpen(true);
    };

    const openEditModal = (business: Business) => {
        setEditingBusiness(business);
        setFormData({ 
            name: business.name, 
            mapsUrl: business.mapsUrl,
            city: business.city || 'İstanbul',
            targetReviewCount: business.targetReviewCount || 0
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (id: string) => {
        setBusinessToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingBusiness) {
            updateBusiness({
                ...editingBusiness,
                name: formData.name,
                mapsUrl: formData.mapsUrl,
                city: formData.city,
                targetReviewCount: Number(formData.targetReviewCount)
            });
        } else {
            addBusiness({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name,
                mapsUrl: formData.mapsUrl,
                city: formData.city,
                targetReviewCount: Number(formData.targetReviewCount)
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (businessToDelete) {
            deleteBusiness(businessToDelete);
            setIsDeleteModalOpen(false);
            setBusinessToDelete(null);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">İşletme Yönetimi</h1>
                <button 
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} className="mr-2" /> Yeni İşletme
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşletme Adı</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Şehir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">İlerleme Durumu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harita Linki</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {businesses.map(b => {
                            const businessTasks = tasks.filter(t => t.businessId === b.id);
                            const publishedCount = businessTasks.filter(t => t.status === TaskStatus.PUBLISHED).length;
                            const target = b.targetReviewCount || 0;
                            const remaining = Math.max(0, target - publishedCount);
                            const progressPercent = target > 0 ? Math.min(100, Math.round((publishedCount / target) * 100)) : 0;

                            return (
                                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                                        {b.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <MapPin size={14} className="mr-1 text-gray-400" />
                                            {b.city || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full max-w-xs">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    Hedef: {target}
                                                </span>
                                                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                    {publishedCount} Yayında
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 mb-1">
                                                <div 
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-end">
                                                <span className="text-xs text-red-500 font-medium">
                                                    Kalan: {remaining}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-blue-500 hover:underline">
                                        <a href={b.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center">
                                            Haritada Gör <ExternalLink size={14} className="ml-1"/>
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => openEditModal(b)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(b.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingBusiness ? 'İşletme Düzenle' : 'Yeni İşletme Ekle'}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Kaydet
                        </button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">İşletme Adı</label>
                        <input 
                            type="text" 
                            required 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Şehir</label>
                        <select
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        >
                            <option value="İstanbul">İstanbul</option>
                            {CITIES.filter(c => c !== 'İstanbul').map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hedef Yorum Sayısı</label>
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-gray-500" />
                            <input 
                                type="number" 
                                required 
                                min="1"
                                value={formData.targetReviewCount} 
                                onChange={e => setFormData({...formData, targetReviewCount: parseInt(e.target.value)})} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" 
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Bu işletme için toplam kaç adet yorum yapılacağını belirtin.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Harita Linki</label>
                        <input 
                            type="url" 
                            required 
                            value={formData.mapsUrl} 
                            onChange={e => setFormData({...formData, mapsUrl: e.target.value})} 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" 
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="İşletmeyi Sil"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                            Sil
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bu işletmeyi silmek istediğinize emin misiniz?
                </p>
            </Modal>
        </div>
    );
};