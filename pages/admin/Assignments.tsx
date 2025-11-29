

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Shift, TaskStatus, Task, UserRole, Gender, LocalGuideLevel } from '../../types';
import { formatDate, createWhatsAppLink } from '../../utils/helpers';
import { Badge } from '../../components/Badge';
import { Trash2, Users, CalendarDays, CheckCircle2, AlertCircle, RefreshCw, MessageCircle, Clock, Building2, User, UserCheck, Eraser, Hand, PlusCircle, UserPlus, Map, MapPin } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../../context/ToastContext';

// Helper to add days
const addDays = (dateStr: string, days: number) => {
  const result = new Date(dateStr);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
};

const getDayName = (dateStr: string) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[new Date(dateStr).getDay()];
};

export const Assignments: React.FC = () => {
  const { users, businesses, tasks, assignTasksBulk, assignTask, deleteTask, deleteAllTasks } = useData();
  const { addToast } = useToast();

  // --- UI State ---
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');

  // --- Configuration State (AUTO) ---
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Advanced Settings (AUTO)
  const [totalTarget, setTotalTarget] = useState(12);
  const [dailyMax, setDailyMax] = useState(3);
  const [restPeriod, setRestPeriod] = useState(2); 
  const [targetGender, setTargetGender] = useState<Gender | 'MIXED'>('MIXED');
  const [minLocalGuideLevel, setMinLocalGuideLevel] = useState<number>(0); // 0 = Hepsi
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [locationPriority, setLocationPriority] = useState(false); // New: Anti-Spam
  
  // --- Manual Form State ---
  const [manualForm, setManualForm] = useState({
      userId: '',
      businessId: '',
      date: new Date().toISOString().split('T')[0],
      shift: Shift.MORNING,
      time: '09:30'
  });

  // Preview State (AUTO)
  interface PlanTask {
      userId: string;
      userName: string;
      userCity: string;
      shift: Shift;
      time: string;
      gender: Gender;
      localGuideLevel: number;
  }

  interface PlanDay {
      date: string;
      tasks: PlanTask[];
  }
  const [generatedPlan, setGeneratedPlan] = useState<PlanDay[]>([]);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Clear All Modal
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Daily View State
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Logic ---

  const handleBusinessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bId = e.target.value;
    setSelectedBusiness(bId);
    const business = businesses.find(b => b.id === bId);
    if (business && business.targetReviewCount) {
        setTotalTarget(business.targetReviewCount);
    }
  };

  const handleDayToggle = (dayIndex: number) => {
      setSelectedWeekDays(prev => 
        prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
      );
  };

  const generatePlan = () => {
    if (!selectedBusiness) {
        setMessage({ type: 'error', text: 'Lütfen bir işletme seçiniz.' });
        return;
    }
    if (selectedWeekDays.length === 0) {
        setMessage({ type: 'error', text: 'En az bir çalışma günü seçmelisiniz.' });
        return;
    }

    const targetBusiness = businesses.find(b => b.id === selectedBusiness);
    if (!targetBusiness) return;

    const existingReviews = tasks.filter(t => t.businessId === selectedBusiness);
    const completedUserIds = new Set(existingReviews.map(t => t.userId));
    
    // Filter Users
    let eligiblePool = users.filter(u => {
        if (u.role !== UserRole.USER) return false;
        if (completedUserIds.has(u.id)) return false;
        
        // Gender Filter
        if (targetGender !== 'MIXED' && u.gender !== targetGender) return false;

        // Local Guide Filter
        if (minLocalGuideLevel > 0 && u.localGuideLevel < minLocalGuideLevel) return false;

        return true;
    });

    // Location Priority Logic
    if (locationPriority) {
        // Option 1: Strict Filtering (Uncomment if needed)
        // eligiblePool = eligiblePool.filter(u => u.city === targetBusiness.city);

        // Option 2: Priority Sorting (Current Implementation)
        eligiblePool.sort((a, b) => {
            const aMatch = a.city === targetBusiness.city ? 1 : 0;
            const bMatch = b.city === targetBusiness.city ? 1 : 0;
            
            // If match status is different, prioritize match
            if (aMatch !== bMatch) return bMatch - aMatch;
            
            // If match status same, check last task date
            if (!a.lastTaskDate) return -1;
            if (!b.lastTaskDate) return 1;
            return new Date(a.lastTaskDate).getTime() - new Date(b.lastTaskDate).getTime();
        });
    } else {
        // Sort by last task date (users who haven't worked recently come first)
        eligiblePool.sort((a, b) => {
            if (!a.lastTaskDate) return -1;
            if (!b.lastTaskDate) return 1;
            return new Date(a.lastTaskDate).getTime() - new Date(b.lastTaskDate).getTime();
        });
    }

    const simulatedAvailability: Record<string, string> = {};

    eligiblePool.forEach(u => {
        if (u.lastTaskDate) {
             simulatedAvailability[u.id] = addDays(u.lastTaskDate, restPeriod);
        } else {
             simulatedAvailability[u.id] = '1970-01-01'; 
        }
    });

    const plan: PlanDay[] = [];
    let assignedCount = 0;
    let currentDateStr = startDate;
    let safetyCounter = 0;

    // Shift rotation logic
    const SHIFT_CYCLE = [Shift.MORNING, Shift.NOON, Shift.EVENING];
    const SHIFT_TIMES = {
        [Shift.MORNING]: '09:30',
        [Shift.NOON]: '14:00',
        [Shift.EVENING]: '19:30'
    };

    while (assignedCount < totalTarget && safetyCounter < 365) { 
        const currentDayObj = new Date(currentDateStr);
        const dayIndex = currentDayObj.getDay();

        if (selectedWeekDays.includes(dayIndex)) {
            const dayTasks: PlanTask[] = [];
            
            for (let i = 0; i < dailyMax; i++) {
                if (assignedCount >= totalTarget) break;
                
                const candidate = eligiblePool.find(u => {
                    const nextFree = simulatedAvailability[u.id];
                    const isResting = new Date(nextFree) > new Date(currentDateStr);
                    
                    if (isResting) return false;

                    const hasRealTaskToday = tasks.some(t => t.userId === u.id && t.assignedDate.split('T')[0] === currentDateStr);
                    if (hasRealTaskToday) return false;

                    return true;
                });

                if (candidate) {
                    // Distribute shifts in a round-robin fashion for the day
                    const shift = SHIFT_CYCLE[i % SHIFT_CYCLE.length];
                    const time = SHIFT_TIMES[shift];

                    dayTasks.push({
                        userId: candidate.id,
                        userName: candidate.name,
                        userCity: candidate.city,
                        shift: shift,
                        time: time,
                        gender: candidate.gender,
                        localGuideLevel: candidate.localGuideLevel
                    });

                    simulatedAvailability[candidate.id] = addDays(currentDateStr, restPeriod + 1);

                    const userIndex = eligiblePool.indexOf(candidate);
                    if (userIndex > -1) {
                        eligiblePool.splice(userIndex, 1);
                        eligiblePool.push(candidate);
                    }

                    assignedCount++;
                }
            }

            if (dayTasks.length > 0) {
                plan.push({ date: currentDateStr, tasks: dayTasks });
            }
        }

        currentDateStr = addDays(currentDateStr, 1);
        safetyCounter++;
    }

    if (plan.length === 0) {
        setMessage({ type: 'error', text: 'Uygun kullanıcı veya tarih bulunamadı. Kriterleri veya cinsiyet/seviye seçimini esnetin.' });
        setGeneratedPlan([]);
        setIsPlanGenerated(false);
    } else {
        setMessage(null);
        setGeneratedPlan(plan);
        setIsPlanGenerated(true);
    }
  };

  const confirmAssignment = () => {
      const newTasks: Task[] = [];
      
      generatedPlan.forEach(day => {
          day.tasks.forEach(t => {
              newTasks.push({
                  id: uuidv4(),
                  userId: t.userId,
                  businessId: selectedBusiness,
                  assignedDate: `${day.date}T${t.time}:00`,
                  shift: t.shift,
                  status: TaskStatus.ASSIGNED
              });
          });
      });

      assignTasksBulk(newTasks);
      setGeneratedPlan([]);
      setIsPlanGenerated(false);
  };

  // --- Manual Assignment Logic ---
  const handleManualAssign = () => {
      if (!manualForm.userId || !manualForm.businessId || !manualForm.date) {
          addToast('Lütfen tüm alanları doldurunuz.', 'error');
          return;
      }

      // Check if task exists for this user on this day (Optional warning)
      const exists = tasks.some(t => t.userId === manualForm.userId && t.assignedDate.startsWith(manualForm.date));
      if (exists) {
         // We can allow double shifts if admin wants, just toast a warning or block. Let's block for safety.
         addToast('Bu kullanıcıya bu tarihte zaten bir görev atanmış!', 'warning');
         return;
      }

      const newTask: Task = {
          id: uuidv4(),
          userId: manualForm.userId,
          businessId: manualForm.businessId,
          assignedDate: `${manualForm.date}T${manualForm.time}:00`,
          shift: manualForm.shift,
          status: TaskStatus.ASSIGNED
      };

      assignTask(newTask);
      // Reset only user to allow rapid entry for same business/day
      setManualForm(prev => ({ ...prev, userId: '' }));
  };

  const handleShiftChange = (shift: Shift) => {
      let time = '09:30';
      if (shift === Shift.NOON) time = '14:00';
      if (shift === Shift.EVENING) time = '19:30';
      setManualForm(prev => ({ ...prev, shift, time }));
  };

  // --- Deletion & Notification Logic ---

  const openDeleteModal = (id: string) => {
    setTaskToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (taskToDelete) {
        deleteTask(taskToDelete);
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
    }
  };

  const handleClearAll = () => {
      deleteAllTasks();
      setIsClearAllModalOpen(false);
  };

  const handleWhatsAppNotify = (task: Task) => {
      const user = users.find(u => u.id === task.userId);
      const business = businesses.find(b => b.id === task.businessId);
      
      if (!user || !business) return;

      const dateObj = new Date(task.assignedDate);
      const timeStr = dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});

      const message = `Merhaba ${user.name},\n\n📅 Tarih: ${formatDate(task.assignedDate)}\n⏰ Saat: ${timeStr} (${task.shift})\n🏢 İşletme: ${business.name}\n\nLütfen belirtilen tarihte yorumunuzu yapınız.\n📍 Link: ${business.mapsUrl}\n\nYorum yaptıktan sonra linki bana iletebilirsiniz. Kolay gelsin!`;
      
      window.open(createWhatsAppLink(user.phone, message), '_blank');
  };

  // Grouping Logic for Daily View
  const getDailyTasksByBusiness = () => {
    const dayTasks = tasks.filter(t => t.assignedDate.startsWith(viewDate));
    const grouped: Record<string, Task[]> = {};
    
    dayTasks.forEach(t => {
        if (!grouped[t.businessId]) grouped[t.businessId] = [];
        grouped[t.businessId].push(t);
    });
    
    return grouped;
  };

  const dailyGroups = getDailyTasksByBusiness();
  const hasDailyTasks = Object.keys(dailyGroups).length > 0;
  
  const currentBusiness = businesses.find(b => b.id === selectedBusiness);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Akıllı Görev Atama Robotu</h1>
        {tasks.length > 0 && (
            <button 
                onClick={() => setIsClearAllModalOpen(true)}
                className="flex items-center text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 dark:hover:bg-red-900/20"
            >
                <Eraser size={16} className="mr-2" />
                Tüm Görevleri Temizle
            </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex space-x-2 mb-6 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setMode('AUTO')}
          className={clsx(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === 'AUTO' 
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" 
              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
          )}
        >
          <RefreshCw size={16} className="mr-2" />
          Otomatik Robot
        </button>
        <button
          onClick={() => setMode('MANUAL')}
          className={clsx(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === 'MANUAL' 
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" 
              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
          )}
        >
          <UserPlus size={16} className="mr-2" />
          Manuel Atama
        </button>
      </div>

      {/* AUTO MODE */}
      {mode === 'AUTO' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Configuration Panel */}
            <div className="xl:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Atama Kuralları
                    </h2>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">İşletme</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={selectedBusiness}
                            onChange={handleBusinessChange}
                        >
                            <option value="">İşletme Seçiniz...</option>
                            {businesses.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        {currentBusiness && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <MapPin size={12} className="mr-1" />
                                İşletme Konumu: {currentBusiness.city || 'Belirtilmemiş'}
                            </div>
                        )}
                    </div>
                    
                    {/* Location Priority Toggle */}
                    <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                checked={locationPriority}
                                onChange={(e) => setLocationPriority(e.target.checked)}
                            />
                            <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                <MapPin size={16} className="mr-1 text-orange-600" />
                                Konum Eşleşmesi (Anti-Spam)
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                            Aktif edilirse, işletmeyle aynı şehirde olan kullanıcılara öncelik verilir.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Toplam Hedef</label>
                            <input 
                                type="number" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm rounded-lg dark:bg-gray-700 dark:text-white"
                                value={totalTarget}
                                onChange={e => setTotalTarget(Number(e.target.value))}
                                min="1"
                            />
                            <span className="text-xs text-gray-500">Adet Yorum</span>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Günlük Max</label>
                            <input 
                                type="number" 
                                className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm rounded-lg dark:bg-gray-700 dark:text-white"
                                value={dailyMax}
                                onChange={e => setDailyMax(Number(e.target.value))}
                                min="1"
                            />
                            <span className="text-xs text-gray-500">Kişi / Gün</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Dinlenme (Gün)</label>
                        <input 
                            type="number" 
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm rounded-lg dark:bg-gray-700 dark:text-white"
                            value={restPeriod}
                            onChange={e => setRestPeriod(Number(e.target.value))}
                            min="0"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Min. Yerel Rehber Seviyesi</label>
                        <div className="relative">
                            <Map className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select 
                                className="w-full pl-10 p-2.5 bg-gray-50 border border-gray-300 text-sm rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={minLocalGuideLevel}
                                onChange={e => setMinLocalGuideLevel(Number(e.target.value))}
                            >
                                <option value="0">Fark Etmez (Tümü)</option>
                                <option value="1">Seviye 1+</option>
                                <option value="2">Seviye 2+</option>
                                <option value="3">Seviye 3+</option>
                                <option value="4">Seviye 4+</option>
                                <option value="5">Seviye 5+</option>
                                <option value="6">Seviye 6+</option>
                                <option value="7">Seviye 7+</option>
                                <option value="8">Seviye 8+</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Cinsiyet Tercihi</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTargetGender('MIXED')}
                                className={clsx(
                                    "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                    targetGender === 'MIXED' 
                                        ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200" 
                                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                )}
                            >
                                <Users size={20} className="mb-1" />
                                <span className="text-xs font-medium">Karışık</span>
                            </button>
                            <button
                                onClick={() => setTargetGender(Gender.FEMALE)}
                                className={clsx(
                                    "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                    targetGender === Gender.FEMALE 
                                        ? "bg-pink-100 border-pink-500 text-pink-700 dark:bg-pink-900 dark:border-pink-400 dark:text-pink-200" 
                                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                )}
                            >
                                <UserCheck size={20} className="mb-1" />
                                <span className="text-xs font-medium">Kadın</span>
                            </button>
                            <button
                                onClick={() => setTargetGender(Gender.MALE)}
                                className={clsx(
                                    "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                                    targetGender === Gender.MALE 
                                        ? "bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-200" 
                                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                                )}
                            >
                                <User size={20} className="mb-1" />
                                <span className="text-xs font-medium">Erkek</span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Başlangıç</label>
                        <input 
                            type="date"
                            className="w-full p-2.5 bg-gray-50 border border-gray-300 text-sm rounded-lg dark:bg-gray-700 dark:text-white mb-4"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />

                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Günler</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleDayToggle(i)}
                                    className={clsx(
                                        "px-2 py-1 text-xs font-medium rounded border transition-colors",
                                        selectedWeekDays.includes(i)
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={generatePlan}
                        className="w-full flex justify-center items-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-3 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-md active:scale-95"
                    >
                        <RefreshCw size={18} className="mr-2" />
                        Planı Oluştur
                    </button>

                    {message && (
                        <div className={`mt-4 p-3 text-sm rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Panel */}
            <div className="xl:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <CalendarDays className="w-5 h-5 mr-2" />
                            Atama Önizleme
                        </h2>
                        {isPlanGenerated && generatedPlan.length > 0 && (
                            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                {generatedPlan.reduce((acc, day) => acc + day.tasks.length, 0)} Görev / {generatedPlan.length} Gün
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-[600px]">
                        {!isPlanGenerated ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <CalendarDays size={48} className="mb-4 opacity-20" />
                                <p>Kriterleri belirleyip "Planı Oluştur" butonuna basınız.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {generatedPlan.map((day, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex justify-between items-center">
                                            <div className="font-medium text-gray-800 dark:text-white flex items-center">
                                                <span className="text-blue-600 font-bold mr-2">{formatDate(day.date)}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">({getDayName(day.date)})</span>
                                            </div>
                                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-700 dark:text-gray-300">
                                                {day.tasks.length} Kişi
                                            </span>
                                        </div>
                                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {day.tasks.map((t, tIdx) => (
                                                <div key={tIdx} className={clsx(
                                                    "flex items-center p-2 border rounded relative",
                                                    t.gender === Gender.FEMALE ? "bg-pink-50 border-pink-100 dark:bg-pink-900/20 dark:border-pink-800" :
                                                    t.gender === Gender.MALE ? "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800" :
                                                    "bg-gray-50 border-gray-100 dark:bg-gray-900/50 dark:border-gray-700"
                                                )}>
                                                    <div className={clsx(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2",
                                                        t.gender === Gender.FEMALE ? "bg-pink-100 text-pink-600 dark:bg-pink-800 dark:text-pink-200" :
                                                        "bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-200"
                                                    )}>
                                                        {t.userName.charAt(0)}
                                                    </div>
                                                    <div className="overflow-hidden flex-1">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.userName}</p>
                                                        <div className="flex items-center text-xs text-gray-500 gap-2">
                                                            <span>{t.shift}</span>
                                                            <span className="flex items-center text-gray-400"><Clock size={10} className="mr-0.5"/>{t.time}</span>
                                                        </div>
                                                        <div className="flex items-center text-[10px] text-gray-400 mt-0.5">
                                                            <MapPin size={10} className="mr-0.5" />
                                                            <span className={t.userCity === currentBusiness?.city ? "text-green-600 font-bold" : ""}>
                                                                {t.userCity || '?'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {t.localGuideLevel > 0 && (
                                                        <div className="absolute top-1 right-1 text-[10px] bg-orange-100 text-orange-700 px-1 rounded flex items-center">
                                                            <Map size={8} className="mr-0.5"/> L{t.localGuideLevel}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {isPlanGenerated && generatedPlan.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                                <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
                                <div>
                                    <span className="font-medium">Dikkat:</span> Onayla butonuna bastığınızda görevler atanacaktır.
                                </div>
                            </div>
                            <button 
                                onClick={confirmAssignment}
                                className="w-full flex justify-center items-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-5 py-3 dark:bg-green-600 dark:hover:bg-green-700 transition-transform active:scale-[0.99] shadow-lg"
                            >
                                <CheckCircle2 size={20} className="mr-2" />
                                Planı Onayla ve Görevleri Ata
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* MANUAL MODE */}
      {mode === 'MANUAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="mb-6 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                          <Hand size={24} />
                      </div>
                      <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manuel Atama Formu</h2>
                          <p className="text-sm text-gray-500">Belirli bir kullanıcıya doğrudan görev atayın.</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {/* Business Select */}
                      <div>
                          <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">İşletme</label>
                          <select 
                              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={manualForm.businessId}
                              onChange={(e) => setManualForm({...manualForm, businessId: e.target.value})}
                          >
                              <option value="">İşletme Seçiniz...</option>
                              {businesses.map(b => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                          </select>
                      </div>

                      {/* User Select */}
                      <div>
                          <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Kullanıcı</label>
                          <select 
                              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={manualForm.userId}
                              onChange={(e) => setManualForm({...manualForm, userId: e.target.value})}
                          >
                              <option value="">Kullanıcı Seçiniz...</option>
                              {users.filter(u => u.role === UserRole.USER).sort((a,b) => a.name.localeCompare(b.name)).map(u => (
                                  <option key={u.id} value={u.id}>
                                      {u.name} ({u.phone}) 
                                      {u.localGuideLevel > 0 ? ` - Seviye ${u.localGuideLevel}` : ''}
                                  </option>
                              ))}
                          </select>
                      </div>

                      {/* Date */}
                      <div>
                          <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Tarih</label>
                          <input 
                              type="date"
                              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                              value={manualForm.date}
                              onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                          />
                      </div>

                      {/* Shift & Time */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Vardiya</label>
                              <select 
                                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  value={manualForm.shift}
                                  onChange={(e) => handleShiftChange(e.target.value as Shift)}
                              >
                                  <option value={Shift.MORNING}>Sabah</option>
                                  <option value={Shift.NOON}>Öğle</option>
                                  <option value={Shift.EVENING}>Akşam</option>
                              </select>
                          </div>
                          <div>
                              <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Saat</label>
                              <input 
                                  type="time"
                                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                                  value={manualForm.time}
                                  onChange={(e) => setManualForm({...manualForm, time: e.target.value})}
                              />
                          </div>
                      </div>

                      <button 
                          onClick={handleManualAssign}
                          className="w-full flex justify-center items-center text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-lg text-lg px-5 py-3 mt-4 transition-all shadow-md active:scale-95"
                      >
                          <PlusCircle size={20} className="mr-2" />
                          Görevi Ekle
                      </button>
                  </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                      <Users size={48} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nasıl Çalışır?</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                      Manuel modda, algoritmayı devre dışı bırakarak istediğiniz kullanıcıyı seçtiğiniz işletme ve tarihe atayabilirsiniz.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 text-left space-y-2 list-disc pl-5">
                      <li>Bu işlem mevcut atamaları etkilemez.</li>
                      <li>Aynı kullanıcıya aynı gün birden fazla görev atayabilirsiniz.</li>
                      <li>Atama yapıldıktan sonra kullanıcıya WhatsApp bildirimi gönderebilirsiniz.</li>
                  </ul>
              </div>
          </div>
      )}

      {/* Daily Assignments & Notification Hub */}
      <div className="mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Günlük Atama Takibi & Bildirim</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Seçilen tarihteki atamaları işletme bazında görüntüleyin ve WhatsApp bildirimleri gönderin.</p>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tarih Seçin</label>
                <input 
                    type="date" 
                    value={viewDate}
                    onChange={(e) => setViewDate(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
        </div>

        {!hasDailyTasks ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Atama Bulunamadı</h3>
                <p className="text-gray-500 dark:text-gray-400">Bu tarih için planlanmış görev yok.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-6">
                {Object.keys(dailyGroups).map(businessId => {
                    const business = businesses.find(b => b.id === businessId);
                    const businessTasks = dailyGroups[businessId];

                    return (
                        <div key={businessId} className="bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 border-blue-500 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center">
                                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{business?.name}</h3>
                                </div>
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                    {businessTasks.length} Görev
                                </span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Kullanıcı</th>
                                            <th className="px-6 py-3">Vardiya / Saat</th>
                                            <th className="px-6 py-3">Durum</th>
                                            <th className="px-6 py-3 text-right">WhatsApp</th>
                                            <th className="px-6 py-3 text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {businessTasks.map(task => {
                                            const user = users.find(u => u.id === task.userId);
                                            const dateObj = new Date(task.assignedDate);
                                            const timeStr = dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                                            
                                            return (
                                                <tr key={task.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                                        {user?.name}
                                                        <div className="text-xs text-gray-500">{user?.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center">
                                                            <span className="mr-2">{task.shift}</span>
                                                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                                                {timeStr}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <Badge status={task.status} />
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button 
                                                            onClick={() => handleWhatsAppNotify(task)}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 focus:outline-none dark:bg-green-900/30 dark:text-green-400"
                                                        >
                                                            <MessageCircle size={14} className="mr-1" />
                                                            Bildir
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button 
                                                            onClick={() => openDeleteModal(task.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Delete Single Task Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Atamayı Sil"
        footer={
            <>
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
        <p className="text-sm text-gray-500">Bu görev atamasını silmek istediğinize emin misiniz?</p>
      </Modal>

      {/* Clear All Modal */}
      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        title="DİKKAT: Tüm Görevleri Temizle"
        footer={
            <>
                <button
                    onClick={() => setIsClearAllModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    İptal
                </button>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                    Evet, Tümünü Sil
                </button>
            </>
        }
      >
        <div className="space-y-4">
            <div className="flex items-center text-red-600 font-bold">
                <AlertCircle className="mr-2" />
                Bu işlem geri alınamaz!
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Sistemdeki <b>TÜM ATANMIŞ GÖREVLER</b> silinecektir. Kullanıcı puanları ve işletme bilgileri etkilenmez ancak görev geçmişi sıfırlanır.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Yeni bir planlama dönemine başlamadan önce kullanılması önerilir.
            </p>
        </div>
      </Modal>
    </div>
  );
};