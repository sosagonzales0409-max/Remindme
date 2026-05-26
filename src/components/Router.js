/**
 * @file Router - Configuración de navegación y autenticación.
 * Define el flujo condicional: LoginScreen si no hay usuario,
 * o stack navegable (Home, CreateReminder, Settings) con ReminderProvider.
 */

import React from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ReminderProvider } from '../context/ReminderContext';
import HomeScreen from './HomeScreen';
import CreateReminderScreen from './CreateReminderScreen';
import SettingsScreen from './SettingsScreen';
import LoginScreen from './LoginScreen';

const Stack = createStackNavigator();

/**
 * Navegador condicional basado en estado de autenticación.
 * Muestra LoginScreen o el stack principal de la app.
 */
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ReminderProvider userId={user.uid}>
      <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateReminder" component={CreateReminderScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      </NavigationContainer>
      </ReminderProvider>
    </SafeAreaView>
  );
}

/**
 * Componente raíz del Router.
 * Envuelve AppNavigator en AuthProvider para disponibilidad del contexto de autenticación.
 * @returns {React.ReactElement}
 */
export default function Router() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
