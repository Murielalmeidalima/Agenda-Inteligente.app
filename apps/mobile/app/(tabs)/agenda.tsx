import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { theme } from '../../src/styles/theme';
import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { initDatabase, getLocalAppointments } from '../../src/lib/database-local';
import { SyncService } from '../../src/lib/sync-service';

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      // 1. Tentar ler do banco local primeiro
      const db = await initDatabase();
      const localData = await getLocalAppointments(db);
      
      // Filtrar localmente pela data selecionada
      const filtered = localData.filter((apt: any) => 
        isSameDay(new Date(apt.start_time), selectedDate)
      ).map((apt: any) => ({
        ...apt,
        clients: { full_name: apt.client_name, phone: '' },
        procedures: { name: apt.procedure_name, duration_minutes: 0 }
      }));

      setAppointments(filtered);
      setLoading(false);

      // 2. Se for refresh manual ou lista vazia, tenta sincronizar
      if (refreshing || filtered.length === 0) {
        await SyncService.syncAll();
        const freshLocal = await getLocalAppointments(db);
        const refiltered = freshLocal.filter((apt: any) => 
          isSameDay(new Date(apt.start_time), selectedDate)
        ).map((apt: any) => ({
          ...apt,
          clients: { full_name: apt.client_name, phone: '' },
          procedures: { name: apt.procedure_name, duration_minutes: 0 }
        }));
        setAppointments(refiltered);
      }
    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return addDays(start, i);
  });

  return (
    <View style={styles.container}>
      {/* Date Selector */}
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
              <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                {format(day, 'dd')}
              </Text>
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
            <Text style={styles.emptyText}>Nenhum atendimento para este dia</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.appointmentItem}>
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>{format(new Date(item.start_time), 'HH:mm')}</Text>
              <View style={styles.timeLine} />
            </View>
            <View style={styles.card}>
              <View style={[styles.statusIndicator, { backgroundColor: item.status === 'confirmed' ? theme.colors.success : theme.colors.primary }]} />
              <View style={styles.cardInfo}>
                <Text style={styles.clientName}>{item.clients.full_name}</Text>
                <Text style={styles.procedureName}>{item.procedures.name}</Text>
                {item.status === 'confirmed' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Confirmado</Text>
                  </View>
                )}
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
    backgroundColor: theme.colors.background,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 45,
  },
  dayButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayName: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 2,
  },
  dayTextSelected: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  appointmentItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timeInfo: {
    width: 50,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timeLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  statusIndicator: {
    width: 6,
  },
  cardInfo: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  procedureName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    color: theme.colors.primaryDark,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  }
});
