import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image, Keyboard } from 'react-native';
import { Icon } from 'react-native-elements';


interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
}


export default function ChatbotUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');


  const sendMessage = async () => {
    if (inputText.trim()) {
      const newMessage: Message = { id: Date.now().toString(), text: inputText, sender: 'user' };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInputText('');


      try {
        const response = await fetch('http://192.168.0.75:5000/api/question', {  // Replace with your machine IP
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: inputText }),
        });


        const data = await response.json();
        const botMessage: Message = { id: Date.now().toString(), text: data.reply, sender: 'bot' };


        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };


  const handleKeyPress = ({ nativeEvent: { key: keyValue } }: any) => {
    if (keyValue === 'Enter') {
      sendMessage();
      Keyboard.dismiss(); // Hides the keyboard after pressing Enter
    }
  };


  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      {/* Header section */}
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: 'https://holoware.co/wp-content/uploads/2024/06/Fav-icon-260-x-260.png' }} style={styles.logo} />
        </View>
        <Text style={styles.headerText}>Holoware</Text>
      </View>


      {/* Chat section */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
      />


      {/* Input section */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your question here"
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}  // Handles sending message on Enter key press
          returnKeyType="send"           // Changes the keyboard return key to "Send"
          blurOnSubmit={false}           // Keeps the text input focused after submitting
        />
        <TouchableOpacity onPress={sendMessage}>
          <Icon name="send" type="feather" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    backgroundColor: '#2a93e7',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  logoContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logo: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatContainer: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 20,
    maxWidth: '80%',
  },
  botMessage: {
    backgroundColor: '#e0f7fa',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#d1c4e9',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 30,
    marginRight: 10,
  },
});




