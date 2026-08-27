import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { TextField } from './TextField';
import { SelectItem } from './CustomSelect';
import { colors } from '../config/theme';

const BLUR_CLOSE_MS = 200;

type Props = {
  label?: string;
  placeholder?: string;
  arrayData: SelectItem[];
  setValue: (text: string) => void;
  blank: boolean;
  newText?: string;
};

export const AutoCompleteInput: React.FC<Props> = ({ 
  label = '', 
  placeholder, 
  arrayData, 
  setValue, 
  blank, 
  newText 
}) => {
  const [searchText, setSearchText] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const blurCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (blank) {
      setSearchText('');
      setDropdownVisible(false);
    }
  }, [blank]);

  useEffect(() => {
    if (newText) setSearchText(newText);
  }, [newText]);

  useEffect(() => {
    return () => {
      if (blurCloseRef.current) clearTimeout(blurCloseRef.current);
    };
  }, []);

  const clearBlurClose = () => {
    if (blurCloseRef.current) {
      clearTimeout(blurCloseRef.current);
      blurCloseRef.current = null;
    }
  };

  const scheduleCloseOnBlur = () => {
    clearBlurClose();
    blurCloseRef.current = setTimeout(() => {
      setDropdownVisible(false);
      blurCloseRef.current = null;
    }, BLUR_CLOSE_MS);
  };

  const handleChangeText = (text: string) => {
    clearBlurClose();
    setSearchText(text);
    setDropdownVisible(true);
  };

  const filteredItems = arrayData.filter((el) => {
    const searchLower = searchText?.toLowerCase() || '';
    const descriptionLower = el.description.toLowerCase();
    
    // Búsqueda consecutiva: verifica que la descripción empiece exactamente con el texto buscado
    if (searchLower.length === 0) return true;
    
    return descriptionLower.startsWith(searchLower);
  });

  return (
    <View style={styles.container}>
      <TextField
        label={label}
        onChangeText={handleChangeText}
        value={searchText}
        placeholder={placeholder}
        onFocus={() => {
          clearBlurClose();
          setDropdownVisible(true);
        }}
        onBlur={scheduleCloseOnBlur}
      />
      {dropdownVisible && (
        <View style={styles.dropdown}>
          {filteredItems.length > 0 ? (
            <View>
              {filteredItems.map((item) => (
                <Item
                  key={item.id}
                  text={item.description}
                  id={item.id}
                  setText={setSearchText}
                  setValue={setValue}
                  onPressInItem={clearBlurClose}
                  onSelect={() => {
                    clearBlurClose();
                    setDropdownVisible(false);
                  }}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.noResultsText}>
              No se encontraron marcas que coincidan
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

type ItemProps = {
  text: string;
  id: string;
  setText: (value: string) => void;
  setValue: (value: string) => void;
  onPressInItem: () => void;
  onSelect: () => void;
};

const Item: React.FC<ItemProps> = ({ text, setText, id, setValue, onPressInItem, onSelect }) => {
  const handlePress = () => {
    setValue(id);
    setText(text);
    onSelect();
  };

  return (
    <Pressable
      focusable={true}
      onPressIn={onPressInItem}
      onPress={handlePress}
      style={styles.item}
    >
      <Text style={styles.itemText}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropdown: {
    marginTop: 8,
    maxHeight: 128,
  },
  item: {
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: colors.ligthGrey,
    padding: 4,
  },
  itemText: {
    textAlign: 'center',
    fontSize: 18,
    color: colors.black,
  },
  noResultsText: {
    textAlign: 'center',
    color: colors.darkGrey,
    fontSize: 14,
    paddingVertical: 8,
  },
});
