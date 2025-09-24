import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import { colors } from '../config/theme';
import { Eye, EyeOff } from 'lucide-react-native';

type TextFieldProps = TextInputProps & {
  dark?: boolean;
  label?: string;
  errorText?: string | null;
  isPrivate?: boolean;
};

const EyeIcon: React.FC<{ isVisible: boolean; onPress: () => void; color: string }> = ({
  isVisible,
  onPress,
  color,
}) => (
  <Pressable hitSlop={20} onPressIn={onPress} onPressOut={onPress} style={styles.eyeIcon}>
    {isVisible ? <EyeOff color={color} size={24} /> : <Eye color={color} size={24} />}
  </Pressable>
);

export const TextField: React.FC<TextFieldProps> = (props) => {
  const { dark, label, errorText, isPrivate, style, value, onBlur, onFocus, ...restOfProps } = props;
  const [isFocused, setIsFocused] = useState(false);
  const [passVisible, setPassVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 150,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [focusAnim, isFocused, value]);

  const color = errorText ? colors.red : colors.darkGrey;
  const eyeIconColor = errorText ? colors.red : colors.black;

  const changeVisibility = (): void => {
    setPassVisible(!passVisible);
  };

  return (
    <View style={style}>
      <TextInput
        style={[
          styles.input,
          {
            paddingEnd: isPrivate ? 40 : 16,
            borderColor: color,
            backgroundColor: dark ? colors.black : colors.white,
            color: dark ? 'yellow' : colors.black,
          },
        ]}
        secureTextEntry={!passVisible && isPrivate}
        ref={inputRef}
        value={value}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        {...restOfProps}
      />
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <Animated.View
          style={[
            styles.labelContainer,
            {
              transform: [
                {
                  scale: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.75],
                  }),
                },
                {
                  translateY: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, dark ? -22 : -12],
                  }),
                },
                {
                  translateX: focusAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.labelText, { color }]}>
            {errorText ? '*' : ''}
            {label}
          </Text>
        </Animated.View>
      </TouchableWithoutFeedback>
      {isPrivate && (
        <EyeIcon isVisible={passVisible} onPress={changeVisibility} color={eyeIconColor} />
      )}
      {!!errorText && <Text style={[styles.error]}>{errorText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    paddingVertical: 14,
    paddingStart: 16,
    borderRadius: 4,
    borderBottomWidth: 1,
    fontSize: 18,
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  labelText: {
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    marginLeft: 12,
    fontSize: 8,
    color: colors.red,
  },
  eyeIcon: {
    position: 'absolute',
    top: 16,
    right: 8,
  },
});
