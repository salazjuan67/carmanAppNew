import React, { ReactElement } from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  type TouchableOpacityProps,
} from 'react-native'
import { colors, typography } from '../config/theme'

type WideButtonProps = TouchableOpacityProps & {
  title: string
  medium?: boolean
  primary?: boolean
}

export const WideButton = (props: WideButtonProps): ReactElement => {
  const { title, primary, disabled, medium } = props

  const customStyles = StyleSheet.create({
    container: {
      backgroundColor: primary ? colors.darkBlue : colors.white,
      opacity: disabled ? 0.7 : 1,
    },
    text: {
      fontSize: Platform.select({
        ios: 20,
        android: 16,
      }),
      color: primary ? colors.white : colors.black,
    },
  })

  return (
    <TouchableOpacity
      {...props}
      style={[styles.container, customStyles.container, { width: medium ? '50%' : '100%' }]}
    >
      <Text style={[styles.text, customStyles.text]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    height: Platform.select({
      ios: 60,
      android: 50,
    }),
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
})