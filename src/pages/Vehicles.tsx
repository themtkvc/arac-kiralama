import { useEffect, useState } from 'react'
import { Plus, Search, Car, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import type { Vehicle } from '../types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { formatCurrency, vehicleStatusLabel, vehicleStatusColor, fuelTypeLabel } from '../lib/utils'

type FormData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>

const fuelOptions = [
  { value: 'benzin', label: 'Benzin' },
  { value: 'dizel', label: 'Dizel' },
  { value: 'lpg', label: 'LPG' },
  { value: 'elektrik', label: 'Elektrik' },
  { value: 'hibrit', label: 'Hibrit' },
]

const transmissionOptions = [
  { value: 'manuel', label: 'Manuel' },
  { value: 'otomatik', label: 'Otomatik' },
]

const statusOptions = [
  { value: 'musait', label: 'Müsait' },
  { value: 'kirada', label: 'Kirada' },
  { value: 'bakimda', label: 'Bakımda' },
  { value: 'pasif', label: 'Pasif' },
]

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { status: 'musait', fuel_type: 'benzin', transmission: 'manuel', km: 0 }
  })

  async function fetchVehicles() {
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
    setVehicles(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchVehicles() }, [])

  function openAdd() { reset({ status: 'musait', fuel_type: 'benzin', transmission: 'manuel', km: 0 }); setEditingId(null); setModalOpen(true) }
  function openEdit(v: Vehicle) {
    reset({ ...v })
    setEditingId(v.id)
    setModalOpen(true)
  }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      const payload = { ...data, daily_rate: Number(data.daily_rate), km: Number(data.km), year: Number(data.year) }
      if (editingId) {
        await supabase.from('vehicles').update(payload).eq('id', editingId)
      } else {
        await supabase.from('vehicles').insert(payload)
      }
      await fetchVehicles()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function deleteVehicle() {
    if (!deleteId) return
    setSaving(true)
    await supabase.from('vehicles').delete().eq('id', deleteId)
    await fetchVehicles()
    setDeleteId(null)
    setSaving(false)
  }

  const filtered = vehicles.filter(v =>
    v.plate_number.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Araç Filosu</h1>
          <p className="text-slate-500 text-sm mt-1">{vehicles.length} araç kayıtlı</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Araç Ekle</Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Plaka, marka veya model ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Car size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">{search ? 'Sonuç bulunamadı.' : 'Henüz araç eklenmemiş.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Plaka</th>
                <th className="px-4 py-3 font-medium text-slate-500">Araç</th>
                <th className="px-4 py-3 font-medium text-slate-500">Yakıt / Vites</th>
                <th className="px-4 py-3 font-medium text-slate-500">Durum</th>
                <th className="px-4 py-3 font-medium text-slate-500">Günlük Ücret</th>
                <th className="px-4 py-3 font-medium text-slate-500">KM</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{v.plate_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{v.brand} {v.model}</div>
                    <div className="text-slate-400 text-xs">{v.year} · {v.color}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {fuelTypeLabel[v.fuel_type]} / {v.transmission === 'otomatik' ? 'Otomatik' : 'Manuel'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={vehicleStatusLabel[v.status]} className={vehicleStatusColor[v.status]} />
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{formatCurrency(v.daily_rate)}</td>
                  <td className="px-4 py-3 text-slate-600">{v.km?.toLocaleString('tr-TR')} km</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(v.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
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

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Araç Düzenle' : 'Yeni Araç'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Plaka *" placeholder="34 ABC 123" {...register('plate_number', { required: 'Zorunlu alan' })} error={errors.plate_number?.message} />
            <Input label="Yıl *" type="number" placeholder="2022" {...register('year', { required: 'Zorunlu alan' })} error={errors.year?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Marka *" placeholder="Toyota" {...register('brand', { required: 'Zorunlu alan' })} error={errors.brand?.message} />
            <Input label="Model *" placeholder="Corolla" {...register('model', { required: 'Zorunlu alan' })} error={errors.model?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Renk" placeholder="Beyaz" {...register('color')} />
            <Input label="Günlük Ücret (₺) *" type="number" step="0.01" placeholder="500" {...register('daily_rate', { required: 'Zorunlu alan' })} error={errors.daily_rate?.message} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Yakıt Tipi" options={fuelOptions} {...register('fuel_type')} />
            <Select label="Vites" options={transmissionOptions} {...register('transmission')} />
            <Select label="Durum" options={statusOptions} {...register('status')} />
          </div>
          <Input label="KM" type="number" placeholder="0" {...register('km')} />
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
        onConfirm={deleteVehicle}
        title="Araç Sil"
        message="Bu aracı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        loading={saving}
      />
    </div>
  )
}
