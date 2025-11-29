

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum Gender {
  MALE = 'Erkek',
  FEMALE = 'Kadın',
  UNSPECIFIED = 'Belirtilmemiş'
}

export const CITIES = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 
    'Konya', 'Gaziantep', 'Mersin', 'Kocaeli', 'Diyarbakır', 
    'Hatay', 'Manisa', 'Kayseri', 'Samsun', 'Balıkesir', 
    'Kahramanmaraş', 'Van', 'Aydın', 'Denizli'
];

export enum TaskStatus {
  ASSIGNED = 'ASSIGNED', // Mavi
  PENDING_REVIEW = 'PENDING_REVIEW', // Turuncu
  PUBLISHED = 'PUBLISHED', // Yeşil
  SPAM_DELETED = 'SPAM_DELETED' // Kırmızı
}

export enum Shift {
  MORNING = 'Sabah',
  NOON = 'Öğle',
  EVENING = 'Akşam'
}

export enum Sector {
  RESTAURANT = 'Restoran/Yemek',
  CAFE = 'Cafe/Kahve',
  HEALTH = 'Sağlık/Klinik',
  BEAUTY = 'Güzellik/Kuaför',
  HOTEL = 'Otel/Konaklama',
  GENERAL = 'Genel Hizmet'
}

// New: Local Guide Levels
export enum LocalGuideLevel {
    NONE = 0,
    LEVEL_1 = 1,
    LEVEL_2 = 2,
    LEVEL_3 = 3,
    LEVEL_4 = 4,
    LEVEL_5 = 5,
    LEVEL_6 = 6,
    LEVEL_7 = 7,
    LEVEL_8 = 8,
    LEVEL_9 = 9,
    LEVEL_10 = 10
}

export enum LocalGuideStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  phone: string; // Used for WhatsApp login
  role: UserRole;
  gender: Gender;
  city: string; // New: Location Based Assignment
  points: number;
  completedTasks: number;
  lastTaskDate?: string; // ISO Date string - Dinlenme süresi hesabı için
  
  // Local Guide Props
  localGuideLevel: LocalGuideLevel;
  pendingLocalGuideLevel?: LocalGuideLevel; // Kullanıcının talep ettiği seviye
  localGuideProofUrl?: string; // Kanıt linki/screenshot
  localGuideStatus: LocalGuideStatus;
}

export interface Business {
  id: string;
  name: string;
  mapsUrl: string;
  city: string; // New: Business Location
  targetReviewCount: number;
}

export interface Task {
  id: string;
  userId: string;
  businessId: string;
  assignedDate: string; // ISO Date string
  shift: Shift;
  status: TaskStatus;
  reviewLink?: string;
  notes?: string;
  suggestedContent?: string; // Yapılacak yorum metni
  keywords?: string; // Anahtar kelimeler
}

export interface PoolComment {
  id: string;
  content: string;
  sector: Sector;
  tags: string[]; // Keywords used
  businessId?: string; // Optional: Links comment to a specific business
}

// CHAT & ANNOUNCEMENTS
export interface Message {
  id: string;
  senderId: string; // 'SYSTEM' or userId
  receiverId: string; // userId
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'SYSTEM' | 'CHAT';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isActive: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
}

// WALLET & PAYMENTS
export enum PaymentMethod {
    IBAN = 'IBAN',
    PAPARA = 'PAPARA'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    REJECTED = 'REJECTED'
}

export interface PaymentRequest {
    id: string;
    userId: string;
    userName: string; // Denormalized for easier display
    userPhone: string;
    amountPoints: number;
    amountFiat: number; // TL Value
    method: PaymentMethod;
    details: string; // IBAN or Papara No
    status: PaymentStatus;
    requestDate: string;
    processedDate?: string;
}

// SUPPORT TICKETS
export enum TicketStatus {
    OPEN = 'OPEN',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED'
}

export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

export interface TicketMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    createdAt: string;
    isAdmin: boolean;
}

export interface Ticket {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
    updatedAt: string;
    messages: TicketMessage[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}