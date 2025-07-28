# Week 5: Streaming & Real-Time AI Applications
## From Request/Response to Reactive Systems

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Master Effect's Stream API** for processing infinite data streams
- **Build real-time AI chat analyzers** with live sentiment analysis and topic detection
- **Understand backpressure and flow control** in streaming systems
- **Implement WebSocket-based real-time dashboards** with streaming updates
- **Design reactive architectures** that handle high-throughput AI workloads

---

## 🔥 Opening Challenge: When Request/Response Isn't Enough (25 minutes)

### The Scenario
You've built a great AI assistant, but now you need to analyze chat messages in real-time across thousands of concurrent chat rooms. Users expect instant feedback on sentiment, toxicity detection, and trending topics. The traditional request/response model breaks down when you need to process continuous streams of data.

### Live Coding: The Batch Processing Bottleneck

```typescript
// chat-analyzer-batch.ts - The traditional approach
import { Effect, pipe } from 'effect';
import { AIAssistantService } from './previous-lessons';

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  timestamp: Date;
}

interface AnalysisResult {
  messageId: string;
  roomId: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  toxicity: number;
  topics: string[];
  processingTime: number;
}

interface DashboardData {
  totalMessages: number;
  sentimentDistribution: Record<string, number>;
  toxicityAlerts: number;
  trendingTopics: string[];
  activeRooms: number;
}

// Traditional batch processing approach
class ChatAnalyzerBatch {
  private messageQueue: ChatMessage[] = [];
  private batchSize = 50;
  private batchInterval = 5000; // 5 seconds
  private isProcessing = false;

  constructor(private aiService: AIAssistantService) {
    // Process batches every 5 seconds
    setInterval(() => this.processBatch(), this.batchInterval);
  }

  // Add message to queue
  addMessage(message: ChatMessage): void {
    this.messageQueue.push(message);
    console.log(`📨 Queued message ${message.id} (queue size: ${this.messageQueue.length})`);
  }

  // Process messages in batches
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.messageQueue.splice(0, this.batchSize);
    console.log(`🔄 Processing batch of ${batch.length} messages...`);

    const startTime = Date.now();

    try {
      // Sequential processing - SLOW!
      const results: AnalysisResult[] = [];
      
      for (const message of batch) {
        try {
          console.log(`  Analyzing message ${message.id}...`);
          
          // Simulate AI processing
          const sentiment = await this.analyzeSentiment(message.content);
          const toxicity = await this.detectToxicity(message.content);
          const topics = await this.extractTopics(message.content);

          results.push({
            messageId: message.id,
            roomId: message.roomId,
            sentiment,
            toxicity,
            topics,
            processingTime: Date.now() - startTime
          });

        } catch (error) {
          console.error(`❌ Failed to analyze message ${message.id}:`, error.message);
        }
      }

      // Update dashboard (also slow!)
      await this.updateDashboard(results);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Batch completed in ${totalTime}ms (${(totalTime / batch.length).toFixed(0)}ms per message)`);

    } catch (error) {
      console.error('❌ Batch processing failed:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    // Simulate AI call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    if (content.includes('love') || content.includes('great')) return 'positive';
    if (content.includes('hate') || content.includes('terrible')) return 'negative';
    return 'neutral';
  }

  private async detectToxicity(content: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 300));
    
    const toxicWords = ['spam', 'stupid', 'hate'];
    const toxicCount = toxicWords.filter(word => content.toLowerCase().includes(word)).length;
    return Math.min(toxicCount / toxicWords.length, 1.0);
  }

  private async extractTopics(content: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 250));
    
    const topics = ['technology', 'sports', 'politics', 'entertainment'];
    return topics.filter(() => Math.random() > 0.7);
  }

  private async updateDashboard(results: AnalysisResult[]): Promise<void> {
    console.log('📊 Updating dashboard with', results.length, 'results...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate dashboard update
    const dashboardData: DashboardData = {
      totalMessages: results.length,
      sentimentDistribution: {
        positive: results.filter(r => r.sentiment === 'positive').length,
        negative: results.filter(r => r.sentiment === 'negative').length,
        neutral: results.filter(r => r.sentiment === 'neutral').length
      },
      toxicityAlerts: results.filter(r => r.toxicity > 0.5).length,
      trendingTopics: results.flatMap(r => r.topics).slice(0, 5),
      activeRooms: new Set(results.map(r => r.roomId)).size
    };
    
    console.log('📊 Dashboard updated:', dashboardData);
  }

  // Simulate high message volume
  simulateHighVolume(): void {
    console.log('🚀 Simulating high message volume...');
    
    const rooms = ['room1', 'room2', 'room3', 'room4', 'room5'];
    const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
    const messages = [
      'Hello everyone!',
      'This is great!',
      'I love this feature',
      'This is terrible',
      'What do you think about the new update?',
      'Anyone want to discuss technology?',
      'The sports game was amazing',
      'Politics is so complicated these days'
    ];

    // Send 100 messages over 10 seconds (10 messages/second)
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        this.addMessage({
          id: `msg-${i}`,
          roomId: rooms[Math.floor(Math.random() * rooms.length)],
          userId: users[Math.floor(Math.random() * users.length)],
          content: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date()
        });
      }, i * 100); // One message every 100ms
    }
  }
}

// Demo the problems
async function demo() {
  const aiService = {} as AIAssistantService; // Mock
  const analyzer = new ChatAnalyzerBatch(aiService);
  
  console.log('📱 Starting chat analyzer demo...');
  analyzer.simulateHighVolume();
  
  // Let it run for 30 seconds
  setTimeout(() => {
    console.log('\n🔍 PROBLEMS OBSERVED:');
    console.log('- Messages queue up faster than we can process them');
    console.log('- 5-second batching means 5-second delays for users');
    console.log('- Sequential processing is slow');
    console.log('- No real-time feedback');
    console.log('- Memory usage grows with queue size');
    console.log('- Dashboard updates are also batched and delayed');
    console.log('- No backpressure handling');
  }, 30000);
}

demo();
```

### Discussion Questions (10 minutes)

**Ask the class:**
1. "What happens when messages arrive faster than we can process them?"
   - Queue grows indefinitely
   - Memory usage increases
   - Latency increases (messages wait longer)
   - Users don't get real-time feedback

2. "What if we have 1000 chat rooms with 100 messages/second each?"
   - 100,000 messages/second
   - Batch processing can't keep up
   - Users experience significant delays

3. "How would you solve these problems?"
   - Common answers: "More servers", "Bigger batches", "Faster processing"
   - "What about processing messages as they arrive?"

**The Setup:** "What if we could process infinite streams of messages in real-time, with automatic backpressure handling and resource management?"

---

## 🚀 Enter Effect Streams: Reactive AI Processing (65 minutes)

### Part 1: Understanding Streams (20 minutes)

```typescript
// chat-analyzer-streams.ts - The Effect Streams way
import { Effect, Stream, pipe, Duration, Schedule } from 'effect';
import { Data } from 'effect';

// Domain types (same as before)
interface ChatMessage {
  readonly id: string;
  readonly roomId: string;
  readonly userId: string;
  readonly content: string;
  readonly timestamp: Date;
}

interface AnalysisResult {
  readonly messageId: string;
  readonly roomId: string;
  readonly sentiment: 'positive' | 'negative' | 'neutral';
  readonly toxicity: number;
  readonly topics: ReadonlyArray<string>;
  readonly processingTime: number;
}

// Error types
class AnalysisError extends Data.TaggedError('AnalysisError')<{
  readonly messageId: string;
  readonly reason: string;
}> {}

// Key Concept: Streams are like Effects that produce multiple values over time
// Stream<A, E, R> = produces values of type A, can fail with E, needs R

// Creating streams
const messageStream: Stream.Stream<ChatMessage, never, never> = 
  Stream.async<ChatMessage>((emit) => {
    // This would connect to WebSocket, Kafka, etc.
    console.log('🔌 Connected to message stream');
    
    // Simulate messages arriving
    const interval = setInterval(() => {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        roomId: `room-${Math.floor(Math.random() * 5) + 1}`,
        userId: `user-${Math.floor(Math.random() * 10) + 1}`,
        content: generateRandomMessage(),
        timestamp: new Date()
      };
      
      emit(Effect.succeed(message));
    }, 100); // One message every 100ms
    
    // Cleanup function
    return Effect.sync(() => {
      clearInterval(interval);
      console.log('🔌 Disconnected from message stream');
    });
  });

function generateRandomMessage(): string {
  const messages = [
    'Hello everyone!', 'This is great!', 'I love this feature',
    'This is terrible', 'What do you think?', 'Amazing work!',
    'I hate this', 'Technology is evolving fast', 'Sports update!',
    'Political discussion here', 'Entertainment news', 'Great job team!'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Stream transformations
const basicStreamOperations = pipe(
  messageStream,
  
  // Map over each message
  Stream.map(message => ({
    ...message,
    contentLength: message.content.length
  })),
  
  // Filter messages
  Stream.filter(message => message.contentLength > 5),
  
  // Take only first 10 messages
  Stream.take(10),
  
  // Log each message
  Stream.tap(message => 
    Effect.sync(() => console.log(`📨 Processing: ${message.content}`))
  )
);

// Run the stream
const runBasicExample = pipe(
  basicStreamOperations,
  Stream.runCollect, // Collect all values into an array
  Effect.map(messages => console.log(`Processed ${messages.length} messages`))
);
```

**Key Insights:**
1. **Streams are lazy** - nothing happens until you run them
2. **Streams are composable** - you can chain transformations
3. **Streams handle resources** - automatic cleanup
4. **Streams are typed** - errors and requirements are explicit

### Part 2: AI Processing Pipeline with Streams (25 minutes)

```typescript
// AI Processing Services (using our service architecture from Week 4)
interface SentimentAnalyzer {
  readonly analyze: (content: string) => Effect.Effect<'positive' | 'negative' | 'neutral', AnalysisError>;
}

interface ToxicityDetector {
  readonly detect: (content: string) => Effect.Effect<number, AnalysisError>;
}

interface TopicExtractor {
  readonly extract: (content: string) => Effect.Effect<ReadonlyArray<string>, AnalysisError>;
}

const SentimentAnalyzer = Context.GenericTag<SentimentAnalyzer>('SentimentAnalyzer');
const ToxicityDetector = Context.GenericTag<ToxicityDetector>('ToxicityDetector');
const TopicExtractor = Context.GenericTag<TopicExtractor>('TopicExtractor');

// Mock implementations for demo
const MockSentimentAnalyzer = Layer.succeed(SentimentAnalyzer, {
  analyze: (content: string) =>
    pipe(
      Effect.sleep(Duration.millis(200 + Math.random() * 300)),
      Effect.map(() => {
        if (content.includes('love') || content.includes('great') || content.includes('amazing')) return 'positive';
        if (content.includes('hate') || content.includes('terrible')) return 'negative';
        return 'neutral';
      })
    )
});

const MockToxicityDetector = Layer.succeed(ToxicityDetector, {
  detect: (content: string) =>
    pipe(
      Effect.sleep(Duration.millis(150 + Math.random() * 200)),
      Effect.map(() => {
        const toxicWords = ['hate', 'stupid', 'terrible', 'spam'];
        const toxicCount = toxicWords.filter(word => content.toLowerCase().includes(word)).length;
        return Math.min(toxicCount / toxicWords.length, 1.0);
      })
    )
});

const MockTopicExtractor = Layer.succeed(TopicExtractor, {
  extract: (content: string) =>
    pipe(
      Effect.sleep(Duration.millis(100 + Math.random() * 150)),
      Effect.map(() => {
        const allTopics = ['technology', 'sports', 'politics', 'entertainment', 'general'];
        const keywords = content.toLowerCase();
        
        const topics: string[] = [];
        if (keywords.includes('tech') || keywords.includes('update')) topics.push('technology');
        if (keywords.includes('sport') || keywords.includes('game')) topics.push('sports');
        if (keywords.includes('politic')) topics.push('politics');
        if (keywords.includes('entertainment') || keywords.includes('news')) topics.push('entertainment');
        
        return topics.length > 0 ? topics : ['general'];
      })
    )
});

// The magic: AI processing pipeline with streams
const createAIProcessingPipeline = (
  messages: Stream.Stream<ChatMessage, never, never>
): Stream.Stream<AnalysisResult, AnalysisError, SentimentAnalyzer | ToxicityDetector | TopicExtractor> =>
  pipe(
    messages,
    
    // Batch messages for efficiency (but keep latency low)
    Stream.groupedWithin(5, Duration.seconds(1)), // Max 5 messages OR 1 second
    
    // Process each batch with concurrent AI analysis
    Stream.mapEffect(
      (batch) =>
        pipe(
          batch,
          Effect.forEach(
            (message) =>
              pipe(
                Effect.sync(() => Date.now()),
                Effect.flatMap(startTime =>
                  pipe(
                    // Run all AI operations in parallel for each message
                    Effect.all({
                      sentiment: SentimentAnalyzer.analyze(message.content),
                      toxicity: ToxicityDetector.detect(message.content),
                      topics: TopicExtractor.extract(message.content)
                    }, { concurrency: 3 }),
                    
                    Effect.map(analysis => ({
                      messageId: message.id,
                      roomId: message.roomId,
                      sentiment: analysis.sentiment,
                      toxicity: analysis.toxicity,
                      topics: analysis.topics,
                      processingTime: Date.now() - startTime
                    } as AnalysisResult)),
                    
                    Effect.mapError(error => 
                      new AnalysisError({ messageId: message.id, reason: String(error) })
                    )
                  )
                )
              ),
            { concurrency: 5 } // Process up to 5 messages concurrently
          )
        ),
      { concurrency: 2 } // Process up to 2 batches concurrently
    ),
    
    // Flatten batches back to individual results
    Stream.flatMap(results => Stream.fromIterable(results)),
    
    // Add logging
    Stream.tap(result => 
      Effect.sync(() => 
        console.log(`✅ Analyzed ${result.messageId}: ${result.sentiment} (${result.processingTime}ms)`)
      )
    )
  );

// Usage example
const runAIProcessingDemo = pipe(
  messageStream,
  createAIProcessingPipeline,
  Stream.take(20), // Process first 20 messages
  Stream.runCollect,
  Effect.provide(MockSentimentAnalyzer),
  Effect.provide(MockToxicityDetector),
  Effect.provide(MockTopicExtractor),
  Effect.tap(results => 
    Effect.sync(() => {
      console.log(`\n📊 PROCESSING SUMMARY:`);
      console.log(`Total messages processed: ${results.length}`);
      console.log(`Average processing time: ${(results.reduce((sum, r) => sum + r.processingTime, 0) / results.length).toFixed(0)}ms`);
      
      const sentimentCounts = results.reduce((acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`Sentiment distribution:`, sentimentCounts);
      
      const toxicMessages = results.filter(r => r.toxicity > 0.5).length;
      console.log(`Toxic messages detected: ${toxicMessages}`);
    })
  )
);
```

### Part 3: Real-Time Dashboard with WebSocket Streaming (20 minutes)

```typescript
// Real-time dashboard aggregation
interface DashboardUpdate {
  readonly timestamp: Date;
  readonly totalMessages: number;
  readonly messagesPerSecond: number;
  readonly sentimentDistribution: Record<string, number>;
  readonly toxicityAlerts: number;
  readonly trendingTopics: ReadonlyArray<string>;
  readonly activeRooms: number;
}

// Aggregation state
interface AggregationState {
  readonly windowStart: Date;
  readonly messageCount: number;
  readonly sentimentCounts: Record<string, number>;
  readonly toxicMessages: number;
  readonly topicCounts: Record<string, number>;
  readonly roomIds: Set<string>;
  readonly recentMessages: ReadonlyArray<AnalysisResult>;
}

const initialState: AggregationState = {
  windowStart: new Date(),
  messageCount: 0,
  sentimentCounts: { positive: 0, negative: 0, neutral: 0 },
  toxicMessages: 0,
  topicCounts: {},
  roomIds: new Set(),
  recentMessages: []
};

// Create dashboard stream with rolling window aggregation
const createDashboardStream = (
  analysisResults: Stream.Stream<AnalysisResult, AnalysisError, never>
): Stream.Stream<DashboardUpdate, never, never> =>
  pipe(
    analysisResults,
    
    // Handle errors gracefully (don't crash the dashboard)
    Stream.catchAll(error => {
      console.warn(`⚠️ Analysis error: ${error.reason}`);
      return Stream.empty; // Skip failed analyses
    }),
    
    // Maintain rolling window state
    Stream.scan(initialState, (state, result) => {
      const now = new Date();
      const windowDuration = 60000; // 1 minute window
      
      // Reset window if it's been too long
      const shouldResetWindow = now.getTime() - state.windowStart.getTime() > windowDuration;
      
      if (shouldResetWindow) {
        return {
          windowStart: now,
          messageCount: 1,
          sentimentCounts: { [result.sentiment]: 1, positive: 0, negative: 0, neutral: 0 },
          toxicMessages: result.toxicity > 0.5 ? 1 : 0,
          topicCounts: result.topics.reduce((acc, topic) => ({ ...acc, [topic]: 1 }), {}),
          roomIds: new Set([result.roomId]),
          recentMessages: [result]
        };
      }
      
      // Update existing window
      const newSentimentCounts = { ...state.sentimentCounts };
      newSentimentCounts[result.sentiment] = (newSentimentCounts[result.sentiment] || 0) + 1;
      
      const newTopicCounts = { ...state.topicCounts };
      result.topics.forEach(topic => {
        newTopicCounts[topic] = (newTopicCounts[topic] || 0) + 1;
      });
      
      const newRoomIds = new Set(state.roomIds);
      newRoomIds.add(result.roomId);
      
      const newRecentMessages = [...state.recentMessages, result].slice(-100); // Keep last 100
      
      return {
        windowStart: state.windowStart,
        messageCount: state.messageCount + 1,
        sentimentCounts: newSentimentCounts,
        toxicMessages: state.toxicMessages + (result.toxicity > 0.5 ? 1 : 0),
        topicCounts: newTopicCounts,
        roomIds: newRoomIds,
        recentMessages: newRecentMessages
      };
    }),
    
    // Convert state to dashboard updates
    Stream.map(state => {
      const now = new Date();
      const windowDurationSeconds = (now.getTime() - state.windowStart.getTime()) / 1000;
      const messagesPerSecond = windowDurationSeconds > 0 ? state.messageCount / windowDurationSeconds : 0;
      
      // Get trending topics (top 5)
      const trendingTopics = Object.entries(state.topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);
      
      return {
        timestamp: now,
        totalMessages: state.messageCount,
        messagesPerSecond: Math.round(messagesPerSecond * 100) / 100,
        sentimentDistribution: state.sentimentCounts,
        toxicityAlerts: state.toxicMessages,
        trendingTopics,
        activeRooms: state.roomIds.size
      } as DashboardUpdate;
    }),
    
    // Throttle updates to avoid overwhelming clients
    Stream.throttle(Duration.seconds(2)), // Max one update every 2 seconds
    
    // Add logging
    Stream.tap(update => 
      Effect.sync(() => {
        console.log(`\n📊 DASHBOARD UPDATE:`);
        console.log(`Messages/sec: ${update.messagesPerSecond}`);
        console.log(`Sentiment: +${update.sentimentDistribution.positive} -${update.sentimentDistribution.negative} ~${update.sentimentDistribution.neutral}`);
        console.log(`Toxicity alerts: ${update.toxicityAlerts}`);
        console.log(`Trending topics: ${update.trendingTopics.join(', ')}`);
        console.log(`Active rooms: ${update.activeRooms}`);
      })
    )
  );

// WebSocket integration (conceptual)
interface WebSocketService {
  readonly broadcast: (data: DashboardUpdate) => Effect.Effect<void, never>;
}

const WebSocketService = Context.GenericTag<WebSocketService>('WebSocketService');

const MockWebSocketService = Layer.succeed(WebSocketService, {
  broadcast: (data: DashboardUpdate) =>
    Effect.sync(() => {
      // In real implementation, this would send to connected WebSocket clients
      console.log(`📡 Broadcasting to WebSocket clients:`, {
        messagesPerSecond: data.messagesPerSecond,
        activeRooms: data.activeRooms
      });
    })
});

// Stream dashboard updates to WebSocket clients
const streamDashboardToClients = (
  dashboardUpdates: Stream.Stream<DashboardUpdate, never, never>
): Stream.Stream<void, never, WebSocketService> =>
  pipe(
    dashboardUpdates,
    Stream.mapEffect(update =>
      pipe(
        WebSocketService,
        Effect.flatMap(ws => ws.broadcast(update))
      )
    )
  );

// Complete real-time system
const runCompleteSystem = pipe(
  messageStream,
  createAIProcessingPipeline,
  createDashboardStream,
  streamDashboardToClients,
  Stream.take(50), // Run for 50 dashboard updates
  Stream.runDrain, // Run the stream without collecting results
  Effect.provide(MockSentimentAnalyzer),
  Effect.provide(MockToxicityDetector),
  Effect.provide(MockTopicExtractor),
  Effect.provide(MockWebSocketService)
);
```

**Key Insights:**
1. **Streams compose naturally** - AI processing → Dashboard aggregation → WebSocket broadcasting
2. **Backpressure is automatic** - if dashboard can't keep up, it throttles naturally
3. **Error handling is isolated** - one failed analysis doesn't crash the dashboard
4. **Resource management is built-in** - streams clean up automatically

---

## 🛠️ Hands-On Workshop: Build Your Real-Time Chat Analyzer (75 minutes)

### Setup (10 minutes)

```bash
mkdir realtime-chat-analyzer
cd realtime-chat-analyzer
npm init -y
npm install effect @effect/platform ws
npm install -D typescript @types/node @types/ws tsx
```

### Phase 1: Basic Stream Processing (25 minutes)

**Instructions:**
- Form pairs
- Create a message stream from WebSocket
- Apply basic transformations (map, filter)
- Process messages with AI sentiment analysis

**Starter Code (`src/message-stream.ts`):**
```typescript
import { Effect, Stream, pipe, Duration } from 'effect';
import { Data } from 'effect';

interface ChatMessage {
  readonly id: string;
  readonly roomId: string;
  readonly userId: string;
  readonly content: string;
  readonly timestamp: Date;
}

interface ProcessedMessage {
  readonly message: ChatMessage;
  readonly sentiment: 'positive' | 'negative' | 'neutral';
  readonly wordCount: number;
  readonly processingTime: number;
}

// TODO: Create a message stream
const createMessageStream = (): Stream.Stream<ChatMessage, never, never> =>
  Stream.async<ChatMessage>((emit) => {
    console.log('🔌 Starting message stream...');
    
    // TODO: Simulate messages arriving
    const interval = setInterval(() => {
      const messages = [
        'Hello everyone!',
        'This is amazing!',
        'I love this feature',
        'This is terrible',
        'What do you think about this?',
        'Great work team!',
        'I hate waiting',
        'Technology is evolving so fast'
      ];
      
      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        roomId: `room-${Math.floor(Math.random() * 3) + 1}`,
        userId: `user-${Math.floor(Math.random() * 5) + 1}`,
        content: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date()
      };
      
      emit(Effect.succeed(message));
    }, 500 + Math.random() * 1000); // Random interval between 0.5-1.5 seconds
    
    return Effect.sync(() => {
      clearInterval(interval);
      console.log('🔌 Message stream stopped');
    });
  });

// TODO: Implement sentiment analysis
const analyzeSentiment = (content: string): Effect.Effect<'positive' | 'negative' | 'neutral', never> =>
  pipe(
    Effect.sleep(Duration.millis(100 + Math.random() * 200)),
    Effect.map(() => {
      const positive = ['love', 'great', 'amazing', 'awesome', 'fantastic'];
      const negative = ['hate', 'terrible', 'awful', 'bad', 'horrible'];
      
      const lowerContent = content.toLowerCase();
      
      if (positive.some(word => lowerContent.includes(word))) return 'positive';
      if (negative.some(word => lowerContent.includes(word))) return 'negative';
      return 'neutral';
    })
  );

// TODO: Create processing pipeline
const createProcessingPipeline = (
  messages: Stream.Stream<ChatMessage, never, never>
): Stream.Stream<ProcessedMessage, never, never> =>
  pipe(
    messages,
    
    // Log incoming messages
    Stream.tap(message => 
      Effect.sync(() => console.log(`📨 Received: ${message.content}`))
    ),
    
    // Filter out empty messages
    Stream.filter(message => message.content.trim().length > 0),
    
    // Process each message
    Stream.mapEffect(message =>
      pipe(
        Effect.sync(() => Date.now()),
        Effect.flatMap(startTime =>
          pipe(
            analyzeSentiment(message.content),
            Effect.map(sentiment => ({
              message,
              sentiment,
              wordCount: message.content.split(' ').length,
              processingTime: Date.now() - startTime
            }))
          )
        )
      )
    ),
    
    // Log processed messages
    Stream.tap(processed => 
      Effect.sync(() => 
        console.log(`✅ Processed: ${processed.message.content} -> ${processed.sentiment} (${processed.processingTime}ms)`)
      )
    )
  );

// TODO: Test the pipeline
const testPipeline = pipe(
  createMessageStream(),
  createProcessingPipeline,
  Stream.take(10), // Process first 10 messages
  Stream.runCollect,
  Effect.tap(results => 
    Effect.sync(() => {
      console.log(`\n📊 RESULTS:`);
      console.log(`Total processed: ${results.length}`);
      
      const sentimentCounts = results.reduce((acc, r) => {
        acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`Sentiment distribution:`, sentimentCounts);
      console.log(`Average processing time: ${(results.reduce((sum, r) => sum + r.processingTime, 0) / results.length).toFixed(0)}ms`);
    })
  )
);

Effect.runPromise(testPipeline);
```

### Phase 2: Batching and Parallel Processing (25 minutes)

**Instructions:**
- Batch messages for efficient AI processing
- Process batches in parallel
- Handle partial failures (some messages in batch fail)

**Starter Code (`src/batch-processing.ts`):**
```typescript
import { Effect, Stream, pipe, Duration } from 'effect';

// TODO: Add toxicity detection
const detectToxicity = (content: string): Effect.Effect<number, never> =>
  pipe(
    Effect.sleep(Duration.millis(80 + Math.random() * 120)),
    Effect.map(() => {
      const toxicWords = ['hate', 'stupid', 'spam', 'terrible', 'awful'];
      const words = content.toLowerCase().split(' ');
      const toxicCount = toxicWords.filter(toxicWord => 
        words.some(word => word.includes(toxicWord))
      ).length;
      
      return Math.min(toxicCount / 3, 1.0); // Normalize to 0-1
    })
  );

// TODO: Add topic extraction
const extractTopics = (content: string): Effect.Effect<ReadonlyArray<string>, never> =>
  pipe(
    Effect.sleep(Duration.millis(60 + Math.random() * 90)),
    Effect.map(() => {
      const topicKeywords = {
        technology: ['tech', 'software', 'computer', 'app', 'digital'],
        sports: ['game', 'team', 'play', 'match', 'sport'],
        entertainment: ['movie', 'music', 'show', 'fun', 'entertainment'],
        general: []
      };
      
      const lowerContent = content.toLowerCase();
      const detectedTopics: string[] = [];
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => lowerContent.includes(keyword))) {
          detectedTopics.push(topic);
        }
      });
      
      return detectedTopics.length > 0 ? detectedTopics : ['general'];
    })
  );

interface EnhancedAnalysis {
  readonly messageId: string;
  readonly sentiment: 'positive' | 'negative' | 'neutral';
  readonly toxicity: number;
  readonly topics: ReadonlyArray<string>;
  readonly processingTime: number;
}

// TODO: Create batched processing pipeline
const createBatchedPipeline = (
  messages: Stream.Stream<ChatMessage, never, never>
): Stream.Stream<EnhancedAnalysis, never, never> =>
  pipe(
    messages,
    
    // Batch messages for efficiency
    Stream.groupedWithin(3, Duration.seconds(2)), // Max 3 messages OR 2 seconds
    
    // Process each batch
    Stream.mapEffect(batch =>
      pipe(
        Effect.sync(() => console.log(`🔄 Processing batch of ${batch.length} messages`)),
        Effect.flatMap(() =>
          pipe(
            batch,
            Effect.forEach(message =>
              pipe(
                Effect.sync(() => Date.now()),
                Effect.flatMap(startTime =>
                  pipe(
                    // Run all AI operations in parallel
                    Effect.all({
                      sentiment: analyzeSentiment(message.content),
                      toxicity: detectToxicity(message.content),
                      topics: extractTopics(message.content)
                    }, { concurrency: 3 }),
                    
                    Effect.map(analysis => ({
                      messageId: message.id,
                      sentiment: analysis.sentiment,
                      toxicity: analysis.toxicity,
                      topics: analysis.topics,
                      processingTime: Date.now() - startTime
                    })),
                    
                    // Handle individual message failures
                    Effect.catchAll(error => {
                      console.warn(`⚠️ Failed to analyze message ${message.id}:`, error);
                      return Effect.succeed({
                        messageId: message.id,
                        sentiment: 'neutral' as const,
                        toxicity: 0,
                        topics: ['general'],
                        processingTime: 0
                      });
                    })
                  )
                )
              ),
              { concurrency: 2 } // Process 2 messages in parallel within batch
            )
          )
        )
      )
    ),
    
    // Flatten batches back to individual results
    Stream.flatMap(results => Stream.fromIterable(results)),
    
    // Log results
    Stream.tap(result => 
      Effect.sync(() => 
        console.log(`✅ Analysis complete: ${result.messageId} - ${result.sentiment}, toxicity: ${result.toxicity.toFixed(2)}, topics: ${result.topics.join(', ')}`)
      )
    )
  );

// TODO: Test batched processing
const testBatchedProcessing = pipe(
  createMessageStream(),
  createBatchedPipeline,
  Stream.take(15), // Process 15 messages
  Stream.runCollect,
  Effect.tap(results => 
    Effect.sync(() => {
      console.log(`\n📊 BATCHED PROCESSING RESULTS:`);
      console.log(`Total analyzed: ${results.length}`);
      
      const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      console.log(`Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
      
      const toxicMessages = results.filter(r => r.toxicity > 0.3).length;
      console.log(`Messages with toxicity > 0.3: ${toxicMessages}`);
      
      const topicCounts = results.reduce((acc, r) => {
        r.topics.forEach(topic => {
          acc[topic] = (acc[topic] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`Topic distribution:`, topicCounts);
    })
  )
);

Effect.runPromise(testBatchedProcessing);
```

### Phase 3: Real-Time Dashboard (25 minutes)

**Instructions:**
- Aggregate analysis results into dashboard data
- Maintain rolling windows (last 5 minutes, last hour)
- Stream updates to connected clients

**Starter Code (`src/dashboard.ts`):**
```typescript
import { Effect, Stream, pipe, Duration, Ref } from 'effect';

interface DashboardMetrics {
  readonly timestamp: Date;
  readonly totalMessages: number;
  readonly messagesPerMinute: number;
  readonly sentimentBreakdown: Record<string, number>;
  readonly averageToxicity: number;
  readonly topTopics: ReadonlyArray<{ topic: string; count: number }>;
  readonly alertCount: number;
}

interface RollingWindow {
  readonly startTime: Date;
  readonly messages: ReadonlyArray<EnhancedAnalysis>;
  readonly windowDurationMs: number;
}

// TODO: Create dashboard aggregation
const createDashboardStream = (
  analysisResults: Stream.Stream<EnhancedAnalysis, never, never>
): Stream.Stream<DashboardMetrics, never, never> =>
  pipe(
    analysisResults,
    
    // Maintain rolling window state
    Stream.scan(
      {
        startTime: new Date(),
        messages: [],
        windowDurationMs: 5 * 60 * 1000 // 5 minutes
      } as RollingWindow,
      (window, newResult) => {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - window.windowDurationMs);
        
        // Add new message and remove old ones
        const updatedMessages = [...window.messages, newResult]
          .filter(msg => new Date(msg.processingTime) > cutoffTime);
        
        return {
          startTime: window.startTime,
          messages: updatedMessages,
          windowDurationMs: window.windowDurationMs
        };
      }
    ),
    
    // Convert window to dashboard metrics
    Stream.map(window => {
      const now = new Date();
      const windowDurationMinutes = window.windowDurationMs / (60 * 1000);
      const messagesPerMinute = window.messages.length / windowDurationMinutes;
      
      // Sentiment breakdown
      const sentimentBreakdown = window.messages.reduce((acc, msg) => {
        acc[msg.sentiment] = (acc[msg.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Average toxicity
      const averageToxicity = window.messages.length > 0
        ? window.messages.reduce((sum, msg) => sum + msg.toxicity, 0) / window.messages.length
        : 0;
      
      // Top topics
      const topicCounts = window.messages.reduce((acc, msg) => {
        msg.topics.forEach(topic => {
          acc[topic] = (acc[topic] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      
      const topTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Alert count (high toxicity messages)
      const alertCount = window.messages.filter(msg => msg.toxicity > 0.5).length;
      
      return {
        timestamp: now,
        totalMessages: window.messages.length,
        messagesPerMinute: Math.round(messagesPerMinute * 100) / 100,
        sentimentBreakdown,
        averageToxicity: Math.round(averageToxicity * 1000) / 1000,
        topTopics,
        alertCount
      };
    }),
    
    // Only emit updates when metrics change significantly
    Stream.changes,
    
    // Throttle updates
    Stream.throttle(Duration.seconds(3)),
    
    // Log dashboard updates
    Stream.tap(metrics => 
      Effect.sync(() => {
        console.log(`\n📊 DASHBOARD UPDATE (${metrics.timestamp.toLocaleTimeString()}):`);
        console.log(`📈 Messages/min: ${metrics.messagesPerMinute}`);
        console.log(`😊 Sentiment: +${metrics.sentimentBreakdown.positive || 0} -${metrics.sentimentBreakdown.negative || 0} ~${metrics.sentimentBreakdown.neutral || 0}`);
        console.log(`⚠️ Avg toxicity: ${metrics.averageToxicity.toFixed(3)}`);
        console.log(`🚨 Alerts: ${metrics.alertCount}`);
        console.log(`🏷️ Top topics: ${metrics.topTopics.map(t => `${t.topic}(${t.count})`).join(', ')}`);
      })
    )
  );

// TODO: Simulate WebSocket broadcasting
const broadcastToClients = (
  dashboardUpdates: Stream.Stream<DashboardMetrics, never, never>
): Stream.Stream<void, never, never> =>
  pipe(
    dashboardUpdates,
    Stream.mapEffect(metrics =>
      Effect.sync(() => {
        // In real implementation, this would broadcast to WebSocket clients
        console.log(`📡 Broadcasting dashboard update to ${Math.floor(Math.random() * 50) + 10} connected clients`);
      })
    )
  );

// TODO: Complete real-time system
const runRealTimeSystem = pipe(
  createMessageStream(),
  createBatchedPipeline,
  createDashboardStream,
  broadcastToClients,
  Stream.take(20), // Run for 20 dashboard updates
  Stream.runDrain
);

Effect.runPromise(runRealTimeSystem);
```

### Workshop Debrief (10 minutes)

**Questions to ask:**
- "How did streaming change your approach to real-time processing?"
- "What was different about handling backpressure with streams?"
- "How would you scale this to handle millions of messages?"
- "What challenges did you encounter with error handling in streams?"

---

## 🎯 Advanced Streaming Patterns (15 minutes)

### Merging Multiple Streams
```typescript
// Combine streams from different sources
const chatStream = Stream.fromAsyncIterable(chatWebSocket);
const notificationStream = Stream.fromAsyncIterable(notificationWebSocket);
const systemStream = Stream.fromAsyncIterable(systemEvents);

const combinedStream = Stream.merge(
  Stream.merge(chatStream, notificationStream),
  systemStream
);
```

### Stream Partitioning
```typescript
// Split stream based on criteria
const [urgentMessages, normalMessages] = pipe(
  messageStream,
  Stream.partition(message => message.content.includes('URGENT'))
);

// Process urgent messages with higher priority
const processUrgentMessages = pipe(
  urgentMessages,
  Stream.mapEffect(processWithHighPriority, { concurrency: 10 })
);

const processNormalMessages = pipe(
  normalMessages,
  Stream.mapEffect(processNormally, { concurrency: 5 })
);
```

### Stream Buffering and Windowing
```typescript
// Time-based windows
const hourlyAnalytics = pipe(
  analysisStream,
  Stream.groupedWithin(1000, Duration.hours(1)),
  Stream.map(generateHourlyReport)
);

// Sliding windows
const trendingTopics = pipe(
  analysisStream,
  Stream.sliding(100), // Last 100 messages
  Stream.map(calculateTrendingTopics),
  Stream.changes, // Only emit when trends change
  Stream.throttle(Duration.minutes(5))
);
```

### Error Recovery in Streams
```typescript
// Resilient stream processing
const resilientProcessing = pipe(
  messageStream,
  Stream.mapEffect(processMessage),
  Stream.catchAll(error => {
    console.warn('Stream error, switching to fallback:', error);
    return fallbackMessageStream;
  }),
  Stream.retry(Schedule.exponential(Duration.seconds(1)))
);
```

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Streaming Paradigm Shift**
- **From batch to stream** - process data as it arrives, not in chunks
- **Reactive systems** - respond to events in real-time
- **Backpressure handling** - system adapts to processing capacity automatically

**2. Stream Composition**
- **Streams are composable** - chain transformations naturally
- **Error handling is isolated** - failures don't crash the entire stream
- **Resource management** - automatic cleanup and lifecycle management

**3. Real-Time AI Processing**
- **Concurrent AI operations** - sentiment, toxicity, topics in parallel
- **Batching for efficiency** - balance latency vs throughput
- **Rolling window aggregations** - maintain real-time metrics

**4. Production Considerations**
- **Throttling and rate limiting** - prevent overwhelming downstream systems
- **Monitoring and observability** - track stream health and performance
- **Graceful degradation** - fallback strategies when services fail

### Connection to Previous Weeks
"Notice how our service architecture from week 4 makes this streaming system modular? Our error handling from week 2 works seamlessly with streams. And our concurrency patterns from week 3 are essential for parallel stream processing."

### Bridge to Week 6
"This streaming system works great for one chat room, but what about 1000 chat rooms? What about different AI models for different use cases? Next week we'll learn about advanced Effect patterns for building production-scale systems that can handle complex requirements and evolving needs."

### Homework Assignment

**Add real-time transcription to your chat analyzer:**
1. **Audio stream processing** - Handle WebRTC audio streams
2. **Speech-to-text integration** - Real-time transcription with Whisper API
3. **Multi-language support** - Detect and handle different languages
4. **Partial results streaming** - Show transcription as it happens

**Bonus challenges:**
- Add real-time translation between languages
- Implement voice activity detection
- Add speaker identification and diarization
- Create audio quality metrics and alerts

---

## 🎓 Assessment Rubric

### Technical Skills Assessment
- [ ] **Proper use of Stream API** - creating, transforming, and composing streams
- [ ] **Understanding of backpressure** and flow control mechanisms
- [ ] **Efficient batching strategies** - balancing latency vs throughput
- [ ] **Resource management** in streaming contexts

### System Design Assessment
- [ ] Can identify when to use streaming vs batch processing
- [ ] Understands trade-offs between latency and throughput
- [ ] Can design systems that handle varying load gracefully
- [ ] Knows how to monitor and debug streaming applications

### Performance Awareness Assessment
- [ ] Recognizes bottlenecks in streaming pipelines
- [ ] Understands memory implications of buffering and windowing
- [ ] Can optimize for different workload patterns
- [ ] Knows when to apply backpressure vs scaling horizontally

### Red Flags to Watch For
- Blocking operations in stream processing (breaks the reactive model)
- Unbounded buffers leading to memory leaks
- Not handling backpressure appropriately
- Overcomplicating simple streaming scenarios
- Ignoring error isolation in stream pipelines

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Streams](https://effect.website/docs/streams)
- [Reactive Streams Specification](https://www.reactive-streams.org/)
- [Backpressure Explained](https://medium.com/@jayphelps/backpressure-explained-the-flow-of-data-through-software-2350b3e77ce7)

### Code Examples
- [Complete Real-Time Chat Analyzer](./examples/realtime-chat-analyzer/)
- [Stream Processing Patterns](./examples/stream-patterns/)
- [WebSocket Integration](./examples/websocket-streaming/)

### Next Week Prep
- Think about how to make streaming systems production-ready
- Consider: How do you manage complex AI model orchestration?
- Read about advanced patterns like circuit breakers and bulkheads

---

*"Streaming is not just about performance - it's about building systems that react to the world as it happens, not as it was."*