import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen({ route, navigation }: any) {
  const { pedidoId, receiverName } = route.params;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const setupChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMyId(user.id);

      // Busca mensagens antigas
      const { data } = await supabase
        .from('mensagens_chat')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    setupChat();

    // Realtime para novas mensagens
    const channel = supabase
      .channel(`chat_${pedidoId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensagens_chat', 
        filter: `pedido_id=eq.${pedidoId}` 
      }, (payload: { new: any; }) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pedidoId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !myId) return;

    const messageToSend = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('mensagens_chat').insert({
      pedido_id: pedidoId,
      sender_id: myId,
      texto: messageToSend,
    });

    if (error) console.error(error);
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === myId;
    return (
      <View style={[styles.msgWrapper, isMine ? styles.myMsg : styles.theirMsg]}>
        <Text style={[styles.msgText, isMine ? styles.myText : styles.theirText]}>{item.texto}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receiverName || 'Chat'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={[styles.inputContainer, { marginBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="#666"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  listContent: { padding: 20, paddingBottom: 10 },
  msgWrapper: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 10 },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#D4AF37', borderBottomRightRadius: 2 },
  theirMsg: { alignSelf: 'flex-start', backgroundColor: '#222', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 15 },
  myText: { color: '#1A1A1A', fontWeight: '500' },
  theirText: { color: '#FFF' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  input: { flex: 1, backgroundColor: '#1A1A1A', color: '#FFF', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { backgroundColor: '#D4AF37', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center' }
});