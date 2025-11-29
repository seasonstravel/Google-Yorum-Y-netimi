

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TaskStatus, LocalGuideLevel, LocalGuideStatus } from '../../types';
import { formatDate, getUserLevel } from '../../utils/helpers';
import { Badge } from '../../components/Badge';
import { MapPin, Send, Trophy, Star, CheckCircle2, ClipboardCopy, Clock, Lock, AlertTriangle, XCircle, Filter, Map, Megaphone } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '../../components/Modal';
import { ChatWidget } from '../../components/ChatWidget';

export const UserTasks: React.FC = () => {
  const { user } = useAuth();
  const { getTasksByUser, businesses, submitReview, requestLocalGuideLevel, announcements } = useData();
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PUBLISHED' | 'SPAM'>('ALL');
  
  // Local Guide Modal
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [guideLevel, setGuideLevel] = useState<LocalGuideLevel>(LocalGuideLevel.LEVEL_1);
  const [guideProof, setGuideProof] = useState('');

  if (!user) return null;

  const myTasks = getTasksByUser(user.id);
  const userLevel = getUserLevel(user.points);
  const activeAnnouncements = announcements.filter(a => a.isActive);
  
  // Stats Calculation
  const totalTasks = myTasks.length;
  const publishedCount = myTasks.filter(t => t.status === TaskStatus.PUBLISHED).length;
  const spamCount = myTasks.filter(t => t.status === TaskStatus.SPAM_DELETED).length;
  const pendingCount = myTasks.filter(t => t.status === TaskStatus.ASSIGNED || t.status === TaskStatus.PENDING_REVIEW).length;

  // Sort: Assigned first, then pending, then others
  const sortedTasks = [...myTasks].sort((a, b) => {
    if (a.status === TaskStatus.ASSIGNED && b.status !== TaskStatus.ASSIGNED) return -1;
    if (a.status !== TaskStatus.ASSIGNED && b.status === TaskStatus.ASSIGNED) return 1;
    return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
  });

  // Filter Logic
  const filteredTasks = sortedTasks.filter(task => {
      if (filter === 'ALL') return true;
      if (filter === 'PUBLISHED') return task.status === TaskStatus.PUBLISHED;
      if (filter === 'SPAM') return task.status === TaskStatus.SPAM_DELETED;
      if (filter === 'PENDING') return task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.PENDING_REVIEW;
      return true;
  });

  const handleLinkChange = (taskId: string, val: string) => {
    setLinkInputs(prev => ({...prev, [taskId]: val}));
  };

  const handleSubmit = (taskId: string) => {
    if (linkInputs[taskId]) {
      submitReview(taskId, linkInputs[taskId]);
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const isTaskLocked = (dateStr: string) => {
      return new Date(dateStr).getTime() > new Date().getTime();
  };

  const handleGuideSubmit = () => {
      if (guideLevel && guideProof) {
          requestLocalGuideLevel(user.id, guideLevel, guideProof);
          setIsGuideModalOpen(false);
      }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Chat / Notifications Widget */}
      <ChatWidget />

      {/* Announcements Banner */}
      {activeAnnouncements.length > 0 && (
          <div className="mb-6 space-y-2">
              {activeAnnouncements.map(ann => (
                  <div key={ann.id} className={clsx(
                      "p-4 rounded-lg shadow-sm border-l-4 flex items-start",
                      ann.type === 'SUCCESS' ? "bg-green-50 border-green-500 text-green-800" :
                      ann.type === 'WARNING' ? "bg-yellow-50 border-yellow-500 text-yellow-800" :
                      "bg-blue-50 border-blue-500 text-blue-800"
                  )}>
                      <Megaphone className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
                      <div>
                          <h4 className="font-bold text-sm">{ann.title}</h4>
                          <p className="text-sm mt-1 opacity-90">{ann.content}</p>
                          <span className="text-[10px] mt-2 block opacity-70">{formatDate(ann.createdAt)}</span>
                      </div>
                  </div>
              ))}
          </div>
      )}
      
      {/* Welcome & Stats Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={150} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-white/20 border-2 border-white/50 backdrop-blur-sm shadow-lg`}>
                    {userLevel.icon}
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Merhaba, {user.name}</h1>
                    <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-white text-blue-800`}>
                                {userLevel.name}
                            </span>
                            <span className="text-blue-200 text-sm">| {user.phone}</span>
                        </div>
                        
                        {/* Local Guide Status Badge */}
                        <div className="flex items-center gap-2 mt-1">
                            {user.localGuideStatus === LocalGuideStatus.APPROVED ? (
                                <span className="flex items-center px-2 py-0.5 rounded bg-orange-500/80 text-white text-xs font-medium border border-orange-400">
                                    <Map size={12} className="mr-1" />
                                    Yerel Rehber Seviye {user.localGuideLevel}
                                </span>
                            ) : user.localGuideStatus === LocalGuideStatus.PENDING ? (
                                <span className="flex items-center px-2 py-0.5 rounded bg-yellow-500/80 text-white text-xs font-medium border border-yellow-400">
                                    <Clock size={12} className="mr-1" />
                                    Seviye Doğrulaması Bekleniyor
                                </span>
                            ) : (
                                <button 
                                    onClick={() => setIsGuideModalOpen(true)}
                                    className="flex items-center px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors border border-white/30"
                                >
                                    <Map size={12} className="mr-1" />
                                    Yerel Rehber Misin? Doğrula
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="flex gap-3 flex-wrap justify-center">
                <div className="text-center bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 min-w-[90px]">
                    <div className="text-2xl font-bold">{totalTasks}</div>
                    <div className="text-[10px] text-blue-200 uppercase font-medium">Toplam</div>
                </div>
                <div className="text-center bg-green-500/20 p-3 rounded-xl backdrop-blur-sm border border-green-400/30 min-w-[90px]">
                    <div className="text-2xl font-bold text-green-300">{publishedCount}</div>
                    <div className="text-[10px] text-green-200 uppercase font-medium">Yayında</div>
                </div>
                <div className="text-center bg-red-500/20 p-3 rounded-xl backdrop-blur-sm border border-red-400/30 min-w-[90px]">
                    <div className="text-2xl font-bold text-red-300">{spamCount}</div>
                    <div className="text-[10px] text-red-200 uppercase font-medium">Spam</div>
                </div>
                <div className="text-center bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 min-w-[90px]">
                    <div className="text-2xl font-bold">{user.points}</div>
                    <div className="text-[10px] text-blue-200 uppercase font-medium">Puan</div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Star className="mr-2 text-yellow-500" fill="currentColor" /> Görevlerim
          </h2>

          {/* Filter Tabs */}
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex shadow-sm">
             <button 
                onClick={() => setFilter('ALL')}
                className={clsx("px-4 py-2 text-xs font-medium rounded-md transition-colors", filter === 'ALL' ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-900 dark:text-gray-400")}
             >
                Tümü
             </button>
             <button 
                onClick={() => setFilter('PENDING')}
                className={clsx("px-4 py-2 text-xs font-medium rounded-md transition-colors", filter === 'PENDING' ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "text-gray-500 hover:text-blue-600 dark:text-gray-400")}
             >
                Yapılacaklar ({pendingCount})
             </button>
             <button 
                onClick={() => setFilter('PUBLISHED')}
                className={clsx("px-4 py-2 text-xs font-medium rounded-md transition-colors", filter === 'PUBLISHED' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" : "text-gray-500 hover:text-green-600 dark:text-gray-400")}
             >
                Yayında ({publishedCount})
             </button>
             <button 
                onClick={() => setFilter('SPAM')}
                className={clsx("px-4 py-2 text-xs font-medium rounded-md transition-colors", filter === 'SPAM' ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" : "text-gray-500 hover:text-red-600 dark:text-gray-400")}
             >
                Spam ({spamCount})
             </button>
          </div>
      </div>
      
      <div className="space-y-4">
        {filteredTasks.map(task => {
            const business = businesses.find(b => b.id === task.businessId);
            const isAssigned = task.status === TaskStatus.ASSIGNED;
            const dateObj = new Date(task.assignedDate);
            const timeStr = dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
            
            const isLocked = isTaskLocked(task.assignedDate);
            const isSpam = task.status === TaskStatus.SPAM_DELETED;
            const isPublished = task.status === TaskStatus.PUBLISHED;

            return (
                <div key={task.id} className={clsx(
                    "bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow",
                    isSpam ? "border-red-200 dark:border-red-900/50" : 
                    isPublished ? "border-green-200 dark:border-green-900/50" :
                    isLocked ? "border-gray-200 bg-gray-50 dark:bg-gray-800/50 opacity-90" :
                    "border-gray-200 dark:border-gray-700"
                )}>
                    {/* Header */}
                    <div className={clsx(
                        "p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
                        isSpam ? "bg-red-50 dark:bg-red-900/20 border-red-100" : 
                        isPublished ? "bg-green-50 dark:bg-green-900/20 border-green-100" :
                        "bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "p-2 rounded-lg",
                                isLocked ? "bg-gray-200 text-gray-500" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            )}>
                                {isLocked ? <Lock size={20} /> : <MapPin size={20} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex items-center">
                                    {isLocked ? (
                                        <span className="text-gray-500 flex items-center">
                                            🔒 Kilitli Görev 
                                            <span className="text-xs font-normal ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                                İşletme Gizli
                                            </span>
                                        </span>
                                    ) : (
                                        business?.name
                                    )}
                                </h3>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <Clock size={12} className="mr-1" />
                                    {formatDate(task.assignedDate)} • {timeStr} • {task.shift}
                                </div>
                            </div>
                        </div>
                        <Badge status={task.status} className="scale-110" />
                    </div>

                    {/* Content */}
                    <div className="p-4 relative">
                        {isLocked && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-w-sm">
                                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="font-semibold text-gray-800 dark:text-white">Bu görev henüz aktif değil.</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Görevin zamanı geldiğinde ({formatDate(task.assignedDate)} {timeStr}) işletme detayları ve link gönderme alanı açılacaktır.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Instructions Section */}
                        {(task.suggestedContent || task.keywords) && isAssigned && !isLocked && (
                            <div className="mb-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg overflow-hidden">
                                <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-2 flex items-center gap-2 border-b border-blue-100 dark:border-blue-900/30">
                                    <Star size={16} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">Görev Talimatı</span>
                                </div>
                                
                                <div className="p-3 text-sm">
                                    {task.suggestedContent && (
                                        <div className="mb-3">
                                            <p className="text-xs text-blue-600 dark:text-blue-300 mb-2 font-medium flex items-center">
                                                <AlertTriangle size={12} className="mr-1" />
                                                Önemli: Lütfen aşağıdaki yorumu birebir kopyalayıp kullanınız.
                                            </p>
                                            <div className="flex justify-between items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800/50 text-gray-800 dark:text-gray-200 relative group shadow-sm">
                                                <span className="italic">"{task.suggestedContent}"</span>
                                                <button 
                                                    onClick={() => copyToClipboard(task.suggestedContent!)}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-md transition-colors bg-blue-50 dark:bg-blue-900/20 shrink-0"
                                                    title="Metni Kopyala"
                                                >
                                                    <ClipboardCopy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {task.keywords && (
                                        <div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 block text-xs uppercase mb-1">
                                                Kullanılması Gereken Anahtar Kelimeler:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {task.keywords.split(',').map((k, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs font-medium border border-gray-200 dark:border-gray-600 shadow-sm">
                                                        #{k.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                            {business?.mapsUrl && (
                                 <a 
                                 href={isLocked ? '#' : business.mapsUrl} 
                                 target={isLocked ? undefined : "_blank"}
                                 rel="noreferrer"
                                 className={clsx(
                                     "flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
                                     isLocked 
                                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500" 
                                        : "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 focus:ring-blue-500 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/40"
                                 )}
                                 onClick={(e) => isLocked && e.preventDefault()}
                               >
                                 {isLocked ? <Lock size={16} className="mr-2" /> : <MapPin size={16} className="mr-2" />}
                                 {isLocked ? "Harita Kilitli" : "Haritada Git"}
                               </a>
                            )}

                            {isAssigned && !isLocked ? (
                                <div className="flex-1 flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" 
                                            placeholder="Yorumunuzun linkini buraya yapıştırın..."
                                            className="block w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                                            value={linkInputs[task.id] || ''}
                                            onChange={(e) => handleLinkChange(task.id, e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleSubmit(task.id)}
                                        disabled={!linkInputs[task.id]}
                                        className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={16} className="mr-2" />
                                        Gönder
                                    </button>
                                </div>
                            ) : (
                                !isLocked && (
                                    <div className={clsx(
                                        "flex-1 flex items-center text-sm p-2 rounded-lg border",
                                        isSpam ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800" :
                                        isPublished ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" :
                                        "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/50 dark:border-gray-700"
                                    )}>
                                        {isSpam ? <XCircle size={16} className="mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                                        {task.status === TaskStatus.PENDING_REVIEW ? 'Yorumunuz inceleme aşamasında.' : 
                                         task.status === TaskStatus.PUBLISHED ? 'Yorumunuz onaylandı, puan kazandınız!' :
                                         task.status === TaskStatus.SPAM_DELETED ? 'Yorumunuz silindiği için puan düşüldü.' :
                                         'Görev tamamlandı.'}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
        
        {filteredTasks.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Görev Bulunamadı</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                    {filter === 'ALL' ? 'Henüz size atanmış bir görev yok.' : 'Bu kriterlere uygun görev bulunamadı.'}
                </p>
            </div>
        )}
      </div>

      {/* Local Guide Request Modal */}
      <Modal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          title="Yerel Rehber Doğrulama"
          footer={
              <>
                  <button
                      onClick={() => setIsGuideModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                      İptal
                  </button>
                  <button
                      onClick={handleGuideSubmit}
                      disabled={!guideProof}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                      Gönder
                  </button>
              </>
          }
      >
          <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
                  <Map className="shrink-0" size={24} />
                  <p>Google Maps profilinizdeki "Yerel Rehber" (Local Guide) seviyenizi doğrulayarak her yorum için <b>daha fazla puan</b> kazanabilirsiniz.</p>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seviyeniz</label>
                  <select 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={guideLevel}
                      onChange={(e) => setGuideLevel(Number(e.target.value) as LocalGuideLevel)}
                  >
                      {[1,2,3,4,5,6,7,8,9,10].map(lvl => (
                          <option key={lvl} value={lvl}>Seviye {lvl}</option>
                      ))}
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profil Ekran Görüntüsü / Linki</label>
                  <input 
                      type="text" 
                      className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="https://resim-linki.com/profilim.jpg"
                      value={guideProof}
                      onChange={(e) => setGuideProof(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Google Maps profilinizde seviyenizin göründüğü bir ekran görüntüsü linki ekleyiniz.</p>
              </div>
          </div>
      </Modal>

    </div>
  );
};