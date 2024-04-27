import multer from 'multer'
import { v4 } from 'uuid'

const exts = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const fileFilter = (req, file, callback) => {
  callback(null, !!exts[file.mimetype])
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/avatar')
  },
  filename: (req, file, callback) => {
    callback(null, v4() + exts[file.mimetype])
  },
})

export default multer({ fileFilter, storage })
