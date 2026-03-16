import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function ConversationBubble({ message }) {
  const isSign = message.type === 'sign';
  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.bubbleRow, isSign ? styles.bubbleRowEnd : styles.bubbleRowStart]}>
      <View style={[styles.bubble, isSign ? styles.bubbleSign : styles.bubbleSpeech]}>
        <Text style={styles.bubbleText}>{message.text}</Text>
        <Text style={styles.bubbleTime}>{timeString}</Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={40} color="#a1a1aa" />
      <Text style={styles.emptyTitle}>Start signing or speaking</Text>
      <Text style={styles.emptySubtitle}>Messages will appear here</Text>
    </View>
  );
}

export default function ConversationThread({ messages, onClear }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversation</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>

      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={({ item }) => <ConversationBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f0d1a',
  },
  clearButton: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubbleRow: {
    marginBottom: 8,
    maxWidth: '75%',
  },
  bubbleRowEnd: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleRowStart: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleSign: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  bubbleSpeech: {
    backgroundColor: 'rgba(113,113,122,0.12)',
  },
  bubbleText: {
    fontSize: 15,
    color: '#0f0d1a',
  },
  bubbleTime: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3f3f46',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
});
