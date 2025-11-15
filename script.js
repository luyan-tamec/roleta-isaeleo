/* elementos */
const canvas = document.getElementById('roleta');
const ctx = canvas.getContext('2d');
const nome = document.getElementById('nome');
const qtd = document.getElementById('quantidade');
const tempo = document.getElementById('tempo');
const overlay = document.getElementById('resultadoOverlay');
const lista = document.getElementById('listaNomes');
const csv = document.getElementById('inputCSV');

/* estado principal */
let nomes = [];
let cores = [];
let angulo = 0;
let girando = false;
let vel = 0;
let intv;
let dur = 5000;
let ultimo = null;
let audioCtx = null;

/* paleta neutra */
const paletaNeutra = [
  "#f5f5f5","#e0e0e0","#cfcfcf","#bdbdbd",
  "#a9a9a9","#9e9e9e","#8a8a8a","#7d7d7d",
  "#707070","#5e5e5e","#444444","#2c2c2c"
];

/* vencedores */
let vencedores = JSON.parse(localStorage.getItem('roleta_vencedores') || '[]');

/* modo de cor salvo */
let modoCor = localStorage.getItem("modoCor") || "colorido";
const modoCorSelect = document.getElementById("modoCor");
if (modoCorSelect) {
  modoCorSelect.value = modoCor;
  modoCorSelect.addEventListener("change", () => {
    modoCor = modoCorSelect.value;
    localStorage.setItem("modoCor", modoCor);
  });
}

/* tema claro/escuro */
let tema = localStorage.getItem("tema") || "escuro";
const btnTema = document.getElementById("btnTema");

function aplicarTema(){
  if(tema === "claro"){
    document.body.classList.add("tema-claro");
    if(btnTema) btnTema.textContent = " Tema";
  } else {
    document.body.classList.remove("tema-claro");
    if(btnTema) btnTema.textContent = " Tema";
  }
}
if(btnTema){
  btnTema.addEventListener("click", () => {
    tema = (tema === "claro") ? "escuro" : "claro";
    localStorage.setItem("tema", tema);
    aplicarTema();
  });
}
aplicarTema();

/* VOLUMES INDEPENDENTES (valores iniciais) */
let volTick = parseFloat(localStorage.getItem("volTick") || 0.6);
let volFinal = parseFloat(localStorage.getItem("volFinal") || 0.8);
let volMusica = parseFloat(localStorage.getItem("volMusica") || 0.5);

/* sliders */
const sliderVolTick = document.getElementById("volTick");
const sliderVolFinal = document.getElementById("volFinal");
const sliderVolMusica = document.getElementById("volMusica");

if(sliderVolTick) sliderVolTick.value = Math.round(volTick * 100);
if(sliderVolFinal) sliderVolFinal.value = Math.round(volFinal * 100);
if(sliderVolMusica) sliderVolMusica.value = Math.round(volMusica * 100);

if(sliderVolTick) sliderVolTick.oninput = e => {
  volTick = e.target.value / 100;
  localStorage.setItem("volTick", volTick);
};

if(sliderVolFinal) sliderVolFinal.oninput = e => {
  volFinal = e.target.value / 100;
  localStorage.setItem("volFinal", volFinal);
};

if(sliderVolMusica) sliderVolMusica.oninput = e => {
  volMusica = e.target.value / 100;
  if(musica) musica.volume = volMusica;
  localStorage.setItem("volMusica", volMusica);
};

/* música */
const musica = new Audio('musica.mp3'); // opcional: coloque musica.mp3 na mesma pasta
musica.loop = true;
musica.volume = volMusica;
let tocandoMusica = false;
const btnMusica = document.getElementById('btnMusica');
if(btnMusica){
  btnMusica.addEventListener('click', () => {
    if(!tocandoMusica){
      musica.currentTime = 0;
      // tentamos tocar, pode falhar se não houver interação do usuário
      musica.play().then(()=> {
        tocandoMusica = true;
        btnMusica.textContent = '⏸ Parar Música';
      }).catch(()=> {
        // fallback silencioso
      });
    } else {
      musica.pause();
      tocandoMusica = false;
      btnMusica.textContent = '🎵 Tocar Música';
    }
  });
}

/* criar audio context para sons curtos */
function ensureAudioContext(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') audioCtx.resume();
}

/* som tic-tic */
function playTick(){
  try{
    ensureAudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1200, audioCtx.currentTime);
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(volTick, audioCtx.currentTime + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.08);
  }catch(e){
    // não quebrar se audio falhar
    // console.warn("playTick falhou:", e);
  }
}

/* som final */
function playStopSound(){
  try{
    ensureAudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(400, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(900, audioCtx.currentTime + 0.06);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(volFinal, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 1.25);
  }catch(e){
    // console.warn("playStopSound falhou:", e);
  }
}

/* função cor aleatória */
function corAleatoria(){
  return `hsl(${Math.floor(Math.random()*360)},75%,60%)`;
}

/* salvar nomes/cores no storage */
function salvar(){
  localStorage.setItem('roleta_nomes', JSON.stringify(nomes));
  localStorage.setItem('roleta_cores', JSON.stringify(cores));
}

/* carregar nomes/cores e vencedores do storage */
function carregar(){
  nomes = JSON.parse(localStorage.getItem('roleta_nomes') || '[]');
  cores = JSON.parse(localStorage.getItem('roleta_cores') || '[]');
  if(cores.length !== nomes.length) cores = nomes.map(()=>corAleatoria());
  atualizar();
  desenhar();
  atualizarVencedores();
}

/* adicionar nome */
function adicionar(){
  const n = nome.value.trim();
  let q = parseInt(qtd.value) || 1;

  if(!n){
    alert("Digite um nome.");
    return;
  }

  for(let i=0;i<q;i++){
    nomes.push(n);
    if(modoCor === "colorido") cores.push(corAleatoria());
    else cores.push(paletaNeutra[Math.floor(Math.random()*paletaNeutra.length)]);
  }

  nome.value = "";
  qtd.value = 1;

  salvar();
  atualizar();
  desenhar();
}

/* remover nome (exposto globalmente para onclick inline) */
function remover(i){
  nomes.splice(i,1);
  cores.splice(i,1);
  salvar();
  atualizar();
  desenhar();
}
window.remover = remover;

/* atualizar lista visual de nomes */
function atualizar(){
  lista.innerHTML = "";
  nomes.forEach((nm,i)=>{
    const d = document.createElement("div");
    d.className = "tagNome";
    d.innerHTML = `${nm} <button onclick="remover(${i})">×</button>`;
    lista.appendChild(d);
  });
}

/* desenhar roleta */
function desenhar(d=-1,b=1){
  const w = canvas.width;
  const h = canvas.height;
  const cx = w/2;
  const cy = h/2;
  const r = Math.min(w,h)/2 - 6;

  ctx.clearRect(0,0,w,h);

  if(!nomes.length){
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = (tema === "claro") ? "#000" : "#fff";
    ctx.stroke();
    return;
  }

  const t = nomes.length;
  const ap = 2*Math.PI / t;

  for(let i=0;i<t;i++){
    const ini = angulo + i*ap;

    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,ini,ini+ap);
    ctx.closePath();

    ctx.fillStyle = (i===d) ? `rgba(255,255,0,${b})` : cores[i];
    ctx.fill();

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(ini + ap/2);
    ctx.textAlign = "right";
    // texto escuro sobre fatias claras; caso queira, poderíamos medir luminosidade
    ctx.fillStyle = "#000";

    let nm = nomes[i];
    ctx.font = `bold ${nm.length>18?12:16}px Arial`;
    if(nm.length>24) nm = nm.substring(0,21) + "...";
    ctx.fillText(nm, r-45, 8);

    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx,cy,r,0,2*Math.PI);
  ctx.lineWidth = 5;
  ctx.strokeStyle = (tema === "claro") ? "#000" : "#fff";
  ctx.stroke();
}

/* detectar ticks (quando a seta passa de fatia) */
function tick(){
  if(!nomes.length) return;
  const ap = 2*Math.PI / nomes.length;
  const arrow = 3*Math.PI/2;
  const rel = ((arrow - angulo) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
  const s = Math.floor(rel / ap);
  if(ultimo === null) { ultimo = s; return; }
  if(s !== ultimo){
    playTick();
    ultimo = s;
  }
}

/* girar roleta */
function girar(){
  if(nomes.length < 1){
    alert("Adicione pelo menos um nome.");
    return;
  }
  if(girando) return;

  overlay.classList.remove('mostrar');

  dur = (parseInt(tempo.value) || 5) * 1000;
  vel = Math.random()*0.35 + 0.5;
  girando = true;
  ultimo = null;

  const ini = Date.now();
  intv = setInterval(()=>{
    const d = Date.now() - ini;
    if(d < dur*0.65) angulo += vel;
    else if(d < dur){ vel *= 0.98; angulo += vel; }
    else { clearInterval(intv); suave(); return; }
    tick();
    desenhar();
  }, 18);
}

/* desaceleração suave */
function suave(){
  let step = () => {
    vel *= 0.96;
    if(vel < 0.0005) vel = 0;
    angulo += vel;
    tick();
    desenhar();
    if(vel > 0) requestAnimationFrame(step);
    else {
      girando = false;
      const t = nomes.length;
      const ap = 2*Math.PI / t;
      const arrow = 3*Math.PI/2;
      const rel = ((arrow - angulo) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
      const i = Math.floor(rel / ap);
      const v = nomes[i];
      playStopSound();
      destacar(i);
      mostrarVencedor(v);
    }
  };
  requestAnimationFrame(step);
}

/* destaque animado */
function destacar(i){
  let b = 1, d = true, rp = 0;
  function anim(){
    desenhar(i,b);
    if(d) b -= 0.1; else b += 0.1;
    if(b <= 0.3){ d = false; rp++; }
    if(b >= 1 && !d) d = true;
    if(rp < 3) requestAnimationFrame(anim); else desenhar();
  }
  requestAnimationFrame(anim);
}

/* mostrar vencedor e salvar histórico */
function mostrarVencedor(nm){
  overlay.textContent = ` 👉${nm}👈 `;
  overlay.classList.remove('mostrar');
  void overlay.offsetWidth; // trigger reflow para reiniciar animação
  overlay.classList.add('mostrar');

  clearTimeout(overlay._timeoutId);
  overlay._timeoutId = setTimeout(()=>{
    overlay.classList.remove('mostrar');
    overlay.textContent = '';
  }, 4000);

  vencedores.push(nm);
  salvarVencedores();
}

/* atualizar e salvar vencedores */
function atualizarVencedores(){
  const div = document.getElementById('listaVencedores');
  if(!div) return;
  div.innerHTML = '';
  vencedores.slice(-20).reverse().forEach(v=>{
    const span = document.createElement('span');
    span.className = 'vencedorTag';
    span.textContent = v;
    div.appendChild(span);
  });
}
function salvarVencedores(){
  localStorage.setItem('roleta_vencedores', JSON.stringify(vencedores));
  atualizarVencedores();
}

/* limpar tudo */
function limpar(){
  if(!confirm('Tem certeza que deseja limpar tudo?')) return;
  nomes = [];
  cores = [];
  localStorage.removeItem('roleta_nomes');
  localStorage.removeItem('roleta_cores');
  desenhar();
  atualizar();
  overlay.classList.remove('mostrar');
}

/* CSV import/export */
const btnImportar = document.getElementById('btnImportar');
if(btnImportar) btnImportar.addEventListener('click', ()=> csv.click());

csv.addEventListener('change', () => {
  const f = csv.files[0];
  if(!f) return;
  const colIndex = parseInt(document.getElementById('colunaCSV').value);
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const linhas = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l);
    const importados = [];
    for(const linha of linhas){
      const partes = linha.split(',');
      const nomeCol = (partes[colIndex] || '').trim();
      if(nomeCol) importados.push(nomeCol);
    }
    if(!importados.length){ alert('Nenhum nome encontrado.'); csv.value=''; return; }
    for(const nm of importados){
      nomes.push(nm);
      if(modoCor === "colorido") cores.push(corAleatoria());
      else cores.push(paletaNeutra[Math.floor(Math.random()*paletaNeutra.length)]);
    }
    salvar();
    desenhar();
    atualizar();
    csv.value = '';
    alert(`🎉 Importados ${importados.length} nomes da coluna ${colIndex + 1}.`);
  };
  reader.readAsText(f);
});

const btnExportar = document.getElementById('btnExportar');
if(btnExportar) btnExportar.addEventListener('click', ()=>{
  if(!nomes.length){ alert('Nenhum nome para exportar.'); return; }
  const colIndex = parseInt(document.getElementById('colunaCSV').value);
  const linhas = nomes.map(n=>{
    const cols = Array(colIndex + 1).fill('');
    cols[colIndex] = n;
    return cols.join(',');
  });
  const csvTxt = linhas.join('\n');
  const blob = new Blob([csvTxt], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = "nomes_roleta.csv"; a.click();
  URL.revokeObjectURL(url);
});

/* eventos (botões e teclado) */
const btnAdicionar = document.getElementById('btnAdicionar');
if(btnAdicionar) btnAdicionar.addEventListener('click', adicionar);
const btnIniciar = document.getElementById('btnIniciar');
if(btnIniciar) btnIniciar.addEventListener('click', girar);
const btnParar = document.getElementById('btnParar');
if(btnParar) btnParar.addEventListener('click', ()=>{
  if(girando){ clearInterval(intv); suave(); }
});
const btnLimpar = document.getElementById('btnLimpar');
if(btnLimpar) btnLimpar.addEventListener('click', limpar);

const btnLimparVencedores = document.getElementById('btnLimparVencedores');
if(btnLimparVencedores) btnLimparVencedores.addEventListener('click', ()=>{
  if(!confirm('Remover todos os vencedores salvos?')) return;
  vencedores = []; salvarVencedores();
});

nome.addEventListener('keyup', e => { if(e.key === 'Enter') adicionar(); });

/* fullscreen handling */
const btnFullscreen = document.getElementById('btnFullscreen');
if(btnFullscreen) btnFullscreen.addEventListener('click', ()=>{
  if(!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.addEventListener('fullscreenchange', ajustarCanvas);

/* canvas sizing */
function ajustarCanvas(){ 
  const t = Math.min(window.innerWidth * 0.8, 700);
  canvas.width = t;
  canvas.height = t;
  desenhar();
}
window.addEventListener('resize', ajustarCanvas);

/* init */
ajustarCanvas();
carregar();

