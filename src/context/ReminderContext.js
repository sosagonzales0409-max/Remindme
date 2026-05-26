import React, { createContext, useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleReminder, cancelReminder, verifyScheduledReminders } from '../services/NotificationService';

/** Clave de AsyncStorage para la preferencia de notificaciones. */
const NOTIF_KEY = '@remindme_notifications_enabled';

/**
 * Contexto de recordatorios. Expone la lista en tiempo real desde Firestore,
 * un flag de carga inicial y una función dispatch para CRUD.
 */
const ReminderContext = createContext(null);

/**
 * Proveedor del contexto de recordatorios.
 * Escucha cambios en Firestore y sincroniza notificaciones locales.
 *
 * @param {{ children: React.ReactNode, userId: string }} props
 */
export function ReminderProvider({ children, userId }) {
  const [reminders, setReminders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  /** Activa persistencia offline de Firestore al montar. */
  useEffect(() => {
    firestore().settings({ persistence: true });
  }, []);

  /** Escucha en tiempo real los recordatorios del usuario autenticado. */
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('reminders')
      .where('userId', '==', userId)
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        list.sort((a, b) => {
          const dateA = new Date(a.date);
          const timeA = new Date(a.time);
          dateA.setHours(timeA.getHours(), timeA.getMinutes(), 0, 0);

          const dateB = new Date(b.date);
          const timeB = new Date(b.time);
          dateB.setHours(timeB.getHours(), timeB.getMinutes(), 0, 0);

          return dateA.getTime() - dateB.getTime();
        });
        setReminders(list);
        setLoaded(true);
        AsyncStorage.getItem(NOTIF_KEY).then(pref => {
          if (pref !== 'false') {
            verifyScheduledReminders(list);
          }
        });
      }, error => {
        console.error('Firestore error:', error.code, error.message);
      });

    return unsubscribe;
  }, [userId]);

  /** @returns {Promise<string|null>} Preferencia de notificaciones almacenada */
  function getNotifPref() {
    return AsyncStorage.getItem(NOTIF_KEY);
  }

  /**
   * Despacha acciones de CRUD contra Firestore y sincroniza notificaciones.
   *
   * @param {{ type: 'ADD_REMINDER'|'UPDATE_REMINDER'|'DELETE_REMINDER', payload: any }} action
   * @returns {Promise<string|void>} ID del documento creado (solo ADD)
   */
  async function dispatchWithFirestore(action) {
    switch (action.type) {
      case 'ADD_REMINDER': {
        const docRef = await firestore().collection('reminders').add({
          ...action.payload,
          userId,
          createdAt: new Date().toISOString(),
        });
        const newReminder = { id: docRef.id, ...action.payload, userId, createdAt: new Date().toISOString() };
        const pref = await getNotifPref();
        if (pref !== 'false') {
          scheduleReminder(newReminder);
        }
        return docRef.id;
      }
      case 'UPDATE_REMINDER': {
        const { id, ...data } = action.payload;
        await firestore().collection('reminders').doc(id).update(data);
        cancelReminder(id);
        const pref = await getNotifPref();
        if (pref !== 'false') {
          scheduleReminder(action.payload);
        }
        break;
      }
      case 'DELETE_REMINDER': {
        await firestore().collection('reminders').doc(action.payload).delete();
        cancelReminder(action.payload);
        break;
      }
    }
  }

  return (
    <ReminderContext.Provider value={{ reminders, dispatch: dispatchWithFirestore, loaded }}>
      {children}
    </ReminderContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de recordatorios.
 * @returns {{ reminders: Array, dispatch: Function, loaded: boolean }}
 * @throws {Error} Si se usa fuera de ReminderProvider
 */
export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders debe usarse dentro de ReminderProvider');
  }
  return context;
}
