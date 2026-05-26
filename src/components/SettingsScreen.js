import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { getSavedFcmToken, verifyScheduledReminders, cancelReminder } from '../services/NotificationService';
import G from './Globals';

const NOTIF_KEY = '@remindme_notifications_enabled';

/**
 * Pantalla de ajustes con control de notificaciones,
 * visualización de token FCM, borrado masivo, información de versión y cierre de sesión.
 *
 * @param {{ navigation: object }} props
 */
function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { reminders, dispatch } = useReminders();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fcmToken, setFcmToken] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  /** Carga preferencia de notificaciones y token FCM desde AsyncStorage. */
  async function loadSettings() {
    const saved = await AsyncStorage.getItem(NOTIF_KEY);
    if (saved !== null) {
      setNotificationsEnabled(saved === 'true');
    }
    const token = await getSavedFcmToken();
    if (token) {
      setFcmToken(token);
    }
  }

  /**
   * Alterna el estado de notificaciones. Al desactivar pide confirmación
   * y cancela todas las notificaciones programadas.
   * @param {boolean} value
   */
  async function toggleNotifications(value) {
    if (!value) {
      Alert.alert(
        G.strings.notifications,
        G.strings.disableNotifConfirm,
        [
          { text: G.strings.cancel, style: 'cancel', onPress: () => setNotificationsEnabled(true) },
          {
            text: G.strings.disable,
            style: 'destructive',
            onPress: async () => {
              setNotificationsEnabled(false);
              await AsyncStorage.setItem(NOTIF_KEY, 'false');
              reminders.forEach(r => cancelReminder(r.id));
            },
          },
        ]
      );
    } else {
      setNotificationsEnabled(true);
      await AsyncStorage.setItem(NOTIF_KEY, 'true');
      verifyScheduledReminders(reminders);
    }
  }

  /** Copia el token FCM al portapapeles y muestra notificación. */
  async function handleCopyToken() {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('', G.strings.copied);
    }
  }

  /** Muestra confirmación y elimina todos los recordatorios. */
  function handleDeleteAll() {
    Alert.alert(
      G.strings.deleteAll,
      G.strings.deleteAllConfirmDesc,
      [
        { text: G.strings.cancel, style: 'cancel' },
        {
          text: G.strings.delete,
          style: 'destructive',
          onPress: () => {
            reminders.forEach(r => dispatch({ type: 'DELETE_REMINDER', payload: r.id }));
          },
        },
      ]
    );
  }

  /** Muestra confirmación y cierra sesión. */
  function handleLogout() {
    Alert.alert(G.strings.logout, G.strings.logoutConfirm, [
      { text: G.strings.cancel, style: 'cancel' },
      { text: G.strings.logout, style: 'destructive', onPress: logout },
    ]);
  }

  async function toggleNotifications(value) {
    if (!value) {
      Alert.alert(
        G.strings.notifications,
        G.strings.disableNotifConfirm,
        [
          { text: G.strings.cancel, style: 'cancel', onPress: () => setNotificationsEnabled(true) },
          {
            text: G.strings.disable,
            style: 'destructive',
            onPress: async () => {
              setNotificationsEnabled(false);
              await AsyncStorage.setItem(NOTIF_KEY, 'false');
              reminders.forEach(r => cancelReminder(r.id));
            },
          },
        ]
      );
    } else {
      setNotificationsEnabled(true);
      await AsyncStorage.setItem(NOTIF_KEY, 'true');
      verifyScheduledReminders(reminders);
    }
  }

  async function handleCopyToken() {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('', G.strings.copied);
    }
  }

  function handleDeleteAll() {
    Alert.alert(
      G.strings.deleteAll,
      G.strings.deleteAllConfirmDesc,
      [
        { text: G.strings.cancel, style: 'cancel' },
        {
          text: G.strings.delete,
          style: 'destructive',
          onPress: () => {
            reminders.forEach(r => dispatch({ type: 'DELETE_REMINDER', payload: r.id }));
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert(G.strings.logout, G.strings.logoutConfirm, [
      { text: G.strings.cancel, style: 'cancel' },
      { text: G.strings.logout, style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{G.strings.settings}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.sectionTitle}>{G.strings.notifications}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{G.strings.enableNotifications}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: G.colorDisable, true: G.colorPrimaryLight }}
              thumbColor={notificationsEnabled ? G.colorPrimary : '#f4f3f4'}
            />
          </View>
          {fcmToken ? (
            <TouchableOpacity style={styles.tokenRow} onPress={handleCopyToken} activeOpacity={0.7}>
              <View style={styles.tokenContent}>
                <Text style={styles.tokenLabel}>{G.strings.fcmToken}</Text>
                <Text style={styles.tokenValue}>
                  {'••••••••••••••••'}
                </Text>
              </View>
              <Text style={styles.copyText}>{G.strings.copy}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{G.strings.data}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleDeleteAll} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: G.colorError }]}>{G.strings.deleteAll}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{G.strings.info}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{G.strings.version}</Text>
            <Text style={styles.rowValue}>{G.appVersion} ({G.appBuild})</Text>
          </View>
          <TouchableOpacity style={styles.row} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: G.colorError }]}>{G.strings.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: G.colorBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: G.colorSurface,
    paddingHorizontal: G.spacing.md,
    paddingVertical: G.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: G.colorBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: G.colorText,
  },
  headerTitle: {
    fontSize: G.fontSizes.h2,
    fontWeight: '600',
    color: G.colorText,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: G.spacing.xl,
  },
  sectionTitle: {
    fontSize: G.fontSizes.caption,
    fontWeight: '600',
    color: G.colorTextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: G.spacing.lg,
    paddingTop: G.spacing.lg,
    paddingBottom: G.spacing.sm,
  },
  card: {
    backgroundColor: G.colorSurface,
    marginHorizontal: G.spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: G.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: G.colorBorder,
  },
  rowLabel: {
    fontSize: G.fontSizes.body,
    color: G.colorText,
  },
  rowValue: {
    fontSize: G.fontSizes.body,
    color: G.colorTextSecondary,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: G.spacing.md,
    paddingVertical: 14,
  },
  tokenContent: {
    flex: 1,
    marginRight: G.spacing.sm,
  },
  tokenLabel: {
    fontSize: G.fontSizes.caption,
    color: G.colorTextSecondary,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: G.fontSizes.body,
    color: G.colorText,
  },
  copyText: {
    fontSize: G.fontSizes.body,
    color: G.colorPrimary,
    fontWeight: '600',
  },
});

export default SettingsScreen;
