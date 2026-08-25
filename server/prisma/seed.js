// Popula a base de dados com categorias e produtos fictícios variados.
// Corre com: npm run seed (depois de "prisma migrate dev").

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Vestuário', slug: 'vestuario' },
  { name: 'Calçado', slug: 'calcado' },
  { name: 'Acessórios', slug: 'acessorios' },
  { name: 'Casa', slug: 'casa' },
  { name: 'Tecnologia', slug: 'tecnologia' },
]

const products = [
  { name: 'Camisola de Algodão Orgânico', slug: 'camisola-algodao-organico', description: 'Camisola básica em algodão orgânico, corte reto e tecido macio.', priceCents: 2990, stock: 40, category: 'vestuario' },
  { name: 'Casaco Corta-Vento', slug: 'casaco-corta-vento', description: 'Casaco leve e resistente à água, ideal para dias de vento.', priceCents: 7990, stock: 15, category: 'vestuario' },
  { name: 'Calças Chino Slim', slug: 'calcas-chino-slim', description: 'Calças chino de corte slim, versáteis para o dia a dia.', priceCents: 4990, stock: 25, category: 'vestuario' },
  { name: 'Ténis Urbano Branco', slug: 'tenis-urbano-branco', description: 'Ténis minimalista em couro sintético, sola em borracha.', priceCents: 6990, stock: 30, category: 'calcado' },
  { name: 'Botas de Cordovão', slug: 'botas-cordovao', description: 'Botas resistentes em cordovão genuíno, forro acolchoado.', priceCents: 11990, stock: 10, category: 'calcado' },
  { name: 'Sandálias de Verão', slug: 'sandalias-verao', description: 'Sandálias leves e confortáveis, palmilha anatómica.', priceCents: 3490, stock: 20, category: 'calcado' },
  { name: 'Mochila Compacta', slug: 'mochila-compacta', description: 'Mochila urbana com compartimento acolchoado para portátil.', priceCents: 5990, stock: 18, category: 'acessorios' },
  { name: 'Cinto de Couro', slug: 'cinto-couro', description: 'Cinto clássico em couro natural, fivela metálica.', priceCents: 1990, stock: 35, category: 'acessorios' },
  { name: 'Óculos de Sol Polarizados', slug: 'oculos-sol-polarizados', description: 'Proteção UV400 com lentes polarizadas antirreflexo.', priceCents: 4490, stock: 22, category: 'acessorios' },
  { name: 'Conjunto de Chávenas de Cerâmica', slug: 'conjunto-chavenas-ceramica', description: 'Conjunto de 4 chávenas artesanais em cerâmica fosca.', priceCents: 3290, stock: 16, category: 'casa' },
  { name: 'Candeeiro de Mesa Minimalista', slug: 'candeeiro-mesa-minimalista', description: 'Candeeiro em madeira e linho, luz quente regulável.', priceCents: 5490, stock: 12, category: 'casa' },
  { name: 'Manta de Lã Merino', slug: 'manta-la-merino', description: 'Manta macia em lã merino, ideal para o sofá ou a cama.', priceCents: 6490, stock: 14, category: 'casa' },
  { name: 'Auscultadores Bluetooth', slug: 'auscultadores-bluetooth', description: 'Cancelamento de ruído ativo e 30h de autonomia.', priceCents: 8990, stock: 20, category: 'tecnologia' },
  { name: 'Carregador Rápido USB-C', slug: 'carregador-rapido-usb-c', description: 'Carregador de 30W compatível com a maioria dos dispositivos.', priceCents: 2490, stock: 50, category: 'tecnologia' },
  { name: 'Coluna Portátil à Prova de Água', slug: 'coluna-portatil-agua', description: 'Som potente, resistente a salpicos, 12h de bateria.', priceCents: 5990, stock: 18, category: 'tecnologia' },
]

async function main() {
  console.log('A limpar dados existentes...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  console.log('A criar categorias...')
  const categoryBySlug = {}
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat })
    categoryBySlug[cat.slug] = created
  }

  console.log('A criar produtos...')
  for (const product of products) {
    const { category, ...data } = product
    await prisma.product.create({
      data: {
        ...data,
        categoryId: categoryBySlug[category].id,
      },
    })
  }

  console.log(`Seed concluído: ${categories.length} categorias, ${products.length} produtos.`)
}

main()
  .catch((err) => {
    console.error('Erro ao correr o seed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
