const STORAGE_KEY = "arendt-totalitarianism-notebook";
const NOTES_KEY = "arendt-totalitarianism-book-notes";

const form = document.querySelector("#entryForm");
const entriesEl = document.querySelector("#entries");
const bookNotes = document.querySelector("#bookNotes");
const fields = {
  date: document.querySelector("#date"),
  range: document.querySelector("#range"),
  summary: document.querySelector("#summary"),
  tags: document.querySelector("#tags"),
  question1: document.querySelector("#question1"),
  answer1: document.querySelector("#answer1"),
  question2: document.querySelector("#question2"),
  answer2: document.querySelector("#answer2"),
  question3: document.querySelector("#question3"),
  answer3: document.querySelector("#answer3"),
};

let entries = loadEntries();

fields.date.valueAsDate = new Date();
bookNotes.value = localStorage.getItem(NOTES_KEY) || "";
render();
drawStarfield();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const entry = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value.trim()])
  );

  if (!entry.date) return;

  const existingIndex = entries.findIndex((item) => item.date === entry.date);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));
  saveEntries();
  form.reset();
  fields.date.valueAsDate = new Date();
  render();
});

bookNotes.addEventListener("input", () => {
  localStorage.setItem(NOTES_KEY, bookNotes.value);
});

document.querySelectorAll(".prompt").forEach((button) => {
  button.addEventListener("click", () => {
    const target = fields[button.dataset.target];
    target.value = button.dataset.prompt;
    target.focus();
  });
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const payload = {
    book: "汉娜·阿伦特《极权主义的起源》",
    exportedAt: new Date().toISOString(),
    bookNotes: bookNotes.value,
    entries,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "极权主义的起源-阅读笔记.json";
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#clearBtn").addEventListener("click", () => {
  const confirmed = window.confirm("确定清空所有每日记录吗？整本书档案不会被清空。");
  if (!confirmed) return;
  entries = [];
  saveEntries();
  render();
});

entriesEl.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-entry");
  if (!button) return;
  entries = entries.filter((entry) => entry.date !== button.dataset.date);
  saveEntries();
  render();
});

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function render() {
  const totals = entries.reduce(
    (sum, entry) => {
      sum.questions += getQuestionPairs(entry).filter((item) => item.question).length;
      sum.concepts += countConcepts(entry.tags);
      return sum;
    },
    { questions: 0, concepts: 0 }
  );

  document.querySelector("#dayCount").textContent = entries.length;
  document.querySelector("#entryCount").textContent = entries.length;
  document.querySelector("#questionCount").textContent = totals.questions;
  document.querySelector("#conceptCount").textContent = totals.concepts;

  if (!entries.length) {
    entriesEl.className = "entries empty";
    entriesEl.innerHTML = "<p>尚未保存记录。今天可以成为第一块碑文。</p>";
    return;
  }

  entriesEl.className = "entries";
  entriesEl.innerHTML = entries
    .map(
      (entry) => {
        const qa = getQuestionPairs(entry)
          .filter((item) => item.question || item.answer)
          .map(
            (item, index) => `
              <div class="qa-item">
                <strong>问题 ${index + 1}</strong>
                <p>${escapeHtml(item.question || "未填写问题。")}</p>
                ${item.answer ? `<p class="entry-meta">解释：${escapeHtml(item.answer)}</p>` : ""}
              </div>
            `
          )
          .join("");

        return `
        <article class="entry-card">
          <div class="entry-date">${escapeHtml(entry.date)}</div>
          <div>
            <h3>${escapeHtml(entry.range || "未填写阅读位置")}</h3>
            <p>${escapeHtml(entry.summary || "没有摘要。")}</p>
            ${qa ? `<div class="qa-list">${qa}</div>` : ""}
            ${entry.tags ? `<p class="entry-meta">线索：${escapeHtml(entry.tags)}</p>` : ""}
          </div>
          <button class="delete-entry" type="button" data-date="${escapeHtml(entry.date)}" aria-label="删除这条记录">×</button>
        </article>
      `;
      }
    )
    .join("");
}

function getQuestionPairs(entry) {
  if (entry.question1 || entry.question2 || entry.question3) {
    return [1, 2, 3].map((number) => ({
      question: entry[`question${number}`] || "",
      answer: entry[`answer${number}`] || "",
    }));
  }

  const legacyQuestions = String(entry.questions || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return [0, 1, 2].map((index) => ({
    question: legacyQuestions[index] || "",
    answer: index === 0 ? entry.reflection || "" : "",
  }));
}

function countConcepts(text) {
  if (!text) return 0;
  return text
    .split(/[，,、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function drawStarfield() {
  const canvas = document.querySelector("#starfield");
  const context = canvas.getContext("2d");
  const stars = Array.from({ length: 310 }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.8 + 0.25,
    drift: Math.random() * 0.0011 + 0.0002,
    pulse: Math.random() * Math.PI * 2,
    alpha: Math.random() * 0.74 + 0.18,
  }));

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
  }

  function frame() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;

    const now = performance.now() * 0.002;
    stars.forEach((star) => {
      star.y = (star.y + star.drift) % 1;
      const twinkle = 0.42 + Math.abs(Math.sin(now + star.pulse)) * 0.58;
      context.beginPath();
      context.fillStyle = `rgba(236, 229, 204, ${star.alpha * twinkle})`;
      context.arc(star.x * width, star.y * height, star.radius * window.devicePixelRatio, 0, Math.PI * 2);
      context.fill();

      if (star.radius > 1.55 && twinkle > 0.84) {
        context.strokeStyle = `rgba(217, 181, 109, ${0.18 * twinkle})`;
        context.beginPath();
        context.moveTo(star.x * width - 5, star.y * height);
        context.lineTo(star.x * width + 5, star.y * height);
        context.moveTo(star.x * width, star.y * height - 5);
        context.lineTo(star.x * width, star.y * height + 5);
        context.stroke();
      }
    });

    context.strokeStyle = "rgba(217, 181, 109, 0.08)";
    context.lineWidth = 1 * window.devicePixelRatio;
    for (let i = 0; i < 5; i += 1) {
      context.beginPath();
      context.ellipse(
        width * 0.72,
        height * 0.18,
        width * (0.15 + i * 0.04),
        height * (0.035 + i * 0.012),
        -0.34,
        0,
        Math.PI * 2
      );
      context.stroke();
    }

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  frame();
}
