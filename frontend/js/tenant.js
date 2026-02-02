

let allPGs = []
let selectedFacilities = []
let activePG = null

/* ================= DOM ================= */

const pgsContainer = document.getElementById("pgs")
const searchInput = document.getElementById("search")
const maxRentInput = document.getElementById("maxRent")
const strictBudget = document.getElementById("strictBudget")
const resultCount = document.getElementById("resultCount")


const facilityIcons = {
  "wifi": "📶",
  "food": "🍽",
  "ac": "❄",
  "laundry": "🧺",
  "parking": "🚗",
  "power backup": "🔋",
  "cctv": "📷",
  "lift": "🛗",
  "housekeeping": "🧹"
}



fetch("/api/pgs")
  .then(res => res.json())
  .then(data => {
    allPGs = data.map(pg => ({
      ...pg,
      status: pg.status || "Available",
      facilities: (pg.facilities || []).map(f => f.toLowerCase().trim()),
      score: calculateScore(pg)
    }))
    applyFilters()
  })



function calculateScore(pg) {
  let score = 5
  score += Math.min((pg.facilities || []).length * 0.4, 3)
  if (pg.status === "Available") score += 0.5
  if (pg.status === "Full") score -= 1
  return Number(Math.max(0, Math.min(10, score)).toFixed(1))
}



document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const value = chip.dataset.facility.toLowerCase().trim()

    if (selectedFacilities.includes(value)) {
      selectedFacilities = selectedFacilities.filter(f => f !== value)
      chip.classList.remove("active")
    } else {
      selectedFacilities.push(value)
      chip.classList.add("active")
    }

    applyFilters()
  })
})



function applyFilters() {
  const locationQuery = searchInput.value.toLowerCase()
  const maxBudget = maxRentInput.value ? Number(maxRentInput.value) : null

  const filtered = allPGs.filter(pg => {

    if (!pg.location.toLowerCase().includes(locationQuery)) return false

    if (
      selectedFacilities.length > 0 &&
      !selectedFacilities.every(f => pg.facilities.includes(f))
    ) return false

    if (strictBudget.checked && maxBudget && pg.rent > maxBudget) return false

    return true
  })

  renderPGs(filtered, maxBudget)
}



function renderPGs(list, maxBudget) {
  pgsContainer.innerHTML = ""
  resultCount.textContent = list.length + " PGs found"

  if (list.length === 0) {
    pgsContainer.innerHTML = `<p>No PGs match your filters.</p>`
    return
  }

  list.forEach(pg => {
    const overBudget = maxBudget && pg.rent > maxBudget

    const statusClass =
      pg.status === "Available"
        ? "status-available"
        : pg.status === "Limited"
        ? "status-limited"
        : "status-full"

    const recommended =
      pg.score >= 8 &&
      pg.status === "Available" &&
      pg.facilities.length >= 4

    const card = document.createElement("div")
    card.className = "pg-card" + (overBudget ? " over-budget" : "")

    card.innerHTML = `
      <div class="pg-header">
        <h3>${pg.name}</h3>
        <span class="rent">₹${pg.rent}</span>
      </div>

      <p class="location">${pg.location}</p>

      <div class="status-badge ${statusClass}">${pg.status}</div>
      <div class="score-badge">Score ${pg.score}</div>

      ${recommended ? `<div class="recommend-badge">⭐ Recommended</div>` : ""}

      <div class="facility-list">
        ${pg.facilities.map(f =>
          `<span class="facility">${facilityIcons[f]} ${capitalize(f)}</span>`
        ).join("")}
      </div>

      ${overBudget ? `<div class="budget-tag">Above your budget</div>` : ""}

      <div class="pg-actions">
        <button class="wa-btn">Enquire</button>
      </div>
    `

    card.querySelector(".wa-btn").onclick = () => openModal(pg)
    pgsContainer.appendChild(card)
  })
}


function openModal(pg) {
  activePG = pg
  document.getElementById("enquiryModal").style.display = "flex"
}

function closeModal() {
  document.getElementById("enquiryModal").style.display = "none"
}

function sendWhatsApp() {
  const name = tName.value.trim()
  const mobile = tMobile.value.trim()
  const guardian = tGuardian.value.trim()
  const guardianMobile = tGuardianMobile.value.trim()
  const institute = tInstitute.value.trim()

  if (!name || !mobile || !guardian || !guardianMobile || !institute) {
    alert("Please fill all fields")
    return
  }

  const message = encodeURIComponent(
`Hello,
I am interested in ${activePG.name}

Name: ${name}
Mobile: ${mobile}
Guardian Name: ${guardian}
Guardian Contact: ${guardianMobile}
Institute: ${institute}`
  )

  window.open(
    `https://wa.me/91${activePG.whatsapp}?text=${message}`,
    "_blank"
  )

  closeModal()
}


function capitalize(str) {
  return str
    .split(" ")
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}


searchInput.oninput = applyFilters
maxRentInput.oninput = applyFilters
strictBudget.onchange = applyFilters
