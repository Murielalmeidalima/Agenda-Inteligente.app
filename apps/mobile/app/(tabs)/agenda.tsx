import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { theme } from '../../src/styles/theme';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../src/lib/supabase';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { initDatabase, getLocalAppointments, queueOfflineAction } from '../../src/lib/database-local';
import { SyncService } from '../../src/lib/sync-service';

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async (isRefresh = false) => {
    try {
      const db = await initDatabase();
      const localData = await getLocalAppointments(db);
      
      const filterData = (data: any[]) => data.filter((apt: any) => 
        isSameDay(new Date(apt.start_time), selectedDate)
      ).map((apt: any) => ({
        ...apt,
        clients: { full_name: apt.client_name, phone: '' },
        procedures: { name: apt.procedure_name, duration_minutes: 0 }
      }));

      setAppointments(filterData(localData));
      setLoading(false);

      if (isRefresh || localData.length === 0) {
        await SyncService.syncAll();
        const freshLocal = await getLocalAppointments(db);
        setAppointments(filterData(freshLocal));
      }
    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const db = await initDatabase();
      
      // Update local optimistically
      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, status: newStatus } : apt
      ));

      // Queue action for offline sync
      await queueOfflineAction(db, 'UPDATE', 'appointments', id, { status: newStatus });
      
      // Trigger background sync
      SyncService.syncAll();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return addDays(start, i);
  });

  return (
    <View style={styles.container}>
      {/* Calendar Strip Premium */}
      <View style={styles.calendarStrip}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <TouchableOpacity 
              key={day.toString()} 
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                {format(day, 'EEE', { locale: ptBR })}
              </Text>
              <View style={[styles.dayNumberContainer, isSelected && styles.dayNumberContainerSelected]}>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                  {format(day, 'dd')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconPlaceholder} />
            <Text style={styles.emptyText}>Agenda livre!</Text>
            <Text style={styles.emptySubtext}>Nenhum paciente agendado para hoje.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.appointmentItem}>
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>{format(new Date(item.start_time), 'HH:mm')}</Text>
              <View style={styles.timeLine} />
            </View>
            
            <View style={styles.card}>
              <View style={[
                styles.statusIndicator, 
                { backgroundColor: item.status === 'confirmed' ? theme.colors.success : (item.status === 'completed' ? '#94a3b8' : theme.colors.primary) }
              ]} />
              
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.clientName}>{item.clients.full_name}</Text>
                  {item.status === 'confirmed' && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Confirmado</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.procedureName}>{item.procedures.name}</Text>
                
                <View style={styles.actionRow}>
                  {item.status !== 'completed' && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus(item.id, item.status === 'confirmed' ? 'completed' : 'confirmed')}
                    >
                      <Text style={styles.actionButtonText}>
                        {item.status === 'confirmed' ? '✓ Finalizar' : 'Confirmar'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Ver Prontuário</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  dayButton: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 16,
    minWidth: 46,
    gap: 8,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  dayName: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberContainerSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dayTextSelected: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingTop: 24,
  },
  appointmentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeInfo: {
    width: 55,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  timeLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 8,
    borderRadius: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  statusIndicator: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  procedureName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  }
});
