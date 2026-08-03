const CHARACTERS = {
    'default': { id: 'default', name: '초보 타자', rarity: 'Normal', color: 0x991b1b, scale: 1.0, power: 1.0, hitbox: 1.0, skin: 0xf5c69a, pants: 0xe2e8f0, prob: 0 },
    'pro': { id: 'pro', name: '프로 타자', rarity: 'Rare', color: 0x1d4ed8, scale: 1.05, power: 1.1, hitbox: 1.1, skin: 0xfcd34d, pants: 0x1e293b, prob: 0.3 },
    'legend': { id: 'legend', name: '레전드 타자', rarity: 'Epic', color: 0x7e22ce, scale: 1.1, power: 1.25, hitbox: 1.2, skin: 0x3b82f6, pants: 0xfacc15, prob: 0.1 },
    'gold': { id: 'gold', name: '황금 타자', rarity: 'Legendary', color: 0xf59e0b, scale: 1.15, power: 1.4, hitbox: 1.3, skin: 0xffd700, pants: 0xffffff, prob: 0.02 }
};

let myCoins = parseInt(localStorage.getItem('dodo_baseball_coins') || '0');
let myChars = JSON.parse(localStorage.getItem('dodo_baseball_chars') || '["default"]');
let currentChar = localStorage.getItem('dodo_baseball_currentChar') || 'default';

function addCoins(amount) {
    myCoins += amount;
    localStorage.setItem('dodo_baseball_coins', myCoins);
    updateCoinUI();
    showCoinPopup(amount);
}

function updateCoinUI() {
    const d = document.getElementById('coin-disp');
    if(d) d.textContent = myCoins;
}

function showCoinPopup(amount) {
    const pop = document.createElement('div');
    pop.textContent = `+${amount} 🪙`;
    pop.style.position = 'absolute';
    pop.style.top = '50%';
    pop.style.left = '50%';
    pop.style.transform = 'translate(-50%, -50%)';
    pop.style.color = '#fbbf24';
    pop.style.fontSize = '3rem';
    pop.style.fontWeight = '900';
    pop.style.textShadow = '0 0 20px rgba(245,158,11,0.8), 2px 2px 0px #000';
    pop.style.pointerEvents = 'none';
    pop.style.zIndex = '1000';
    pop.style.transition = 'all 1s ease-out';
    document.body.appendChild(pop);
    
    setTimeout(() => {
        pop.style.transform = 'translate(-50%, -150%)';
        pop.style.opacity = '0';
    }, 50);
    setTimeout(() => {
        pop.remove();
    }, 1050);
}

window.openGacha = function() {
    if (myCoins < 100) {
        alert("코인이 부족합니다! (100 코인 필요)\n안타나 홈런을 쳐서 코인을 모으세요.");
        return;
    }
    
    myCoins -= 100;
    localStorage.setItem('dodo_baseball_coins', myCoins);
    updateCoinUI();
    
    // 확률 뽑기
    const r = Math.random();
    let pickedId = 'default';
    if (r < CHARACTERS['gold'].prob) {
        pickedId = 'gold';
    } else if (r < CHARACTERS['legend'].prob + CHARACTERS['gold'].prob) {
        pickedId = 'legend';
    } else if (r < CHARACTERS['pro'].prob + CHARACTERS['legend'].prob + CHARACTERS['gold'].prob) {
        pickedId = 'pro';
    }
    
    const char = CHARACTERS[pickedId];
    
    if (!myChars.includes(pickedId)) {
        myChars.push(pickedId);
        localStorage.setItem('dodo_baseball_chars', JSON.stringify(myChars));
    }
    
    currentChar = pickedId;
    localStorage.setItem('dodo_baseball_currentChar', currentChar);
    
    // 뽑기 연출 모달
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.9)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.style.color = '#fff';
    
    modal.innerHTML = `
        <h1 style="font-size: 3rem; margin-bottom: 2rem; color: #fbbf24; text-shadow: 0 0 30px #fbbf24;">🎉 획득! 🎉</h1>
        <div style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 0.5rem;">[${char.rarity}]</div>
        <div style="font-size: 4rem; font-weight: 900; margin-bottom: 2rem; color: #${char.color.toString(16)}; text-shadow: 0 0 20px #${char.color.toString(16)};">${char.name}</div>
        <p style="font-size: 1.2rem; color: #94a3b8; margin-bottom: 3rem; text-align:center;">
            파워 x${char.power} <br>
            타격 판정 x${char.hitbox}
        </p>
        <button id="gacha-close" style="padding: 1rem 3rem; font-size: 1.5rem; background: #3b82f6; border: none; border-radius: 12px; color: #fff; cursor: pointer;">적용하고 재시작</button>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('gacha-close').addEventListener('click', () => {
        location.reload();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    updateCoinUI();
});
