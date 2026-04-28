const SUPABASE_URL = "https://vbkhiecpopyjkcraykcr.supabase.co";
const SUPABASE_KEY = "sb_publishable_E-BQWEsInw0-zcJylvgCMg_mA0m1ZlA";
const API = SUPABASE_URL + "/rest/v1/submissions";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Admin@2026";

let selectedFix = "";
let submissions = [];
let currentFilter = "all";
let currentFixFilter = "all";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json"
};

function showForm() {
  document.getElementById("noticeCard").classList.add("hidden");
  document.getElementById("formCard").classList.remove("hidden");
}

function selectFix(button, fix) {
  selectedFix = fix;
  document.querySelectorAll(".option").forEach(btn => btn.classList.remove("selected"));
  button.classList.add("selected");
}

async function submitRequest(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const subscriptionNumber = document.getElementById("subscriptionNumber").value.trim();
  const error = document.getElementById("error");

  error.textContent = "";

  if (!email && !subscriptionNumber) {
    error.textContent = "???? ????? ?????? ?????????? ?? ??? ????????.";
    return;
  }

  if (!selectedFix) {
    error.textContent = "???? ?????? ??? ??????.";
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: email,
        subscription_number: subscriptionNumber,
        selected_fix: selectedFix,
        status: "undone"
      })
    });

    if (!res.ok) throw new Error();

    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("successCard").classList.remove("hidden");
  } catch {
    error.textContent = "??? ??? ????? ???????. ???? ???????? ??? ????.";
  }
}

function loginAdmin(event) {
  event.preventDefault();

  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;
  const error = document.getElementById("loginError");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem("adminLoggedIn", "yes");
    window.location.href = "/admin";
  } else {
    error.textContent = "??? ???????? ?? ???? ?????? ??? ?????.";
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "/admin/login";
}

async function loadSubmissions() {
  const res = await fetch(API + "?select=*&order=created_at.desc", {
    method: "GET",
    headers
  });

  submissions = await res.json();
  renderSubmissions();
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".status-filter").forEach(btn => btn.classList.remove("active"));
  const btn = document.getElementById("filter-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

function setFixFilter(filter) {
  currentFixFilter = filter;

  document.querySelectorAll(".fix-filter").forEach(btn => btn.classList.remove("active"));
  const btn = document.getElementById("fix-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

function renderSubmissions() {
  const q = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const tableBody = document.getElementById("tableBody");
  const mobileCards = document.getElementById("mobileCards");
  const emptyText = document.getElementById("emptyText");

  if (!tableBody || !mobileCards) return;

  const filtered = submissions.filter(item => {
    const email = (item.email || "").toLowerCase();
    const subscription = (item.subscription_number || "").toLowerCase();
    const fixText = (item.selected_fix || "").toLowerCase();

    return (
      (email.includes(q) || subscription.includes(q)) &&
      (currentFilter === "all" || item.status === currentFilter) &&
      (currentFixFilter === "all" || fixText.includes(currentFixFilter))
    );
  });

  tableBody.innerHTML = "";
  mobileCards.innerHTML = "";

  filtered.forEach(item => {
    const statusClass = item.status === "done" ? "done" : "undone";
    const statusText = item.status === "done" ? "?????" : "??? ?????";
    const created = new Date(item.created_at).toLocaleString();

    const actionHtml = item.status === "undone"
      ? '<button class="done-btn" onclick="markDone(\'' + item.id + '\')">????? ?????</button>'
      : '<span class="completed-text">?? ???????</span>';

    tableBody.innerHTML +=
      "<tr><td>" + (item.email || "-") + "</td><td>" +
      (item.subscription_number || "-") + "</td><td>" +
      item.selected_fix + '</td><td><span class="status ' +
      statusClass + '">' + statusText + "</span></td><td>" +
      created + "</td><td>" + actionHtml + "</td></tr>";

    const mobileAction = item.status === "undone"
      ? '<button class="done-btn full" onclick="markDone(\'' + item.id + '\')">????? ?????</button>'
      : '<button class="completed-btn full">?????</button>';

    mobileCards.innerHTML +=
      '<div class="submission-card"><div class="card-top"><span class="status ' +
      statusClass + '">' + statusText + "</span><span>" + created +
      "</span></div><p><strong>Email:</strong> " + (item.email || "-") +
      "</p><p><strong>Subscription:</strong> " + (item.subscription_number || "-") +
      "</p><p><strong>Fix:</strong> " + item.selected_fix +
      "</p>" + mobileAction + "</div>";
  });

  emptyText.classList.toggle("hidden", filtered.length !== 0);
}

async function markDone(id) {
  await fetch(API + "?id=eq." + id, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "done" })
  });

  await loadSubmissions();
}

function router() {
  const path = window.location.pathname;

  document.getElementById("clientPage").classList.add("hidden");
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("adminPage").classList.add("hidden");

  if (path === "/admin/login") {
    document.getElementById("loginPage").classList.remove("hidden");
    return;
  }

  if (path === "/admin") {
    if (localStorage.getItem("adminLoggedIn") !== "yes") {
      window.location.href = "/admin/login";
      return;
    }

    document.getElementById("adminPage").classList.remove("hidden");
    loadSubmissions();
    return;
  }

  document.getElementById("clientPage").classList.remove("hidden");
}

router();
