import { PrismaClient } from '@prisma/client'

// Singleton do Prisma Client. Em dev, o --watch reinicia o processo a cada
// alteração de ficheiro, o que recriaria o client (e as ligações à BD) a
// cada vez sem isto — aqui garantimos uma única instância.
const prisma = new PrismaClient()

export default prisma
