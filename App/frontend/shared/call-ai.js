async function loadLesson(moduleCode) {

    const resultContainer = document.getElementById("lessonContent");
    const loading = document.getElementById("loading");

    loading.style.display = "block";
    resultContainer.textContent = "";

    try {
        const result = await window.api.generateLesson(moduleCode);

        if (!result.success) {
            throw new Error(result.message);
        }

        resultContainer.textContent = result.content;

    } catch (error) {
        console.error(error);

        resultContainer.textContent =
            "Não foi possível gerar a aula.";

    } finally {
        loading.style.display = "none";
    }
}

// Test
loadLesson("EM13MAT203");