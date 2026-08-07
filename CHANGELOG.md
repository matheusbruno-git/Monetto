# Monetto — fixes applied (DashboardAdminEscolar / school-admin scope)

This only touches `App/`, `main.js`, `preload.js`, `database.sql`. Drop these
into your project (overwrite the existing ones) — `node_modules` and the
Electron binary weren't touched, so no need to re-download anything.

## 1. The root cause: login never created a session

This is why the dashboard showed nothing. The chain was:

- `login-principal.html` called `window.api.login()` but only used
  `result.redirect` — it never saved anything to `localStorage`.
- `main.js`'s `login` handler didn't return user data anyway (just
  `{success, message, redirect}`), so there was nothing to save even if it tried.
- Every school-admin page expects `localStorage.getItem('session')` to hold
  `{id, id_escola, nome, ...}` (see `CRUD_Turmas/script.js`, which already did
  this correctly).
- So `getDashboardAdminEscolar()` always ran with no user id, and the backend
  always replied "Usuário não está associado a uma escola."

**Fixed:** `main.js` login now returns `{id, nome, email, id_perfil, id_escola}`
and stamps `ultimo_acesso`; `login-principal.html` saves that to
`localStorage.session`; `preload.js` now actually forwards the user id to
`getDashboardAdminEscolar` (it was invoking it with zero arguments before).

## 2. Missing IPC handlers

`preload.js` exposed `registerAluno`, `registerProfessor`, and
`addAlunoToTurma` to the frontend, but `main.js` had no matching
`ipcMain.handle(...)` for any of them — calling them would just throw.
Added all three, wired to the existing (now-fixed) backend files.

## 3. Broken SQL

- `create_professor.js` had `CREATE TABLE`-style column definitions pasted
  literally inside an `INSERT` statement — guaranteed SQL syntax error.
  Rewritten from scratch.
- `create_aluno.js` listed 10 columns but only supplied 9 value placeholders
  — guaranteed "column count doesn't match value count" error. Rewritten.
- `create_user.js` / `create_aluno.js` generated a UUID string and inserted it
  into `id_usuario`, but that column is `INT AUTO_INCREMENT` in the schema.
  Removed the UUID generation; both now let MySQL auto-increment and return
  `insertId`.
- `database.sql`: `ALTER TABLE IF EXISTS ... ADD IF NOT EXISTS COLUMN ... ADD
  FOREIGN KEY IF NOT EXISTS` is not valid MySQL syntax at all — this statement
  would just fail, meaning `usuarios.id_turma` never actually got created and
  every "assign student to class" feature was broken. Replaced with valid
  syntax, plus added `responsavel`, `telefone_responsavel`,
  `email_responsavel`, and `serie` columns that `create_aluno.js` needs but
  the schema never defined.

## 4. `getDashboardAdminEscolar` query bugs (main.js)

- Referenced a `data_ultimo_login` column that never existed anywhere in the
  schema (the real column is `ultimo_acesso`) — silently caught and always
  returned 0.
- Queried `progresso_aluno.id_escola`, but that table has no such column —
  fixed by joining through `usuarios` instead.
- The school-name lookup was `SELECT nome FROM escolas LIMIT 1` — always
  returned the *first* school in the database, regardless of who was logged
  in. Now filtered by the logged-in admin's actual `id_escola`.

## 5. Session / logout plumbing (`monetto-app.js`)

Several pages had `onclick="sairDaConta(...)"` with a comment saying
"handled by monetto-app.js" — but that file never defined it. Rewrote
`monetto-app.js` to:
- expose `sairDaConta(destino)` (clears the session, confirms, redirects)
- dispatch a `monetto:ready` event with the session's user data (the
  dashboard page already listens for this to fill in the admin's name)
- pass the logged-in user's id into `getDashboardAdminEscolar()`

## 6. Wrong file paths (silent 404s)

- `<script src="../shared/monetto-app.js">` was wrong in **7 files** — from
  `admin_school/<page>/`, that's one directory too shallow. Should be
  `../../shared/monetto-app.js`. Fixed in all 7 (plus the sidebar component's
  own logout link, which had the same off-by-one issue for
  `login-principal.html`).
- Every "Sair da conta" link across school-admin pages pointed to
  `../login-principal/login-principal.html`, but that page actually lives at
  `App/frontend/user/login-principal/`. Fixed in all 9 files.
  (Note: this same wrong-path pattern also exists in the teacher/student/
  admin_general folders — left alone since you said you're focused on
  school-admin, but worth a find-and-replace pass later.)

## 7. JS syntax errors that would silently kill a whole `<script>` block

- `gerenciar-alunos.html` and `gerenciar-professores.html` each had a stray
  orphan `}` right after the `/* sairDaConta handled by monetto-app.js */`
  comment — a straight syntax error. Removed.
- `dashboard-admin-escolar/script.js` had a top-level `await` outside any
  async function (syntax error) — turned out it wasn't even linked from the
  HTML, so it was dead code. Cleaned it up to just the sidebar-loading bit it
  was actually meant to do.

## 8. Duplicate / dead code

- `admin-alunos/script.js` was a byte-for-byte copy of `CRUD_Aluno/script.js`
  (hardcoded `id_escola: "123"`, wrong field IDs for that page's real modal)
  and wasn't even `<script src>`'d from `admin-alunos.html`. Deleted; the
  page's own inline script now does the real work (see next item).
- `gerenciar-professores.html` rendered **two sidebars** — a hardcoded
  `<nav>` plus an empty `#sidebar-container` that `script.js` filled with a
  second one fetched from the shared component. Removed the redundant
  container + script include.

## 9. Actually wired up the "add" forms

These previously had no working submit path at all:

- **`admin-alunos.html`**: the "Matricular Aluno" modal button had no click
  handler. Gave its fields real `id`s and wired it to `registerAluno`,
  refreshing the list on success. Dropped the fake "Turma" dropdown (static
  options, not real data, and turma assignment is a separate step via
  `addAlunoToTurma`) in favor of a "Série" field that matches the schema.
- **`gerenciar-professores.html`**: the whole page's data-binding used
  Alpine.js directives (`x-data`, `x-text`) but Alpine was never loaded via
  CDN, so none of it ever ran. Replaced with plain JS matching the pattern
  used elsewhere (`monetto-app.js` fills in `#school-name`,
  `#professores-count`, etc.), and wired the "Adicionar Professor" modal to
  `registerProfessor`. Dropped the Disciplina/Permissão/Turmas fields in that
  modal since there's no backend support for any of that yet.
- **`CRUD_Aluno/script.js`** and **`CRUD_Professor/script.js`** (the bare
  test-form pages): replaced hardcoded `id_escola: "123"` with the real value
  from the session, and added visible success/error feedback instead of just
  `console.log`.
- Both `create_aluno.js` and `create_professor.js` now generate a temporary
  password for new accounts (since the admin forms don't collect one) and
  return it in the response so you can hand it to the student/teacher.

## What I didn't touch

- `admin-relatorios`, `admin-configuracoes`, `admin-dados-escola`,
  `admin-permissoes`, `admin-professores` are still static mockups with no
  real data wiring — I only fixed the things that would crash or 404
  (script path, logout path). Turning these into functional pages is a
  bigger job than a bug-fix pass.
- The wrong-path bugs in `teacher/`, `student/`, `admin_general/` (same
  `../login-principal/...` issue) — flagged above, not fixed, since you said
  your focus is school-admin.
