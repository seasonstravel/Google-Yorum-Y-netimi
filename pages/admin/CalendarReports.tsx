
import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate, createWhatsAppLink } from '../../utils/helpers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Download, ChevronLeft, ChevronRight, Filter, Link as LinkIcon, Save, Check, Trash2, ExternalLink, MessageCircle, FileText, RefreshCw, Key, Layers, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Shift, TaskStatus, Task, Sector } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const CalendarReports: React.FC = () => {
  const { tasks, businesses, users, poolComments, submitReview, updateTaskStatus, updateTaskDetails } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  
  // Instruction Modal State
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [instructionForm, setInstructionForm] = useState({ suggestedContent: '', keywords: '' });
  
  // Pool Selection Modal State
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);

  // Navigation Handlers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleLinkInputChange = (taskId: string, val: string) => {
    setLinkInputs(prev => ({ ...prev, [taskId]: val }));
  };

  const handleSaveLink = (taskId: string) => {
    const link = linkInputs[taskId];
    if (link) {
      submitReview(taskId, link, TaskStatus.PUBLISHED); // Otomatik yayınla
      // Clear input after save
      const newInputs = { ...linkInputs };
      delete newInputs[taskId];
      setLinkInputs(newInputs);
    }
  };

  const handleDownloadPdf = async () => {
    if (printRef.current) {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`gorev_raporu_${selectedBusinessId}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.pdf`);
    }
  };

  const handleDownloadExcel = () => {
    const exportData = filteredTasks.map(task => {
        const user = users.find(u => u.id === task.userId);
        const business = businesses.find(b => b.id === task.businessId);
        return {
            'Tarih': task.assignedDate.split('T')[0],
            'Saat': task.assignedDate.split('T')[1].substring(0,5),
            'Kullanıcı': user?.name || 'Bilinmiyor',
            'Telefon': user?.phone || '',
            'İşletme': business?.name || 'Bilinmiyor',
            'Vardiya': task.shift,
            'Durum': task.status,
            'Link': task.reviewLink || '',
            'Not': task.notes || ''
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rapor");
    XLSX.writeFile(wb, `Rapor_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.xlsx`);
  };

  // --- Instruction / Details Logic ---

  const openInstructionModal = (task: Task) => {
    setEditingTask(task);
    setInstructionForm({
      suggestedContent: task.suggestedContent || '',
      keywords: task.keywords || ''
    });
    setIsInstructionModalOpen(true);
  };

  const saveInstructions = () => {
    if (editingTask) {
      updateTaskDetails(editingTask.id, instructionForm);
      setIsInstructionModalOpen(false);
      setEditingTask(null);
    }
  };

  const handleSelectFromPool = (content: string) => {
      setInstructionForm(prev => ({ ...prev, suggestedContent: content }));
      setIsPoolModalOpen(false);
  };

  // --- Notification Logic ---

  const handleWhatsAppNotify = (task: Task) => {
    const user = users.find(u => u.id === task.userId);
    const business = businesses.find(b => b.id === task.businessId);
    
    if (!user || !business) return;

    const dateObj = new Date(task.assignedDate);
    const timeStr = dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});

    let message = `Merhaba ${user.name},\n\n📅 *Görev Hatırlatması*\n\n`;
    message += `🏢 İşletme: *${business.name}*\n`;
    message += `⏰ Zaman: ${formatDate(task.assignedDate)} - ${timeStr} (${task.shift})\n`;
    message += `📍 Link: ${business.mapsUrl}\n\n`;

    if (task.suggestedContent) {
      message += `✍️ *Yapılacak Yorum:* \n"${task.suggestedContent}"\n\n`;
    }

    if (task.keywords) {
      message += `🔑 *Kullanılacak Anahtar Kelimeler:* \n${task.keywords}\n\n`;
    }

    message += `Yorumunuzu yaptıktan sonra linki iletmeyi unutmayın. Kolay gelsin!`;
    
    window.open(createWhatsAppLink(user.phone, message), '_blank');
  };

  const handleCompensationRequest = (task: Task) => {
    const user = users.find(u => u.id === task.userId);
    const business = businesses.find(b => b.id === task.businessId);
    
    if (!user || !business) return;

    let message = `Merhaba ${user.name},\n\n⚠️ *Telafi İsteği*\n\n`;
    message += `Üzgünüz, ${business.name} işletmesine yaptığın yorum Google tarafından silinmiş veya spam olarak işaretlenmiş görünüyor.\n\n`;
    message += `Puanını kaybetmemek için lütfen yeni bir yorum yapabilir misin?\n\n`;
    message += `📍 Link: ${business.mapsUrl}\n\n`;

    if (task.suggestedContent) {
      message += `💡 İpucu: Yorumunda şu içeriği kullanabilirsin:\n"${task.suggestedContent}"\n`;
    }

    message += `\nTeşekkürler!`;
    
    window.open(createWhatsAppLink(user.phone, message), '_blank');
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const tDate = new Date(t.assignedDate);
    const matchesMonth = tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
    const matchesBusiness = selectedBusinessId === 'all' || t.businessId === selectedBusinessId;
    return matchesMonth && matchesBusiness;
  });

  // Group tasks by date
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const date = task.assignedDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const sortedDates = Object.keys(groupedTasks).sort();
  const currentMonthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <span title="Önceki Ay"><ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" /></span>
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize min-w-[200px] text-center">
            {currentMonthName}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <span title="Sonraki Ay"><ChevronRight size={20} className="text-gray-600 dark:text-gray-300" /></span>
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none"
            >
              <option value="all">Tüm İşletmeler</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
            title="Excel Olarak İndir"
          >
            <FileSpreadsheet size={18} className="mr-2" /> Excel
          </button>

          <button 
            onClick={handleDownloadPdf}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 whitespace-nowrap"
            title="PDF Olarak İndir"
          >
            <Download size={18} className="mr-2" /> PDF
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div ref={printRef} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow min-h-[500px]">
        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Aylık Görev Aktivitesi</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedBusinessId === 'all' 
                ? 'Tüm İşletmeler' 
                : businesses.find(b => b.id === selectedBusinessId)?.name} 
              - {currentMonthName}
            </p>
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Bu ay için planlanmış görev bulunamadı.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
                <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Date Header */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 font-semibold text-blue-600 dark:text-blue-400 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                        <span>{formatDate(date)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                          {groupedTasks[date].length} Görev
                        </span>
                    </div>

                    {/* Tasks List */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {groupedTasks[date].map(task => {
                        const user = users.find(u => u.id === task.userId);
                        const business = businesses.find(b => b.id === task.businessId);
                        
                        return (
                          <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                              
                              {/* Task Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name}
                                  </h4>
                                  <Badge status={task.status} />
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap mb-2">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{business?.name}</span>
                                  <span>•</span>
                                  <span>{task.shift}</span>
                                </div>
                                
                                {/* Instructions Display */}
                                {(task.suggestedContent || task.keywords) && (
                                    <div className="mt-2 space-y-2">
                                        {task.suggestedContent && (
                                            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                                                <span title="Yapılacak Yorum"><FileText size={14} className="mt-0.5 text-blue-500 shrink-0" /></span>
                                                <span className="italic">"{task.suggestedContent}"</span>
                                            </div>
                                        )}
                                        {task.keywords && (
                                            <div className="flex items-center gap-2 flex-wrap text-xs">
                                                <span title="Anahtar Kelimeler"><Key size={14} className="text-purple-500 shrink-0" /></span>
                                                {task.keywords.split(',').map((k, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800 font-medium">
                                                        {k.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                              </div>

                              {/* Action Area */}
                              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end self-start mt-2 md:mt-0">
                                
                                {/* Edit Instructions Button - Enhanced */}
                                <button 
                                    onClick={() => openInstructionModal(task)}
                                    className="flex items-center px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 transition-colors"
                                    title="Yorum/Anahtar Kelime Ekle"
                                >
                                    <FileText size={14} className="mr-1.5" />
                                    Talimat Ekle
                                </button>

                                {/* WhatsApp Button */}
                                <button
                                    onClick={() => handleWhatsAppNotify(task)}
                                    className="p-1.5 text-green-700 bg-green-100 hover:bg-green-200 rounded border border-green-200 dark:bg-green-900/30 dark:text-green-400"
                                    title="WhatsApp ile Bildir"
                                >
                                    <span title="WhatsApp ile Bildir"><MessageCircle size={16} /></span>
                                </button>

                                {/* Compensation Button (Only for SPAM) */}
                                {task.status === TaskStatus.SPAM_DELETED && (
                                    <button
                                        onClick={() => handleCompensationRequest(task)}
                                        className="p-1.5 text-purple-700 bg-purple-100 hover:bg-purple-200 rounded border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 animate-pulse"
                                        title="Telafi İste"
                                    >
                                        <span title="Telafi İste"><RefreshCw size={16} /></span>
                                    </button>
                                )}

                                {/* Divider */}
                                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>

                                {task.reviewLink ? (
                                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                                     <a 
                                        href={task.reviewLink} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs flex items-center px-2 truncate max-w-[150px]"
                                        title={task.reviewLink}
                                      >
                                        <span title="Linki Aç"><ExternalLink size={14} className="mr-1 flex-shrink-0" /></span>
                                        Link
                                      </a>
                                      
                                      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

                                      <button 
                                        onClick={() => updateTaskStatus(task.id, TaskStatus.PUBLISHED)}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded hover:scale-110 transition-transform"
                                        title="Onayla (+1)"
                                      >
                                        <span title="Onayla"><Check size={16} /></span>
                                      </button>
                                      <button 
                                        onClick={() => updateTaskStatus(task.id, TaskStatus.SPAM_DELETED)}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded hover:scale-110 transition-transform"
                                        title="Spam (-1)"
                                      >
                                        <span title="Spam/Silindi"><Trash2 size={16} /></span>
                                      </button>
                                  </div>
                                ) : (
                                  <div className="flex w-full md:w-auto gap-1">
                                    <div className="relative flex-1 md:w-48">
                                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                        <LinkIcon size={14} className="text-gray-400" />
                                      </div>
                                      <input
                                        type="text"
                                        className="block w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                                        placeholder="Link gir..."
                                        value={linkInputs[task.id] || ''}
                                        onChange={(e) => handleLinkInputChange(task.id, e.target.value)}
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleSaveLink(task.id)}
                                      disabled={!linkInputs[task.id]}
                                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span title="Kaydet"><Save size={14} /></span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Instruction Modal - Enhanced */}
      <Modal
        isOpen={isInstructionModalOpen}
        onClose={() => setIsInstructionModalOpen(false)}
        title="Görev Talimatları"
        footer={
            <>
                <button
                    onClick={() => setIsInstructionModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                    İptal
                </button>
                <button
                    onClick={saveInstructions}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    Kaydet
                </button>
            </>
        }
      >
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start">
                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Buraya girdiğiniz bilgiler, kullanıcıya göndereceğiniz WhatsApp mesajına <b>otomatik olarak</b> eklenecektir.
                </p>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                        <FileText size={16} className="mr-2 text-gray-500" />
                        Yapılacak Yorum (İçerik)
                    </label>
                    <button 
                        onClick={() => setIsPoolModalOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                    >
                        <Layers size={12} className="mr-1" />
                        Havuzdan Seç
                    </button>
                </div>
                <textarea 
                    className="w-full p-3 bg-white border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
                    rows={4}
                    placeholder="Örn: Yemekler harikaydı, özellikle iskenderi çok beğendim. Servis çok hızlıydı."
                    value={instructionForm.suggestedContent}
                    onChange={(e) => setInstructionForm({...instructionForm, suggestedContent: e.target.value})}
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">Kullanıcının kopyalayıp yapıştırabileceği örnek yorum metni.</p>
            </div>
            
            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Key size={16} className="mr-2 text-purple-500" />
                    Anahtar Kelimeler
                </label>
                <input 
                    type="text" 
                    className="w-full p-3 bg-white border border-gray-300 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
                    placeholder="Örn: lezzetli, hızlı servis, temiz, tavsiye"
                    value={instructionForm.keywords}
                    onChange={(e) => setInstructionForm({...instructionForm, keywords: e.target.value})}
                />
                <p className="mt-1 text-xs text-gray-500">Yorum içinde geçmesi zorunlu kelimeleri virgül ile ayırarak yazınız.</p>
            </div>
        </div>
      </Modal>

      {/* Pool Selection Modal */}
      <Modal
          isOpen={isPoolModalOpen}
          onClose={() => setIsPoolModalOpen(false)}
          title="Yorum Havuzundan Seç"
          footer={
              <button
                  onClick={() => setIsPoolModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                  Kapat
              </button>
          }
      >
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {poolComments.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                      Havuzda yorum bulunamadı. "Yorum Havuzu & AI" sayfasından ekleyebilirsiniz.
                  </div>
              ) : (
                  poolComments.map(comment => (
                      <div 
                          key={comment.id}
                          onClick={() => handleSelectFromPool(comment.content)}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer group transition-all"
                      >
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] uppercase font-bold text-gray-500">{comment.sector}</span>
                              <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500" />
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                      </div>
                  ))
              )}
          </div>
      </Modal>
    </div>
  );
};
