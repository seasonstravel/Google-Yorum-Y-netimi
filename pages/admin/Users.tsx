

import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { UserRole, User, Gender, LocalGuideStatus, LocalGuideLevel, CITIES } from '../../types';
import { Pencil, Trash2, Plus, Upload, Download, FileSpreadsheet, History, MapPin, Calendar, Search, Map, Check, X, Settings, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { formatDate, getUserLevel } from '../../utils/helpers';
import * as XLSX from 'xlsx';
import { clsx } from 'clsx';

export const Users: React.FC = () => {
    const { users, tasks, businesses, addUser, addUsersBulk, updateUser, deleteUser, deleteUsersBulk, approveLocalGuideLevel, rejectLocalGuideLevel, levelMultipliers, updateLevelMultipliers } = useData();
    
    // State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bulk Actions State
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // History Modal State
    const [historyUser, setHistoryUser] = useState<User | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
    // Point Settings Modal
    const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
    const [tempMultipliers, setTempMultipliers] = useState<Record<number, number>>(levelMultipliers);

    // Filter for Pending Requests
    const [showOnlyPending, setShowOnlyPending] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: UserRole.USER,
        gender: Gender.UNSPECIFIED,
        city: 'İstanbul',
        localGuideLevel: LocalGuideLevel.NONE,
        localGuideStatus: LocalGuideStatus.NONE,
        points: 0
    });

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.role === UserRole.USER).length;
    const pendingRequests = users.filter(u => u.localGuideStatus === LocalGuideStatus.PENDING).length;

    const filteredUsers = showOnlyPending 
        ? users.filter(u => u.localGuideStatus === LocalGuideStatus.PENDING) 
        : users;

    // --- Bulk Selection Handlers ---

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    const handleSelectUser = (id: string) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(prev => prev.filter(uid => uid !== id));
        } else {
            setSelectedUsers(prev => [...prev, id]);
        }
    };

    const handleBulkDelete = () => {
        deleteUsersBulk(selectedUsers);
        setIsBulkDeleteModalOpen(false);
        setSelectedUsers([]);
    };

    // --- User CRUD Handlers ---

    const openAddModal = () => {
        setEditingUser(null);
        setFormData({ 
            name: '', 
            phone: '', 
            role: UserRole.USER, 
            gender: Gender.UNSPECIFIED,
            city: 'İstanbul',
            localGuideLevel: LocalGuideLevel.NONE,
            localGuideStatus: LocalGuideStatus.NONE,
            points: 0
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({ 
            name: user.name, 
            phone: user.phone, 
            role: user.role, 
            gender: user.gender,
            city: user.city || 'İstanbul',
            localGuideLevel: user.localGuideLevel,
            localGuideStatus: user.localGuideStatus,
            points: user.points
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (userId: string) => {
        setUserToDelete(userId);
        setIsDeleteModalOpen(true);
    };

    const openHistoryModal = (user: User) => {
        setHistoryUser(user);
        setIsHistoryModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingUser) {
            // Update
            updateUser({
                ...editingUser,
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                gender: formData.gender,
                city: formData.city,
                localGuideLevel: formData.localGuideLevel,
                localGuideStatus: formData.localGuideStatus,
                points: Number(formData.points)
            });
        } else {
            // Add
            addUser({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name,
                phone: formData.phone,
                role: formData.role,
                gender: formData.gender,
                city: formData.city,
                points: Number(formData.points),
                completedTasks: 0,
                localGuideLevel: formData.localGuideLevel,
                localGuideStatus: formData.localGuideStatus
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete);
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    const handleSavePoints = () => {
        updateLevelMultipliers(tempMultipliers);
        setIsPointsModalOpen(false);
    }

    // --- Excel Functions ---

    const downloadTemplate = () => {
        const templateData = [
            {
                'Ad Soyad': 'Örnek Kullanıcı 1',
                'Telefon': '905551234567',
                'Rol (admin/user)': 'user',
                'Cinsiyet (E/K)': 'E',
                'Şehir': 'İstanbul'
            },
            {
                'Ad Soyad': 'Örnek Kullanıcı 2',
                'Telefon': '905559876543',
                'Rol (admin/user)': 'user',
                'Cinsiyet (E/K)': 'K',
                'Şehir': 'Ankara'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kullanıcılar");
        XLSX.writeFile(wb, "Kullanici_Yukleme_Sablonu.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const newUsers: User[] = [];
            
            data.forEach((row: any) => {
                const name = row['Ad Soyad'];
                const phone = row['Telefon'] ? String(row['Telefon']) : ''; 
                const roleStr = row['Rol (admin/user)']?.toLowerCase();
                const genderStr = row['Cinsiyet (E/K)']?.toUpperCase();
                const city = row['Şehir'] || 'İstanbul';
                
                let role = UserRole.USER;
                if (roleStr === 'admin') role = UserRole.ADMIN;

                let gender = Gender.UNSPECIFIED;
                if (genderStr === 'E' || genderStr === 'ERKEK') gender = Gender.MALE;
                if (genderStr === 'K' || genderStr === 'KADIN') gender = Gender.FEMALE;

                if (name && phone) {
                    newUsers.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: name,
                        phone: phone,
                        role: role,
                        gender: gender,
                        city: city,
                        points: 0,
                        completedTasks: 0,
                        localGuideLevel: 0,
                        localGuideStatus: LocalGuideStatus.NONE
                    });
                }
            });

            if (newUsers.length > 0) {
                addUsersBulk(newUsers);
                alert(`${newUsers.length} kullanıcı başarıyla eklendi!`);
                setIsUploadModalOpen(false);
            } else {
                alert('Dosyadan geçerli kullanıcı okunamadı. Lütfen şablonu kontrol edin.');
            }
        };
        reader.readAsBinaryString(file);
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4">
            <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h1>
                <div className="flex gap-2 flex-wrap justify-end">
                    {selectedUsers.length > 0 && (
                        <button 
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm animate-in fade-in"
                        >
                            <Trash2 size={18} className="mr-2" /> Seçilenleri Sil ({selectedUsers.length})
                        </button>
                    )}
                    <button 
                        onClick={() => setShowOnlyPending(!showOnlyPending)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors ${showOnlyPending ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Map size={18} className="mr-2" />
                        {showOnlyPending ? 'Tümünü Göster' : `Onay Bekleyenler (${pendingRequests})`}
                    </button>
                    <button 
                        onClick={() => { setTempMultipliers(levelMultipliers); setIsPointsModalOpen(true); }}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                        <Settings size={18} className="mr-2" /> Puan Ayarları
                    </button>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                        <FileSpreadsheet size={18} className="mr-2" /> Excel ile Yükle
                    </button>
                    <button 
                        onClick={openAddModal}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                        <Plus size={18} className="mr-2" /> Yeni Kullanıcı
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">Toplam Kullanıcı</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">Aktif Görevli</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-indigo-500">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">Toplam Puan</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {users.reduce((acc, u) => acc + u.points, 0)}
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                    {selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length ? (
                                        <CheckSquare size={20} />
                                    ) : selectedUsers.length > 0 ? (
                                        <MinusSquare size={20} />
                                    ) : (
                                        <Square size={20} />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Şehir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Yerel Rehber</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Seviye</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Puan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map(u => {
                            const level = getUserLevel(u.points);
                            const isSelected = selectedUsers.includes(u.id);
                            return (
                                <tr key={u.id} className={clsx("hover:bg-gray-50 dark:hover:bg-gray-700/50", isSelected && "bg-blue-50 dark:bg-blue-900/20")}>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleSelectUser(u.id)} className="text-gray-400 hover:text-blue-600">
                                            {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <MapPin size={14} className="mr-1 text-gray-400" />
                                            {u.city || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{u.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.localGuideStatus === LocalGuideStatus.PENDING ? (
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                                    Seviye {u.pendingLocalGuideLevel}?
                                                </span>
                                                <button onClick={() => approveLocalGuideLevel(u.id)} className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200" title="Onayla">
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => rejectLocalGuideLevel(u.id)} className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200" title="Reddet">
                                                    <X size={14} />
                                                </button>
                                                {u.localGuideProofUrl && (
                                                    <a href={u.localGuideProofUrl} target="_blank" rel="noreferrer" className="p-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200" title="Kanıtı Gör">
                                                        <Search size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : u.localGuideLevel > 0 ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                Seviye {u.localGuideLevel} (x{levelMultipliers[u.localGuideLevel]})
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${level.color}`}>
                                            <span className="mr-1">{level.icon}</span> {level.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`font-bold ${u.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {u.points > 0 ? '+' : ''}{u.points}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                        <button
                                            onClick={() => openHistoryModal(u)}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                            title="Görev Geçmişi"
                                        >
                                            <History size={18} />
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(u)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            title="Düzenle"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => openDeleteModal(u.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Sil"
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

            {/* History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={`${historyUser?.name} - Görev Geçmişi`}
                footer={
                    <button
                        onClick={() => setIsHistoryModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Kapat
                    </button>
                }
            >
                <div className="max-h-[400px] overflow-y-auto pr-2">
                    {historyUser && (
                        (() => {
                            const userTasks = tasks.filter(t => t.userId === historyUser.id).sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
                            
                            if (userTasks.length === 0) {
                                return <div className="text-center py-6 text-gray-500">Bu kullanıcıya ait görev bulunamadı.</div>;
                            }

                            return (
                                <div className="space-y-3">
                                    {userTasks.map(task => {
                                        const business = businesses.find(b => b.id === task.businessId);
                                        return (
                                            <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center text-sm font-semibold text-gray-900 dark:text-white">
                                                        <MapPin size={14} className="mr-1.5 text-blue-500" />
                                                        {business?.name || 'Bilinmeyen İşletme'}
                                                    </div>
                                                    <Badge status={task.status} />
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <Calendar size={12} className="mr-1.5" />
                                                        {formatDate(task.assignedDate)}
                                                    </div>
                                                    <span>{task.shift}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()
                    )}
                </div>
            </Modal>

            {/* Edit/Add Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
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
                <form className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ad Soyad</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefon</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            >
                                <option value={UserRole.USER}>Kullanıcı</option>
                                <option value={UserRole.ADMIN}>Yönetici</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cinsiyet</label>
                            <select
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            >
                                <option value={Gender.UNSPECIFIED}>Seçiniz</option>
                                <option value={Gender.MALE}>Erkek</option>
                                <option value={Gender.FEMALE}>Kadın</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yerel Rehber Seviyesi</label>
                            <select
                                value={formData.localGuideLevel}
                                onChange={e => setFormData({...formData, localGuideLevel: Number(e.target.value) as LocalGuideLevel})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            >
                                <option value={0}>Yok (0)</option>
                                {[1,2,3,4,5,6,7,8,9,10].map(l => (
                                    <option key={l} value={l}>Seviye {l}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rehber Durumu</label>
                            <select
                                value={formData.localGuideStatus}
                                onChange={e => setFormData({...formData, localGuideStatus: e.target.value as LocalGuideStatus})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            >
                                <option value={LocalGuideStatus.NONE}>Yok</option>
                                <option value={LocalGuideStatus.PENDING}>Bekliyor</option>
                                <option value={LocalGuideStatus.APPROVED}>Onaylı</option>
                                <option value={LocalGuideStatus.REJECTED}>Reddedildi</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mevcut Puan</label>
                            <input 
                                type="number" 
                                value={formData.points} 
                                onChange={e => setFormData({...formData, points: Number(e.target.value)})} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border" 
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Point Settings Modal */}
             <Modal
                isOpen={isPointsModalOpen}
                onClose={() => setIsPointsModalOpen(false)}
                title="Seviye Puan Ayarları"
                footer={
                    <>
                        <button
                            onClick={() => setIsPointsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSavePoints}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Kaydet
                        </button>
                    </>
                }
            >
                <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
                    <p className="text-sm text-gray-500 mb-2">Her Yerel Rehber seviyesi için görev başına kazanılacak puan katsayısını belirleyin. (Örn: 2.5 yaparsanız 1 görevden 2.5 puan kazanılır)</p>
                    <div className="grid grid-cols-2 gap-4">
                        {[1,2,3,4,5,6,7,8,9,10].map(level => (
                            <div key={level}>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Seviye {level}</label>
                                <input 
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={tempMultipliers[level]}
                                    onChange={(e) => setTempMultipliers({...tempMultipliers, [level]: parseFloat(e.target.value)})}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Excel ile Toplu Kullanıcı Yükle"
                footer={
                    <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Kapat
                    </button>
                }
            >
                <div className="space-y-6 text-center">
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <Upload size={48} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Excel dosyanızı (.xlsx) seçin
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                            dark:file:bg-gray-600 dark:file:text-white
                            "
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Örnek Şablon</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Yükleme yapmadan önce doğru formatı görmek için örnek şablonu indirin.
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Download size={16} className="mr-2" />
                            Şablon İndir (.xlsx)
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Kullanıcıyı Sil"
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
                    Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
            </Modal>

            {/* Bulk Delete Modal */}
            <Modal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                title="Toplu Silme Onayı"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsBulkDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Vazgeç
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                            Sil ({selectedUsers.length})
                        </button>
                    </>
                }
            >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Seçili {selectedUsers.length} kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu kullanıcılara ait tüm görev geçmişi de silinecektir.
                </p>
            </Modal>
        </div>
    );
};