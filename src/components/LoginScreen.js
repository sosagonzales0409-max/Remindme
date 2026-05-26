import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import G from './Globals';

/**
 * Pantalla de inicio de sesión y registro.
 * Permite al usuario autenticarse con email/contraseña o crear una cuenta nueva.
 * Incluye validación de formulario, toggle entre login/register,
 * y manejo de errores de Firebase Auth.
 */
function LoginScreen() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Valida formato básico de email.
   * @param {string} e - Email a validar
   * @returns {boolean}
   */
  function validateEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  /**
   * Maneja el envío del formulario.
   * Valida email, password y confirmación, luego llama a login() o register().
   * Captura errores de Firebase y los muestra como Alert.
   */
  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!validateEmail(trimmedEmail)) {
      Alert.alert('', G.strings.invalidEmail);
      return;
    }

    if (password.length < 6) {
      Alert.alert('', G.strings.passwordTooShort);
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      Alert.alert('', G.strings.passwordsDontMatch);
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        await register(trimmedEmail, password);
      } else {
        await login(trimmedEmail, password);
      }
    } catch (e) {
      let message = isRegistering ? G.strings.registerError : G.strings.loginError;
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        message = G.strings.loginError;
      } else if (e.code === 'auth/email-already-in-use') {
        message = G.strings.emailInUse;
      } else if (e.code === 'auth/too-many-requests') {
        message = G.strings.tooManyRequests;
      }
      Alert.alert('', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>{G.name}</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={G.strings.emailPlaceholder}
          placeholderTextColor={G.colorDisable}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={G.strings.passwordPlaceholder}
            placeholderTextColor={G.colorDisable}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        {isRegistering && (
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={G.strings.confirmPassword}
              placeholderTextColor={G.colorDisable}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? G.strings.register : G.strings.login}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggle}
          onPress={() => {
            setIsRegistering(!isRegistering);
            setConfirmPassword('');
          }}
        >
          <Text style={styles.toggleText}>
            {isRegistering ? G.strings.hasAccount : G.strings.noAccount}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: G.colorBackground,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: G.spacing.xl,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: G.colorPrimary,
    textAlign: 'center',
    marginBottom: G.spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: G.spacing.md,
  },
  input: {
    backgroundColor: G.colorSurface,
    borderRadius: 12,
    paddingHorizontal: G.spacing.md,
    paddingVertical: 14,
    paddingRight: 44,
    fontSize: G.fontSizes.body,
    color: G.colorText,
    borderWidth: 1,
    borderColor: G.colorBorder,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: G.colorPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: G.spacing.sm,
    elevation: 3,
    shadowColor: G.colorPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: G.fontSizes.body,
    fontWeight: '700',
  },
  toggle: {
    marginTop: G.spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: G.fontSizes.body,
    color: G.colorPrimary,
    fontWeight: '500',
  },
});

export default LoginScreen;
