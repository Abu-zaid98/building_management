import * as XLSX from 'xlsx';
import type { Resident, Unit } from '../types';

export interface ResidentExcelRow {
  '#': number;
  'اسم الساكن / المستأجر': string;
  'رقم الهوية': string;
  'رقم الجوال': string;
  'جوال إضافي': string;
  'الجنسية': string;
  'فئة الوحدة': string;
  'رقم الوحدة': string;
  'الطابق': string;
  'نوع الإشغال': string;
  'اسم المؤجر / المالك': string;
  'هاتف المؤجر / المالك': string;
  'مدة عقد الإيجار': string;
  'تاريخ نهاية العقد': string;
  'رسوم الخدمات (₪)': number | string;
  'مساحة الوحدة (م²)': number | string;
  'اتجاه الوحدة': string;
  'تاريخ الإشغال': string;
  'البريد الإلكتروني': string;
  'ملاحظات': string;
}

/**
 * دالة تصدير بيانات جميع السكان والشقق والحواصل كملف Excel احترافي (.xlsx)
 */
export const exportResidentsToExcel = (residents: Resident[], units: Unit[]) => {
  // خريطة للوحدات للوصول السريع
  const unitMap = new Map<string, Unit>();
  units.forEach(u => unitMap.set(u.id, u));

  const rows: ResidentExcelRow[] = [];
  let index = 1;

  residents.forEach(res => {
    if (res.units && res.units.length > 0) {
      res.units.forEach(uRef => {
        const u = unitMap.get(uRef.unitId);
        const cat = uRef.unitCategory || u?.unitCategory || (u?.floor === 0 ? 'حاصل' : 'شقة');
        const catLabel = cat === 'حاصل' ? 'حاصل تجاري' : cat === 'مخزن' ? 'مخزن / خدمات' : 'شقة سكنية';
        const isRent = uRef.type === 'إيجار' || u?.type === 'إيجار';

        const landlordName = isRent
          ? (u?.leaseInfo?.landlordName || uRef.landlordName || u?.ownerInfo?.name || '—')
          : (u?.ownerInfo?.name || res.fullName || 'الساكن نفسه (مالك)');

        const landlordPhone = isRent
          ? (u?.leaseInfo?.landlordPhone || uRef.landlordPhone || u?.ownerInfo?.phone || '—')
          : (u?.ownerInfo?.phone || res.primaryPhone || '—');

        const leaseDuration = isRent
          ? (u?.leaseInfo?.duration || uRef.leaseDuration || 'ساري')
          : '— (ملك)';

        const leaseEndDate = isRent
          ? (u?.leaseInfo?.endDate || uRef.leaseEndDate || '—')
          : '—';

        rows.push({
          '#': index++,
          'اسم الساكن / المستأجر': res.fullName || '—',
          'رقم الهوية': res.idNumber || '—',
          'رقم الجوال': res.primaryPhone || '—',
          'جوال إضافي': res.secondaryPhone || '—',
          'الجنسية': res.nationality || 'فلسطيني',
          'فئة الوحدة': catLabel,
          'رقم الوحدة': `${cat === 'حاصل' ? 'حاصل' : 'شقة'} ${uRef.unitNumber || u?.unitNumber || '—'}`,
          'الطابق': u?.floor !== undefined ? (u.floor === 0 ? 'الأرضي (0)' : `الطابق ${u.floor}`) : '—',
          'نوع الإشغال': isRent ? 'إيجار (مستأجر)' : 'ملك (مالك أصلي)',
          'اسم المؤجر / المالك': landlordName,
          'هاتف المؤجر / المالك': landlordPhone,
          'مدة عقد الإيجار': leaseDuration,
          'تاريخ نهاية العقد': leaseEndDate,
          'رسوم الخدمات (₪)': u?.servicesFee ?? '—',
          'مساحة الوحدة (م²)': u?.area ?? '—',
          'اتجاه الوحدة': u?.direction || '—',
          'تاريخ الإشغال': uRef.occupancyDate
            ? new Date(uRef.occupancyDate).toLocaleDateString('ar-EG')
            : '—',
          'البريد الإلكتروني': res.email || `${res.idNumber}@building-home.com`,
          'ملاحظات': res.notes || '—',
        });
      });
    } else {
      // ساكن غير مربوط بوحدة حالياً
      rows.push({
        '#': index++,
        'اسم الساكن / المستأجر': res.fullName || '—',
        'رقم الهوية': res.idNumber || '—',
        'رقم الجوال': res.primaryPhone || '—',
        'جوال إضافي': res.secondaryPhone || '—',
        'الجنسية': res.nationality || 'فلسطيني',
        'فئة الوحدة': 'غير مربوط',
        'رقم الوحدة': 'غير محدد',
        'الطابق': '—',
        'نوع الإشغال': '—',
        'اسم المؤجر / المالك': '—',
        'هاتف المؤجر / المالك': '—',
        'مدة عقد الإيجار': '—',
        'تاريخ نهاية العقد': '—',
        'رسوم الخدمات (₪)': '—',
        'مساحة الوحدة (م²)': '—',
        'اتجاه الوحدة': '—',
        'تاريخ الإشغال': '—',
        'البريد الإلكتروني': res.email || `${res.idNumber}@building-home.com`,
        'ملاحظات': res.notes || '—',
      });
    }
  });

  // إنشاء ورقة العمل والمصنف
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // ضبط عرض الأعمدة تلقائياً ليكون مناسباً ومنسقاً
  worksheet['!cols'] = [
    { wch: 6 },  // #
    { wch: 26 }, // اسم الساكن
    { wch: 15 }, // رقم الهوية
    { wch: 15 }, // رقم الجوال
    { wch: 15 }, // جوال إضافي
    { wch: 12 }, // الجنسية
    { wch: 16 }, // فئة الوحدة
    { wch: 14 }, // رقم الوحدة
    { wch: 14 }, // الطابق
    { wch: 18 }, // نوع الإشغال
    { wch: 24 }, // اسم المؤجر / المالك
    { wch: 18 }, // هاتف المؤجر / المالك
    { wch: 20 }, // مدة عقد الإيجار
    { wch: 16 }, // تاريخ نهاية العقد
    { wch: 16 }, // رسوم الخدمات
    { wch: 16 }, // مساحة الوحدة
    { wch: 14 }, // اتجاه الوحدة
    { wch: 14 }, // تاريخ الإشغال
    { wch: 28 }, // البريد الإلكتروني
    { wch: 25 }, // ملاحظات
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل السكان والوحدات');

  // كتابة وحفظ الملف
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `تقرير_بيانات_السكان_والوحدات_والعقود_${today}.xlsx`);
};
