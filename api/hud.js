export default async function handler(req, res) {
  const {
    turn = '턴 수',
    date = '2048.03',
    alert = 'STUFE I',
    name = '카를_폰_아이젠하르트',
    title = '제국_최고_집정관',
    trait = '발할라-IX_코어_직결_권한',
    img = '',
    map = '111101', // S1~S6 순서 (1:통제, 2:분쟁, 0:상실)
    stab = '94.2',
    pop = '84.62',
    dev = '88.5',
    risk = '12.4',
    dir = '최고_사령부_브리핑:_전_관구_감시망_가동_중',
  } = req.query;

  const clamp = (v) => Math.min(Math.max(parseFloat(v) || 0, 0), 100);
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const nStab = clamp(stab);
  const nPop = clamp(pop);
  const nDev = clamp(dev);
  const nRisk = clamp(risk);

  const leaderName = esc(String(name).replace(/_/g, ' '));
  const leaderTitle = esc(String(title).replace(/_/g, ' '));
  const leaderTrait = esc(String(trait).replace(/_/g, ' '));
  const directive = esc(String(dir).replace(/_/g, ' '));

  // 1. 외부 지도자 사진 URL을 Base64로 변환 (브라우저 <img> 차단 우회)
  let portraitDataUri = '';
  if (img && /^https?:\/\//i.test(img)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const imgRes = await fetch(img, { signal: controller.signal });
      clearTimeout(timeout);
      if (imgRes.ok) {
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        const arrayBuf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString('base64');
        portraitDataUri = `data:${contentType};base64,${base64}`;
      }
    } catch (_) {
      portraitDataUri = '';
    }
  }

  // 2. 6대 관구(S1~S6) 통제 상태 색상 계산 (1=통제, 2=분쟁, 0=상실)
  const flags = String(map).padEnd(6, '1').slice(0, 6).split('');
  let controlledCount = 0;

  const getSectorStyle = (code, isCapital = false) => {
    if (code === '1') {
      controlledCount++;
      return isCapital
        ? { fill: '#2E2412', stroke: '#E2C07D', text: '#FEF3C7', sub: '(제국 수도)' }
        : { fill: '#123047', stroke: '#38BDF8', text: '#E0F2FE', sub: '' };
    }
    if (code === '2') {
      return { fill: '#451A03', stroke: '#F59E0B', text: '#FEF3C7', sub: '[계엄·분쟁]' };
    }
    return { fill: '#450A0A', stroke: '#EF4444', text: '#FEE2E2', sub: '[통제 상실]' };
  };

  const s1 = getSectorStyle(flags[0], true);
  const s2 = getSectorStyle(flags[1]);
  const s3 = getSectorStyle(flags[2]);
  const s4 = getSectorStyle(flags[3]);
  const s5 = getSectorStyle(flags[4]);
  const s6 = getSectorStyle(flags[5]);
  const controlPct = ((controlledCount / 6) * 100).toFixed(1);

  // 3. 게이지 색상 및 경고 문구
  const isLowStab = nStab < 40;
  const stabColor = isLowStab ? '#F87171' : '#E2C07D';
  const stabBar = isLowStab ? 'url(#riskGrad)' : 'url(#goldGrad)';
  const isCriticalRisk = nRisk >= 98.4;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 460" width="920" height="460" style="background:#080A0E;font-family:'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D1219"/><stop offset="100%" stop-color="#07090D"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9A7B3E"/><stop offset="100%" stop-color="#E2C07D"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
    <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B91C1C"/><stop offset="100%" stop-color="#F87171"/>
    </linearGradient>
    <pattern id="tacticalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" stroke-width="0.6" stroke-opacity="0.45"/>
    </pattern>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="4" y2="0" stroke="#000000" stroke-width="1.2" stroke-opacity="0.35"/>
    </pattern>
    <clipPath id="portraitClip">
      <rect x="35" y="106" width="200" height="172" rx="3"/>
    </clipPath>
  </defs>

  <rect x="2" y="2" width="916" height="456" rx="6" fill="url(#bgGrad)" stroke="#C5A059" stroke-width="1.5" stroke-opacity="0.75"/>
  <rect x="2" y="2" width="916" height="456" rx="6" fill="url(#tacticalGrid)"/>
  <path d="M 16 2 L 2 2 L 2 16 M 904 2 L 918 2 L 918 16 M 16 458 L 2 458 L 2 444 M 904 458 L 918 458 L 918 444" fill="none" stroke="#38BDF8" stroke-width="2.2"/>

  <!-- 헤더 -->
  <g transform="translate(20, 14)">
    <rect x="0" y="0" width="40" height="40" rx="4" fill="#111827" stroke="#C5A059" stroke-width="1.2"/>
    <path d="M16 6 H24 L22 16 L34 14 V22 L22 20 L24 34 H16 L18 20 L6 22 V14 L18 16 Z" fill="#C5A059"/>
    <circle cx="20" cy="20" r="3.5" fill="#080A0E" stroke="#38BDF8" stroke-width="1.2"/>
  </g>
  <text x="72" y="32" fill="#F8FAFC" font-size="15.5" font-weight="800" letter-spacing="1.2">VEREINIGTES KAISERREICH WALDEMAR</text>
  <text x="72" y="50" fill="#94A3B8" font-size="11">발데마르 통합제국 · K.A.I.S.E.R. 최고 통치 사령부 (행성 알테아 전략 상황판)</text>

  <text x="898" y="31" text-anchor="end" fill="#E2C07D" font-size="12.5" font-weight="800">제국력 ${esc(date)} // TURN ${esc(String(turn).padStart(2, '0'))}</text>
  <rect x="754" y="38" width="144" height="20" rx="3" fill="#0F293A" stroke="#38BDF8" stroke-width="1"/>
  <text x="826" y="52" text-anchor="middle" fill="#38BDF8" font-size="10.5" font-weight="800">치안 등급: ${esc(String(alert).replace(/_/g, ' '))}</text>
  <line x1="20" y1="66" x2="900" y2="66" stroke="#334155" stroke-width="1"/>

  <!-- 좌측: 지도자 패널 -->
  <rect x="20" y="78" width="230" height="316" rx="5" fill="#0F1520" fill-opacity="0.92" stroke="#C5A059" stroke-width="1" stroke-opacity="0.5"/>
  <text x="35" y="97" fill="#E2C07D" font-size="10.5" font-weight="800" letter-spacing="1">SUPREME COMMANDER</text>
  <circle cx="228" cy="93" r="3.5" fill="#38BDF8"/>

  <rect x="35" y="106" width="200" height="172" rx="3" fill="#070A0F" stroke="#334155" stroke-width="1"/>
  ${
    portraitDataUri
      ? `<image x="35" y="106" width="200" height="172" preserveAspectRatio="xMidYMid slice" clip-path="url(#portraitClip)" href="${portraitDataUri}"/>`
      : `<g opacity="0.7">
           <circle cx="135" cy="166" r="28" fill="#1E293B" stroke="#38BDF8" stroke-width="1.2"/>
           <path d="M82 268 C82 222, 188 222, 188 268 Z" fill="#1E293B" stroke="#C5A059" stroke-width="1.2"/>
           <text x="135" y="254" text-anchor="middle" fill="#64748B" font-size="9.5" font-weight="700">COMMANDER HOLOGRAM</text>
         </g>`
  }
  <rect x="35" y="106" width="200" height="172" rx="3" fill="url(#scanlines)"/>
  <path d="M 43 106 L 35 106 L 35 114 M 227 106 L 235 106 L 235 114 M 43 278 L 35 278 L 35 270 M 227 278 L 235 278 L 235 270" fill="none" stroke="#C5A059" stroke-width="1.8"/>

  <rect x="35" y="287" width="200" height="18" rx="2" fill="#C5A059" fill-opacity="0.16"/>
  <text x="135" y="300" text-anchor="middle" fill="#E2C07D" font-size="10.5" font-weight="700">${leaderTitle}</text>
  <text x="135" y="325" text-anchor="middle" fill="#F8FAFC" font-size="15.5" font-weight="800">${leaderName}</text>
  <text x="135" y="344" text-anchor="middle" fill="#38BDF8" font-size="10.5">${leaderTrait}</text>

  <rect x="35" y="355" width="200" height="27" rx="3" fill="#090D14" stroke="#1E293B" stroke-width="1"/>
  <text x="135" y="373" text-anchor="middle" fill="#CBD5E1" font-size="11" font-weight="700">영토 장악: ${controlledCount} / 6 관구 (${controlPct}%)</text>

  <!-- 중앙: 알테아 6대 관구 지도 -->
  <rect x="262" y="78" width="376" height="316" rx="5" fill="#0F1520" fill-opacity="0.92" stroke="#1E293B" stroke-width="1"/>
  <text x="278" y="97" fill="#CBD5E1" font-size="11.5" font-weight="800">ALTHEA STRATEGIC MAP <tspan fill="#64748B" font-size="10">// 6대 행정관구 통제 현황</tspan></text>

  <rect x="276" y="106" width="348" height="252" rx="4" fill="#06090F" stroke="#334155" stroke-width="1"/>
  <line x1="276" y1="190" x2="624" y2="190" stroke="#1E293B" stroke-width="0.7" stroke-dasharray="3,3"/>
  <line x1="276" y1="274" x2="624" y2="274" stroke="#1E293B" stroke-width="0.7" stroke-dasharray="3,3"/>
  <line x1="392" y1="106" x2="392" y2="358" stroke="#1E293B" stroke-width="0.7" stroke-dasharray="3,3"/>
  <line x1="508" y1="106" x2="508" y2="358" stroke="#1E293B" stroke-width="0.7" stroke-dasharray="3,3"/>
  <circle cx="450" cy="232" r="95" fill="none" stroke="#38BDF8" stroke-width="0.6" stroke-opacity="0.22"/>

  <!-- S2 노르트그라트 -->
  <path d="M 355 116 L 462 114 L 498 134 L 472 158 L 392 158 L 348 140 Z" fill="${s2.fill}" stroke="${s2.stroke}" stroke-width="1.5"/>
  <text x="424" y="137" text-anchor="middle" fill="${s2.text}" font-size="9.5" font-weight="800">S2 노르트그라트</text>
  ${s2.sub ? `<text x="424" y="149" text-anchor="middle" fill="${s2.stroke}" font-size="8" font-weight="700">${s2.sub}</text>` : ''}

  <!-- S3 아들러하펜 -->
  <path d="M 286 168 L 358 164 L 372 214 L 346 256 L 294 246 L 284 202 Z" fill="${s3.fill}" stroke="${s3.stroke}" stroke-width="1.5"/>
  <text x="328" y="208" text-anchor="middle" fill="${s3.text}" font-size="9.5" font-weight="800">S3 아들러하펜</text>
  ${s3.sub ? `<text x="328" y="220" text-anchor="middle" fill="${s3.stroke}" font-size="8" font-weight="700">${s3.sub}</text>` : ''}

  <!-- S1 아이젠크로네 -->
  <path d="M 386 172 L 474 170 L 494 218 L 462 252 L 390 248 L 378 206 Z" fill="${s1.fill}" stroke="${s1.stroke}" stroke-width="1.8"/>
  <text x="435" y="208" text-anchor="middle" fill="${s1.text}" font-size="10" font-weight="800">★ S1 아이젠크로네</text>
  <text x="435" y="222" text-anchor="middle" fill="${s1.stroke}" font-size="8.5" font-weight="700">${s1.sub}</text>

  <!-- S4 오스트마르크 -->
  <path d="M 506 152 L 602 148 L 614 206 L 584 248 L 512 242 L 498 194 Z" fill="${s4.fill}" stroke="${s4.stroke}" stroke-width="1.5"/>
  <text x="558" y="198" text-anchor="middle" fill="${s4.text}" font-size="9.5" font-weight="800">S4 오스트마르크</text>
  ${s4.sub ? `<text x="558" y="210" text-anchor="middle" fill="${s4.stroke}" font-size="8" font-weight="700">${s4.sub}</text>` : ''}

  <!-- S5 쥐트란트 -->
  <path d="M 366 268 L 478 266 L 496 320 L 434 344 L 368 326 L 356 292 Z" fill="${s5.fill}" stroke="${s5.stroke}" stroke-width="1.5"/>
  <text x="426" y="302" text-anchor="middle" fill="${s5.text}" font-size="9.5" font-weight="800">S5 쥐트란트</text>
  ${s5.sub ? `<text x="426" y="315" text-anchor="middle" fill="${s5.stroke}" font-size="8" font-weight="700">${s5.sub}</text>` : ''}

  <!-- S6 아우터림 -->
  <path d="M 522 268 L 584 264 L 608 298 L 578 338 L 526 328 L 514 294 Z" fill="${s6.fill}" stroke="${s6.stroke}" stroke-width="1.5"/>
  <text x="562" y="302" text-anchor="middle" fill="${s6.text}" font-size="9.5" font-weight="800">S6 아우터림</text>
  ${s6.sub ? `<text x="562" y="315" text-anchor="middle" fill="${s6.stroke}" font-size="8" font-weight="700">${s6.sub}</text>` : ''}

  <!-- 범례 -->
  <rect x="280" y="368" width="11" height="11" rx="2" fill="#123047" stroke="#38BDF8" stroke-width="1.2"/>
  <text x="296" y="378" fill="#CBD5E1" font-size="10">제국 통제령</text>
  <rect x="372" y="368" width="11" height="11" rx="2" fill="#451A03" stroke="#F59E0B" stroke-width="1.2"/>
  <text x="388" y="378" fill="#CBD5E1" font-size="10">계엄·분쟁지</text>
  <rect x="466" y="368" width="11" height="11" rx="2" fill="#450A0A" stroke="#EF4444" stroke-width="1.2"/>
  <text x="482" y="378" fill="#FCA5A5" font-size="10">통제 상실(반란)</text>

  <!-- 우측: 4대 핵심 지표 -->
  <rect x="650" y="78" width="250" height="72" rx="5" fill="#0F1520" fill-opacity="0.92" stroke="#1E293B" stroke-width="1"/>
  <text x="664" y="99" fill="#CBD5E1" font-size="11.5" font-weight="700">국가 안정도 <tspan fill="#64748B" font-size="9.5">STABILITÄT</tspan></text>
  <text x="886" y="100" text-anchor="end" fill="${stabColor}" font-size="14.5" font-weight="800">${nStab.toFixed(1)}%</text>
  <rect x="664" y="111" width="222" height="9" rx="2" fill="#07090D" stroke="#334155" stroke-width="0.8"/>
  <rect x="664" y="111" width="${(nStab * 2.22).toFixed(1)}" height="9" rx="2" fill="${stabBar}"/>
  <text x="664" y="137" fill="#94A3B8" font-size="9.5">${isLowStab ? '경고: 제국 통제력 급락 · 소요 확대' : '중앙 치안망 정상 · 관구 질서 유지'}</text>

  <rect x="650" y="159" width="250" height="72" rx="5" fill="#0F1520" fill-opacity="0.92" stroke="#1E293B" stroke-width="1"/>
  <text x="664" y="180" fill="#CBD5E1" font-size="11.5" font-weight="700">통치 인구 수 <tspan fill="#64748B" font-size="9.5">BEVÖLKERUNG</tspan></text>
  <text x="886" y="181" text-anchor="end" fill="#38BDF8" font-size="14.5" font-weight="800">${nPop.toFixed(2)} 억</text>
  <rect x="664" y="192" width="222" height="9" rx="2" fill="#07090D" stroke="#334155" stroke-width="0.8"/>
  <rect x="664" y="192" width="${(nPop * 2.22).toFixed(1)}" height="9" rx="2" fill="url(#cyanGrad)"/>
  <text x="664" y="218" fill="#94A3B8" font-size="9.5">알테아 등록 시민 · 수용 한계 100.0 억</text>

  <rect x="650" y="240" width="250" height="72" rx="5" fill="#0F1520" fill-opacity="0.92" stroke="#1E293B" stroke-width="1"/>
  <text x="664" y="261" fill="#CBD5E1" font-size="11.5" font-weight="700">기술·산업 발전도 <tspan fill="#64748B" font-size="9.5">ENTWICKLUNG</tspan></text>
  <text x="886" y="262" text-anchor="end" fill="#38BDF8" font-size="14.5" font-weight="800">${nDev.toFixed(1)}%</text>
  <rect x="664" y="273" width="222" height="9" rx="2" fill="#07090D" stroke="#334155" stroke-width="0.8"/>
  <rect x="664" y="273" width="${(nDev * 2.22).toFixed(1)}" height="9" rx="2" fill="url(#cyanGrad)"/>
  <text x="664" y="299" fill="#94A3B8" font-size="9.5">발할라-IX 코어 연산 · 궤도 산업망 가동</text>

  <rect x="650" y="321" width="250" height="73" rx="5" fill="#0F1520" fill-opacity="0.92" stroke="#1E293B" stroke-width="1"/>
  <text x="664" y="342" fill="#CBD5E1" font-size="11.5" font-weight="700">사상 위험도 <tspan fill="#64748B" font-size="9.5">GEDANKENRISIKO</tspan></text>
  <text x="886" y="343" text-anchor="end" fill="#F87171" font-size="14.5" font-weight="800">${nRisk.toFixed(1)}%</text>
  <rect x="664" y="354" width="222" height="9" rx="2" fill="#07090D" stroke="#334155" stroke-width="0.8"/>
  <rect x="664" y="354" width="${(nRisk * 2.22).toFixed(1)}" height="9" rx="2" fill="url(#riskGrad)"/>
  <line x1="882.4" y1="351" x2="882.4" y2="366" stroke="#FCA5A5" stroke-width="1.5"/>
  <text x="664" y="380" fill="${isCriticalRisk ? '#F87171' : '#94A3B8'}" font-size="9.5">${isCriticalRisk ? '경고: 98.4% 돌파! 구금 프로토콜 발동' : '구금 임계선 98.4% 미만 · 감시망 가동'}</text>

  <!-- 하단 브리핑 -->
  <rect x="20" y="406" width="880" height="38" rx="4" fill="#0F172A" stroke="#C5A059" stroke-width="1" stroke-opacity="0.55"/>
  <rect x="30" y="414" width="90" height="22" rx="3" fill="#C5A059" fill-opacity="0.2" stroke="#C5A059" stroke-width="0.8"/>
  <text x="75" y="429" text-anchor="middle" fill="#E2C07D" font-size="10.5" font-weight="800">DIREKTIVE</text>
  <text x="132" y="429" fill="#E2E8F0" font-size="11.5">${directive}</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(svg);
}
