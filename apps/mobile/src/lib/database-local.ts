import * as SQLite from 'expo-sqlite';

/**
 * Interface do Banco de Dados Local (Offline-First)
 * Tabelas espelhadas do Supabase para cache local.
 */

export async function initDatabase() {
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
