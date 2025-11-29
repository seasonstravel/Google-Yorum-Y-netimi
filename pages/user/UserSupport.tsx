
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TicketPriority, TicketStatus } from '../../types';
import { formatDate } from '../../utils/helpers';
import { LifeBuoy, Plus, Send, MessageCircle, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { clsx } from 'clsx';

export const UserSupport: React.FC = () => {
    const { user } = useAuth();
    const { tickets, createTicket, replyToTicket } = useData();
    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

    // Form State
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);

    if (!user) return null;

    const myTickets = tickets.filter(t => t.userId === user.id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const handleCreateTicket = () => {
        if (!subject || !message) return;
        createTicket(user.id, subject, message, priority);
        setIsNewTicketModalOpen(false);
        setSubject('');
        setMessage('');
        setPriority(TicketPriority.MEDIUM);
    };

    const handleReply = () => {
        if (!selectedTicketId || !replyMessage.trim()) return;
        replyToTicket(selectedTicketId, user.id, replyMessage);
        setReplyMessage('');
    };

    return (
        <div className="p-4 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <LifeBuoy className="mr-3 text-blue-600" />
                    Destek Taleplerim
                </h1>
                <button
                    onClick={() => setIsNewTicketModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    <Plus size={18} className="mr-2" /> Yeni Talep
                </button>
            </div>

            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* Ticket List */}
                <div className={`${selectedTicketId ? 'hidden md:block' : 'block'} w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300">Talepleriniz ({myTickets.length})</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {myTickets.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                                <p>Henüz destek talebiniz yok.</p>
                            </div>
                        ) : (
                            myTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={clsx(
                                        "p-3 rounded-lg cursor-pointer border transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20",
                                        selectedTicketId === ticket.id 
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500" 
                                            : "border-gray-100 dark:border-gray-700"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={clsx(
                                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                                            ticket.status === TicketStatus.OPEN ? "bg-green-100 text-green-700" : 
                                            ticket.status === TicketStatus.RESOLVED ? "bg-blue-100 text-blue-700" :
                                            "bg-gray-100 text-gray-600"
                                        )}>
                                            {ticket.status === TicketStatus.OPEN ? 'Açık' : ticket.status === TicketStatus.RESOLVED ? 'Yanıtlandı' : 'Kapalı'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{formatDate(ticket.updatedAt)}</span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ticket.messages[ticket.messages.length - 1].message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ticket Details & Chat */}
                <div className={`${!selectedTicketId ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex-col`}>
                    {!selectedTicket ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <LifeBuoy size={48} className="mb-4 opacity-20" />
                            <p>Detaylarını görmek için soldan bir talep seçin.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <div>
                                    <button onClick={() => setSelectedTicketId(null)} className="md:hidden text-gray-500 mr-2">
                                        <ChevronRight className="rotate-180" size={20} />
                                    </button>
                                    <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center">
                                        {selectedTicket.subject}
                                        <span className={clsx("ml-2 text-xs px-2 py-0.5 rounded border",
                                            selectedTicket.priority === TicketPriority.HIGH ? "bg-red-50 text-red-700 border-red-200" :
                                            selectedTicket.priority === TicketPriority.MEDIUM ? "bg-orange-50 text-orange-700 border-orange-200" :
                                            "bg-green-50 text-green-700 border-green-200"
                                        )}>
                                            {selectedTicket.priority === 'HIGH' ? 'Yüksek' : selectedTicket.priority === 'MEDIUM' ? 'Orta' : 'Düşük'} Öncelik
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-500">Talep No: #{selectedTicket.id.slice(0, 8)}</p>
                                </div>
                                <div>
                                    {selectedTicket.status === TicketStatus.CLOSED && (
                                        <span className="flex items-center text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                                            <CheckCircle size={14} className="mr-1" /> Kapalı
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
                                {selectedTicket.messages.map((msg) => (
                                    <div key={msg.id} className={clsx("flex flex-col max-w-[80%]", msg.isAdmin ? "mr-auto items-start" : "ml-auto items-end")}>
                                        <div className={clsx(
                                            "p-3 rounded-lg text-sm shadow-sm",
                                            msg.isAdmin 
                                                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-600" 
                                                : "bg-blue-600 text-white rounded-tr-none"
                                        )}>
                                            <p>{msg.message}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1">
                                            {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
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
                                            placeholder="Mesajınızı yazın..."
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
                                    Bu talep kapatılmıştır. Yeni bir sorun için lütfen yeni talep oluşturun.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* New Ticket Modal */}
            <Modal
                isOpen={isNewTicketModalOpen}
                onClose={() => setIsNewTicketModalOpen(false)}
                title="Yeni Destek Talebi"
                footer={
                    <>
                        <button
                            onClick={() => setIsNewTicketModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleCreateTicket}
                            disabled={!subject || !message}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Oluştur
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konu</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Örn: Görev linki çalışmıyor"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Öncelik</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        >
                            <option value={TicketPriority.LOW}>Düşük - Bilgi almak istiyorum</option>
                            <option value={TicketPriority.MEDIUM}>Orta - Bir sorunum var</option>
                            <option value={TicketPriority.HIGH}>Yüksek - Acil durum</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mesajınız</label>
                        <textarea 
                            rows={4}
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Sorununuzu detaylı bir şekilde açıklayınız..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};
