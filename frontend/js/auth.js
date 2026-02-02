

const loginForm = document.getElementById("loginForm")
const errorMsg = document.getElementById("errorMsg")

if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault()

    errorMsg.textContent = ""

    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value.trim()

    if (!email || !password) {
      errorMsg.textContent = "All fields required"
      return
    }

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        localStorage.setItem("ownerId", data.ownerId)
        location.href = "/owner.html"
      })
      .catch(() => {
        errorMsg.textContent = "Invalid email or password"
      })
  })
}



const registerForm = document.getElementById("registerForm")
const regError = document.getElementById("regError")

if (registerForm) {
  registerForm.addEventListener("submit", e => {
    e.preventDefault()

    regError.textContent = ""

    const email = document.getElementById("regEmail").value.trim()
    const password = document.getElementById("regPassword").value.trim()

    if (!email || !password) {
      regError.textContent = "All fields required"
      return
    }

    if (password.length < 6) {
      regError.textContent = "Password must be at least 6 characters"
      return
    }

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => {
        if (res.status === 409) {
          throw new Error("exists")
        }
        if (!res.ok) {
          throw new Error("failed")
        }
        return res.json()
      })
      .then(() => {
        alert("Registration successful. Please login.")
        location.href = "/login.html"
      })
      .catch(err => {
        if (err.message === "exists") {
          regError.textContent = "Owner already exists"
        } else {
          regError.textContent = "Registration failed"
        }
      })
  })
}
