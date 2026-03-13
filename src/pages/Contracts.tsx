import { useEffect, useState } from 'react'
import { Plus, Search, FileText, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import type { Contract, Vehicle, Customer } from '../types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  formatCurrency, formatDate, calcDays, calcTotalAmount,
  contractStatusLabel, contractStatusColor
} from '../lib/utils'

interface FormData {
  vehicle_id: string
  customer_id: string
  start_date: string
  end_date: string
  daily_rate: number
  deposit_amount: number
  status: string
  km_start: number
  km_end?: number
  notes?: string
  contract_number?: string
}

const statusOptions = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'tamamlandi', label: 'Tamamlandı' },
  { value: 'iptal', label: 'İptal' },
]

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [computedTotal, setComputedTotal] = useState(0)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { status: 'aktif', km_start: 0, deposit_amount: 0 }
  })

  const watchStart = watch('start_date')
  const watchEnd = watch('end_date')
  const watchRate = watch('daily_rate')
  const watchVehicle = watch('vehicle_id')

  useEffect(() => {
    if (watchStart && watchEnd && watchRate) {
      try {
        const total = calcTotalAmount(Number(watchRate), watchStart, watchEnd)
        setComputedTotal(total > 0 ? total : 0)
      } catch { setComputedTotal(0) }
    }
  }, [watchStart, watchEnd, watchRate])

  // Auto-fill daily_rate from selected vehicle
  useEffect(() => {
    if (watchVehicle) {
      const v = vehicles.find(v => v.id === watchVehicle)
      if (v) setValue('daily_rate', v.daily_rate)
    }
  }, [watchVehicle, vehicles])

  async function fetchAll() {
    const [c, v, cu] = await Promise.all([
      supabase.from('contracts').select('*, vehicle:vehicles(brand,model,plate_number), customer:customers(full_name,phone)').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').in('status', ['musait', 'kirada']),
      supabase.from('customers').select('*').order('full_name'),
    ])
    setContracts(c.data || [])
    setVehicles(v.data || [])
    setCustomers(cu.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  function openAdd() {
    reset({ status: 'aktif', km_start: 0, deposit_amount: 0 })
    setComputedTotal(0)
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(c: Contract) {
    reset({ ...c })
    setEditingId(c.id)
    setModalOpen(true)
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const total = calcTotalAmount(Number(data.daily_rate), data.start_date, data.end_date)
      const payload = {
        ...data,
        daily_rate: Number(data.daily_rate),
        deposit_amount: Number(data.deposit_amount),
        km_start: Number(data.km_start),
        km_end: data.km_end ? Number(data.km_end) : null,
        total_amount: total,
      }

      if (editingId) {
        await supabase.from('contracts').update(payload).eq('id', editingId)
      } else {
        await supabase.from('contracts').insert(payload)
        // Update vehicle status to 'kirada'
        await supabase.from('vehicles').update({ status: 'kirada' }).eq('id', data.vehicle_id)
      }

      await fetchAll()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function deleteContract() {
    if (!deleteId) return
    setSaving(true)
    await supabase.from('contracts').delete().eq('id', deleteId)
    await fetchAll()
    setDeleteId(null)
    setSaving(false)
  }

  const vehicleOptions = vehicles.map(v => ({
    value: v.id,
    label: `${v.plate_number} – ${v.brand} ${v.model}`,
  }))

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: `${c.full_name} (${c.phone})`,
  }))

  const filtered = contracts.filter(c =>
    c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
    (c.vehicle as Vehicle & { plate_number: string })?.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    (c.customer as Customer)?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sözleşmeler</h1>
          <p className="text-slate-500 text-sm mt-1">{contracts.length} sözleşme kayıtlı</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Sözleşme Ekle</Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Sözleşme no, araç veya müşteri ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <FileText size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">{search ? 'Sonuç bulunamadı.' : 'Henüz sözleşme eklenmemiş.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Sözleşme No</th>
                <th className="px-4 py-3 font-medium text-slate-500">Araç</th>
                <th className="px-4 py-3 font-medium text-slate-500">Müşteri</th>
                <th className="px-4 py-3 font-medium text-slate-500">Tarih Aralığı</th>
                <th className="px-4 py-3 font-medium text-slate-500">Toplam</th>
                <th className="px-4 py-3 font-medium text-slate-500">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => {
                const v = c.vehicle as Vehicle & { plate_number: string }
                const cu = c.customer as Customer
                const days = calcDays(c.start_date, c.end_date)
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">{c.contract_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{v?.brand} {v?.model}</div>
                      <div className="text-xs text-slate-400">{v?.plate_number}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{cu?.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{formatDate(c.start_date)} – {formatDate(c.end_date)}</div>
                      <div className="text-xs text-slate-400">{days} gün</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(c.total_amount)}</td>
                    <td className="px-4 py-3">
                      <Badge label={contractStatusLabel[c.status]} className={contractStatusColor[c.status]} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sözleşme Düzenle' : 'Yeni Sözleşme'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Araç *"
              options={[{ value: '', label: '-- Araç seçin --' }, ...vehicleOptions]}
              {...register('vehicle_id', { required: 'Araç seçin' })}
              error={errors.vehicle_id?.message}
            />
            <Select
              label="Müşteri *"
              options={[{ value: '', label: '-- Müşteri seçin --' }, ...customerOptions]}
              {...register('customer_id', { required: 'Müşteri seçin' })}
              error={errors.customer_id?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Başlangıç Tarihi *" type="date" {...register('start_date', { required: 'Zorunlu alan' })} error={errors.start_date?.message} />
            <Input label="Bitiş Tarihi *" type="date" {...register('end_date', { required: 'Zorunlu alan' })} error={errors.end_date?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Günlük Ücret (₺) *" type="number" step="0.01" {...register('daily_rate', { required: 'Zorunlu alan' })} error={errors.daily_rate?.message} />
            <Input label="Depozito (₺)" type="number" step="0.01" {...register('deposit_amount')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Toplam Tutar</label>
              <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800">
                {formatCurrency(computedTotal)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Başlangıç KM" type="number" {...register('km_start')} />
            <Input label="Bitiş KM" type="number" {...register('km_end')} />
            <Select label="Durum" options={statusOptions} {...register('status')} />
          </div>
          <Textarea label="Notlar" rows={2} placeholder="İsteğe bağlı notlar..." {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>İptal</Button>
            <Button type="submit" loading={saving}>{editingId ? 'Güncelle' : 'Oluştur'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteContract}
        title="Sözleşme Sil"
        message="Bu sözleşmeyi silmek istediğinize emin misiniz?"
        loading={saving}
      />
    </div>
  )
}
