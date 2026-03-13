import { useEffect, useState } from 'react'
import { Plus, Search, CreditCard, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import type { Payment, Vehicle, Customer } from '../types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { formatCurrency, formatDate, paymentStatusLabel, paymentStatusColor, paymentMethodLabel } from '../lib/utils'

interface ContractSummary {
  id: string
  contract_number: string
  vehicle?: Vehicle
  customer?: Customer
}

interface PaymentWithContract extends Omit<Payment, 'contract'> {
  contract?: {
    contract_number: string
    vehicle?: Vehicle & { plate_number: string }
    customer?: Customer
  }
}

interface FormData {
  contract_id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_type: string
  status: string
  notes?: string
}

const methodOptions = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'havale', label: 'Havale/EFT' },
  { value: 'kredi_karti', label: 'Kredi Kartı' },
  { value: 'diger', label: 'Diğer' },
]

const typeOptions = [
  { value: 'kira', label: 'Kira' },
  { value: 'depozito', label: 'Depozito' },
  { value: 'iade', label: 'İade' },
  { value: 'diger', label: 'Diğer' },
]

const statusOptions = [
  { value: 'odendi', label: 'Ödendi' },
  { value: 'bekliyor', label: 'Bekliyor' },
  { value: 'gecikti', label: 'Gecikti' },
]

export default function Payments() {
  const [payments, setPayments] = useState<PaymentWithContract[]>([])
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { payment_method: 'nakit', payment_type: 'kira', status: 'odendi' }
  })

  async function fetchAll() {
    const [p, c] = await Promise.all([
      supabase
        .from('payments')
        .select('*, contract:contracts(contract_number, vehicle:vehicles(brand,model,plate_number), customer:customers(full_name))')
        .order('payment_date', { ascending: false }),
      supabase
        .from('contracts')
        .select('id, contract_number, vehicle:vehicles(brand,model,plate_number), customer:customers(full_name)')
        .eq('status', 'aktif'),
    ])
    setPayments((p.data || []) as PaymentWithContract[])
    setContracts((c.data || []) as unknown as ContractSummary[])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  function openAdd() {
    reset({ payment_method: 'nakit', payment_type: 'kira', status: 'odendi', payment_date: new Date().toISOString().split('T')[0] })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(p: PaymentWithContract) {
    reset({
      contract_id: p.contract_id,
      amount: p.amount,
      payment_date: p.payment_date,
      payment_method: p.payment_method,
      payment_type: p.payment_type,
      status: p.status,
      notes: p.notes,
    })
    setEditingId(p.id)
    setModalOpen(true)
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const payload = { ...data, amount: Number(data.amount) }
      if (editingId) {
        await supabase.from('payments').update(payload).eq('id', editingId)
      } else {
        await supabase.from('payments').insert(payload)
      }
      await fetchAll()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function deletePayment() {
    if (!deleteId) return
    setSaving(true)
    await supabase.from('payments').delete().eq('id', deleteId)
    await fetchAll()
    setDeleteId(null)
    setSaving(false)
  }

  const contractOptions = contracts.map(c => {
    const v = c.vehicle as Vehicle | undefined
    const cu = c.customer as Customer | undefined
    return { value: c.id, label: `${c.contract_number} – ${v?.brand} ${v?.model} / ${cu?.full_name}` }
  })

  const filtered = payments.filter(p => {
    const matchSearch =
      (p.contract?.contract_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.contract?.customer?.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus ? p.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const totalFiltered = filtered.filter(p => p.status === 'odendi').reduce((s, p) => s + p.amount, 0)

  const typeLabel: Record<string, string> = {
    kira: 'Kira', depozito: 'Depozito', iade: 'İade', diger: 'Diğer'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ödemeler</h1>
          <p className="text-slate-500 text-sm mt-1">{payments.length} ödeme kaydı</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Ödeme Ekle</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Sözleşme veya müşteri ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white text-slate-700"
        >
          <option value="">Tüm Durumlar</option>
          <option value="odendi">Ödendi</option>
          <option value="bekliyor">Bekliyor</option>
          <option value="gecikti">Gecikti</option>
        </select>
        {filtered.length > 0 && (
          <div className="ml-auto text-sm text-slate-600">
            Toplam tahsilat: <span className="font-semibold text-slate-800">{formatCurrency(totalFiltered)}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">{search || filterStatus ? 'Sonuç bulunamadı.' : 'Henüz ödeme kaydı eklenmemiş.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Sözleşme</th>
                <th className="px-4 py-3 font-medium text-slate-500">Müşteri</th>
                <th className="px-4 py-3 font-medium text-slate-500">Tutar</th>
                <th className="px-4 py-3 font-medium text-slate-500">Tarih</th>
                <th className="px-4 py-3 font-medium text-slate-500">Yöntem / Tür</th>
                <th className="px-4 py-3 font-medium text-slate-500">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.contract?.contract_number || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{p.contract?.customer?.full_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{paymentMethodLabel[p.payment_method]}</div>
                    <div className="text-xs text-slate-400">{typeLabel[p.payment_type] || p.payment_type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={paymentStatusLabel[p.status]} className={paymentStatusColor[p.status]} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Ödeme Düzenle' : 'Yeni Ödeme'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Sözleşme *"
            options={[{ value: '', label: '-- Sözleşme seçin --' }, ...contractOptions]}
            {...register('contract_id', { required: 'Sözleşme seçin' })}
            error={errors.contract_id?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tutar (₺) *" type="number" step="0.01" {...register('amount', { required: 'Zorunlu alan' })} error={errors.amount?.message} />
            <Input label="Ödeme Tarihi *" type="date" {...register('payment_date', { required: 'Zorunlu alan' })} error={errors.payment_date?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Yöntem" options={methodOptions} {...register('payment_method')} />
            <Select label="Tür" options={typeOptions} {...register('payment_type')} />
            <Select label="Durum" options={statusOptions} {...register('status')} />
          </div>
          <Textarea label="Notlar" rows={2} placeholder="İsteğe bağlı notlar..." {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>İptal</Button>
            <Button type="submit" loading={saving}>{editingId ? 'Güncelle' : 'Ekle'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deletePayment}
        title="Ödeme Kaydını Sil"
        message="Bu ödeme kaydını silmek istediğinize emin misiniz?"
        loading={saving}
      />
    </div>
  )
}
