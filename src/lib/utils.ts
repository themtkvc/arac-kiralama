import { format, differenceInDays, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy', { locale: tr })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function calcDays(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1
}

export function calcTotalAmount(dailyRate: number, startDate: string, endDate: string): number {
  const days = calcDays(startDate, endDate)
  return days * dailyRate
}

export const vehicleStatusLabel: Record<string, string> = {
  musait: 'Müsait',
  kirada: 'Kirada',
  bakimda: 'Bakımda',
  pasif: 'Pasif',
}

export const vehicleStatusColor: Record<string, string> = {
  musait: 'bg-emerald-100 text-emerald-700',
  kirada: 'bg-blue-100 text-blue-700',
  bakimda: 'bg-amber-100 text-amber-700',
  pasif: 'bg-gray-100 text-gray-600',
}

export const contractStatusLabel: Record<string, string> = {
  aktif: 'Aktif',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
}

export const contractStatusColor: Record<string, string> = {
  aktif: 'bg-blue-100 text-blue-700',
  tamamlandi: 'bg-emerald-100 text-emerald-700',
  iptal: 'bg-red-100 text-red-700',
}

export const paymentStatusLabel: Record<string, string> = {
  odendi: 'Ödendi',
  bekliyor: 'Bekliyor',
  gecikti: 'Gecikti',
}

export const paymentStatusColor: Record<string, string> = {
  odendi: 'bg-emerald-100 text-emerald-700',
  bekliyor: 'bg-amber-100 text-amber-700',
  gecikti: 'bg-red-100 text-red-700',
}

export const paymentMethodLabel: Record<string, string> = {
  nakit: 'Nakit',
  havale: 'Havale/EFT',
  kredi_karti: 'Kredi Kartı',
  diger: 'Diğer',
}

export const fuelTypeLabel: Record<string, string> = {
  benzin: 'Benzin',
  dizel: 'Dizel',
  lpg: 'LPG',
  elektrik: 'Elektrik',
  hibrit: 'Hibrit',
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
