import { Platform } from 'react-native';

/**
 * Interface do Banco de Dados Local (Offline-First)
 * Tabelas espelhadas do Supabase para cache local.
 */

export async function initDatabase() {
  if (Platform.OS === 'web') {
    return {
      execAsync: async () => {},
      runAsync: async () => {},
      getAllAsync: async () => []
    } as any;
  }

  const SQLite = require('expo-sqlite');
  const db = await SQLite.openDatabaseAsync('projetoapp.db');

  // Tabela de Clientes Local
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_clients (
      id TEXT PRIMARY KEY NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      last_sync INTEGER NOT NULL
    );
  `);

  // Tabela de Agendamentos Local
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_appointments (
      id TEXT PRIMARY KEY NOT NULL,
      client_name TEXT,
      procedure_name TEXT,
      start_time TEXT NOT NULL,
      status TEXT NOT NULL,
      last_sync INTEGER NOT NULL
    );
  `);

  // Tabela de Fila Offline (Ações a serem enviadas para a nuvem)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_offline_queue (
      id TEXT PRIMARY KEY NOT NULL,
      action_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
  `);

  return db;
}

export async function saveLocalClients(db: SQLite.SQLiteDatabase, clients: any[]) {
  const now = Date.now();
  for (const client of clients) {
    await db.runAsync(
      'INSERT OR REPLACE INTO local_clients (id, full_name, email, phone, last_sync) VALUES (?, ?, ?, ?, ?)',
      [client.id, client.full_name, client.email, client.phone, now]
    );
  }
}

export async function getLocalClients(db: SQLite.SQLiteDatabase) {
  return await db.getAllAsync('SELECT * FROM local_clients ORDER BY full_name');
}

export async function saveLocalAppointments(db: SQLite.SQLiteDatabase, appointments: any[]) {
  const now = Date.now();
  for (const apt of appointments) {
    await db.runAsync(
      'INSERT OR REPLACE INTO local_appointments (id, client_name, procedure_name, start_time, status, last_sync) VALUES (?, ?, ?, ?, ?, ?)',
      [apt.id, apt.clients?.full_name, apt.procedures?.name, apt.start_time, apt.status, now]
    );
  }
}

export async function getLocalAppointments(db: SQLite.SQLiteDatabase) {
  return await db.getAllAsync('SELECT * FROM local_appointments ORDER BY start_time DESC');
}

export async function saveLocalMedicalRecords(db: SQLite.SQLiteDatabase, records: any[]) {
  const now = Date.now();
  for (const record of records) {
    await db.runAsync(
      'INSERT OR REPLACE INTO local_medical_records (id, client_id, content, professional_name, created_at, last_sync) VALUES (?, ?, ?, ?, ?, ?)',
      [record.id, record.client_id, record.content, record.professional?.full_name, record.created_at, now]
    );
  }
}

export async function getLocalMedicalRecords(db: SQLite.SQLiteDatabase, clientId: string) {
  return await db.getAllAsync(
    'SELECT * FROM local_medical_records WHERE client_id = ? ORDER BY created_at DESC',
    [clientId]
  );
}

// === OFFLINE QUEUE ===

export async function queueOfflineAction(
  db: SQLite.SQLiteDatabase,
  actionType: 'INSERT' | 'UPDATE' | 'DELETE',
  tableName: string,
  recordId: string,
  payload: any
) {
  const id = Date.now().toString() + Math.random().toString(36).substring(7);
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO local_offline_queue (id, action_type, table_name, record_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, actionType, tableName, recordId, JSON.stringify(payload), now]
  );
}

export async function getPendingOfflineActions(db: SQLite.SQLiteDatabase) {
  return await db.getAllAsync("SELECT * FROM local_offline_queue WHERE status = 'pending' ORDER BY created_at ASC");
}

export async function markActionCompleted(db: SQLite.SQLiteDatabase, actionId: string) {
  await db.runAsync("UPDATE local_offline_queue SET status = 'completed' WHERE id = ?", [actionId]);
}
