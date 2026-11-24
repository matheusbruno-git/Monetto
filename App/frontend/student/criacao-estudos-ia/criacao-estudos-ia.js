(() => {
  const form = document.getElementById("studyForm");
  const button = document.getElementById("generateButton");
  const status = document.getElementById("studyStatus");
  const statusTitle = document.getElementById("studyStatusTitle");
  const statusDetail = document.getElementById("studyStatusDetail");
  const statusCode = document.getElementById("studyStatusCode");
  const resultPanel = document.getElementById("studyResult");
  const content = document.getElementById("lessonContent");
  const image = document.getElementById("lessonImage");
  const heroDescription = document.querySelector(".study-hero p");
  const modelSelect = document.getElementById("modelCode");
  const studyLevelSelect = document.getElementById("studyLevel");
  const modelHint = document.getElementById("modelHint");
  const titles = Object.fromEntries(
    Array.from(document.querySelectorAll("#moduleCode option"), (option) => [option.value, option.textContent])
  );

  const modelHints = {
    "openai/gpt-oss-120b": "Modelo robusto para explicações detalhadas e raciocínio estruturado na Groq.",
    "llama-3.3-70b-versatile": "Equilibra velocidade e qualidade de explicação para aulas completas.",
    "llama-3.1-8b-instant": "Resposta mais rápida para revisões ágeis do dia a dia.",
  };

  const savedModel = localStorage.getItem("monetto_study_model");
  if (savedModel && Array.from(modelSelect.options).some((option) => option.value === savedModel)) {
    modelSelect.value = savedModel;
  }
  modelHint.textContent = modelHints[modelSelect.value] || "";

  function updateModelPresentation() {
    button.textContent = "Gerar meu estudo";
    heroDescription.textContent = "Escolha uma habilidade da BNCC e gere uma aula personalizada de educação financeira.";
  }
  updateModelPresentation();

  modelSelect.addEventListener("change", () => {
    localStorage.setItem("monetto_study_model", modelSelect.value);
    modelHint.textContent = modelHints[modelSelect.value] || "";
    updateModelPresentation();
  });

  function setStatus(state, title, detail, code = "") {
    status.dataset.state = state;
    statusTitle.textContent = title;
    statusDetail.textContent = detail;
    statusCode.textContent = code ? `Código: ${code}` : "";
    status.hidden = false;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatInline(text) {
    let out = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
    out = escapeHtml(out);
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    return out;
  }

  function isTableSeparator(line) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    if (!trimmed) return false;
    return trimmed.split("|").every((cell) => /^\s*:?-{2,}:?\s*$/.test(cell));
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function renderMarkdownToHtml(markdown) {
    const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        html.push("<hr />");
        i++;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 4);
        html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
        i++;
        continue;
      }

      if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = splitTableRow(lines[i]);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().includes("|") && !isTableSeparator(lines[i])) {
          rows.push(splitTableRow(lines[i]));
          i++;
        }
        const thead = `<thead><tr>${headers.map((h) => `<th>${formatInline(h)}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${formatInline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody>`;
        html.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        const quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        html.push(`<blockquote><p>${quoteLines.map(formatInline).join("<br />")}</p></blockquote>`);
        continue;
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(`<li>${formatInline(lines[i].trim().replace(/^[-*+]\s+/, ""))}</li>`);
          i++;
        }
        html.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      if (/^\d+[.)]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
          items.push(`<li>${formatInline(lines[i].trim().replace(/^\d+[.)]\s+/, ""))}</li>`);
          i++;
        }
        html.push(`<ol>${items.join("")}</ol>`);
        continue;
      }

      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,4})\s+/.test(lines[i].trim()) &&
        !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
        !/^>\s?/.test(lines[i].trim()) &&
        !/^[-*+]\s+/.test(lines[i].trim()) &&
        !/^\d+[.)]\s+/.test(lines[i].trim()) &&
        !(lines[i].trim().includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
      ) {
        paraLines.push(lines[i].trim());
        i++;
      }
      html.push(`<p>${paraLines.map(formatInline).join("<br />")}</p>`);
    }

    return html.join("\n");
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("moduleCode").value;
    const model = modelSelect.value;
    const studyLevel = studyLevelSelect?.value || "";

    if (!window.api?.generateLesson) {
      setStatus("error", "Serviço de IA indisponível", "Esta instalação não disponibilizou a API de geração de estudos.");
      return;
    }

    button.disabled = true;
    button.textContent = "Gerando aula…";
    setStatus(
      "loading",
      `Gerando aula com ${modelSelect.selectedOptions[0].textContent.split(" · ")[0]}`,
      "A solicitação está em andamento. Isso pode levar alguns segundos."
    );
    resultPanel.hidden = true;
    image.hidden = true;
    image.removeAttribute("src");

    try {
      const response = await window.api.generateLesson(code, model, studyLevel);
      if (!response?.success || (!response.content && !response.imageData)) {
        const error = new Error(response?.message || "Não foi possível gerar o estudo.");
        error.code = response?.errorCode;
        throw error;
      }

      document.getElementById("lessonTitle").textContent = titles[code] || "Aula gerada";

      // Placed right here after setting the lesson title and before showing resultPanel:
      content.innerHTML = renderMarkdownToHtml(response.content || "");

      if (response.imageData) {
        image.src = `data:${response.imageMimeType || "image/png"};base64,${response.imageData}`;
        image.hidden = false;
      }

      resultPanel.hidden = false;
      setStatus("success", "Estudo pronto", "Leia o conteúdo e anote suas dúvidas.");
    } catch (error) {
      const message = error.message || "Erro ao gerar o estudo. Tente novamente.";
      const normalized = message.toLowerCase();
      if (
        error.code === 503 ||
        normalized.includes("high demand") ||
        normalized.includes("alta demanda") ||
        normalized.includes("overload") ||
        normalized.includes("capacity")
      ) {
        setStatus(
          "error",
          "Modelo temporariamente com alta demanda",
          `${message} Você pode tentar novamente ou escolher outro modelo.`,
          error.code
        );
      } else if (
        error.code === 429 ||
        normalized.includes("resource_exhausted") ||
        normalized.includes("quota") ||
        normalized.includes("rate limit")
      ) {
        setStatus(
          "error",
          "Limite de uso da Groq atingido",
          `${message} Os limites podem variar por modelo. Aguarde um pouco ou tente outro modelo.`,
          error.code || 429
        );
      } else {
        setStatus("error", "Não foi possível gerar o estudo", message, error.code);
      }
    } finally {
      button.disabled = false;
      updateModelPresentation();
    }
  });
})();