import app from './app.js'

console.log('========== VARIABLES DE ENTORNO ==========')
console.log('PORT:', process.env.PORT)
console.log('AUTH_JWT_SECRET existe:', Boolean(process.env.AUTH_JWT_SECRET))
console.log('AUTH_JWT_SECRET longitud:', process.env.AUTH_JWT_SECRET?.length ?? 0)
console.log('==========================================')

const port = Number(process.env.PORT ?? 3000)

app.listen(port, () => {
  console.log(`API SIGO-Dental escuchando en http://localhost:${port}`)
})