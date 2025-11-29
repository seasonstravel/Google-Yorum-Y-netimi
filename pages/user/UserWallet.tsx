
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PaymentMethod, PaymentStatus } from '../../types';
import { Wallet, CreditCard, History, Coins, ArrowRight, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export const UserWallet: React.FC = () => {
    const { user } = useAuth();
    const { requestPayment, paymentRequests, pointConversionRate } = useData();

    const [amount, setAmount] = useState<number>(10);
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.IBAN);
    const [details, setDetails] = useState('');

    if (!user) return null;

    // Filter requests for current user
    const myRequests = paymentRequests.filter(r => r.userId === user.id).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

    const fiatBalance = user.points * pointConversionRate;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestPayment(user.id, amount, method, details);
        // Reset form
        setAmount(10);
        setDetails('');
    };

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Wallet className="mr-3 text-blue-600" />
                Cüzdanım
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Toplam Bakiye</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-bold">{fiatBalance.toFixed(2)} TL</h2>
                        </div>
                        <div className="mt-4 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/20">
                            <Coins size={16} className="text-yellow-300" />
                            <span className="text-sm font-medium">{user.points} Puan</span>
                        </div>
                        <div className="mt-6 flex items-center text-xs text-blue-200">
                            <TrendingUp size={14} className="mr-1" />
                            Güncel Kur: 1 Puan = {pointConversionRate} TL
                        </div>
                    </div>
                    {/* Decor */}
                    <div className="absolute -right-6 -bottom-6 text-white/10 transform rotate-12">
                        <Wallet size={160} />
                    </div>
                </div>

                {/* Request Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <CreditCard className="mr-2 text-green-500" />
                        Ödeme Talep Et
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Çekilecek Puan Miktarı</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    min="1"
                                    max={user.points}
                                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white pl-10"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    required
                                />
                                <Coins className="absolute left-3 top-3 text-gray-400" size={18} />
                                <div className="absolute right-3 top-3 text-sm font-bold text-green-600">
                                    = {(amount * pointConversionRate).toFixed(2)} TL
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ödeme Yöntemi</label>
                            <select 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={method}
                                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                            >
                                <option value={PaymentMethod.IBAN}>IBAN (Banka Hesabı)</option>
                                <option value={PaymentMethod.PAPARA}>Papara</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {method === PaymentMethod.IBAN ? 'IBAN Numarası' : 'Papara Numarası'}
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={method === PaymentMethod.IBAN ? 'TR00 0000 ...' : '1234567890'}
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={user.points < amount || amount <= 0}
                            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            <span className="mr-2">Talep Oluştur</span>
                            <ArrowRight size={18} />
                        </button>
                        
                        {user.points < amount && (
                            <div className="flex items-center text-xs text-red-500 mt-2">
                                <AlertCircle size={14} className="mr-1" />
                                Yetersiz bakiye.
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <History className="mr-2 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">İşlem Geçmişi</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3">Tutar</th>
                                <th className="px-6 py-3">Yöntem</th>
                                <th className="px-6 py-3">Detay</th>
                                <th className="px-6 py-3">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Henüz işlem geçmişiniz yok.</td>
                                </tr>
                            ) : (
                                myRequests.map(req => (
                                    <tr key={req.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4">{formatDate(req.requestDate)}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                            {req.amountFiat} TL <span className="text-xs font-normal text-gray-500">({req.amountPoints} P)</span>
                                        </td>
                                        <td className="px-6 py-4">{req.method}</td>
                                        <td className="px-6 py-4 truncate max-w-[150px]">{req.details}</td>
                                        <td className="px-6 py-4">
                                            {req.status === PaymentStatus.PENDING && (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-200">Bekliyor</span>
                                            )}
                                            {req.status === PaymentStatus.PAID && (
                                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded border border-green-200">Ödendi</span>
                                            )}
                                            {req.status === PaymentStatus.REJECTED && (
                                                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded border border-red-200">Reddedildi</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
