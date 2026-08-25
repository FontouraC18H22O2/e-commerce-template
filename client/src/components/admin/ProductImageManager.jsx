import { useRef, useState } from 'react'
import { uploadProductImage, deleteProductImage, reorderProductImages } from '../../services/adminApi.js'

// Gere as imagens de UM produto já criado (frente/lados/trás...). Só faz
// sentido depois do produto existir — precisa de um productId para saber
// onde guardar as imagens na Cloudinary e na BD.
export default function ProductImageManager({ productId, images, onImagesChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  async function handleFileSelected(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { image } = await uploadProductImage(productId, file)
      onImagesChange([...images, image])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(imageId) {
    if (!confirm('Remover esta imagem?')) return
    try {
      await deleteProductImage(productId, imageId)
      onImagesChange(images.filter((img) => img.id !== imageId))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleMove(index, direction) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= images.length) return

    const reordered = [...images]
    ;[reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]]
    onImagesChange(reordered)

    try {
      await reorderProductImages(productId, reordered.map((img) => img.id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="image-manager">
      <div className="image-manager__grid">
        {images.map((image, i) => (
          <div key={image.id} className="image-manager__item">
            <img src={image.url} alt="" />
            {i === 0 && <span className="image-manager__primary">Principal</span>}
            <div className="image-manager__controls">
              <button type="button" onClick={() => handleMove(i, -1)} disabled={i === 0} title="Mover para trás">
                ←
              </button>
              <button type="button" onClick={() => handleMove(i, 1)} disabled={i === images.length - 1} title="Mover para a frente">
                →
              </button>
              <button type="button" className="admin-table__danger" onClick={() => handleDelete(image.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
      <button type="button" className="btn btn--outline" onClick={() => fileInputRef.current.click()} disabled={uploading}>
        {uploading ? 'A enviar...' : 'Adicionar imagem'}
      </button>

      {error && <p className="form-alert" role="alert">{error}</p>}
    </div>
  )
}
