// admin-frontend.js
// Handles frontend (admin)account logic for FaielyCreations

/* ---------- MODE SWITCHING ---------- */

function hideModes() {
  document.querySelectorAll(".mode-section").forEach(sec =>
    sec.classList.remove("active")
  );
}

function showLogin() {
  hideModes();
  document.getElementById("admin-login").classList.add("active");
}

function showDashboard() {
  hideModes();
  document.getElementById("admin-dashboard").classList.add("active");
  document.querySelector(".admin-tab-btn[data-tab='overview']").click();
}

/* ---------- LOGIN ---------- */

async function adminLogin() {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  const res = await fetch(`${window.API}/api/login`, { 
    // admin login is handled by auth-backend
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  const data = await res.json();

  if (data.role === "admin") {
    showDashboard();
    loadOverview();
    loadCustomers();
    loadOrders();
    loadAnalytics();
    loadAdmins();
    loadSystemHealth();
  } else {
    document.getElementById("admin-login-error").textContent = "Invalid admin credentials";
  }
}

async function adminLogout() {
  await fetch(`${window.API}/api/logout`, {
      credentials: "include"});
  showLogin();
}

async function checkAdmin() {
  const res = await fetch(`${window.API}/api/admin/summary`, {
      credentials: "include"});
  if (res.status === 401) {
    document.body.classList.remove("hidden");
    showLogin();
    return;
  }

  document.body.classList.remove("hidden");
  showDashboard();
  loadOverview();
  loadCustomers();
  loadOrders();
  loadAnalytics();
  loadAdmins();
}

async function createAdmin() {
  const email = document.getElementById("new-admin-email").value.trim();
  const password = document.getElementById("new-admin-password").value.trim();
  const displayName = document.getElementById("new-admin-name").value.trim();
  const errorBox = document.getElementById("admin-create-error");
  const successBox = document.getElementById("admin-create-success");

  errorBox.textContent = "";
  successBox.textContent = "";

  // Basic validation
  if (!email || !password || !displayName) {
    errorBox.textContent = "All fields are required.";
    return;
  }

  try {
    const res = await fetch(`${window.API}/api/admin/create-admin`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      errorBox.textContent = data.error || "Failed to create admin.";
      return;
    }

    // Success
    successBox.textContent = "Admin created successfully.";

    // Clear fields
    document.getElementById("new-admin-email").value = "";
    document.getElementById("new-admin-password").value = "";
    document.getElementById("new-admin-name").value = "";

  } catch (err) {
    errorBox.textContent = "Network error — backend unreachable.";
  }
}

/* ---------- PASSWORD TOGGLE ---------- */

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

/* ---------- OVERVIEW ---------- */

async function loadOverview() {
  const res = await fetch(`${window.API}/api/admin/summary`, {
      credentials: "include"});
  const data = await res.json();

  document.getElementById("ov-customers").textContent = data.userCount;
  document.getElementById("ov-orders").textContent = data.orderCount;
  document.getElementById("ov-products").textContent = data.productCount;

  const rev = await fetch(`${window.API}/api/admin/analytics/summary`, { credentials: "include"}).then(r => r.json());
  document.getElementById("ov-revenue").textContent = "$" + rev.totalRevenue;
}

async function loadCustomers() {
  const res = await fetch(`${window.API}/api/admin/get-users`, { credentials: "include"});
  const customers = await res.json();

  const list = document.getElementById("customer-list");
  list.innerHTML = "";

  customers.forEach(c => {
    list.innerHTML += `
      <div class="card">
        <h3>${c.email}</h3>
        <p>Joined: ${new Date(c.createdAt).toLocaleDateString()}</p>
        <button onclick="viewCustomerOrders('${c.email}')">View Orders</button>
      </div>
    `;
  });
}

async function loadAdmins() {
  const res = await fetch(`${window.API}/api/admin/get-users`, { credentials: "include"});
  const admins = await res.json();

  const list = document.getElementById("admin-list");
  list.innerHTML = "";

  admins.filter(a => a.role === "admin").forEach(a => {
    list.innerHTML += `
      <div class="card">
        <h3>${a.email}</h3>
        <p>Role: ${a.role}</p>
      </div>
    `;
  });
}
async function loadSystemHealth() {
  const res = await fetch(`${window.API}/api/admin/system/health`, {
      credentials: "include"
    });
  const data = await res.json();

  document.getElementById("health-mongo").textContent = data.mongoStatus;
  document.getElementById("health-orders").textContent = data.orderCount;
  document.getElementById("health-revenue").textContent = "$" + data.totalRevenue;
}

/* ---------- START UP ---------- */
checkAdmin();

const tabs = document.querySelectorAll(".admin-tab-btn");
const sections = document.querySelectorAll(".admin-tab-section");

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
