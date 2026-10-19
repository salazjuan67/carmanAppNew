import { useEffect } from 'react';
import { View, Text, ImageBackground, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing } from '../src/config/theme';
import { CarmanIcon } from '../src/components/CarmanIcon';
import { WideButton } from '../src/components/WideButton';
import { useAuth } from '../src/hooks/useAuth';

export default function WelcomeScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isLoading, isAuthenticated]);

  const handleContinue = () => {
    router.push('/onboarding');
  };

  const handleSkip = () => {
    router.replace('/auth');
  };

  if (isLoading || isAuthenticated) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/bg/circles.png')}
        resizeMode="contain"
        style={styles.backgroundImage}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <CarmanIcon />
          </View>

          <View style={styles.carSection}>
            <Image
              source={require('../assets/images/car-frame.png')}
              resizeMode="contain"
              style={styles.carImage}
            />
          </View>

          <View style={styles.textSection}>
            <Text style={styles.welcomeTitle}>
              Gestión de estacionamientos y logística de conducción
            </Text>
            <Text style={styles.welcomeBody}>
              Bienvenidos a la App Carman, una experiencia innovadora diseñada para brindar mayor agilidad y comodidad en el servicio de estacionamiento.
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.buttonSection}>
        <WideButton title="Continuar" onPress={handleContinue} />
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        >
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueBackGround,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  logoSection: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.25 }],
    marginBottom: spacing.sm,
  },
  carSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  carImage: {
    width: 240,
    height: 150,
  },
  textSection: {
    width: '100%',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: typography.sizes.lg,
    lineHeight: 24,
    color: colors.white,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  welcomeBody: {
    fontSize: typography.sizes.base,
    lineHeight: 22,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonSection: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    opacity: 0.85,
  },
});
