import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { ChevronDown, Building } from 'lucide-react-native';
import { Establishment } from '../types/vehicle';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';

interface EstablishmentSelectorProps {
  establishments: Establishment[];
  selectedEstablishment: Establishment | null;
  onSelect: (establishment: Establishment) => void;
  loading?: boolean;
  /** Vehículos aún en operación (ingresados / solicitados, etc.) */
  activeVehicleCount?: number;
}

export const EstablishmentSelector: React.FC<EstablishmentSelectorProps> = ({
  establishments,
  selectedEstablishment,
  onSelect,
  loading = false,
  activeVehicleCount,
}) => {
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (establishment: Establishment) => {
    onSelect(establishment);
    setModalVisible(false);
  };

  const getDisplayText = () => {
    if (loading) return t('loading');
    if (selectedEstablishment) {
      const name = selectedEstablishment.nombre;
      if (typeof activeVehicleCount === 'number') {
        return `${name} · ${activeVehicleCount} activos`;
      }
      return name;
    }
    return t('selectEstablishment');
  };

  const displayText = getDisplayText();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => establishments.length > 1 && setModalVisible(true)}
        disabled={loading || establishments.length <= 1}
      >
        <Building size={16} color={colors.white} />
        <Text style={styles.selectedText} numberOfLines={1}>
          {displayText}
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
            <Text style={styles.modalTitle}>{t('selectEstablishment')}</Text>
            
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
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 52, 78, 0.78)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    minHeight: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  selectedText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.sizes.sm,
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
    color: colors.darkBlue,
    fontWeight: typography.weights.bold,
  },
  closeButton: {
    backgroundColor: colors.darkBlue,
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
