import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { LatLng } from '~/features/ride/types';
import { searchAddress, GeocodeResult } from '~/services/geocodingService';

const DEBOUNCE_MS = 350;

export interface AddressSearchInputProps {
  placeholder: string;
  onSelect: (result: GeocodeResult) => void;
  bias?: LatLng | null;
}

export function AddressSearchInput({ placeholder, onSelect, bias }: AddressSearchInputProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChangeText(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await searchAddress(text, bias ?? undefined);
        setResults(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not search right now.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(result: GeocodeResult) {
    onSelect(result);
    setQuery('');
    setResults([]);
  }

  return (
    <View>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background,
          },
        ]}>
        <Ionicons name="search" size={18} color={theme.colors.textMuted} />
        <BottomSheetTextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }]}
        />
        {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
      </View>

      {error ? (
        <Text variant="caption" color="error" style={{ marginTop: theme.spacing.xs }}>
          {error}
        </Text>
      ) : null}

      {!loading && !error && query.trim() && results.length === 0 ? (
        <Text
          variant="caption"
          color="textMuted"
          style={{ padding: theme.spacing.sm, textAlign: 'center' }}>
          No results found
        </Text>
      ) : null}

      {results.map((result) => (
        <Pressable
          key={`${result.coords.latitude}-${result.coords.longitude}`}
          onPress={() => handleSelect(result)}
          style={[styles.resultRow, { borderTopColor: theme.colors.border }]}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
          <Text variant="body" numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
            {result.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    marginLeft: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
