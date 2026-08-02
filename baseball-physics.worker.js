/**
 * DODO Baseball - Advanced Pitching Physics Engine (Web Worker)
 * 
 * 실시간 투구 물리 연산 담당 Web Worker
 * 
 * 핵심 물리 방정식:
 *   m * dv/dt = Fg + Fd + FM
 *   Fg = m * g (중력)
 *   Fd = -0.5 * rho * v^2 * A * Cd * v_hat (항력)
 *   FM = 0.5 * rho * v^2 * A * CL * (omega_hat x v_hat) (마그누스 힘)
 */

'use strict';

// ── 물리 상수 ──────────────────────────────────────────────────
const PHYSICS = {
    g:    -9.80665,   // 중력 가속도 (m/s²)
    rho:   1.2041,    // 공기 밀도 (kg/m³) at 20°C, sea level
    A:     0.004268,  // 야구공 단면적 (m²), 지름 73.7mm
    m:     0.14175,   // 야구공 질량 (kg)
    R:     0.03685,   // 야구공 반지름 (m)
    HOME_TO_MOUND: 18.39,  // 홈-마운드 거리 (m)
    RELEASE_HEIGHT: 1.9,   // 릴리스 포인트 높이 (m)
    DT: 1 / 240,           // 물리 시뮬레이션 스텝 (240Hz)
};

// ── 구종 데이터베이스 ───────────────────────────────────────────
const PITCH_TYPES = {
    'fourseam': {
        name: '포심 패스트볼',
        name_en: '4-Seam Fastball',
        speedKmh: [148, 158],
        rpm: [2200, 2600],
        // 회전축: 백스핀(180°), 수직 올리기 효과
        axisX: 0, axisY: 0, axisZ: 1.0,
        Cd: 0.35,
        CL_base: 0.23,
        color: '#FF4444',
        trailColor: '#FF8888',
    },
    'twoseam': {
        name: '투심 패스트볼',
        name_en: '2-Seam / Sinker',
        speedKmh: [143, 153],
        rpm: [1900, 2200],
        axisX: 0.2, axisY: 0, axisZ: 0.98,
        Cd: 0.36,
        CL_base: 0.20,
        color: '#FF7700',
        trailColor: '#FFAA44',
    },
    'cutter': {
        name: '커터',
        name_en: 'Cut Fastball',
        speedKmh: [138, 148],
        rpm: [2100, 2500],
        axisX: -0.3, axisY: 0, axisZ: 0.95,
        Cd: 0.35,
        CL_base: 0.18,
        color: '#FF9900',
        trailColor: '#FFCC44',
    },
    'curveball': {
        name: '커브볼',
        name_en: 'Curveball',
        speedKmh: [118, 130],
        rpm: [2400, 3000],
        // 탑스핀 → 마그누스가 아래로 작용
        axisX: 0, axisY: 0, axisZ: -1.0,
        Cd: 0.38,
        CL_base: 0.30,
        color: '#4488FF',
        trailColor: '#88BBFF',
    },
    'slider': {
        name: '슬라이더',
        name_en: 'Slider',
        speedKmh: [128, 140],
        rpm: [2200, 2700],
        // 자이로+횡스핀 결합
        axisX: -0.7, axisY: 0.1, axisZ: 0.7,
        Cd: 0.37,
        CL_base: 0.22,
        color: '#00AAFF',
        trailColor: '#44CCFF',
    },
    'sweeper': {
        name: '스위퍼',
        name_en: 'Sweeper',
        speedKmh: [123, 135],
        rpm: [2500, 3000],
        // 횡방향 극대화
        axisX: -1.0, axisY: 0, axisZ: 0.2,
        Cd: 0.38,
        CL_base: 0.28,
        color: '#00DDFF',
        trailColor: '#88EEFF',
    },
    'changeup': {
        name: '체인지업',
        name_en: 'Changeup',
        speedKmh: [130, 140],
        rpm: [1400, 1800],
        axisX: 0.15, axisY: 0, axisZ: 0.98,
        Cd: 0.40,
        CL_base: 0.15,
        color: '#44CC44',
        trailColor: '#88EE88',
    },
    'splitter': {
        name: '스플리터',
        name_en: 'Splitter / Forkball',
        speedKmh: [135, 145],
        rpm: [900, 1300],
        axisX: 0, axisY: 0, axisZ: -0.5,
        Cd: 0.42,
        CL_base: 0.08,
        color: '#AACC00',
        trailColor: '#CCEE44',
    },
    'knuckleball': {
        name: '너클볼',
        name_en: 'Knuckleball',
        speedKmh: [105, 118],
        rpm: [25, 75],  // 거의 0
        axisX: 0, axisY: 0, axisZ: 0,
        Cd: 0.50,       // 불규칙한 항력
        CL_base: 0.0,
        color: '#AA44FF',
        trailColor: '#CC88FF',
    },
};

// ── 유틸 ────────────────────────────────────────────────────────
function rand(min, max) {
    return min + Math.random() * (max - min);
}
function lerp(a, b, t) { return a + (b - a) * t; }
function vecLen(v) { return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z); }
function vecNorm(v) {
    const l = vecLen(v) || 1e-9;
    return { x: v.x/l, y: v.y/l, z: v.z/l };
}
function vecCross(a, b) {
    return {
        x: a.y*b.z - a.z*b.y,
        y: a.z*b.x - a.x*b.z,
        z: a.x*b.y - a.y*b.x,
    };
}
function vecScale(v, s) { return { x: v.x*s, y: v.y*s, z: v.z*s }; }
function vecAdd(a, b) { return { x: a.x+b.x, y: a.y+b.y, z: a.z+b.z }; }

// ── 메인 물리 시뮬레이터 ─────────────────────────────────────────
/**
 * 단일 투구의 전체 궤적을 시뮬레이션한다.
 * 좌표계: +Z = 홈플레이트 방향, +Y = 위, +X = 우
 *
 * @returns {Array} 궤적 포인트 배열 [{x, y, z, t}, ...]
 */
function simulatePitch(pitchType, options = {}) {
    const spec = PITCH_TYPES[pitchType];
    if (!spec) return [];

    // 초기 조건 설정
    const speedKmh = rand(...spec.speedKmh) * (options.powerFactor || 1.0);
    const speedMs  = speedKmh / 3.6;

    // 릴리스 포인트 (오른손 투수 기준)
    const releaseX  = options.releaseX ?? -0.35;   // 타자 시점에서 왼쪽
    const releaseY  = PHYSICS.RELEASE_HEIGHT;
    const releaseZ  = PHYSICS.HOME_TO_MOUND;

    // 목표 지점 (아이밍)
    const targetX = options.targetX ?? 0;
    const targetY = options.targetY ?? 0.65;  // 스트라이크존 중간

    // 초기 속도 벡터 (릴리스 → 목표 방향으로 거칠게 세팅)
    const dz = -releaseZ + targetX * 0.1;   // 약간 보정
    const rawDir = vecNorm({
        x: (targetX - releaseX) * 0.05,
        y: (targetY - releaseY) / releaseZ,
        z: -1,
    });

    let vel = vecScale(rawDir, speedMs);
    let pos = { x: releaseX, y: releaseY, z: releaseZ };

    // RPM → 각속도 벡터 (rad/s)
    const rpm = rand(...spec.rpm);
    const omega_mag = (rpm * 2 * Math.PI) / 60; // rad/s
    let axisVec = vecNorm({ x: spec.axisX, y: spec.axisY, z: spec.axisZ });

    // 너클볼의 경우: 회전축이 무작위로 흔들린다
    let knuckleDriftTimer = 0;
    let kDrift = { x: 0, y: 0 };

    const { g, rho, A, m } = PHYSICS;
    const dt = PHYSICS.DT;

    const trajectory = [];
    let t = 0;

    // 최대 시뮬레이션 시간 제한
    const maxTime = (releaseZ / speedMs) * 2.5;

    while (pos.z > -0.2 && t < maxTime) {
        const v = vecLen(vel);
        const v2 = v * v;
        const vHat = vecNorm(vel);

        // ── 1. 중력 ──────────────────────────────────────────
        const Fg = { x: 0, y: g * m, z: 0 };

        // ── 2. 항력 (Drag) ───────────────────────────────────
        let Cd = spec.Cd;

        // 너클볼: 솔기 위치에 따라 항력이 비선형적으로 변화
        if (pitchType === 'knuckleball') {
            kDrift.x += (Math.random() - 0.5) * 1.5 * dt;
            kDrift.y += (Math.random() - 0.5) * 1.2 * dt;
            kDrift.x = Math.max(-0.8, Math.min(0.8, kDrift.x));
            kDrift.y = Math.max(-0.5, Math.min(0.5, kDrift.y));
            Cd = spec.Cd + Math.sin(t * 8.5) * 0.12 + Math.cos(t * 5.3) * 0.08;
        }

        const Fd_mag = 0.5 * rho * v2 * A * Cd;
        const Fd = vecScale(vHat, -Fd_mag);

        // ── 3. 마그누스 힘 ───────────────────────────────────
        // FM = 0.5 * rho * v^2 * A * CL * (omega_hat × v_hat)
        // CL은 스핀-속도 비(Spin Efficiency)에 따라 동적으로 결정
        const spinRatio = (omega_mag * PHYSICS.R) / v;  // spin efficiency
        let CL = spec.CL_base * Math.sqrt(Math.min(spinRatio / 0.25, 1.0));

        let FM = { x: 0, y: 0, z: 0 };
        if (omega_mag > 0.1) {
            const cross = vecCross(axisVec, vHat);
            const FM_mag = 0.5 * rho * v2 * A * CL;
            FM = vecScale(cross, FM_mag);

            if (pitchType === 'knuckleball') {
                FM.x += kDrift.x * 0.8;
                FM.y += kDrift.y * 0.6;
            }
        }

        // ── 4. 합력 → 가속도 → 속도 → 위치 ─────────────────
        const F_total = vecAdd(vecAdd(Fg, Fd), FM);
        const acc = vecScale(F_total, 1 / m);

        vel = vecAdd(vel, vecScale(acc, dt));
        pos = vecAdd(pos, vecScale(vel, dt));

        // ── 5. 궤적 저장 (약 60fps로 다운샘플) ──────────────
        if (Math.round(t / dt) % 4 === 0) {
            trajectory.push({
                x: pos.x, y: pos.y, z: pos.z,
                vx: vel.x, vy: vel.y, vz: vel.z,
                speedKmh: v * 3.6,
                t,
            });
        }

        t += dt;
    }

    // 마지막 위치 (홈플레이트 교차점)
    const last = trajectory[trajectory.length - 1] || pos;

    return {
        trajectory,
        speedKmh,
        rpm,
        finalX: last.x,
        finalY: last.y,
        pitchType,
        spec,
        travelTime: t,
    };
}

// ── Worker 메시지 핸들러 ─────────────────────────────────────────
self.onmessage = function (e) {
    const { cmd, payload } = e.data;

    if (cmd === 'simulate') {
        const result = simulatePitch(payload.pitchType, payload.options);
        self.postMessage({ cmd: 'result', payload: result, id: payload.id });
    }

    if (cmd === 'getTypes') {
        self.postMessage({
            cmd: 'types',
            payload: Object.entries(PITCH_TYPES).map(([key, val]) => ({
                key,
                name: val.name,
                name_en: val.name_en,
                color: val.color,
                trailColor: val.trailColor,
                speedRange: val.speedKmh,
            })),
        });
    }
};
