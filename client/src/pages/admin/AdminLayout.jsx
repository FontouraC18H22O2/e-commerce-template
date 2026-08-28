import { NavLink, Outlet } from 'react-router-dom'
import { GridIcon, BoxIcon, TagIcon, ReceiptIcon } from '../../components/icons/index.jsx'

const links = [
  { to: '/admin', label: 'Vista geral', icon: GridIcon, end: true },
  { to: '/admin/products', label: 'Produtos', icon: BoxIcon },
  { to: '/admin/promotions', label: 'Promoções', icon: TagIcon },
  { to: '/admin/orders', label: 'Encomendas', icon: ReceiptIcon },
]

export default function AdminLayout() {
  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__sidebar-card">
          <p className="eyebrow">Painel</p>
          <h2 className="admin__sidebar-title">Administração</h2>
          <nav className="admin__nav">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => (isActive ? 'admin__nav-link admin__nav-link--active' : 'admin__nav-link')}
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
      <div className="admin__content">
        <Outlet />
      </div>
    </div>
  )
}
