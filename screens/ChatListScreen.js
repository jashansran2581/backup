import { getDocs, collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For using icons

const ChatListScreen = ({ navigation }) => {
  const [chatList, setChatList] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const currentUserEmail = auth.currentUser?.email;

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUserEmail),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChatList(chats);
    });

    return unsubscribe;
  }, []);

  const openChat = (chat) => {
    if (isSelectionMode) {
      toggleSelection(chat.id);
    } else {
      navigation.navigate('Messages', {
        chatId: chat.id,
        ownerEmail: chat.participants.find((email) => email !== currentUserEmail),
        listingName: chat.listingName,
      });
    }
  };

  const toggleSelection = (chatId) => {
    setSelectedChats((prevSelected) =>
      prevSelected.includes(chatId) ? prevSelected.filter((id) => id !== chatId) : [...prevSelected, chatId]
    );
  };

  const confirmDeletion = () => {
    Alert.alert(
      'Delete Chat(s)',
      'Are you sure you want to delete the selected chat(s)? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteSelectedChats },
      ]
    );
  };

  const deleteSelectedChats = async () => {
    const deletePromises = selectedChats.map(async (chatId) => {
      const chatMessagesRef = collection(db, 'messages', chatId, 'chat');
      const querySnapshot = await getDocs(chatMessagesRef);
      const deleteMessagesPromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      const chatDocRef = doc(db, 'messages', chatId);

      await Promise.all([...deleteMessagesPromises, deleteDoc(chatDocRef)]);
    });

    await Promise.all(deletePromises);
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prevMode) => !prevMode);
    setSelectedChats([]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatItem, selectedChats.includes(item.id) && styles.selectedChatItem]}
      onPress={() => openChat(item)}
    >
      <Text style={styles.chatName}>
        {item.participants.find((email) => email !== currentUserEmail)}
      </Text>
      <Text style={styles.chatPreview}>{item.message || 'No messages yet.'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={chatList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.footer}>
        {isSelectionMode ? (
          <View style={styles.selectionFooter}>
            <Text style={styles.selectionCount}>{selectedChats.length} Selected</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDeletion}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete Selected</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.selectButton} onPress={toggleSelectionMode}>
            <MaterialCommunityIcons name="checkbox-multiple-blank-outline" size={24} color="#fff" />
            <Text style={styles.selectButtonText}>Select Chats to Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedChatItem: {
    backgroundColor: '#FFEBEE',
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C6B2F',
  },
  chatPreview: {
    color: '#555',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  selectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  selectionCount: {
    fontSize: 16,
    color: '#D32F2F',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ChatListScreen;
