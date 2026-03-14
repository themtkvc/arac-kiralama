import { useEffect, useState } from 'react'
import { Plus, Search, Users, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type FormData = Omit<Customer, 'id' | 'created_at' | 'updated_at'>

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('full_name')
    setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [])

  function openAdd() { reset({}); setEditingId(null); setModalOpen(true) }
  function openEdit(c: Customer) { reset({ ...c }); setEditingId(c.id); setModalOpen(true) }

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase.from('customers').update(data).eq('id', editingId)
        if (error) {
          alert(`Güncelleme hatası: ${error.message}`)
          return
        }
      } else {
        const { error } = await supabase.from('customers').insert(data)
        if (error) {
          alert(`Kayıt hatası: ${error.message}`)
          return
        }
      }
      await fetchCustomers()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCustomer() {
    if (!deleteId) return
    setSaving(true)
    await supabase.from('customers').delete().eq('id', deleteId)
    await fetchCustomers()
    setDeleteId(null)
    setSaving(false)
  }

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.id_number || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Müşteriler</h1>
          <p className="text-slate-500 text-sm mt-1">{customers.length} müşteri kayıtlı</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Müşteri Ekle</Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Ad, telefon veya TC ara..."
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
            <Users size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">{search ? 'Sonuç bulunamadı.' : 'Henüz müşteri eklenmemiş.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Ad Soyad</th>
                <th className="px-4 py-3 font-medium text-slate-500">İletişim</th>
                <th className="px-4 py-3 font-medium text-slate-500">TC / Ehliyet</th>
                <th className="px-4 py-3 font-medium text-slate-500">Şehir</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone size={12} />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                        <Mail size={11} />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.id_number && <div className="text-xs">TC: {c.id_number}</div>}
                    {c.driving_license && <div className="text-xs text-slate-400">Ehliyet: {c.driving_license}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.city || '—'}</td>
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Müşteri Düzenle' : 'Yeni Müşteri'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Ad Soyad *" placeholder="Ahmet Yılmaz" {...register('full_name', { required: 'Zorunlu alan' })} error={errors.full_name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefon *" placeholder="0532 123 45 67" {...register('phone', { required: 'Zorunlu alan' })} error={errors.phone?.message} />
            <Input label="E-posta" placeholder="ahmet@email.com" type="email" {...register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="TC Kimlik No" placeholder="12345678901" {...register('id_number')} />
            <Input label="Ehliyet No" placeholder="..." {...register('driving_license')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Şehir" placeholder="İstanbul" {...register('city')} />
            <Input label="Adres" placeholder="..." {...register('address')} />
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
        onConfirm={deleteCustomer}
        title="Müşteri Sil"
        message="Bu müşteriyi silmek istediğinize emin misiniz?"
        loading={saving}
      />
    </div>
  )
}
