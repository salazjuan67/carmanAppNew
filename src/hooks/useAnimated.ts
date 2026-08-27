import { useRef, useEffect } from 'react'
import { Animated } from 'react-native'

export const useAnimated = (initialValue: number = 0) => {
  const animatedValue = useRef(new Animated.Value(initialValue)).current

  useEffect(() => {
    // Iniciar animación automáticamente
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [animatedValue])

  return animatedValue
}

