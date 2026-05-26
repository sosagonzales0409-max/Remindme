import notifee, { TriggerType, RepeatFrequency, AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Identificador del canal de notificaciones de Android. */
const CHANNEL_ID = 'reminders';
/** Clave de AsyncStorage para almacenar el token FCM. */
const FCM_TOKEN_KEY = '@remindme_fcm_token';

/**
 * Configura las notificaciones al iniciar la app.
 * - Crea el canal de Android
 * - Solicita permisos
 * - Obtiene y almacena el token FCM
 */
export async function setupNotifications() {
  await createChannel();
  await requestPermission();

  if (Platform.OS === 'android' && Platform.Version >= 29) {
    await notifee.requestPermission({ sound: true, announcement: true });
  }

  await getFcmToken();
}

/** Crea el canal de notificaciones de Android con prioridad alta. */
async function createChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Recordatorios',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

/**
 * Solicita permiso al usuario para mostrar notificaciones locales.
 * @returns {Promise<number>} Estado de autorización
 */
export async function requestPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus;
}

/**
 * Obtiene el token FCM del dispositivo y lo persiste en AsyncStorage.
 * @returns {Promise<string|undefined>} Token FCM o undefined si no hay permiso
 */
export async function getFcmToken() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const token = await messaging().getToken();
      if (token) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      }
      return token;
    }
  } catch (e) {
    console.error('FCM token error:', e);
  }
}

/**
 * Recupera el token FCM almacenado en AsyncStorage.
 * @returns {Promise<string|null>} Token guardado o null
 */
export async function getSavedFcmToken() {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Combina las propiedades date y time de un recordatorio en un solo objeto Date.
 * @param {{ date: string, time: string }} reminder - Recordatorio con date y time ISO
 * @returns {Date} Fecha y hora combinadas
 */
export function formatReminderDate(reminder) {
  const date = new Date(reminder.date);
  const time = new Date(reminder.time);
  date.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return date;
}

/**
 * Agenda una notificación local programada para el recordatorio.
 * Soporta repetición diaria y semanal.
 * @param {{ id: string, title: string, description?: string, date: string, time: string, repeatType: string, category?: { color?: string, name?: string } }} reminder
 */
export async function scheduleReminder(reminder) {
  const triggerDate = formatReminderDate(reminder);
  const now = new Date();

  if (triggerDate <= now) return;

  let repeatFrequency;
  switch (reminder.repeatType) {
    case 'daily':
      repeatFrequency = RepeatFrequency.DAILY;
      break;
    case 'weekly':
      repeatFrequency = RepeatFrequency.WEEKLY;
      break;
    default:
      repeatFrequency = undefined;
  }

  await notifee.createTriggerNotification(
    {
      id: reminder.id,
      title: reminder.title,
      body: reminder.description || reminder.category?.name || 'Recordatorio',
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        largeIcon: 'ic_launcher',
        color: reminder.category?.color || '#6C63FF',
        importance: AndroidImportance.HIGH,
        vibrateTimings: [0, 300, 200, 300],
        pressAction: { id: 'default' },
        style: {
          type: AndroidStyle.BIGTEXT,
          text: reminder.description || reminder.title || 'Recordatorio',
        },
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency,
    }
  );
}

/**
 * Cancela una notificación programada por su ID.
 * @param {string} id - ID del recordatorio/notificación
 */
export async function cancelReminder(id) {
  await notifee.cancelNotification(id);
}

/**
 * Verifica que todos los recordatorios tengan una notificación programada.
 * Re-agenda aquellas que falten.
 * @param {Array<{ id: string, title: string, date: string, time: string, repeatType: string }>} reminders
 */
export async function verifyScheduledReminders(reminders) {
  const scheduled = await notifee.getTriggerNotifications();
  const scheduledIds = new Set(scheduled.map(n => n.notification.id));

  for (const reminder of reminders) {
    if (!scheduledIds.has(reminder.id)) {
      await scheduleReminder(reminder);
    }
  }
}

/**
 * Registra un handler global para eventos de notificación en background.
 * Actualmente es un placeholder para futura navegación por deep-link.
 */
export function onBackgroundEvent() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      // Notificación presionada en background
    }
  });
}
