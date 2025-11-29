
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TaskStatus, Task } from '../../types';
import { Badge } from '../../components/Badge';
import { ExternalLink, Check, X, Trash2, Link as LinkIcon, MessageCircle, Bot, Loader2, Filter, Calendar, Save } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { createWhatsAppLink, formatDate } from '../../utils/helpers';

export const Reviews: React.FC = () => {
  const { tasks, users, businesses, updateTaskStatus, submitReview, checkGoogleStatus } = useData();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [linkInput, setLinkInput] = useState('');
  
  // Inline Link Input State
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  
  // Filtering State
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Bot State
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botResult, setBotResult] = useState<{published: number, spam: number} | null>(null);

  // --- Handlers ---

  const handleLinkInputChange = (taskId: string, val: string) => {
      setLinkInputs(prev => ({ ...prev, [taskId]: val }));
  };

  const handleInlineSaveLink = (taskId: string) => {
      const link = linkInputs[taskId];
      if (link) {
          submitReview(taskId, link, TaskStatus.PUBLISHED);
          setLinkInputs(prev => {
              const next = { ...prev };
              delete next[taskId];
              return next;
          });
      }
  };

  const handleOpenLinkModal = (task: Task) => {
      setSelectedTask(task);
      setLinkInput(task.reviewLink || '');
      setIsLinkModalOpen(true);
  };

  const handleSaveLink = () => {
      if (selectedTask && linkInput) {
          // Admin linki girdiğinde otomatik olarak PUBLISHED yapıyoruz
          submitReview(selectedTask.id, linkInput, TaskStatus.PUBLISHED);
          setIsLinkModalOpen(false);
          setLinkInput('');
          setSelectedTask(null);
      }
  };

  const handleWhatsAppNotify = (task: Task) => {
      const user = users.find(u => u.id === task.userId);
      const business = businesses.find(b => b.id === task.businessId);
      
      if (!user || !business) return;

      const dateObj = new Date(task.assignedDate);
      const timeStr = dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});

      let message = `Merhaba ${user.name},\n\n`;
      
      if (task.status === TaskStatus.PUBLISHED) {
        message += `🎉 Teşekkürler! ${business.name} için yaptığın yorum onaylandı ve sistemde yayına alındı. Puanın hesabına eklendi.`;
      } else {
        message += `📅 Hatırlatma: ${formatDate(task.assignedDate)} - ${timeStr} için ${business.name} işletmesine görev atamanız bulunmaktadır.\n\nLütfen yorumunuzu yapıp linki iletiniz.\n📍 İşletme Linki: ${business.mapsUrl}`;
      }
      
      window.open(createWhatsAppLink(user.phone, message), '_blank');
  };

  const handleCompensationRequest = (task: Task) => {
    const user = users.find(u => u.id === task.userId);
    const business = businesses.find(b => b.id === task.businessId);
    
    if (!user || !business) return;

    const message = `Merhaba ${user.name},\n\nÜzgünüz, ${business.name} işletmesine yaptığın yorum sistemler tarafından silinmiş veya spam olarak algılanmış görünüyor 😔.\n\nPuanını geri kazanmak için telafi yorumu yapabilir misin?\n📍 Link: ${business.mapsUrl}\n\nTeşekkürler!`;
    
    window.open(createWhatsAppLink(user.phone, message), '_blank');
  };

  const handleRunBot = async () => {
      setIsBotRunning(true);
      setBotResult(null);
      
      const result = await checkGoogleStatus();
      
      setBotResult(result);
      setIsBotRunning(false);
  };

  // Filter Tasks Logic
  const filteredTasks = tasks.filter(task => {
      // 1. Business Filter
      if (selectedBusinessId !== 'all' && task.businessId !== selectedBusinessId) {
          return false;
      }

      // 2. Date Filter
      if (dateFilter !== 'all') {
          const taskDate = new Date(task.assignedDate);
          const today = new Date();
          // Reset times for accurate date comparison
          taskDate.setHours(0,0,0,0);
          today.setHours(0,0,0,0);

          if (dateFilter === 'today') {
              if (taskDate.getTime() !== today.getTime()) return false;
          } else if (dateFilter === 'week') {
              const oneWeekAgo = new Date(today);
              oneWeekAgo.setDate(today.getDate() - 7);
              if (taskDate < oneWeekAgo || taskDate > today) return false;
          } else if (dateFilter === 'month') {
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              if (taskDate.getMonth() !== currentMonth || taskDate.getFullYear() !== currentYear) return false;
          }
      }

      return true;
  });

  // Sort: Assigned first, then pending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (a.status === TaskStatus.ASSIGNED && b.status !== TaskStatus.ASSIGNED) return -1;
      if (a.status !== TaskStatus.ASSIGNED && b.status === TaskStatus.ASSIGNED) return 1;
      return 0;
  });

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yorum Kontrol & Giriş Paneli</h1>
          
          <button
            onClick={handleRunBot}
            disabled={isBotRunning}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait w-full md:w-auto justify-center"
          >
            {isBotRunning ? (
                <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Google Taranıyor...
                </>
            ) : (
                <>
                    <Bot className="mr-2" size={18} />
                    Google Botunu Çalıştır
                </>
            )}
          </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <Filter size={18} className="text-gray-500 dark:text-gray-400" />
            <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
            >
                <option value="all">Tüm İşletmeler</option>
                {businesses.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center text-gray-500 dark:text-gray-400 mr-2 md:hidden">
                <Calendar size={18} />
            </div>
            <div className="flex rounded-md shadow-sm w-full md:w-auto" role="group">
                <button
                    type="button"
                    onClick={() => setDateFilter('all')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 ${dateFilter === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-white text-gray-900'}`}
                >
                    Tümü
                </button>
                <button
                    type="button"
                    onClick={() => setDateFilter('today')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border-t border-b border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 ${dateFilter === 'today' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-white text-gray-900'}`}
                >
                    Bugün
                </button>
                <button
                    type="button"
                    onClick={() => setDateFilter('week')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border-t border-b border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 ${dateFilter === 'week' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-white text-gray-900'}`}
                >
                    Hafta
                </button>
                <button
                    type="button"
                    onClick={() => setDateFilter('month')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 ${dateFilter === 'month' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-white text-gray-900'}`}
                >
                    Ay
                </button>
            </div>
        </div>
      </div>
      
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Kullanıcı</th>
              <th scope="col" className="px-6 py-3">İşletme</th>
              <th scope="col" className="px-6 py-3">Yorum Linki</th>
              <th scope="col" className="px-6 py-3">Durum</th>
              <th scope="col" className="px-6 py-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map(task => {
              const user = users.find(u => u.id === task.userId);
              const business = businesses.find(b => b.id === task.businessId);
              
              return (
                <tr key={task.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {user?.name}
                    <div className="text-xs text-gray-500">{user?.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    {business?.name}
                  </td>
                  <td className="px-6 py-4">
                    {task.reviewLink ? (
                      <a href={task.reviewLink} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline">
                        Görüntüle <ExternalLink size={14} className="ml-1" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative w-full min-w-[160px]">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <LinkIcon size={12} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Link yapıştır..."
                                value={linkInputs[task.id] || ''}
                                onChange={(e) => handleLinkInputChange(task.id, e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => handleInlineSaveLink(task.id)}
                            disabled={!linkInputs[task.id]}
                            className="p-1.5 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            title="Kaydet ve Onayla"
                        >
                            <Save size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={task.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {/* WhatsApp Bildir */}
                      <button
                        onClick={() => handleWhatsAppNotify(task)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded border border-green-200"
                        title="WhatsApp ile Bildir"
                      >
                        <MessageCircle size={18} />
                      </button>

                      {/* Manuel Link Ekleme / Güncelleme (Modal) */}
                      <button
                        onClick={() => handleOpenLinkModal(task)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded border border-blue-200"
                        title={task.reviewLink ? "Linki Güncelle" : "Detaylı Link Ekle"}
                      >
                        <LinkIcon size={18} />
                      </button>

                      {/* Onayla */}
                      <button
                        onClick={() => updateTaskStatus(task.id, TaskStatus.PUBLISHED)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded border border-green-200"
                        title="Onayla (+1 Puan)"
                      >
                        <Check size={18} />
                      </button>

                      {/* Spam/Silindi */}
                      <button
                        onClick={() => updateTaskStatus(task.id, TaskStatus.SPAM_DELETED)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded border border-red-200"
                        title="Spam/Silindi (-1 Puan)"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* Telafi İste (Sadece Spam ise göster) */}
                      {task.status === TaskStatus.SPAM_DELETED && (
                          <button
                            onClick={() => handleCompensationRequest(task)}
                            className="p-1 text-purple-600 hover:bg-purple-100 rounded border border-purple-200 animate-pulse"
                            title="Telafi İste (WhatsApp)"
                          >
                            <MessageCircle size={18} />
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedTasks.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center">
                            <Filter className="w-8 h-8 mb-2 opacity-20" />
                            <p>Seçilen kriterlere uygun görev bulunamadı.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Link Add Modal (Detailed) */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Yorum Linki Ekle / Güncelle"
        footer={
            <>
                <button
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    İptal
                </button>
                <button
                    onClick={handleSaveLink}
                    disabled={!linkInput}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    Kaydet ve Onayla
                </button>
            </>
        }
      >
          <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedTask && (() => {
                      const u = users.find(us => us.id === selectedTask.userId);
                      const b = businesses.find(bz => bz.id === selectedTask.businessId);
                      return `${u?.name} kullanıcısının ${b?.name} işletmesi için yorum linki:`;
                  })()}
              </p>
              <input 
                  type="url" 
                  className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="https://maps.app.goo.gl/..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  autoFocus
              />
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  * Link girildiğinde görev durumu otomatik olarak <b>Yayında</b> yapılacak ve kullanıcıya puan eklenecektir.
              </p>
          </div>
      </Modal>

      {/* Bot Result Modal */}
      <Modal
         isOpen={!!botResult}
         onClose={() => setBotResult(null)}
         title="Google Bot Raporu"
         footer={
             <button
                 onClick={() => setBotResult(null)}
                 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
             >
                 Tamam
             </button>
         }
      >
          <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                      <Bot className="w-8 h-8 text-green-600" />
                  </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tarama Tamamlandı</h3>
              <p className="text-gray-500 mb-6">Sistemdeki linkler Google Haritalar üzerinde kontrol edildi.</p>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {botResult?.published}
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-300">Yayında</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {botResult?.spam}
                      </div>
                      <div className="text-sm text-red-800 dark:text-red-300">Spam / Silindi</div>
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
};
