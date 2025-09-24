import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Crown } from 'lucide-react-native'
import { colors, spacing, borderRadius, typography } from '../config/theme'

interface VIPBadgeProps {
  isVip: boolean
  size?: 'small' | 'medium' | 'large'
}

export const VIPBadge: React.FC<VIPBadgeProps> = ({ 
  isVip, 
  size = 'medium' 
}) => {
  if (!isVip) return null

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      text: styles.smallText,
      iconSize: 12,
    },
    medium: {
      container: styles.mediumContainer,
      text: styles.mediumText,
      iconSize: 16,
    },
    large: {
      container: styles.largeContainer,
      text: styles.largeText,
      iconSize: 20,
    },
  }

  const currentSize = sizeStyles[size]

  return (
    <View style={[styles.badge, currentSize.container]}>
      <Crown 
        size={currentSize.iconSize} 
        color={colors.darkBlue} 
        style={styles.crownIcon}
      />
      <Text style={[styles.badgeText, currentSize.text]}>VIP</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.lightYellow,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.darkBlue,
  },
  badgeText: {
    color: colors.darkBlue,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 4,
  },
  crownIcon: {
    marginRight: 2,
  },
  // Small size
  smallContainer: {
    width: 60,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  smallText: {
    fontSize: 12,
  },
  // Medium size
  mediumContainer: {
    width: 80,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  // Large size
  largeContainer: {
    width: 100,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  largeText: {
    fontSize: 18,
  },
})