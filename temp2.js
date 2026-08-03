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
camera.position.set(0, 12, 14);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('game-container').appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI/2 - 0.1; // 바닥 밑으로 안가게
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

const boardGroup = new THREE.Group();
scene.add(boardGroup);

// Seamless Visual Board
const boardCanvas = document.createElement('canvas');
boardCanvas.width = 1024; boardCanvas.height = 1024;
const bctx = boardCanvas.getContext('2d');
for(let r=0; r<8; r++){
  for(let c=0; c<8; c++){
    bctx.fillStyle = (r+c)%2===0 ? '#f0d9b5' : '#b58863';
    bctx.fillRect(c*128, r*128, 128, 128);
  }
}
const boardTex = new THREE.CanvasTexture(boardCanvas);
boardTex.anisotropy = 4; // Sharp textures
boardTex.needsUpdate = true;
const visualBoard = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.2, 8), 
    new THREE.MeshStandardMaterial({map: boardTex, color: 0xffffff, metalness: 0.1, roughness: 0.8})
);
visualBoard.position.y = -0.1;
visualBoard.receiveShadow = true;
boardGroup.add(visualBoard);

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
      const isLight = (r+c)%2 === 0;
      sq.material = isLight ? matWhiteSq : matBlackSq;
      
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
