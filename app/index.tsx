import { View, Text, ImageBackground, Animated, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors, typography } from '../src/config/theme';
import { CarmanIcon } from '../src/components/CarmanIcon';
import { WideButton } from '../src/components/WideButton';
import { useAnimated } from '../src/hooks/useAnimated';

export default function WelcomeScreen() {
  const animatedValue = useAnimated(0);

  const handleContinue = () => {
    console.log('🚀 Navigating to auth screen...');
    router.push('/auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <ImageBackground
          source={require('../assets/bg/circles.png')}
          resizeMode="contain"
          style={styles.backgroundImage}
        >
          {/* Logo Section - 1/4 of screen */}
          <View style={styles.logoSection}>
            <CarmanIcon />
          </View>

          {/* Animated Car Section - 2/4 of screen */}
          <Animated.View
            style={[
              styles.carSection,
              {
                transform: [
                  {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require('../assets/images/car-frame.png')}
              resizeMode="center"
              style={styles.carImage}
            />
          </Animated.View>

          {/* Text Section - 1/4 of screen */}
          <View style={styles.textSection}>
            <Text style={styles.welcomeTitle}>
              Gestión de estacionamientos y logística de conducción
            </Text>
            <Text style={styles.welcomeBody}>
              Bienvenidos a la App Carman, una experiencia innovadora diseñada para brindar mayor agilidad y comodidad en el servicio de estacionamiento.
            </Text>
          </View>
        </ImageBackground>
      </View>

      {/* Button Section - 1/6 of screen */}
      <View style={styles.buttonSection}>
        <WideButton
          title="Continuar"
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueBackGround,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    height: '83.33%', // 5/6 of screen
  },
  backgroundImage: {
    height: '100%',
  },
  logoSection: {
    height: '25%', // 1/4 of main content
    justifyContent: 'center',
    alignItems: 'center',
  },
  carSection: {
    height: '50%', // 2/4 of main content
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -176, // -ml-44 equivalent (44 * 4 = 176)
  },
  carImage: {
    height: 200,
    width: 300,
  },
  textSection: {
    height: '25%', // 1/4 of main content
    width: '100%',
    justifyContent: 'space-evenly',
    alignSelf: 'center',
    paddingHorizontal: 24, // px-6 equivalent
  },
  welcomeTitle: {
    fontSize: typography.sizes.lg,
    lineHeight: 20, // leading-5 equivalent
    color: colors.white,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  welcomeBody: {
    paddingVertical: 20, // py-5 equivalent
    fontSize: typography.sizes.base,
    lineHeight: 20, // leading-5 equivalent
    color: colors.white,
    textAlign: 'center',
  },
  buttonSection: {
    height: '16.67%', // 1/6 of screen
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 40, // px-10 equivalent
  },
});