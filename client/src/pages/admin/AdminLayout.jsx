import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <p className="eyebrow">Admin</p>
        <nav className="admin__nav">
          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'admin__nav-link admin__nav-link--active' : 'admin__nav-link')}>
            Produtos
          </NavLink>
          <NavLink to="/admin/promotions" className={({ isActive }) => (isActive ? 'admin__nav-link admin__nav-link--active' : 'admin__nav-link')}>
            Promoções
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'admin__nav-link admin__nav-link--active' : 'admin__nav-link')}>
            Encomendas
          </NavLink>
        </nav>
      </aside>
      <div className="admin__content">
        <Outlet />
      </div>
    </div>
  )
}
