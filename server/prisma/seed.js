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
  { name: 'Camisola de Algodão Orgânico', slug: 'camisola-algodao-organico', description: 'Camisola básica em algodão 100% orgânico certificado, tecido de peso médio (240g/m²) com toque macio e durável. Corte reto unissexo, gola redonda reforçada e acabamento em ribana nos punhos e na bainha. Lavagem à máquina a 30°C sem perder a forma.', priceCents: 2990, stock: 40, category: 'vestuario', brand: 'Norrland', model: 'Essential Crew', colors: ['Cru', 'Cinza Mescla', 'Verde Musgo', 'Preto'] },
  { name: 'Casaco Corta-Vento', slug: 'casaco-corta-vento', description: 'Casaco corta-vento leve (180g), com membrana resistente à água (coluna de água 5000mm) e costuras seladas. Capuz ajustável, fecho central estanque e bolso de arrumação que se transforma em bolsa de transporte. Ideal para corrida, ciclismo ou dias instáveis.', priceCents: 7990, stock: 15, category: 'vestuario', featured: true, brand: 'Altitude Gear', model: 'Windshell 2.0', colors: ['Preto', 'Azul Marinho', 'Amarelo Sinal'] },
  { name: 'Calças Chino Slim', slug: 'calcas-chino-slim', description: 'Calças chino de corte slim em sarja de algodão com um toque de elastano (2%) para maior liberdade de movimento. Bolsos laterais e traseiros funcionais, fecho de botão e correr. Versáteis para o escritório ou o dia a dia.', priceCents: 4990, stock: 25, category: 'vestuario', brand: 'Norrland', model: 'Slim Chino', colors: ['Bege', 'Grafite', 'Verde Caqui', 'Azul Marinho'] },
  { name: 'Ténis Urbano Branco', slug: 'tenis-urbano-branco', description: 'Ténis minimalista em couro sintético microperfurado, sola em borracha vulcanizada com boa aderência e palmilha em espuma de memória removível. Design limpo que combina com praticamente tudo, do casual ao smart-casual.', priceCents: 6990, stock: 30, category: 'calcado', featured: true, brand: 'Fielding & Co', model: 'Urban Low', colors: ['Branco', 'Branco/Preto', 'Bege'] },
  { name: 'Botas de Cordovão', slug: 'botas-cordovao', description: 'Botas robustas em cordovão genuíno curtido vegetal, forro interior acolchoado e sola em borracha com padrão antiderrapante. Costura Goodyear welt, que permite substituir a sola quando necessário — feitas para durar anos.', priceCents: 11990, stock: 10, category: 'calcado', brand: 'Cordwood', model: 'Heritage Boot', colors: ['Castanho Cordovão', 'Preto'] },
  { name: 'Sandálias de Verão', slug: 'sandalias-verao', description: 'Sandálias leves com tiras em tecido técnico de secagem rápida e palmilha anatómica com suporte de arco. Fecho de velcro ajustável e sola em EVA com boa amortização — ideais para praia, cidade ou viagem.', priceCents: 3490, stock: 20, category: 'calcado', brand: 'Coast Line', model: 'Aegean', colors: ['Bege', 'Azul', 'Terracota'] },
  { name: 'Mochila Compacta', slug: 'mochila-compacta', description: 'Mochila urbana com 18L de capacidade, compartimento acolchoado para portátil até 15", bolso frontal organizador e alças ajustáveis com espuma respirável. Tecido exterior resistente a salpicos.', priceCents: 5990, stock: 18, category: 'acessorios', brand: 'Urban Carry', model: 'Daypack 18L', colors: ['Preto', 'Cinza Grafite', 'Verde Oliva'] },
  { name: 'Cinto de Couro', slug: 'cinto-couro', description: 'Cinto clássico em couro bovino de curtume natural, com 3,5cm de largura. Fivela em metal escovado, resistente à oxidação. Corte reto, com possibilidade de ajuste/encurtar em casa sem ferramentas especiais.', priceCents: 1990, stock: 35, category: 'acessorios', brand: 'Cordwood', model: 'Classic Belt', colors: ['Preto', 'Castanho'] },
  { name: 'Óculos de Sol Polarizados', slug: 'oculos-sol-polarizados', description: 'Óculos de sol com lentes polarizadas e proteção UV400, que reduzem o encadeamento em superfícies reflectoras (água, vidro, estrada molhada). Armação em acetato leve e flexível, com dobradiças reforçadas em mola.', priceCents: 4490, stock: 22, category: 'acessorios', brand: 'Solstice', model: 'Horizon', colors: ['Preto Fosco', 'Tartaruga', 'Verde Militar'] },
  { name: 'Conjunto de Chávenas de Cerâmica', slug: 'conjunto-chavenas-ceramica', description: 'Conjunto de 4 chávenas artesanais em grés cerâmico com acabamento fosco, capacidade de 250ml cada. Próprias para micro-ondas e máquina de lavar loiça. Pequenas variações de tom fazem parte do processo artesanal — cada peça é única.', priceCents: 3290, stock: 16, category: 'casa', brand: 'Terra & Forma', model: 'Nordic Set', colors: ['Branco Fosco', 'Areia', 'Terracota'] },
  { name: 'Candeeiro de Mesa Minimalista', slug: 'candeeiro-mesa-minimalista', description: 'Candeeiro de mesa com estrutura em madeira de faia maciça e abajur em linho natural. Luz quente (2700K) regulável em 3 níveis através de sensor tátil na base. Cabo têxtil de 1,8m e casquilho E27 (lâmpada incluída).', priceCents: 5490, stock: 12, category: 'casa', featured: true, brand: 'Lumen Studio', model: 'Arc Table Lamp', colors: ['Natural (Madeira)', 'Preto'] },
  { name: 'Manta de Lã Merino', slug: 'manta-la-merino', description: 'Manta em 100% lã merino, tecida em padrão espinha (herringbone), com franjas nas extremidades. Macia ao toque e termorreguladora — quente no inverno, respirável no verão. Dimensões: 130 x 180cm.', priceCents: 6490, stock: 14, category: 'casa', brand: 'Highland Wool', model: 'Merino Throw', colors: ['Cinza Claro', 'Ferrugem', 'Verde Floresta'] },
  { name: 'Auscultadores Bluetooth', slug: 'auscultadores-bluetooth', description: 'Auscultadores intra-auriculares verdadeiramente sem fios, com cancelamento ativo de ruído (ANC) e modo transparência. Bluetooth 5.3 com baixa latência, 30h de autonomia total (estojo incluído) e resistência a salpicos IPX4. Controlo tátil personalizável na app.', priceCents: 8990, stock: 20, category: 'tecnologia', featured: true, brand: 'SonicWave', model: 'Aura Pro', colors: ['Preto', 'Branco', 'Azul Meia-Noite'] },
  { name: 'Carregador Rápido USB-C', slug: 'carregador-rapido-usb-c', description: 'Carregador compacto de 30W com tecnologia GaN (nitreto de gálio), mais pequeno e eficiente que os carregadores tradicionais. Compatível com carregamento rápido USB Power Delivery — carrega um smartphone até 50% em cerca de 30 minutos.', priceCents: 2490, stock: 50, category: 'tecnologia', brand: 'VoltEdge', model: 'GaN 30W', colors: ['Branco', 'Preto'] },
  { name: 'Coluna Portátil à Prova de Água', slug: 'coluna-portatil-agua', description: 'Coluna portátil com certificação IPX7 (resistente a imersão), som a 360° com graves reforçados por radiador passivo. Bluetooth 5.1 com alcance de 15m, bateria para 12h de reprodução contínua e função de emparelhamento duplo (duas colunas em estéreo).', priceCents: 5990, stock: 18, category: 'tecnologia', brand: 'SonicWave', model: 'Drift Mini', colors: ['Preto', 'Azul', 'Coral'] },
]

async function main() {
  console.log('A limpar dados existentes...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  // ProductImage é apagada em cascata quando o Product é apagado
  // (onDelete: Cascade no schema), por isso não precisa de deleteMany aqui.
  await prisma.product.deleteMany()
  await prisma.promotion.deleteMany()
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

  console.log('A criar promoção de exemplo...')
  const now = new Date()
  await prisma.promotion.create({
    data: {
      name: 'Semana da Tecnologia',
      description: 'Até 20% em produtos de Tecnologia',
      discountPercent: 20,
      startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // desde ontem
      endsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // durante 2 semanas
      categoryId: categoryBySlug['tecnologia'].id,
    },
  })

  console.log(`Seed concluído: ${categories.length} categorias, ${products.length} produtos, 1 promoção.`)
}

main()
  .catch((err) => {
    console.error('Erro ao correr o seed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
