import React, { useState } from 'react';
import { View, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '~/theme';
import { Text } from '~/components/Text';
import { Button } from '~/components/Button';
import { FormField } from '~/components/FormField';
import { parseIsoDate, toIsoDate } from '~/utils/date';

export interface DateFieldProps {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  minimumDate?: Date;
  error?: string;
}

function formatDisplayDate(iso: string): string {
  const date = parseIsoDate(iso);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DateField({ label, value, onChange, minimumDate, error }: DateFieldProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Date>(
    value ? parseIsoDate(value) : (minimumDate ?? new Date())
  );

  function open() {
    setDraft(value ? parseIsoDate(value) : (minimumDate ?? new Date()));
    setVisible(true);
  }

  function confirm() {
    onChange(toIsoDate(draft));
    setVisible(false);
  }

  return (
    <View>
      <Pressable onPress={open}>
        <View pointerEvents="none">
          <FormField
            label={label}
            value={value ? formatDisplayDate(value) : ''}
            placeholder="Select a date"
            editable={false}
            error={error}
            rightAccessory={
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
            }
          />
        </View>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.background,
                borderTopLeftRadius: theme.radius.lg,
                borderTopRightRadius: theme.radius.lg,
                padding: theme.spacing.md,
              },
            ]}>
            <Text variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
              {label}
            </Text>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              onChange={(_event, date) => date && setDraft(date)}
            />
            <Button title="Done" onPress={confirm} style={{ marginTop: theme.spacing.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    paddingBottom: 32,
  },
});
