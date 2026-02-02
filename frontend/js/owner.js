const ownerId = localStorage.getItem("ownerId")

if (!ownerId) {
  alert("Please login first")
  window.location.href = "/login.html"
}

const pgList = document.getElementById("pgList")
const pgForm = document.getElementById("pgForm")
const editModal = document.getElementById("editModal")

/* Edit modal inputs */
const eName = document.getElementById("eName")
const eLocation = document.getElementById("eLocation")
const eRent = document.getElementById("eRent")
const eWhatsapp = document.getElementById("eWhatsapp")
const eMap = document.getElementById("eMap")
const eStatus = document.getElementById("eStatus")


let ownerPGs = []          
let editingPGId = null    



function loadPGs() {
  fetch("/api/pgs")
    .then(res => res.json())
    .then(data => {
      ownerPGs = data.filter(pg => pg.ownerId === ownerId)
      renderPGs(ownerPGs)
    })
    .catch(err => {
      console.error("Failed to load PGs:", err)
    })
}



function renderPGs(pgs) {
  pgList.innerHTML = ""

  if (pgs.length === 0) {
    pgList.innerHTML = "<p>No PGs added yet.</p>"
    return
  }

  pgs.forEach(pg => {
    const card = document.createElement("div")
    card.className = "owner-pg-card"

    card.innerHTML = `
      <h3>${pg.name}</h3>
      <p><b>Location:</b> ${pg.location}</p>
      <p><b>Rent:</b> ₹${pg.rent}</p>
      <p><b>Status:</b> ${pg.status}</p>
      <p><b>WhatsApp:</b> ${pg.whatsapp}</p>

      <div class="facility-list">
        ${(pg.facilities || [])
          .map(f => `<span class="facility">${f}</span>`)
          .join("")}
      </div>

      <div class="owner-actions">
        <button type="button" onclick="openEdit('${pg.id}')">Edit</button>
        <button type="button" onclick="deletePG('${pg.id}')">Delete</button>
      </div>
    `

    pgList.appendChild(card)
  })
}



pgForm.addEventListener("submit", e => {
  e.preventDefault()

  const name = document.getElementById("name").value.trim()
  const location = document.getElementById("location").value.trim()
  const rent = document.getElementById("rent").value
  const whatsapp = document.getElementById("whatsapp").value.trim()
  const map = document.getElementById("map").value.trim()
  const status = document.getElementById("status").value

  const facilities = Array.from(
    document.querySelectorAll(".facility-grid input:checked")
  ).map(cb => cb.value)

  if (!name || !location || !rent || whatsapp.length !== 10) {
    alert("Please enter valid PG details")
    return
  }

  fetch("/api/pg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerId,
      name,
      location,
      rent,
      whatsapp,
      map,
      status,
      facilities
    })
  })
    .then(res => res.json())
    .then(() => {
      pgForm.reset()
      loadPGs()
    })
    .catch(err => {
      console.error("Failed to add PG:", err)
    })
})



function openEdit(pgId) {
  const pg = ownerPGs.find(p => p.id === pgId)
  if (!pg) return

  editingPGId = pg.id
  editModal.style.display = "flex"

  eName.value = pg.name
  eLocation.value = pg.location
  eRent.value = pg.rent
  eWhatsapp.value = pg.whatsapp
  eMap.value = pg.map || ""
  eStatus.value = pg.status

  document
    .querySelectorAll("#editModal input[type=checkbox]")
    .forEach(cb => {
      cb.checked = (pg.facilities || []).includes(cb.value)
    })
}



function closeEdit() {
  editModal.style.display = "none"
  editingPGId = null
}


function saveEdit() {
  if (!editingPGId) return

  const name = eName.value.trim()
  const location = eLocation.value.trim()
  const rent = eRent.value
  const whatsapp = eWhatsapp.value.trim()
  const map = eMap.value.trim()
  const status = eStatus.value

  const facilities = Array.from(
    document.querySelectorAll("#editModal input[type=checkbox]:checked")
  ).map(cb => cb.value)

  if (!name || !location || !rent || whatsapp.length !== 10) {
    alert("Invalid update data")
    return
  }

  fetch("/api/pg/" + editingPGId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerId,
      name,
      location,
      rent,
      whatsapp,
      map,
      status,
      facilities
    })
  })
    .then(res => res.json())
    .then(() => {
      closeEdit()
      loadPGs()
    })
    .catch(err => {
      console.error("Failed to update PG:", err)
    })
}



function deletePG(pgId) {
  if (!confirm("Are you sure you want to delete this PG?")) return

  fetch("/api/pg/" + pgId, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      loadPGs()
    })
    .catch(err => {
      console.error("Failed to delete PG:", err)
    })
}


function logout() {
  localStorage.clear()
  window.location.href = "/"
}


loadPGs()
