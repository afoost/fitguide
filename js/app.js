// FitGuide - Main Application
import { exercises, dietData, bodyTypeDescriptions, personalizedReasons } from './data.js';
import {
  calculateBMI, getBMICategory, determineBodyType,
  calculateProtein, calculateTDEE, getCurrentTrainingDay,
  getDayLabel, saveToStorage, loadFromStorage, formatDate
} from './utils.js';

// State
let state = {
  currentTab: 'home',
  profile: loadFromStorage('profile', null),
  weightRecords: loadFromStorage('weightRecords', []),
  currentBodyType: loadFromStorage('currentBodyType', null),
  goal: loadFromStorage('goal', 'maintain'),
  trainingStartDate: loadFromStorage('trainingStartDate', null),
  hasGenerated: false,
  explanationExpanded: false
};

// DOM Elements
const app = document.getElementById('app');

// Initialize
function init() {
  render();
  bindEvents();
}

function bindEvents() {
  // Use document level to catch events from modal overlays appended to body
  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('submit', handleSubmit);
}

function handleClick(e) {
  const target = e.target;

  // Tab navigation
  if (target.dataset.tab) {
    state.currentTab = target.dataset.tab;
    render();
    return;
  }

  // Tab buttons
  if (target.closest('.tab-btn')) {
    const tab = target.closest('.tab-btn').dataset.tab;
    state.currentTab = tab;
    render();
    return;
  }

  // Generate plan
  if (target.dataset.action === 'generate') {
    generatePlan();
    return;
  }

  // View exercise detail (use closest to handle clicks on child elements inside card)
  const exerciseCard = target.closest('[data-action="view-exercise"]');
  if (exerciseCard) {
    const day = exerciseCard.dataset.day;
    const index = parseInt(exerciseCard.dataset.index);
    showExerciseDetail(day, index);
    return;
  }

  // Close modal (click on overlay background or close button)
  if (target.dataset.action === 'close-modal' || target.closest('.modal-overlay') && !target.closest('.modal-content')) {
    closeModal();
    return;
  }

  // Record weight
  if (target.dataset.action === 'record-weight') {
    recordWeight();
    return;
  }

  // Update body type in profile tab
  if (target.dataset.action === 'update-body-type') {
    updateBodyType();
    return;
  }

  // Update goal
  if (target.dataset.action === 'update-goal') {
    const newGoal = target.dataset.goal;
    state.goal = newGoal;
    saveToStorage('goal', newGoal);
    render();
    return;
  }

  // Toggle explanation section
  if (target.dataset.action === 'toggle-explanation') {
    state.explanationExpanded = !state.explanationExpanded;
    render();
    return;
  }

  // Switch training day
  // Switch training day
  const dayBtn = target.closest('[data-action="switch-day"]');
  if (dayBtn) {
    showTrainingDay(dayBtn.dataset.day);
    return;
  }
}

function handleChange(e) {
  // Handle form changes if needed
}

function handleSubmit(e) {
  e.preventDefault();
}

function generatePlan() {
  const form = document.getElementById('profile-form');
  const formData = new FormData(form);

  const profile = {
    gender: formData.get('gender'),
    age: parseInt(formData.get('age')),
    height: parseInt(formData.get('height')),
    weight: parseFloat(formData.get('weight')),
    bodyFrame: formData.get('bodyFrame'),
    fatDistribution: formData.get('fatDistribution'),
    metabolism: formData.get('metabolism'),
    activityLevel: formData.get('activityLevel')
  };

  // Validate
  if (!profile.gender || !profile.age || !profile.height || !profile.weight) {
    showToast('请填写所有必填项');
    return;
  }

  if (!profile.bodyFrame || !profile.fatDistribution || !profile.metabolism) {
    showToast('请选择体型特征');
    return;
  }

  state.profile = profile;
  state.currentBodyType = determineBodyType(profile);
  state.hasGenerated = true;

  if (!state.trainingStartDate) {
    state.trainingStartDate = new Date().toISOString();
    saveToStorage('trainingStartDate', state.trainingStartDate);
  }

  saveToStorage('profile', profile);
  saveToStorage('currentBodyType', state.currentBodyType);

  // Record initial weight
  const today = formatDate(new Date());
  const existingIndex = state.weightRecords.findIndex(r => r.date === today);
  if (existingIndex === -1) {
    state.weightRecords.push({ date: today, weight: profile.weight });
    saveToStorage('weightRecords', state.weightRecords);
  }

  render();
  showToast(`体型判断:${dietData[state.currentBodyType].label},方案已生成!`);
}


function recordWeight() {
  const weightInput = document.getElementById('weight-input');
  const weight = parseFloat(weightInput.value);

  if (!weight || weight <= 0) {
    showToast('请输入有效体重');
    return;
  }

  const today = formatDate(new Date());
  const existingIndex = state.weightRecords.findIndex(r => r.date === today);

  if (existingIndex >= 0) {
    state.weightRecords[existingIndex].weight = weight;
  } else {
    state.weightRecords.push({ date: today, weight: weight });
  }

  state.weightRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveToStorage('weightRecords', state.weightRecords);
  weightInput.value = '';

  render();
  showToast('体重已记录!');
}

function updateBodyType() {
  const select = document.getElementById('body-type-select');
  const newType = select.value;

  if (newType && state.profile) {
    state.currentBodyType = newType;
    state.profile.bodyType = newType;
    saveToStorage('currentBodyType', newType);
    saveToStorage('profile', state.profile);
    render();
    showToast(`体型已更新为:${dietData[newType].label}`);
  }
}

function showTrainingDay(day) {
  // Update active day in state, then re-render
  const days = ['push', 'pull', 'legs'];
  const dayIndex = days.indexOf(day);
  const trainingDay = state.trainingStartDate ? getCurrentTrainingDay(state.trainingStartDate) : 0;
  const isActive = dayIndex === trainingDay;

  // Re-render the training tab with the selected day
  const trainingTabEl = document.querySelector('.training-tab');
  if (trainingTabEl) {
    trainingTabEl.outerHTML = renderTrainingTab(day, isActive);
  }
}

function showExerciseDetail(day, index) {
  const bodyType = state.currentBodyType || 'mesomorph';
  const exercise = exercises[bodyType]?.[day]?.[index];
  if (!exercise) return;

  const modalContent = `
    <div class="modal-content exercise-detail">
      <button class="modal-close" data-action="close-modal">&times;</button>
      <h2>${exercise.name}</h2>
      <div class="exercise-meta">
        <span class="badge">${exercise.muscle}</span>
        <span class="badge">${exercise.equipment}</span>
        <span class="badge badge-${exercise.level === '初级' ? 'primary' : exercise.level === '中级' ? 'success' : 'warning'}">${exercise.level}</span>
      </div>
      <div class="exercise-sets">
        <div class="set-item"><strong>组数:</strong>${exercise.sets}组</div>
        <div class="set-item"><strong>次数:</strong>${exercise.reps}次</div>
        <div class="set-item"><strong>休息:</strong>${exercise.rest}</div>
      </div>
      <div class="exercise-tips">
        <h4>动作要点</h4>
        <p>${exercise.tips}</p>
      </div>
      <div class="exercise-videos">
        <h4>视频教学</h4>
        <div class="video-links">
          <a href="${exercise.bilibili}" target="_blank" rel="noopener noreferrer" class="video-link bilibili">
            <span class="video-icon">📺</span> B站视频
          </a>
          <a href="${exercise.youtube}" target="_blank" rel="noopener noreferrer" class="video-link youtube">
            <span class="video-icon">▶️</span> YouTube视频
          </a>
        </div>
      </div>
    </div>
  `;

  showModal(modalContent);
}

function showModal(content) {
  let modal = document.querySelector('.modal-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.innerHTML = content;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Render Functions
function render() {
  const tabs = ['home', 'training', 'diet', 'profile'];
  const tabNames = { home: '首页', training: '训练', diet: '饮食', profile: '我的' };

  app.innerHTML = `
    <header class="app-header">
      <h1>💪 FitGuide</h1>
      <p class="tagline">你的专属健身助手</p>
    </header>

    <nav class="tab-nav">
      ${tabs.map(tab => `
        <button class="tab-btn ${state.currentTab === tab ? 'active' : ''}" data-tab="${tab}">
          <span class="tab-icon">${getTabIcon(tab)}</span>
          <span class="tab-label">${tabNames[tab]}</span>
        </button>
      `).join('')}
    </nav>

    <main class="tab-content">
      ${renderCurrentTab()}
    </main>
  `;

  // Post-render for charts
  if (state.currentTab === 'profile' && state.weightRecords.length > 0) {
    setTimeout(() => renderWeightChart(), 100);
  }
}

function getTabIcon(tab) {
  const icons = {
    home: '🏠',
    training: '🏋️',
    diet: '🥗',
    profile: '👤'
  };
  return icons[tab] || '📌';
}

function renderCurrentTab() {
  switch (state.currentTab) {
    case 'home': return renderHomeTab();
    case 'training': return renderTrainingTab();
    case 'diet': return renderDietTab();
    case 'profile': return renderProfileTab();
    default: return renderHomeTab();
  }
}

function renderHomeTab() {
  if (state.hasGenerated && state.profile) {
    const bmi = calculateBMI(state.profile.height, state.profile.weight);
    const bmiCategory = getBMICategory(bmi);
    const bodyTypeInfo = dietData[state.currentBodyType];

    return `
      <div class="home-result">
        <div class="result-header">
          <h2>欢迎回来!</h2>
          <p>你的健身方案已准备就绪</p>
        </div>

        <div class="result-cards">
          <div class="result-card bmi-card">
            <h3>BMI 指数</h3>
            <div class="bmi-value" style="color: ${bmiCategory.color}">${bmi.toFixed(1)}</div>
            <div class="bmi-label" style="color: ${bmiCategory.color}">${bmiCategory.label}</div>
          </div>

          <div class="result-card body-type-card">
            <h3>体型类型</h3>
            <div class="body-type-value" style="color: ${bodyTypeInfo.color}">${bodyTypeInfo.label}</div>
            <div class="body-type-desc">${getBodyTypeShortDesc(state.currentBodyType)}</div>
          </div>
        </div>

        <div class="quick-actions">
          <button class="action-btn primary" data-tab="training">
            <span>🏋️</span> 开始训练
          </button>
          <button class="action-btn secondary" data-tab="diet">
            <span>🥗</span> 查看饮食
          </button>
        </div>

        <div class="plan-summary">
          <h3>📋 训练计划概览</h3>
          <div class="plan-days">
            <div class="plan-day">
              <span class="day-icon">推</span>
              <span>Push Day<br><small>肩/胸/三头</small></span>
            </div>
            <div class="plan-day">
              <span class="day-icon">拉</span>
              <span>Pull Day<br><small>背/二头</small></span>
            </div>
            <div class="plan-day">
              <span class="day-icon">腿</span>
              <span>Legs Day<br><small>腿/臀</small></span>
            </div>
            <div class="plan-day rest">
              <span class="day-icon">休</span>
              <span>Rest Day<br><small>恢复</small></span>
            </div>
          </div>
        </div>

        ${renderPersonalizedExplanation()}
      </div>
    `;
  }

  return renderProfileForm();
}

function getBodyTypeShortDesc(type) {
  const descriptions = {
    endomorph: '容易存储脂肪,需控制碳水',
    mesomorph: '肌肉易增长,均衡饮食',
    ectomorph: '代谢快,需高碳水少食多餐'
  };
  return descriptions[type] || '';
}

function renderPersonalizedExplanation() {
  if (!state.currentBodyType || !personalizedReasons[state.currentBodyType]) return '';

  const exp = personalizedReasons[state.currentBodyType];
  const isExpanded = state.explanationExpanded;

  const sectionsHTML = exp.sections.map(sec => `
    <div class="exp-section">
      <div class="exp-heading">
        <span class="exp-icon">${sec.icon || ''}</span>
        <h4>${sec.title}</h4>
      </div>
      ${sec.diagram ? `<div class="exp-diagram"><code>${sec.diagram}</code></div>` : ''}
      <div class="exp-body">
        ${sec.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
        ${sec.pathways && sec.pathways.length ? `
          <div class="exp-pathways">
            <strong>🧪 信号通路:</strong>
            <ul>
              ${sec.pathways.map(path => `<li>${path}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="explanation-panel">
      <button class="exp-toggle-btn" data-action="toggle-explanation">
        <span class="exp-title">🧬 ${exp.title}</span>
        <span class="exp-arrow ${isExpanded ? 'expanded' : ''}">▼</span>
      </button>

      <div class="exp-summary">
        <p>${exp.summary}</p>
      </div>

      <div class="exp-content ${isExpanded ? 'show' : 'hide'}">
        ${sectionsHTML}
      </div>
    </div>
  `;
}

function renderProfileForm() {
  return `
    <div class="profile-form-container">
      <div class="form-header">
        <h2>创建你的健身方案</h2>
        <p>填写基本信息,获取专属训练和饮食计划</p>
      </div>

      <form id="profile-form" class="profile-form">
        <div class="form-section">
          <h3>基本信息</h3>

          <div class="form-group">
            <label>性别 *</label>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" name="gender" value="male" required>
                <span>男</span>
              </label>
              <label class="radio-item">
                <input type="radio" name="gender" value="female">
                <span>女</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="age">年龄 *</label>
              <input type="number" id="age" name="age" min="16" max="70" placeholder="25" required>
            </div>
            <div class="form-group">
              <label for="height">身高(cm) *</label>
              <input type="number" id="height" name="height" min="140" max="220" placeholder="175" required>
            </div>
            <div class="form-group">
              <label for="weight">体重(kg) *</label>
              <input type="number" id="weight" name="weight" min="40" max="200" step="0.1" placeholder="70" required>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>体型特征</h3>
          <p class="form-hint">根据你的身体特征选择,帮助我们判断你的体型类型</p>

          <div class="form-group">
            <label>骨架大小 *</label>
            <div class="radio-group three">
              <label class="radio-item">
                <input type="radio" name="bodyFrame" value="narrow" required>
                <span>窄骨架<br><small>手腕细</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="bodyFrame" value="medium">
                <span>中等骨架<br><small>手腕适中</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="bodyFrame" value="wide">
                <span>宽骨架<br><small>手腕粗</small></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>脂肪分布 *</label>
            <div class="radio-group three">
              <label class="radio-item">
                <input type="radio" name="fatDistribution" value="upper" required>
                <span>上半身<br><small>腹部/胸部</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="fatDistribution" value="even">
                <span>均匀<br><small>全身分布</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="fatDistribution" value="lower">
                <span>下半身<br><small>臀部/大腿</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="fatDistribution" value="rare">
                <span>很少<br><small>不易囤脂</small></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>代谢速度 *</label>
            <div class="radio-group three">
              <label class="radio-item">
                <input type="radio" name="metabolism" value="slow" required>
                <span>较慢<br><small>吃不胖难</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="metabolism" value="normal">
                <span>正常<br><small>一般</small></span>
              </label>
              <label class="radio-item">
                <input type="radio" name="metabolism" value="fast">
                <span>较快<br><small>容易饿</small></span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>活动水平</h3>
          <div class="form-group">
            <label for="activityLevel">每周运动频率</label>
            <select id="activityLevel" name="activityLevel">
              <option value="sedentary">久坐(几乎不运动)</option>
              <option value="light" selected>轻度(每周1-2次)</option>
              <option value="moderate">中度(每周3-4次)</option>
              <option value="active">活跃(每周5-6次)</option>
              <option value="veryActive">极度活跃(每天运动)</option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary generate-btn" data-action="generate">
          🚀 生成专属方案
        </button>
      </form>
    </div>
  `;
}

function renderTrainingTab(activeDay) {
  const days = ['push', 'pull', 'legs', 'rest'];
  const dayLabels = { push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day', rest: 'Rest Day' };
  const dayIcons = { push: '推', pull: '拉', legs: '腿', rest: '休' };
  const dayColors = { push: '#e74c3c', pull: '#3498db', legs: '#2ecc71', rest: '#95a5a6' };

  const trainingDay = state.trainingStartDate ? getCurrentTrainingDay(state.trainingStartDate) : 0;

  if (!activeDay) {
    activeDay = days[trainingDay];
  }

  const bodyType = state.currentBodyType || 'mesomorph';
  const currentExercises = activeDay === 'rest' ? null : (exercises[bodyType]?.[activeDay] || exercises.mesomorph?.[activeDay]);

  return `
    <div class="training-tab">
      <div class="training-header">
        <h2>🏋️ 训练计划</h2>
        <p>每周3次 Push → Pull → Legs → 休息 循环</p>
      </div>

      <div class="day-selector">
        ${days.map((day, index) => `
          <button class="day-btn ${activeDay === day ? 'active' : ''} ${index === trainingDay && !activeDay ? 'current' : ''}"
                  data-action="switch-day" data-day="${day}">
            <span class="day-btn-icon">${dayIcons[day]}</span>
            <span class="day-btn-label">${dayLabels[day]}</span>
            ${index === trainingDay ? '<span class="current-tag">今天</span>' : ''}
          </button>
        `).join('')}
      </div>

      <div class="exercises-list" style="--day-color: ${dayColors[activeDay]}">
        <h3 class="day-title">${dayLabels[activeDay]}</h3>
        ${activeDay === 'rest' ? `
          <div class="rest-day-message">
            <div class="rest-icon">😴</div>
            <p>今天好好休息！</p>
            <p class="rest-tip">休息是为了更好地恢复和增长，配合充足睡眠和营养摄入。</p>
          </div>
        ` : currentExercises.map((ex, index) => `
          <div class="exercise-card" data-action="view-exercise" data-day="${activeDay}" data-index="${index}">
            <div class="exercise-header">
              <div class="exercise-name">${ex.name}</div>
              <div class="exercise-muscle">${ex.muscle}</div>
            </div>
            <div class="exercise-info">
              <span class="info-badge">${ex.sets}组 × ${ex.reps}</span>
              <span class="info-badge">${ex.rest}</span>
              <span class="info-badge level-${ex.level}">${ex.level}</span>
            </div>
            <div class="exercise-tips-preview">${ex.tips}</div>
            <div class="exercise-actions">
              <span class="video-hint">📺 视频教学</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="training-notes">
        <h4>📝 训练提示</h4>
        <ul>
          <li>热身:训练前5-10分钟有氧 + 动态拉伸</li>
          <li>组间休息:严格按照计划时间</li>
          <li>收尾:训练后拉伸放松</li>
          <li>HIIT可选:每周可添加1-2次20分钟HIIT</li>
        </ul>
      </div>
    </div>
  `;
}

function renderDietTab() {
  const bodyType = state.currentBodyType || 'mesomorph';
  const diet = dietData[bodyType];

  return `
    <div class="diet-tab">
      <div class="diet-header" style="--type-color: ${diet.color}">
        <h2>🥗 饮食计划</h2>
        <p>根据你的${diet.label}体质定制</p>
      </div>

      <div class="diet-type-selector">
        ${Object.entries(dietData).map(([key, value]) => `
          <button class="type-btn ${bodyType === key ? 'active' : ''}"
                  onclick="switchDietType('${key}')"
                  style="--type-color: ${value.color}">
            ${value.label}
          </button>
        `).join('')}
      </div>

      <div class="diet-content" id="diet-content">
        <div class="principles-section">
          <h3>📌 饮食原则</h3>
          <ul class="principles-list">
            ${diet.principles.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <div class="meals-section">
          <h3>🍽️ 三餐示例</h3>

          <div class="meal-card">
            <div class="meal-header">
              <span class="meal-icon">🌅</span>
              <span class="meal-name">早餐</span>
            </div>
            <div class="meal-content">${diet.meals.breakfast}</div>
          </div>

          <div class="meal-card">
            <div class="meal-header">
              <span class="meal-icon">☀️</span>
              <span class="meal-name">午餐</span>
            </div>
            <div class="meal-content">${diet.meals.lunch}</div>
          </div>

          <div class="meal-card">
            <div class="meal-header">
              <span class="meal-icon">🌙</span>
              <span class="meal-name">晚餐</span>
            </div>
            <div class="meal-content">${diet.meals.dinner}</div>
          </div>

          <div class="meal-card snacks">
            <div class="meal-header">
              <span class="meal-icon">🍎</span>
              <span class="meal-name">加餐</span>
            </div>
            <div class="meal-content">
              ${Array.isArray(diet.meals.snacks) ? diet.meals.snacks.join(' / ') : diet.meals.snacks}
            </div>
          </div>
        </div>

        ${state.profile ? `
          <div class="nutrition-summary">
            <h3>📊 每日营养参考</h3>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="nutrition-value">${calculateProtein(bodyType, state.profile.weight, state.goal)}g</span>
                <span class="nutrition-label">蛋白质</span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-value">${calculateTDEE(state.profile)}</span>
                <span class="nutrition-label">每日总消耗(kcal)</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderProfileTab() {
  const bodyType = state.currentBodyType || 'mesomorph';
  const bodyTypeInfo = dietData[bodyType];

  return `
    <div class="profile-tab">
      <div class="profile-header">
        <h2>👤 我的</h2>
      </div>

      ${state.profile ? `
        <div class="profile-stats">
          <div class="stat-card">
            <div class="stat-value">${state.profile.weight}</div>
            <div class="stat-label">当前体重(kg)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: ${bodyTypeInfo.color}">${bodyTypeInfo.label}</div>
            <div class="stat-label">体型类型</div>
          </div>
        </div>

        <div class="goal-selector">
          <h3>选择目标</h3>
          <div class="goal-buttons">
            <button class="goal-btn ${state.goal === 'lose' ? 'active' : ''}"
                    data-action="update-goal" data-goal="lose">
              📉 减脂
            </button>
            <button class="goal-btn ${state.goal === 'maintain' ? 'active' : ''}"
                    data-action="update-goal" data-goal="maintain">
              ⚖️ 维持
            </button>
            <button class="goal-btn ${state.goal === 'gain' ? 'active' : ''}"
                    data-action="update-goal" data-goal="gain">
              📈 增肌
            </button>
          </div>
        </div>

        <div class="body-type-selector">
          <h3>调整体型</h3>
          <select id="body-type-select" class="body-type-select">
            ${Object.entries(dietData).map(([key, value]) => `
              <option value="${key}" ${bodyType === key ? 'selected' : ''}>${value.label}</option>
            `).join('')}
          </select>
          <button class="btn-secondary" data-action="update-body-type">更新体型</button>
        </div>

        <div class="weight-record">
          <h3>📈 体重记录</h3>
          <div class="weight-input-group">
            <input type="number" id="weight-input" placeholder="输入今日体重(kg)" step="0.1" min="30" max="200">
            <button class="btn-record" data-action="record-weight">记录</button>
          </div>

          ${state.weightRecords.length > 0 ? `
            <div class="weight-chart-container">
              <canvas id="weightChart"></canvas>
            </div>
            <div class="weight-history">
              <h4>历史记录</h4>
              <div class="weight-list">
                ${state.weightRecords.slice(-7).reverse().map(record => `
                  <div class="weight-item">
                    <span class="weight-date">${record.date}</span>
                    <span class="weight-value">${record.weight} kg</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<p class="no-records">还没有体重记录,开始记录吧!</p>'}
        </div>
      ` : `
        <div class="no-profile">
          <p>还没有创建健身方案</p>
          <button class="btn-primary" data-tab="home">去首页创建</button>
        </div>
      `}
    </div>
  `;
}

function renderWeightChart() {
  const canvas = document.getElementById('weightChart');
  if (!canvas || state.weightRecords.length === 0) return;

  const ctx = canvas.getContext('2d');
  const records = state.weightRecords.slice(-14);

  canvas.width = canvas.parentElement.clientWidth || 320;
  canvas.height = 200;

  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  const weights = records.map(r => r.weight);
  const minWeight = Math.min(...weights) - 2;
  const maxWeight = Math.max(...weights) + 2;
  const weightRange = maxWeight - minWeight || 1;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    // Y-axis labels
    const weightLabel = (maxWeight - (weightRange / 4) * i).toFixed(1);
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(weightLabel, padding - 5, y + 3);
  }

  // Draw line
  ctx.strokeStyle = '#4ECDC4';
  ctx.lineWidth = 2;
  ctx.beginPath();

  records.forEach((record, i) => {
    const x = padding + (chartWidth / (records.length - 1 || 1)) * i;
    const y = padding + chartHeight - ((record.weight - minWeight) / weightRange) * chartHeight;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // Draw points
  ctx.fillStyle = '#4ECDC4';
  records.forEach((record, i) => {
    const x = padding + (chartWidth / (records.length - 1 || 1)) * i;
    const y = padding + chartHeight - ((record.weight - minWeight) / weightRange) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // X-axis date labels
  const maxLabels = 5;
  const step = Math.max(1, Math.floor(records.length / maxLabels));
  ctx.fillStyle = '#999';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < records.length; i += step) {
    const x = padding + (chartWidth / (records.length - 1 || 1)) * i;
    const dateLabel = records[i].date.slice(5); // MM-DD
    ctx.fillText(dateLabel, x, canvas.height - padding + 15);
  }
}

// Global function for diet type switching
window.switchDietType = function(type) {
  state.currentBodyType = type;
  saveToStorage('currentBodyType', type);
  document.getElementById('diet-content').innerHTML = renderDietContent(type);
};

function renderDietContent(type) {
  const diet = dietData[type];
  return `
    <div class="principles-section">
      <h3>📌 饮食原则</h3>
      <ul class="principles-list">
        ${diet.principles.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>

    <div class="meals-section">
      <h3>🍽️ 三餐示例</h3>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-icon">🌅</span>
          <span class="meal-name">早餐</span>
        </div>
        <div class="meal-content">${diet.meals.breakfast}</div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-icon">☀️</span>
          <span class="meal-name">午餐</span>
        </div>
        <div class="meal-content">${diet.meals.lunch}</div>
      </div>

      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-icon">🌙</span>
          <span class="meal-name">晚餐</span>
        </div>
        <div class="meal-content">${diet.meals.dinner}</div>
      </div>

      <div class="meal-card snacks">
        <div class="meal-header">
          <span class="meal-icon">🍎</span>
          <span class="meal-name">加餐</span>
        </div>
        <div class="meal-content">
          ${Array.isArray(diet.meals.snacks) ? diet.meals.snacks.join(' / ') : diet.meals.snacks}
        </div>
      </div>
    </div>
  `;
}

// Initialize app
init();
