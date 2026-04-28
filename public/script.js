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
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json"
};

const TXT = {
  needData: "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643.",
  needFix: "\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u062d\u062f \u0627\u0644\u062d\u0644\u0648\u0644.",
  sendError: "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0625\u0631\u0633\u0627\u0644. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.",
  badLogin: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.",
  done: "\u0645\u0643\u062a\u0645\u0644",
  undone: "\u063a\u064a\u0631 \u0645\u0643\u062a\u0645\u0644",
  markDone: "\u062a\u062d\u062f\u064a\u062f \u0645\u0643\u062a\u0645\u0644",
  completed: "\u062a\u0645 \u0627\u0644\u0625\u0646\u062c\u0627\u0632"
};

window.showForm = function () {
  document.getElementById("noticeCard").classList.add("hidden");
  document.getElementById("formCard").classList.remove("hidden");
};

window.selectFix = function (button, fix) {
  selectedFix = fix;
  document.querySelectorAll(".option").forEach(function (btn) {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");
};

window.submitRequest = async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const subscriptionNumber = document.getElementById("subscriptionNumber").value.trim();
  const error = document.getElementById("error");

  error.textContent = "";

  if (!email && !subscriptionNumber) {
    error.textContent = TXT.needData;
    return;
  }

  if (!selectedFix) {
    error.textContent = TXT.needFix;
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        email: email,
        subscription_number: subscriptionNumber,
        selected_fix: selectedFix,
        status: "undone"
      })
    });

    if (!res.ok) throw new Error("submit failed");

    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("successCard").classList.remove("hidden");
  } catch (e) {
    error.textContent = TXT.sendError;
  }
};

window.loginAdmin = function (event) {
  event.preventDefault();

  const username = document.getElementById("adminUsername").value;
  const password = document.getElementById("adminPassword").value;
  const error = document.getElementById("loginError");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem("adminLoggedIn", "yes");
    window.location.href = "/admin";
  } else {
    error.textContent = TXT.badLogin;
  }
};

window.logoutAdmin = function () {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "/admin/login";
};

async function loadSubmissions() {
  const res = await fetch(API + "?select=*&order=created_at.desc", {
    method: "GET",
    headers: headers
  });

  submissions = await res.json();
  renderStats();
  renderSubmissions();
}

window.setFilter = function (filter) {
  currentFilter = filter;
  document.querySelectorAll(".status-filter").forEach(function (btn) {
    btn.classList.remove("active");
  });

  const btn = document.getElementById("filter-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
};

window.setFixFilter = function (filter) {
  currentFixFilter = filter;
  document.querySelectorAll(".fix-filter").forEach(function (btn) {
    btn.classList.remove("active");
  });

  const btn = document.getElementById("fix-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
};

function renderStats() {
  const total = submissions.length;
  const gemini = submissions.filter(function (x) {
    return (x.selected_fix || "").toLowerCase().includes("gemini");
  }).length;
  const chatgpt = submissions.filter(function (x) {
    return (x.selected_fix || "").toLowerCase().includes("chatgpt");
  }).length;
  const undone = submissions.filter(function (x) {
    return x.status === "undone";
  }).length;
  const done = submissions.filter(function (x) {
    return x.status === "done";
  }).length;

  if (document.getElementById("statTotal")) document.getElementById("statTotal").textContent = total;
  if (document.getElementById("statGemini")) document.getElementById("statGemini").textContent = gemini;
  if (document.getElementById("statChatgpt")) document.getElementById("statChatgpt").textContent = chatgpt;
  if (document.getElementById("statUndone")) document.getElementById("statUndone").textContent = undone;
  if (document.getElementById("statDone")) document.getElementById("statDone").textContent = done;
}

function renderSubmissions() {
  const q = ((document.getElementById("searchInput") || {}).value || "").toLowerCase();
  const tableBody = document.getElementById("tableBody");
  const mobileCards = document.getElementById("mobileCards");
  const emptyText = document.getElementById("emptyText");

  if (!tableBody || !mobileCards) return;

  const filtered = submissions.filter(function (item) {
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

  filtered.forEach(function (item) {
    const statusClass = item.status === "done" ? "done" : "undone";
    const statusText = item.status === "done" ? TXT.done : TXT.undone;
    const created = new Date(item.created_at).toLocaleString();

    const actionHtml =
      item.status === "undone"
        ? '<button class="done-btn" onclick="markDone(\'' + item.id + '\')">' + TXT.markDone + "</button>"
        : '<span class="completed-text">' + TXT.completed + "</span>";

    tableBody.innerHTML +=
      "<tr><td>" +
      (item.email || "-") +
      "</td><td>" +
      (item.subscription_number || "-") +
      "</td><td>" +
      item.selected_fix +
      '</td><td><span class="status ' +
      statusClass +
      '">' +
      statusText +
      "</span></td><td>" +
      created +
      "</td><td>" +
      actionHtml +
      "</td></tr>";

    const mobileAction =
      item.status === "undone"
        ? '<button class="done-btn full" onclick="markDone(\'' + item.id + '\')">' + TXT.markDone + "</button>"
        : '<button class="completed-btn full">' + TXT.done + "</button>";

    mobileCards.innerHTML +=
      '<div class="submission-card"><div class="card-top"><span class="status ' +
      statusClass +
      '">' +
      statusText +
      "</span><span>" +
      created +
      "</span></div><p><strong>Email:</strong> " +
      (item.email || "-") +
      "</p><p><strong>Subscription:</strong> " +
      (item.subscription_number || "-") +
      "</p><p><strong>Fix:</strong> " +
      item.selected_fix +
      "</p>" +
      mobileAction +
      "</div>";
  });

  if (emptyText) emptyText.classList.toggle("hidden", filtered.length !== 0);
}

window.markDone = async function (id) {
  await fetch(API + "?id=eq." + id, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify({ status: "done" })
  });

  await loadSubmissions();
};

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
