import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { MessageCircle, X, Check, Bell } from 'lucide-react';
import { clsx } from 'clsx';

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { messages, markMessageRead } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  // Filter messages for current user
  const myMessages = messages.filter(m => m.receiverId === user.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const unreadCount = myMessages.filter(m => !m.isRead).length;

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, myMessages]);

  const handleOpen = () => {
      setIsOpen(!isOpen);
      // Mark visible messages as read when opening (optional, maybe wait for user action)
      // For now, we keep them unread until user sees them. 
  };

  const handleMarkAsRead = (id: string) => {
      markMessageRead(id);
  }

  const formatTime = (iso: string) => {
      return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Box */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[500px] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bell size={18} />
                    <span className="font-bold">Bildirimler & Mesajlar</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
                    <X size={18} />
                </button>
            </div>
            
            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 min-h-[300px]">
                {myMessages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p>Henüz mesajınız yok.</p>
                    </div>
                ) : (
                    myMessages.map(msg => (
                        <div key={msg.id} className="flex flex-col gap-1">
                            <div className={clsx(
                                "p-3 rounded-lg text-sm shadow-sm border relative group",
                                msg.type === 'SYSTEM' 
                                    ? "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" 
                                    : "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100"
                            )}>
                                <p>{msg.content}</p>
                                <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">{formatTime(msg.timestamp)}</span>
                                
                                {!msg.isRead && (
                                    <button 
                                        onClick={() => handleMarkAsRead(msg.id)}
                                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5 shadow hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Okundu İşaretle"
                                    >
                                        <Check size={12} />
                                    </button>
                                )}
                            </div>
                            {/* Read Status Indicator */}
                            {/* <span className="text-[10px] text-gray-400 self-end">{msg.isRead ? 'Okundu' : 'Yeni'}</span> */}
                        </div>
                    ))
                )}
            </div>
            
            {/* Input (Disabled for now as per requirement 'Notification System') */}
            {/* <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-center text-gray-400">Bu alan sadece bildirim içindir.</p>
            </div> */}
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={handleOpen}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 relative flex items-center justify-center"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                {unreadCount}
            </span>
        )}
      </button>
    </div>
  );
};