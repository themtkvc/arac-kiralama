import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Car, Users, FileText, CreditCard, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Panel' },
  { to: '/araclar', icon: Car, label: 'Araçlar' },
  { to: '/musteriler', icon: Users, label: 'Müşteriler' },
  { to: '/sozlesmeler', icon: FileText, label: 'Sözleşmeler' },
  { to: '/odemeler', icon: CreditCard, label: 'Ödemeler' },
]

export function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">AraçKira</p>
            <p className="text-slate-400 text-xs">Yönetim Paneli</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <NavLink
          to="/ayarlar"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            )
          }
        >
          <Settings size={18} />
          Ayarlar
        </NavLink>
      </div>
    </aside>
  )
}
