// ── DOM refs ──────────────────────────────────────────────
const feedbackForm    = document.getElementById("feedbackForm");
const lessonSelect    = document.getElementById("lessonSelect");
const unlockSection   = document.getElementById("unlockSection");
const recipeSection   = document.getElementById("recipeSection");
const unlockBtn       = document.getElementById("unlockBtn");
const recipeCodeInput = document.getElementById("recipeCode");
const unlockHint      = document.getElementById("unlockHint");
const recipeTitle     = document.getElementById("recipeTitle");
const recipeImage     = document.getElementById("recipeImage");
const progressBar     = document.getElementById("progressBar");
const progressLabel   = document.getElementById("progressLabel");
const submitBtn       = document.getElementById("submitBtn");
const errorLesson     = document.getElementById("error-lesson");

// ── API ───────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbwfVqSxBIbeGXrkYUU77ghNJk3Mjj4uh6D0Z_W2Uvws__zKe4uU5pSIbDpWTPhExUKGlQ/exec";

// ── 狀態變數 ──────────────────────────────────────────────
let submittedLesson = null;

// ── SHA-256 雜湊工具 ──────────────────────────────────────
async function hashStr(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── 進度條 ────────────────────────────────────────────────
const TOTAL_QUESTIONS = 7;

function updateProgress() {
  let answered = 0;
  if (document.querySelectorAll('input[name="memory"]:checked').length > 0)   answered++;
  if (document.querySelector('input[name="reminder"]:checked'))               answered++;
  if (document.querySelector('input[name="holdingBack"]:checked'))            answered++;
  if (document.querySelectorAll('input[name="takeaway"]:checked').length > 0) answered++;
  if (document.querySelector('input[name="wish"]:checked'))                   answered++;
  if (document.querySelector('input[name="rhythm"]:checked'))                 answered++;
  if (document.getElementById("message").value.trim().length > 0)             answered++;

  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);
  progressBar.style.width   = pct + "%";
  progressLabel.textContent = "填寫中 " + answered + " / " + TOTAL_QUESTIONS;
}

feedbackForm.addEventListener("change", updateProgress);
document.getElementById("message").addEventListener("input", updateProgress);

// ── 表單送出 ──────────────────────────────────────────────
feedbackForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const selectedLesson = lessonSelect.value;

  if (!selectedLesson) {
    errorLesson.classList.remove("hidden");
    lessonSelect.focus();
    lessonSelect.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errorLesson.classList.add("hidden");

  submitBtn.disabled    = true;
  submitBtn.textContent = "送出中…";

  const formData = {
    lessonName:  selectedLesson,
    memory:      getCheckedValues("memory"),
    reminder:    getSelectedValue("reminder"),
    holdingBack: getSelectedValue("holdingBack"),
    takeaway:    getCheckedValues("takeaway"),
    wish:        getSelectedValue("wish"),
    rhythm:      getSelectedValue("rhythm"),
    message:     document.getElementById("message").value.trim(),
    submittedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body:    JSON.stringify(formData)
    });

    if (!response.ok) throw new Error("HTTP " + response.status);

    submittedLesson = selectedLesson;

    // 送出成功後隱藏表單，顯示謝謝區
    feedbackForm.classList.add("hidden");
    document.querySelector(".progress-bar-wrap").classList.add("hidden");
    document.querySelector(".progress-label").classList.add("hidden");

    unlockSection.classList.remove("hidden");
    unlockSection.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (error) {
    console.error("送出失敗：", error);
    alert("送出時遇到一點問題，請稍後再試一次 🙏");
    submitBtn.disabled    = false;
    submitBtn.textContent = "送出回饋";
  }
});

// ── 解鎖食譜（保險升級版） ──────────────────────────────────────────────
unlockBtn.addEventListener("click", async function () {
  // 保險 1：如果 submittedLesson 還沒被填入，我們直接現場去抓下拉選單的值
  let currentLesson = submittedLesson || lessonSelect.value;

  if (!currentLesson) {
    unlockHint.textContent = "請先完成問卷並選擇課程喔 🤍";
    return;
  }

  const inputValue = recipeCodeInput.value.trim();
  if (!inputValue) {
    unlockHint.textContent = "請輸入今天的小暗號 🤍";
    // 這裡加上安全防護：如果只是單純沒打字，絕對不可以觸發 fetch 送出！
    recipeCodeInput.focus();
    return;
  }

  // 保險 2：強制校正！如果名字拿到的是長名字，現場幫妳砍成 GAS 要的 "法式鹹派"
  if (currentLesson.includes("鹹派")) {
    currentLesson = "法式鹹派";
  }
  if (currentLesson.includes("佛卡夏")) {
    currentLesson = "佛卡夏麵包";
  }

  unlockBtn.disabled  = true;
  unlockBtn.textContent = "確認中…";
  unlockHint.textContent = "正在努力解鎖中... ✨";

  try {
    const codeHash = await hashStr(inputValue);

    const response = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body:    JSON.stringify({
        action:     "verifyCode",
        lessonName: currentLesson, // 這裡送出的一定會是乾淨的 "法式鹹派"
        codeHash:   codeHash
      })
    });

    const result = await response.json();

    if (result.status === "ok") {
      unlockHint.textContent  = "";
      recipeTitle.textContent = result.recipe.title;
      recipeImage.src         = result.recipe.image;
      recipeImage.alt         = result.recipe.title;

      recipeSection.classList.remove("hidden");
      recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });

      recipeCodeInput.disabled = true;
      unlockBtn.textContent    = "已解鎖 ✓";

    } else {
      // 這裡如果失敗，顯示後端到底是拿什麼名稱在比對，方便妳一眼抓漏
      unlockHint.textContent = `暗號好像還差一點點（對應課程：${currentLetter}），再想想看 🤍`;
      recipeCodeInput.select();
      unlockBtn.disabled    = false;
      unlockBtn.textContent = "解鎖食譜";
    }

  } catch (err) {
    console.error(err);
    unlockHint.textContent = "連線有點問題，請再試一次 🙏";
    unlockBtn.disabled    = false;
    unlockBtn.textContent = "解鎖食譜";
  }
});

// Enter 鍵觸發解鎖
recipeCodeInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    unlockBtn.click();
  }
});

// ── 工具函式 ──────────────────────────────────────────────
function getCheckedValues(name) {
  return Array.from(
    document.querySelectorAll('input[name="' + name + '"]:checked')
  ).map(function(item) { return item.value; });
}

function getSelectedValue(name) {
  const el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : "";
}
