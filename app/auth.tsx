import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ImageBackground, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState } from 'react';
import { router, useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../src/config/theme';
import { useAuth } from '../src/hooks/useAuth';
import { CarmanIcon } from '../src/components/CarmanIcon';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleGoBack = () => {
    // Intentar ir hacia atrás, si no funciona, ir a home
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Login exitoso - navegar a home
        router.push('/home');
      } else {
        // Mostrar error de login
        Alert.alert(
          'Error de Autenticación', 
          result.error || 'Credenciales incorrectas. Por favor verifica tu email y contraseña.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error', 
        'Ocurrió un error inesperado. Por favor intenta nuevamente.'
      );
    }
  };

  const buttonText = isLoading ? 'Esperando...' : 'Iniciar Sesión';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require('../assets/bg/back-high.jpg')}
          resizeMode="cover"
          style={styles.backgroundImage}
        >
          <CarmanIcon />
        </ImageBackground>
      </TouchableWithoutFeedback>
      
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Usuario</Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@ejemplo.com"
            placeholderTextColor={colors.ligthGrey}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contraseña</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.ligthGrey}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>{buttonText}</Text>
        </TouchableOpacity>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versión 1.0.0</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueBackGround,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.darkGrey,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: colors.darkGrey,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: colors.darkBlue,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: colors.darkGrey,
  },
});
