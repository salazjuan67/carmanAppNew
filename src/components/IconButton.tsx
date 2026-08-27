import { Pressable, StyleSheet } from 'react-native';
import React from 'react';

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
      hitSlop={4}
      style={[styles.button, disable && styles.disabled]}
    >
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.4,
  },
});

