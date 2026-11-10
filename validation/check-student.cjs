/* Visual QA: API is simulated in the browser; this never connects to the database.
 * Usage: node validation/check-student.cjs [path-to-playwright-package]
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const names = ['dashboard-aluno', 'tarefas-aluno', 'modulo-aprendizado', 'jogos-quiz', 'recompensas', 'configuracoes'];
const widths = [1920, 1440, 1366, 1024, 768, 480, 375];
const fixture = {
  student: {id_usuario:1, nome:'Mariana de Albuquerque Oliveira', email:'mariana.albuquerque@escola-exemplo.com.br', id_turma:1, turma:'9º ano B — Educação Financeira', escola:'Escola Municipal de Educação e Desenvolvimento Financeiro', xp_atual:640, xp_proximo_nivel:1000, nivel_atual:7, sequencia_dias:5, pontos_totais:640, percentual_conclusao:40},
  stats: {totalTasks:5, pendingTasks:3, completedTasks:2, completionRate:40},
  tasks: Array.from({length:5}, (_,i)=>({id_tarefa:i+1, titulo:['Planejamento financeiro: como organizar o orçamento familiar e construir uma reserva de emergência','Porcentagens e juros nas compras do dia a dia','Consumo consciente e decisões responsáveis','Minha primeira poupança','Investimentos e objetivos de longo prazo'][i], descricao:'Leia o material da aula e desenvolva sua resposta considerando as necessidades, os desejos e os objetivos financeiros da sua família.', professor:'Professora Ana Carolina de Souza', nome_professor:'Professora Ana Carolina de Souza', materia:['Matemática Financeira','Educação Financeira','Geografia','Matemática Financeira','Educação Financeira'][i], disciplina:'Educação Financeira', xp:50, pontos:50, pontos_xp:50, xp_recompensa:50, data_vencimento:new Date(Date.now()+(i-1)*86400000).toISOString(), concluida:i>2})),
  ranking: Array.from({length:5}, (_,i)=>({id_usuario:i+1, nome:['Mariana de Albuquerque Oliveira','João Pedro Fernandes da Silva','Ana Clara Mendes','Lucas Henrique','Beatriz Carvalho'][i], xp:900-i*65})),
  deliveries: [{id_tarefa:4, titulo:'Minha primeira poupança', xp_ganho:50, data_entrega:new Date().toISOString()}],
  rewards: [{nome:'Primeiro Login', descricao:'Você iniciou sua jornada financeira', tipo:'atividade', data_conquista:new Date().toISOString()}]
};

const report = { date:new Date().toISOString(), fixture:true, cases:[], interactions:[], contrast:[], textContrast:[], errors:[], browser:'' };
let browser;
const server = http.createServer(async (req,res)=>{
  try {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
    const buf = await fs.readFile(file);
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.ico':'image/x-icon'})[path.extname(file)] || 'application/octet-stream');
    res.end(buf);
  } catch {res.writeHead(404).end();}
});

async function measure(page) {
  return page.evaluate(()=>{
    const shown = e => {const s=getComputedStyle(e);return s.visibility!=='hidden' && s.display!=='none' && e.getClientRects().length && Number(s.opacity)!==0;};
    const overflow = [...document.querySelectorAll('.main *, .app-header *, .sidebar *')].filter(shown).filter(e=>{
      const r=e.getBoundingClientRect();return r.right>innerWidth+1 || r.left < -1;
    }).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,70)})).slice(0,12);
    const main=document.querySelector('.main').getBoundingClientRect();
    const styles=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(e=>!e.href.startsWith('https:')).map(e=>({href:e.getAttribute('href'),loaded:!!e.sheet,rules:e.sheet?.cssRules.length}));
    const sidebar=document.querySelector('.sidebar'),button=document.getElementById('appMenuBtn');
    const navigation={hidden:getComputedStyle(sidebar).visibility==='hidden' && sidebar.getBoundingClientRect().right<=1,buttonVisible:getComputedStyle(button).display!=='none',expanded:button.getAttribute('aria-expanded')};
    return {viewport:innerWidth, scrollWidth:document.documentElement.scrollWidth, overflow, main:{left:main.left,top:main.top,width:main.width}, styles, navigation, activeLinks:document.querySelectorAll('.sidebar .sb-link.active').length};
  });
}

async function auditTextContrast(page) {
  return page.evaluate(()=>{
    const rgb=s=>{const m=s.match(/[\d.]+/g),scale=s.startsWith('color(srgb')?255:1;return m?[+m[0]*scale,+m[1]*scale,+m[2]*scale,m[3]===undefined?1:+m[3]]:[0,0,0,0];};
    const blend=(fg,bg,a=fg[3])=>fg.slice(0,3).map((v,i)=>v*a+bg[i]*(1-a));
    const lum=c=>{const a=c.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
    const failures=[];
    for(const e of document.querySelectorAll('.main *')) {
      if(![...e.childNodes].some(n=>n.nodeType===3&&/[\p{L}\p{N}]/u.test(n.textContent)) || !e.getClientRects().length)continue;
      const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)continue;
      let bg=[255,255,255],chain=[];for(let n=e;n;n=n.parentElement)chain.unshift(n);
      let opacity=1;
      for(const n of chain){const ns=getComputedStyle(n);bg=blend(rgb(ns.backgroundColor),bg);opacity*=+ns.opacity;}
      const fg=blend(rgb(s.color),bg,opacity);const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      const large=parseFloat(s.fontSize)>=24 || (parseFloat(s.fontSize)>=18.66 && +s.fontWeight>=700);
      if(ratio<(large?3:4.5)-.03 && !e.closest('button:disabled'))failures.push({cls:e.className,text:e.textContent.trim().slice(0,80),ratio:+ratio.toFixed(2),fg:s.color,opacity});
    }
    return failures;
  });
}

function assertInteraction(name, state, detail) {
  report.interactions.push({name,pass:!!state,detail});
}

async function checkContrast(page,theme) {
  const colors=await page.evaluate(()=>{
    const s=getComputedStyle(document.documentElement);
    return Object.fromEntries(['text','muted','surface','surface-2','brand','brand-soft','brand-ink','nav-text','nav-muted','nav-bg','gold','danger','ok'].map(k=>[k,s.getPropertyValue('--'+k).trim()]));
  });
  const lum=hex=>{const rgb=hex.replace('#','').match(/../g).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
  for(const [fg,bg] of [['text','surface'],['muted','surface'],['muted','surface-2'],['brand','brand-soft'],['brand-ink','brand'],['nav-text','nav-bg'],['nav-muted','nav-bg'],['gold','surface'],['danger','surface'],['ok','surface']]) {
    const a=lum(colors[fg]),b=lum(colors[bg]),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    report.contrast.push({theme,foreground:fg,background:bg,ratio:Number(ratio.toFixed(2)),pass:ratio>=4.5});
  }
}

async function run() {
  await fs.mkdir(path.join(__dirname,'screenshots'), {recursive:true});
  await new Promise(resolve=>server.listen(4174,'127.0.0.1',resolve));
  browser = await chromium.launch({channel:'chrome',headless:true});
  report.browser = browser.version();
  for (const name of names) {
    const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    await context.route('https://fonts.googleapis.com/**', route=>route.fulfill({body:'',contentType:'text/css'}));
    await context.addInitScript(data=>{
      localStorage.setItem('session',JSON.stringify({id_usuario:1,id:1,nome:data.student.nome,email:data.student.email,id_perfil:1}));
      if(!localStorage.getItem('monetto-theme')) localStorage.setItem('monetto-theme','light');
      window.__qaCalls=[];
      window.api={
        getStudentDashboard:async()=>({success:true,data:structuredClone(data)}),
        getAluno:async()=>({success:true,data:{...data.student},aluno:{...data.student}}),
        updateAluno:async(...args)=>{window.__qaCalls.push(['updateAluno',args]);return {success:true};},
        changeAlunoPassword:async()=>({success:true}),
        completeStudentTask:async(...args)=>{window.__qaCalls.push(['completeStudentTask',args]);return {success:true};},
        awardStudentXp:async(...args)=>{window.__qaCalls.push(['awardStudentXp',args]);return {success:true,amount:args[1]};}
      };
    },fixture);
    const page = await context.newPage();
    page.on('pageerror', e=>report.errors.push({name,type:'runtime',message:e.message}));
    page.on('response', r=>{if(r.url().startsWith('http://127.0.0.1:4174') && r.status()>=400)report.errors.push({name,type:'http',status:r.status(),url:r.url()});});
    await page.goto(`http://127.0.0.1:4174/App/frontend/student/${name}/${name}.html`);
    await page.waitForSelector('.sidebar .sb-link', {state:'attached'});
    await page.waitForFunction(()=>window.studentData);
    for (const theme of ['light','dark']) {
      await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.body.classList.toggle('theme-dark',theme==='dark');localStorage.setItem('monetto-theme',theme);},theme);
      if(name==='dashboard-aluno') await checkContrast(page,theme);
      for (const width of widths) {
        await page.setViewportSize({width,height:width>768?900:812});
        await page.waitForTimeout(220);
        const metrics=await measure(page);
        report.cases.push({name,theme,width,...metrics,pass:metrics.scrollWidth<=width+1 && !metrics.overflow.length && metrics.styles.every(s=>s.loaded && s.rules>0) && metrics.activeLinks===1 && metrics.main.top>=64 && Math.abs(metrics.main.left)<1 && metrics.navigation.hidden && metrics.navigation.buttonVisible && metrics.navigation.expanded==='false'});
        if (width===1440 || width===375) await page.screenshot({path:path.join(__dirname,'screenshots',`${name}-${theme}-${width}.png`),fullPage:true});
        if(name==='dashboard-aluno') {
          await page.locator('#appMenuBtn').click();
          const animation=await page.locator('.sidebar').evaluate(e=>({running:e.getAnimations().some(a=>a.playState==='running'),duration:parseFloat(getComputedStyle(e).transitionDuration)}));
          assertInteraction(`navigation: animated opening ${width} ${theme}`,animation.running && animation.duration>0,animation);
          await page.waitForTimeout(220);
          const drawer=await page.locator('.sidebar').boundingBox();
          assertInteraction(`navigation: opens on icon ${width} ${theme}`,await page.locator('.sidebar').isVisible() && await page.locator('#appMenuBtn').getAttribute('aria-expanded')==='true' && Math.abs(drawer.x)<1,drawer);
          if(width===1440 || width===375) await page.screenshot({path:path.join(__dirname,'screenshots',`navigation-open-${theme}-${width}.png`)});
          await page.locator('#appMenuBtn').click();
          await page.waitForTimeout(220);
          assertInteraction(`navigation: icon closes drawer ${width} ${theme}`,!await page.locator('.sidebar').isVisible() && await page.locator('#appMenuBtn').getAttribute('aria-expanded')==='false');
          if(width===1440) {
            await page.locator('#appMenuBtn').click();
            await page.waitForTimeout(220);
            await page.mouse.click(width-16,90);
            await page.waitForTimeout(220);
            assertInteraction(`navigation: outside click closes ${theme}`,!await page.locator('.sidebar').isVisible());
          }
        }
      }
      report.textContrast.push({name,theme,failures:await auditTextContrast(page)});
    }
    await page.setViewportSize({width:375,height:812});
    await page.locator('#appMenuBtn').click();
    await page.waitForTimeout(220);
    assertInteraction(`${name}: mobile menu opens`,await page.locator('#appMenuBtn').getAttribute('aria-expanded')==='true' && await page.locator('.sidebar').isVisible());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);
    assertInteraction(`${name}: Escape closes menu`,await page.locator('#appMenuBtn').getAttribute('aria-expanded')==='false');
    await page.locator('#appThemeBtn').click();
    assertInteraction(`${name}: theme toggle`,await page.locator('html').getAttribute('data-theme')==='light' && await page.evaluate(()=>localStorage.getItem('monetto-theme'))==='light');
    await page.reload();
    await page.waitForFunction(()=>window.studentData);
    assertInteraction(`${name}: saved theme survives reload`,await page.locator('html').getAttribute('data-theme')==='light');
    if (await page.locator('.notif-btn').count()) {
      await page.locator('.notif-btn').click();
      const popup=await page.locator('#student-notification-popup').boundingBox();
      assertInteraction(`${name}: notification fits mobile`,popup && popup.x>=0 && popup.x+popup.width<=375 && popup.y+popup.height<=812,popup);
      await page.locator('.notif-btn').click();
    }
    if (name==='tarefas-aluno') {
      await page.locator('.search-wrap input').fill('poupança');
      assertInteraction('tasks: search keeps matching item',await page.locator('.task-list-card .task-item').count()===1);
      await page.locator('.search-wrap input').fill('');
      await page.locator('[data-filter="concluidas"]').click();
      assertInteraction('tasks: completed filter',await page.locator('.task-list-card .task-item').count()===2);
      await page.locator('[data-filter="todas"]').click();
      const control=page.locator('[data-toggle-task]').first();
      await control.click();
      assertInteraction('tasks: completion handler',await page.evaluate(()=>window.__qaCalls.some(c=>c[0]==='completeStudentTask')));
    }
    if (name==='configuracoes') {
      await page.locator('.av-opt').nth(1).click();
      assertInteraction('settings: avatar preview',await page.locator('#profile-big-av').innerText().then(t=>t.includes('🦊')));
      for (const tab of ['notif','priv','conta','perfil']) {
        await page.locator(`.set-nav-item[onclick*="'${tab}'"]`).click();
        const m=await measure(page);
        assertInteraction(`settings: ${tab} tab fits mobile`,await page.locator('#tab-'+tab).isVisible() && m.scrollWidth<=375 && !m.overflow.length,m.overflow);
        if(tab==='notif'){
          const toggle=page.locator('#tab-notif .toggle').first();const before=await toggle.getAttribute('class');await toggle.focus();await page.keyboard.press('Space');
          assertInteraction('settings: notification toggle keyboard',await toggle.getAttribute('class')!==before);
          await page.locator('#salvar_notificacoes').click();
          await page.waitForTimeout(220);
          const toast=await page.locator('#toast').boundingBox();
          assertInteraction('settings: toast fits mobile',await page.locator('#toast').isVisible() && toast.x>=0 && toast.x+toast.width<=375,toast);
        }
      }
      assertInteraction('settings: labels associated',await page.locator('.field-group input, .field-group textarea').evaluateAll(inputs=>inputs.every(e=>document.querySelector(`label[for="${e.id}"]`))));
      assertInteraction('settings: full school and class visible',await page.locator('#escola_usuario, #turma_usuario').evaluateAll(fields=>fields.every(e=>e.scrollHeight<=e.clientHeight+1 && e.disabled)));
    }
    if (name==='jogos-quiz') {
      for(const theme of ['light','dark']) {
        await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.body.classList.toggle('theme-dark',theme==='dark');},theme);
        for(const width of widths) {
          await page.setViewportSize({width,height:width>768?900:812});
          await page.locator('.play-btn').first().click();
          const dialog=await page.locator('.quiz-modal').boundingBox();
          assertInteraction(`quiz: dialog fits ${width} ${theme}`,dialog && dialog.x>=0 && dialog.x+dialog.width<=width && dialog.y>=0 && dialog.y+dialog.height<=(width>768?900:812),dialog);
          if(width===375 || width===1440) await page.screenshot({path:path.join(__dirname,'screenshots',`quiz-dialog-${theme}-${width}.png`)});
          await page.locator('.quiz-close').click();
        }
      }
      await page.setViewportSize({width:375,height:812});
      await page.locator('.play-btn').first().click();
      await page.locator('#qOptions .q-opt').first().click();
      assertInteraction('quiz: answer feedback',await page.locator('#qNext').isVisible() && await page.locator('#qOptions .correct').count()>0);
      await page.screenshot({path:path.join(__dirname,'screenshots','quiz-feedback-dark-375.png')});
      while(await page.locator('#quizScreen').isVisible()) {
        if(!await page.locator('#qNext').isVisible()) await page.locator('#qOptions .q-opt').first().click();
        await page.locator('#qNext').click();
      }
      assertInteraction('quiz: score screen',await page.locator('#scoreScreen').isVisible());
      assertInteraction('quiz: XP handler preserved',await page.evaluate(()=>window.__qaCalls.some(c=>c[0]==='awardStudentXp')));
      await page.screenshot({path:path.join(__dirname,'screenshots','quiz-score-dark-375.png')});
      await page.locator('.btn-retry').click();
      assertInteraction('quiz: retry works',await page.locator('#quizScreen').isVisible() && await page.locator('#qLabel').textContent().then(t=>t.includes('1')));
      await page.locator('.quiz-close').click();
      assertInteraction('quiz: close works',!await page.locator('#quizOverlay').isVisible());
    }
    if(name==='modulo-aprendizado') {
      const before=await page.locator('.lp-meta > strong').textContent();
      assertInteraction('learning: lesson rendered',await page.locator('.lesson-body, .lp-body').count()>0);
      const next=page.locator('.btn-next');
      await next.click();
      assertInteraction('learning: next changes lesson',await page.locator('.lp-meta > strong').textContent()!==before);
      assertInteraction('learning: existing local progress saved',await page.evaluate(()=>JSON.parse(localStorage.getItem('monetto_learning_completed_1')||'[]').length>0));
    }
    await context.close();
    console.log(`Checked ${name}`);
  }
  report.summary={cases:report.cases.length,passed:report.cases.filter(c=>c.pass).length,interactions:report.interactions.length,interactionsPassed:report.interactions.filter(c=>c.pass).length,contrast:report.contrast.length,contrastPassed:report.contrast.filter(c=>c.pass).length,textContrastFailures:report.textContrast.flatMap(c=>c.failures).length,errors:report.errors.length};
  await fs.writeFile(path.join(__dirname,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({summary:report.summary,failedCases:report.cases.filter(c=>!c.pass),failedInteractions:report.interactions.filter(c=>!c.pass),failedContrast:report.contrast.filter(c=>!c.pass),textContrast:report.textContrast.filter(c=>c.failures.length),errors:report.errors},null,2));
}
run().catch(async error=>{report.errors.push({type:'runner',message:error.stack});await fs.writeFile(path.join(__dirname,'results.json'),JSON.stringify(report,null,2));console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
