import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { theme } from '../../src/styles/theme';
import { useState, useEffect, useCallback } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { initDatabase, getLocalClients } from '../../src/lib/database-local';
import { SyncService } from '../../src/lib/sync-service';

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchClients = useCallback(async (isRefresh = false) => {
    try {
      const db = await initDatabase();
      const localData = await getLocalClients(db);
      
      setClients(localData);
      setFilteredClients(localData);
      setLoading(false);

      if (isRefresh || localData.length === 0) {
        await SyncService.syncAll();
        const freshLocal = await getLocalClients(db);
        setClients(freshLocal);
        setFilteredClients(freshLocal);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredClients(clients);
    } else {
      const lower = search.toLowerCase();
      const filtered = clients.filter(c => 
        c.full_name?.toLowerCase().includes(lower) || 
        c.phone?.includes(lower) || 
        c.email?.toLowerCase().includes(lower)
      );
      setFilteredClients(filtered);
    }
  }, [search, clients]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClients(true);
  };

  const handleAddClient = () => {
    router.push('/clients/new');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pacientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color={theme.colors.textMuted} />
        <TextInput
          placeholder="Buscar paciente..."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.clientCard} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.full_name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{item.full_name}</Text>
              <Text style={styles.clientDetails}>
                {item.phone ? item.phone : (item.email || 'Sem contato')}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionIcon}>
              <MaterialIcons name="history" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconPlaceholder}>
              <MaterialIcons name="people-outline" size={32} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              {search ? 'Nenhum paciente encontrado' : 'Lista vazia'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.primaryDark,
    fontSize: 20,
    fontWeight: '800',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIconPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  }
});
