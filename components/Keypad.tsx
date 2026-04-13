import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface KeypadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  compact?: boolean;
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del']
];

export const Keypad: React.FC<KeypadProps> = ({ onPress, onDelete, compact }) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, compact && styles.rowCompact]}>
          {row.map((key) => {
            if (key === 'del') {
              return (
                <TouchableOpacity key={key} style={[styles.key, compact && styles.keyCompact]} onPress={onDelete}>
                  <View style={[styles.deleteButton, compact && styles.deleteButtonCompact]}>
                    <ArrowLeft size={compact ? 18 : 22} color={Colors.text} />
                  </View>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity 
                key={key} 
                style={[styles.key, compact && styles.keyCompact]} 
                onPress={() => onPress(key)}
              >
                <Text style={[styles.keyText, compact && styles.keyTextCompact]}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rowCompact: {
    marginBottom: 10,
  },
  key: {
    width: '30%',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCompact: {
    minHeight: 40,
  },
  keyText: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  keyTextCompact: {
    fontSize: 20,
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    borderRadius: 10,
  },
  deleteButtonCompact: {
    padding: 6,
    borderRadius: 8,
  },
});
