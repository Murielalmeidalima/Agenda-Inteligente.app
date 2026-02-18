import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

/**
 * Serviço para gerenciar notificações push e tokens.
 */
export const NotificationService = {
  /**
   * Solicita permissão e registra o token de push no Supabase.
   */
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Falha ao obter permissão para notificações push!');
      return;
    }

    try {
      // Obter token do Expo
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      console.log('[Push] Token gerado:', token);

      // Salvar no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('push_tokens')
          .upsert({
            profile_id: user.id,
            token: token,
            platform: Platform.OS
          }, { 
            onConflict: 'profile_id, token' 
          });

        if (error) console.error('[Push] Erro ao salvar token no banco:', error);
        else console.log('[Push] Token registrado com sucesso no banco.');
      }
    } catch (e) {
      console.error('[Push] Erro ao registrar notificações:', e);
    }
  }
};
