import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from '../../components/CustomInput';

const TODOS_ICONS = ['beer', 'football', 'trophy', 'shirt', 'wine', 'pizza', 'star', 'heart', 'gift', 'wallet', 'cash', 'card', 'calendar', 'megaphone', 'notifications', 'people', 'ticket', 'rocket', 'flame', 'diamond', 'hammer', 'build', 'brush', 'camera', 'cart', 'flash', 'home', 'key', 'map', 'mic', 'moon', 'sunny'];
const COLOR_OPTIONS = ['#D4AF37', '#000000', '#F87171', '#4ADE80', '#60A5FA'];

export default function SugerirBeneficioScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [bgColor, setBgColor] = useState('#000000');
  const [iconColor, setIconColor] = useState('#D4AF37');

  // Filtro de busca
  const filteredIcons = TODOS_ICONS.filter(icon => 
    icon.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSalvar = () => {
    if (!titulo) return;
    
    // Futuro: salvar no Supabase aqui
    
    // ✅ VOLTAR LIMPO: Usamos navigation.goBack() para fechar a tela 
    // e retornar à pilha anterior corretamente.
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Vantagem</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Prévia</Text>
        <View style={styles.previewCard}>
          <View style={[styles.iconArea, { backgroundColor: bgColor }]}>
            <Ionicons name={selectedIcon as any} size={24} color={iconColor} />
          </View>
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.previewTitle}>{titulo || 'Título'}</Text>
            <Text style={styles.previewDesc}>{descricao || 'Descrição...'}</Text>
          </View>
        </View>

        <CustomInput label="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex: Cerveja Grátis" />
        <CustomInput label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Regras da vantagem..." multiline />

        {/* BUSCA DE ÍCONES */}
        <Text style={styles.label}>Ícone</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Pesquisar (ex: beer...)"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* SCROLL HORIZONTAL (Mais limpo) */}
        <View style={styles.iconContainer}>
          <FlatList
            data={filteredIcons}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.iconPicker, selectedIcon === item && styles.selectedOption]} 
                onPress={() => setSelectedIcon(item)}
              >
                <Ionicons name={item as any} size={24} color={selectedIcon === item ? '#D4AF37' : '#000'} />
              </TouchableOpacity>
            )}
          />
        </View>

        <Text style={styles.label}>Cor do Fundo</Text>
        <View style={styles.optionsRow}>
          {COLOR_OPTIONS.map(color => (
            <TouchableOpacity key={color} style={[styles.colorPicker, { backgroundColor: color }, bgColor === color && styles.selectedOption]} onPress={() => setBgColor(color)} />
          ))}
        </View>

        <Text style={styles.label}>Cor do Ícone</Text>
        <View style={styles.optionsRow}>
          {COLOR_OPTIONS.map(color => (
            <TouchableOpacity key={color} style={[styles.colorPicker, { backgroundColor: color }, iconColor === color && styles.selectedOption]} onPress={() => setIconColor(color)} />
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSalvar}>
          <Text style={styles.submitText}>Salvar Vantagem</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 25, paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#BBB', marginBottom: 10, textTransform: 'uppercase' },
  previewCard: { flexDirection: 'row', padding: 15, backgroundColor: '#FAFAFA', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  iconArea: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  previewTitle: { fontWeight: 'bold', fontSize: 16 },
  previewDesc: { color: '#888', fontSize: 13 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  iconContainer: { height: 60, marginBottom: 10 },
  iconPicker: { width: 50, height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#FFF' },
  optionsRow: { flexDirection: 'row', gap: 10 },
  colorPicker: { width: 35, height: 35, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  selectedOption: { borderColor: '#D4AF37' },
  submitBtn: { backgroundColor: '#000', padding: 18, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: 'bold' }
});