import bcrypt from 'bcrypt'

const saltRounds = 10
const plainPassword = '123456'

bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
  console.log('Plain Password:', plainPassword)
  console.log('Hashed Password:', hash)
})
