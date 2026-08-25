import prisma from '../lib/prismaClient.js'
import cloudinary from '../lib/cloudinaryClient.js'

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.status = 404
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
    stream.end(buffer)
  })
}

export async function addProductImage(productId, fileBuffer) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new NotFoundError('Produto não encontrado')

  // Posição seguinte = quantas imagens já tem (0 = principal/frente).
  const position = await prisma.productImage.count({ where: { productId } })

  const result = await uploadBuffer(fileBuffer, `products/${productId}`)

  return prisma.productImage.create({
    data: {
      productId,
      url: result.secure_url,
      publicId: result.public_id,
      position,
    },
  })
}

export async function removeProductImage(productId, imageId) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } })
  if (!image || image.productId !== productId) {
    throw new NotFoundError('Imagem não encontrada')
  }

  // Apaga primeiro na Cloudinary, só depois na BD — se a BD falhar depois
  // de já ter apagado na Cloudinary, fica só uma imagem órfã a menos (sem
  // custo), o inverso deixaria lixo a pagar espaço lá para sempre.
  await cloudinary.uploader.destroy(image.publicId)
  await prisma.productImage.delete({ where: { id: imageId } })
}

export async function reorderProductImages(productId, imageIds) {
  const images = await prisma.productImage.findMany({ where: { productId } })
  const validIds = new Set(images.map((img) => img.id))

  if (imageIds.length !== images.length || !imageIds.every((id) => validIds.has(id))) {
    throw new ValidationError('A lista tem de conter exatamente as imagens existentes do produto')
  }

  await prisma.$transaction(
    imageIds.map((id, index) => prisma.productImage.update({ where: { id }, data: { position: index } })),
  )
}
