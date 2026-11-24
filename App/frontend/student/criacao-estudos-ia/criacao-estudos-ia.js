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
  const modelHint = document.getElementById("modelHint");
  const titles = Object.fromEntries(Array.from(document.querySelectorAll("#moduleCode option"), (option) => [option.value, option.textContent]));
  const modelHints = {
    "gemini-4-hydrogen": "Modelo rápido para estudos do dia a dia. Se estiver ocupado, tente Neon ou Carbon.",
    "gemini-4-neon": "Equilibra respostas rápidas com raciocínio mais aprofundado.",
    "gemini-4-carbon": "Prioriza raciocínio avançado. O uso pela API pode exigir acesso ao tier pago do Gemini.",
    "gemini-decision-1": "Avalia se o módulo está alinhado aos objetivos curriculares e se define evidências de aprendizagem. Este modelo não escreve uma aula.",
    "gemini-nano-banana-2.1": "Cria um infográfico visual sobre o módulo. Requer acesso pago à API Gemini e pode gerar cobrança.",
  };

  const savedModel = localStorage.getItem("monetto_study_model");
  if (savedModel && Array.from(modelSelect.options).some((option) => option.value === savedModel)) {
    modelSelect.value = savedModel;
  }
  modelHint.textContent = modelHints[modelSelect.value];

  function updateModelPresentation() {
    const model = modelSelect.value;
    const decision = model === "gemini-decision-1";
    const imageModel = model === "gemini-nano-banana-2.1";
    button.textContent = decision ? "Avaliar módulo" : imageModel ? "Criar infográfico" : "Gerar meu estudo";
    heroDescription.textContent = decision
      ? "Confira a aderência curricular e os objetivos de uma habilidade da BNCC."
      : imageModel
        ? "Crie um infográfico educativo para visualizar os conceitos da habilidade escolhida."
        : "Escolha uma habilidade da BNCC e gere uma aula personalizada de educação financeira.";
  }
  updateModelPresentation();

  modelSelect.addEventListener("change", () => {
    localStorage.setItem("monetto_study_model", modelSelect.value);
    modelHint.textContent = modelHints[modelSelect.value];
    updateModelPresentation();
  });

  function setStatus(state, title, detail, code = "") {
    status.dataset.state = state;
    statusTitle.textContent = title;
    statusDetail.textContent = detail;
    statusCode.textContent = code ? `Código: ${code}` : "";
    status.hidden = false;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = document.getElementById("moduleCode").value;
    const model = modelSelect.value;
    if (!window.api?.generateLesson) {
      setStatus("error", "Serviço de IA indisponível", "Esta instalação não disponibilizou a API de geração de estudos.");
      return;
    }
    button.disabled = true;
    button.textContent = model === "gemini-decision-1" ? "Avaliando…" : model === "gemini-nano-banana-2.1" ? "Criando infográfico…" : "Gerando aula…";
    setStatus("loading", `${model === "gemini-decision-1" ? "Avaliando" : model === "gemini-nano-banana-2.1" ? "Criando infográfico com" : "Gerando aula com"} ${modelSelect.selectedOptions[0].textContent.split(" · ")[0]}`, "A solicitação está em andamento. Isso pode levar alguns segundos.");
    resultPanel.hidden = true;
    image.hidden = true;
    image.removeAttribute("src");
    try {
      const response = await window.api.generateLesson(code, model);
      if (!response?.success || (!response.content && !response.imageData)) {
        const error = new Error(response?.message || "Não foi possível gerar o estudo.");
        error.code = response?.errorCode;
        throw error;
      }
      document.getElementById("lessonTitle").textContent = model === "gemini-decision-1" ? `Avaliação curricular · ${code}` : model === "gemini-nano-banana-2.1" ? `Infográfico · ${code}` : titles[code] || "Aula gerada";
      content.textContent = response.content;
      if (response.imageData) {
        image.src = `data:${response.imageMimeType || "image/png"};base64,${response.imageData}`;
        image.hidden = false;
      }
      resultPanel.hidden = false;
      setStatus("success", model === "gemini-decision-1" ? "Avaliação pronta" : model === "gemini-nano-banana-2.1" ? "Infográfico pronto" : "Estudo pronto", model === "gemini-decision-1" ? "Revise os critérios avaliados e use o resultado como apoio." : model === "gemini-nano-banana-2.1" ? "Confira o infográfico abaixo." : "Leia o conteúdo e anote suas dúvidas.");
    } catch (error) {
      const message = error.message || "Erro ao gerar o estudo. Tente novamente.";
      const normalized = message.toLowerCase();
      if (error.code === 503 || normalized.includes("high demand") || normalized.includes("alta demanda") || normalized.includes("overload") || normalized.includes("capacity")) {
        setStatus("error", "Modelo temporariamente com alta demanda", `${message} Você pode tentar novamente ou escolher outro modelo.` , error.code);
      } else if (error.code === 429 || normalized.includes("resource_exhausted") || normalized.includes("quota") || normalized.includes("rate limit")) {
        setStatus("error", "Limite de uso da Gemini atingido", `${message} Os limites podem variar por modelo. Aguarde um pouco ou tente outro modelo.`, error.code || 429);
      } else {
        setStatus("error", "Não foi possível gerar o estudo", message, error.code);
      }
    } finally {
      button.disabled = false;
      updateModelPresentation();
    }
  });
})();
