import { Pressable, StyleSheet } from 'react-native';
import React from 'react';
import { colors } from '../config/theme';

export const IconButton = ({
  disable,
  icon,
  onPress,
}: {
  disable?: boolean;
  icon: React.ReactNode;
  onPress: VoidFunction;
}) => {
  return (
    <Pressable
      disabled={disable}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[styles.button, disable && styles.disabled]}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    opacity: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.black,
  },
  disabled: {
    opacity: 0.4,
  },
});

