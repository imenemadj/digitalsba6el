const API = "/api";
const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Admin@2026";

let selectedFix = "";
let submissions = [];
let currentFilter = "all";
let currentFixFilter = "all";

const AR = {
  needData: "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643.",
  needFix: "\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u062d\u062f \u0627\u0644\u062d\u0644\u0648\u0644.",
  sendError: "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0625\u0631\u0633\u0627\u0644. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.",
  badLogin: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.",
  done: "\u0645\u0643\u062a\u0645\u0644",
  undone: "\u063a\u064a\u0631 \u0645\u0643\u062a\u0645\u0644",
  markDone: "\u062a\u062d\u062f\u064a\u062f \u0643\u0645\u0643\u062a\u0645\u0644",
  completed: "\u062a\u0645 \u0627\u0644\u0625\u0646\u062c\u0627\u0632"
};

function showForm() {
  document.getElementById("noticeCard").classList.add("hidden");
  document.getElementById("formCard").classList.remove("hidden");
}

function selectFix(button, fix) {
  selectedFix = fix;
  document.querySelectorAll(".option").forEach(function(btn) {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");
}

async function submitRequest(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const subscriptionNumber = document.getElementById("subscriptionNumber").value.trim();
  const error = document.getElementById("error");

  error.textContent = "";

  if (!email && !subscriptionNumber) {
    error.textContent = AR.needData;
    return;
  }

  if (!selectedFix) {
    error.textContent = AR.needFix;
    return;
  }

  try {
    const res = await fetch(API + "/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subscriptionNumber, selectedFix })
    });

    if (!res.ok) throw new Error("bad response");

    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("successCard").classList.remove("hidden");
  } catch (e) {
    error.textContent = AR.sendError;
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
    error.textContent = AR.badLogin;
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "/admin/login";
}

async function loadSubmissions() {
  const res = await fetch(API + "/submissions");
  submissions = await res.json();
  renderSubmissions();
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".status-filter").forEach(function(btn) {
    btn.classList.remove("active");
  });

  const btn = document.getElementById("filter-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

function setFixFilter(filter) {
  currentFixFilter = filter;

  document.querySelectorAll(".fix-filter").forEach(function(btn) {
    btn.classList.remove("active");
  });

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

  const filtered = submissions.filter(function(item) {
    const email = (item.email || "").toLowerCase();
    const subscription = (item.subscriptionNumber || "").toLowerCase();
    const fixText = (item.selectedFix || "").toLowerCase();

    const matchesSearch = email.includes(q) || subscription.includes(q);
    const matchesStatus = currentFilter === "all" || item.status === currentFilter;
    const matchesFix = currentFixFilter === "all" || fixText.includes(currentFixFilter);

    return matchesSearch && matchesStatus && matchesFix;
  });

  tableBody.innerHTML = "";
  mobileCards.innerHTML = "";

  filtered.forEach(function(item) {
    const statusClass = item.status === "done" ? "done" : "undone";
    const statusText = item.status === "done" ? AR.done : AR.undone;
    const created = new Date(item.createdAt).toLocaleString();

    const actionHtml = item.status === "undone"
      ? '<button class="done-btn" onclick="markDone(\'' + item.id + '\')">' + AR.markDone + '</button>'
      : '<span class="completed-text">' + AR.completed + '</span>';

    tableBody.innerHTML +=
      "<tr><td>" + (item.email || "-") + "</td><td>" +
      (item.subscriptionNumber || "-") + "</td><td>" +
      item.selectedFix + '</td><td><span class="status ' +
      statusClass + '">' + statusText + "</span></td><td>" +
      created + "</td><td>" + actionHtml + "</td></tr>";

    const mobileAction = item.status === "undone"
      ? '<button class="done-btn full" onclick="markDone(\'' + item.id + '\')">' + AR.markDone + '</button>'
      : '<button class="completed-btn full">' + AR.done + '</button>';

    mobileCards.innerHTML +=
      '<div class="submission-card"><div class="card-top"><span class="status ' +
      statusClass + '">' + statusText + "</span><span>" + created +
      "</span></div><p><strong>Email:</strong> " + (item.email || "-") +
      "</p><p><strong>Subscription:</strong> " + (item.subscriptionNumber || "-") +
      "</p><p><strong>Fix:</strong> " + item.selectedFix +
      "</p>" + mobileAction + "</div>";
  });

  emptyText.classList.toggle("hidden", filtered.length !== 0);
}

async function markDone(id) {
  await fetch(API + "/submissions/" + id + "/done", { method: "PATCH" });
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

