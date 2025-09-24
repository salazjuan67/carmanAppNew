import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '../config/theme';

export type SelectItem = { id: string; name?: string; description: string };

type Props = {
  title: string;
  items: SelectItem[];
  disabled?: boolean;
  onValueChange: (itemValue: string, itemIndex: number) => void;
  selectedValue?: string | null;
};

export const CustomSelect: React.FC<Props> = ({ items, title, disabled, onValueChange, selectedValue }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const onPress = () => {
                  onValueChange(item.id, index);
                  setModalVisible(false);
                };
                return (
                  <Pressable
                    onPress={onPress}
                    style={styles.modalItem}
                  >
                    <Text style={styles.modalItemText}>{item.description}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
      <Pressable
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        style={styles.selectButton}
      >
        {selectedValue && <Text style={styles.titleText}>{title}</Text>}
        <Text style={styles.selectedText}>
          {items.find((item) => item.id === selectedValue)?.description ?? title}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.darkGrey,
    backgroundColor: colors.white,
    minHeight: 50,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  modalContent: {
    width: '75%',
    borderRadius: 16,
    backgroundColor: colors.greyBackground,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalItem: {
    marginVertical: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    backgroundColor: colors.greyBackground,
    padding: 16,
  },
  modalItemText: {
    fontSize: 20,
    color: colors.black,
  },
  selectButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  titleText: {
    textAlign: 'left',
    fontSize: 12,
    color: colors.darkGrey,
  },
  selectedText: {
    textAlign: 'center',
    fontSize: 18,
    color: colors.black,
  },
});
