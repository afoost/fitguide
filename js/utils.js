// FitGuide - Utility Functions

/**
 * Calculate BMI
 * @param {number} heightCm - Height in centimeters
 * @param {number} weightKg - Weight in kilograms
 * @returns {number} BMI value
 */
export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return 0;
  }
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Get BMI category
 * @param {number} bmi 
 * @returns {object} { label, color }
 */
export function getBMICategory(bmi) {
  if (bmi <= 0) return { label: '未知', color: '#999' };
  if (bmi < 18.5) return { label: '偏瘦', color: '#3498db' };
  if (bmi < 24) return { label: '正常', color: '#2ecc71' };
  if (bmi < 28) return { label: '超重', color: '#f39c12' };
  return { label: '肥胖', color: '#e74c3c' };
}

/**
 * Determine body type based on user input
 * @param {object} profile - { gender, height, weight, bodyFrame, fatDistribution, metabolism }
 * @returns {string} 'endomorph' | 'mesomorph' | 'ectomorph' | 'unknown'
 */
export function determineBodyType(profile) {
  const { bodyFrame, fatDistribution, metabolism } = profile;
  
  // Score-based determination
  let endoScore = 0;
  let mesoScore = 0;
  let ectoScore = 0;

  if (bodyFrame === 'narrow') ectoScore += 2;
  if (bodyFrame === 'wide') endoScore += 2;
  if (bodyFrame === 'medium') mesoScore += 2;

  if (fatDistribution === 'upper') endoScore += 1;
  if (fatDistribution === 'lower') endoScore += 1;
  if (fatDistribution === 'even') mesoScore += 2;
  if (fatDistribution === 'rare') ectoScore += 2;

  if (metabolism === 'slow') endoScore += 2;
  if (metabolism === 'fast') ectoScore += 2;
  if (metabolism === 'normal') mesoScore += 2;

  if (endoScore > mesoScore && endoScore > ectoScore) return 'endomorph';
  if (mesoScore > endoScore && mesoScore > ectoScore) return 'mesomorph';
  if (ectoScore > endoScore && ectoScore > mesoScore) return 'ectomorph';
  
  // Default to mesomorph if tie
  return 'mesomorph';
}

/**
 * Calculate daily protein needs based on body type and goal
 * @param {string} bodyType 
 * @param {number} weightKg 
 * @param {string} goal 
 * @returns {number} grams of protein per day
 */
export function calculateProtein(bodyType, weightKg, goal = 'maintain') {
  const multipliers = {
    endomorph: { lose: 2.2, maintain: 2.0, gain: 1.8 },
    mesomorph: { lose: 2.0, maintain: 1.8, gain: 1.6 },
    ectomorph: { lose: 1.8, maintain: 2.0, gain: 2.2 }
  };
  
  const multiplier = multipliers[bodyType]?.[goal] || 1.8;
  return Math.round(weightKg * multiplier);
}

/**
 * Calculate daily calorie needs (rough estimate)
 * @param {object} profile - { age, gender, height, weight, activityLevel }
 * @returns {number} estimated daily calories
 */
export function calculateBMR(profile) {
  const { age, gender, height, weight } = profile;
  
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

export function calculateTDEE(profile) {
  const bmr = calculateBMR(profile);
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };
  
  const multiplier = activityMultipliers[profile.activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Get week day label
 * @param {number} dayIndex - 0-3 (0=Push, 1=Pull, 2=Legs, 3=Rest)
 * @returns {string}
 */
export function getDayLabel(dayIndex) {
  const labels = ['Push Day', 'Pull Day', 'Legs Day', 'Rest Day'];
  return labels[dayIndex] || 'Rest Day';
}

/**
 * Get current training day based on start date
 * @param {string} startDateStr - ISO date string
 * @returns {number} dayIndex 0-3
 */
export function getCurrentTrainingDay(startDateStr) {
  if (!startDateStr) return 0;
  
  const startDate = new Date(startDateStr);
  const today = new Date();
  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays % 4;
}

/**
 * Save to localStorage
 * @param {string} key 
 * @param {any} value 
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(`fitguide_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

/**
 * Load from localStorage
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(`fitguide_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn('localStorage load failed:', e);
    return defaultValue;
  }
}

/**
 * Format date for display
 * @param {Date|string} date 
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Debounce function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
