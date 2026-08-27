import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/config/theme';
import { CarmanIcon } from '../src/components/CarmanIcon';
import { WideButton } from '../src/components/WideButton';
import { useAnimated } from '../src/hooks/useAnimated';
import { ParkingCircle, Car, Smartphone, Check, Clock, ArrowRight } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingScreen {
  id: number;
  title: string;
  description: string;
  backgroundColor: string;
  icon: React.ComponentType<any>;
}

const onboardingScreens: OnboardingScreen[] = [
  {
    id: 0,
    title: 'Gestión de Estacionamientos',
    description: 'Optimiza la administración de tu estacionamiento con nuestra plataforma intuitiva y eficiente.',
    backgroundColor: colors.blueBackGround,
    icon: ParkingCircle,
  },
  {
    id: 1,
    title: 'Control en Tiempo Real',
    description: 'Monitorea el estado de cada vehículo, desde el ingreso hasta la entrega, con actualizaciones instantáneas.',
    backgroundColor: colors.success[700], // Fondo verde fijo
    icon: Car,
  },
  {
    id: 2,
    title: 'Experiencia Digital Innovadora',
    description: 'Ofrece a tus clientes QR digital, notificaciones instantáneas y una gestión inteligente de vehículos.',
    backgroundColor: colors.blueBackGround,
    icon: Smartphone,
  },
];

export default function OnboardingScreen() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [carStates, setCarStates] = useState<Array<'ESTACIONADO' | 'SOLICITADO' | 'EN CAMINO'>>(
    Array(12).fill('ESTACIONADO')
  );
  const animatedValue = useAnimated(0);
  const carTranslateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      setCurrentScreen(prev => prev + 1);
      
      // Animate content out, then in
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate car parking only for first screen
      if (currentScreen === 0) {
        Animated.timing(carTranslateX, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start();
      }

    } else {
      // Last screen, navigate to auth
      router.push('/auth');
    }
  };

  // Initial animation for the first screen
  React.useEffect(() => {
    animatedValue.setValue(1);
    
    if (currentScreen === 0) {
      // Reset car position
      carTranslateX.setValue(0);
      
      const animateCar = () => {
        Animated.timing(carTranslateX, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          // Wait and restart
          setTimeout(() => {
            if (currentScreen === 0) {
              carTranslateX.setValue(0);
              animateCar();
            }
          }, 3000);
        });
      };
      
      // Start immediately
      animateCar();
    }
  }, [currentScreen]);

  // Simulate random state changes for cars with smooth transitions
  React.useEffect(() => {
    if (currentScreen === 1) {
      const interval = setInterval(() => {
        setCarStates(prevStates => {
          const newStates = [...prevStates];
          const randomIndex = Math.floor(Math.random() * 12);
          const states: Array<'ESTACIONADO' | 'SOLICITADO' | 'EN CAMINO'> = ['ESTACIONADO', 'SOLICITADO', 'EN CAMINO'];
          newStates[randomIndex] = states[Math.floor(Math.random() * states.length)];
          return newStates;
        });
      }, 3000); // Change state every 3 seconds (más suave)

      return () => clearInterval(interval);
    }
  }, [currentScreen]); // Removed carTranslateX from dependencies

  const currentScreenData = onboardingScreens[currentScreen];
  const IconComponent = currentScreenData.icon;

  return (
    <View style={[styles.container, { backgroundColor: currentScreenData.backgroundColor }]}>
      {/* Background Pattern - Removed animated bubbles */}

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <CarmanIcon />
      </View>

      {/* Car Section */}
      <View style={styles.carSection}>
        {currentScreen === 0 && (
          <View style={styles.parkingAnimationContainer}>
            {/* Parking Spots */}
            <View style={styles.parkingSpots}>
              <View style={[styles.parkingSpot, styles.parkingSpotEmpty]} />
              <View style={[styles.parkingSpot, styles.parkingSpotEmpty]} />
              <View style={[styles.parkingSpot, styles.parkingSpotEmpty]} />
            </View>
            
            {/* Animated Car */}
            <Animated.View
              style={[
                styles.carContainer,
                {
                  transform: [
                    {
                      translateX: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-150, 0],
                      }),
                    },
                    {
                      translateY: carTranslateX.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0, -10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('../assets/images/car-frame.png')}
                resizeMode="contain"
                style={styles.carImage}
              />
              
              {/* Movement Trail */}
              <Animated.View
                style={[
                  styles.carTrail,
                  {
                    opacity: carTranslateX.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              >
                <View style={styles.trailDot} />
                <View style={styles.trailDot} />
                <View style={styles.trailDot} />
              </Animated.View>
            </Animated.View>
            
            {/* Parking Success */}
            <Animated.View
              style={[
                styles.parkingSuccess,
                {
                  opacity: carTranslateX.interpolate({
                    inputRange: [0.7, 1],
                    outputRange: [0, 1],
                  }),
                  transform: [
                    {
                      scale: carTranslateX.interpolate({
                        inputRange: [0.7, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.successText}>✓ Estacionado</Text>
            </Animated.View>
          </View>
        )}
        
        {/* Digital Innovation Experience for Screen 2 */}
        {currentScreen === 2 && (
          <View style={styles.digitalContainer}>
            {/* Floating Tech Elements - Fixed with continuous animations */}
            <Animated.View
              style={[
                styles.techElement,
                styles.techElement1,
                {
                  transform: [
                    {
                      translateY: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20],
                      }),
                    },
                  ],
                  opacity: 0.8, // Fixed opacity
                },
              ]}
            >
              <Text style={styles.techIcon}>📱</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.techElement,
                styles.techElement2,
                {
                  transform: [
                    {
                      translateY: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 15],
                      }),
                    },
                    {
                      scale: carTranslateX.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.2, 0.8],
                      }),
                    },
                  ],
                  opacity: 0.8, // Fixed opacity
                },
              ]}
            >
              <Text style={styles.techIcon}>🔗</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.techElement,
                styles.techElement3,
                {
                  transform: [
                    {
                      translateX: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 30],
                      }),
                    },
                  ],
                  opacity: 0.8, // Fixed opacity
                },
              ]}
            >
              <Text style={styles.techIcon}>⚡</Text>
            </Animated.View>
            
            {/* Additional Floating Tech Elements - Background */}
            <Animated.View
              style={[
                styles.techElement,
                styles.techElement4,
                {
                  transform: [
                    {
                      translateY: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -15],
                      }),
                    },
                  ],
                  opacity: 0.6, // Lower opacity for background
                },
              ]}
            >
              <Text style={styles.techIcon}>💻</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.techElement,
                styles.techElement5,
                {
                  transform: [
                    {
                      translateX: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -25],
                      }),
                    },
                    {
                      scale: carTranslateX.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.6, 1.0, 0.6],
                      }),
                    },
                  ],
                  opacity: 0.6, // Lower opacity for background
                },
              ]}
            >
              <Text style={styles.techIcon}>🌐</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.techElement,
                styles.techElement6,
                {
                  transform: [
                    {
                      translateY: carTranslateX.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 20],
                      }),
                    },
                  ],
                  opacity: 0.6, // Lower opacity for background
                },
              ]}
            >
              <Text style={styles.techIcon}>🔒</Text>
            </Animated.View>
            
            {/* Central Car with Digital Effects */}
            <Animated.View
              style={[
                styles.carContainer,
                {
                  transform: [
                    {
                      scale: carTranslateX.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.1, 1],
                      }),
                    },
                  ],
                  opacity: carTranslateX.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 0.8, 1],
                  }),
                },
              ]}
            >
              <Image
                source={require('../assets/images/car-frame.png')}
                resizeMode="contain"
                style={styles.carImage}
              />
              
              {/* Digital Hologram Effect */}
              <Animated.View
                style={[
                  styles.hologramEffect,
                  {
                    opacity: carTranslateX.interpolate({
                      inputRange: [0, 0.3, 0.7, 1],
                      outputRange: [0, 0.8, 0.8, 0],
                    }),
                  },
                ]}
              >
                <View style={styles.hologramLine} />
                <View style={styles.hologramLine} />
                <View style={styles.hologramLine} />
              </Animated.View>
              
            </Animated.View>
            
            {/* Floating Data Particles - Fixed with continuous animations */}
            <Animated.View
              style={[
                styles.dataParticle,
                styles.particle1,
                {
                  opacity: 0.9, // Fixed opacity
                },
              ]}
            >
              <Text style={styles.particleText}>01</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.dataParticle,
                styles.particle2,
                {
                  opacity: 0.9, // Fixed opacity
                },
              ]}
            >
              <Text style={styles.particleText}>AI</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.dataParticle,
                styles.particle3,
                {
                  opacity: 0.9, // Fixed opacity
                },
              ]}
            >
              <Text style={styles.particleText}>IoT</Text>
            </Animated.View>
          </View>
        )}

        {/* Control en Tiempo Real for Screen 1 */}
        {currentScreen === 1 && (
          <View style={styles.simpleCarContainer}>
            <View style={styles.parkedCarsContainer}>
              {[...Array(12)].map((_, index) => {
                const getStatusIcon = (state: string) => {
                  switch (state) {
                    case 'ESTACIONADO': return <Check size={12} color="white" />;
                    case 'SOLICITADO': return <Clock size={12} color="white" />;
                    case 'EN CAMINO': return <ArrowRight size={12} color="white" />;
                    default: return <Check size={12} color="white" />;
                  }
                };

                const getStatusColor = (state: string) => {
                  switch (state) {
                    case 'ESTACIONADO': return 'rgba(34, 197, 94, 0.9)'; // Verde
                    case 'SOLICITADO': return 'rgba(251, 191, 36, 0.9)'; // Amarillo
                    case 'EN CAMINO': return 'rgba(59, 130, 246, 0.9)'; // Azul
                    default: return 'rgba(34, 197, 94, 0.9)';
                  }
                };

                const getCarColor = (state: string) => {
                  switch (state) {
                    case 'ESTACIONADO': return 'rgba(34, 197, 94, 0.3)'; // Verde claro
                    case 'SOLICITADO': return 'rgba(251, 191, 36, 0.3)'; // Amarillo claro
                    case 'EN CAMINO': return 'rgba(59, 130, 246, 0.3)'; // Azul claro
                    default: return 'rgba(34, 197, 94, 0.3)';
                  }
                };

                return (
                  <View key={index} style={styles.parkedCar}>
                    <View style={[styles.carImageContainer, { backgroundColor: getCarColor(carStates[index]) }]}>
                      <Image
                        source={require('../assets/images/car-frame.png')}
                        resizeMode="contain"
                        style={styles.parkedCarImage}
                      />
                    </View>
                    <Animated.View 
                      style={[
                        styles.carStatus, 
                        { backgroundColor: getStatusColor(carStates[index]) }
                      ]}
                    >
                      {getStatusIcon(carStates[index])}
                    </Animated.View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        <IconComponent size={48} color={colors.white} style={styles.iconText} />
        <Text style={styles.title}>{currentScreenData.title}</Text>
        <Text style={styles.description}>{currentScreenData.description}</Text>
      </View>

      {/* Progress Indicators */}
      <View style={styles.paginationContainer}>
        {onboardingScreens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentScreen ? colors.white : colors.white + '80',
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <WideButton
          title={currentScreen === onboardingScreens.length - 1 ? "Comenzar" : "Siguiente"}
          onPress={handleNext}
          style={styles.primaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    opacity: 0.1,
  },
  logoSection: {
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carSection: {
    height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  parkingAnimationContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  parkingSpots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: spacing.xl,
  },
  parkingSpot: {
    width: 100, // Tamaño anterior
    height: 60, // Tamaño anterior
    borderRadius: 12, // Tamaño anterior
    borderWidth: 4, // Tamaño anterior
  },
  parkingSpotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  carContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carImage: {
    height: 120, // Doble de tamaño: 60 -> 120
    width: 200, // Doble de tamaño: 100 -> 200
  },
  carTrail: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailDot: {
    width: 4, // Tamaño original
    height: 4, // Tamaño original
    borderRadius: 2, // Tamaño original
    backgroundColor: colors.white,
    marginHorizontal: 2, // Tamaño original
    opacity: 0.7,
  },
  parkingSuccess: {
    position: 'absolute',
    top: -20,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.white,
  },
  successText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  simpleCarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleCarImage: {
    height: 120,
    width: 200,
  },
  parkedCarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
    maxWidth: 400, // Limitar ancho para centrar mejor
    alignSelf: 'center',
  },
  parkedCar: {
    margin: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  carImageContainer: {
    height: 60,
    width: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkedCarImage: {
    height: 60,
    width: 100,
  },
  carStatus: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Digital Innovation Styles
  digitalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  techElement: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  techElement1: {
    top: '20%',
    left: '10%',
  },
  techElement2: {
    top: '30%',
    right: '15%',
  },
  techElement3: {
    bottom: '25%',
    left: '20%',
  },
  techElement4: {
    top: '10%',
    right: '5%',
  },
  techElement5: {
    bottom: '10%',
    right: '25%',
  },
  techElement6: {
    top: '50%',
    left: '5%',
  },
  techIcon: {
    fontSize: 24,
  },
  hologramEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hologramLine: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: 'rgba(0, 255, 255, 0.6)',
    borderRadius: 1,
  },
  digitalSuccess: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(0, 255, 0, 0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.8)',
  },
  digitalSuccessText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  dataParticle: {
    position: 'absolute',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  particle1: {
    top: '15%',
    right: '20%',
  },
  particle2: {
    bottom: '20%',
    right: '10%',
  },
  particle3: {
    top: '40%',
    left: '5%',
  },
  particleText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  contentSection: {
    height: '35%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconText: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.base,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: typography.sizes.lg,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: spacing.xs,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});