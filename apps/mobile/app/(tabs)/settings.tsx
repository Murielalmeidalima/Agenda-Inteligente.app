import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../src/styles/theme';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <MaterialIcons name="logout" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.itemText, { color: '#ef4444' }]}>Sair da Conta</Text>
          <MaterialIcons name="chevron-right" size={24} color="#d1d5db" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.version}>ProjetoApp v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  section: {
    marginTop: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 20,
  },
  version: {
    color: theme.colors.textMuted,
    fontSize: 12,
  }
});
