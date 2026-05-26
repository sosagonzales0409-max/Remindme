import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Alert,
} from 'react-native';
import { useReminders } from '../context/ReminderContext';
import G from './Globals';

/**
 * Convierte un valor a Date, aceptando string ISO o Date.
 * @param {string|Date} value
 * @returns {Date}
 */
function toDate(value) {
  return typeof value === 'string' ? new Date(value) : value;
}

/**
 * Determina si un recordatorio ya venció.
 * Los recordatorios con repetición (daily/weekly) nunca expiran.
 * @param {{ date: string, time: string, repeatType?: string }} item
 * @returns {boolean}
 */
function isExpired(item) {
  if (item.repeatType !== 'none') return false;
  const now = new Date();
  now.setSeconds(0, 0);
  const reminder = new Date(item.date);
  const t = new Date(item.time);
  reminder.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return reminder < now;
}

/**
 * Clasifica un recordatorio en la sección correspondiente.
 * - Con repetición daily siempre va a Hoy
 * - Con repetición weekly va a Hoy si es el mismo día de la semana
 * - Sin repetición: vencido, hoy, mañana o próximos según fecha
 * @param {{ date: string, time: string, repeatType?: string }} item
 * @returns {number} -1=vencido, 0=hoy, 1=mañana, 2=próximos
 */
function getSectionKey(item) {
  if (isExpired(item)) return -1;
  if (item.repeatType === 'daily') return 0;
  const today = new Date();
  const dayOfWeek = today.getDay();
  if (item.repeatType === 'weekly' && toDate(item.date).getDay() === dayOfWeek) return 0;
  today.setHours(0, 0, 0, 0);
  const target = toDate(item.date);
  target.setHours(0, 0, 0, 0);
  const diff = (target - today) / 86400000;
  if (diff === 0) return 0;
  if (diff === 1) return 1;
  return 2;
}

/**
 * Formatea una hora a formato h:mm AM/PM.
 * @param {string|Date} time
 * @returns {string}
 */
function formatTime(time) {
  const d = toDate(time);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

/**
 * Tarjeta individual de recordatorio con indicador de categoría,
 * estado vencido, badge de repetición y botón de eliminar.
 *
 * @param {{ item: object, onPress: Function, onDelete: Function }} props
 */
function ReminderCard({ item, onPress, onDelete }) {
  const expired = isExpired(item);
  return (
    <TouchableOpacity
      style={[styles.card, expired && styles.cardExpired]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryDot, { backgroundColor: expired ? G.colorDisable : item.category.color }]} />
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, expired && styles.textExpired]}>{item.title}</Text>
        <Text style={[styles.cardTime, expired && styles.textExpired]}>{formatTime(item.time)}</Text>
        {expired && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>{G.strings.expired}</Text>
          </View>
        )}
        {item.repeatType !== 'none' && !expired && (
          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>
              {G.repeatOptions.find(r => r.value === item.repeatType)?.label ?? item.repeatType}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.categoryLabel, expired && styles.textExpired]}>{item.category.name}</Text>
      <TouchableOpacity
        style={styles.cardDeleteBtn}
        onPress={() => onDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.cardDeleteIcon}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/** Estado vacío mostrado cuando no hay recordatorios. */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>{G.strings.noReminders}</Text>
      <Text style={styles.emptySub}>{G.strings.tapToCreate}</Text>
    </View>
  );
}

/**
 * Pantalla principal que lista los recordatorios agrupados por secciones
 * (Vencidos, Hoy, Mañana, Próximos). Incluye FAB para crear y acceso a Settings.
 *
 * @param {{ navigation: object }} props
 */
function HomeScreen({ navigation }) {
  const { reminders, dispatch, loaded } = useReminders();
  const sections = [
    { title: G.strings.expired, key: -1, data: [] },
    { title: G.strings.today, key: 0, data: [] },
    { title: G.strings.tomorrow, key: 1, data: [] },
    { title: G.strings.upcoming, key: 2, data: [] },
  ];

  reminders.forEach(item => {
    const key = getSectionKey(item);
    sections.find(s => s.key === key).data.push(item);
  });

  const visibleSections = sections.filter(s => s.data.length > 0);

  /**
   * Muestra confirmación y elimina un recordatorio.
   * @param {{ id: string }} item
   */
  function handleDelete(item) {
    Alert.alert(G.strings.confirmDelete, '', [
      { text: G.strings.cancel, style: 'cancel' },
      { text: G.strings.delete, style: 'destructive', onPress: () => {
        dispatch({ type: 'DELETE_REMINDER', payload: item.id });
      }},
    ]);
  }

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{G.name}</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {visibleSections.length > 0 ? (
        <SectionList
          sections={visibleSections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ReminderCard
              item={item}
              onPress={() => navigation.navigate('CreateReminder', { reminder: item })}
              onDelete={handleDelete}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={[
              styles.sectionHeader,
              section.key === -1 && { color: G.colorError },
            ]}>{section.title}</Text>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <EmptyState />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateReminder')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: G.spacing.lg,
    paddingVertical: G.spacing.md,
    backgroundColor: G.colorSurface,
    borderBottomWidth: 1,
    borderBottomColor: G.colorBorder,
  },
  headerTitle: {
    fontSize: G.fontSizes.h1,
    fontWeight: '700',
    color: G.colorText,
  },
  headerBtn: {
    padding: G.spacing.xs,
  },
  settingsIcon: {
    fontSize: 24,
  },
  sectionHeader: {
    fontSize: G.fontSizes.body,
    fontWeight: '600',
    color: G.colorTextSecondary,
    paddingHorizontal: G.spacing.lg,
    paddingTop: G.spacing.lg,
    paddingBottom: G.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.colorSurface,
    borderRadius: 16,
    padding: G.spacing.md,
    marginHorizontal: G.spacing.lg,
    marginBottom: G.spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: G.spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: G.fontSizes.body,
    fontWeight: '600',
    color: G.colorText,
  },
  cardTime: {
    fontSize: G.fontSizes.caption,
    color: G.colorTextSecondary,
    marginTop: 3,
  },
  repeatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: G.colorPrimaryLight + '30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  repeatText: {
    fontSize: 11,
    fontWeight: '500',
    color: G.colorPrimary,
  },
  cardExpired: {
    opacity: 0.55,
    elevation: 0,
    shadowOpacity: 0,
  },
  textExpired: {
    color: G.colorDisable,
  },
  expiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: G.colorError + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  expiredText: {
    fontSize: 11,
    fontWeight: '600',
    color: G.colorError,
  },
  categoryLabel: {
    fontSize: G.fontSizes.caption,
    color: G.colorTextSecondary,
    marginLeft: G.spacing.sm,
  },
  cardDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: G.colorError + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: G.spacing.sm,
  },
  cardDeleteIcon: {
    fontSize: 13,
    color: G.colorError,
    fontWeight: '700',
    lineHeight: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: G.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: G.spacing.md,
  },
  emptyTitle: {
    fontSize: G.fontSizes.h2,
    fontWeight: '600',
    color: G.colorText,
    marginBottom: G.spacing.sm,
  },
  emptySub: {
    fontSize: G.fontSizes.body,
    color: G.colorTextSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: G.colorPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: G.colorPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 32,
    fontWeight: '300',
  },
});

export default HomeScreen;
