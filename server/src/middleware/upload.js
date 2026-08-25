import multer from 'multer'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Guarda o ficheiro em memória (Buffer) — nunca escrevemos no disco do
// servidor, só reencaminhamos o buffer para a Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Formato de imagem não suportado — usa JPEG, PNG ou WEBP'))
    }
    cb(null, true)
  },
})

// Envolve o multer para os erros dele (ficheiro grande demais, tipo
// errado) chegarem ao errorHandler central como 400, em vez do 500
// genérico que teriam por defeito.
export function uploadSingleImage(fieldName) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        err.status = 400
        return next(err)
      }
      next()
    })
  }
}
