// lib/planUtils.js

/**
 * Проверяет валиден ли Trial период
 */
function isTrialValid(profile) {
  if (!profile?.is_trial_active) return false;
  if (!profile?.trial_ends_at) return false;

  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);

  return now < trialEnd;
}

/**
 * Определяет эффективный план пользователя
 * Приоритет:
 * 1. manual_premium
 * 2. manual_pro
 * 3. is_trial_active (7-дневный Trial, если валиден)
 * 4. subscription_tier (реальная подписка из Stripe)
 *
 * @param {Object} profile - профиль пользователя
 * @returns {string} - 'free', 'pro', или 'premium'
 */
export function getEffectivePlan(profile) {
  if (!profile) return 'free';

  // 1. Manual override (для тестирования и VIP)
  if (profile.manual_premium === true) return 'premium';
  if (profile.manual_pro === true) return 'pro';

  // 2. Active Trial (только если валиден)
  if (isTrialValid(profile)) return 'pro';

  // 3. Stripe subscription
  if (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') {
    return profile.subscription_tier || 'free';
  }

  // 4. Grace period (подписка отменена но период ещё не истёк)
  if (profile.subscription_cancel_at_period_end === true && profile.subscription_current_period_end) {
    const periodEnd = new Date(profile.subscription_current_period_end);
    if (periodEnd > new Date()) {
      return profile.subscription_tier || 'free';
    }
  }

  // 5. Default
  return profile.subscription_tier || 'free';
}

/**
 * Возвращает лимиты для плана
 *
 * @param {string} plan - 'free', 'pro', или 'premium'
 * @returns {Object} - объект с лимитами
 */
export function getPlanLimits(plan) {
  const limits = {
    free: {
      generations: 2, // Базовый дневной лимит
      dailyMax: 4, // Максимум в день (с carry-over)
      weeklyMax: 10, // Недельный cap
      proFeatures: 4, // PRO функции (Level 2, 3)
      proFeaturesMax: 8, // Максимум PRO функций в день
      proFeaturesWeekly: 20, // Недельный cap PRO функций
      dialogs: 4, // Максимум сохранённых диалогов
      voiceProvider: 'browser',
      stats: false,
    },
    pro: {
      generations: 5,
      dailyMax: 10,
      weeklyMax: 25,
      proFeatures: 10,
      proFeaturesMax: 20,
      proFeaturesWeekly: 50,
      dialogs: 10,
      voiceProvider: 'browser',
      stats: true,
    },
    premium: {
      generations: 10,
      dailyMax: 20,
      weeklyMax: 50,
      proFeatures: 999999,
      proFeaturesMax: 999999,
      proFeaturesWeekly: 999999,
      dialogs: 50,
      voiceProvider: 'elevenlabs',
      stats: true,
    },
  };

  return limits[plan] || limits.free;
}

/**
 * Рассчитывает сколько генераций доступно сегодня (с учётом carry-over)
 *
 * @param {Object} usageData - данные из usage_counters
 * @param {Object} profile - профиль пользователя
 * @returns {number} - количество доступных генераций
 */
export function getAvailableGenerations(usageData, profile) {
  const plan = getEffectivePlan(profile);
  const limits = getPlanLimits(plan);

  const dailyUsed = usageData?.daily_generations_used || 0;
  const carryOver = usageData?.carry_over_generations || 0;

  // Доступно сегодня = базовый лимит + carry-over, но не больше dailyMax
  const totalAvailable = Math.min(limits.generations + carryOver, limits.dailyMax);

  return Math.max(0, totalAvailable - dailyUsed);
}

/**
 * Рассчитывает сколько PRO функций доступно сегодня
 *
 * @param {Object} usageData - данные из usage_counters
 * @param {Object} profile - профиль пользователя
 * @returns {number} - количество доступных PRO функций
 */
export function getAvailableProFeatures(usageData, profile) {
  const plan = getEffectivePlan(profile);

  if (plan === 'premium') return 999999; // Безлимит

  const limits = getPlanLimits(plan);
  const dailyUsed = usageData?.daily_pro_features_used || 0;
  const carryOver = usageData?.carry_over_pro_features || 0;

  const totalAvailable = Math.min(limits.proFeatures + carryOver, limits.proFeaturesMax);

  return Math.max(0, totalAvailable - dailyUsed);
}

/**
 * Проверяет может ли пользователь генерировать диалог
 *
 * @param {Object} usageData - данные из usage_counters
 * @param {Object} profile - профиль пользователя
 * @returns {boolean} - true если может генерировать
 */
export function canGenerateDialog(usageData, profile) {
  const plan = getEffectivePlan(profile);
  const limits = getPlanLimits(plan);

  const dailyUsed = usageData?.daily_generations_used || 0;
  const weeklyUsed = usageData?.weekly_generations_used || 0;
  const carryOver = usageData?.carry_over_generations || 0;
  const savedDialogs = usageData?.total_dialogs_count || 0;

  // Доступно сегодня = базовый лимит + carry-over, но не больше dailyMax
  const availableToday = Math.min(limits.generations + carryOver, limits.dailyMax);

  // Проверяем дневной лимит
  if (dailyUsed >= availableToday) {
    return false;
  }

  // Проверяем недельный лимит
  if (weeklyUsed >= limits.weeklyMax) {
    return false;
  }

  // Проверяем количество сохранённых диалогов
  if (savedDialogs >= limits.dialogs) {
    return false;
  }

  return true;
}

/**
 * Проверяет может ли пользователь использовать PRO функции (Level 2, 3)
 *
 * @param {Object} usageData - данные из usage_counters
 * @param {Object} profile - профиль пользователя
 * @returns {boolean} - true если может использовать
 */
export function canUseProFeatures(usageData, profile) {
  const plan = getEffectivePlan(profile);

  // PREMIUM - безлимит
  if (plan === 'premium') return true;

  const limits = getPlanLimits(plan);
  const dailyUsed = usageData?.daily_pro_features_used || 0;
  const weeklyUsed = usageData?.weekly_pro_features_used || 0;
  const carryOver = usageData?.carry_over_pro_features || 0;

  // Доступно сегодня = базовый лимит + carry-over, но не больше proFeaturesMax
  const availableToday = Math.min(limits.proFeatures + carryOver, limits.proFeaturesMax);

  // Проверяем дневной лимит
  if (dailyUsed >= availableToday) {
    return false;
  }

  // Проверяем недельный лимит
  if (weeklyUsed >= limits.proFeaturesWeekly) {
    return false;
  }

  return true;
}

/**
 * Проверяет может ли пользователь сохранить ещё диалоги
 *
 * @param {Object} usageData - данные из usage_counters
 * @param {Object} profile - профиль пользователя
 * @returns {boolean} - true если может сохранить
 */
export function canSaveDialog(usageData, profile) {
  const plan = getEffectivePlan(profile);
  const limits = getPlanLimits(plan);

  const savedDialogs = usageData?.total_dialogs_count || 0;

  return savedDialogs < limits.dialogs;
}

/**
 * Проверяет доступ к статистике
 *
 * @param {Object} profile - профиль пользователя
 * @returns {boolean} - true если есть доступ
 */
export function hasStatsAccess(profile) {
  const plan = getEffectivePlan(profile);
  const limits = getPlanLimits(plan);

  return limits.stats === true;
}

/**
 * Определяет провайдера голоса для пользователя
 *
 * @param {Object} profile - профиль пользователя
 * @returns {string} - 'browser' или 'elevenlabs'
 */
export function getVoiceProvider(profile) {
  const plan = getEffectivePlan(profile);
  const limits = getPlanLimits(plan);

  // Если пользователь настроил в Settings - используем его выбор
  if (profile?.voice_provider && (plan === 'pro' || plan === 'premium')) {
    return profile.voice_provider;
  }

  // Иначе - дефолт по плану
  return limits.voiceProvider;
}

/**
 * Получает информацию о плане в удобном формате
 *
 * @param {Object} profile - профиль пользователя
 * @returns {Object} - объект с информацией о плане
 */
export function getPlanInfo(profile) {
  const plan = getEffectivePlan(profile);
  const limits = getPlanLimits(plan);

  const isManual = profile?.manual_premium || profile?.manual_pro;
  const isTrial = isTrialValid(profile) && !isManual;

  return {
    plan,
    limits,
    isManual,
    isTrial,
    displayName: plan.toUpperCase(),
  };
}

/**
 * Возвращает количество дней до конца Trial
 *
 * @param {Object} profile - профиль пользователя
 * @returns {number} - количество дней
 */
export function getTrialDaysRemaining(profile) {
  if (!isTrialValid(profile)) return 0;

  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);

  const diffTime = trialEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
