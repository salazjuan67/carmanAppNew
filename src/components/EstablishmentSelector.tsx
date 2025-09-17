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
    console.log('🏢 Selecting establishment:', establishment.nombre);
    onSelect(establishment);
    setModalVisible(false);
  };

  const getDisplayText = () => {
    console.log('🏢 getDisplayText - selectedEstablishment:', selectedEstablishment?.nombre);
    console.log('🏢 getDisplayText - loading:', loading);
    console.log('🏢 getDisplayText - establishments count:', establishments.length);
    
    if (loading) return 'Cargando...';
    if (selectedEstablishment) return selectedEstablishment.nombre;
    return 'Seleccionar establecimiento';
  };

  const displayText = getDisplayText();
  console.log('🏢 Final display text:', displayText);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <Building size={18} color={colors.white} />
        <Text style={styles.selectedText} numberOfLines={1}>
          {displayText}
        </Text>
        <ChevronDown size={18} color={colors.white} />
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
                  <View style={styles.establishmentInfo}>
                    <Building size={16} color={colors.primary[600]} />
                    <View style={styles.establishmentText}>
                      <Text style={styles.establishmentName}>{item.nombre}</Text>
                      {item.direccion && (
                        <Text style={styles.establishmentAddress}>{item.direccion}</Text>
                      )}
                    </View>
                  </View>
                  {selectedEstablishment?._id === item._id && (
                    <Text style={styles.selectedIndicator}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
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
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    minHeight: 48,
  },
  selectedText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  establishmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary[200],
  },
  selectedItem: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
  },
  establishmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  establishmentText: {
    flex: 1,
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
  selectedIndicator: {
    fontSize: typography.sizes.lg,
    color: colors.primary[600],
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    backgroundColor: colors.secondary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
