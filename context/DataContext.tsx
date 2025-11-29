

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business, Task, TaskStatus, UserRole, Shift, Gender, PoolComment, Sector, LocalGuideLevel, LocalGuideStatus, Message, Announcement, PaymentRequest, PaymentMethod, PaymentStatus, CITIES, Ticket, TicketMessage, TicketPriority, TicketStatus } from '../types';
import { useToast } from './ToastContext'; // Import Toast
import { v4 as uuidv4 } from 'uuid';

// --- DEMO DATA GENERATOR ---

const generateMockUsers = (count: number): User[] => {
  const users: User[] = [];
  
  // 1. Admin User (Sabit)
  users.push({ 
    id: 'admin_1', 
    name: 'Admin User', 
    phone: '905001112233', 
    role: UserRole.ADMIN, 
    gender: Gender.MALE, 
    city: 'İstanbul',
    points: 0, 
    completedTasks: 0,
    localGuideLevel: LocalGuideLevel.NONE,
    localGuideStatus: LocalGuideStatus.NONE
  });

  const maleNames = ['Ahmet', 'Mehmet', 'Mustafa', 'Can', 'Burak', 'Emre', 'Murat', 'Ali', 'Veli', 'Hakan'];
  const femaleNames = ['Ayşe', 'Fatma', 'Zeynep', 'Elif', 'Selin', 'Gamze', 'Merve', 'Büşra', 'Esra', 'Derya'];
  const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan'];

  // 2. Generated Users
  for (let i = 1; i <= count; i++) {
    const isFemale = Math.random() > 0.5;
    const firstName = isFemale 
        ? femaleNames[Math.floor(Math.random() * femaleNames.length)] 
        : maleNames[Math.floor(Math.random() * maleNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Rastgele son görev tarihi
    const hasHistory = Math.random() > 0.3;
    let lastDate = undefined;
    
    if (hasHistory) {
      const daysAgo = Math.floor(Math.random() * 15); // 0-15 gün önce
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      lastDate = date.toISOString().split('T')[0];
    }
    
    // Random Level
    const randomLevel = Math.floor(Math.random() * 8); // 0-7 arası

    // Random City (Weighted slightly towards Istanbul)
    const randomCity = Math.random() > 0.4 
        ? 'İstanbul' 
        : CITIES[Math.floor(Math.random() * CITIES.length)];

    users.push({
      id: `user_${i}`,
      name: `${firstName} ${lastName}`,
      phone: `905${Math.floor(100000000 + Math.random() * 900000000)}`,
      role: UserRole.USER,
      gender: isFemale ? Gender.FEMALE : Gender.MALE,
      city: randomCity,
      points: Math.floor(Math.random() * 50),
      completedTasks: Math.floor(Math.random() * 20),
      lastTaskDate: lastDate,
      localGuideLevel: randomLevel,
      localGuideStatus: randomLevel > 0 ? LocalGuideStatus.APPROVED : LocalGuideStatus.NONE
    });
  }
  return users;
};

const generateMockBusinesses = (count: number): Business[] => {
  const businesses: Business[] = [];
  for (let i = 1; i <= count; i++) {
    const randomCity = Math.random() > 0.5 
        ? 'İstanbul' 
        : CITIES[Math.floor(Math.random() * CITIES.length)];
        
    businesses.push({
      id: `biz_${i}`,
      name: `Örnek İşletme ${i} (${randomCity})`,
      mapsUrl: `https://maps.google.com/?q=business+${i}`,
      city: randomCity,
      targetReviewCount: Math.floor(Math.random() * (150 - 30) + 30) // 30 ile 150 arası hedef
    });
  }
  return businesses;
};

const MOCK_USERS_INITIAL: User[] = generateMockUsers(235);
const MOCK_BUSINESSES_INITIAL: Business[] = generateMockBusinesses(10);
const MOCK_TASKS_INITIAL: Task[] = []; 
const MOCK_POOL_INITIAL: PoolComment[] = [
    { id: 'pool_1', content: 'Harika bir deneyimdi, kesinlikle tavsiye ederim.', sector: Sector.GENERAL, tags: ['tavsiye'] },
    { id: 'pool_2', content: 'Personel çok ilgiliydi, her şey için teşekkürler.', sector: Sector.GENERAL, tags: ['personel', 'teşekkür'] }
];

// Default Point Multipliers
const DEFAULT_MULTIPLIERS: Record<number, number> = {
    0: 1, 1: 1, 2: 1.2, 3: 1.3, 4: 1.5, 5: 2, 6: 2.5, 7: 3, 8: 4, 9: 5, 10: 10
};

interface DataContextType {
  users: User[];
  businesses: Business[];
  tasks: Task[];
  poolComments: PoolComment[];
  levelMultipliers: Record<number, number>;
  messages: Message[];
  announcements: Announcement[];
  paymentRequests: PaymentRequest[];
  pointConversionRate: number; // 1 Point = X TL
  tickets: Ticket[];
  
  // User Actions
  addUser: (user: User) => void;
  addUsersBulk: (users: User[]) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  deleteUsersBulk: (userIds: string[]) => void; // New
  requestLocalGuideLevel: (userId: string, level: LocalGuideLevel, proofUrl: string) => void;
  approveLocalGuideLevel: (userId: string) => void;
  rejectLocalGuideLevel: (userId: string) => void;
  updateLevelMultipliers: (multipliers: Record<number, number>) => void;
  
  // Business Actions
  addBusiness: (business: Business) => void;
  updateBusiness: (business: Business) => void;
  deleteBusiness: (businessId: string) => void;
  
  // Task Actions
  assignTask: (task: Task) => void;
  assignTasksBulk: (newTasks: Task[]) => void;
  deleteTask: (taskId: string) => void;
  deleteAllTasks: () => void; // New
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTaskDetails: (taskId: string, details: { suggestedContent?: string; keywords?: string }) => void;
  submitReview: (taskId: string, link: string, status?: TaskStatus) => void;
  getTasksByUser: (userId: string) => Task[];
  
  // Pool Actions
  addPoolComment: (comment: PoolComment) => void;
  updatePoolComment: (comment: PoolComment) => void; // New
  deletePoolComment: (id: string) => void;
  
  // Automation
  checkGoogleStatus: () => Promise<{ published: number, spam: number }>;
  generateAIComments: (sector: Sector, businessName: string, keywords: string[], count: number, tone: 'formal' | 'casual' | 'excited') => Promise<string[]>;

  // Chat & Announcements
  sendMessage: (receiverId: string, content: string, type?: 'SYSTEM' | 'CHAT') => void;
  markMessageRead: (messageId: string) => void;
  addAnnouncement: (title: string, content: string, type?: 'INFO' | 'WARNING' | 'SUCCESS') => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;

  // Payments
  requestPayment: (userId: string, amountPoints: number, method: PaymentMethod, details: string) => void;
  approvePayment: (requestId: string) => void;
  rejectPayment: (requestId: string) => void;
  setPointConversionRate: (rate: number) => void;

  // Support Tickets
  createTicket: (userId: string, subject: string, message: string, priority: TicketPriority) => void;
  replyToTicket: (ticketId: string, senderId: string, message: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  // Initialize State with LocalStorage check
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ys_users');
    return saved ? JSON.parse(saved) : MOCK_USERS_INITIAL;
  });

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem('ys_businesses');
    return saved ? JSON.parse(saved) : MOCK_BUSINESSES_INITIAL;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ys_tasks');
    return saved ? JSON.parse(saved) : MOCK_TASKS_INITIAL;
  });

  const [poolComments, setPoolComments] = useState<PoolComment[]>(() => {
    const saved = localStorage.getItem('ys_pool');
    return saved ? JSON.parse(saved) : MOCK_POOL_INITIAL;
  });

  const [levelMultipliers, setLevelMultipliers] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('ys_multipliers');
    return saved ? JSON.parse(saved) : DEFAULT_MULTIPLIERS;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
      const saved = localStorage.getItem('ys_messages');
      return saved ? JSON.parse(saved) : [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
      const saved = localStorage.getItem('ys_announcements');
      return saved ? JSON.parse(saved) : [];
  });

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
      const saved = localStorage.getItem('ys_payments');
      return saved ? JSON.parse(saved) : [];
  });

  const [pointConversionRate, setPointConversionRate] = useState<number>(() => {
      const saved = localStorage.getItem('ys_point_rate');
      return saved ? JSON.parse(saved) : 10; // Default 1 Point = 10 TL
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
      const saved = localStorage.getItem('ys_tickets');
      return saved ? JSON.parse(saved) : [];
  });

  // Persist State Changes
  useEffect(() => { localStorage.setItem('ys_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('ys_businesses', JSON.stringify(businesses)); }, [businesses]);
  useEffect(() => { localStorage.setItem('ys_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('ys_pool', JSON.stringify(poolComments)); }, [poolComments]);
  useEffect(() => { localStorage.setItem('ys_multipliers', JSON.stringify(levelMultipliers)); }, [levelMultipliers]);
  useEffect(() => { localStorage.setItem('ys_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('ys_announcements', JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem('ys_payments', JSON.stringify(paymentRequests)); }, [paymentRequests]);
  useEffect(() => { localStorage.setItem('ys_point_rate', JSON.stringify(pointConversionRate)); }, [pointConversionRate]);
  useEffect(() => { localStorage.setItem('ys_tickets', JSON.stringify(tickets)); }, [tickets]);

  // --- CHAT & ANNOUNCEMENT ACTIONS ---

  const sendMessage = (receiverId: string, content: string, type: 'SYSTEM' | 'CHAT' = 'SYSTEM') => {
      const newMessage: Message = {
          id: uuidv4(),
          senderId: 'SYSTEM',
          receiverId,
          content,
          timestamp: new Date().toISOString(),
          isRead: false,
          type
      };
      setMessages(prev => [...prev, newMessage]);
  };

  const markMessageRead = (messageId: string) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
  };

  const addAnnouncement = (title: string, content: string, type: 'INFO' | 'WARNING' | 'SUCCESS' = 'INFO') => {
      const newAnn: Announcement = {
          id: uuidv4(),
          title,
          content,
          createdAt: new Date().toISOString(),
          isActive: true,
          type
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      addToast('Duyuru yayınlandı.', 'success');
  };

  const deleteAnnouncement = (id: string) => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      addToast('Duyuru silindi.', 'warning');
  };

  const toggleAnnouncement = (id: string) => {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  // --- SUPPORT TICKET ACTIONS ---

  const createTicket = (userId: string, subject: string, message: string, priority: TicketPriority) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newTicket: Ticket = {
          id: uuidv4(),
          userId,
          userName: user.name,
          subject,
          status: TicketStatus.OPEN,
          priority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
              {
                  id: uuidv4(),
                  senderId: userId,
                  senderName: user.name,
                  message,
                  createdAt: new Date().toISOString(),
                  isAdmin: false
              }
          ]
      };
      setTickets(prev => [newTicket, ...prev]);
      addToast('Destek talebi oluşturuldu.', 'success');
  };

  const replyToTicket = (ticketId: string, senderId: string, message: string) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const sender = users.find(u => u.id === senderId);
      const isAdmin = sender?.role === UserRole.ADMIN;
      
      const newMessage: TicketMessage = {
          id: uuidv4(),
          senderId,
          senderName: sender?.name || 'Bilinmiyor',
          message,
          createdAt: new Date().toISOString(),
          isAdmin
      };

      setTickets(prev => prev.map(t => 
          t.id === ticketId 
              ? { ...t, messages: [...t.messages, newMessage], updatedAt: new Date().toISOString(), status: isAdmin ? TicketStatus.RESOLVED : TicketStatus.OPEN } 
              : t
      ));

      // Notification
      if (isAdmin) {
          sendMessage(ticket.userId, `🎫 Destek talebinize (#${ticket.id.slice(0,6)}) cevap verildi: "${message.substring(0, 30)}..."`);
      } else {
          addToast('Cevabınız gönderildi.', 'success');
      }
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
      addToast('Talep durumu güncellendi.', 'info');
  };

  // --- PAYMENT ACTIONS ---

  const requestPayment = (userId: string, amountPoints: number, method: PaymentMethod, details: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      if (user.points < amountPoints) {
          addToast('Yetersiz bakiye.', 'error');
          return;
      }

      const fiatValue = amountPoints * pointConversionRate;

      const newRequest: PaymentRequest = {
          id: uuidv4(),
          userId,
          userName: user.name,
          userPhone: user.phone,
          amountPoints,
          amountFiat: fiatValue,
          method,
          details,
          status: PaymentStatus.PENDING,
          requestDate: new Date().toISOString()
      };

      // Deduct points immediately
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, points: u.points - amountPoints } : u));
      
      setPaymentRequests(prev => [newRequest, ...prev]);
      
      sendMessage(userId, `💸 Ödeme talebiniz alındı. Tutar: ${fiatValue} TL. İşlem sırasına alındı.`);
      addToast('Ödeme talebi oluşturuldu.', 'success');
  };

  const approvePayment = (requestId: string) => {
      const req = paymentRequests.find(r => r.id === requestId);
      if (!req) return;

      setPaymentRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: PaymentStatus.PAID, processedDate: new Date().toISOString() } : r));
      
      sendMessage(req.userId, `✅ Ödemeniz gerçekleşti! ${req.amountFiat} TL hesabınıza gönderildi.`);
      addToast('Ödeme onaylandı.', 'success');
  };

  const rejectPayment = (requestId: string) => {
      const req = paymentRequests.find(r => r.id === requestId);
      if (!req) return;

      // Refund points
      setUsers(prev => prev.map(u => u.id === req.userId ? { ...u, points: u.points + req.amountPoints } : u));

      setPaymentRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: PaymentStatus.REJECTED, processedDate: new Date().toISOString() } : r));

      sendMessage(req.userId, `⚠️ Ödeme talebiniz reddedildi. ${req.amountPoints} puan hesabınıza iade edildi. Lütfen bilgileri kontrol ediniz.`);
      addToast('Ödeme reddedildi ve puan iade edildi.', 'warning');
  };

  // --- EXISTING ACTIONS UPDATED WITH MESSAGING ---

  // User CRUD
  const addUser = (user: User) => {
    setUsers([...users, user]);
    addToast('Kullanıcı başarıyla eklendi.', 'success');
  };
  
  const addUsersBulk = (newUsers: User[]) => {
    setUsers(prev => [...prev, ...newUsers]);
    addToast(`${newUsers.length} kullanıcı başarıyla eklendi.`, 'success');
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    addToast('Kullanıcı güncellendi.', 'success');
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setTasks(prev => prev.filter(t => t.userId !== userId));
    addToast('Kullanıcı silindi.', 'warning');
  };

  const deleteUsersBulk = (userIds: string[]) => {
      setUsers(prev => prev.filter(u => !userIds.includes(u.id)));
      setTasks(prev => prev.filter(t => !userIds.includes(t.userId)));
      addToast(`${userIds.length} kullanıcı silindi.`, 'warning');
  };

  // Local Guide Actions
  const requestLocalGuideLevel = (userId: string, level: LocalGuideLevel, proofUrl: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          pendingLocalGuideLevel: level,
          localGuideProofUrl: proofUrl,
          localGuideStatus: LocalGuideStatus.PENDING
      } : u));
      addToast('Doğrulama isteği gönderildi. Admin onayı bekleniyor.', 'info');
  };

  const approveLocalGuideLevel = (userId: string) => {
      setUsers(prev => prev.map(u => {
          if (u.id === userId && u.pendingLocalGuideLevel) {
              sendMessage(userId, `🎉 Tebrikler! Yerel Rehber Seviye ${u.pendingLocalGuideLevel} onaylandı. Artık görevlerden daha yüksek puan kazanacaksınız.`);
              return {
                  ...u,
                  localGuideLevel: u.pendingLocalGuideLevel,
                  pendingLocalGuideLevel: undefined,
                  localGuideStatus: LocalGuideStatus.APPROVED
              };
          }
          return u;
      }));
      addToast('Yerel rehber seviyesi onaylandı.', 'success');
  };

  const rejectLocalGuideLevel = (userId: string) => {
      setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          pendingLocalGuideLevel: undefined,
          localGuideStatus: LocalGuideStatus.REJECTED
      } : u));
      sendMessage(userId, `Yerel Rehber doğrulama isteğiniz maalesef onaylanamadı. Lütfen kanıt linkini kontrol edip tekrar deneyiniz.`);
      addToast('Yerel rehber isteği reddedildi.', 'warning');
  };

  const updateLevelMultipliers = (multipliers: Record<number, number>) => {
      setLevelMultipliers(multipliers);
      addToast('Puan katsayıları güncellendi.', 'success');
  };

  // Business CRUD
  const addBusiness = (business: Business) => {
      setBusinesses([...businesses, business]);
      addToast('İşletme eklendi.', 'success');
  };

  const updateBusiness = (updatedBusiness: Business) => {
    setBusinesses(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
    addToast('İşletme bilgileri güncellendi.', 'success');
  };

  const deleteBusiness = (businessId: string) => {
    setBusinesses(prev => prev.filter(b => b.id !== businessId));
    setTasks(prev => prev.filter(t => t.businessId !== businessId));
    addToast('İşletme ve ilgili görevler silindi.', 'warning');
  };

  // Task CRUD
  const assignTask = (task: Task) => {
    setTasks([...tasks, task]);
    // Kullanıcının son görev tarihini güncelle
    setUsers(prev => prev.map(u => u.id === task.userId ? { ...u, lastTaskDate: task.assignedDate } : u));
    
    // NOTIFY USER
    const business = businesses.find(b => b.id === task.businessId);
    sendMessage(task.userId, `📅 Yeni Görev: ${business?.name} işletmesi için görev atandı. Lütfen paneli kontrol edin.`);

    addToast('Görev atandı.', 'success');
  };

  const assignTasksBulk = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
    
    // Toplu atamada tüm kullanıcıların tarihlerini güncelle
    const userUpdates: Record<string, string> = {};
    const notifyUsers = new Set<string>();

    newTasks.forEach(t => {
        if (!userUpdates[t.userId] || new Date(t.assignedDate) > new Date(userUpdates[t.userId])) {
            userUpdates[t.userId] = t.assignedDate;
        }
        notifyUsers.add(t.userId);
    });

    setUsers(prev => prev.map(u => userUpdates[u.id] ? { ...u, lastTaskDate: userUpdates[u.id] } : u));
    
    // Notify all affected users
    notifyUsers.forEach(uid => {
        const count = newTasks.filter(t => t.userId === uid).length;
        sendMessage(uid, `📅 Size ${count} adet yeni görev planlandı. Detaylar için panelinizi kontrol ediniz.`);
    });

    addToast(`${newTasks.length} adet görev planlandı ve atandı.`, 'success');
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    addToast('Görev silindi.', 'info');
  };

  const deleteAllTasks = () => {
    setTasks([]);
    // Opsiyonel: Kullanıcıların lastTaskDate'ini sıfırlamak ister miyiz? Şimdilik hayır.
    addToast('Tüm görevler sistemden temizlendi.', 'warning');
  };
  
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prevTasks => {
      const currentTask = prevTasks.find(t => t.id === taskId);
      if (!currentTask) return prevTasks;

      const user = users.find(u => u.id === currentTask.userId);
      const business = businesses.find(b => b.id === currentTask.businessId);
      const multiplier = user ? (levelMultipliers[user.localGuideLevel] || 1) : 1;
      const basePoints = 1; // Standart puan
      const pointsToAdd = basePoints * multiplier;

      let pointChange = 0;
      let notificationMsg = '';
        
      if (status === TaskStatus.PUBLISHED && currentTask.status !== TaskStatus.PUBLISHED) {
          pointChange = pointsToAdd;
          notificationMsg = `✅ Tebrikler! ${business?.name} için yaptığınız yorum onaylandı. +${pointsToAdd} puan kazandınız.`;
      }
      else if (currentTask.status === TaskStatus.PUBLISHED && status !== TaskStatus.PUBLISHED) {
          pointChange = -pointsToAdd; // Geri al
          notificationMsg = `⚠️ ${business?.name} için puanınız geri alındı.`;
      }

      if (status === TaskStatus.SPAM_DELETED && currentTask.status !== TaskStatus.SPAM_DELETED) {
          pointChange = -pointsToAdd; // Ceza
          notificationMsg = `❌ Dikkat! ${business?.name} yorumunuz silindiği/spam olduğu için -${pointsToAdd} puan ceza uygulandı.`;
      }
      else if (currentTask.status === TaskStatus.SPAM_DELETED && status !== TaskStatus.SPAM_DELETED) {
          pointChange = pointsToAdd; // Cezayı geri al
          notificationMsg = `🔄 ${business?.name} cezanız iptal edildi.`;
      }

      // Round points to 1 decimal place to avoid weird floating points
      pointChange = Math.round(pointChange * 10) / 10;

      if (pointChange !== 0) {
        setUsers(currentUsers => currentUsers.map(u => 
          u.id === currentTask.userId ? { ...u, points: u.points + pointChange } : u
        ));
      }

      if (notificationMsg) {
          sendMessage(currentTask.userId, notificationMsg);
      }

      return prevTasks.map(t => t.id === taskId ? { ...t, status } : t);
    });
    addToast('Görev durumu güncellendi.', 'info');
  };

  const updateTaskDetails = (taskId: string, details: { suggestedContent?: string; keywords?: string }) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...details } : t));
    
    // Notify if specific instruction added
    const task = tasks.find(t => t.id === taskId);
    if(task && (details.suggestedContent || details.keywords)) {
        sendMessage(task.userId, `📝 Bir görev için özel talimat eklendi. Lütfen yorum yaparken dikkate alınız.`);
    }

    addToast('Görev talimatları kaydedildi.', 'success');
  };

  const submitReview = (taskId: string, link: string, status: TaskStatus = TaskStatus.PENDING_REVIEW) => {
    setTasks(prevTasks => {
        const currentTask = prevTasks.find(t => t.id === taskId);
        if (!currentTask) return prevTasks;

        const user = users.find(u => u.id === currentTask.userId);
        const business = businesses.find(b => b.id === currentTask.businessId);
        const multiplier = user ? (levelMultipliers[user.localGuideLevel] || 1) : 1;
        const basePoints = 1;
        const pointsToAdd = Math.round((basePoints * multiplier) * 10) / 10;

        let pointChange = 0;
        // Eğer submit edilirken direkt Published oluyorsa puan ver (Admin panelden manuel ekleme gibi)
        if (status === TaskStatus.PUBLISHED && currentTask.status !== TaskStatus.PUBLISHED) {
            pointChange = pointsToAdd;
            sendMessage(currentTask.userId, `✅ ${business?.name} yorum linki yönetici tarafından eklendi/onaylandı. +${pointsToAdd} puan.`);
        }

        if (pointChange !== 0) {
            setUsers(currentUsers => currentUsers.map(u => 
                u.id === currentTask.userId ? { ...u, points: u.points + pointChange } : u
            ));
        }

        return prevTasks.map(t => t.id === taskId ? { ...t, reviewLink: link, status: status } : t);
    });
    addToast('Yorum linki kaydedildi.', 'success');
  };

  const getTasksByUser = (userId: string) => tasks.filter(t => t.userId === userId);

  // Pool Actions
  const addPoolComment = (comment: PoolComment) => {
      setPoolComments(prev => [comment, ...prev]);
      addToast('Yorum havuza eklendi.', 'success');
  };

  const updatePoolComment = (updatedComment: PoolComment) => {
      setPoolComments(prev => prev.map(c => c.id === updatedComment.id ? updatedComment : c));
      addToast('Havuz yorumu güncellendi.', 'success');
  }

  const deletePoolComment = (id: string) => {
      setPoolComments(prev => prev.filter(c => c.id !== id));
      addToast('Yorum havuzdan silindi.', 'warning');
  };

  // Simulation of Google Bot Logic
  const checkGoogleStatus = async (): Promise<{ published: number, spam: number }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let publishedCount = 0;
            let spamCount = 0;
            const tasksToProcess = tasks.filter(t => t.reviewLink);
            
            tasksToProcess.forEach(task => {
                const rand = Math.random();
                let newStatus = task.status;

                if (task.status === TaskStatus.PENDING_REVIEW) {
                    if (rand > 0.2) { 
                        newStatus = TaskStatus.PUBLISHED;
                        publishedCount++;
                    } else {
                        newStatus = TaskStatus.SPAM_DELETED;
                        spamCount++;
                    }
                } 
                else if (task.status === TaskStatus.PUBLISHED) {
                    if (rand < 0.05) { 
                        newStatus = TaskStatus.SPAM_DELETED;
                        spamCount++;
                    }
                }

                if (newStatus !== task.status) {
                    updateTaskStatus(task.id, newStatus);
                }
            });

            resolve({ published: publishedCount, spam: spamCount });
        }, 2000); 
    });
  };

  // Mock AI Generator
  const generateAIComments = async (
      sector: Sector, 
      businessName: string, 
      keywords: string[], 
      count: number, 
      tone: 'formal' | 'casual' | 'excited'
  ): Promise<string[]> => {
      
      return new Promise((resolve) => {
          setTimeout(() => {
              const templates: Record<Sector, string[]> = {
                  [Sector.RESTAURANT]: [
                      "Yemekler harikaydı, özellikle {keyword} denemenizi öneririm.",
                      "{business} lezzet konusunda bizi şaşırtmadı, her şey çok tazeydi.",
                      "Servis hızı ve {keyword} kalitesi muazzamdı.",
                      "Arkadaşlarımla geldik ve {keyword} tadına bayıldık.",
                      "Mekan çok temiz, yemekler sıcak geldi. {business} favorimiz oldu."
                  ],
                  [Sector.CAFE]: [
                      "Kahveleri çok taze, ortam çalışmak için uygun.",
                      "{business} atmosferi çok güzel, {keyword} mutlaka denenmeli.",
                      "Tatlılar ve {keyword} uyumu harika.",
                      "Arkadaşlarla sohbet için mükemmel bir yer.",
                      "Personel güler yüzlü, servis hızlı."
                  ],
                  [Sector.HEALTH]: [
                      "{business} ekibi çok ilgiliydi, her aşamada bilgilendirdiler.",
                      "Hijyen kurallarına çok dikkat ediliyor, {keyword} konusunda uzmanlar.",
                      "Randevu saatine tam uyuldu, bekletilmedim.",
                      "Doktorun ilgisi ve {keyword} açıklamaları güven verdi.",
                      "Gönül rahatlığıyla tercih edebilirsiniz."
                  ],
                  [Sector.BEAUTY]: [
                      "{business} işini sanat gibi yapıyor, {keyword} işleminden çok memnun kaldım.",
                      "Kullanılan ürünler kaliteli, sonuç mükemmel.",
                      "Saç kesimi ve {keyword} tam istediğim gibi oldu.",
                      "Çalışanlar çok profesyonel ve güler yüzlü.",
                      "Kendinizi şımartmak için doğru adres."
                  ],
                  [Sector.HOTEL]: [
                      "Odalar tertemizdi, {keyword} hizmeti kusursuzdu.",
                      "{business} konumu harika, her yere yakın.",
                      "Kahvaltı çeşitliliği ve tazeliği çok iyiydi.",
                      "Personel yardımsever, giriş işlemleri hızlıydı.",
                      "Konforlu bir konaklama deneyimi yaşadık."
                  ],
                  [Sector.GENERAL]: [
                      "Hizmet kalitesi beklentimin üzerindeydi.",
                      "{business} işini profesyonelce yapıyor, {keyword} konusunda çok iyiler.",
                      "İletişim güçlü, sorun çözme odaklılar.",
                      "Zamanında teslimat ve kaliteli işçilik.",
                      "Kesinlikle tavsiye ederim."
                  ]
              };

              const selectedTemplates = templates[sector] || templates[Sector.GENERAL];
              const results: string[] = [];

              for (let i = 0; i < count; i++) {
                  let template = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)];
                  const keyword = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : "hizmet";
                  
                  let text = template.replace("{business}", businessName || "İşletme").replace("{keyword}", keyword);

                  if (tone === 'excited') {
                      text = text.replace(".", "!") + " 😍";
                  } else if (tone === 'casual') {
                      text = text.toLowerCase(); 
                  }

                  if (Math.random() > 0.5) text += " Teşekkürler.";
                  else if (Math.random() > 0.7) text = "Gerçekten " + text.charAt(0).toLowerCase() + text.slice(1);

                  results.push(text);
              }

              resolve(results);
          }, 1500);
      });
  };

  return (
    <DataContext.Provider value={{ 
      users, businesses, tasks, poolComments, levelMultipliers, messages, announcements, paymentRequests, pointConversionRate, tickets,
      addUser, addUsersBulk, updateUser, deleteUser, deleteUsersBulk, requestLocalGuideLevel, approveLocalGuideLevel, rejectLocalGuideLevel, updateLevelMultipliers,
      addBusiness, updateBusiness, deleteBusiness,
      assignTask, assignTasksBulk, deleteTask, deleteAllTasks, updateTaskStatus, updateTaskDetails, submitReview, getTasksByUser,
      addPoolComment, updatePoolComment, deletePoolComment,
      checkGoogleStatus, generateAIComments,
      sendMessage, markMessageRead, addAnnouncement, deleteAnnouncement, toggleAnnouncement,
      requestPayment, approvePayment, rejectPayment, setPointConversionRate,
      createTicket, replyToTicket, updateTicketStatus
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};