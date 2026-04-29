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
  ["clientPage", "loginPage", "adminPage"].forEach(id => {
    const item = el(id);
    if (item) item.classList.add("hidden");
  });
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
    if (email) {
      const check = await fetch(API + "?select=id,selected_fix&email=ilike." + encodeURIComponent(email), {
        method: "GET",
        headers
      });

      const existing = await check.json();

      if (Array.isArray(existing) && existing.length > 0) {
        const currentFix = existing[0].selected_fix || "-";

        const wantsChange = confirm(
          "لقد قمت بإرسال طلب مسبقًا بهذا البريد الإلكتروني.\n\n" +
          "الحل الحالي: " + currentFix + "\n\n" +
          "هل تريد تغيير طريقة التعويض إلى الخيار الجديد؟"
        );

        if (!wantsChange) {
          error.textContent = "تم الاحتفاظ بطلبك السابق بدون تغيير.";
          return;
        }

        const update = await fetch(API + "?id=eq." + existing[0].id, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            selected_fix: selectedFix,
            subscription_number: subscriptionNumber,
            status: "undone",
            change_note: "تم تغيير الحل",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });

        if (!update.ok) throw new Error("update failed");

        showSuccessMessage(true);
        return;
      }
    }

    const res = await fetch(API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        subscription_number: subscriptionNumber,
        selected_fix: selectedFix,
        status: "undone",
        change_note: ""
      })
    });

    if (!res.ok) throw new Error("submit failed");

    showSuccessMessage(false);
  } catch (err) {
    console.error(err);
    error.textContent = "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.";
  }
}

function showSuccessMessage(changed) {
  const title = el("successTitle");
  const message = el("successMessage");

  if (selectedFix.toLowerCase().includes("gemini")) {
    title.textContent = changed ? "تم تغيير طلبك إلى Gemini بنجاح" : "تم استلام طلب Gemini بنجاح";
    message.textContent = "يرجى تفقد بريدك الإلكتروني، ستصلك دعوة لتفعيل الشهر الأول من اشتراك Gemini. وبعد انتهاء الشهر الأول، سنرسل لك دعوة جديدة للشهر الثاني. في حال واجهت أي مشكلة، يرجى التواصل معنا عبر صفحتنا الرسمية.";
  } else {
    title.textContent = changed ? "تم تغيير طلبك إلى ChatGPT Plus بنجاح" : "تم استلام طلب ChatGPT Plus بنجاح";
    message.textContent = "سنقوم بالتواصل معك عبر صفحتنا أو عبر البريد الإلكتروني خلال بضعة أيام. يرجى عدم تكرار الرسائل، وسيصلك إشعار مباشرة فور جاهزية الاشتراك.";
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
    headers
  });

  submissions = await res.json();
  renderStats();
  renderSubmissions();
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

  document.querySelectorAll("[data-done]").forEach(btn => {
    btn.addEventListener("click", () => markDone(btn.getAttribute("data-done")));
  });

  if (emptyText) emptyText.classList.toggle("hidden", filtered.length !== 0);
}

async function markDone(id) {
  await fetch(API + "?id=eq." + id, {
    method: "PATCH",
    headers,
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

  document.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => selectFix(btn, btn.getAttribute("data-fix")));
  });

  document.querySelectorAll(".status-filter").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.getAttribute("data-status")));
  });

  document.querySelectorAll(".fix-filter").forEach(btn => {
    btn.addEventListener("click", () => setFixFilter(btn.getAttribute("data-fixfilter")));
  });
});
