// Google Sign-In callback (if you still use it)
function handleCredentialResponse(response) {
  const token = response.credential;
  const payload = JSON.parse(atob(token.split(".")[1]));

  console.log("Google ID:", payload.sub);
  console.log("Name:", payload.name);
  console.log("Email:", payload.email);

  // TODO: send the Google token to the backend and get a real user object
  // For now we just redirect (you will need a proper backend endpoint later)
  // window.location.href = "./student/dashboard-aluno/dashboard-aluno.html";
}

// Optional: keep the Enter-key helper if you want it in the external file too
// (the HTML already has one)