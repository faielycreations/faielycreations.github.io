// account-frontend.js
// Handles frontend (customer)account logic for FaielyCreations

/* ---------- MODE SWITCHING ---------- */

function hideAllModes() {
  document.querySelectorAll(".mode-section").forEach(sec =>
    sec.classList.remove("active")
  );
}

function showLoginMode() {
  hideAllModes();
  document.getElementById("login-section").classList.add("active");
}

function showCreateMode() {
  hideAllModes();
  document.getElementById("create-section").classList.add("active");
}

function showForgotMode() {
  hideAllModes();
  document.getElementById("forgot-section").classList.add("active");
}

function showResetMode() {
  hideAllModes();
  document.getElementById("reset-section").classList.add("active");
}

function showVerifyMode() {
  hideAllModes();
  document.getElementById("verify-section").classList.add("active");
}

function showAccountMode() {
  hideAllModes();
  document.getElementById("account-section").classList.add("active");
  document.querySelector(".tab-btn[data-tab='profile']").click();
}
/* ---------- LOGIN / LOGOUT ---------- */
async function checkLogin() {
  try {
    const params = new URLSearchParams(location.search);

    // If resetToken present, go straight to reset mode
    if (params.get("resetToken")) {
      document.body.classList.remove("hidden");
      showResetMode();
      return;
    }

    const res = await fetch(`${window.API}/api/auth/check`, 
      {
        credentials: "include"
      });
    const data = await res.json();

    document.body.classList.remove("hidden");

    if (data.loggedIn) {
      showAccountMode();
      loadAccountData();
    } else {
      showLoginMode();
    }
  } catch (err) {
    console.error("Login check failed:", err);
    document.body.classList.remove("hidden");
    showLoginMode();
  }
}

async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${window.API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  const data = await res.json();

  if (data.success) {
    showAccountMode();
    loadAccountData();
  } else {
    document.getElementById("login-error").textContent = data.error || "Login failed";
  }
}

async function logout() {
  await fetch(`${window.API}/api/auth/logout`, { credentials: "include" });
  showLoginMode();
}

/* ---------- PASSWORD TOGGLE/STRENGTH ---------- */
function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

function updateStrength(inputId, barId) {
  const input = document.getElementById(inputId);
  const bar = document.getElementById(barId);
  if (!input || !bar) return;

  const val = input.value || "";
  let score = 0;

  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  let width = 0;
  let color = "#ff6b6b";

  if (score === 1) { width = 25; color = "#ff6b6b"; }
  if (score === 2) { width = 50; color = "#f7b731"; }
  if (score === 3) { width = 75; color = "#4cd137"; }
  if (score >= 4) { width = 100; color = "#00a8ff"; }

  bar.style.setProperty("--strength-width", width + "%");
  bar.style.setProperty("--strength-color", color);
  bar.querySelector("::after"); // just to ensure style applied
  bar.style.setProperty("background", "#333");
  bar.style.setProperty("position", "relative");
  bar.style.setProperty("overflow", "hidden");
  bar.style.setProperty("border-radius", "999px");
  bar.style.setProperty("height", "6px");
  bar.style.setProperty("width", "100%");
  bar.style.setProperty("display", "block");
  bar.style.setProperty("transition", "width 0.2s ease");
  bar.style.setProperty("box-sizing", "border-box");
  bar.style.setProperty("background", "#333");
  bar.style.setProperty("backgroundImage", `linear-gradient(to right, ${color} ${width}%, transparent ${width}%)`);
}

/* ---------- CREATE ACCOUNT ---------- */

async function createAccount() {
  const email = document.getElementById("create-email").value;
  const password = document.getElementById("create-password").value;
  const displayName = document.getElementById("create-display").value;

  const res = await fetch(`${window.API}/api/auth/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
    credentials: "include"
  });

  const data = await res.json();

  if (data.success) {
    // Show welcome overlay
    document.getElementById("welcome-overlay").classList.add("active");
  } else {
    document.getElementById("create-error").textContent = data.error || "Unable to create account.";
  }
}

function closeWelcome() {
  document.getElementById("welcome-overlay").classList.remove("active");
  showLoginMode();
}

/* ---------- FORGOT / RESET / VERIFY ---------- */

async function sendResetEmail() {
  const email = document.getElementById("forgot-email").value;

  const res = await fetch(`${window.API}/api/auth/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include"
  });

  const data = await res.json();
  alert(data.message || "If that email exists, a reset link has been sent.");
}

async function resetPassword() {
  const params = new URLSearchParams(location.search);
  const token = params.get("resetToken");
  const password = document.getElementById("reset-password").value;

  const res = await fetch(`${window.API}/api/auth/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
    credentials: "include"
  });

  const data = await res.json();
  alert(data.message || "Password reset.");

  showLoginMode();
}

async function sendVerificationEmail() {
  const email = document.getElementById("verify-email").value;

  const res = await fetch(`${window.API}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include"
  });

  const data = await res.json();
  alert(data.message || "Verification email sent.");
}

/* ---------- DELETE ---------- */
async function deleteAccount() {
  if (!confirm("Are you sure you want to delete your account?")) return;

  await fetch(`${window.API}/api/auth/delete-account`, { 
    method: "POST", 
    credentials: "include" 
  });
  alert("Account deleted.");
  showLoginMode();
}

/* ---------- LOAD/SAVE ACCOUNT DATA ---------- */

async function loadAccountData() {
  loadProfile();
  loadAddresses();
  loadMeasurements();
}

async function loadProfile() {
  const res = await fetch(`${window.API}/api/get-profile`, { credentials: "include"});
  const data = await res.json();

  document.getElementById("profile-email").value = data.email || "";
  document.getElementById("profile-display").value = data.displayName || "";
}

async function saveProfile() {
  const displayName = document.getElementById("profile-display").value;

  await fetch(`${window.API}/api/save-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
    credentials: "include"
  });

  alert("Profile saved.");
}

async function loadAddresses() {
  const res = await fetch(`${window.API}/api/my-account`, {credentials: "include"});
  const data = await res.json();

  const list = document.getElementById("address-list");
  list.innerHTML = "";

  (data.addresses || []).forEach((addr, i) => {
    list.innerHTML += `
      <div class="address-card">
        <p>${addr.name}</p>
        <p>${addr.street}</p>
        <p>${addr.city}, ${addr.state} ${addr.zip}</p>
        <button onclick="deleteAddress(${i})">Delete</button>
      </div>
    `;
  });
}

async function addAddress() {
  const name = prompt("Name:");
  const street = prompt("Street:");
  const city = prompt("City:");
  const state = prompt("State:");
  const zip = prompt("ZIP:");

  await fetch(`${window.API}/api/add-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, street, city, state, zip }),
    credentials: "include"
  });

  loadAddresses();
}

async function deleteAddress(index) {
  await fetch(`${window.API}/api/delete-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
    credentials: "include"
  });

  loadAddresses();
}

async function loadMeasurements() {
  const res = await fetch(`${window.API}/api/get-profile`, { credentials: "include"});
  const data = await res.json();
  const m = data.measurements || {};

  document.getElementById("m-bust").value = m.bust || "";
  document.getElementById("m-waist").value = m.waist || "";
  document.getElementById("m-hip").value = m.hip || "";
  document.getElementById("m-torso").value = m.torso || "";
}

async function saveMeasurements() {
  const bust = document.getElementById("m-bust").value;
  const waist = document.getElementById("m-waist").value;
  const hip = document.getElementById("m-hip").value;
  const torso = document.getElementById("m-torso").value;

  await fetch(`${window.API}/api/save-measurements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bust, waist, hip, torso }),
    credentials: "include"
  });

  alert("Measurements saved.");
}

/* ---------- START UP ---------- */
checkLogin();

const tabs = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".tab-section");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;

    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    sections.forEach(sec => {
      sec.classList.remove("active");
      if (sec.id === "tab-" + target) sec.classList.add("active");
    });
  });
});

