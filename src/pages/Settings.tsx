export default function Settings() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Ayarlar</h1>
      <p className="text-slate-500 text-sm mb-8">Sistem yapılandırması</p>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800 mb-1">Supabase Bağlantısı</h2>
          <p className="text-sm text-slate-500">
            Veritabanı bağlantı bilgileri <code className="bg-slate-100 px-1 rounded text-xs">.env</code> dosyasından okunmaktadır.
          </p>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <h2 className="font-semibold text-slate-800 mb-1">Versiyon</h2>
          <p className="text-sm text-slate-500">AraçKira Yönetim Sistemi v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
