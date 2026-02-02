
const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 7090
const DB_PATH = path.join(__dirname, "db.json")


app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "../frontend")))


function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      owners: [],
      pgs: []
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2))
  }
}


function readDB() {
  initDB()
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"))
}


function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}



function generateId() {
  return Date.now().toString()
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(phone)
}


function sendError(res, code, message) {
  return res.status(code).json({ success: false, message })
}


app.post("/api/register", (req, res) => {
  const { email, password } = req.body

  if (!email || !password || password.length < 6) {
    return sendError(res, 400, "Invalid registration data")
  }

  const db = readDB()

  if (db.owners.find(o => o.email === email)) {
    return sendError(res, 409, "Owner already exists")
  }

  const owner = {
    id: generateId(),
    email,
    password,
    createdAt: new Date().toISOString()
  }

  db.owners.push(owner)
  writeDB(db)

  res.json({ success: true })
})

app.post("/api/login", (req, res) => {
  const { email, password } = req.body
  const db = readDB()

  const owner = db.owners.find(
    o => o.email === email && o.password === password
  )

  if (!owner) {
    return sendError(res, 401, "Invalid credentials")
  }

  res.json({
    success: true,
    ownerId: owner.id
  })
})


app.get("/api/pgs", (req, res) => {
  const db = readDB()

  const normalizedPGs = db.pgs.map(pg => ({
    ...pg,
    status: pg.status || "Available",
    facilities: pg.facilities || []
  }))

  res.json(normalizedPGs)
})


app.post("/api/pg", (req, res) => {
  const {
    name,
    location,
    rent,
    whatsapp,
    map,
    status,
    facilities,
    ownerId
  } = req.body

  if (
    !name ||
    !location ||
    !rent ||
    !ownerId ||
    !isValidPhone(whatsapp)
  ) {
    return sendError(res, 400, "Invalid PG data")
  }

  const db = readDB()

  const newPG = {
    id: generateId(),
    name,
    location,
    rent: Number(rent),
    whatsapp,
    map: map || "",
    status: status || "Available",
    facilities: Array.isArray(facilities) ? facilities : [],
    ownerId,
    createdAt: new Date().toISOString()
  }

  db.pgs.push(newPG)
  writeDB(db)

  res.json({ success: true })
})

app.put("/api/pg/:id", (req, res) => {
  const pgId = req.params.id
  const {
    ownerId,
    name,
    location,
    rent,
    whatsapp,
    map,
    status,
    facilities
  } = req.body

  const db = readDB()
  const pg = db.pgs.find(p => p.id === pgId)

  if (!pg) {
    return sendError(res, 404, "PG not found")
  }

  if (pg.ownerId !== ownerId) {
    return sendError(res, 403, "Unauthorized access")
  }

  if (!name || !location || !rent || !isValidPhone(whatsapp)) {
    return sendError(res, 400, "Invalid update data")
  }

  pg.name = name
  pg.location = location
  pg.rent = Number(rent)
  pg.whatsapp = whatsapp
  pg.map = map || ""
  pg.status = status
  pg.facilities = Array.isArray(facilities) ? facilities : []
  pg.updatedAt = new Date().toISOString()

  writeDB(db)
  res.json({ success: true })
})


 
app.delete("/api/pg/:id", (req, res) => {
  const db = readDB()
  const before = db.pgs.length

  db.pgs = db.pgs.filter(pg => pg.id !== req.params.id)

  if (db.pgs.length === before) {
    return sendError(res, 404, "PG not found")
  }

  writeDB(db)
  res.json({ success: true })
})



app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/home.html"))
)

app.get("/home", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/home.html"))
)

app.get("/tenant", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/tenant.html"))
)

app.get("/login.html", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/login.html"))
)

app.get("/register.html", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/register.html"))
)

app.get("/owner.html", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/owner.html"))
)


app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/home.html"))
)


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
