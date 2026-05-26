import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import Router from './src/components/Router';
import { setupNotifications } from './src/services/NotificationService';

/** Maneja la presión de notificaciones cuando la app está en background. */
notifee.onBackgroundEvent(async ({ type }) => {
  if (type === EventType.PRESS) {
    // Notificación presionada en background
  }
});

/**
 * Componente raíz de la aplicación.
 * Inicializa SafeAreaProvider, configura notificaciones locales/FCM
 * y renderiza el sistema de navegación con autenticación.
 */
function App() {
  useEffect(() => {
    setupNotifications();

    /** Escucha mensajes FCM en foreground y los muestra como notificación local. */
    const unsubscribeFcm = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'reminders',
            pressAction: { id: 'default' },
          },
        });
      }
    });

    return unsubscribeFcm;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Router />
    </SafeAreaProvider>
  );
}

export default App;
