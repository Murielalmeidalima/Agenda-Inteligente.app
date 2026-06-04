import { supabase } from './supabase';
import { 
  initDatabase, 
  saveLocalClients, 
  saveLocalAppointments,
  saveLocalMedicalRecords,
  getPendingOfflineActions,
  markActionCompleted
} from './database-local';

/**
 * SyncService - Gerencia a sincronização entre Supabase e SQLite Local.
 */

export const SyncService = {
  /**
   * Sincroniza todos os dados essenciais para o uso offline.
   */
  async syncAll() {
    console.log('[Sync] Iniciando sincronização completa...');
    const db = await initDatabase();

    try {
      // 0. Processar Fila Offline (Upload)
      const pendingActions = await getPendingOfflineActions(db);
      if (pendingActions.length > 0) {
        console.log(`[Sync] Processando ${pendingActions.length} ações offline pendentes...`);
        for (const action of pendingActions as any[]) {
          try {
            const payload = JSON.parse(action.payload);
            
            if (action.action_type === 'UPDATE') {
              const { error } = await supabase
                .from(action.table_name)
                .update(payload)
                .eq('id', action.record_id);
              if (error) throw error;
            } else if (action.action_type === 'INSERT') {
              const { error } = await supabase
                .from(action.table_name)
                .insert([payload]);
              if (error) throw error;
            } else if (action.action_type === 'DELETE') {
              const { error } = await supabase
                .from(action.table_name)
                .delete()
                .eq('id', action.record_id);
              if (error) throw error;
            }

            await markActionCompleted(db, action.id);
            console.log(`[Sync] Ação offline ${action.id} sincronizada com sucesso.`);
          } catch (actionErr) {
            console.error(`[Sync] Erro ao processar ação ${action.id}:`, actionErr);
            // Continua a execução, tentará novamente na próxima sincronização
          }
        }
      }

      // 1. Sincronizar Clientes (Download)
      const { data: clients } = await supabase
        .from('clients')
        .select('*');
      
      if (clients) {
        await saveLocalClients(db, clients);
        console.log(`[Sync] ${clients.length} clientes sincronizados.`);
      }

      // 2. Sincronizar Agendamentos (Hoje e futuro próximo)
      const today = new Date();
      const start = new Date(today.setHours(0,0,0,0)).toISOString();

      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(full_name),
          procedures(name)
        `)
        .gte('start_time', start);

      if (appointments) {
        await saveLocalAppointments(db, appointments);
        console.log(`[Sync] ${appointments.length} agendamentos sincronizados.`);
      }

      // 3. Sincronizar Prontuários (Medical Records)
      const { data: records } = await supabase
        .from('medical_records')
        .select(`
          *,
          professional:profiles(full_name)
        `);
      
      if (records) {
        await saveLocalMedicalRecords(db, records);
        console.log(`[Sync] ${records.length} prontuários sincronizados.`);
      }

      console.log('[Sync] Sincronização concluída com sucesso.');
      return true;
    } catch (error) {
      console.error('[Sync] Erro durante a sincronização:', error);
      return false;
    }
  }
};
