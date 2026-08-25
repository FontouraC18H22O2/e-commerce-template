import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon } from './icons/index.jsx'

export default function SearchBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  function handleSubmit(e) {
    e.preventDefault()
    const value = e.target.elements.search.value.trim()
    navigate(value ? `/?search=${encodeURIComponent(value)}` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="navbar__search">
      <SearchIcon />
      <input
        name="search"
        type="search"
        placeholder="Pesquisar..."
        defaultValue={searchParams.get('search') ?? ''}
      />
    </form>
  )
}
