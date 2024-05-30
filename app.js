const express = require('express')
const movies = require('./movies.json')
const crypto = require('node:crypto') /// libreria para valores al azar con plantilla

const { validateMovie } = require('./schemas/movies')
const { validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.disable('x-powered-by')

// metodos normales GET POST HEAD

// METODOS COMPLEJOS  DELETE/PUT/PATCH
// CORS  PRE-FLIGht
// REQUIEREN UNA flag OPTIONS
/// const con los distintos origenes que pouede tener la peticion
const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://movies.com'
]

// todos los recursos que sean movies se identifican con /movies
app.get('/movies', (req, res) => {
  // cabecera de la peticion para que no sea reqchazda en el servidor CORD
  // res.header('Access-Control-Allow-Origin', '*')
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    // cuandio la peticion viene desde el mismo lugar de origen no envia la cabecera ORIGIN
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { genre } = req.query // desestructurando genre del json movies
  if (genre) {
    const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLocaleLowerCase() === genre.toLocaleLowerCase()))
    return res.json(filteredMovies)
  }
  res.json(movies)
})

// patch regets
app.get('/movies/:id', (req, res) => {
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  /// validacion correcta con libreria ZOE
  const result = validateMovie(req.body)
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // validacion de datos mal implementada o no potimizDA
  // if (!title || !genre || etc, etc)
  // return res.status(400).json({message:'se perdio un campo'})

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  /// esto no es resT porque guardamos en memoria y no en db
  movies.push(newMovie)
  res.status(201).json(newMovie)
})

/// para borrar de la coleccion
app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    // cuandio la peticion viene desde el mismo lugar de origen no envia la cabecera ORIGIN
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)
  return res.json({ message: 'Movie deleted' })
})

/// ///modificacion con patch
app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie
  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  // cabecera de la peticion para que no sea reqchazda en el servidor CORD
  // res.header('Access-Control-Allow-Origin', '*')
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    // cuandio la peticion viene desde el mismo lugar de origen no envia la cabecera ORIGIN
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'DELETE,GET,POST,PATCH,PUT')
  }
  res.send(200)
})

/// puerto de salida
const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`servidor escuchando en puerto http://localhost:${PORT}`)
})
