async function loadUsers() {
  const users = await window.api.getUsers();
  console.log(users);
}

loadUsers();