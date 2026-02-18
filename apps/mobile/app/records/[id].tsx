import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { theme } from '../../src/styles/theme';
import { useState, useEffect } from 'react';
import { initDatabase, getLocalMedicalRecords } from '../../src/lib/database-local';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MaterialIcons } from '@expo/vector-icons';

export default function RecordDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const db = await initDatabase();
        const localRecords = await getLocalMedicalRecords(db, id as string);
        setRecords(localRecords);
      } catch (error) {
        console.error('Error fetching records for client:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [id]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: (name as string) || 'Prontuário' }} />
      
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-note" size={48} color={theme.colors.border} />
            <Text style={styles.emptyText}>Nenhuma evolução registrada para este paciente.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{format(new Date(item.created_at), 'dd/MM/yyyy')}</Text>
              </View>
              <Text style={styles.professionalText}>{item.professional_name || 'Profissional'}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.content}>{item.content}</Text>
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
  listContent: {
    padding: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  professionalText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});
