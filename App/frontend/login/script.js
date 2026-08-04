function handleCredentialResponse(response) {
  // JWT token Google returns
  const token = response.credential;

  // Decode payload
  const payload = JSON.parse(atob(token.split(".")[1]));

  console.log("ID:", payload.sub);
  console.log("Name:", payload.name);
  console.log("Email:", payload.email);
  console.log("Picture:", payload.picture);

  window.location.href = "./student/dashboard-aluno/dashboard-aluno.html";
}

// in your login page JS, after result.success:
localStorage.setItem("session", JSON.stringify(result.user));
