const SUPABASE_URL = "https://vbkhiecpopyjkcraykcr.supabase.co";
const SUPABASE_KEY = "sb_publishable_E-BQWEsInw0-zcJylvgCMg_mA0m1ZlA";
const API = SUPABASE_URL + "/rest/v1/submissions";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "Admin@2026";

let selectedFix = "";
let duplicateEmail = "";
let duplicateId = "";
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

function showOnlyClientCard(cardId) {
  ["noticeCard", "formCard", "successCard", "duplicateCard"].forEach(id => {
    const item = el(id);
    if (item) item.classList.add("hidden");
  });

  if (el(cardId)) el(cardId).classList.remove("hidden");
}

function route() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  ["clientPage", "loginPage", "adminPage"].forEach(id => {
    const page = el(id);
    if (page) page.classList.add("hidden");
  });

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
  showOnlyClientCard("formCard");
}

function selectFix(button, fix) {
  selectedFix = fix;

  document.querySelectorAll(".option").forEach(btn => {
    btn.classList.remove("selected");
  });

  button.classList.add("selected");
}

async function submitRequest(event) {
  event.preventDefault();

  const email = el("email").value.trim().toLowerCase();
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
    const check = await fetch(API + "?select=id,email,selected_fix,plan_locked&email=ilike." + encodeURIComponent(email), {
      method: "GET",
      headers
    });

    const existing = await check.json();

    if (Array.isArray(existing) && existing.length > 0) {
      const user = existing[0];

      if (user.plan_locked === true) {
        el("duplicateTitle").textContent = "لا يمكن تغيير الطلب مرة أخرى";
        el("duplicateMessage").textContent = "لقد قمت بتغيير طريقة التعويض مسبقًا. لا يمكن تعديل الطلب مرة أخرى، وسيتم اعتماد آخر اختيار قمت به.";
        el("changeFixBtn").classList.add("hidden");
        showOnlyClientCard("duplicateCard");
        return;
      }

      duplicateEmail = email;
      duplicateId = user.id;

      el("duplicateTitle").textContent = "هذا البريد الإلكتروني لديه طلب سابق";
      el("duplicateMessage").textContent = "لقد قمت بإرسال طلب مسبقًا بهذا البريد الإلكتروني. يمكنك تغيير طريقة التعويض مرة واحدة فقط.";
      el("changeFixBtn").classList.remove("hidden");
      showOnlyClientCard("duplicateCard");
      return;
    }

    const res = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        subscription_number: subscriptionNumber,
        selected_fix: selectedFix,
        status: "undone",
        change_note: "",
        plan_locked: false
      })
    });

    if (!res.ok) throw new Error("submit failed");

    showSuccessMessage(false);
  } catch (err) {
    console.error(err);
    error.textContent = "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.";
  }
}

function startChangeFix() {
  showOnlyClientCard("formCard");
  el("email").value = duplicateEmail;
  el("email").readOnly = true;
  el("error").textContent = "اختر طريقة التعويض الجديدة، ثم اضغط إرسال الطلب. يمكنك تغييرها مرة واحدة فقط.";
}

async function submitChangeOrNew(event) {
  event.preventDefault();

  if (duplicateId) {
    if (!selectedFix) {
      el("error").textContent = "يرجى اختيار أحد الحلول.";
      return;
    }

    const subscriptionNumber = el("subscriptionNumber").value.trim();

    try {
      const update = await fetch(API + "?id=eq." + duplicateId, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          selected_fix: selectedFix,
          subscription_number: subscriptionNumber,
          status: "undone",
          change_note: "تم تغيير الخطة",
          plan_locked: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!update.ok) throw new Error("update failed");

      showSuccessMessage(true);
    } catch (err) {
      console.error(err);
      el("error").textContent = "حدث خطأ أثناء تغيير طريقة التعويض. يرجى المحاولة مرة أخرى.";
    }

    return;
  }

  await submitRequest(event);
}

function showSuccessMessage(changed) {
  if (selectedFix.toLowerCase().includes("gemini")) {
    el("successTitle").textContent = changed ? "تم تغيير طلبك إلى Gemini Pro بنجاح" : "تم استلام طلب Gemini Pro بنجاح";
    el("successMessage").textContent = "يرجى تفقد بريدك الإلكتروني. ستصلك دعوة لتفعيل الشهر الأول من Gemini Pro خلال بضع ساعات. وبعد انتهاء كل شهر، سنرسل لك دعوة جديدة حتى اكتمال أربعة أشهر.";
  } else {
    el("successTitle").textContent = changed ? "تم تغيير طلبك إلى ChatGPT Plus بنجاح" : "تم استلام طلب ChatGPT Plus بنجاح";
    el("successMessage").textContent = "سنقوم بالتواصل معك عبر صفحتنا أو عبر البريد الإلكتروني خلال بضعة أيام. يرجى عدم تكرار الرسائل، وسيصلك إشعار فور جاهزية الاشتراك.";
  }

  showOnlyClientCard("successCard");
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
  const emptyText = el("emptyText");
  if (emptyText) {
    emptyText.textContent = "جاري تحميل الطلبات...";
    emptyText.classList.remove("hidden");
  }

  try {
    const res = await fetch(API + "?select=id,email,subscription_number,selected_fix,status,change_note,created_at,plan_locked&order=created_at.desc", {
      method: "GET",
      headers,
      cache: "no-store"
    });

    submissions = await res.json();
    renderStats();
    renderSubmissions();
  } catch (err) {
    console.error(err);
    if (emptyText) {
      emptyText.textContent = "حدث خطأ أثناء تحميل الطلبات.";
      emptyText.classList.remove("hidden");
    }
  }
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".status-filter").forEach(btn => {
    btn.classList.remove("active");
  });

  const btn = el("filter-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

function setFixFilter(filter) {
  currentFixFilter = filter;

  document.querySelectorAll(".fix-filter").forEach(btn => {
    btn.classList.remove("active");
  });

  const btn = el("fix-" + filter);
  if (btn) btn.classList.add("active");

  renderSubmissions();
}

function renderStats() {
  const total = submissions.length;
  const gemini = submissions.filter(x => (x.selected_fix || "").toLowerCase().includes("gemini")).length;
  const chatgpt = submissions.filter(x => (x.selected_fix || "").toLowerCase().includes("chatgpt")).length;
  const undone = submissions.filter(x => x.status === "undone").length;
  const done = submissions.filter(x => x.status === "done").length;

  if (el("statTotal")) el("statTotal").textContent = total;
  if (el("statGemini")) el("statGemini").textContent = gemini;
  if (el("statChatgpt")) el("statChatgpt").textContent = chatgpt;
  if (el("statUndone")) el("statUndone").textContent = undone;
  if (el("statDone")) el("statDone").textContent = done;
}

function renderSubmissions() {
  const q = (el("searchInput") ? el("searchInput").value : "").toLowerCase();
  const tableBody = el("tableBody");
  const mobileCards = el("mobileCards");
  const emptyText = el("emptyText");

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
    const statusText = item.status === "done" ? "مكتمل" : "غير مكتمل";
    const created = new Date(item.created_at).toLocaleString();
    const note = item.change_note || "-";

    const actionHtml =
      item.status === "undone"
        ? `<button class="done-btn" type="button" data-done="${item.id}">تحديد مكتمل</button>`
        : `<span class="completed-text">تم الإنجاز</span>`;

    tableBody.innerHTML += `
      <tr>
        <td>${item.email || "-"}</td>
        <td>${item.subscription_number || "-"}</td>
        <td>${item.selected_fix || "-"}</td>
        <td>${note}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>${created}</td>
        <td>${actionHtml}</td>
      </tr>
    `;

    const mobileAction =
      item.status === "undone"
        ? `<button class="done-btn full" type="button" data-done="${item.id}">تحديد مكتمل</button>`
        : `<button class="completed-btn full" type="button">مكتمل</button>`;

    mobileCards.innerHTML += `
      <div class="submission-card">
        <div class="card-top">
          <span class="status ${statusClass}">${statusText}</span>
          <span>${created}</span>
        </div>
        <p><strong>Email:</strong> ${item.email || "-"}</p>
        <p><strong>Subscription:</strong> ${item.subscription_number || "-"}</p>
        <p><strong>Fix:</strong> ${item.selected_fix || "-"}</p>
        <p><strong>Note:</strong> ${note}</p>
        ${mobileAction}
      </div>
    `;
  });

  if (emptyText) {
    emptyText.textContent = "لا توجد طلبات.";
    emptyText.classList.toggle("hidden", filtered.length !== 0);
  }
}

async function markDone(id) {
  const btns = document.querySelectorAll(`[data-done="${id}"]`);
  btns.forEach(btn => {
    btn.disabled = true;
    btn.textContent = "جاري التحديث...";
  });

  try {
    await fetch(API + "?id=eq." + id, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "done" })
    });

    const item = submissions.find(x => x.id === id);
    if (item) item.status = "done";

    renderStats();
    renderSubmissions();
  } catch (err) {
    console.error(err);
    await loadSubmissions();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  route();

  document.body.addEventListener("click", function (event) {
  const target = event.target;
  const button = target.closest("button");

  if (!button) return;

  if (button.id === "continueBtn") {
    showForm();
    return;
  }

  if (button.id === "changeFixBtn") {
    startChangeFix();
    return;
  }

  if (button.id === "logoutBtn") {
    logoutAdmin();
    return;
  }

  if (button.classList.contains("option")) {
    selectFix(button, button.getAttribute("data-fix"));
    return;
  }

  if (button.classList.contains("status-filter")) {
    setFilter(button.getAttribute("data-status"));
    return;
  }

  if (button.classList.contains("fix-filter")) {
    setFixFilter(button.getAttribute("data-fixfilter"));
    return;
  }

  if (button.hasAttribute("data-done")) {
    markDone(button.getAttribute("data-done"));
    return;
  }
});

  if (el("requestForm")) el("requestForm").addEventListener("submit", submitChangeOrNew);
  if (el("loginForm")) el("loginForm").addEventListener("submit", loginAdmin);
  if (el("searchInput")) el("searchInput").addEventListener("input", renderSubmissions);
});

