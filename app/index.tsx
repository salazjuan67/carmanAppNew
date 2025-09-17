import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../src/config/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🚗</Text>
          <Text style={styles.logoTitle}>Carman</Text>
          <Text style={styles.logoSubtitle}>Gestión Inteligente de Vehículos</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>
            Bienvenido a la nueva experiencia Carman
          </Text>
          <Text style={styles.welcomeDescription}>
            Una aplicación moderna y eficiente para la gestión de vehículos en establecimientos
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() => router.push('/auth')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/home')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Continuar como Invitado</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versión 1.0.0 - Nueva Arquitectura</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[900],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: typography.sizes['6xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  logoTitle: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: typography.sizes.lg,
    color: colors.primary[200],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  welcomeContainer: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: typography.sizes.xl,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: typography.weights.medium,
  },
  welcomeDescription: {
    fontSize: typography.sizes.base,
    color: colors.primary[200],
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.primary[800],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: spacing['2xl'],
    alignItems: 'center',
  },
  versionText: {
    color: colors.primary[300],
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});