import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. Variedade expandida de ícones
const TODOS_ICONS = [
  'beer', 'football', 'trophy', 'shirt', 'wine', 'pizza', 'star', 'heart', 'gift', 
  'wallet', 'cash', 'card', 'calendar', 'megaphone', 'notifications', 'people', 
  'ticket', 'rocket', 'flame', 'diamond', 'hammer', 'build', 'construct', 'flask', 
  'glasses', 'ice-cream', 'leaf', 'musical-notes', 'paw', 'pint', 'pricetags', 
  'ribbon', 'sunny', 'tennisball', 'umbrella', 'videocam', 'watch', 'wifi',
  'airplane', 'alarm', 'aperture', 'archive', 'at', 'barcode', 'basket', 
  'battery-charging', 'beaker', 'bicycle', 'boat', 'book', 'briefcase', 'brush', 
  'shield', 'skull', 'snow', 'speedometer', 'stopwatch', 'tablet-portrait', 
  'terminal', 'thermometer', 'thumbs-up', 'thunderstorm', 'trash', 'tv', 
  'volume-high', 'water', 'analytics', 'bar-chart', 'pie-chart'
];

const COLOR_OPTIONS = ['#D4AF37', '#000000', '#F87171', '#4ADE80', '#60A5FA'];

export default function SugerirBeneficioScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [searchText, setSearchText] = useState(''); // Estado da busca
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [bgColor, setBgColor] = useState('#000000');
  const [iconColor, setIconColor] = useState('#D4AF37');

  // 2. Lógica de busca em tempo real
  const filteredIcons = TODOS_ICONS.filter(icon => 
    icon.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sugerir Vantagem</Text>
      </View>

      <View style={styles.content}>
        {/* PRÉVIA DO CARD */}
        <Text style={styles.sectionTitle}>Prévia do Card</Text>
        <View style={styles.previewCard}>
          <View style={[styles.iconArea, { backgroundColor: bgColor }]}>
            <Ionicons name={selectedIcon as any} size={24} color={iconColor} />
          </View>
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.previewTitle}>{titulo || 'Título da Vantagem'}</Text>
            <Text style={styles.previewDesc}>{descricao || 'Descrição da ideia...'}</Text>
          </View>
        </View>

        <TextInput 
          style={styles.input} 
          placeholder="Título da Vantagem" 
          value={titulo} 
          onChangeText={setTitulo} 
        />
        <TextInput 
          style={[styles.input, { height: 80 }]} 
          placeholder="Descrição" 
          value={descricao} 
          onChangeText={setDescricao} 
          multiline 
        />

        {/* 3. BARRA DE PESQUISA DE ÍCONES */}
        <Text style={styles.label}>Escolha o Ícone</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Pesquisar ícone..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 4. SCROLL HORIZONTAL DE ÍCONES */}
        <View style={styles.iconSelectionContainer}>
          <FlatList
            data={filteredIcons}
            keyExtractor={(item) => item}
            horizontal // ✅ Habilita o scroll horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.iconPicker, selectedIcon === item && styles.selectedOption]} 
                onPress={() => setSelectedIcon(item)}
              >
                <Ionicons 
                  name={item as any} 
                  size={24} 
                  color={selectedIcon === item ? '#D4AF37' : '#000'} 
                />
              </TouchableOpacity>
            )}
          />
        </View>

        {/* SELETORES DE CORES */}
        <Text style={styles.label}>Cor de Fundo do Ícone</Text>
        <View style={styles.optionsRow}>
          {COLOR_OPTIONS.map(color => (
            <TouchableOpacity 
              key={color} 
              style={[styles.colorPicker, { backgroundColor: color }, bgColor === color && styles.selectedOption]} 
              onPress={() => setBgColor(color)} 
            />
          ))}
        </View>

        <Text style={styles.label}>Cor do Ícone</Text>
        <View style={styles.optionsRow}>
          {COLOR_OPTIONS.map(color => (
            <TouchableOpacity 
              key={color} 
              style={[styles.colorPicker, { backgroundColor: color }, iconColor === color && styles.selectedOption]} 
              onPress={() => setIconColor(color)} 
            />
          ))}
        </View>

        <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={async () => {
                if (!titulo) return; // Proteção simples

                try {
                // Aqui entrará a lógica de insert do Supabase que faremos a seguir
                // Por enquanto, apenas o comando de saída direta:
                
                navigation.goBack(); 
                
                } catch (error) {
                console.error("Erro ao salvar:", error);
                }
            }}
            >
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
  sectionTitle: { fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  previewCard: { flexDirection: 'row', padding: 20, backgroundColor: '#F9F9F9', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
  iconArea: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  previewTitle: { fontWeight: 'bold', fontSize: 16 },
  previewDesc: { color: '#666', fontSize: 13 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 14 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  iconSelectionContainer: { height: 70, marginBottom: 20 },
  iconPicker: { width: 55, height: 55, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: '#FFF' },
  optionsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  colorPicker: { width: 35, height: 35, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  selectedOption: { borderColor: '#D4AF37', borderWidth: 2 },
  submitBtn: { backgroundColor: '#000', padding: 18, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});