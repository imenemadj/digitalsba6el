const ERROR_SEND = "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.";
const ERROR_DATA = "يرجى إدخال البريد الإلكتروني أو رقم الاشتراك.";
const ERROR_FIX = "يرجى اختيار أحد الحلول.";

function submitRequest(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const subscriptionNumber = document.getElementById("subscriptionNumber").value.trim();
  const error = document.getElementById("error");

  error.textContent = "";

  if (!email && !subscriptionNumber) {
    error.textContent = ERROR_DATA;
    return;
  }

  if (!selectedFix) {
    error.textContent = ERROR_FIX;
    return;
  }

  fetch(API, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      email: email,
      subscription_number: subscriptionNumber,
      selected_fix: selectedFix,
      status: "undone"
    })
  })
  .then(res => {
    if (!res.ok) throw new Error();
    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("successCard").classList.remove("hidden");
  })
  .catch(() => {
    error.textContent = ERROR_SEND;
  });
}
