import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { ChevronDown, Building } from 'lucide-react-native';
import { Establishment } from '../types/vehicle';
import { colors, spacing, typography, borderRadius } from '../config/theme';

interface EstablishmentSelectorProps {
  establishments: Establishment[];
  selectedEstablishment: Establishment | null;
  onSelect: (establishment: Establishment) => void;
  loading?: boolean;
}

export const EstablishmentSelector: React.FC<EstablishmentSelectorProps> = ({
  establishments,
  selectedEstablishment,
  onSelect,
  loading = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (establishment: Establishment) => {
    onSelect(establishment);
    setModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando establecimientos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Building size={16} color={colors.white} />
        <Text style={styles.selectedText} numberOfLines={1}>
          {selectedEstablishment?.nombre || 'Seleccionar establecimiento'}
        </Text>
        <ChevronDown size={16} color={colors.white} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Establecimiento</Text>
            
            <FlatList
              data={establishments}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.establishmentItem,
                    selectedEstablishment?._id === item._id && styles.selectedItem
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.establishmentName}>{item.nombre}</Text>
                  {item.direccion && (
                    <Text style={styles.establishmentAddress}>{item.direccion}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  selectedText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  establishmentItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  selectedItem: {
    backgroundColor: colors.primary[100],
  },
  establishmentName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  establishmentAddress: {
    fontSize: typography.sizes.sm,
    color: colors.secondary[600],
    marginTop: spacing.xs,
  },
  closeButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
