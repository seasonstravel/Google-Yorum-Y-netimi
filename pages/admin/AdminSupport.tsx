
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TicketStatus, TicketPriority } from '../../types';
import { formatDate } from '../../utils/helpers';
import { LifeBuoy, Send, MessageCircle, CheckCircle, XCircle, Search, Filter, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export const AdminSupport: React.FC = () => {
    const { user } = useAuth();
    const { tickets, replyToTicket, updateTicketStatus } = useData();
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED' | 'CLOSED'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    if (!user) return null;

    const filteredTickets = tickets.filter(t => {
        const matchesStatus = filterStatus === 'ALL' ? true : t.status === filterStatus;
        const matchesSearch = t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.subject.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const handleReply = () => {
        if (!selectedTicketId || !replyMessage.trim()) return;
        replyToTicket(selectedTicketId, user.id, replyMessage);
        setReplyMessage('');
    };

    const handleChangeStatus = (status: TicketStatus) => {
        if (selectedTicketId) {
            updateTicketStatus(selectedTicketId, status);
        }
    };

    return (
        <div className="p-4 h-[calc(100vh-80px)] flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center shrink-0">
                <LifeBuoy className="mr-3 text-blue-600" />
                Destek Merkezi
            </h1>

            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* Left Panel: Ticket List */}
                <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col">
                    {/* Filters */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Talep veya kullanıcı ara..." 
                                className="w-full pl-9 p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button onClick={() => setFilterStatus('ALL')} className={clsx("px-3 py-1 text-xs rounded-full whitespace-nowrap", filterStatus === 'ALL' ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700")}>Tümü</button>
                            <button onClick={() => setFilterStatus('OPEN')} className={clsx("px-3 py-1 text-xs rounded-full whitespace-nowrap", filterStatus === 'OPEN' ? "bg-green-600 text-white" : "bg-green-100 text-green-800")}>Açık</button>
                            <button onClick={() => setFilterStatus('RESOLVED')} className={clsx("px-3 py-1 text-xs rounded-full whitespace-nowrap", filterStatus === 'RESOLVED' ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800")}>Yanıtlanan</button>
                            <button onClick={() => setFilterStatus('CLOSED')} className={clsx("px-3 py-1 text-xs rounded-full whitespace-nowrap", filterStatus === 'CLOSED' ? "bg-gray-600 text-white" : "bg-gray-200 text-gray-700")}>Kapalı</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredTickets.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p>Talep bulunamadı.</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={clsx(
                                        "p-3 rounded-lg cursor-pointer border transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50",
                                        selectedTicketId === ticket.id 
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                            : "border-gray-100 dark:border-gray-700"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {ticket.priority === TicketPriority.HIGH && <AlertCircle size={14} className="text-red-500" />}
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{ticket.userName}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{formatDate(ticket.updatedAt)}</span>
                                    </div>
                                    <h3 className="font-medium text-sm text-blue-600 dark:text-blue-400 truncate mb-1">{ticket.subject}</h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{ticket.messages[ticket.messages.length - 1].message}</p>
                                        <span className={clsx(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                            ticket.status === TicketStatus.OPEN ? "bg-green-100 text-green-700" : 
                                            ticket.status === TicketStatus.RESOLVED ? "bg-blue-100 text-blue-700" :
                                            "bg-gray-100 text-gray-600"
                                        )}>
                                            {ticket.status === TicketStatus.OPEN ? 'Açık' : ticket.status === TicketStatus.RESOLVED ? 'Yanıtlandı' : 'Kapalı'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Details & Action */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col">
                    {!selectedTicket ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <LifeBuoy size={64} className="mb-4 opacity-20" />
                            <p>Detayları görüntülemek için bir talep seçin.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <div>
                                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>{selectedTicket.userName}</span>
                                        <span>•</span>
                                        <span className={clsx(
                                            "flex items-center gap-1",
                                            selectedTicket.priority === 'HIGH' ? "text-red-600" : "text-gray-600"
                                        )}>
                                            {selectedTicket.priority === 'HIGH' ? <AlertCircle size={12}/> : <Clock size={12}/>}
                                            {selectedTicket.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTicket.status !== TicketStatus.CLOSED ? (
                                        <button 
                                            onClick={() => handleChangeStatus(TicketStatus.CLOSED)}
                                            className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs font-medium transition-colors"
                                        >
                                            <XCircle size={14} className="mr-1" /> Talebi Kapat
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleChangeStatus(TicketStatus.OPEN)}
                                            className="flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium transition-colors"
                                        >
                                            <CheckCircle size={14} className="mr-1" /> Yeniden Aç
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
                                {selectedTicket.messages.map((msg) => (
                                    <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                                        <div className={clsx(
                                            "p-3 rounded-lg text-sm shadow-sm",
                                            msg.isAdmin 
                                                ? "bg-blue-600 text-white rounded-tr-none" 
                                                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600"
                                        )}>
                                            <p>{msg.message}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                            {msg.isAdmin ? 'Siz' : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            {selectedTicket.status !== TicketStatus.CLOSED ? (
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Cevap yazın..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                        />
                                        <button 
                                            onClick={handleReply}
                                            disabled={!replyMessage.trim()}
                                            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                    Bu talep kapatılmıştır.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
