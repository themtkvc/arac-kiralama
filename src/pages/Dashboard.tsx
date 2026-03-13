import { useEffect, useState } from 'react'
import { Car, Users, FileText, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'
import type { DashboardStats, Contract } from '../types'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    availableVehicles: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
  })
  const [recentContracts, setRecentContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [vehiclesRes, contractsRes, paymentsRes, recentRes] = await Promise.all([
          supabase.from('vehicles').select('status'),
          supabase.from('contracts').select('status'),
          supabase.from('payments').select('amount, status, payment_date'),
          supabase
            .from('contracts')
            .select('*, vehicle:vehicles(brand,model,plate_number), customer:customers(full_name)')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

        const vehicles = vehiclesRes.data || []
        const contracts = contractsRes.data || []
        const payments = paymentsRes.data || []

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        const monthlyRevenue = payments
          .filter(p => p.status === 'odendi' && p.payment_date >= startOfMonth)
          .reduce((sum, p) => sum + p.amount, 0)

        setStats({
          totalVehicles: vehicles.length,
          availableVehicles: vehicles.filter(v => v.status === 'musait').length,
          activeContracts: contracts.filter(c => c.status === 'aktif').length,
          monthlyRevenue,
          pendingPayments: payments.filter(p => p.status === 'bekliyor').length,
          overduePayments: payments.filter(p => p.status === 'gecikti').length,
        })

        setRecentContracts(recentRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statusBadge: Record<string, string> = {
    aktif: 'bg-blue-100 text-blue-700',
    tamamlandi: 'bg-emerald-100 text-emerald-700',
    iptal: 'bg-red-100 text-red-700',
  }
  const statusLabel: Record<string, string> = {
    aktif: 'Aktif',
    tamamlandi: 'Tamamlandı',
    iptal: 'İptal',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Genel Bakış</h1>
        <p className="text-slate-500 text-sm mt-1">Hoş geldiniz! İşte bugünkü özet.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Car} label="Toplam Araç" value={stats.totalVehicles} sub={`${stats.availableVehicles} müsait`} color="bg-sky-100 text-sky-600" />
          <StatCard icon={FileText} label="Aktif Sözleşme" value={stats.activeContracts} color="bg-violet-100 text-violet-600" />
          <StatCard icon={TrendingUp} label="Bu Ay Gelir" value={formatCurrency(stats.monthlyRevenue)} color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={Users} label="Müsait Araç" value={stats.availableVehicles} sub={`${stats.totalVehicles} araçtan`} color="bg-amber-100 text-amber-600" />
          <StatCard icon={Clock} label="Bekleyen Ödeme" value={stats.pendingPayments} color="bg-orange-100 text-orange-600" />
          <StatCard icon={AlertCircle} label="Gecikmiş Ödeme" value={stats.overduePayments} color="bg-red-100 text-red-600" />
        </div>
      )}

      {/* Son Sözleşmeler */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Son Sözleşmeler</h2>
        </div>
        {recentContracts.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            Henüz sözleşme bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentContracts.map(c => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Car size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {c.vehicle?.brand} {c.vehicle?.model}
                      <span className="text-slate-400 font-normal ml-2 text-xs">{c.vehicle?.plate_number}</span>
                    </p>
                    <p className="text-xs text-slate-500">{c.customer?.full_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[c.status]}`}>
                    {statusLabel[c.status]}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(c.start_date)} – {formatDate(c.end_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
