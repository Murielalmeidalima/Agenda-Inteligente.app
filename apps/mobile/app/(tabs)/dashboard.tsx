import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { SyncService } from '../../src/lib/sync-service';
import { initDatabase, getLocalAppointments } from '../../src/lib/database-local';

export default function DashboardScreen() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const db = await initDatabase();
      const localApts = await getLocalAppointments(db);
      if (localApts.length > 0) {
        setAppointments(localApts.map(a => ({
          ...a,
          clients: { full_name: a.client_name },
          procedures: { name: a.procedure_name }
        })));
        setLoading(false);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      const syncSuccess = await SyncService.syncAll();
      if (syncSuccess) {
        const updatedLocalApts = await getLocalAppointments(db);
        setAppointments(updatedLocalApts.map(a => ({
          ...a,
          clients: { full_name: a.client_name },
          procedures: { name: a.procedure_name }
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const nextAppointment = appointments.find(a => new Date(a.start_time) > new Date());

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {profile?.full_name?.split(' ')[0] || 'Profissional'}!</Text>
        <Text style={styles.subtitle}>{profile?.companies?.name || 'ProjetoApp'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: theme.colors.accent }]}>
          <Text style={styles.statValue}>{confirmedCount}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximo Atendimento</Text>
        {nextAppointment ? (
          <View style={styles.appointmentCard}>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{format(new Date(nextAppointment.start_time), 'HH:mm')}</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.clientName}>{nextAppointment.clients?.full_name}</Text>
              <Text style={styles.procedureName}>{nextAppointment.procedures?.name}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              nextAppointment.status === 'confirmed' && { backgroundColor: theme.colors.primaryLight }
            ]}>
              <Text style={[
                styles.statusText,
                nextAppointment.status === 'confirmed' && { color: theme.colors.primaryDark }
              ]}>
                {nextAppointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sem agendamentos próximos</Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Agenda do Dia</Text>
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <View key={apt.id} style={[styles.appointmentCard, { marginBottom: 12 }]}>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>{format(new Date(apt.start_time), 'HH:mm')}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.clientName}>{apt.clients?.full_name}</Text>
                <Text style={styles.procedureName}>{apt.procedures?.name}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum agendamento para hoje</Text>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    ...theme.shadows.sm,
    gap: 16,
  },
  emptyCard: {
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  timeContainer: {
    backgroundColor: theme.colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    minWidth: 55,
    alignItems: 'center',
  },
  time: {
    color: theme.colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  appointmentInfo: {
    flex: 1,
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
  statusBadge: {
    backgroundColor: theme.colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: 'bold',
  }
});
