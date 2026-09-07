// ===== أنواع المستخدمين =====
export type UserRole = 'admin' | 'resident';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

// ===== الشقق والوحدات الملكية والإيجار =====
export interface OwnerInfo {
  id?: string;
  name: string;
  phone: string;
  idNumber?: string;
}

export interface LeaseInfo {
  landlordName: string;       // اسم المؤجر (المالك)
  landlordPhone: string;      // رقم هاتف المؤجر
  landlordIdNumber?: string;  // رقم هوية المؤجر
  tenantName: string;         // اسم المستأجر (الشاغل)
  tenantPhone: string;        // رقم هاتف المستأجر
  tenantIdNumber?: string;    // رقم هوية المستأجر
  startDate?: string;         // تاريخ بداية عقد الإيجار (YYYY-MM-DD)
  endDate?: string;           // تاريخ انتهاء عقد الإيجار (YYYY-MM-DD)
  duration?: string;          // مدة العقد (مثال: سنة واحدة، 6 أشهر، سنتين)
  monthlyRent?: number;       // قيمة الإيجار الشهري إن وجد
  notes?: string;             // شروط أو ملاحظات العقد
}

export interface Unit {
  id: string;
  unitNumber: string;
  floor: number;
  direction: 'شمال' | 'جنوب' | 'شرق' | 'غرب' | 'شمال غرب' | 'شمال شرق' | 'جنوب غرب' | 'جنوب شرق';
  area: number;
  type: 'ملك' | 'إيجار';
  unitCategory?: 'شقة' | 'حاصل' | 'مخزن' | 'موقف';
  ownerInfo?: OwnerInfo;      // بيانات المالك في حال كانت ملك
  leaseInfo?: LeaseInfo;      // بيانات المؤجر والمستأجر ومدة العقد في حال كانت إيجار
  currentOccupantId?: string;
  servicesFee: number;
  status: 'مأهولة' | 'شاغرة';
  createdAt: Date;
  updatedAt: Date;
}

export type UnitFormData = Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>;

// ===== السكان =====
export interface ResidentUnit {
  unitId: string;
  unitNumber: string;
  type: 'ملك' | 'إيجار';
  unitCategory?: 'شقة' | 'حاصل' | 'مخزن' | 'موقف';
  direction?: string;
  occupancyDate: Date;
  landlordName?: string;
  landlordPhone?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  leaseDuration?: string;
  floor?: number;
}

export interface Resident {
  id: string;
  fullName: string;
  idNumber: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  nationality: string;
  numberOfResidents?: number;  // عدد الأفراد في الشقة
  units: ResidentUnit[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ResidentFormData = Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>;

// ===== الفواتير =====
export interface InvoiceBreakdown {
  servicesFee: number;
  otherFees?: number;
  otherFeesNote?: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  unitId: string;
  unitNumber?: string;
  unitCategory?: 'شقة' | 'حاصل' | 'مخزن' | 'موقف';
  residentId: string;
  residentName?: string;
  period: string; // "2026-08"
  amount: number;
  breakdown: InvoiceBreakdown;
  dueDate: Date;
  status: InvoiceStatus;
  paidDate?: Date;
  createdAt: Date;
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'createdAt'>;

// ===== المدفوعات =====
export type PaymentMethod = 'نقد' | 'تحويل' | 'شيك';

export interface Payment {
  id: string;
  invoiceId: string;
  unitId: string;
  residentId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: Date;
  receipt?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export type PaymentFormData = Omit<Payment, 'id' | 'createdAt' | 'createdBy'>;

// ===== الاقتراحات والشكاوى =====
export type SuggestionType = 'اقتراح' | 'شكوى';
export type SuggestionPriority = 'عادي' | 'مهم' | 'حرج';
export type SuggestionStatus = 'جديد' | 'مقروء' | 'تم التعامل معه';

export interface Suggestion {
  id: string;
  residentId: string;
  residentName?: string;
  unitId: string;
  unitNumber?: string;
  type: SuggestionType;
  title: string;
  description: string;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  readAt?: Date;
  adminNotes?: string;
  createdAt: Date;
}

export type SuggestionFormData = Omit<Suggestion, 'id' | 'createdAt' | 'status' | 'readAt' | 'adminNotes' | 'residentName' | 'unitNumber'>;

// ===== الإعلانات =====
export type AnnouncementPriority = 'عادي' | 'مهم' | 'عاجل';
export type AnnouncementAudience = 'الكل' | 'محدد';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  createdBy: string;
  targetAudience: AnnouncementAudience;
  targetResidentIds?: string[];
  targetResidentNames?: string[];
  createdAt: Date;
}

export type AnnouncementFormData = Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>;

// ===== بيانات العمارة =====
export interface CouncilMember {
  name: string;
  role: string;      // منصبه: رئيس، أمين سر، عضو، أمين صندوق، إلخ
  phone: string;
  email?: string;
}

export interface BuildingInfo {
  buildingName: string;
  address: string;
  phone: string;
  email: string;
  managementCouncil: string;  // نص قديم للتوافق
  councilPhone: string;
  councilEmail: string;
  councilMembers?: CouncilMember[];  // قائمة أعضاء مجلس الإدارة
  logo?: string;
  established?: string;
  description?: string;
}

// ===== إحصائيات لوحة التحكم =====
export interface DashboardStats {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalResidents: number;
  pendingInvoices: number;
  pendingAmount: number;
  paidThisMonth: number;
  overdueInvoices: number;
  newSuggestions: number;
}

// ===== دليل وخطة الخدمات الدورية للسكان =====
export type ServicePeriod = 'يومياً' | 'أسبوعياً' | 'شهرياً' | 'كل شهرين' | 'كل 3 أشهر' | 'نصف سنوي' | 'سنوياً' | 'عند الطلب / طوارئ';
export type ServiceStatus = 'نشط ومستمر' | 'مجدول قريباً' | 'مكتمل لهذه الفترة' | 'متوقف مؤقتاً';

export interface ServiceItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  title: string;                 // اسم الخدمة (القسم الفرعي)
  period: ServicePeriod;         // دورية تقديم الخدمة
  description: string;           // تفاصيل وما تشمله الخدمة
  provider?: string;             // الجهة المنفذة / الشركة / الفني
  providerPhone?: string;        // هاتف التواصل للجهة المنفذة
  status: ServiceStatus;         // حالة الخدمة
  nextScheduleDate?: string;     // الموعد القادم (YYYY-MM-DD)
  notes?: string;                // ملاحظات أو تعليمات للسكان
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;                  // اسم القسم الرئيسي (مثل: الصيانة والتشغيل، النظافة والبيئة، إلخ)
  description?: string;          // وصف القسم
  icon?: string;                 // أيقونة تمثيلية
  order: number;
  items?: ServiceItem[];
  createdAt: Date;
}

export type ServiceItemFormData = Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>;

// ===== صندوق وخزينة العمارة (إيرادات ومصروفات وفواتير) =====
export type FundTransactionType = 'income' | 'expense';

export type FundExpenseCategory =
  | 'صيانة مصعد'
  | 'كهرباء عامة ومصعد'
  | 'مياه وخزانات عامة'
  | 'نظافة ومواد استهلاكية'
  | 'أجور عمال وحراسة'
  | 'صيانة مضخات وسباكة'
  | 'أعمال إنارة وكهرباء'
  | 'صيانة مبنى وترميم'
  | 'مشتريات وأدوات عامة'
  | 'مصاريف إدارية وقانونية'
  | 'أخرى';

export type FundIncomeCategory =
  | 'تحصيل رسوم خدمات شهرية'
  | 'إيجار حاصل / محل تجاري'
  | 'إيجار مخزن / موقف'
  | 'مساهمة ملاك لصيانة خاصة'
  | 'تبرعات ودعم للصندوق'
  | 'عوائد وغرامات تأخير'
  | 'رصيد افتتاحي للخزينة'
  | 'أخرى';

export interface FundTransaction {
  id: string;
  type: FundTransactionType;
  category: string;              // بند المصروف أو الإيراد
  title: string;                 // البيان / الوصف المختصر
  amount: number;                // المبلغ بالشيقل (₪)
  date: string;                  // تاريخ الحركة / الفاتورة (YYYY-MM-DD)
  invoiceNumber?: string;        // رقم الفاتورة أو السند أو الوصل
  invoiceReceiptUrl?: string;    // رابط أو مرفق الفاتورة الإلكترونية / الصورة
  paidToOrReceivedFrom?: string; // الجهة المصروف لها أو المستلم منها
  paymentMethod: PaymentMethod;  // 'نقد' | 'تحويل' | 'شيك'
  notes?: string;                // ملاحظات تفصيلية
  createdBy?: string;            // مسؤول الإدخال
  createdAt: Date;
  updatedAt?: Date;
}

export type FundTransactionFormData = Omit<FundTransaction, 'id' | 'createdAt' | 'updatedAt'>;

export interface MonthlyFundSummary {
  yearMonth: string;             // YYYY-MM
  monthName: string;             // اسم الشهر بالعربية
  totalIncome: number;           // إجمالي إيرادات الشهر
  totalExpense: number;          // إجمالي مصروفات الشهر
  netBalance: number;            // الفائض أو العجز (إيراد - مصروف)
  transactionsCount: number;     // عدد الحركات
}

