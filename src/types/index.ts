export type VehicleStatus = 'musait' | 'kirada' | 'bakimda' | 'pasif'
export type FuelType = 'benzin' | 'dizel' | 'lpg' | 'elektrik' | 'hibrit'
export type Transmission = 'manuel' | 'otomatik'

export interface Vehicle {
  id: string
  plate_number: string
  brand: string
  model: string
  year: number
  color?: string
  fuel_type: FuelType
  transmission: Transmission
  status: VehicleStatus
  daily_rate: number
  km: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string
  email?: string
  id_number?: string
  driving_license?: string
  address?: string
  city?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ContractStatus = 'aktif' | 'tamamlandi' | 'iptal'

export interface Contract {
  id: string
  contract_number: string
  vehicle_id: string
  customer_id: string
  start_date: string
  end_date: string
  daily_rate: number
  total_amount: number
  deposit_amount: number
  status: ContractStatus
  km_start: number
  km_end?: number
  notes?: string
  created_at: string
  updated_at: string
  // Joins
  vehicle?: Vehicle
  customer?: Customer
}

export type PaymentMethod = 'nakit' | 'havale' | 'kredi_karti' | 'diger'
export type PaymentType = 'kira' | 'depozito' | 'iade' | 'diger'
export type PaymentStatus = 'odendi' | 'bekliyor' | 'gecikti'

export interface Payment {
  id: string
  contract_id: string
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  status: PaymentStatus
  notes?: string
  created_at: string
  // Join
  contract?: Contract
}

export interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  activeContracts: number
  monthlyRevenue: number
  pendingPayments: number
  overduePayments: number
}
