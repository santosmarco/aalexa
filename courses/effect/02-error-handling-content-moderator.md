# Week 2: Error Handling & AI Content Moderator
## Making Errors First-Class Citizens

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Design rich, typed error hierarchies** that make debugging and recovery explicit
- **Distinguish between retryable and non-retryable errors** in AI systems
- **Build composable fallback chains** using `Effect.orElse` and `Effect.catchTag`
- **Create a production-ready AI content moderator** with multiple service integrations
- **Master error composition patterns** that scale to complex systems

---

## 🔥 Opening Hook: The Error Handling Horror Show (20 minutes)

### The Scenario
You're building a content moderation system for a social platform. Users post content, and you need to check it for toxicity, inappropriate language, and policy violations using multiple AI services.

### Live Coding: Content Moderation with Traditional Error Handling

```typescript
// content-moderator-traditional.ts - The nightmare we've all lived
import axios from 'axios';
import OpenAI from 'openai';

interface ModerationResult {
  content: string;
  flagged: boolean;
  categories: string[];
  confidence: number;
  service: string;
}

// Service 1: OpenAI Moderation
async function moderateWithOpenAI(content: string): Promise<ModerationResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  try {
    const response = await openai.moderations.create({ input: content });
    const result = response.results[0];
    
    return {
      content,
      flagged: result.flagged,
      categories: Object.keys(result.categories).filter(cat => result.categories[cat]),
      confidence: Math.max(...Object.values(result.category_scores)),
      service: 'openai'
    };
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded');
    } else if (error.status === 401) {
      throw new Error('OpenAI API key invalid');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('OpenAI service unavailable');
    }
    throw new Error(`OpenAI moderation failed: ${error.message}`);
  }
}

// Service 2: Hugging Face Moderation (fallback)
async function moderateWithHuggingFace(content: string): Promise<ModerationResult> {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model',
      { inputs: content },
      {
        headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        timeout: 10000
      }
    );
    
    const toxic = response.data[0]?.find((item: any) => item.label === 'TOXIC');
    
    return {
      content,
      flagged: toxic?.score > 0.5,
      categories: toxic?.score > 0.5 ? ['toxic'] : [],
      confidence: toxic?.score || 0,
      service: 'huggingface'
    };
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error('Hugging Face rate limit exceeded');
    } else if (error.response?.status === 503) {
      throw new Error('Hugging Face model loading');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Hugging Face timeout');
    }
    throw new Error(`Hugging Face moderation failed: ${error.message}`);
  }
}

// Service 3: Local rules (last resort)
function moderateWithLocalRules(content: string): ModerationResult {
  const badWords = ['spam', 'scam', 'fake']; // Simplified for demo
  const flagged = badWords.some(word => content.toLowerCase().includes(word));
  
  return {
    content,
    flagged,
    categories: flagged ? ['policy-violation'] : [],
    confidence: flagged ? 0.8 : 0.1,
    service: 'local-rules'
  };
}

// The main function - THIS IS WHERE IT GETS MESSY
async function moderateContentWithFallbacks(content: string): Promise<ModerationResult> {
  // Validate input
  if (!content || content.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }
  
  if (content.length > 2000) {
    throw new Error('Content too long (max 2000 characters)');
  }
  
  // Try OpenAI first
  try {
    console.log('Trying OpenAI moderation...');
    return await moderateWithOpenAI(content);
  } catch (error: any) {
    console.warn('OpenAI failed:', error.message);
    
    // If it's a rate limit, wait and try once more
    if (error.message.includes('rate limit')) {
      try {
        console.log('Rate limited, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await moderateWithOpenAI(content);
      } catch (retryError) {
        console.warn('OpenAI retry failed:', retryError.message);
      }
    }
    
    // Try Hugging Face as fallback
    try {
      console.log('Trying Hugging Face moderation...');
      return await moderateWithHuggingFace(content);
    } catch (hfError: any) {
      console.warn('Hugging Face failed:', hfError.message);
      
      // If HF is loading, wait and try once more
      if (hfError.message.includes('model loading')) {
        try {
          console.log('Model loading, waiting 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          return await moderateWithHuggingFace(content);
        } catch (hfRetryError) {
          console.warn('Hugging Face retry failed:', hfRetryError.message);
        }
      }
      
      // Fall back to local rules
      console.log('Using local rules as last resort...');
      return moderateWithLocalRules(content);
    }
  }
}

// Usage - pray it works! 🙏
async function main() {
  try {
    const result = await moderateContentWithFallbacks('This is some test content');
    console.log('Moderation result:', result);
  } catch (error: any) {
    console.error('All moderation attempts failed:', error.message);
    // Now what? 🤷‍♂️
  }
}
```

### Discussion Questions (10 minutes)

**Ask the class:**
1. "Who has written code like this?" *(Everyone raises hand)*
2. "What problems do you see here?"
   - **Generic Error objects** - "OpenAI rate limit exceeded" vs "Hugging Face timeout" - how do you handle them differently?
   - **Scattered error handling** - try/catch blocks everywhere
   - **No way to know what errors a function might throw** - the types don't help
   - **Inconsistent error handling** - some errors retry, others don't
   - **Error recovery logic is buried** - hard to see the fallback strategy
   - **Hard to test** - how do you test all these error scenarios?

3. "What makes an error 'retryable' vs 'non-retryable'?"
   - Rate limits → retryable (after waiting)
   - Network timeouts → retryable
   - Invalid API keys → NOT retryable
   - Content too long → NOT retryable
   - Service temporarily down → retryable

**The Setup:** "What if we could make errors as explicit and composable as our success cases?"

---

## 🚀 Enter Effect: Errors as First-Class Citizens (60 minutes)

### Part 1: Tagged Errors - Making Errors Explicit (20 minutes)

```typescript
// content-moderator-effect.ts - The Effect way
import { Effect, pipe, Schedule, Duration, Data } from 'effect';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';

// First, let's model our domain types
interface ModerationResult {
  readonly content: string;
  readonly flagged: boolean;
  readonly categories: ReadonlyArray<string>;
  readonly confidence: number;
  readonly service: string;
}

// Now, let's design our error hierarchy - THIS IS THE KEY!

// Infrastructure errors (usually retryable)
class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly service: string;
  readonly reason: string;
}> {}

class RateLimitError extends Data.TaggedError('RateLimitError')<{
  readonly service: string;
  readonly resetTime: Date;
  readonly remaining: number;
}> {}

class ServiceUnavailableError extends Data.TaggedError('ServiceUnavailableError')<{
  readonly service: string;
  readonly estimatedRecoveryTime?: Duration.Duration;
}> {}

// Business logic errors (NOT retryable)
class ContentTooLongError extends Data.TaggedError('ContentTooLongError')<{
  readonly maxLength: number;
  readonly actualLength: number;
}> {}

class EmptyContentError extends Data.TaggedError('EmptyContentError')<{
  readonly message: string;
}> {}

class UnsupportedLanguageError extends Data.TaggedError('UnsupportedLanguageError')<{
  readonly detectedLanguage: string;
  readonly supportedLanguages: ReadonlyArray<string>;
}> {}

// Authentication errors (NOT retryable)
class InvalidAPIKeyError extends Data.TaggedError('InvalidAPIKeyError')<{
  readonly service: string;
}> {}

// Service-specific errors (sometimes retryable)
class ModelLoadingError extends Data.TaggedError('ModelLoadingError')<{
  readonly service: string;
  readonly modelName: string;
  readonly estimatedLoadTime: Duration.Duration;
}> {}

class ModerationServiceError extends Data.TaggedError('ModerationServiceError')<{
  readonly service: string;
  readonly reason: string;
  readonly retryable: boolean;
}> {}

// Union type for all possible errors
type ModerationError = 
  | NetworkError 
  | RateLimitError 
  | ServiceUnavailableError
  | ContentTooLongError 
  | EmptyContentError 
  | UnsupportedLanguageError
  | InvalidAPIKeyError 
  | ModelLoadingError 
  | ModerationServiceError;
```

**Key Insight:** "Look at this! The compiler now knows exactly what errors each function can produce. No more guessing, no more hidden exceptions."

### Part 2: Service Implementation with Explicit Error Mapping (20 minutes)

```typescript
// OpenAI Moderation Service
const moderateWithOpenAI = (content: string): Effect.Effect<ModerationResult, ModerationError> =>
  pipe(
    // Create the HTTP request
    HttpClientRequest.post('https://api.openai.com/v1/moderations'),
    HttpClientRequest.setHeaders({
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    HttpClientRequest.setBody(JSON.stringify({ input: content })),
    
    // Execute the request
    HttpClient.execute,
    
    // Parse response
    Effect.flatMap(response => HttpClientResponse.json(response)),
    
    // Transform to our domain type
    Effect.map((data: any) => {
      const result = data.results[0];
      return {
        content,
        flagged: result.flagged,
        categories: Object.keys(result.categories).filter(cat => result.categories[cat]),
        confidence: Math.max(...Object.values(result.category_scores)),
        service: 'openai'
      } as ModerationResult;
    }),
    
    // Map HTTP errors to our domain errors - THIS IS BEAUTIFUL!
    Effect.mapError(error => {
      if (error.message.includes('401')) {
        return new InvalidAPIKeyError({ service: 'openai' });
      }
      if (error.message.includes('429')) {
        return new RateLimitError({ 
          service: 'openai', 
          resetTime: new Date(Date.now() + 60000), // 1 minute from now
          remaining: 0 
        });
      }
      if (error.message.includes('503')) {
        return new ServiceUnavailableError({ 
          service: 'openai',
          estimatedRecoveryTime: Duration.minutes(5)
        });
      }
      return new NetworkError({ service: 'openai', reason: error.message });
    }),
    
    // Add timeout
    Effect.timeout(Duration.seconds(10))
  );

// Hugging Face Moderation Service
const moderateWithHuggingFace = (content: string): Effect.Effect<ModerationResult, ModerationError> =>
  pipe(
    HttpClientRequest.post('https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model'),
    HttpClientRequest.setHeaders({
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    HttpClientRequest.setBody(JSON.stringify({ inputs: content })),
    
    HttpClient.execute,
    Effect.flatMap(response => HttpClientResponse.json(response)),
    
    Effect.map((data: any) => {
      const toxic = data[0]?.find((item: any) => item.label === 'TOXIC');
      return {
        content,
        flagged: toxic?.score > 0.5,
        categories: toxic?.score > 0.5 ? ['toxic'] : [],
        confidence: toxic?.score || 0,
        service: 'huggingface'
      } as ModerationResult;
    }),
    
    Effect.mapError(error => {
      if (error.message.includes('429')) {
        return new RateLimitError({ 
          service: 'huggingface', 
          resetTime: new Date(Date.now() + 30000),
          remaining: 0 
        });
      }
      if (error.message.includes('503')) {
        return new ModelLoadingError({ 
          service: 'huggingface',
          modelName: 'toxic-comment-model',
          estimatedLoadTime: Duration.seconds(30)
        });
      }
      return new NetworkError({ service: 'huggingface', reason: error.message });
    }),
    
    Effect.timeout(Duration.seconds(15))
  );

// Local rules (never fails)
const moderateWithLocalRules = (content: string): Effect.Effect<ModerationResult, never> =>
  Effect.sync(() => {
    const badWords = ['spam', 'scam', 'fake'];
    const flagged = badWords.some(word => content.toLowerCase().includes(word));
    
    return {
      content,
      flagged,
      categories: flagged ? ['policy-violation'] : [],
      confidence: flagged ? 0.8 : 0.1,
      service: 'local-rules'
    };
  });
```

### Part 3: Error Composition and Recovery Strategies (20 minutes)

```typescript
// Input validation
const validateContent = (content: string): Effect.Effect<string, ContentTooLongError | EmptyContentError> =>
  pipe(
    Effect.sync(() => content.trim()),
    Effect.flatMap(trimmed => {
      if (trimmed.length === 0) {
        return Effect.fail(new EmptyContentError({ message: 'Content cannot be empty' }));
      }
      if (trimmed.length > 2000) {
        return Effect.fail(new ContentTooLongError({ 
          maxLength: 2000, 
          actualLength: trimmed.length 
        }));
      }
      return Effect.succeed(trimmed);
    })
  );

// Smart retry policy based on error type
const retryPolicy = Schedule.recurWhile((error: ModerationError) => {
  switch (error._tag) {
    case 'RateLimitError':
    case 'NetworkError':
    case 'ServiceUnavailableError':
    case 'ModelLoadingError':
      return true; // These are retryable
    default:
      return false; // Business logic errors are NOT retryable
  }
}).pipe(
  Schedule.intersect(Schedule.exponential(Duration.seconds(1))),
  Schedule.intersect(Schedule.recurs(3))
);

// The main moderation pipeline - THIS IS WHERE THE MAGIC HAPPENS
const moderateContent = (content: string): Effect.Effect<ModerationResult, ModerationError> =>
  pipe(
    // Step 1: Validate input
    validateContent(content),
    
    // Step 2: Try OpenAI first
    Effect.flatMap(validContent =>
      pipe(
        moderateWithOpenAI(validContent),
        
        // Step 3: Handle specific errors with targeted recovery
        Effect.catchTag('RateLimitError', (error) =>
          pipe(
            Effect.sleep(Duration.millis(error.resetTime.getTime() - Date.now())),
            Effect.flatMap(() => moderateWithOpenAI(validContent))
          )
        ),
        
        // Step 4: Fallback to Hugging Face for other errors
        Effect.catchTags({
          NetworkError: () => moderateWithHuggingFace(validContent),
          ServiceUnavailableError: () => moderateWithHuggingFace(validContent),
          InvalidAPIKeyError: () => moderateWithHuggingFace(validContent)
        }),
        
        // Step 5: Handle Hugging Face specific errors
        Effect.catchTag('ModelLoadingError', (error) =>
          pipe(
            Effect.sleep(error.estimatedLoadTime),
            Effect.flatMap(() => moderateWithHuggingFace(validContent))
          )
        ),
        
        // Step 6: Final fallback to local rules
        Effect.orElse(() => moderateWithLocalRules(validContent)),
        
        // Step 7: Add retry for transient failures
        Effect.retry(retryPolicy)
      )
    )
  );

// Usage - so clean and explicit!
const program = pipe(
  moderateContent('This is some test content'),
  Effect.tap(result => Effect.sync(() => console.log('Moderation result:', result))),
  Effect.catchAll(error => {
    // The compiler knows exactly what errors are possible!
    switch (error._tag) {
      case 'ContentTooLongError':
        return Effect.sync(() => console.error(`Content too long: ${error.actualLength} > ${error.maxLength}`));
      case 'EmptyContentError':
        return Effect.sync(() => console.error('Content cannot be empty'));
      case 'UnsupportedLanguageError':
        return Effect.sync(() => console.error(`Language ${error.detectedLanguage} not supported`));
      default:
        return Effect.sync(() => console.error('Unexpected error:', error));
    }
  })
);

Effect.runPromise(program);
```

**Key Insights to Highlight:**

1. **Explicit Error Types**: The function signature tells you exactly what can go wrong
2. **Targeted Error Handling**: `catchTag` lets you handle specific errors differently
3. **Composable Recovery**: Chain fallbacks with `orElse` and specific recovery with `catchTags`
4. **Smart Retry Logic**: Only retry errors that make sense to retry
5. **Compiler-Guided Error Handling**: The TypeScript compiler ensures you handle all cases

---

## 🛠️ Hands-On Workshop: Build Your Content Moderator (75 minutes)

### Setup (10 minutes)

```bash
mkdir content-moderator
cd content-moderator
npm init -y
npm install effect @effect/platform
npm install -D typescript @types/node tsx
```

### Phase 1: Error Modeling (25 minutes)

**Instructions:**
- Form pairs
- Design your error hierarchy for a content moderation system
- Think about what errors are retryable vs non-retryable
- Consider different services and their failure modes

**Starter Code (`src/errors.ts`):**
```typescript
import { Data } from 'effect';

// TODO: Design your error hierarchy here
// Consider these scenarios:
// - Network failures
// - Rate limiting
// - Invalid API keys
// - Content too long
// - Unsupported content type
// - Service temporarily down
// - Model loading

// Example structure:
class NetworkError extends Data.TaggedError('NetworkError')<{
  readonly service: string;
  readonly reason: string;
}> {}

// Add more error types here...

// Export a union type of all possible errors
export type ModerationError = NetworkError; // | OtherError | ...
```

**Discussion Points:**
- Which errors should be retryable?
- What information should each error carry?
- How do you distinguish between temporary and permanent failures?

### Phase 2: Service Implementation (25 minutes)

**Instructions:**
- Implement at least two moderation services (you can mock the APIs)
- Map HTTP errors to your domain errors
- Add appropriate timeouts

**Starter Code (`src/services.ts`):**
```typescript
import { Effect, pipe, Duration } from 'effect';
import { ModerationError } from './errors';

interface ModerationResult {
  readonly content: string;
  readonly flagged: boolean;
  readonly categories: ReadonlyArray<string>;
  readonly confidence: number;
  readonly service: string;
}

// TODO: Implement OpenAI moderation service
export const moderateWithOpenAI = (content: string): Effect.Effect<ModerationResult, ModerationError> =>
  pipe(
    // Simulate API call with random failures
    Effect.sync(() => {
      const random = Math.random();
      
      if (random < 0.1) {
        // Simulate rate limit error
        throw new Error('Rate limit exceeded');
      }
      if (random < 0.2) {
        // Simulate network error
        throw new Error('Network timeout');
      }
      if (random < 0.3) {
        // Simulate service unavailable
        throw new Error('Service unavailable');
      }
      
      // Success case
      return {
        content,
        flagged: content.toLowerCase().includes('bad'),
        categories: content.toLowerCase().includes('bad') ? ['toxic'] : [],
        confidence: Math.random(),
        service: 'openai'
      };
    }),
    
    // TODO: Add error mapping
    Effect.mapError(error => {
      // Map different error messages to your domain errors
      throw new Error('TODO: Implement error mapping');
    }),
    
    // TODO: Add timeout
    Effect.timeout(Duration.seconds(10))
  );

// TODO: Implement Hugging Face moderation service
export const moderateWithHuggingFace = (content: string): Effect.Effect<ModerationResult, ModerationError> =>
  Effect.sync(() => {
    throw new Error('TODO: Implement Hugging Face service');
  });

// TODO: Implement local rules service (this one never fails)
export const moderateWithLocalRules = (content: string): Effect.Effect<ModerationResult, never> =>
  Effect.sync(() => {
    throw new Error('TODO: Implement local rules');
  });
```

### Phase 3: Fallback Logic Implementation (25 minutes)

**Instructions:**
- Create the main moderation pipeline
- Implement specific error handling for each error type
- Add fallback chains
- Test different failure scenarios

**Starter Code (`src/moderator.ts`):**
```typescript
import { Effect, pipe, Schedule, Duration } from 'effect';
import { moderateWithOpenAI, moderateWithHuggingFace, moderateWithLocalRules } from './services';
import { ModerationError } from './errors';

// TODO: Implement input validation
const validateContent = (content: string) =>
  pipe(
    Effect.sync(() => content.trim()),
    Effect.flatMap(trimmed => {
      // Add validation logic here
      return Effect.succeed(trimmed);
    })
  );

// TODO: Create smart retry policy
const retryPolicy = Schedule.recurWhile((error: ModerationError) => {
  // Determine which errors should be retried
  return false; // TODO: Implement logic
});

// TODO: Implement the main moderation pipeline
export const moderateContent = (content: string) =>
  pipe(
    validateContent(content),
    Effect.flatMap(validContent =>
      pipe(
        // Try OpenAI first
        moderateWithOpenAI(validContent),
        
        // TODO: Add specific error handling
        Effect.catchTag('RateLimitError', (error) => {
          // Handle rate limiting
          return Effect.fail(error);
        }),
        
        // TODO: Add fallback to Hugging Face
        Effect.orElse(() => {
          // Fallback logic
          return moderateWithHuggingFace(validContent);
        }),
        
        // TODO: Add final fallback to local rules
        Effect.orElse(() => moderateWithLocalRules(validContent)),
        
        // TODO: Add retry logic
        Effect.retry(retryPolicy)
      )
    )
  );

// Test program
const program = pipe(
  moderateContent('This is some test content with bad words'),
  Effect.tap(result => Effect.sync(() => console.log('Result:', result))),
  Effect.catchAll(error => 
    Effect.sync(() => console.error('Error:', error))
  )
);

Effect.runPromise(program);
```

### Workshop Debrief (10 minutes)

**Questions to ask:**
- "What was different about modeling errors as data?"
- "How did `catchTag` change your approach to error handling?"
- "What errors did you not think of initially?"
- "How would you test this error handling?"

---

## 🎯 Advanced Error Patterns (15 minutes)

### Error Accumulation
```typescript
// When you want to collect multiple errors instead of failing fast
const validateContentComprehensive = (content: Content) =>
  Effect.all({
    length: validateLength(content.text),
    language: validateLanguage(content.text),
    toxicity: validateToxicity(content.text),
    spam: validateSpam(content.text)
  }, { mode: "validate" }); // This collects ALL errors, doesn't fail fast
```

### Error Transformation
```typescript
// Transform errors between different layers
const mapToUserFriendlyError = (error: ModerationError): UserError => {
  switch (error._tag) {
    case 'ContentTooLongError':
      return new UserError({ message: 'Please shorten your message' });
    case 'RateLimitError':
      return new UserError({ message: 'Please wait a moment and try again' });
    default:
      return new UserError({ message: 'Something went wrong, please try again' });
  }
};

const userFriendlyModeration = (content: string) =>
  pipe(
    moderateContent(content),
    Effect.mapError(mapToUserFriendlyError)
  );
```

### Circuit Breaker Pattern (Preview)
```typescript
// When a service is consistently failing, stop trying for a while
const circuitBreaker = makeCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: Duration.minutes(1)
});

const moderateWithCircuitBreaker = (content: string) =>
  pipe(
    moderateWithOpenAI(content),
    circuitBreaker.execute
  );
```

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Errors as Data**
- Design your error types first, like you design your success types
- Use tagged errors to make error handling explicit
- The compiler becomes your ally in error handling

**2. Error Composition**
- `catchTag` for handling specific errors
- `catchTags` for handling multiple specific errors
- `orElse` for fallback chains
- `catchAll` for generic error handling

**3. Smart Retry Logic**
- Not all errors should be retried
- Use `Schedule.recurWhile` to retry based on error type
- Combine with exponential backoff and maximum attempts

**4. Error Recovery Strategies**
- Primary service → Fallback service → Local rules
- Specific handling for specific errors (rate limits, timeouts)
- Graceful degradation instead of complete failure

### Connection to Week 1
"Remember last week when we used `catchAll` and `retry`? Those were the training wheels. This week we learned to design error hierarchies that make our intent explicit and our error handling composable."

### Bridge to Week 3
"Great! Now we have robust error handling. But what happens when we need to moderate 1000 pieces of content? Or when we want to moderate content in real-time as users type? That's where concurrency comes in. Next week, we'll learn how Effect makes concurrent programming safe and composable."

### Homework Assignment

**Add a caching layer to your moderator:**
1. Cache results for identical content
2. Handle cache misses and cache invalidation errors properly
3. Think about what happens when the cache service is down - should that fail the whole operation?
4. Add metrics: cache hit rate, error rates by service, response times

**Bonus challenges:**
- Add a web API that exposes your moderation service
- Implement different moderation policies for different content types
- Add user reputation scoring based on moderation history

---

## 🎓 Assessment Rubric

### During Class Assessment
- [ ] Student designs appropriate error hierarchies
- [ ] Student uses `catchTag` vs `catchAll` appropriately  
- [ ] Student understands retryable vs non-retryable errors
- [ ] Student can compose fallback chains effectively

### Take Home Assessment
- [ ] **Working moderator** with at least 3 error types and fallback chain
- [ ] **Proper error mapping** from infrastructure errors to domain errors
- [ ] **Smart retry logic** that only retries appropriate errors
- [ ] **Written reflection**: "How did explicit error types change your approach to error handling?"

### Red Flags to Watch For
- Using generic Error types (old habits die hard)
- Making everything retryable
- Not understanding the difference between expected and unexpected errors
- Overcomplicating the error hierarchy

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Error Handling](https://effect.website/docs/error-handling)
- [Effect Documentation: Tagged Errors](https://effect.website/docs/data-types/data#tagged-errors)

### Code Examples
- [Complete Content Moderator Example](./examples/content-moderator/)
- [Error Composition Patterns](./examples/error-composition/)
- [Retry Strategies](./examples/retry-strategies/)

### Next Week Prep
- Think about scenarios where you need to process many items concurrently
- Consider: What are the bottlenecks in AI processing pipelines?
- Read about resource management and why it matters

---

*"Good error handling is not about preventing errors - it's about making errors explicit, recoverable, and composable."*