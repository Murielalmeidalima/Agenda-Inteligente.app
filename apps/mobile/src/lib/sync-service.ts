import { supabase } from './supabase';
import { 
  initDatabase, 
  saveLocalClients, 
  saveLocalAppointments,
  saveLocalMedicalRecords 
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // 1. Sincronizar Clientes
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', profile.company_id);
      
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
        .eq('company_id', profile.company_id)
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
        `)
        .eq('company_id', profile.company_id);
      
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
