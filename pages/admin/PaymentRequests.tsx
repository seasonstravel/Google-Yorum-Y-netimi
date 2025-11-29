
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PaymentStatus } from '../../types';
import { formatDate } from '../../utils/helpers';
import { Banknote, CheckCircle, XCircle, Search, TrendingUp, AlertTriangle } from 'lucide-react';

export const PaymentRequests: React.FC = () => {
    const { paymentRequests, approvePayment, rejectPayment, pointConversionRate, setPointConversionRate } = useData();
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REJECTED'>('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [newRate, setNewRate] = useState(pointConversionRate);

    // Stats
    const totalPaid = paymentRequests.filter(r => r.status === PaymentStatus.PAID).reduce((acc, r) => acc + r.amountFiat, 0);
    const totalPending = paymentRequests.filter(r => r.status === PaymentStatus.PENDING).reduce((acc, r) => acc + r.amountFiat, 0);

    // Filter Logic
    const filteredRequests = paymentRequests.filter(req => {
        const matchesFilter = filter === 'ALL' || req.status === filter;
        const matchesSearch = req.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              req.userPhone.includes(searchTerm);
        return matchesFilter && matchesSearch;
    }).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

    const handleRateChange = () => {
        if (window.confirm(`Kur değişikliği yapmak istediğinize emin misiniz? Yeni kur: 1 Puan = ${newRate} TL`)) {
            setPointConversionRate(newRate);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Banknote className="mr-3 text-green-600" />
                Ödeme Talepleri
            </h1>

            {/* Top Bar: Stats & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Rate Setting */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Puan Kuru Ayarı</h3>
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400">1 Puan = ? TL</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                                value={newRate}
                                onChange={(e) => setNewRate(Number(e.target.value))}
                                step="0.1"
                            />
                        </div>
                        <button 
                            onClick={handleRateChange}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm h-[42px]"
                        >
                            Güncelle
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase mb-1">Bekleyen Ödemeler</h3>
                    <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                        {totalPending.toFixed(2)} TL
                    </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase mb-1">Toplam Ödenen</h3>
                    <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                        {totalPaid.toFixed(2)} TL
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex gap-2">
                    <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'ALL' ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Tümü</button>
                    <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'PENDING' ? 'bg-orange-100 text-orange-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Bekleyenler</button>
                    <button onClick={() => setFilter('PAID')} className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'PAID' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Ödenenler</button>
                    <button onClick={() => setFilter('REJECTED')} className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'REJECTED' ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Reddedilenler</button>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Kullanıcı Ara..." 
                        className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Kullanıcı</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tutar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Yöntem / Detay</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tarih</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Durum</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredRequests.map(req => (
                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{req.userName}</div>
                                    <div className="text-xs text-gray-500">{req.userPhone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 dark:text-white">{req.amountFiat} TL</div>
                                    <div className="text-xs text-gray-500">-{req.amountPoints} Puan</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-white font-medium">{req.method}</div>
                                    <div className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded w-fit select-all">
                                        {req.details}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(req.requestDate)}
                                </td>
                                <td className="px-6 py-4">
                                    {req.status === PaymentStatus.PENDING && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">Onay Bekliyor</span>
                                    )}
                                    {req.status === PaymentStatus.PAID && (
                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">Ödendi</span>
                                    )}
                                    {req.status === PaymentStatus.REJECTED && (
                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">Reddedildi</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {req.status === PaymentStatus.PENDING && (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => approvePayment(req.id)}
                                                className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" 
                                                title="Ödemeyi Onayla"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                            <button 
                                                onClick={() => rejectPayment(req.id)}
                                                className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" 
                                                title="Reddet ve Puanı İade Et"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        </div>
                                    )}
                                    {req.status === PaymentStatus.REJECTED && (
                                        <span className="text-xs text-red-500 flex items-center justify-end">
                                            <AlertTriangle size={12} className="mr-1"/> İade Edildi
                                        </span>
                                    )}
                                    {req.status === PaymentStatus.PAID && (
                                        <span className="text-xs text-green-600 flex items-center justify-end">
                                            <CheckCircle size={12} className="mr-1"/> Tamamlandı
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
