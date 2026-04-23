const feedbackForm = document.getElementById("feedbackForm");
const unlockSection = document.getElementById("unlockSection");
const recipeSection = document.getElementById("recipeSection");
const unlockBtn = document.getElementById("unlockBtn");
const recipeCodeInput = document.getElementById("recipeCode");
const unlockHint = document.getElementById("unlockHint");

const currentLesson = {
  recipeCode: "草莓",
  recipeTitle: "草莓小廚房｜課後食譜",
  recipeImage: "images/strawberry-recipe.jpg",
  recipeAlt: "草莓小廚房課後食譜",

  previewDate: "五月課程",
  previewName: "蘋果花蛋糕＆母親節小卡",
  previewDescription: "用柔柔的蘋果香氣，搭配孩子親手完成的小卡片，留下一份屬於這個季節的溫柔心意。"
};

document.getElementById("recipeTitle").textContent = currentLesson.recipeTitle;
document.getElementById("recipeImage").src = currentLesson.recipeImage;
document.getElementById("recipeImage").alt = currentLesson.recipeAlt;

document.getElementById("previewDate").textContent = currentLesson.previewDate;
document.getElementById("previewName").textContent = currentLesson.previewName;
document.getElementById("previewDescription").textContent = currentLesson.previewDescription;

feedbackForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = {
    memory: getCheckedValues("memory"),
    reminder: getSelectedValue("reminder"),
    takeaway: getCheckedValues("takeaway"),
    wish: getSelectedValue("wish"),
    rhythm: getSelectedValue("rhythm"),
    message: document.getElementById("message").value.trim(),
    submittedAt: new Date().toISOString()
  };

  console.log("表單資料：", formData);

  feedbackForm.classList.add("hidden");
  unlockSection.classList.remove("hidden");
  unlockSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

unlockBtn.addEventListener("click", function () {
  const inputValue = recipeCodeInput.value.trim();

  if (inputValue === currentLesson.recipeCode) {
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
