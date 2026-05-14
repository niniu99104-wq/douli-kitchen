/* ============================================================
   DouNi Kitchen — 食育小小回饋 · script.js
   優化項目：
   1. 修正送出後仍依賴 DOM lessonSelect 的 Bug → 改存 selectedLesson 變數
   2. 食譜密碼不在前端明文暴露 → 以 hash 比對（SHA-256），只將雜湊值存放在前端
   3. 填答進度條即時更新
   4. 全面錯誤處理與狀態回饋
   5. 食譜圖片 src 延遲至通過驗證後才插入
   6. 防止重複送出（debounce + disabled 狀態）
   ============================================================ */

// ── DOM refs ──────────────────────────────────────────────
const feedbackForm   = document.getElementById("feedbackForm");
const lessonSelect   = document.getElementById("lessonSelect");
const unlockSection  = document.getElementById("unlockSection");
const recipeSection  = document.getElementById("recipeSection");
const unlockBtn      = document.getElementById("unlockBtn");
const recipeCodeInput = document.getElementById("recipeCode");
const unlockHint     = document.getElementById("unlockHint");
const recipeTitle    = document.getElementById("recipeTitle");
const recipeImage    = document.getElementById("recipeImage");
const progressBar    = document.getElementById("progressBar");
const progressLabel  = document.getElementById("progressLabel");
const submitBtn      = document.getElementById("submitBtn");
const errorLesson    = document.getElementById("error-lesson");

// ── API ───────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbz_DC5aqEc3QyglAuPZRn3Hek87uQEDbCLugNzAKoL2r1cGAqlLYtTJBp8x5CjAxEDvKg/exec";

/* ============================================================
   課程資料
   recipeCodeHash：用 SHA-256 雜湊取代明文密碼，前端無法反推原始暗號。
   產生方式（Node.js）：
     crypto.createHash('sha256').update('原始暗號').digest('hex')
   或直接在瀏覽器 console 執行 hashStr('原始暗號') 後把結果貼過來。

   ⚠️  請自行將下方的 recipeCodeHash 換成你真正的暗號的雜湊值。
       目前預設值是原始碼中的暗號字串做示範，部署前請重新生成。
   ============================================================ */
// ── 課程清單（只放名稱對應，食譜資訊由後端回傳）─────────────
const KNOWN_LESSONS = [
  "地瓜巴斯克蛋糕",
  "聖誕薑餅屋",
  "草莓小廚房（草莓瑪芬＋草莓牛奶）",
  "蘋果派",
  "南瓜司康",
  "鳳梨巴斯克蛋糕"
];

// ── 狀態變數（修正 Bug #1：送出後不再依賴 lessonSelect.value） ──
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

  // Q1 checkboxes
  if (document.querySelectorAll('input[name="memory"]:checked').length > 0) answered++;
  // Q2
  if (document.querySelector('input[name="reminder"]:checked')) answered++;
  // Q3
  if (document.querySelector('input[name="holdingBack"]:checked')) answered++;
  // Q4 checkboxes
  if (document.querySelectorAll('input[name="takeaway"]:checked').length > 0) answered++;
  // Q5
  if (document.querySelector('input[name="wish"]:checked')) answered++;
  // Q6
  if (document.querySelector('input[name="rhythm"]:checked')) answered++;
  // Q7 textarea（有輸入即算）
  if (document.getElementById("message").value.trim().length > 0) answered++;

  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);
  progressBar.style.width = pct + "%";
  progressLabel.textContent = `填寫中 ${answered} / ${TOTAL_QUESTIONS}`;
}

// 監聽所有題目輸入
feedbackForm.addEventListener("change", updateProgress);
document.getElementById("message").addEventListener("input", updateProgress);

// ── 表單送出 ──────────────────────────────────────────────
feedbackForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const selectedLesson = lessonSelect.value;

  // 驗證課程選擇
  if (!selectedLesson) {
    errorLesson.classList.remove("hidden");
    lessonSelect.focus();
    lessonSelect.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errorLesson.classList.add("hidden");

  // 防止重複送出
  submitBtn.disabled  = true;
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

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // ✅ 修正 Bug #1：存到模組變數，不再從 DOM 重新讀取
    submittedLesson = selectedLesson;

    // 設定食譜標題（圖片延後到密碼驗證通過才插入）
    recipeTitle.textContent = lessons[submittedLesson].recipeTitle;

    feedbackForm.classList.add("hidden");
    document.querySelector(".progress-bar-wrap").classList.add("hidden");
    document.querySelector(".progress-label")?.classList.add("hidden");

    unlockSection.classList.remove("hidden");
    unlockSection.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (error) {
    console.error("送出失敗：", error);
    alert("送出時遇到一點問題，請稍後再試一次 🙏");
    submitBtn.disabled   = false;
    submitBtn.textContent = "送出回饋";
  }
});

// ── 解鎖食譜 ──────────────────────────────────────────────
unlockBtn.addEventListener("click", async function () {
  if (!submittedLesson) {
    unlockHint.textContent = "請先完成問卷送出喔 🤍";
    return;
  }

  const inputValue = recipeCodeInput.value.trim();
  if (!inputValue) {
    unlockHint.textContent = "請輸入今天的小暗號 🤍";
    recipeCodeInput.focus();
    return;
  }

  // 把暗號雜湊後送到後端比對，前端完全不存正確答案
  unlockBtn.disabled    = true;
  unlockBtn.textContent = "確認中…";

  try {
    const codeHash = await hashStr(inputValue);

    const response = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body:    JSON.stringify({
        action:      "verifyCode",
        lessonName:  submittedLesson,
        codeHash:    codeHash
      })
    });

    const result = await response.json();

    if (result.status === "ok") {
      unlockHint.textContent = "";

      // 圖片資訊由後端回傳，前端不存路徑
      recipeTitle.textContent = result.recipe.title;
      recipeImage.src         = result.recipe.image;
      recipeImage.alt         = result.recipe.title;

      recipeSection.classList.remove("hidden");
      recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });

      recipeCodeInput.disabled = true;
      unlockBtn.textContent    = "已解鎖 ✓";

    } else {
      unlockHint.textContent = "暗號好像還差一點點，再想想看 🤍";
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

// Enter 鍵也能觸發解鎖
recipeCodeInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    unlockBtn.click();
  }
});

// ── 工具函式 ──────────────────────────────────────────────
function getCheckedValues(name) {
  return Array.from(
    document.querySelectorAll(`input[name="${name}"]:checked`)
  ).map(item => item.value);
}

function getSelectedValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}
