// Global Game State
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const centerMsg = document.getElementById('centerMessage');
const playerCountP1El = document.getElementById('playerCountP1');
const playerCountP2El = document.getElementById('playerCountP2');
const p1InputEl = document.getElementById('p1Input');
const p2InputEl = document.getElementById('p2Input');
const levelEl = document.getElementById('currentLevel');
const progressBar = document.getElementById('progressBar');
const mainMenu = document.getElementById('mainMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const gameInstructions = document.getElementById('gameInstructions');

// Assets
const catImgs = [
  new Image(),
  new Image(),
  new Image()
];
catImgs[0].src = 'xiaomao1.png';
catImgs[1].src = 'xiaomao2.png';
catImgs[2].src = 'xiaomao3.png';

// Distraction image
const distractionImg = new Image();
distractionImg.src = 'ganrao.png';

// Preload assets
let assetsLoaded = false;
const loadingScreen = document.getElementById('loadingScreen');

function loadAssets() {
  return new Promise((resolve) => {
    // Show loading screen
    loadingScreen.style.display = 'flex';
    mainMenu.style.display = 'none';
    
    let loadedCount = 0;
    const totalAssets = catImgs.length + 1; // +1 for distraction image
    
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalAssets) {
        assetsLoaded = true;
        // Hide loading screen
        loadingScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        resolve();
      }
    };
    
    let allComplete = true;
    
    // Load cat images
    catImgs.forEach((img, index) => {
      if (img.complete) {
        checkLoaded();
      } else {
        allComplete = false;
        img.onload = checkLoaded;
        img.onerror = () => {
          console.error(`Failed to load cat image ${index + 1}`);
          checkLoaded();
        };
      }
    });
    
    // Load distraction image
    if (distractionImg.complete) {
      checkLoaded();
    } else {
      allComplete = false;
      distractionImg.onload = checkLoaded;
      distractionImg.onerror = () => {
        console.error('Failed to load distraction image');
        checkLoaded();
      };
    }
    
    if (allComplete) {
      checkLoaded();
    }
  });
}

// Initialize assets
loadAssets();

// Constants
const KEYS = { 
  P1_COUNT: 'q', 
  P1_END: 'z', 
  P2_COUNT: 'p', 
  P2_END: 'm' 
};
const PHASE = {
  MENU: 'MENU',
  PREP: 'PREP',      // Show "How many?"
  FLASH: 'FLASH',    // Show birds
  INPUT: 'INPUT',    // Counting time
  RESULT: 'RESULT',  // Show round result
  GAMEOVER: 'GAMEOVER'
};

let state = {
  phase: PHASE.MENU,
  mode: 'easy',
  level: 1,
  inputs: { p1: 0, p2: 0 },
  locked: { p1: false, p2: false },
  finished: { p1: false, p2: false }, // 标记玩家是否完成当前关卡
  targetCount: 0,
  items: [], // { x, y, type, color, shape, startTime, duration, jumping }
  timers: [], // { id, type: 'timeout'|'interval' }
  startTime: 0,
  inputPhaseStartTime: 0,
  completionTimes: { p1: [], p2: [] }, // 记录每关完成时间
  errorCounts: { p1: 0, p2: 0 } // 记录错误次数
};

// Load Max Streak
let maxStreak = parseInt(localStorage.getItem('cb_max_streak') || '0');

// Resize Canvas
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handler
window.addEventListener('keydown', (e) => {
  if (state.phase !== PHASE.INPUT) return;
  
  const key = e.key.toLowerCase();
  const now = Date.now();
  
  // 玩家1操作
  if (key === KEYS.P1_COUNT && !state.locked.p1 && !state.finished.p1) {
    state.inputs.p1++;
    // 隐藏底部输入反馈窗口，只更新顶部显示
    playerCountP1El.textContent = state.inputs.p1;
    // Visual feedback
    triggerFeedback(100, window.innerHeight - 100, 'var(--p1-color)');
  }
  
  if (key === KEYS.P1_END && !state.locked.p1 && !state.finished.p1) {
    state.finished.p1 = true;
    state.locked.p1 = true;
    // 记录完成时间
    const completionTime = now - state.inputPhaseStartTime;
    state.completionTimes.p1.push(completionTime);
    // 判断结果
    const isCorrect = state.inputs.p1 === state.targetCount;
    if (!isCorrect) {
      state.errorCounts.p1++;
    }
    // 显示结果反馈在顶部P1区域
    showPlayerResult(1, isCorrect);
    // 检查是否所有玩家都已完成
    checkAllPlayersFinished();
  }
  
  // 玩家2操作
  if (key === KEYS.P2_COUNT && !state.locked.p2 && !state.finished.p2) {
    state.inputs.p2++;
    // 隐藏底部输入反馈窗口，只更新顶部显示
    playerCountP2El.textContent = state.inputs.p2;
    triggerFeedback(window.innerWidth - 100, window.innerHeight - 100, 'var(--p2-color)');
  }
  
  if (key === KEYS.P2_END && !state.locked.p2 && !state.finished.p2) {
    state.finished.p2 = true;
    state.locked.p2 = true;
    // 记录完成时间
    const completionTime = now - state.inputPhaseStartTime;
    state.completionTimes.p2.push(completionTime);
    // 判断结果
    const isCorrect = state.inputs.p2 === state.targetCount;
    if (!isCorrect) {
      state.errorCounts.p2++;
    }
    // 显示结果反馈在顶部P2区域
    showPlayerResult(2, isCorrect);
    // 检查是否所有玩家都已完成
    checkAllPlayersFinished();
  }
});

function triggerFeedback(x, y, color) {
  // Simple particle or ripple could go here
}

// 显示玩家结果反馈
function showPlayerResult(player, isCorrect) {
  // 获取顶部玩家显示区域
  const scoreEl = document.querySelector(player === 1 ? '.p1-score' : '.p2-score');
  const countEl = player === 1 ? playerCountP1El : playerCountP2El;
  const color = isCorrect ? '#4caf50' : '#f44336';
  const symbol = isCorrect ? '✓' : '✗';
  
  // 更新顶部显示区域的样式和内容
  scoreEl.style.backgroundColor = color;
  scoreEl.style.opacity = '0.9';
  scoreEl.style.boxShadow = `0 0 20px ${color}80`;
  
  // 在数量旁边显示对错符号
  countEl.textContent = `${state.inputs[player === 1 ? 'p1' : 'p2']} ${symbol}`;
  countEl.style.color = '#ffffff';
  countEl.style.fontWeight = 'bold';
  
  // 隐藏底部输入反馈窗口
  const inputEl = player === 1 ? p1InputEl : p2InputEl;
  inputEl.textContent = '';
  inputEl.style.backgroundColor = 'transparent';
  inputEl.style.boxShadow = 'none';
}

// 检查是否所有玩家都已完成
function checkAllPlayersFinished() {
  if (state.finished.p1 && state.finished.p2) {
    // 所有玩家都已完成，显示对错1秒后进入下一关
    startTimer(() => {
      endRound();
    }, 1000); // 给玩家1秒时间查看结果
  }
}

// Game Loop
function startGame(mode) {
  // Clear existing timers
  clearTimers();

  // 完全重置游戏状态
  state.mode = mode;
  state.level = 1;
  state.inputs = { p1: 0, p2: 0 };
  state.locked = { p1: false, p2: false };
  state.finished = { p1: false, p2: false };
  state.targetCount = 0;
  state.items = [];
  state.timers = [];
  state.startTime = 0;
  state.inputPhaseStartTime = 0;
  state.completionTimes = { p1: [], p2: [] };
  state.errorCounts = { p1: 0, p2: 0 };
  state.phase = PHASE.PREP;
  
  // 完全重置UI状态
  mainMenu.classList.add('hidden');
  gameOverMenu.classList.add('hidden');
  
  // 重置顶部玩家显示区域
  const p1ScoreEl = document.querySelector('.p1-score');
  const p2ScoreEl = document.querySelector('.p2-score');
  p1ScoreEl.style.backgroundColor = '';
  p1ScoreEl.style.opacity = '';
  p1ScoreEl.style.boxShadow = '';
  p2ScoreEl.style.backgroundColor = '';
  p2ScoreEl.style.opacity = '';
  p2ScoreEl.style.boxShadow = '';
  
  // 重置计数显示
  playerCountP1El.textContent = '0';
  playerCountP2El.textContent = '0';
  playerCountP1El.style.color = '';
  playerCountP2El.style.color = '';
  
  // 重置底部输入反馈
  p1InputEl.textContent = '';
  p2InputEl.textContent = '';
  p1InputEl.style.color = '';
  p2InputEl.style.color = '';
  p1InputEl.style.backgroundColor = '';
  p2InputEl.style.backgroundColor = '';
  p1InputEl.style.boxShadow = '';
  p2InputEl.style.boxShadow = '';
  
  updateUI();
  
  // 添加3秒倒计时
  showCountdown(() => {
    startLevel();
  });
}

// 3秒倒计时功能
function showCountdown(callback) {
  let count = 3;
  
  // 创建倒计时元素
  const countdownEl = document.createElement('div');
  countdownEl.id = 'countdown';
  countdownEl.textContent = count;
  
  document.body.appendChild(countdownEl);
  
  // 倒计时动画
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else {
      clearInterval(interval);
      countdownEl.textContent = 'GO!';
      countdownEl.style.color = 'var(--p1-color)';
      countdownEl.style.textShadow = '0 0 30px var(--p1-color)';
      
      // 移除倒计时元素
      setTimeout(() => {
        document.body.removeChild(countdownEl);
        callback();
      }, 500);
    }
  }, 1000);
}

function startLevel() {
  clearTimers();
  
  // Reset Level State
  state.inputs = { p1: 0, p2: 0 };
  state.locked = { p1: false, p2: false };
  state.finished = { p1: false, p2: false };
  state.items = [];
  state.roundWinner = null;
  
  // 重置底部输入反馈窗口
  p1InputEl.textContent = '';
  p2InputEl.textContent = '';
  p1InputEl.style.color = '';
  p2InputEl.style.color = '';
  
  // 重置顶部玩家显示区域的样式
  const p1ScoreEl = document.querySelector('.p1-score');
  const p2ScoreEl = document.querySelector('.p2-score');
  p1ScoreEl.style.backgroundColor = '';
  p1ScoreEl.style.opacity = '';
  p1ScoreEl.style.boxShadow = '';
  p2ScoreEl.style.backgroundColor = '';
  p2ScoreEl.style.opacity = '';
  p2ScoreEl.style.boxShadow = '';
  
  // 重置计数显示，去掉对错符号
  playerCountP1El.textContent = '0';
  playerCountP2El.textContent = '0';
  playerCountP1El.style.color = '';
  playerCountP2El.style.color = '';
  
  updateUI();

  // Skip PREP phase, directly go to FLASH phase
  startFlashPhase();
}

function startFlashPhase() {
  state.phase = PHASE.FLASH;
  hideMessage();
  
  // Config
  const modeConfig = GAME_CONFIG.modes[state.mode];
  const levelCfg = GAME_CONFIG.levelConfig[state.level - 1];
  
  // Generate Cats
  const min = modeConfig.catRange[0] + Math.floor((state.level - 1) * 0.5); // Slight increase
  const max = Math.min(modeConfig.catRange[1] + state.level, 20); // Cap at 20
  
  // Determine count
  state.targetCount = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Reset player count displays
  playerCountP1El.textContent = '0';
  playerCountP2El.textContent = '0';
  
  // Generate 2-4 distraction elements per level
  const distractionCount = Math.floor(Math.random() * 3) + 2; // 2-4 distractions
  
  // Generate Items
  generateItems(state.targetCount, distractionCount);
  
  // 立即开始输入阶段，无需等待
  startInputPhase();
}

function generateItems(catCount, distractionCount) {
  state.items = [];
  const padding = 100;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;
  
  // 检查当前关卡是否需要跳动干扰
  const modeConfig = GAME_CONFIG.modes[state.mode];
  const isJumpLevel = modeConfig.jumpLevels.includes(state.level);
  
  // 根据模式和关卡获取移动速度
  const getMoveSpeed = () => {
    const level = state.level;
    const mode = state.mode;
    
    if (mode === 'easy') {
      // 简单模式：所有关卡图片固定
      return 0;
    } else if (mode === 'standard') {
      // 标准模式：第6关及以后的5个关卡缓慢移动
      if (level >= 6 && level <= 10) {
        return 0.5 + Math.random() * 0.5; // 缓慢速度：0.5-1
      }
      return 0;
    } else if (mode === 'hard') {
      // 地狱模式：不同关卡不同速度
      if (level >= 1 && level <= 3) {
        return 0.5 + Math.random() * 0.5; // 缓慢速度：0.5-1
      } else if (level >= 4 && level <= 6) {
        return 1 + Math.random() * 1; // 正常速度：1-2
      } else if (level >= 7 && level <= 10) {
        return 2 + Math.random() * 2; // 快速速度：2-4
      }
    }
    return 0;
  };
  
  // 生成随机位置，确保不重叠
  const generateNonOverlappingPosition = (size) => {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      attempts++;
      const x = padding + Math.random() * w;
      const y = padding + Math.random() * h;
      
      // 检查是否与现有元素重叠
      let overlaps = false;
      for (const item of state.items) {
        const dx = x - item.x;
        const dy = y - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (size + item.size) / 2) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        return { x, y };
      }
    }
    
    // 如果尝试多次失败，返回一个随机位置
    return { x: padding + Math.random() * w, y: padding + Math.random() * h };
  };
  
  // Add Cats
  for (let i = 0; i < catCount; i++) {
    const size = 30 + Math.random() * 20;
    const pos = generateNonOverlappingPosition(size);
    const speed = getMoveSpeed();
    
    const cat = {
      x: pos.x,
      y: pos.y,
      type: 'cat',
      color: '#000', // Cat color
      size: size,
      jumping: isJumpLevel,
      baseX: pos.x,
      baseY: pos.y,
      jumpStartTime: Date.now() + Math.random() * 1000,
      jumpInterval: 500 + Math.random() * 500,
      catType: Math.floor(Math.random() * catImgs.length), // 随机选择一种猫的图片
      // 移动属性
      speed: speed,
      vx: speed * (Math.random() * 2 - 1), // 随机水平速度
      vy: speed * (Math.random() * 2 - 1)  // 随机垂直速度
    };
    state.items.push(cat);
  }
  
  // Add Distractions
  for (let i = 0; i < distractionCount; i++) {
    const size = 30 + Math.random() * 20;
    const pos = generateNonOverlappingPosition(size);
    const speed = getMoveSpeed();
    
    const distraction = {
      x: pos.x,
      y: pos.y,
      type: 'distraction',
      color: '#ff0000', // 干扰元素颜色
      size: size,
      // 移动属性
      speed: speed,
      vx: speed * (Math.random() * 2 - 1), // 随机水平速度
      vy: speed * (Math.random() * 2 - 1)  // 随机垂直速度
    };
    state.items.push(distraction);
  }
}

function startInputPhase() {
  state.phase = PHASE.INPUT;
  state.inputPhaseStartTime = Date.now();
  hideMessage(); // Ensure no messages are shown
  
  // 移除时间限制，玩家可以自由控制计数时间
  // 玩家1: 按"q"键计数，按"z"键结束
  // 玩家2: 按"p"键计数，按"m"键结束
}

function endRound() {
  state.phase = PHASE.RESULT;
  
  // Hide message immediately
  hideMessage();
  
  // Next Level or Game Over
  // Implement seamless level transition by removing the delay
  if (state.level >= 10) {
    endGame();
  } else {
    state.level++;
    startLevel();
  }
}

// 添加烟花效果函数
function createFireworks() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10000';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const startTime = Date.now();
  const duration = 5000; // 绽放5秒
  const fadeOutDuration = 1000; // 1秒渐淡结束
  
  // 创建烟花
  function createExplosion(x, y) {
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
      });
    }
  }
  
  // 动画循环
  function animate() {
    const elapsed = Date.now() - startTime;
    
    // 计算全局透明度，实现渐淡效果
    let globalAlpha = 1;
    if (elapsed > duration - fadeOutDuration) {
      // 进入渐淡阶段
      globalAlpha = 1 - (elapsed - (duration - fadeOutDuration)) / fadeOutDuration;
    }
    
    // 完全结束
    if (elapsed > duration) {
      document.body.removeChild(canvas);
      return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = globalAlpha;
    
    // 前4秒持续创建新烟花，最后1秒停止创建，只显示现有粒子
    if (elapsed < duration - fadeOutDuration && Math.random() < 0.2) {
      createExplosion(Math.random() * canvas.width, Math.random() * canvas.height / 2);
    }
    
    // 更新和绘制粒子
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // 重力
      particle.life -= particle.decay;
      
      if (particle.life > 0) {
        const particleAlpha = particle.life * globalAlpha;
        ctx.globalAlpha = particleAlpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // 移除死亡粒子
    while (particles.length > 0 && particles[0].life <= 0) {
      particles.shift();
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

function endGame() {
  state.phase = PHASE.GAMEOVER;
  gameOverMenu.classList.remove('hidden');
  
  // 计算总用时
  const p1TotalTime = state.completionTimes.p1.reduce((sum, time) => sum + time, 0) / 1000; // 转换为秒
  const p2TotalTime = state.completionTimes.p2.reduce((sum, time) => sum + time, 0) / 1000; // 转换为秒
  
  // 计算惩罚时间
  const p1ErrorCount = state.errorCounts.p1;
  const p2ErrorCount = state.errorCounts.p2;
  const p1Penalty = p1ErrorCount * 6;
  const p2Penalty = p2ErrorCount * 6;
  
  // 计算最终时间
  const p1FinalTime = p1TotalTime + p1Penalty;
  const p2FinalTime = p2TotalTime + p2Penalty;
  
  // 判定胜负
  let winMsg = "";
  if (p1FinalTime < p2FinalTime) {
    winMsg = "玩家1 获胜!";
  } else if (p2FinalTime < p1FinalTime) {
    winMsg = "玩家2 获胜!";
  } else {
    winMsg = "平局!";
  }
  
  // 显示详细结果
  const winnerDisplay = document.getElementById('winnerDisplay');
  winnerDisplay.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 30px;">${winMsg}</div>
    <div style="display: flex; justify-content: center; gap: 40px; margin-bottom: 30px; flex-wrap: wrap;">
      <div style="text-align: left; font-size: 18px; margin: 10px 0; background: rgba(255, 255, 255, 0.08); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); min-width: 250px;">
        <strong style="color: var(--p1-color);">玩家1:</strong><br>
        总用时: ${p1TotalTime.toFixed(2)}秒<br>
        失误次数: ${p1ErrorCount}次<br>
        惩罚时间: ${p1ErrorCount} × 6秒 = ${p1Penalty}秒<br>
        最终时间: <span id="p1FinalTimeDisplay">1.00</span>秒
      </div>
      <div style="text-align: left; font-size: 18px; margin: 10px 0; background: rgba(255, 255, 255, 0.08); padding: 20px; border-radius: 16px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); min-width: 250px;">
        <strong style="color: var(--p2-color);">玩家2:</strong><br>
        总用时: ${p2TotalTime.toFixed(2)}秒<br>
        失误次数: ${p2ErrorCount}次<br>
        惩罚时间: ${p2ErrorCount} × 6秒 = ${p2Penalty}秒<br>
        最终时间: <span id="p2FinalTimeDisplay">1.00</span>秒
      </div>
    </div>
  `;
  
  // 实现最终时间的数秒过渡效果
  function animateTime(elementId, targetTime, duration = 1000) {
    const element = document.getElementById(elementId);
    const startTime = Date.now();
    const startValue = 1;
    
    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = startValue + (targetTime - startValue) * progress;
      element.textContent = currentValue.toFixed(2);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    update();
  }
  
  // 启动时间动画
  animateTime('p1FinalTimeDisplay', p1FinalTime);
  animateTime('p2FinalTimeDisplay', p2FinalTime);
  
  // 延迟显示烟花效果
  setTimeout(() => {
    createFireworks();
  }, 1000);
}

function showMainMenu() {
  mainMenu.classList.remove('hidden');
  gameOverMenu.classList.add('hidden');
  gameInstructions.classList.add('hidden');
}

function restartGame() {
  startGame(state.mode);
}

// 显示游戏说明
function showGameInstructions() {
  mainMenu.classList.add('hidden');
  gameInstructions.classList.remove('hidden');
}

// 隐藏游戏说明
function hideGameInstructions() {
  gameInstructions.classList.add('hidden');
  mainMenu.classList.remove('hidden');
}

// Helpers
function showMessage(text, timeout) {
  centerMsg.textContent = text;
  centerMsg.classList.add('visible');
  if (timeout) {
    setTimeout(hideMessage, timeout);
  }
}

function hideMessage() {
  centerMsg.classList.remove('visible');
}

function updateUI() {
  levelEl.textContent = '有几个小猫？';
}

function startTimer(fn, delay) {
  const t = setTimeout(() => {
    fn();
    // Auto-remove timer from state when it completes
    state.timers = state.timers.filter(timer => timer.id !== t);
  }, delay);
  state.timers.push({ id: t, type: 'timeout' });
  return t;
}

function startInterval(fn, interval) {
  const t = setInterval(fn, interval);
  state.timers.push({ id: t, type: 'interval' });
  return t;
}

function clearTimers() {
  state.timers.forEach(t => {
    if (t.type === 'interval') clearInterval(t.id);
    else clearTimeout(t.id);
  });
  state.timers = [];
}

function clearTimer(id) {
  const timer = state.timers.find(t => t.id === id);
  if (timer) {
    if (timer.type === 'interval') clearInterval(id);
    else clearTimeout(id);
    state.timers = state.timers.filter(t => t.id !== id);
  }
}

// Removed saveStats function as score system is no longer used

// Rendering Loop
function render() {
  // Clear and render in FLASH and INPUT phases so cats are always visible during counting
  if (state.phase === PHASE.FLASH || state.phase === PHASE.INPUT) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const now = Date.now();
    
    // 移动所有元素
    moveItems();
    
    // 检测碰撞
    detectCollisions();
    
    // 检测边界并反弹
    checkBoundaries();
    
    // 渲染所有元素
    state.items.forEach(item => {
      let drawX = item.x;
      let drawY = item.y;
      
      // 处理猫的跳动效果
      if (item.type === 'cat' && item.jumping) {
        const timeSinceStart = now - item.jumpStartTime;
        const jumpPhase = timeSinceStart % item.jumpInterval;
        const jumpProgress = jumpPhase / item.jumpInterval;
        
        // 小范围跳动
        if (jumpProgress < 0.5) {
          // 上升
          drawY = item.baseY - Math.sin(jumpProgress * Math.PI) * 10;
          drawX = item.baseX + Math.sin(jumpProgress * Math.PI * 2) * 5;
        } else {
          // 下降
          drawY = item.baseY - Math.sin((1 - jumpProgress) * Math.PI) * 10;
          drawX = item.baseX + Math.sin(jumpProgress * Math.PI * 2) * 5;
        }
      }
      
      if (item.type === 'cat') {
        // 获取对应的猫图片
        const catImg = catImgs[item.catType];
        if (catImg.complete) {
            ctx.drawImage(catImg, drawX - item.size/2, drawY - item.size/2, item.size, item.size);
        } else {
            // Fallback if not loaded yet
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(drawX, drawY, item.size/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
      } else if (item.type === 'distraction') {
        // 渲染干扰元素
        if (distractionImg.complete) {
            ctx.drawImage(distractionImg, drawX - item.size/2, drawY - item.size/2, item.size, item.size);
        } else {
            // Fallback if not loaded yet
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(drawX, drawY, item.size/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
      }
    });
  }
  
  // Use requestAnimationFrame for smooth animation
  requestAnimationFrame(render);
}

// 移动所有元素
function moveItems() {
  state.items.forEach(item => {
    if (item.speed > 0) {
      item.x += item.vx;
      item.y += item.vy;
    }
  });
}

// 检查边界并反弹
function checkBoundaries() {
  const padding = 100;
  
  state.items.forEach(item => {
    if (item.speed <= 0) return;
    
    // 左边界
    if (item.x - item.size/2 < padding) {
      item.x = padding + item.size/2;
      item.vx = Math.abs(item.vx); // 反弹，向右移动
    }
    // 右边界
    else if (item.x + item.size/2 > canvas.width - padding) {
      item.x = canvas.width - padding - item.size/2;
      item.vx = -Math.abs(item.vx); // 反弹，向左移动
    }
    
    // 上边界
    if (item.y - item.size/2 < padding) {
      item.y = padding + item.size/2;
      item.vy = Math.abs(item.vy); // 反弹，向下移动
    }
    // 下边界
    else if (item.y + item.size/2 > canvas.height - padding) {
      item.y = canvas.height - padding - item.size/2;
      item.vy = -Math.abs(item.vy); // 反弹，向上移动
    }
  });
}

// 检测元素间碰撞并反弹
function detectCollisions() {
  for (let i = 0; i < state.items.length; i++) {
    const item1 = state.items[i];
    if (item1.speed <= 0) continue;
    
    for (let j = i + 1; j < state.items.length; j++) {
      const item2 = state.items[j];
      if (item2.speed <= 0) continue;
      
      // 计算距离
      const dx = item2.x - item1.x;
      const dy = item2.y - item1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (item1.size + item2.size) / 2;
      
      // 检测碰撞
      if (distance < minDistance) {
        // 碰撞处理：反弹效果
        
        // 计算碰撞角度
        const angle = Math.atan2(dy, dx);
        
        // 计算新的速度分量
        const speed1 = Math.sqrt(item1.vx * item1.vx + item1.vy * item1.vy);
        const speed2 = Math.sqrt(item2.vx * item2.vx + item2.vy * item2.vy);
        
        // 反弹方向
        const newVx1 = speed1 * Math.cos(angle + Math.PI);
        const newVy1 = speed1 * Math.sin(angle + Math.PI);
        const newVx2 = speed2 * Math.cos(angle);
        const newVy2 = speed2 * Math.sin(angle);
        
        // 更新速度
        item1.vx = newVx1;
        item1.vy = newVy1;
        item2.vx = newVx2;
        item2.vy = newVy2;
        
        // 分离重叠的元素
        const overlap = minDistance - distance;
        const separationX = (overlap / 2) * Math.cos(angle);
        const separationY = (overlap / 2) * Math.sin(angle);
        
        item1.x -= separationX;
        item1.y -= separationY;
        item2.x += separationX;
        item2.y += separationY;
      }
    }
  }
}

// Start rendering loop when assets are loaded
loadAssets().then(() => {
  requestAnimationFrame(render);
});
