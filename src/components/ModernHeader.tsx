import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  icon
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern} />
      <View style={styles.content}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.decorativeLine} />
      <View style={styles.bottomAccent} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 50, // Padding para evitar el notch del iPhone
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    backgroundColor: colors.primary[50],
    borderRadius: 60,
    opacity: 0.3,
    transform: [{ translateX: 40 }, { translateY: -40 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: colors.primary[300],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    fontWeight: typography.weights.medium,
    opacity: 0.8,
  },
  decorativeLine: {
    height: 4,
    backgroundColor: colors.primary[300],
    borderRadius: 2,
    marginTop: 16,
    width: '25%',
    zIndex: 1,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary[200],
    opacity: 0.6,
  },
});
