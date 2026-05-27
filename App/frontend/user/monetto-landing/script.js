document.getElementById("btn").addEventListener("click", async () => {

    const dados = {
        id_escola: "ID",
        nome: document.getElementById("nome").value,
        data_nascimento: document.getElementById("data").value,
        cpf: document.getElementById("cpf").value,
        responsavel: document.getElementById("resp").value,
        telefone_responsavel: document.getElementById("tel").value,
        email_responsavel: document.getElementById("email").value,
        serie: document.getElementById("serie").value
    };

    const result = await window.api.registerAluno(dados);

    document.getElementById("msg").innerText = result.message;
});