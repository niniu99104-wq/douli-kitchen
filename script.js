const feedbackForm = document.getElementById("feedbackForm");
const lessonSelect = document.getElementById("lessonSelect");
const unlockSection = document.getElementById("unlockSection");
const recipeSection = document.getElementById("recipeSection");
const unlockBtn = document.getElementById("unlockBtn");
const recipeCodeInput = document.getElementById("recipeCode");
const unlockHint = document.getElementById("unlockHint");
const recipeTitle = document.getElementById("recipeTitle");
const recipeImage = document.getElementById("recipeImage");

const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL";

const lessons = {
  "地瓜巴斯克蛋糕": {
    recipeCode: "地瓜",
    recipeTitle: "地瓜巴斯克蛋糕｜課後食譜",
    recipeImage: "sweetpotato-basque-recipe.jpg",
    recipeAlt: "地瓜巴斯克蛋糕課後食譜"
  },
  "聖誕薑餅屋": {
    recipeCode: "薑餅",
    recipeTitle: "聖誕薑餅屋｜課後食譜",
    recipeImage: "christmas-gingerbread-recipe.jpg",
    recipeAlt: "聖誕薑餅屋課後食譜"
  },
  "草莓小廚房（草莓瑪芬＋草莓牛奶）": {
    recipeCode: "草莓",
    recipeTitle: "草莓小廚房｜課後食譜",
    recipeImage: "strawberry-recipe.jpg",
    recipeAlt: "草莓小廚房課後食譜"
  },
  "蘋果派": {
    recipeCode: "蘋果派",
    recipeTitle: "蘋果派｜課後食譜",
    recipeImage: "apple-pie-recipe.jpg",
    recipeAlt: "蘋果派課後食譜"
  },
  "南瓜司康": {
    recipeCode: "南瓜",
    recipeTitle: "南瓜司康｜課後食譜",
    recipeImage: "pumpkin-scone-recipe.jpg",
    recipeAlt: "南瓜司康課後食譜"
  },
  "鳳梨巴斯克蛋糕": {
    recipeCode: "鳳梨",
    recipeTitle: "鳳梨巴斯克蛋糕｜課後食譜",
    recipeImage: "pineapple-basque-recipe.jpg",
    recipeAlt: "鳳梨巴斯克蛋糕課後食譜"
  }
};

feedbackForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const selectedLesson = lessonSelect.value;

  if (!selectedLesson) {
    alert("請先選擇本次課程。");
    lessonSelect.focus();
    return;
  }

  const submitButton = feedbackForm.querySelector(".submit-btn");
  submitButton.disabled = true;
  submitButton.textContent = "送出中...";

  const formData = {
    lessonName: selectedLesson,
    memory: getCheckedValues("memory"),
    reminder: getSelectedValue("reminder"),
    holdingBack: getSelectedValue("holdingBack"),
    takeaway: getCheckedValues("takeaway"),
    wish: getSelectedValue("wish"),
    rhythm: getSelectedValue("rhythm"),
    message: document.getElementById("message").value.trim(),
    submittedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    console.log("寫入結果：", result);

    const lessonData = lessons[selectedLesson];
    recipeTitle.textContent = lessonData.recipeTitle;
    recipeImage.src = lessonData.recipeImage;
    recipeImage.alt = lessonData.recipeAlt;

    feedbackForm.classList.add("hidden");
    unlockSection.classList.remove("hidden");
    unlockSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("送出失敗：", error);
    alert("送出失敗，請稍後再試一次。");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "送出回饋";
  }
});

unlockBtn.addEventListener("click", function () {
  const selectedLesson = lessonSelect.value;
  const lessonData = lessons[selectedLesson];
  const inputValue = recipeCodeInput.value.trim();

  if (!lessonData) {
    unlockHint.textContent = "請先選擇課程。";
    return;
  }

  if (inputValue === lessonData.recipeCode) {
    unlockHint.textContent = "";
    recipeSection.classList.remove("hidden");
    recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    unlockHint.textContent = "暗號好像還差一點點，再想想看 🤍";
  }
});

function getCheckedValues(name) {
  const checkedItems = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkedItems).map((item) => item.value);
}

function getSelectedValue(name) {
  const selectedItem = document.querySelector(`input[name="${name}"]:checked`);
  return selectedItem ? selectedItem.value : "";
}
