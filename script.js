(async () => {
  const endpoint = "https://text.pollinations.ai/openai/v1/chat/completions";

  const locales = {
    ru: {
      pageTitle: "Генератор страниц на базе нейросети",
      startDescription: "Это генератор страницы с помощью нейросети. Нажмите кнопку, чтобы создать лендинг на любую тему.",
      startButton: "Создать страницу",
      promptLabel: "Укажите тему для лендинга:",
      promptPlaceholder: "Эверест",
      loadingText: "Генерация страницы, пожалуйста, подождите…",
      alertNoTheme: "Тема не указана. Попробуйте снова.",
      alertLoadingError: "Ошибка при загрузке данных. Попробуйте позже.",
      downloadTitle: "Скачать код сгенерированной страницы",
      downloadAria: "Скачать код сгенерированной страницы",
      sponsorClose: "Закрыть",
      modalOk: "OK",
      modalCancel: "Отмена"
    },
    en: {
      pageTitle: "AI-Powered Page Generator",
      startDescription: "This is a page generator powered by AI. Click the button to create a landing page on any topic.",
      startButton: "Create Page",
      promptLabel: "Enter a theme for the landing page:",
      promptPlaceholder: "Everest",
      loadingText: "Generating page, please wait…",
      alertNoTheme: "No theme provided. Please try again.",
      alertLoadingError: "Error loading data. Please try again later.",
      downloadTitle: "Download generated page code",
      downloadAria: "Download generated page code",
      sponsorClose: "Close",
      modalOk: "OK",
      modalCancel: "Cancel"
    }
  };

  const query = (s) => document.querySelector(s);
  const pageTitleEl = query('#page-title');
  const descText = query('#desc-text');
  const startButton = query('#start-button');
  const loadingScreen = query('#loading-screen');
  const loadingText = query('#loading-text');
  const iframeContainer = query('#iframe-container');
  const iframe = query('#output-frame');
  const downloadBtn = query('#download-button');
  const sponsorNotif = query('#sponsor-notification');
  const sponsorTextElem = query('#sponsor-text');
  const sponsorCloseBtn = sponsorNotif.querySelector('button');
  const modalOverlay = query('#modal-overlay');
  const modalLabel = query('#modal-label');
  const themeInput = query('#theme-input');
  const modalOk = query('#modal-ok');
  const modalCancel = query('#modal-cancel');
  const startScreen = query('#start-screen');

  const userLangRaw = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  const userLang = userLangRaw.slice(0, 2);
  const lang = locales[userLang] ? userLang : "en";
  const L = locales[lang];

  pageTitleEl.textContent = L.pageTitle;
  descText.textContent = L.startDescription;
  startButton.textContent = L.startButton;
  startButton.setAttribute('aria-label', L.startButton);
  loadingText.textContent = L.loadingText;
  downloadBtn.setAttribute('title', L.downloadTitle);
  downloadBtn.setAttribute('aria-label', L.downloadAria);
  sponsorCloseBtn.textContent = L.sponsorClose;
  sponsorCloseBtn.setAttribute('aria-label', L.sponsorClose);
  modalLabel.textContent = L.promptLabel;
  themeInput.placeholder = L.promptPlaceholder;
  modalOk.textContent = L.modalOk;
  modalCancel.textContent = L.modalCancel;
  document.title = L.pageTitle;

  function openModal() {
    themeInput.value = "";
    modalOverlay.classList.add("visible");
    themeInput.style.height = "auto";
    themeInput.style.height = themeInput.scrollHeight + "px";
    themeInput.focus();
  }

  function closeModal() {
    modalOverlay.classList.remove("visible");
  }

  function autoResizeTextarea() {
    themeInput.style.height = "auto";
    themeInput.style.height = themeInput.scrollHeight + "px";
  }

  function isHTML(str) {
    return /<\/?[a-z][\s\S]*>/i.test(str);
  }

  async function generatePage(theme) {
    document.title = L.pageTitle;
    startButton.disabled = true;
    startScreen.style.display = "none";
    loadingScreen.style.display = "flex";
    loadingText.textContent = L.loadingText;
    iframeContainer.style.display = "none";
    downloadBtn.style.display = "none";
    sponsorNotif.classList.remove("visible");
    sponsorNotif.hidden = true;

    const contentPromptRu = `
Создай полноценный, красивый и подробный лендинг на тему: "${theme}".
Весь необходимый CSS и JavaScript должен быть заинлайнен внутри HTML.
Если нужны внешние библиотеки — используй их (например, jQuery).
Опиши все важные аспекты, используй яркие и живые детали, создай привлекательный дизайн с тщательно проработанными стилями.
Сделай страницу информативной, визуально насыщенной и удобной для чтения на любых устройствах.
`.trim();

    const contentPromptEn = `
Create a full, beautiful, and detailed landing page about: "${theme}".
All necessary CSS and JavaScript should be inlined inside the HTML.
If external libraries are needed (like jQuery), feel free to use them.
Describe all important aspects, use vivid and lively details, create an attractive design with carefully crafted styles.
Make the page informative, visually rich, and easy to read on any device.
`.trim();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: lang === "ru" ? contentPromptRu : contentPromptEn }],
        }),
      });

      const data = await res.json();
      if (!data.choices?.length) throw new Error("Empty response");

      let rawContent = data.choices[0].message.content || "";

      const sponsorMarker = "---\n\n**Sponsor**\n";
      let sponsorMarkdown = null;
      const sponsorIndex = rawContent.indexOf(sponsorMarker);
      if (sponsorIndex !== -1) {
        sponsorMarkdown = rawContent.slice(sponsorIndex + sponsorMarker.length).trim();
        rawContent = rawContent.slice(0, sponsorIndex).trim();
      }

      const startCodeIndex = rawContent.indexOf("```html");
      if (startCodeIndex !== -1) rawContent = rawContent.slice(startCodeIndex + 7).trim();
      const endCodeIndex = rawContent.indexOf("```");
      if (endCodeIndex !== -1) rawContent = rawContent.slice(0, endCodeIndex).trim();

      if (isHTML(rawContent)) {
        iframe.srcdoc = rawContent;
        iframeContainer.style.display = "block";
        requestAnimationFrame(() => iframeContainer.classList.add("visible"));
        loadingScreen.style.display = "none";
        downloadBtn.style.display = "flex";

        const titleMatch = rawContent.match(/<title>([\s\S]*?)<\/title>/i);
        const pageTitle = titleMatch?.[1].trim() || L.pageTitle;
        document.title = pageTitle;

        downloadBtn.onclick = () => {
          const blob = new Blob([rawContent], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = pageTitle.replace(/[\\\/:*?"<>|]/g, "_") + ".html";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };
      } else {
        loadingText.textContent = rawContent;
      }

      if (sponsorMarkdown) {
        sponsorTextElem.innerHTML = marked.parse(sponsorMarkdown);
        sponsorNotif.hidden = false;
        setTimeout(() => sponsorNotif.classList.add("visible"), 3000);
      }
    } catch (e) {
      alert(L.alertLoadingError);
      console.error(e);
      startButton.disabled = false;
      startScreen.style.display = "";
      loadingScreen.style.display = "none";
      iframeContainer.style.display = "none";
      downloadBtn.style.display = "none";
      document.title = L.pageTitle;
    }
  }

  sponsorCloseBtn.onclick = () => {
    sponsorNotif.classList.remove("visible");
    setTimeout(() => sponsorNotif.hidden = true, 400);
  };

  startButton.addEventListener("click", () => {
    themeInput.value = "";
    modalOverlay.classList.add("visible");
    themeInput.style.height = "auto";
    themeInput.style.height = themeInput.scrollHeight + "px";
    themeInput.focus();
  });

  modalOk.addEventListener("click", () => {
    const theme = themeInput.value.trim();
    if (!theme) {
      alert(L.alertNoTheme);
      themeInput.focus();
      return;
    }
    modalOverlay.classList.remove("visible");
    generatePage(theme);
  });

  modalCancel.addEventListener("click", () => {
    modalOverlay.classList.remove("visible");
  });

  themeInput.addEventListener("input", () => {
    themeInput.style.height = "auto";
    themeInput.style.height = themeInput.scrollHeight + "px";
  });

  themeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      modalOk.click();
    } else if (e.key === "Escape") {
      e.preventDefault();
      modalCancel.click();
    }
  });

  (function applyLocalization() {
    pageTitleEl.textContent = L.pageTitle;
    descText.textContent = L.startDescription;
    startButton.textContent = L.startButton;
    startButton.setAttribute('aria-label', L.startButton);
    loadingText.textContent = L.loadingText;
    downloadBtn.setAttribute('title', L.downloadTitle);
    downloadBtn.setAttribute('aria-label', L.downloadAria);
    sponsorCloseBtn.textContent = L.sponsorClose;
    sponsorCloseBtn.setAttribute('aria-label', L.sponsorClose);
    modalLabel.textContent = L.promptLabel;
    themeInput.placeholder = L.promptPlaceholder;
    modalOk.textContent = L.modalOk;
    modalCancel.textContent = L.modalCancel;
    document.title = L.pageTitle;
  })();
})();