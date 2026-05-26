import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useReminders } from '../context/ReminderContext';
import G from './Globals';

/**
 * Pantalla de creación/edición de recordatorios.
 * Formulario con campos de título, descripción, categoría, fecha, hora y repetición.
 * Soporta crear nuevo o editar existente según `route.params.reminder`.
 *
 * @param {{ navigation: object, route: { params?: { reminder?: object } } }} props
 */
function CreateReminderScreen({ navigation, route }) {
  const { dispatch } = useReminders();
  const editingReminder = route.params?.reminder ?? null;

  const [title, setTitle] = useState(editingReminder ? editingReminder.title : '');
  const [description, setDescription] = useState(editingReminder ? editingReminder.description : '');
  const [selectedCategory, setSelectedCategory] = useState(
    editingReminder
      ? G.categories.find(c => c.id === editingReminder.category.id) || G.categories[0]
      : G.categories[0]
  );
  const [date, setDate] = useState(editingReminder ? new Date(editingReminder.date) : new Date());
  const [time, setTime] = useState(editingReminder ? new Date(editingReminder.time) : new Date(Date.now() + 3600000));
  const [repeat, setRepeat] = useState(
    editingReminder
      ? G.repeatOptions.find(r => r.value === editingReminder.repeatType) || G.repeatOptions[0]
      : G.repeatOptions[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  const canSave = title.trim().length > 0;

  /**
   * Maneja cambio de fecha validando que sea hoy o futura.
   * Si es hoy y la hora actual ya pasó, reinicia la hora a ahora+1min.
   * @param {Event} event
   * @param {Date|undefined} selectedDate
   */
  function onDateChange(event, selectedDate) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const now = new Date();
      const selected = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isToday = new Date(selectedDate).setHours(0, 0, 0, 0) === today.getTime();

      selected.setHours(23, 59, 59, 999);
      now.setHours(0, 0, 0, 0);
      if (selected < now) {
        Alert.alert(G.strings.invalidDate, G.strings.dateMustBeFuture);
        return;
      }
      setDate(selectedDate);

      if (isToday) {
        const nowTime = new Date();
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
        if (selectedDateTime < nowTime) {
          setTime(new Date(Date.now() + 60000));
        }
      }
    }
  }

  /**
   * Maneja cambio de hora validando que no sea pasada combinada con la fecha actual.
   * @param {Event} event
   * @param {Date|undefined} selectedTime
   */
  function onTimeChange(event, selectedTime) {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const now = new Date();
      const selected = new Date(date);
      selected.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      now.setHours(now.getHours(), now.getMinutes(), 0, 0);
      if (selected < now) {
        Alert.alert(G.strings.invalidTime, G.strings.timeMustBeFuture);
        return;
      }
      setTime(selectedTime);
    }
  }

  /** Formatea una fecha como DD/MM/YYYY. @param {Date} d @returns {string} */
  /** Formatea una fecha como DD/MM/YYYY. @param {Date} d @returns {string} */
  function formatDate(d) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /** Formatea una hora como h:mm AM/PM. @param {Date} d @returns {string} */
  function formatTime(d) {
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  }

  /**
   * Guarda el recordatorio: valida fecha futura, luego
   * despacha UPDATE_REMINDER o ADD_REMINDER y regresa.
   */
  async function handleSave() {
    if (!canSave) return;

    const now = new Date();
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    now.setHours(now.getHours(), now.getMinutes(), 0, 0);

    if (selectedDateTime.getTime() <= now.getTime()) {
      Alert.alert(G.strings.invalidDate, G.strings.dateMustBeFuture);
      return;
    }

    if (editingReminder) {
      await dispatch({ type: 'UPDATE_REMINDER', payload: {
        ...editingReminder,
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        date: date.toISOString(),
        time: time.toISOString(),
        repeatType: repeat.value,
      }});
    } else {
      await dispatch({ type: 'ADD_REMINDER', payload: {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        date: date.toISOString(),
        time: time.toISOString(),
        repeatType: repeat.value,
        active: true,
      }});
    }
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingReminder ? G.strings.editReminder : G.strings.newReminder}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>
          {G.strings.title} <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={G.strings.titlePlaceholder}
          placeholderTextColor={G.colorDisable}
        />

        <Text style={styles.label}>{G.strings.description}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={G.strings.descriptionPlaceholder}
          placeholderTextColor={G.colorDisable}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>{G.strings.category}</Text>
        <View style={styles.categoryRow}>
          {G.categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                { borderColor: cat.color },
                selectedCategory.id === cat.id && { backgroundColor: cat.color + '20' },
              ]}
            >
              <View style={[styles.pillDot, { backgroundColor: cat.color }]} />
              <Text style={[
                styles.pillLabel,
                selectedCategory.id === cat.id && { color: cat.color, fontWeight: '600' },
              ]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeField}>
            <Text style={styles.label}>{G.strings.date}</Text>
            <TouchableOpacity
              style={styles.dateTimeBtn}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateTimeField}>
            <Text style={styles.label}>{G.strings.time}</Text>
            <TouchableOpacity
              style={styles.dateTimeBtn}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        <Text style={styles.label}>{G.strings.repeat}</Text>
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => setShowRepeatModal(true)}
        >
          <Text style={styles.selectText}>{repeat.label}</Text>
          <Text style={styles.selectArrow}>▼</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.85}
      >
        <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
          {editingReminder ? G.strings.update : G.strings.save}
        </Text>
      </TouchableOpacity>

      <Modal visible={showRepeatModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRepeatModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{G.strings.repeat}</Text>
            {G.repeatOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.modalOption,
                  repeat.value === opt.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setRepeat(opt);
                  setShowRepeatModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    repeat.value === opt.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: G.spacing.lg,
    paddingTop: G.spacing.sm,
    paddingBottom: 100,
  },
  label: {
    fontSize: G.fontSizes.body,
    fontWeight: '600',
    color: G.colorText,
    marginBottom: G.spacing.sm,
    marginTop: G.spacing.md,
  },
  required: {
    color: G.colorError,
  },
  input: {
    backgroundColor: G.colorSurface,
    borderRadius: 12,
    paddingHorizontal: G.spacing.md,
    paddingVertical: 12,
    fontSize: G.fontSizes.body,
    color: G.colorText,
    borderWidth: 1,
    borderColor: G.colorBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: G.spacing.sm,
    flexWrap: 'wrap',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: G.colorSurface,
  },
  pillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  pillLabel: {
    fontSize: 13,
    color: G.colorText,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: G.spacing.md,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeBtn: {
    backgroundColor: G.colorSurface,
    borderRadius: 12,
    paddingHorizontal: G.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: G.colorBorder,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: G.fontSizes.body,
    color: G.colorText,
  },
  selectBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: G.colorSurface,
    borderRadius: 12,
    paddingHorizontal: G.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: G.colorBorder,
  },
  selectText: {
    fontSize: G.fontSizes.body,
    color: G.colorText,
  },
  selectArrow: {
    fontSize: 12,
    color: G.colorTextSecondary,
  },
  saveBtn: {
    backgroundColor: G.colorPrimary,
    marginHorizontal: G.spacing.lg,
    marginBottom: G.spacing.lg,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: G.colorPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveBtnDisabled: {
    backgroundColor: G.colorDisable,
    elevation: 0,
    shadowOpacity: 0,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: G.fontSizes.body,
    fontWeight: '700',
  },
  saveBtnTextDisabled: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: G.colorOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: G.colorSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: G.spacing.lg,
    paddingBottom: G.spacing.xl,
  },
  modalTitle: {
    fontSize: G.fontSizes.h2,
    fontWeight: '600',
    color: G.colorText,
    marginBottom: G.spacing.md,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: G.spacing.md,
    borderRadius: 10,
    marginBottom: G.spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: G.colorPrimaryLight + '40',
  },
  modalOptionText: {
    fontSize: G.fontSizes.body,
    color: G.colorText,
  },
  modalOptionTextSelected: {
    color: G.colorPrimary,
    fontWeight: '600',
  },
});

export default CreateReminderScreen;
