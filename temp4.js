<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DODO Chess | 3D 체스</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;user-select:none;touch-action:none}
body{background:#1e293b;color:#e2e8f0;font-family:'Outfit',sans-serif;overflow:hidden;margin:0}
#ui-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:flex;flex-direction:column;align-items:center;padding:20px;z-index:10}
h1{font-family:'Orbitron',sans-serif;font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px;text-shadow:0 4px 20px rgba(245,158,11,0.3)}
.status{font-size:1.2rem;margin-bottom:12px;padding:10px 24px;background:rgba(10,10,10,0.8);border:1px solid rgba(245,158,11,0.3);border-radius:30px;backdrop-filter:blur(10px);pointer-events:auto;box-shadow:0 10px 30px rgba(0,0,0,0.5)}
.status b{color:#f59e0b}
.controls{margin-top:auto;display:flex;gap:16px;pointer-events:auto;margin-bottom:20px}
.btn{padding:12px 28px;font-size:1rem;font-weight:700;border:none;border-radius:30px;cursor:pointer;transition:all 0.2s;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 15px rgba(99,102,241,0.4);text-transform:uppercase;letter-spacing:1px}
.btn:hover{transform:scale(1.05);box-shadow:0 6px 20px rgba(99,102,241,0.6)}
.captured{display:flex;gap:8px;margin:6px 0;min-height:30px;font-size:1.5rem;flex-wrap:wrap;max-width:560px;justify-content:center;pointer-events:auto;background:rgba(0,0,0,0.5);padding:8px 16px;border-radius:20px}
#overlay{position:fixed;inset:0;background:rgba(0,0,0,0.9);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:20;pointer-events:auto;backdrop-filter:blur(5px)}
#overlay h2{font-family:'Orbitron',sans-serif;font-size:4rem;color:#f59e0b;text-shadow:0 0 30px rgba(245,158,11,0.5);margin-bottom:10px}
#overlay p{color:#94a3b8;margin:12px 0 30px;font-size:1.5rem}
#game-container{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1}
#loading{position:absolute;inset:0;background:#050505;z-index:100;display:flex;align-items:center;justify-content:center;font-family:'Orbitron';font-size:2rem;color:#f59e0b}
</style>
</head>
<body>
<div id="loading">LOADING 3D CHESS...</div>
<div id="game-container"></div>
<div id="ui-layer">
    <h1>♟ DODO 3D CHESS</h1>
    <div class="captured" id="captured-b"></div>
    <div class="status" id="status">⚪ <b>백</b>의 차례</div>
    <div style="flex:1"></div>
    <div class="captured" id="captured-w"></div>
    <div class="controls">
        <button class="btn" onclick="initGame()">🔄 새 게임</button>
        <button class="btn" onclick="undoMove()">↩ 무르기</button>
    </div>
</div>
<div id="overlay">
    <h2 id="ov-title"></h2>
    <p id="ov-msg"></p>
    <button class="btn" onclick="initGame();document.getElementById('overlay').style.display='none'" style="font-size:1.2rem;padding:16px 40px">🔄 새 게임 시작</button>
</div>

// --- CHESS LOGIC ---
const PIECES={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const INIT='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
let board=[],turn='w',selected=null,history=[],capturedW=[],capturedB=[];

function parseFEN(fen){
 const b=[];fen.split('/').forEach(row=>{const r=[];for(const c of row){if(c>='1'&&c<='8')for(let i=0;i<+c;i++)r.push('');else r.push(c)}b.push(r)});return b;
}
function isWhite(p){return p===p.toUpperCase()&&p!==''}
function isBlack(p){return p===p.toLowerCase()&&p!==''}
function sameColor(a,b){return(isWhite(a)&&isWhite(b))||(isBlack(a)&&isBlack(b))}

function getMoves(r,c){
 const p=board[r][c];if(!p)return[];
 const moves=[];const w=isWhite(p);const type=p.toUpperCase();
 const add=(nr,nc)=>{if(nr<0||nr>7||nc<0||nc>7)return false;if(board[nr][nc]&&sameColor(p,board[nr][nc]))return false;moves.push([nr,nc]);return!board[nr][nc]};
 if(type==='P'){
  const dir=w?-1:1;const start=w?6:1;
  if(r+dir>=0&&r+dir<8&&!board[r+dir][c]){moves.push([r+dir,c]);if(r===start&&!board[r+2*dir][c])moves.push([r+2*dir,c])}
  if(c-1>=0&&board[r+dir]&&board[r+dir][c-1]&&!sameColor(p,board[r+dir][c-1]))moves.push([r+dir,c-1]);
  if(c+1<8&&board[r+dir]&&board[r+dir][c+1]&&!sameColor(p,board[r+dir][c+1]))moves.push([r+dir,c+1]);
 } else if(type==='N'){
  [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc])=>add(r+dr,c+dc));
 } else if(type==='B'){
  for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]])for(let i=1;i<8;i++)if(!add(r+dr*i,c+dc*i))break;
 } else if(type==='R'){
  for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]])for(let i=1;i<8;i++)if(!add(r+dr*i,c+dc*i))break;
 } else if(type==='Q'){
  for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])for(let i=1;i<8;i++)if(!add(r+dr*i,c+dc*i))break;
 } else if(type==='K'){
  for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])add(r+dr,c+dc);
 }
 return moves;
}

function isInCheck(color){
 let kr=-1,kc=-1;const king=color==='w'?'K':'k';
 for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===king){kr=r;kc=c}
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const p=board[r][c];if(!p)continue;
  if((color==='w'&&isBlack(p))||(color==='b'&&isWhite(p))){
   const moves=getMoves(r,c);if(moves.some(([mr,mc])=>mr===kr&&mc===kc))return true;
  }
 }
 return false;
}

function getLegalMoves(r,c){
 const p=board[r][c];const moves=getMoves(r,c);
 return moves.filter(([nr,nc])=>{
  const cap=board[nr][nc];board[nr][nc]=p;board[r][c]='';
  const inCheck=isInCheck(isWhite(p)?'w':'b');
  board[r][c]=p;board[nr][nc]=cap;return!inCheck;
 });
}

function doMove(sr,sc,nr,nc){
 const p=board[sr][sc],cap=board[nr][nc];
 history.push({sr,sc,nr,nc,p,cap});
 if(cap){if(isWhite(cap))capturedW.push(cap);else capturedB.push(cap)}
 board[nr][nc]=p;board[sr][sc]='';
 if(p==='P'&&nr===0)board[nr][nc]='Q';
 if(p==='p'&&nr===7)board[nr][nc]='q';
 turn=turn==='w'?'b':'w';
 updateStatus();
 syncBoardTo3D();
}

function undoMove(){
 if(!history.length)return;
 const m=history.pop();
 board[m.sr][m.sc]=m.p;board[m.nr][m.nc]=m.cap||'';
 if(m.cap){if(isWhite(m.cap))capturedW.pop();else capturedB.pop()}
 turn=turn==='w'?'b':'w';selected=null;
 updateStatus();
 syncBoardTo3D();
}

function updateStatus(){
 const s=document.getElementById('status');
 const check=isInCheck(turn);
 let hasLegal=false;
 for(let r=0;r<8&&!hasLegal;r++)for(let c=0;c<8&&!hasLegal;c++){
  const p=board[r][c];if(!p)continue;
  if((turn==='w'&&isWhite(p))||(turn==='b'&&isBlack(p))){
   if(getLegalMoves(r,c).length>0)hasLegal=true;
  }
 }
 if(!hasLegal){
  if(check){
   const winner=turn==='w'?'흑':'백';
   s.innerHTML='🏆 <b>'+winner+'</b> 승리! (체크메이트)';
   document.getElementById('ov-title').textContent='🏆 '+winner+' 승리!';
   document.getElementById('ov-msg').textContent='체크메이트!';
   document.getElementById('overlay').style.display='flex';
  } else {
   s.innerHTML='🤝 무승부 (스테일메이트)';
   document.getElementById('ov-title').textContent='🤝 무승부';
   document.getElementById('ov-msg').textContent='스테일메이트!';
   document.getElementById('overlay').style.display='flex';
  }
  return;
 }
 const icon=turn==='w'?'⚪':'⚫';const name=turn==='w'?'백':'흑';
 s.innerHTML=icon+' <b>'+name+'</b>의 차례'+(check?' ⚠️ 체크!':'');
 
 document.getElementById('captured-w').textContent=capturedW.map(p=>PIECES[p]).join(' ');
 document.getElementById('captured-b').textContent=capturedB.map(p=>PIECES[p]).join(' ');
}

function aiMove(){
 const moves=[];
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const p=board[r][c];if(!p||!isBlack(p))continue;
  getLegalMoves(r,c).forEach(([nr,nc])=>{
   let score=0;const cap=board[nr][nc];
   if(cap){const vals={P:1,N:3,B:3,R:5,Q:9,K:100,p:1,n:3,b:3,r:5,q:9,k:100};score=vals[cap.toUpperCase()]||0}
   if(nr>=3&&nr<=4&&nc>=3&&nc<=4)score+=0.5;
   moves.push({sr:r,sc:c,nr,nc,score});
  });
 }
 if(!moves.length)return;
 moves.sort((a,b)=>b.score-a.score);
 const top=moves.filter(m=>m.score>=moves[0].score-0.5);
 const pick=top[Math.floor(Math.random()*top.length)];
 animateMove(pick.sr,pick.sc,pick.nr,pick.nc);
}

// --- THREE.JS 3D RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1e293b, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 16, 10); // 각도를 위로 올려서 체스판이 잘 보이게 함

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('game-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI/2.5; // 너무 아래로 내려가지 않도록 제한 (약 72도)
controls.minDistance = 5;
controls.maxDistance = 25;

// Lights
const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambLight);

const spotLight = new THREE.SpotLight(0xfff0dd, 2.0);
spotLight.position.set(5, 15, 5);
spotLight.angle = Math.PI/3;
spotLight.penumbra = 0.5;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);

const topLight = new THREE.DirectionalLight(0xffffff, 0.5);
topLight.position.set(0, 20, 0);
scene.add(topLight);

const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// Materials for interaction squares (invisible by default, visible when highlighted)
const matTransparent = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
const matHighlight = new THREE.MeshStandardMaterial({color: 0x22c55e, metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.6});
const matSelected = new THREE.MeshStandardMaterial({color: 0xf59e0b, metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.6});

// 고급스러운 아이보리 / 흑단 기물 재질
const matPieceW = new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 0.1, roughness: 0.2}); // Ivory
const matPieceB = new THREE.MeshStandardMaterial({color: 0x222222, metalness: 0.2, roughness: 0.2}); // Ebony

// 고급스러운 체스판 재질
const matWhiteSq = new THREE.MeshStandardMaterial({color: 0xf0d9b5, metalness: 0.1, roughness: 0.8});
const matBlackSq = new THREE.MeshStandardMaterial({color: 0xb58863, metalness: 0.1, roughness: 0.8});

const boardGroup = new THREE.Group();
scene.add(boardGroup);

// 확실하게 눈에 보이는 64개의 개별 박스 타일로 체스판 구성
for(let r=0; r<8; r++){
  for(let c=0; c<8; c++){
    const isLight = (r+c)%2===0;
    const tile = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), isLight ? matWhiteSq : matBlackSq);
    tile.position.set(c - 3.5, -0.1, r - 3.5); // 윗면이 y=0이 되도록
    tile.receiveShadow = true;
    boardGroup.add(tile);
  }
}

const squares = [];
for(let r=0; r<8; r++) {
  for(let c=0; c<8; c++) {
    // Transparent interaction plane
    const sq = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matTransparent.clone());
    sq.rotation.x = -Math.PI/2;
    sq.position.set(c - 3.5, 0.01, r - 3.5);
    sq.userData = {r, c, type: 'square'};
    boardGroup.add(sq);
    squares.push(sq);
  }
}
const border = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.4, 8.6), new THREE.MeshStandardMaterial({color: 0x3d2314, metalness:0.1, roughness:0.9}));
border.position.y = -0.2;
border.receiveShadow = true;
boardGroup.add(border);

const piecesGroup = new THREE.Group();
scene.add(piecesGroup);
let pieceMeshes = [];

// 기물 3D 모델링 (LatheGeometry를 이용한 고품질 곡선)
function createPieceMesh(type, isWhite) {
  const group = new THREE.Group();
  const mat = isWhite ? matPieceW : matPieceB;
  
  const pts = [];
  const t = type.toUpperCase();
  
  if (t === 'P') {
    pts.push(new THREE.Vector2(0,0), new THREE.Vector2(0.35,0), new THREE.Vector2(0.3,0.15), new THREE.Vector2(0.15,0.2), new THREE.Vector2(0.1,0.6), new THREE.Vector2(0.2,0.65), new THREE.Vector2(0.2,0.75), new THREE.Vector2(0,0.95));
  } else if (t === 'R') {
    pts.push(new THREE.Vector2(0,0), new THREE.Vector2(0.4,0), new THREE.Vector2(0.35,0.2), new THREE.Vector2(0.25,0.3), new THREE.Vector2(0.25,0.7), new THREE.Vector2(0.35,0.8), new THREE.Vector2(0.35,1.0), new THREE.Vector2(0.25,1.0), new THREE.Vector2(0.25,0.9), new THREE.Vector2(0,0.9));
  } else if (t === 'B') {
    pts.push(new THREE.Vector2(0,0), new THREE.Vector2(0.4,0), new THREE.Vector2(0.35,0.15), new THREE.Vector2(0.15,0.25), new THREE.Vector2(0.1,0.6), new THREE.Vector2(0.2,0.7), new THREE.Vector2(0.25,0.8), new THREE.Vector2(0.05,1.2), new THREE.Vector2(0,1.3));
  } else if (t === 'Q') {
    pts.push(new THREE.Vector2(0,0), new THREE.Vector2(0.45,0), new THREE.Vector2(0.4,0.15), new THREE.Vector2(0.2,0.3), new THREE.Vector2(0.15,0.8), new THREE.Vector2(0.35,0.9), new THREE.Vector2(0.45,1.2), new THREE.Vector2(0,1.1));
  } else if (t === 'K') {
    pts.push(new THREE.Vector2(0,0), new THREE.Vector2(0.45,0), new THREE.Vector2(0.4,0.15), new THREE.Vector2(0.2,0.3), new THREE.Vector2(0.2,0.9), new THREE.Vector2(0.3,1.0), new THREE.Vector2(0.2,1.2), new THREE.Vector2(0,1.3));
  }
  
  if(pts.length > 0) {
    const geo = new THREE.LatheGeometry(pts, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  
  if (t === 'N') {
    const nPts = [new THREE.Vector2(0,0), new THREE.Vector2(0.4,0), new THREE.Vector2(0.35,0.2), new THREE.Vector2(0.2,0.3), new THREE.Vector2(0.15,0.5), new THREE.Vector2(0,0.5)];
    const base = new THREE.Mesh(new THREE.LatheGeometry(nPts, 32), mat);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);
    
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.5), mat);
    head.position.set(0, 0.7, 0.1);
    head.rotation.x = -0.3;
    head.castShadow = true; head.receiveShadow = true;
    group.add(head);
    
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.4), mat);
    snout.position.set(0, 0.6, 0.4);
    snout.rotation.x = 0.2;
    snout.castShadow = true; snout.receiveShadow = true;
    group.add(snout);
  }
  
  if (t === 'K') {
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), mat);
    cross1.position.y = 1.35; cross1.castShadow = true;
    group.add(cross1);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.08), mat);
    cross2.position.y = 1.2;
    group.add(cross2);
  }
  
  group.scale.set(0.9, 0.9, 0.9);
  return group;
}

function syncBoardTo3D() {
  piecesGroup.clear();
  pieceMeshes = [];
  
  for(let r=0; r<8; r++) {
    for(let c=0; c<8; c++) {
      const p = board[r][c];
      if (p) {
        const mesh = createPieceMesh(p, isWhite(p));
        mesh.position.set(c - 3.5, 0, r - 3.5);
        mesh.userData = {r, c, piece: p};
        piecesGroup.add(mesh);
        pieceMeshes.push(mesh);
      }
      
      // Update square materials based on selection
      const sq = squares.find(s => s.userData.r === r && s.userData.c === c);
      sq.material = matTransparent;
      
      if(selected && selected[0]===r && selected[1]===c) {
        sq.material = matSelected;
      }
      if(selected) {
        const moves = getLegalMoves(selected[0], selected[1]);
        if(moves.some(([mr,mc])=>mr===r&&mc===c)) {
          sq.material = matHighlight;
        }
      }
    }
  }
}

// Raycasting for Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointerdown', (e) => {
  if(document.getElementById('overlay').style.display === 'flex') return;
  if(animating) return; // 블로킹
  
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...squares, ...piecesGroup.children], true);
  
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while(obj.parent && obj.parent !== boardGroup && obj.parent !== piecesGroup) {
      obj = obj.parent; // 그룹 최상위 찾기
    }
    
    if (obj.userData.type === 'square' || obj.userData.piece) {
      const r = obj.userData.r;
      const c = obj.userData.c;
      onClick(r, c);
    }
  }
});

let animating = false;
function animateMove(sr, sc, nr, nc) {
  animating = true;
  // 논리 업데이트
  const p=board[sr][sc], cap=board[nr][nc];
  history.push({sr,sc,nr,nc,p,cap});
  if(cap){if(isWhite(cap))capturedW.push(cap);else capturedB.push(cap)}
  board[nr][nc]=p;board[sr][sc]='';
  if(p==='P'&&nr===0)board[nr][nc]='Q';
  if(p==='p'&&nr===7)board[nr][nc]='q';
  turn=turn==='w'?'b':'w';
  
  // 3D 업데이트
  const mesh = pieceMeshes.find(m => m.userData.r === sr && m.userData.c === sc);
  if(mesh) {
    const startPos = mesh.position.clone();
    const endPos = new THREE.Vector3(nc - 3.5, 0, nr - 3.5);
    
    // 점프 애니메이션
    let startT = performance.now();
    function anim() {
      const t = (performance.now() - startT) / 300;
      if (t < 1) {
        mesh.position.lerpVectors(startPos, endPos, t);
        mesh.position.y = Math.sin(t * Math.PI) * 1.5; // 포물선 점프
        requestAnimationFrame(anim);
      } else {
        animating = false;
        updateStatus();
        syncBoardTo3D();
        
        // AI 턴이면 지연 후 실행
        if(turn==='b') setTimeout(aiMove, 500);
      }
    }
    anim();
  } else {
    animating = false;
    updateStatus();
    syncBoardTo3D();
    if(turn==='b') setTimeout(aiMove, 500);
  }
}

function onClick(r,c){
 const p=board[r][c];
 if(selected){
  const[sr,sc]=selected;
  const moves=getLegalMoves(sr,sc);
  if(moves.some(([mr,mc])=>mr===r&&mc===c)){
   selected=null;
   animateMove(sr,sc,r,c);
   return;
  } else if(p&&((turn==='w'&&isWhite(p))||(turn==='b'&&isBlack(p)))){
   selected=[r,c];
  } else selected=null;
 } else {
  if(p&&((turn==='w'&&isWhite(p))||(turn==='b'&&isBlack(p))))selected=[r,c];
 }
 syncBoardTo3D();
}

function initGame(){
 board=parseFEN(INIT);turn='w';selected=null;history=[];capturedW=[];capturedB=[];
 animating = false;
 updateStatus();
 syncBoardTo3D();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Remove loading screen
document.getElementById('loading').style.display = 'none';
initGame();
animate();
</body>
</html>
