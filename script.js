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

function el(id) {
  return document.getElementById(id);
}

function hideAllPages() {
  el("clientPage").classList.add("hidden");
  el("loginPage").classList.add("hidden");
  el("adminPage").classList.add("hidden");
}

function route() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  hideAllPages();

  if (path === "/admin/login") {
    el("loginPage").classList.remove("hidden");
    return;
  }

  if (path === "/admin") {
    if (localStorage.getItem("adminLoggedIn") !== "yes") {
      window.location.href = "/admin/login";
      return;
    }

    el("adminPage").classList.remove("hidden");
    loadSubmissions();
    return;
  }

  el("clientPage").classList.remove("hidden");
}

function showForm() {
  el("noticeCard").classList.add("hidden");
  el("formCard").classList.remove("hidden");
}

function selectFix(button, fix) {
  selectedFix = fix;

  document.querySelectorAll(".option").forEach(function (btn) {
    btn.classList.remove("selected");
  });

  button.classList.add("selected");
}

async function submitRequest(event) {
  event.preventDefault();

  const email = el("email").value.trim();
  const subscriptionNumber = el("subscriptionNumber").value.trim();
  const error = el("error");

  error.textContent = "";

  if (!email && !subscriptionNumber) {
    error.textContent = "يرجى إدخال البريد الإلكتروني أو رقم الاشتراك.";
    return;
  }

  if (!selectedFix) {
    error.textContent = "يرجى اختيار أحد الحلول.";
    return;
  }

  try {
    if (email) {
      const check = await fetch(API + "?select=id&email=eq." + encodeURIComponent(email), {
        method: "GET",
        headers: headers
      });

      const existing = await check.json();

      if (Array.isArray(existing) && existing.length > 0) {
        error.textContent = "لقد قمت بإرسال طلب مسبقًا بهذا البريد الإلكتروني.";
        return;
      }
    }

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

    if (!res.ok) {
      console.log(await res.text());
      throw new Error("submit failed");
    }

    showSuccessMessage();
  } catch (errorObject) {
    console.error(errorObject);
    error.textContent = "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.";
  }
}

function showSuccessMessage() {
  const title = el("successTitle");
  const message = el("successMessage");

  if (selectedFix.toLowerCase().includes("gemini")) {
    title.textContent = "تم استلام طلب Gemini بنجاح";
    message.textContent = "يرجى تفقد بريدك الإلكتروني خلال بضع ساعات، ستصلك تفاصيل اشتراك Gemini الخاص بك. في حال واجهت أي مشكلة، يرجى التواصل معنا عبر صفحتنا الرسمية.";
  } else {
    title.textContent = "تم استلام طلب ChatGPT Plus بنجاح";
    message.textContent = "تفعيل اشتراك ChatGPT Plus قد يستغرق بضعة أيام. نرجو منكم عدم تكرار الرسائل على صفحاتنا، وسيصلكم بريد إلكتروني مباشرة فور جاهزية الاشتراك. شكرًا لصبركم وتفهمكم.";
  }

  el("formCard").classList.add("hidden");
  el("successCard").classList.remove("hidden");
}

function loginAdmin(event) {
  event.preventDefault();

  const username = el("adminUsername").value.trim();
  const password = el("adminPassword").value.trim();

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    localStorage.setItem("adminLoggedIn", "yes");
    window.location.href = "/admin";
  } else {
    el("loginError").textContent = "اسم المستخدم أو كلمة المرور غير صحيحة.";
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "/admin/login";
}

async function loadSubmissions() {
  const res = await fetch(API + "?select=*&order=created_at.desc", {
    method: "GET",
    headers: headers
  });

  submissions = await res.json();
  renderStats();
  renderSubmissions();
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".status-filter").forEach(function (btn) {
    btn.classList.remove("active");
  });

  const btn = el("filter-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

function setFixFilter(filter) {
  currentFixFilter = filter;

  document.querySelectorAll(".fix-filter").forEach(function (btn) {
    btn.classList.remove("active");
  });

  const btn = el("fix-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

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

  el("statTotal").textContent = total;
  el("statGemini").textContent = gemini;
  el("statChatgpt").textContent = chatgpt;
  el("statUndone").textContent = undone;
  el("statDone").textContent = done;
}

function renderSubmissions() {
  const q = (el("searchInput") ? el("searchInput").value : "").toLowerCase();
  const tableBody = el("tableBody");
  const mobileCards = el("mobileCards");
  const emptyText = el("emptyText");

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
    const statusText = item.status === "done" ? "مكتمل" : "غير مكتمل";
    const created = new Date(item.created_at).toLocaleString();

    const actionHtml =
      item.status === "undone"
        ? '<button class="done-btn" type="button" data-done="' + item.id + '">تحديد مكتمل</button>'
        : '<span class="completed-text">تم الإنجاز</span>';

    tableBody.innerHTML +=
      "<tr><td>" +
      (item.email || "-") +
      "</td><td>" +
      (item.subscription_number || "-") +
      "</td><td>" +
      (item.selected_fix || "-") +
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
        ? '<button class="done-btn full" type="button" data-done="' + item.id + '">تحديد مكتمل</button>'
        : '<button class="completed-btn full" type="button">مكتمل</button>';

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
      (item.selected_fix || "-") +
      "</p>" +
      mobileAction +
      "</div>";
  });

  document.querySelectorAll("[data-done]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      markDone(btn.getAttribute("data-done"));
    });
  });

  if (emptyText) emptyText.classList.toggle("hidden", filtered.length !== 0);
}

async function markDone(id) {
  await fetch(API + "?id=eq." + id, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify({ status: "done" })
  });

  await loadSubmissions();
}

document.addEventListener("DOMContentLoaded", function () {
  route();

  if (el("continueBtn")) el("continueBtn").addEventListener("click", showForm);
  if (el("requestForm")) el("requestForm").addEventListener("submit", submitRequest);
  if (el("loginForm")) el("loginForm").addEventListener("submit", loginAdmin);
  if (el("logoutBtn")) el("logoutBtn").addEventListener("click", logoutAdmin);
  if (el("searchInput")) el("searchInput").addEventListener("input", renderSubmissions);

  document.querySelectorAll(".option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectFix(btn, btn.getAttribute("data-fix"));
    });
  });

  document.querySelectorAll(".status-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setFilter(btn.getAttribute("data-status"));
    });
  });

  document.querySelectorAll(".fix-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setFixFilter(btn.getAttribute("data-fixfilter"));
    });
  });
});
