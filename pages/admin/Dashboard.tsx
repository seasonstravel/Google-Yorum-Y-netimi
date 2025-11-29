import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { TaskStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDate, getUserLevel } from '../../utils/helpers';
import { Megaphone, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { Modal } from '../../components/Modal';

export const Dashboard: React.FC = () => {
  const { users, tasks, businesses, announcements, addAnnouncement, deleteAnnouncement, toggleAnnouncement } = useData();

  // Announcement State
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.PUBLISHED).length;
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING_REVIEW).length;
  const spamTasks = tasks.filter(t => t.status === TaskStatus.SPAM_DELETED).length;

  const statusData = [
    { name: 'Yayında', value: completedTasks, color: '#22c55e' },
    { name: 'İncelemede', value: pendingTasks, color: '#f97316' },
    { name: 'Spam/Silindi', value: spamTasks, color: '#ef4444' },
    { name: 'Bekleyen', value: tasks.filter(t => t.status === TaskStatus.ASSIGNED).length, color: '#3b82f6' },
  ];

  // Top 5 Users
  const sortedUsers = [...users].sort((a, b) => b.points - a.points).slice(0, 5);
  const userData = sortedUsers.map(u => ({ 
      name: u.name, 
      points: u.points,
      levelIcon: getUserLevel(u.points).icon
  }));

  const handleAddAnnouncement = () => {
      addAnnouncement(announcementForm.title, announcementForm.content, announcementForm.type);
      setIsAnnouncementModalOpen(false);
      setAnnouncementForm({ title: '', content: '', type: 'INFO' });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-gray-500 dark:text-gray-400 text-sm">Toplam Görev</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-gray-500 dark:text-gray-400 text-sm">Başarılı Yorum</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-gray-500 dark:text-gray-400 text-sm">İnceleme Bekleyen</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTasks}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="text-gray-500 dark:text-gray-400 text-sm">Toplam İşletme</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{businesses.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Charts */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Görev Durumları</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 flex-wrap">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: s.color }}></span>
                {s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Liderlik Tablosu (Top 5)</h2>
          <div className="space-y-3">
              {userData.map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                              {i + 1}
                          </div>
                          <div>
                              <p className="font-medium text-gray-900 dark:text-white flex items-center">
                                  {u.name}
                                  <span className="ml-2 text-sm" title="Seviye">{u.levelIcon}</span>
                              </p>
                          </div>
                      </div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                          {u.points} P
                      </div>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Announcements Management */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Megaphone className="w-5 h-5 mr-2 text-blue-500" />
                  Kullanıcı Duyuruları
              </h2>
              <button 
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="flex items-center text-xs px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                  <Plus size={14} className="mr-1" /> Yeni Duyuru
              </button>
          </div>
          
          <div className="space-y-3">
              {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Henüz duyuru eklenmemiş.</p>
              ) : (
                  announcements.map(ann => (
                      <div key={ann.id} className={`p-4 rounded-lg border flex justify-between items-center ${ann.isActive ? 'border-l-4 border-l-blue-500 bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700' : 'border-gray-200 bg-gray-100 opacity-60 dark:bg-gray-800'}`}>
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{ann.title}</h4>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${ann.type === 'SUCCESS' ? 'bg-green-100 text-green-800' : ann.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                      {ann.type}
                                  </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{ann.content}</p>
                              <span className="text-xs text-gray-400 mt-1 block">{formatDate(ann.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button 
                                  onClick={() => toggleAnnouncement(ann.id)}
                                  className={`p-1.5 rounded ${ann.isActive ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`}
                                  title={ann.isActive ? "Pasife Al" : "Aktif Et"}
                              >
                                  {ann.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                              </button>
                              <button 
                                  onClick={() => deleteAnnouncement(ann.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                  title="Sil"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Add Announcement Modal */}
      <Modal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          title="Yeni Duyuru Yayınla"
          footer={
              <>
                  <button
                      onClick={() => setIsAnnouncementModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                      İptal
                  </button>
                  <button
                      onClick={handleAddAnnouncement}
                      disabled={!announcementForm.title || !announcementForm.content}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                      Yayınla
                  </button>
              </>
          }
      >
          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Başlık</label>
                  <input 
                      type="text"
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İçerik</label>
                  <textarea 
                      rows={3}
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tür</label>
                  <select 
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                      value={announcementForm.type}
                      onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value as any})}
                  >
                      <option value="INFO">Bilgi (Mavi)</option>
                      <option value="WARNING">Uyarı (Sarı)</option>
                      <option value="SUCCESS">Başarı/Tebrik (Yeşil)</option>
                  </select>
              </div>
          </div>
      </Modal>
    </div>
  );
};