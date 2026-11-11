import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { X, CreditCard, Check, Search } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { PhysicalCard } from '../types/vehicle';
import { physicalCardService } from '../services/physicalCardService';
import { useLanguage } from '../contexts/LanguageContext';

interface CardSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onCardSelected: (card: PhysicalCard) => void;
  establishmentId: string;
  currentCard?: PhysicalCard | null;
}

export const CardSelectorModal: React.FC<CardSelectorModalProps> = ({
  visible,
  onClose,
  onCardSelected,
  establishmentId,
  currentCard,
}) => {
  const { t } = useLanguage();
  const [availableCards, setAvailableCards] = useState<PhysicalCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PhysicalCard | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedConflict, setAssignedConflict] = useState<PhysicalCard | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setAvailableCards([]);
      setSelectedCard(null);
      setAssignedConflict(null);
      return;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const q = searchQuery.trim();
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        if (q.length > 0) {
          const result = await physicalCardService.searchCards(establishmentId, q);
          if (cancelled) return;
          setAvailableCards(result.cards || []);
          setAssignedConflict(result.assignedCard || null);
        } else {
          const cards = await physicalCardService.getAvailableCards(establishmentId);
          if (cancelled) return;
          setAvailableCards(cards);
          setAssignedConflict(null);
        }
      } catch (error) {
        if (cancelled) return;
        Alert.alert(t('error'), t('loadingCardsError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, q.length > 0 ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, establishmentId, searchQuery]);

  const handleCardSelect = (card: PhysicalCard) => {
    setSelectedCard(card);
  };

  const handleConfirm = () => {
    if (selectedCard) {
      onCardSelected(selectedCard);
      onClose();
    }
  };

  const renderCardItem = ({ item }: { item: PhysicalCard }) => {
    const isSelected = selectedCard?._id === item._id;
    const isCurrentCard = currentCard?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.cardItem,
          isSelected && styles.cardItemSelected,
          isCurrentCard && styles.cardItemCurrent,
        ]}
        onPress={() => handleCardSelect(item)}
        disabled={isCurrentCard}
      >
        <View style={styles.cardItemContent}>
          <View style={styles.cardItemHeader}>
            <CreditCard 
              size={20} 
              color={isCurrentCard ? colors.darkGrey : colors.primary[600]} 
            />
            <Text style={[
              styles.cardNumber,
              isCurrentCard && styles.cardNumberDisabled
            ]}>
              {item.cardNumber}
            </Text>
            {isSelected && (
              <Check size={20} color={colors.success[600]} />
            )}
            {isCurrentCard && (
              <Text style={styles.currentLabel}>{t('currentCard')}</Text>
            )}
          </View>
          <Text style={[
            styles.cardStatus,
            isCurrentCard && styles.cardStatusDisabled
          ]}>
            {isCurrentCard ? t('cardCurrentlyAssigned') : t('cardAvailable')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectCard')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.darkGrey} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            {t('searchCardHint')}
          </Text>

          <View style={styles.searchBox}>
            <Search size={18} color={colors.darkGrey} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchCardPlaceholder')}
              placeholderTextColor={colors.darkGrey}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={12}>
                <X size={16} color={colors.darkGrey} />
              </TouchableOpacity>
            )}
          </View>

          {assignedConflict && availableCards.length === 0 && !loading && (
            <Text style={styles.conflictText}>
              {t('cardAlreadyInUse')} ({assignedConflict.cardNumber})
            </Text>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>{t('loadingCards')}</Text>
            </View>
          ) : (
            <FlatList
              data={availableCards}
              renderItem={renderCardItem}
              keyExtractor={(item) => item._id}
              style={styles.cardsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <CreditCard size={48} color={colors.darkGrey} />
                  <Text style={styles.emptyText}>
                    {searchQuery.trim()
                      ? t('cardNotInEstablishment')
                      : t('noCardsAvailable')}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedCard && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedCard}
          >
            <Text style={[
              styles.confirmButtonText,
              !selectedCard && styles.confirmButtonTextDisabled,
            ]}>
              {selectedCard
                ? `${t('useThisCard')} ${selectedCard.cardNumber}`
                : t('useThisCard')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ligthGrey,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ligthGrey,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
    paddingVertical: 0,
  },
  conflictText: {
    fontSize: typography.sizes.sm,
    color: colors.error[700],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
  },
  cardsList: {
    flex: 1,
  },
  cardItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ligthGrey,
  },
  cardItemSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  cardItemCurrent: {
    borderColor: colors.darkGrey,
    backgroundColor: colors.ligthGrey,
    opacity: 0.7,
  },
  cardItemContent: {
    gap: spacing.xs,
  },
  cardItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    fontFamily: 'monospace',
    flex: 1,
  },
  cardNumberDisabled: {
    color: colors.darkGrey,
  },
  cardStatus: {
    fontSize: typography.sizes.sm,
    color: colors.darkGrey,
    marginLeft: 28,
  },
  cardStatusDisabled: {
    color: colors.darkGrey,
  },
  currentLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.darkGrey,
    backgroundColor: colors.ligthGrey,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.ligthGrey,
  },
  confirmButton: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.ligthGrey,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  confirmButtonTextDisabled: {
    color: colors.darkGrey,
  },
});
