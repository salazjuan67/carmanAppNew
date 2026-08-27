import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing } from '../src/config/theme';
import { CarmanIcon } from '../src/components/CarmanIcon';
import { WideButton } from '../src/components/WideButton';

export default function WelcomeScreen() {
  const handleContinue = () => {
    router.push('/onboarding');
  };

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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.4 }],
  },
  textSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
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
});
