import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';

// Estendemos as propriedades padrão do TextInput do React Native
interface Props extends TextInputProps {
  label: string;
}

// O "...rest" coleta todas as outras props (keyboardType, maxLength, autoCapitalize, etc)
export function CustomInput({ label, ...rest }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#999"
        {...rest} // Aqui o componente recebe as funções e tipos automaticamente
      />
    </View>
  );
}

export const formatarCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 3 primeiros dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os 6 primeiros dígitos
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca hífen após os 9 primeiros dígitos
    .replace(/(-\d{2})\d+?$/, '$1'); // Limita a 11 dígitos
};

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 15 },
  label: { fontSize: 14, color: '#444', marginBottom: 5, fontWeight: '600' },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#000', // Garante que o texto digitado seja visível
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});