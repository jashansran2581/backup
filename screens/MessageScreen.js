import { 
  addDoc, 
  collection, 
  onSnapshot, 
  orderBy, 
  query, 
  Timestamp 
} from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import { 
  FlatList, 
  Pressable, 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Importing Ionicons
import { auth, db } from '../firebase';

const MessagesScreen = ({ route }) => {
  const { chatId } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const currentUserEmail = auth.currentUser?.email;
  const flatListRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages', chatId, 'chat'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (message.trim()) {
      await addDoc(collection(db, 'messages', chatId, 'chat'), {
        sender: currentUserEmail,
        message,
        createdAt: Timestamp.now(),
      });
      setMessage('');
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }) => (
    <View style={item.sender === currentUserEmail ? styles.userMessage : styles.ownerMessage}>
      <Text style={{ color: 'white' }}>{item.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#888"
        />
        <Pressable
          onPress={sendMessage}
          style={styles.sendButton}
          disabled={!message.trim()}  // Disable button if message is empty or just whitespace
        >
          <Ionicons name="send" size={24} color={message.trim() ? "#007AFF" : "#ccc"} />
        </Pressable>

      </View>
    </KeyboardAvoidingView>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    padding: 10,
    margin: 5,
    backgroundColor: 'green',
    borderRadius: 10,
  },
  ownerMessage: {
    alignSelf: 'flex-start',
    padding: 10,
    margin: 5,
    backgroundColor: '#A9A9A9',
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2, // Shadow for Android
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
});
