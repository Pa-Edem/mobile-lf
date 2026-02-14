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
   * Если запись существует - обновляет только если новая accuracy выше
   */
  const saveTrainingLog = async (data) => {
    setIsSaving(true);
    try {
      console.log('💾 Saving training log:', data.type, 'accuracy:', data.accuracyScore);

      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('👤 User ID:', user.id);
      console.log('📄 Dialog ID:', data.dialogId);

      // Проверяем существующую запись
      const { data: existingLogs, error: fetchError } = await supabase
        .from('training_logs')
        .select('id, accuracy_score, completed_at')
        .eq('user_id', user.id)
        .eq('dialog_id', data.dialogId)
        .eq('type', data.type)
        .order('completed_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('🔍 Found existing logs:', existingLogs?.length || 0);
      if (existingLogs && existingLogs.length > 0) {
        console.log('📊 Best existing accuracy:', existingLogs[0].accuracy_score);
      }

      const newAccuracy = data.accuracyScore;
      const existingLog = existingLogs && existingLogs.length > 0 ? existingLogs[0] : null;

      if (existingLog) {
        // Запись существует - обновляем только если accuracy выше
        if (newAccuracy > existingLog.accuracy_score) {
          console.log(`📈 Updating log ${existingLog.id}: ${existingLog.accuracy_score}% → ${newAccuracy}%`);

          const { data: updated, error: updateError } = await supabase
            .from('training_logs')
            .update({
              accuracy_score: newAccuracy,
              total_replicas: data.totalReplicas,
              correct_replicas: data.correctReplicas,
              duration_seconds: data.durationSeconds,
              metadata: data.metadata || {},
              completed_at: new Date().toISOString(),
            })
            .eq('id', existingLog.id)
            .select(); // ← ВАЖНО: добавляем .select() для получения результата

          if (updateError) {
            console.error('❌ Update error:', updateError);
            throw updateError;
          }

          console.log('✅ Training log updated:', updated);
          return { success: true, updated: true };
        } else {
          console.log(`⏭️ Not updating: current ${existingLog.accuracy_score}% >= new ${newAccuracy}%`);
          return { success: true, updated: false };
        }
      } else {
        // Записи нет - создаём новую
        console.log(`➕ Creating new log: ${newAccuracy}%`);

        const { data: inserted, error: insertError } = await supabase
          .from('training_logs')
          .insert({
            user_id: user.id,
            dialog_id: data.dialogId,
            type: data.type,
            accuracy_score: newAccuracy,
            total_replicas: data.totalReplicas,
            correct_replicas: data.correctReplicas,
            duration_seconds: data.durationSeconds,
            metadata: data.metadata || {},
          })
          .select(); // ← ВАЖНО: добавляем .select()

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          throw insertError;
        }

        console.log('✅ Training log created:', inserted);
        return { success: true, created: true };
      }
    } catch (error) {
      console.error('❌ Failed to save training log:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveTrainingLog, isSaving };
}
