// トップ画面のボール状キャラクター
// - 目がマウスカーソルを追いかける
// - なでると跳ねる / 近づくと照れる
// - つかんで投げられる / クリックすると話しかけてくる
(() => {
  const canvas = document.getElementById("ball-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const GRAVITY = 0.45;
  const BOUNCE = 0.72;
  const FRICTION = 0.995;
  const FLOOR_FRICTION = 0.92;
  // 床の下に「下にスクロール」の表示スペースを空ける
  const FLOOR_MARGIN = 96;

  const COLORS = [
    { base: "#ff4d9a", light: "#ffb3d4" },
    { base: "#5ef3ff", light: "#d4fcff" },
    { base: "#b455ff", light: "#e3c4ff" },
    { base: "#ffd166", light: "#fff0c7" },
  ];

  const MESSAGES = [
    "こんにちは！",
    "STELAQへようこそ",
    "ぽよん",
    "C++ 書いてます",
    "Python すき",
    "なげてもいいよ",
    "ゆっくりしていってね",
  ];

  const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false, down: false };
  let width = 0;
  let height = 0;
  let balls = [];
  let grabbed = null;
  let grabStart = null;
  let running = true;

  function createBall(i, count) {
    const r = Math.max(34, Math.min(70, width / 16)) * (i === 0 ? 1.25 : 0.8 + Math.random() * 0.3);
    return {
      x: width * (0.45 + (i / count) * 0.45),
      y: -r - i * 120,
      vx: (Math.random() - 0.5) * 4,
      vy: 0,
      r,
      color: COLORS[i % COLORS.length],
      squash: 0,
      blink: 0,
      nextBlink: 60 + Math.random() * 180,
      surprised: 0,
      bubble: null,
    };
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (balls.length === 0) {
      const count = width < 640 ? 3 : 4;
      balls = Array.from({ length: count }, (_, i) => createBall(i, count));
    }
    for (const b of balls) {
      b.x = Math.min(Math.max(b.x, b.r), width - b.r);
    }
  }

  function toLocal(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function hitTest(x, y) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (Math.hypot(x - b.x, y - b.y) <= b.r) return b;
    }
    return null;
  }

  function say(b) {
    b.bubble = { text: MESSAGES[Math.floor(Math.random() * MESSAGES.length)], life: 150 };
  }

  // ---------- 入力 ----------
  function onMove(e) {
    const p = toLocal(e);
    pointer.vx = p.x - pointer.x;
    pointer.vy = p.y - pointer.y;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = true;

    if (grabbed) return;

    // なでると押される
    const speed = Math.hypot(pointer.vx, pointer.vy);
    if (speed > 2 && speed < 200) {
      for (const b of balls) {
        if (Math.hypot(pointer.x - b.x, pointer.y - b.y) < b.r) {
          b.vx += pointer.vx * 0.25;
          b.vy += pointer.vy * 0.25 - 2;
          b.surprised = 30;
        }
      }
    }
    canvas.style.cursor = hitTest(p.x, p.y) ? "grab" : "default";
  }

  function onDown(e) {
    const p = toLocal(e);
    const b = hitTest(p.x, p.y);
    if (!b) return;
    grabbed = b;
    grabStart = { x: p.x, y: p.y, t: performance.now() };
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.vx = 0;
    pointer.vy = 0;
    // 掴んだボールを最前面に
    balls.splice(balls.indexOf(b), 1);
    balls.push(b);
    canvas.style.cursor = "grabbing";
    if (e.pointerId !== undefined) canvas.setPointerCapture(e.pointerId);
  }

  function onUp(e) {
    if (!grabbed) return;
    const p = toLocal(e);
    const moved = Math.hypot(p.x - grabStart.x, p.y - grabStart.y);
    const elapsed = performance.now() - grabStart.t;
    if (moved < 6 && elapsed < 300) {
      // クリック: ジャンプして話す
      grabbed.vy = -12;
      grabbed.vx += (Math.random() - 0.5) * 6;
      say(grabbed);
    } else {
      // 投げる
      grabbed.vx = clamp(pointer.vx, -40, 40);
      grabbed.vy = clamp(pointer.vy, -40, 40);
    }
    grabbed = null;
    canvas.style.cursor = "grab";
  }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", () => {
    if (!grabbed) pointer.inside = false;
  });
  // スマートフォン: ボールに触れたときだけスクロールを止める
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      const p = toLocal(t);
      if (hitTest(p.x, p.y)) e.preventDefault();
    },
    { passive: false }
  );

  // ---------- 物理演算 ----------
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function floorY() {
    return height - FLOOR_MARGIN;
  }

  function drawFloor() {
    const y = floorY();
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, "rgba(255, 77, 154, 0)");
    grad.addColorStop(0.5, "rgba(255, 77, 154, 0.6)");
    grad.addColorStop(1, "rgba(255, 77, 154, 0)");
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.shadowColor = "#ff4d9a";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function update() {
    // 止まってから離したときに飛んでいかないよう、ポインタ速度を減衰させる
    pointer.vx *= 0.8;
    pointer.vy *= 0.8;
    for (const b of balls) {
      if (b === grabbed) {
        const tx = pointer.x;
        const ty = pointer.y;
        b.vx = (tx - b.x) * 0.5;
        b.vy = (ty - b.y) * 0.5;
        b.x += b.vx;
        b.y += b.vy;
      } else {
        b.vy += GRAVITY;
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        b.x += b.vx;
        b.y += b.vy;
      }

      // 床
      if (b.y + b.r > floorY()) {
        b.y = floorY() - b.r;
        if (b.vy > 2) b.squash = Math.min(0.35, b.vy * 0.025);
        b.vy *= -BOUNCE;
        b.vx *= FLOOR_FRICTION;
        if (Math.abs(b.vy) < 1) b.vy = 0;
      }
      // 壁
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * BOUNCE;
      } else if (b.x + b.r > width) {
        b.x = width - b.r;
        b.vx = -Math.abs(b.vx) * BOUNCE;
      }
      // 上方向は少しだけはみ出しを許す
      if (b.y - b.r < -height) {
        b.y = -height + b.r;
        b.vy = Math.abs(b.vy) * BOUNCE;
      }

      b.squash *= 0.85;
      if (b.surprised > 0) b.surprised--;

      // まばたき
      b.nextBlink--;
      if (b.nextBlink <= 0) {
        b.blink = 10;
        b.nextBlink = 120 + Math.random() * 240;
      }
      if (b.blink > 0) b.blink--;

      if (b.bubble) {
        b.bubble.life--;
        if (b.bubble.life <= 0) b.bubble = null;
      }
    }

    // ボール同士の衝突
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const overlap = a.r + b.r - dist;
        if (overlap <= 0) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const ma = a === grabbed ? Infinity : a.r * a.r;
        const mb = b === grabbed ? Infinity : b.r * b.r;
        const wa = ma === Infinity ? 0 : mb === Infinity ? 1 : mb / (ma + mb);
        const wb = 1 - wa;
        a.x -= nx * overlap * wa;
        a.y -= ny * overlap * wa;
        b.x += nx * overlap * wb;
        b.y += ny * overlap * wb;

        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          const impulse = -(1 + BOUNCE) * rel;
          a.vx -= impulse * nx * wa;
          a.vy -= impulse * ny * wa;
          b.vx += impulse * nx * wb;
          b.vy += impulse * ny * wb;
        }
      }
    }
  }

  // ---------- 描画 ----------
  function drawBall(b) {
    const speed = Math.hypot(b.vx, b.vy);
    const stretch = Math.min(0.12, speed * 0.006);
    const sx = 1 + b.squash - stretch * 0.5;
    const sy = 1 - b.squash + stretch;

    const near = pointer.inside && Math.hypot(pointer.x - b.x, pointer.y - b.y) < b.r * 2.2;
    const isGrabbed = b === grabbed;

    ctx.save();
    // 床に接しているときは底を基準につぶす
    ctx.translate(b.x, b.y + b.r * (1 - sy));
    ctx.scale(sx, sy);

    // からだ
    ctx.shadowColor = b.color.base;
    ctx.shadowBlur = 28;
    const grad = ctx.createRadialGradient(-b.r * 0.35, -b.r * 0.4, b.r * 0.1, 0, 0, b.r);
    grad.addColorStop(0, b.color.light);
    grad.addColorStop(1, b.color.base);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ハイライト
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-b.r * 0.42, -b.r * 0.5, b.r * 0.16, b.r * 0.09, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // ほっぺ
    if (near || isGrabbed) {
      ctx.fillStyle = "rgba(255, 90, 140, 0.45)";
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * b.r * 0.55, b.r * 0.18, b.r * 0.14, b.r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 目（カーソルを追う）
    let lookX = 0;
    let lookY = 0;
    if (pointer.inside) {
      const ang = Math.atan2(pointer.y - b.y, pointer.x - b.x);
      const d = Math.min(1, Math.hypot(pointer.x - b.x, pointer.y - b.y) / (b.r * 3));
      lookX = Math.cos(ang) * d;
      lookY = Math.sin(ang) * d;
    }
    const eyeR = b.r * 0.19;
    const blinkScale = b.blink > 0 ? Math.abs(b.blink - 5) / 5 : 1;
    const eyeOpen = b.surprised > 0 || isGrabbed ? 1.15 : 1;
    for (const side of [-1, 1]) {
      const ex = side * b.r * 0.3;
      const ey = -b.r * 0.08;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.scale(1, Math.max(0.08, blinkScale) * eyeOpen);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0b24";
      ctx.beginPath();
      ctx.arc(lookX * eyeR * 0.45, lookY * eyeR * 0.45, eyeR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(lookX * eyeR * 0.45 - eyeR * 0.18, lookY * eyeR * 0.45 - eyeR * 0.2, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 口
    ctx.strokeStyle = "#1a0b24";
    ctx.fillStyle = "#1a0b24";
    ctx.lineWidth = Math.max(2, b.r * 0.06);
    ctx.lineCap = "round";
    const my = b.r * 0.28;
    if (b.surprised > 0 || isGrabbed) {
      ctx.beginPath();
      ctx.ellipse(0, my, b.r * 0.09, b.r * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (near) {
      ctx.beginPath();
      ctx.arc(0, my - b.r * 0.06, b.r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, my - b.r * 0.08, b.r * 0.1, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();

    if (b.bubble) drawBubble(b);
  }

  function drawBubble(b) {
    const alpha = Math.min(1, b.bubble.life / 20);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '600 14px "Noto Sans JP", sans-serif';
    const w = ctx.measureText(b.bubble.text).width + 24;
    const h = 32;
    const x = clamp(b.x - w / 2, 8, width - w - 8);
    const y = Math.max(8, b.y - b.r - h - 16);

    ctx.fillStyle = "rgba(10, 4, 16, 0.85)";
    ctx.strokeStyle = b.color.base;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe8f2";
    ctx.textBaseline = "middle";
    ctx.fillText(b.bubble.text, x + 12, y + h / 2);
    ctx.restore();
  }

  function frame() {
    if (!running) return;
    update();
    ctx.clearRect(0, 0, width, height);
    drawFloor();
    for (const b of balls) drawBall(b);
    requestAnimationFrame(frame);
  }

  // 画面外にあるときは停止して負荷を下げる
  new IntersectionObserver(([entry]) => {
    const visible = entry.isIntersecting;
    if (visible && !running) {
      running = true;
      requestAnimationFrame(frame);
    } else if (!visible) {
      running = false;
    }
  }).observe(canvas);

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);

  // 少し待ってから最初のあいさつ
  setTimeout(() => balls[0] && say(balls[0]), 1800);
})();
