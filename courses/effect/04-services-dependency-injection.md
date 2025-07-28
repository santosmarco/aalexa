# Week 4: Services & Dependency Injection for AI Systems
## Building Modular, Testable Architecture

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Master Effect's service architecture** using `Context` and `Layer` patterns
- **Design clean service interfaces** that separate what from how
- **Build testable AI systems** with dependency injection and mocking
- **Create multi-modal AI assistants** with swappable service implementations
- **Understand configuration management** and environment-specific deployments

---

## 🔥 Opening Problem: The Hardcoded Nightmare (20 minutes)

### The Scenario
You've built an amazing AI assistant that can process text, voice, and images. But there's a problem: everything is hardcoded. Different environments need different models, testing is expensive because you call real APIs, and adding new AI providers requires changing core business logic.

### Live Coding: The Tightly Coupled AI Assistant

```typescript
// ai-assistant-hardcoded.ts - The nightmare we need to fix
import OpenAI from 'openai';
import axios from 'axios';

interface TextResponse {
  content: string;
  model: string;
  usage: { tokens: number };
}

interface VoiceResponse {
  transcription: string;
  language: string;
  confidence: number;
}

interface VisionResponse {
  description: string;
  objects: string[];
  text: string;
}

// Everything is hardcoded! 😱
class AIAssistant {
  private openai: OpenAI;
  private huggingFaceKey: string;

  constructor() {
    // Hardcoded API keys and configuration
    this.openai = new OpenAI({
      apiKey: "sk-hardcoded-key-here", // 🚨 Security issue!
    });
    this.huggingFaceKey = "hf_hardcoded-key-here"; // 🚨 Another security issue!
  }

  // Text processing - hardcoded to GPT-4
  async processText(input: string): Promise<TextResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4", // 🚨 Hardcoded model!
        messages: [{ role: "user", content: input }],
        max_tokens: 1000, // 🚨 Hardcoded limits!
        temperature: 0.7, // 🚨 Hardcoded parameters!
      });

      return {
        content: response.choices[0]?.message?.content || "",
        model: "gpt-4",
        usage: { tokens: response.usage?.total_tokens || 0 }
      };
    } catch (error: any) {
      if (error.status === 429) {
        // 🚨 Hardcoded fallback logic!
        console.log("OpenAI rate limited, trying GPT-3.5...");
        const fallbackResponse = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo", // 🚨 Another hardcoded model!
          messages: [{ role: "user", content: input }],
        });
        
        return {
          content: fallbackResponse.choices[0]?.message?.content || "",
          model: "gpt-3.5-turbo",
          usage: { tokens: fallbackResponse.usage?.total_tokens || 0 }
        };
      }
      throw new Error(`Text processing failed: ${error.message}`);
    }
  }

  // Voice processing - hardcoded to OpenAI Whisper
  async processVoice(audioBuffer: Buffer): Promise<VoiceResponse> {
    try {
      // 🚨 Hardcoded to OpenAI only!
      const response = await this.openai.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.wav"),
        model: "whisper-1", // 🚨 Hardcoded model!
        language: "en", // 🚨 Hardcoded language!
      });

      return {
        transcription: response.text,
        language: "en",
        confidence: 0.95 // 🚨 Fake confidence score!
      };
    } catch (error: any) {
      // 🚨 No fallback for voice processing!
      throw new Error(`Voice processing failed: ${error.message}`);
    }
  }

  // Vision processing - hardcoded to GPT-4 Vision
  async processImage(imageBuffer: Buffer): Promise<VisionResponse> {
    try {
      // 🚨 Hardcoded to GPT-4V only!
      const base64Image = imageBuffer.toString('base64');
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview", // 🚨 Hardcoded model!
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image and list any objects and text you see." // 🚨 Hardcoded prompt!
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Image}` }
              }
            ]
          }
        ],
        max_tokens: 500 // 🚨 Hardcoded limit!
      });

      const content = response.choices[0]?.message?.content || "";
      
      // 🚨 Hardcoded parsing logic!
      const objects = content.match(/objects?:?\s*([^\n]+)/i)?.[1]?.split(',').map(s => s.trim()) || [];
      const text = content.match(/text:?\s*([^\n]+)/i)?.[1] || "";

      return {
        description: content,
        objects,
        text
      };
    } catch (error: any) {
      if (error.status === 429) {
        // 🚨 Hardcoded fallback to Hugging Face!
        try {
          const response = await axios.post(
            'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
            imageBuffer,
            {
              headers: {
                'Authorization': `Bearer ${this.huggingFaceKey}`,
                'Content-Type': 'image/jpeg'
              }
            }
          );
          
          return {
            description: response.data[0]?.generated_text || "No description available",
            objects: [], // 🚨 Hugging Face doesn't provide objects!
            text: "" // 🚨 No text extraction!
          };
        } catch (hfError) {
          throw new Error(`Both vision services failed: ${error.message}, ${hfError.message}`);
        }
      }
      throw new Error(`Vision processing failed: ${error.message}`);
    }
  }

  // Multi-modal processing
  async processMultiModal(
    text?: string,
    audio?: Buffer,
    image?: Buffer
  ): Promise<{
    text?: TextResponse;
    voice?: VoiceResponse;
    vision?: VisionResponse;
  }> {
    const results: any = {};

    // 🚨 Sequential processing - no concurrency!
    if (text) {
      results.text = await this.processText(text);
    }
    if (audio) {
      results.voice = await this.processVoice(audio);
    }
    if (image) {
      results.vision = await this.processImage(image);
    }

    return results;
  }
}

// Usage - tightly coupled to implementation
async function demo() {
  const assistant = new AIAssistant(); // 🚨 No way to configure!
  
  try {
    const result = await assistant.processText("Hello, how are you?");
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// How do you test this? 🤷‍♂️
// How do you use different models in dev vs prod? 🤷‍♂️
// How do you add new AI providers? 🤷‍♂️
// How do you mock the AI calls for testing? 🤷‍♂️
```

### Discussion Questions (10 minutes)

**Ask the class:**
1. "What problems do you see with this code?"
   - **Hardcoded dependencies**: Can't swap out AI providers
   - **Security issues**: API keys in source code
   - **No configuration**: Same behavior in all environments
   - **Untestable**: Calls real APIs in tests
   - **Tightly coupled**: Business logic mixed with service details
   - **No concurrency**: Sequential processing only
   - **Inflexible**: Adding new providers requires changing core logic

2. "How would you test this code?"
   - "You can't easily - you'd have to call real APIs"
   - "Expensive, slow, and unreliable tests"

3. "How would you use different models in dev vs production?"
   - "You'd have to change the code and redeploy"
   - "No way to A/B test different models"

**The Setup:** "What if we could design our application as a graph of services, where Effect handles all the wiring for us?"

---

## 🚀 Enter Effect: Services & Dependency Injection (60 minutes)

### Part 1: Service Definition - What vs How (20 minutes)

```typescript
// ai-assistant-effect.ts - The Effect way
import { Effect, pipe, Context, Layer, Duration } from 'effect';
import { Data } from 'effect';

// First, define our domain types
interface TextResponse {
  readonly content: string;
  readonly model: string;
  readonly usage: { readonly tokens: number };
}

interface VoiceResponse {
  readonly transcription: string;
  readonly language: string;
  readonly confidence: number;
}

interface VisionResponse {
  readonly description: string;
  readonly objects: ReadonlyArray<string>;
  readonly text: string;
}

// Error types (from our previous lessons)
class AIServiceError extends Data.TaggedError('AIServiceError')<{
  readonly service: string;
  readonly operation: string;
  readonly reason: string;
}> {}

class ConfigurationError extends Data.TaggedError('ConfigurationError')<{
  readonly setting: string;
  readonly reason: string;
}> {}

type AIError = AIServiceError | ConfigurationError;

// NOW THE MAGIC: Define service interfaces (WHAT we need, not HOW)
interface TextProcessor {
  readonly process: (input: string) => Effect.Effect<TextResponse, AIError>;
}

interface VoiceProcessor {
  readonly transcribe: (audio: Buffer) => Effect.Effect<VoiceResponse, AIError>;
  readonly synthesize: (text: string) => Effect.Effect<Buffer, AIError>;
}

interface VisionProcessor {
  readonly analyze: (image: Buffer) => Effect.Effect<VisionResponse, AIError>;
  readonly describe: (image: Buffer) => Effect.Effect<string, AIError>;
}

// Create service tags for dependency injection
const TextProcessor = Context.GenericTag<TextProcessor>('TextProcessor');
const VoiceProcessor = Context.GenericTag<VoiceProcessor>('VoiceProcessor');
const VisionProcessor = Context.GenericTag<VisionProcessor>('VisionProcessor');

// Configuration interface
interface AIConfig {
  readonly textModel: string;
  readonly voiceModel: string;
  readonly visionModel: string;
  readonly apiTimeout: Duration.Duration;
  readonly maxRetries: number;
  readonly fallbackEnabled: boolean;
}

const AIConfig = Context.GenericTag<AIConfig>('AIConfig');
```

**Key Insight:** "Look at this! We've separated WHAT we need (the interfaces) from HOW we get it (the implementations). The business logic only depends on the interfaces."

### Part 2: Service Implementation - Multiple Providers (20 minutes)

```typescript
// OpenAI Implementation
const OpenAITextProcessor = Layer.effect(
  TextProcessor,
  Effect.gen(function* () {
    const config = yield* AIConfig;
    const httpClient = yield* HttpClient.HttpClient;
    
    return TextProcessor.of({
      process: (input: string) =>
        pipe(
          HttpClientRequest.post('https://api.openai.com/v1/chat/completions'),
          HttpClientRequest.setHeaders({
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }),
          HttpClientRequest.setBody(JSON.stringify({
            model: config.textModel, // 🎉 Configurable!
            messages: [{ role: 'user', content: input }],
            max_tokens: 1000,
            temperature: 0.7
          })),
          
          httpClient.execute,
          Effect.flatMap(response => HttpClientResponse.json(response)),
          
          Effect.map((data: any) => ({
            content: data.choices[0]?.message?.content || '',
            model: config.textModel,
            usage: { tokens: data.usage?.total_tokens || 0 }
          })),
          
          Effect.mapError(error => 
            new AIServiceError({ 
              service: 'openai', 
              operation: 'text-processing', 
              reason: error.message 
            })
          ),
          
          Effect.timeout(config.apiTimeout),
          Effect.retry(Schedule.recurs(config.maxRetries))
        )
    });
  })
);

// Hugging Face Implementation (alternative)
const HuggingFaceTextProcessor = Layer.effect(
  TextProcessor,
  Effect.gen(function* () {
    const config = yield* AIConfig;
    const httpClient = yield* HttpClient.HttpClient;
    
    return TextProcessor.of({
      process: (input: string) =>
        pipe(
          HttpClientRequest.post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large'),
          HttpClientRequest.setHeaders({
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          }),
          HttpClientRequest.setBody(JSON.stringify({
            inputs: input,
            parameters: {
              max_length: 1000,
              temperature: 0.7
            }
          })),
          
          httpClient.execute,
          Effect.flatMap(response => HttpClientResponse.json(response)),
          
          Effect.map((data: any) => ({
            content: data[0]?.generated_text || '',
            model: 'DialoGPT-large',
            usage: { tokens: input.length + (data[0]?.generated_text?.length || 0) }
          })),
          
          Effect.mapError(error => 
            new AIServiceError({ 
              service: 'huggingface', 
              operation: 'text-processing', 
              reason: error.message 
            })
          ),
          
          Effect.timeout(config.apiTimeout)
        )
    });
  })
);

// Mock Implementation (for testing!)
const MockTextProcessor = Layer.effect(
  TextProcessor,
  Effect.gen(function* () {
    return TextProcessor.of({
      process: (input: string) =>
        Effect.sync(() => ({
          content: `Mock response to: ${input}`,
          model: 'mock-model',
          usage: { tokens: input.length * 2 }
        }))
    });
  })
);

// OpenAI Voice Processor
const OpenAIVoiceProcessor = Layer.effect(
  VoiceProcessor,
  Effect.gen(function* () {
    const config = yield* AIConfig;
    const httpClient = yield* HttpClient.HttpClient;
    
    return VoiceProcessor.of({
      transcribe: (audio: Buffer) =>
        pipe(
          // Implementation for Whisper API
          Effect.promise(() => 
            fetch('https://api.openai.com/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: createFormData(audio, config.voiceModel)
            })
          ),
          Effect.flatMap(response => Effect.promise(() => response.json())),
          Effect.map((data: any) => ({
            transcription: data.text,
            language: data.language || 'en',
            confidence: 0.95
          })),
          Effect.mapError(error => 
            new AIServiceError({ 
              service: 'openai', 
              operation: 'voice-transcription', 
              reason: error.message 
            })
          ),
          Effect.timeout(config.apiTimeout)
        ),
      
      synthesize: (text: string) =>
        pipe(
          // Implementation for TTS API
          Effect.promise(() => 
            fetch('https://api.openai.com/v1/audio/speech', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: 'alloy'
              })
            })
          ),
          Effect.flatMap(response => Effect.promise(() => response.arrayBuffer())),
          Effect.map(buffer => Buffer.from(buffer)),
          Effect.mapError(error => 
            new AIServiceError({ 
              service: 'openai', 
              operation: 'voice-synthesis', 
              reason: error.message 
            })
          )
        )
    });
  })
);

// OpenAI Vision Processor
const OpenAIVisionProcessor = Layer.effect(
  VisionProcessor,
  Effect.gen(function* () {
    const config = yield* AIConfig;
    const httpClient = yield* HttpClient.HttpClient;
    
    return VisionProcessor.of({
      analyze: (image: Buffer) =>
        pipe(
          HttpClientRequest.post('https://api.openai.com/v1/chat/completions'),
          HttpClientRequest.setHeaders({
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }),
          HttpClientRequest.setBody(JSON.stringify({
            model: config.visionModel,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this image and provide: 1) A description, 2) List of objects, 3) Any text you see. Format as JSON.'
                  },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${image.toString('base64')}` }
                  }
                ]
              }
            ],
            max_tokens: 500
          })),
          
          httpClient.execute,
          Effect.flatMap(response => HttpClientResponse.json(response)),
          
          Effect.map((data: any) => {
            const content = data.choices[0]?.message?.content || '';
            try {
              const parsed = JSON.parse(content);
              return {
                description: parsed.description || content,
                objects: parsed.objects || [],
                text: parsed.text || ''
              };
            } catch {
              // Fallback to text parsing
              return {
                description: content,
                objects: extractObjects(content),
                text: extractText(content)
              };
            }
          }),
          
          Effect.mapError(error => 
            new AIServiceError({ 
              service: 'openai', 
              operation: 'vision-analysis', 
              reason: error.message 
            })
          ),
          
          Effect.timeout(config.apiTimeout)
        ),
      
      describe: (image: Buffer) =>
        pipe(
          VisionProcessor.analyze(image),
          Effect.map(result => result.description)
        )
    });
  })
);
```

### Part 3: Service Composition and Configuration (20 minutes)

```typescript
// Configuration layers for different environments
const DevelopmentConfig = Layer.succeed(AIConfig, {
  textModel: 'gpt-3.5-turbo', // Cheaper for dev
  voiceModel: 'whisper-1',
  visionModel: 'gpt-4-vision-preview',
  apiTimeout: Duration.seconds(10),
  maxRetries: 2,
  fallbackEnabled: true
});

const ProductionConfig = Layer.succeed(AIConfig, {
  textModel: 'gpt-4', // Best quality for prod
  voiceModel: 'whisper-1',
  visionModel: 'gpt-4-vision-preview',
  apiTimeout: Duration.seconds(30),
  maxRetries: 3,
  fallbackEnabled: true
});

const TestConfig = Layer.succeed(AIConfig, {
  textModel: 'mock-model',
  voiceModel: 'mock-model',
  visionModel: 'mock-model',
  apiTimeout: Duration.seconds(1),
  maxRetries: 0,
  fallbackEnabled: false
});

// Top-level AI Assistant Service
interface AIAssistantService {
  readonly processText: (input: string) => Effect.Effect<TextResponse, AIError>;
  readonly processVoice: (audio: Buffer) => Effect.Effect<VoiceResponse, AIError>;
  readonly processImage: (image: Buffer) => Effect.Effect<VisionResponse, AIError>;
  readonly processMultiModal: (
    text?: string,
    audio?: Buffer,
    image?: Buffer
  ) => Effect.Effect<{
    text?: TextResponse;
    voice?: VoiceResponse;
    vision?: VisionResponse;
  }, AIError>;
}

const AIAssistantService = Context.GenericTag<AIAssistantService>('AIAssistantService');

// Service implementation that composes other services
const AIAssistantServiceLive = Layer.effect(
  AIAssistantService,
  Effect.gen(function* () {
    const textProcessor = yield* TextProcessor;
    const voiceProcessor = yield* VoiceProcessor;
    const visionProcessor = yield* VisionProcessor;
    
    return AIAssistantService.of({
      processText: textProcessor.process,
      
      processVoice: voiceProcessor.transcribe,
      
      processImage: visionProcessor.analyze,
      
      processMultiModal: (text?: string, audio?: Buffer, image?: Buffer) =>
        pipe(
          Effect.all({
            text: text ? Effect.some(textProcessor.process(text)) : Effect.succeed(Option.none()),
            voice: audio ? Effect.some(voiceProcessor.transcribe(audio)) : Effect.succeed(Option.none()),
            vision: image ? Effect.some(visionProcessor.analyze(image)) : Effect.succeed(Option.none())
          }, { concurrency: 3 }), // 🎉 Concurrent processing!
          
          Effect.map(results => ({
            text: Option.getOrUndefined(results.text),
            voice: Option.getOrUndefined(results.voice),
            vision: Option.getOrUndefined(results.vision)
          }))
        )
    });
  })
);

// Different layer compositions for different environments
const DevelopmentLayers = Layer.mergeAll(
  OpenAITextProcessor,
  OpenAIVoiceProcessor,
  OpenAIVisionProcessor
).pipe(
  Layer.provide(DevelopmentConfig),
  Layer.provide(HttpClientLive)
);

const ProductionLayers = Layer.mergeAll(
  OpenAITextProcessor,
  OpenAIVoiceProcessor,
  OpenAIVisionProcessor
).pipe(
  Layer.provide(ProductionConfig),
  Layer.provide(HttpClientLive)
);

const TestLayers = Layer.mergeAll(
  MockTextProcessor,
  MockVoiceProcessor, // You'd implement this
  MockVisionProcessor // You'd implement this
).pipe(
  Layer.provide(TestConfig)
);

// Usage - clean and configurable!
const processUserInput = (input: string) =>
  pipe(
    AIAssistantService,
    Effect.flatMap(assistant => assistant.processText(input)),
    Effect.tap(result => 
      Effect.sync(() => console.log('Result:', result))
    )
  );

// Different environments, same code!
const developmentProgram = pipe(
  processUserInput('Hello, world!'),
  Effect.provide(AIAssistantServiceLive),
  Effect.provide(DevelopmentLayers)
);

const productionProgram = pipe(
  processUserInput('Hello, world!'),
  Effect.provide(AIAssistantServiceLive),
  Effect.provide(ProductionLayers)
);

const testProgram = pipe(
  processUserInput('Hello, world!'),
  Effect.provide(AIAssistantServiceLive),
  Effect.provide(TestLayers)
);
```

**Key Insights to Highlight:**

1. **Separation of Concerns**: Business logic doesn't know about OpenAI, Hugging Face, etc.
2. **Configuration Management**: Different configs for different environments
3. **Easy Testing**: Swap in mock implementations without changing business logic
4. **Composability**: Services compose naturally with Effect.all
5. **Type Safety**: The compiler ensures all dependencies are provided

---

## 🛠️ Hands-On Workshop: Build Your Multi-Modal AI Assistant (85 minutes)

### Setup (10 minutes)

```bash
mkdir multimodal-ai-assistant
cd multimodal-ai-assistant
npm init -y
npm install effect @effect/platform
npm install -D typescript @types/node tsx vitest
```

### Phase 1: Service Extraction (25 minutes)

**Instructions:**
- Form pairs
- Take existing AI code and extract service interfaces
- Create at least two implementations per service
- Focus on clean interface design

**Starter Code (`src/services.ts`):**
```typescript
import { Effect, Context, Layer, pipe } from 'effect';
import { Data } from 'effect';

// TODO: Define your domain types
interface ProcessingResult {
  readonly content: string;
  readonly confidence: number;
  readonly processingTime: number;
}

// TODO: Define your error types
class ServiceError extends Data.TaggedError('ServiceError')<{
  readonly service: string;
  readonly reason: string;
}> {}

// TODO: Define service interfaces
interface TextAnalyzer {
  readonly analyze: (text: string) => Effect.Effect<ProcessingResult, ServiceError>;
  readonly summarize: (text: string) => Effect.Effect<string, ServiceError>;
}

interface SentimentAnalyzer {
  readonly analyzeSentiment: (text: string) => Effect.Effect<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }, ServiceError>;
}

// TODO: Create service tags
const TextAnalyzer = Context.GenericTag<TextAnalyzer>('TextAnalyzer');
const SentimentAnalyzer = Context.GenericTag<SentimentAnalyzer>('SentimentAnalyzer');

// TODO: Implement OpenAI version
const OpenAITextAnalyzer = Layer.effect(
  TextAnalyzer,
  Effect.gen(function* () {
    return TextAnalyzer.of({
      analyze: (text: string) =>
        pipe(
          Effect.sync(() => Date.now()),
          Effect.flatMap(startTime =>
            pipe(
              // Simulate OpenAI API call
              Effect.sleep(Duration.millis(500 + Math.random() * 1000)),
              Effect.flatMap(() => {
                if (Math.random() > 0.1) {
                  return Effect.succeed({
                    content: `OpenAI analysis of: ${text.substring(0, 50)}...`,
                    confidence: 0.9 + Math.random() * 0.1,
                    processingTime: Date.now() - startTime
                  });
                } else {
                  return Effect.fail(new ServiceError({
                    service: 'openai',
                    reason: 'API rate limit exceeded'
                  }));
                }
              })
            )
          )
        ),
      
      summarize: (text: string) =>
        pipe(
          Effect.sleep(Duration.millis(300 + Math.random() * 700)),
          Effect.map(() => `OpenAI Summary: ${text.substring(0, 100)}...`)
        )
    });
  })
);

// TODO: Implement Hugging Face version
const HuggingFaceTextAnalyzer = Layer.effect(
  TextAnalyzer,
  Effect.gen(function* () {
    return TextAnalyzer.of({
      analyze: (text: string) =>
        pipe(
          Effect.sync(() => Date.now()),
          Effect.flatMap(startTime =>
            pipe(
              Effect.sleep(Duration.millis(800 + Math.random() * 1200)),
              Effect.flatMap(() => {
                if (Math.random() > 0.05) {
                  return Effect.succeed({
                    content: `HuggingFace analysis of: ${text.substring(0, 50)}...`,
                    confidence: 0.8 + Math.random() * 0.15,
                    processingTime: Date.now() - startTime
                  });
                } else {
                  return Effect.fail(new ServiceError({
                    service: 'huggingface',
                    reason: 'Model loading timeout'
                  }));
                }
              })
            )
          )
        ),
      
      summarize: (text: string) =>
        pipe(
          Effect.sleep(Duration.millis(600 + Math.random() * 800)),
          Effect.map(() => `HF Summary: ${text.substring(0, 80)}...`)
        )
    });
  })
);

// TODO: Implement Mock version for testing
const MockTextAnalyzer = Layer.effect(
  TextAnalyzer,
  Effect.gen(function* () {
    return TextAnalyzer.of({
      analyze: (text: string) =>
        Effect.succeed({
          content: `Mock analysis: ${text}`,
          confidence: 1.0,
          processingTime: 10
        }),
      
      summarize: (text: string) =>
        Effect.succeed(`Mock summary: ${text.substring(0, 20)}...`)
    });
  })
);

// TODO: Create a composite service that uses both
interface AICompositeService {
  readonly processText: (text: string) => Effect.Effect<{
    analysis: ProcessingResult;
    sentiment: { sentiment: 'positive' | 'negative' | 'neutral'; score: number };
    summary: string;
  }, ServiceError>;
}

const AICompositeService = Context.GenericTag<AICompositeService>('AICompositeService');

const AICompositeServiceLive = Layer.effect(
  AICompositeService,
  Effect.gen(function* () {
    const textAnalyzer = yield* TextAnalyzer;
    const sentimentAnalyzer = yield* SentimentAnalyzer;
    
    return AICompositeService.of({
      processText: (text: string) =>
        pipe(
          Effect.all({
            analysis: textAnalyzer.analyze(text),
            sentiment: sentimentAnalyzer.analyzeSentiment(text),
            summary: textAnalyzer.summarize(text)
          }, { concurrency: 3 }) // Run all in parallel!
        )
    });
  })
);

export {
  TextAnalyzer,
  SentimentAnalyzer,
  AICompositeService,
  OpenAITextAnalyzer,
  HuggingFaceTextAnalyzer,
  MockTextAnalyzer,
  AICompositeServiceLive
};
```

### Phase 2: Configuration Management (25 minutes)

**Instructions:**
- Add configuration service for different environments
- Handle missing configuration gracefully
- Create environment-specific layer compositions

**Starter Code (`src/config.ts`):**
```typescript
import { Effect, Context, Layer, pipe } from 'effect';
import { Data } from 'effect';

// TODO: Define configuration interface
interface AppConfig {
  readonly environment: 'development' | 'production' | 'test';
  readonly aiProvider: 'openai' | 'huggingface' | 'mock';
  readonly apiTimeout: Duration.Duration;
  readonly maxRetries: number;
  readonly enableFallback: boolean;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const AppConfig = Context.GenericTag<AppConfig>('AppConfig');

// TODO: Define configuration error
class ConfigError extends Data.TaggedError('ConfigError')<{
  readonly setting: string;
  readonly reason: string;
}> {}

// TODO: Load configuration from environment
const loadConfigFromEnv = (): Effect.Effect<AppConfig, ConfigError> =>
  pipe(
    Effect.sync(() => ({
      NODE_ENV: process.env.NODE_ENV || 'development',
      AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
      API_TIMEOUT: process.env.API_TIMEOUT || '30000',
      MAX_RETRIES: process.env.MAX_RETRIES || '3',
      ENABLE_FALLBACK: process.env.ENABLE_FALLBACK || 'true',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    })),
    Effect.flatMap(env => {
      // Validate environment
      if (!['development', 'production', 'test'].includes(env.NODE_ENV)) {
        return Effect.fail(new ConfigError({
          setting: 'NODE_ENV',
          reason: `Invalid environment: ${env.NODE_ENV}`
        }));
      }
      
      if (!['openai', 'huggingface', 'mock'].includes(env.AI_PROVIDER)) {
        return Effect.fail(new ConfigError({
          setting: 'AI_PROVIDER',
          reason: `Invalid AI provider: ${env.AI_PROVIDER}`
        }));
      }
      
      const timeout = parseInt(env.API_TIMEOUT);
      if (isNaN(timeout) || timeout <= 0) {
        return Effect.fail(new ConfigError({
          setting: 'API_TIMEOUT',
          reason: `Invalid timeout: ${env.API_TIMEOUT}`
        }));
      }
      
      return Effect.succeed({
        environment: env.NODE_ENV as 'development' | 'production' | 'test',
        aiProvider: env.AI_PROVIDER as 'openai' | 'huggingface' | 'mock',
        apiTimeout: Duration.millis(timeout),
        maxRetries: parseInt(env.MAX_RETRIES) || 3,
        enableFallback: env.ENABLE_FALLBACK === 'true',
        logLevel: env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error'
      });
    })
  );

// TODO: Create configuration layers
const AppConfigLive = Layer.effect(AppConfig, loadConfigFromEnv());

// TODO: Create environment-specific configurations
const DevelopmentConfigLive = Layer.succeed(AppConfig, {
  environment: 'development' as const,
  aiProvider: 'mock' as const,
  apiTimeout: Duration.seconds(10),
  maxRetries: 2,
  enableFallback: true,
  logLevel: 'debug' as const
});

const ProductionConfigLive = Layer.succeed(AppConfig, {
  environment: 'production' as const,
  aiProvider: 'openai' as const,
  apiTimeout: Duration.seconds(30),
  maxRetries: 3,
  enableFallback: true,
  logLevel: 'info' as const
});

const TestConfigLive = Layer.succeed(AppConfig, {
  environment: 'test' as const,
  aiProvider: 'mock' as const,
  apiTimeout: Duration.seconds(1),
  maxRetries: 0,
  enableFallback: false,
  logLevel: 'error' as const
});

// TODO: Create a service that adapts based on configuration
const createServiceLayer = (config: AppConfig) => {
  switch (config.aiProvider) {
    case 'openai':
      return OpenAITextAnalyzer;
    case 'huggingface':
      return HuggingFaceTextAnalyzer;
    case 'mock':
    default:
      return MockTextAnalyzer;
  }
};

export {
  AppConfig,
  AppConfigLive,
  DevelopmentConfigLive,
  ProductionConfigLive,
  TestConfigLive,
  createServiceLayer
};
```

### Phase 3: Testing with Mocks (35 minutes)

**Instructions:**
- Create comprehensive test suite
- Use dependency injection for mocking
- Test different scenarios and error cases
- Verify service composition works correctly

**Starter Code (`src/__tests__/ai-assistant.test.ts`):**
```typescript
import { Effect, pipe, Layer } from 'effect';
import { describe, it, expect } from 'vitest';
import {
  AICompositeService,
  AICompositeServiceLive,
  MockTextAnalyzer
} from '../services';
import { TestConfigLive } from '../config';

describe('AI Assistant Service', () => {
  // TODO: Test with mock dependencies
  it('should process text with mock services', () =>
    Effect.gen(function* () {
      const service = yield* AICompositeService;
      const result = yield* service.processText('Hello world');
      
      expect(result.analysis.content).toContain('Mock analysis');
      expect(result.analysis.confidence).toBe(1.0);
      expect(result.summary).toContain('Mock summary');
    }).pipe(
      Effect.provide(AICompositeServiceLive),
      Effect.provide(MockTextAnalyzer),
      Effect.provide(TestConfigLive),
      Effect.runPromise
    )
  );

  // TODO: Test error handling
  it('should handle service errors gracefully', () =>
    Effect.gen(function* () {
      // Create a failing mock service
      const FailingTextAnalyzer = Layer.effect(
        TextAnalyzer,
        Effect.gen(function* () {
          return TextAnalyzer.of({
            analyze: () => Effect.fail(new ServiceError({
              service: 'mock',
              reason: 'Simulated failure'
            })),
            summarize: () => Effect.fail(new ServiceError({
              service: 'mock',
              reason: 'Simulated failure'
            }))
          });
        })
      );
      
      const service = yield* AICompositeService;
      const result = yield* pipe(
        service.processText('Hello world'),
        Effect.either
      );
      
      expect(result._tag).toBe('Left');
      if (result._tag === 'Left') {
        expect(result.left.reason).toBe('Simulated failure');
      }
    }).pipe(
      Effect.provide(AICompositeServiceLive),
      Effect.provide(FailingTextAnalyzer),
      Effect.provide(TestConfigLive),
      Effect.runPromise
    )
  );

  // TODO: Test concurrent processing
  it('should process multiple requests concurrently', () =>
    Effect.gen(function* () {
      const service = yield* AICompositeService;
      const startTime = Date.now();
      
      const results = yield* pipe(
        ['Hello', 'World', 'Test'],
        Effect.forEach(
          text => service.processText(text),
          { concurrency: 3 }
        )
      );
      
      const totalTime = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      expect(totalTime).toBeLessThan(100); // Should be fast with mocks
      
      results.forEach(result => {
        expect(result.analysis.content).toContain('Mock analysis');
      });
    }).pipe(
      Effect.provide(AICompositeServiceLive),
      Effect.provide(MockTextAnalyzer),
      Effect.provide(TestConfigLive),
      Effect.runPromise
    )
  );

  // TODO: Test configuration-based service selection
  it('should use different services based on configuration', () =>
    Effect.gen(function* () {
      const config = yield* AppConfig;
      expect(config.aiProvider).toBe('mock');
      expect(config.environment).toBe('test');
      
      const service = yield* AICompositeService;
      const result = yield* service.processText('Config test');
      
      // Mock service should return mock responses
      expect(result.analysis.content).toContain('Mock analysis');
    }).pipe(
      Effect.provide(AICompositeServiceLive),
      Effect.provide(MockTextAnalyzer),
      Effect.provide(TestConfigLive),
      Effect.runPromise
    )
  );
});

// TODO: Add integration tests
describe('Service Integration', () => {
  it('should compose services correctly', () =>
    Effect.gen(function* () {
      // Test that all services work together
      const service = yield* AICompositeService;
      
      const result = yield* service.processText('Integration test');
      
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('summary');
      
      expect(result.analysis.confidence).toBeGreaterThan(0);
      expect(result.sentiment.score).toBeGreaterThanOrEqual(-1);
      expect(result.sentiment.score).toBeLessThanOrEqual(1);
    }).pipe(
      Effect.provide(AICompositeServiceLive),
      Effect.provide(MockTextAnalyzer),
      Effect.provide(TestConfigLive),
      Effect.runPromise
    )
  );
});
```

**Run the tests:**
```bash
npx vitest run
```

### Workshop Debrief (10 minutes)

**Questions to ask:**
- "What was different about testing with dependency injection?"
- "How easy was it to swap out service implementations?"
- "What would you need to add a new AI provider?"
- "How does this compare to your current testing approach?"

---

## 🎯 Advanced Service Patterns (15 minutes)

### Service Composition with Fallbacks
```typescript
// Automatic fallback between services
const ResilientTextProcessor = Layer.effect(
  TextProcessor,
  Effect.gen(function* () {
    const primary = yield* OpenAITextProcessor;
    const fallback = yield* HuggingFaceTextProcessor;
    
    return TextProcessor.of({
      process: (input: string) =>
        pipe(
          primary.process(input),
          Effect.orElse(() => fallback.process(input))
        )
    });
  })
);
```

### Service Decorators
```typescript
// Add logging, metrics, caching to any service
const withLogging = <S>(
  tag: Context.Tag<S, S>,
  layer: Layer.Layer<S>
): Layer.Layer<S> =>
  Layer.effect(
    tag,
    Effect.gen(function* () {
      const service = yield* layer;
      const logger = yield* Logger;
      
      // Wrap all methods with logging
      return new Proxy(service, {
        get(target, prop) {
          const original = target[prop];
          if (typeof original === 'function') {
            return (...args: any[]) =>
              pipe(
                Effect.sync(() => logger.info(`Calling ${String(prop)} with`, args)),
                Effect.flatMap(() => original.apply(target, args)),
                Effect.tap(result => 
                  Effect.sync(() => logger.info(`${String(prop)} returned`, result))
                )
              );
          }
          return original;
        }
      });
    })
  );

const LoggedTextProcessor = withLogging(TextProcessor, OpenAITextProcessor);
```

### Feature Flags Integration
```typescript
// Enable/disable features based on flags
const FeatureFlaggedService = Layer.effect(
  AICompositeService,
  Effect.gen(function* () {
    const textAnalyzer = yield* TextAnalyzer;
    const sentimentAnalyzer = yield* SentimentAnalyzer;
    const featureFlags = yield* FeatureFlags;
    
    return AICompositeService.of({
      processText: (text: string) =>
        pipe(
          Effect.all({
            analysis: textAnalyzer.analyze(text),
            sentiment: featureFlags.enableSentimentAnalysis 
              ? sentimentAnalyzer.analyzeSentiment(text)
              : Effect.succeed({ sentiment: 'neutral' as const, score: 0 }),
            summary: featureFlags.enableSummarization
              ? textAnalyzer.summarize(text)
              : Effect.succeed('Summary disabled')
          })
        )
    });
  })
);
```

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Service Architecture**
- **Separate interfaces from implementations** - business logic depends on interfaces
- **Use Context.GenericTag** to create service tags for dependency injection
- **Layer.effect** to create service implementations
- **Layer.mergeAll** to compose multiple services

**2. Configuration Management**
- **Environment-specific configurations** without code changes
- **Type-safe configuration** with validation
- **Configuration as a service** - inject it like any other dependency

**3. Testing Revolution**
- **Dependency injection makes testing trivial** - just swap in mocks
- **No more expensive integration tests** - test business logic in isolation
- **Easy to test error scenarios** - create failing mock services

**4. Composability**
- **Services compose naturally** with Effect.all
- **Fallback chains** with Effect.orElse
- **Service decorators** for cross-cutting concerns (logging, metrics, caching)

### Connection to Previous Weeks
"Remember our error handling from week 2 and concurrency from week 3? Notice how they just work with services. Our error types are still explicit, our concurrent processing is still safe, but now everything is modular and testable."

### Bridge to Week 5
"Great! Now we have a clean, testable architecture. But what happens when we need to process thousands of requests in real-time? What if users are uploading images and expecting immediate feedback? Next week we'll learn about Effect's streaming capabilities for building reactive, real-time AI applications."

### Homework Assignment

**Add a plugin system to your AI assistant:**
1. **Plugin interface**: Define what a plugin looks like
2. **Plugin registry**: Dynamically load and register plugins
3. **Plugin composition**: Chain plugins together in pipelines
4. **Plugin configuration**: Each plugin has its own config

**Bonus challenges:**
- Add health checks for all services
- Implement circuit breakers for external services
- Add distributed tracing across service boundaries
- Create a service mesh with load balancing

---

## 🎓 Assessment Rubric

### Technical Skills Assessment
- [ ] **Proper service interface design** - clean separation of what vs how
- [ ] **Correct use of Context and Layer** - proper dependency injection
- [ ] **Configuration management** - externalized, type-safe, environment-specific
- [ ] **Testing with dependency injection** - mocks, error scenarios, composition

### Architecture Understanding Assessment
- [ ] Can explain the benefits of dependency injection
- [ ] Understands the difference between interface and implementation
- [ ] Can design service hierarchies and composition
- [ ] Knows when to create new services vs extend existing ones

### Code Quality Assessment
- [ ] **Services have single responsibilities** - focused, cohesive interfaces
- [ ] **Dependencies are explicit** in type signatures
- [ ] **Configuration is externalized** - no hardcoded values
- [ ] **Tests don't depend on external services** - fast, reliable, isolated

### Red Flags to Watch For
- Services that do too much (god objects)
- Hardcoded dependencies sneaking back in
- Configuration scattered throughout the code
- Tests that still call real APIs
- Circular dependencies between services

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Services](https://effect.website/docs/services)
- [Effect Documentation: Layers](https://effect.website/docs/layers)
- [Effect Documentation: Context](https://effect.website/docs/context)

### Code Examples
- [Complete Multi-Modal AI Assistant](./examples/multimodal-assistant/)
- [Service Composition Patterns](./examples/service-composition/)
- [Testing Strategies](./examples/testing-strategies/)

### Next Week Prep
- Think about scenarios where you need real-time data processing
- Consider: How do you handle streams of data that never end?
- Read about reactive programming and backpressure

---

*"Good architecture is not about preventing change - it's about making change easy, safe, and predictable."*