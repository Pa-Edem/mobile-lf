// hooks/useTrainingLogger.js
import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook для сохранения результатов тренировки в БД
 *
 * @returns {Object} - { saveTrainingLog, isSaving }
 */
export function useTrainingLogger() {
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Сохранить результат тренировки
   *
   * @param {Object} data
   * @param {string} data.dialogId - ID диалога
   * @param {string} data.type - Тип тренировки (level_1, level_2, level_3, level_4)
   * @param {number} data.accuracyScore - Точность 0-100
   * @param {number} data.totalReplicas - Всего реплик
   * @param {number} data.correctReplicas - Правильных реплик
   * @param {number} data.durationSeconds - Длительность в секундах
   * @param {Object} data.metadata - Дополнительные данные (JSONB)
   */
  const saveTrainingLog = async (data) => {
    setIsSaving(true);
    try {
      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase.from('training_logs').insert({
        user_id: user.id,
        dialog_id: data.dialogId,
        type: data.type,
        accuracy_score: data.accuracyScore,
        total_replicas: data.totalReplicas,
        correct_replicas: data.correctReplicas,
        duration_seconds: data.durationSeconds,
        metadata: data.metadata || {},
      });

      if (error) throw error;

      console.log('✅ Training log saved:', data.type);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save training log:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveTrainingLog, isSaving };
}
