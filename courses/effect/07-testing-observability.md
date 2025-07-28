# Week 7: Testing & Observability
## Shipping AI Systems with Confidence

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Master Effect's testing ecosystem** with property-based testing and test environments
- **Design comprehensive testing strategies** for non-deterministic AI systems
- **Build production observability** with metrics, tracing, and structured logging
- **Create AI-specific monitoring dashboards** that track model performance and accuracy
- **Implement chaos engineering** to validate system resilience under failure conditions

---

## 🔥 Opening Challenge: When Your AI System Fails in Production (25 minutes)

### The Scenario
It's 3 AM and you get the dreaded phone call. Your AI orchestrator is down. Users are complaining about slow responses, some models are returning garbage, and your error rate just spiked to 15%. You have no idea what's happening because:

- Your tests only covered the happy path
- You have basic logs but no structured observability
- You can't tell which models are failing or why
- You don't know if it's a code bug, model drift, or infrastructure issue
- You have no way to reproduce the failure locally

### Live Coding: The Debugging Nightmare

```typescript
// production-failure-scenario.ts - When things go wrong at 3 AM
import { Effect, pipe } from 'effect';

// This is what your production logs look like when things go wrong
class ProductionIncident {
  private logs: string[] = [];
  private errors: any[] = [];
  private startTime = Date.now();

  constructor() {
    this.simulateProductionTraffic();
    this.simulateRandomFailures();
    this.showPoorObservability();
  }

  private simulateProductionTraffic(): void {
    setInterval(() => {
      const operations = [
        'text-processing',
        'image-analysis', 
        'sentiment-analysis',
        'content-moderation'
      ];
      
      const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-2', 'llama-2'];
      const users = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      
      const operation = operations[Math.floor(Math.random() * operations.length)];
      const model = models[Math.floor(Math.random() * models.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Problem 1: Unstructured logging
      console.log(`Processing ${operation} for ${user} with ${model}`);
      
      // Problem 2: No correlation IDs
      // Problem 3: No timing information
      // Problem 4: No context about what the request actually was
      
    }, 50); // 20 requests per second
  }

  private simulateRandomFailures(): void {
    setInterval(() => {
      const failureTypes = [
        'Model timeout',
        'Out of memory',
        'Rate limit exceeded', 
        'Invalid input format',
        'Model returned empty response',
        'Circuit breaker open',
        'Database connection failed',
        'Cache miss storm'
      ];
      
      if (Math.random() < 0.1) { // 10% chance of failure
        const failure = failureTypes[Math.floor(Math.random() * failureTypes.length)];
        
        // Problem 5: Generic error logging with no context
        console.error(`ERROR: ${failure}`);
        this.errors.push({ 
          message: failure, 
          timestamp: new Date(),
          // Missing: user ID, request ID, model used, input data, stack trace
        });
        
        // Problem 6: No structured error data for analysis
        // Problem 7: No alerting or automatic recovery
      }
    }, 1000);
  }

  private showPoorObservability(): void {
    setInterval(() => {
      const uptime = Date.now() - this.startTime;
      const errorRate = (this.errors.length / (uptime / 1000)) * 100;
      
      // Problem 8: Basic metrics with no actionable insights
      console.log('\n=== BASIC SYSTEM STATS ===');
      console.log(`Uptime: ${Math.floor(uptime / 1000)}s`);
      console.log(`Total errors: ${this.errors.length}`);
      console.log(`Error rate: ${errorRate.toFixed(2)} errors/second`);
      
      // Problem 9: No model-specific metrics
      // Problem 10: No user experience metrics (latency, accuracy)
      // Problem 11: No business metrics (cost, usage patterns)
      // Problem 12: No correlation between metrics and actual problems
      
      if (this.errors.length > 10) {
        console.warn('⚠️ High error rate detected, but no automated response!');
      }
      
      // Problem 13: No distributed tracing
      // Problem 14: No performance profiling
      // Problem 15: No way to replay or debug specific requests
      
    }, 5000);
  }

  // This is what debugging looks like without proper observability
  public debugIncident(): void {
    console.log('\n🚨 PRODUCTION INCIDENT - 3 AM DEBUGGING SESSION');
    console.log('Developer: "What happened?"');
    console.log('Logs: "Model timeout"');
    console.log('Developer: "Which model? For which user? What input?"');
    console.log('Logs: "..."');
    console.log('Developer: "Is it happening to everyone or just some users?"');
    console.log('Logs: "..."');
    console.log('Developer: "What was the system state when this started?"');
    console.log('Logs: "..."');
    console.log('Developer: "Can I reproduce this locally?"');
    console.log('System: "Good luck with that 🤷‍♂️"');
    
    console.log('\n🔍 WHAT WE NEED:');
    console.log('- Structured logging with correlation IDs');
    console.log('- Distributed tracing across service boundaries');
    console.log('- Model-specific performance metrics');
    console.log('- Request replay capabilities');
    console.log('- Automated anomaly detection');
    console.log('- Comprehensive test coverage including edge cases');
    console.log('- Chaos engineering to validate resilience');
  }
}

// Demo the incident
const incident = new ProductionIncident();

setTimeout(() => {
  incident.debugIncident();
}, 10000);
```

### The Testing Problem

```typescript
// inadequate-testing.ts - Why most AI system tests are insufficient
describe('AI System Tests - The Inadequate Version', () => {
  
  // Problem 1: Only testing the happy path
  it('should process text successfully', async () => {
    const result = await aiSystem.processText('Hello world');
    expect(result).toBeDefined();
    expect(result.sentiment).toBe('neutral');
  });
  
  // Problem 2: Not testing error conditions
  // What happens when:
  // - The AI model returns malformed JSON?
  // - The model takes 30 seconds to respond?
  // - The model returns a 500 error?
  // - The input is 10MB of text?
  // - The model returns different results for the same input?
  
  // Problem 3: Not testing concurrent scenarios
  // What happens when:
  // - 1000 users hit the system simultaneously?
  // - The resource pool is exhausted?
  // - Multiple models fail at the same time?
  
  // Problem 4: Not testing system integration
  // What happens when:
  // - The cache is down?
  // - The database is slow?
  // - Network partitions occur?
  
  // Problem 5: Not testing AI-specific concerns
  // - Model drift over time
  // - Biased outputs for certain inputs
  // - Inconsistent results across model versions
  // - Performance degradation under load
});
```

### Discussion Questions (10 minutes)

**Ask the class:**
1. "How would you debug this production incident?"
   - "Start with the logs" - but the logs don't have enough context
   - "Check the metrics" - but basic metrics don't show root cause
   - "Try to reproduce it" - but you can't reproduce production conditions

2. "What's different about testing AI systems vs traditional systems?"
   - Non-deterministic outputs
   - External dependencies (model APIs)
   - Performance varies with input
   - Need to test for bias and fairness

3. "What observability do you need for AI systems?"
   - Model performance metrics (latency, accuracy, cost)
   - Request tracing across service boundaries
   - Input/output correlation for debugging
   - Business metrics (user satisfaction, conversion rates)

**The Setup:** "Let's build a comprehensive testing and observability strategy that gives us confidence in our AI systems."

---

## 🚀 Enter Effect Testing & Observability (85 minutes)

### Part 1: Comprehensive Testing Strategy (30 minutes)

```typescript
// ai-system-testing.ts - The comprehensive approach
import { Effect, pipe, TestEnvironment, Gen } from 'effect';
import { describe, it, expect } from '@effect/vitest';

// Test data generators for property-based testing
const genUserId = Gen.string({ minLength: 5, maxLength: 20 });
const genTextInput = Gen.string({ minLength: 1, maxLength: 1000 });
const genLargeTextInput = Gen.string({ minLength: 5000, maxLength: 50000 });
const genEmptyInput = Gen.constant('');
const genSpecialCharacters = Gen.string({ minLength: 10, maxLength: 100 })
  .pipe(Gen.map(s => s + '🚀💻🤖🎯🔥'));

// Mock AI services for testing
interface TestAIService {
  readonly predict: (input: string) => Effect.Effect<string, AIError>;
  readonly setLatency: (ms: number) => Effect.Effect<void, never>;
  readonly setErrorRate: (rate: number) => Effect.Effect<void, never>;
  readonly setResponse: (response: string) => Effect.Effect<void, never>;
}

const TestAIService = Context.GenericTag<TestAIService>('TestAIService');

const makeTestAIService = (): Effect.Effect<TestAIService, never> =>
  Effect.gen(function* () {
    const latency = yield* Ref.make(100);
    const errorRate = yield* Ref.make(0);
    const fixedResponse = yield* Ref.make<string | null>(null);
    
    return TestAIService.of({
      predict: (input: string) =>
        pipe(
          Ref.get(latency),
          Effect.flatMap(ms => Effect.sleep(Duration.millis(ms))),
          Effect.flatMap(() => Ref.get(errorRate)),
          Effect.flatMap(rate => {
            if (Math.random() < rate) {
              return Effect.fail(new AIError({ 
                service: 'test-ai', 
                reason: 'Simulated failure' 
              }));
            }
            
            return pipe(
              Ref.get(fixedResponse),
              Effect.map(fixed => 
                fixed || `Test response for: ${input.substring(0, 50)}...`
              )
            );
          })
        ),
      
      setLatency: (ms: number) => Ref.set(latency, ms),
      setErrorRate: (rate: number) => Ref.set(errorRate, rate),
      setResponse: (response: string) => Ref.set(fixedResponse, response)
    });
  });

// Property-based testing for AI systems
describe('AI System - Property-Based Tests', () => {
  
  it('should handle any valid text input without crashing', () =>
    Effect.gen(function* () {
      const testService = yield* makeTestAIService();
      const aiSystem = yield* AIOrchestrator.provide(TestAIService.of(testService));
      
      // Test with generated inputs
      yield* pipe(
        Gen.tuple(genUserId, genTextInput),
        Gen.sample(100), // Test 100 random combinations
        Effect.forEach(([userId, input]) =>
          pipe(
            aiSystem.predict(userId, input),
            Effect.either, // Don't fail the test on business logic errors
            Effect.map(result => {
              // Verify the system doesn't crash and returns structured data
              expect(result._tag).toMatch(/^(Left|Right)$/);
              if (result._tag === 'Right') {
                expect(result.right).toHaveProperty('response');
                expect(result.right).toHaveProperty('modelUsed');
                expect(result.right).toHaveProperty('latency');
              }
            })
          ),
          { concurrency: 10 }
        )
      );
    }).pipe(
      Effect.provide(TestEnvironment.TestEnvironment),
      Effect.runPromise
    )
  );
  
  it('should maintain performance characteristics under load', () =>
    Effect.gen(function* () {
      const testService = yield* makeTestAIService();
      yield* testService.setLatency(50); // Fast responses
      
      const aiSystem = yield* AIOrchestrator.provide(TestAIService.of(testService));
      
      const startTime = yield* Effect.sync(() => Date.now());
      
      // Simulate 100 concurrent requests
      yield* pipe(
        Array.from({ length: 100 }, (_, i) => `user-${i}`),
        Effect.forEach(
          userId =>
            pipe(
              aiSystem.predict(userId, 'Test input'),
              Effect.either
            ),
          { concurrency: 20 }
        )
      );
      
      const totalTime = yield* Effect.sync(() => Date.now() - startTime);
      
      // Verify performance characteristics
      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds
      
    }).pipe(
      Effect.provide(TestEnvironment.TestEnvironment),
      Effect.runPromise
    )
  );
  
  it('should handle failures gracefully', () =>
    Effect.gen(function* () {
      const testService = yield* makeTestAIService();
      yield* testService.setErrorRate(0.5); // 50% failure rate
      
      const aiSystem = yield* AIOrchestrator.provide(TestAIService.of(testService));
      
      const results = yield* pipe(
        Array.from({ length: 20 }, (_, i) => `test-input-${i}`),
        Effect.forEach(
          input =>
            pipe(
              aiSystem.predict('test-user', input),
              Effect.either
            ),
          { concurrency: 5 }
        )
      );
      
      const successes = results.filter(r => r._tag === 'Right').length;
      const failures = results.filter(r => r._tag === 'Left').length;
      
      // Verify the system handles partial failures
      expect(successes).toBeGreaterThan(0);
      expect(failures).toBeGreaterThan(0);
      expect(successes + failures).toBe(20);
      
    }).pipe(
      Effect.provide(TestEnvironment.TestEnvironment),
      Effect.runPromise
    )
  );
});

// Integration testing with real services (but controlled)
describe('AI System - Integration Tests', () => {
  
  it('should work end-to-end with mock services', () =>
    Effect.gen(function* () {
      // Test the full stack: HTTP -> Service -> AI -> Cache -> Response
      const request = {
        userId: 'integration-test-user',
        input: 'Analyze this text for sentiment and topics',
        experimentId: 'test-experiment'
      };
      
      const result = yield* aiSystem.predict(
        request.userId,
        request.input,
        { experimentId: request.experimentId }
      );
      
      expect(result.response).toBeDefined();
      expect(result.modelUsed).toBeDefined();
      expect(result.latency).toBeGreaterThan(0);
      expect(typeof result.cached).toBe('boolean');
      
      // Test caching works
      const cachedResult = yield* aiSystem.predict(
        request.userId,
        request.input
      );
      
      expect(cachedResult.cached).toBe(true);
      expect(cachedResult.latency).toBeLessThan(result.latency);
      
    }).pipe(
      Effect.provide(TestEnvironment.TestEnvironment),
      Effect.runPromise
    )
  );
  
  it('should handle resource exhaustion', () =>
    Effect.gen(function* () {
      // Fill up the resource pool
      const resourcePool = yield* ModelPool;
      
      // Try to exhaust all resources
      const acquisitions = yield* pipe(
        Array.from({ length: 10 }, () => 'gpt-3.5-turbo'),
        Effect.forEach(
          modelName => 
            pipe(
              resourcePool.acquireModel(modelName),
              Effect.either
            ),
          { concurrency: 10 }
        )
      );
      
      const successful = acquisitions.filter(r => r._tag === 'Right').length;
      const failed = acquisitions.filter(r => r._tag === 'Left').length;
      
      // Should eventually hit resource limits
      expect(failed).toBeGreaterThan(0);
      
      // Clean up resources
      const successfulResources = acquisitions
        .filter(r => r._tag === 'Right')
        .map(r => r.right);
      
      yield* Effect.forEach(
        successfulResources,
        resource => resourcePool.releaseModel(resource),
        { concurrency: 10 }
      );
      
    }).pipe(
      Effect.provide(TestEnvironment.TestEnvironment),
      Effect.runPromise
    )
  );
});

// Chaos engineering tests
describe('AI System - Chaos Engineering', () => {
  
  it('should survive random service failures', () =>
    Effect.gen(function* () {
      const chaosService = yield* makeTestAIService();
      
      // Randomly introduce failures during the test
      const chaosEffect = pipe(
        Effect.forever(
          pipe(
            Effect.sleep(Duration.millis(100)),
            Effect.flatMap(() => {
              const chaos = Math.random();
              if (chaos < 0.1) {
                return chaosService.setErrorRate(0.8); // High error rate
              } else if (chaos < 0.2) {
                return chaosService.setLatency(5000); // High latency
              } else {
                return pipe(
                  chaosService.setErrorRate(0.05), // Normal error rate
                  Effect.flatMap(() => chaosService.setLatency(100))
                );
              }
            })
          )
        ),
        Effect.fork
      );
      
      const chaosFiber = yield* chaosEffect;
      
      // Run normal operations while chaos is happening
      const results = yield* pipe(
        Array.from({ length: 50 }, (_, i) => `chaos-test-${i}`),
        Effect.forEach(
          input =>
            pipe(
              aiSystem.predict('chaos-user', input),
              Effect.either,
              Effect.timeout(Duration.seconds(10)) // Don't wait forever
            ),
          { concurrency: 5 }
        )
      );
      
      yield* Fiber.interrupt(chaosFiber);
      
      // System should survive chaos - some requests succeed
      const successes = results.filter(r => 
        r._tag === 'Right' && r.right._tag === 'Right'
      ).length;
      
      expect(successes).toBeGreaterThan(0);
      
    }).pipe(
      Effect.provide(TestEnvironment.TestEnvironment),
      Effect.runPromise
    )
  );
});
```

### Part 2: Structured Logging & Tracing (25 minutes)

```typescript
// observability-system.ts - Production-grade observability
import { Effect, pipe, Context, Layer } from 'effect';
import { Logger, LogLevel } from 'effect/Logger';

// Structured logging with correlation IDs
interface LogContext {
  readonly requestId: string;
  readonly userId: string;
  readonly operation: string;
  readonly modelName?: string;
  readonly experimentId?: string;
  readonly timestamp: Date;
}

interface StructuredLogger {
  readonly info: (message: string, context: LogContext, metadata?: Record<string, any>) => Effect.Effect<void, never>;
  readonly warn: (message: string, context: LogContext, metadata?: Record<string, any>) => Effect.Effect<void, never>;
  readonly error: (message: string, context: LogContext, error?: unknown, metadata?: Record<string, any>) => Effect.Effect<void, never>;
  readonly debug: (message: string, context: LogContext, metadata?: Record<string, any>) => Effect.Effect<void, never>;
}

const StructuredLogger = Context.GenericTag<StructuredLogger>('StructuredLogger');

const StructuredLoggerLive = Layer.effect(
  StructuredLogger,
  Effect.gen(function* () {
    
    const formatLogEntry = (
      level: string,
      message: string,
      context: LogContext,
      error?: unknown,
      metadata?: Record<string, any>
    ) => {
      const entry = {
        timestamp: context.timestamp.toISOString(),
        level,
        message,
        requestId: context.requestId,
        userId: context.userId,
        operation: context.operation,
        modelName: context.modelName,
        experimentId: context.experimentId,
        metadata: metadata || {},
        ...(error && {
          error: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'UnknownError'
          }
        })
      };
      
      return JSON.stringify(entry);
    };
    
    return StructuredLogger.of({
      info: (message: string, context: LogContext, metadata?: Record<string, any>) =>
        Effect.sync(() => {
          console.log(formatLogEntry('INFO', message, context, undefined, metadata));
        }),
      
      warn: (message: string, context: LogContext, metadata?: Record<string, any>) =>
        Effect.sync(() => {
          console.warn(formatLogEntry('WARN', message, context, undefined, metadata));
        }),
      
      error: (message: string, context: LogContext, error?: unknown, metadata?: Record<string, any>) =>
        Effect.sync(() => {
          console.error(formatLogEntry('ERROR', message, context, error, metadata));
        }),
      
      debug: (message: string, context: LogContext, metadata?: Record<string, any>) =>
        Effect.sync(() => {
          console.debug(formatLogEntry('DEBUG', message, context, undefined, metadata));
        })
    });
  })
);

// Distributed tracing
interface TraceSpan {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly operationName: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly tags: Record<string, string | number | boolean>;
  readonly logs: Array<{ timestamp: Date; message: string; level: string }>;
}

interface Tracer {
  readonly startSpan: (operationName: string, parentSpan?: TraceSpan) => Effect.Effect<TraceSpan, never>;
  readonly finishSpan: (span: TraceSpan) => Effect.Effect<void, never>;
  readonly addTag: (span: TraceSpan, key: string, value: string | number | boolean) => Effect.Effect<TraceSpan, never>;
  readonly addLog: (span: TraceSpan, message: string, level?: string) => Effect.Effect<TraceSpan, never>;
}

const Tracer = Context.GenericTag<Tracer>('Tracer');

const TracerLive = Layer.effect(
  Tracer,
  Effect.gen(function* () {
    const activeSpans = yield* Ref.make(new Map<string, TraceSpan>());
    
    const generateId = () => Math.random().toString(36).substring(2, 15);
    
    return Tracer.of({
      startSpan: (operationName: string, parentSpan?: TraceSpan) =>
        Effect.gen(function* () {
          const span: TraceSpan = {
            traceId: parentSpan?.traceId || generateId(),
            spanId: generateId(),
            parentSpanId: parentSpan?.spanId,
            operationName,
            startTime: new Date(),
            tags: {},
            logs: []
          };
          
          yield* Ref.update(activeSpans, spans => spans.set(span.spanId, span));
          return span;
        }),
      
      finishSpan: (span: TraceSpan) =>
        pipe(
          Effect.sync(() => ({ ...span, endTime: new Date() })),
          Effect.tap(finishedSpan => 
            Effect.sync(() => {
              // In production, this would send to a tracing system like Jaeger
              console.log(`TRACE: ${JSON.stringify({
                traceId: finishedSpan.traceId,
                spanId: finishedSpan.spanId,
                parentSpanId: finishedSpan.parentSpanId,
                operationName: finishedSpan.operationName,
                duration: finishedSpan.endTime!.getTime() - finishedSpan.startTime.getTime(),
                tags: finishedSpan.tags,
                logs: finishedSpan.logs
              })}`);
            })
          ),
          Effect.flatMap(() => Ref.update(activeSpans, spans => {
            spans.delete(span.spanId);
            return spans;
          }))
        ),
      
      addTag: (span: TraceSpan, key: string, value: string | number | boolean) =>
        Effect.sync(() => ({
          ...span,
          tags: { ...span.tags, [key]: value }
        })),
      
      addLog: (span: TraceSpan, message: string, level = 'INFO') =>
        Effect.sync(() => ({
          ...span,
          logs: [...span.logs, { timestamp: new Date(), message, level }]
        }))
    });
  })
);

// Instrumented AI Orchestrator with observability
const InstrumentedAIOrchestrator = Layer.effect(
  AIOrchestrator,
  Effect.gen(function* () {
    const modelPool = yield* ModelPool;
    const cache = yield* CacheService;
    const experiments = yield* ExperimentService;
    const logger = yield* StructuredLogger;
    const tracer = yield* Tracer;
    
    return AIOrchestrator.of({
      predict: (userId: string, input: string, options = {}) =>
        Effect.gen(function* () {
          const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const rootSpan = yield* tracer.startSpan('ai-prediction');
          
          const logContext: LogContext = {
            requestId,
            userId,
            operation: 'predict',
            experimentId: options.experimentId,
            timestamp: new Date()
          };
          
          yield* logger.info('Starting AI prediction', logContext, {
            inputLength: input.length,
            options
          });
          
          const startTime = Date.now();
          
          try {
            // Add tracing tags
            let taggedSpan = yield* tracer.addTag(rootSpan, 'user.id', userId);
            taggedSpan = yield* tracer.addTag(taggedSpan, 'input.length', input.length);
            
            const cacheKey = `${userId}-${input.substring(0, 100)}`;
            
            // Try cache first
            const cacheSpan = yield* tracer.startSpan('cache-lookup', taggedSpan);
            const cached = yield* cache.get(cacheKey);
            yield* tracer.finishSpan(cacheSpan);
            
            if (cached._tag === 'Some') {
              const latency = Date.now() - startTime;
              
              yield* logger.info('Cache hit', logContext, {
                latency,
                cacheKey: cacheKey.substring(0, 50)
              });
              
              yield* tracer.addTag(taggedSpan, 'cache.hit', true);
              yield* tracer.finishSpan(taggedSpan);
              
              return {
                response: cached.value,
                modelUsed: 'cache',
                latency,
                cached: true
              };
            }
            
            yield* tracer.addTag(taggedSpan, 'cache.hit', false);
            
            // Determine model to use
            const modelSelectionSpan = yield* tracer.startSpan('model-selection', taggedSpan);
            const modelOption = options.experimentId
              ? yield* experiments.getVariant(userId, options.experimentId)
              : Effect.succeed(Option.some('gpt-3.5-turbo'));
            
            const modelName = modelOption._tag === 'Some' ? modelOption.value : 'gpt-3.5-turbo';
            yield* tracer.addTag(modelSelectionSpan, 'model.name', modelName);
            yield* tracer.finishSpan(modelSelectionSpan);
            
            const updatedLogContext = { ...logContext, modelName };
            
            yield* logger.info('Selected model', updatedLogContext, {
              modelName,
              fromExperiment: options.experimentId !== undefined
            });
            
            // Acquire model instance
            const modelAcquisitionSpan = yield* tracer.startSpan('model-acquisition', taggedSpan);
            const instance = yield* modelPool.acquireModel(modelName);
            yield* tracer.finishSpan(modelAcquisitionSpan);
            
            // Make prediction
            const predictionSpan = yield* tracer.startSpan('model-prediction', taggedSpan);
            const response = yield* instance.predict(input);
            yield* tracer.finishSpan(predictionSpan);
            
            // Cache result
            const cacheStoreSpan = yield* tracer.startSpan('cache-store', taggedSpan);
            yield* cache.set(cacheKey, response, Duration.minutes(30));
            yield* tracer.finishSpan(cacheStoreSpan);
            
            // Release model
            yield* modelPool.releaseModel(instance);
            
            const latency = Date.now() - startTime;
            
            yield* logger.info('AI prediction completed', updatedLogContext, {
              latency,
              responseLength: response.length,
              cached: false
            });
            
            yield* tracer.addTag(taggedSpan, 'prediction.latency', latency);
            yield* tracer.addTag(taggedSpan, 'prediction.success', true);
            yield* tracer.finishSpan(taggedSpan);
            
            return {
              response,
              modelUsed: modelName,
              latency,
              cached: false
            };
            
          } catch (error) {
            const latency = Date.now() - startTime;
            
            yield* logger.error('AI prediction failed', logContext, error, {
              latency,
              inputLength: input.length
            });
            
            yield* tracer.addTag(rootSpan, 'prediction.success', false);
            yield* tracer.addTag(rootSpan, 'error.type', error.constructor.name);
            yield* tracer.finishSpan(rootSpan);
            
            return Effect.fail(error);
          }
        }),
      
      getSystemStats: () =>
        pipe(
          Effect.all({
            pools: modelPool.getPoolStats(),
            cache: cache.getStats(),
            experiments: Effect.succeed({})
          })
        )
    });
  })
);
```

### Part 3: Metrics & Monitoring Dashboards (30 minutes)

```typescript
// metrics-system.ts - Production metrics and monitoring
import { Effect, pipe, Ref, Schedule, Duration } from 'effect';

// Metrics collection
interface MetricValue {
  readonly timestamp: Date;
  readonly value: number;
  readonly tags: Record<string, string>;
}

interface Metrics {
  readonly counter: (name: string, value: number, tags?: Record<string, string>) => Effect.Effect<void, never>;
  readonly gauge: (name: string, value: number, tags?: Record<string, string>) => Effect.Effect<void, never>;
  readonly histogram: (name: string, value: number, tags?: Record<string, string>) => Effect.Effect<void, never>;
  readonly timer: <A, E>(name: string, effect: Effect.Effect<A, E>, tags?: Record<string, string>) => Effect.Effect<A, E>;
}

const Metrics = Context.GenericTag<Metrics>('Metrics');

const MetricsLive = Layer.effect(
  Metrics,
  Effect.gen(function* () {
    const counters = yield* Ref.make(new Map<string, number>());
    const gauges = yield* Ref.make(new Map<string, MetricValue>());
    const histograms = yield* Ref.make(new Map<string, MetricValue[]>());
    
    // Periodically export metrics (in production, this would go to Prometheus/DataDog)
    const exportMetrics = pipe(
      Effect.all({
        counters: Ref.get(counters),
        gauges: Ref.get(gauges),
        histograms: Ref.get(histograms)
      }),
      Effect.tap(({ counters, gauges, histograms }) =>
        Effect.sync(() => {
          console.log('\n📊 METRICS EXPORT:');
          
          // Counter metrics
          for (const [name, value] of counters.entries()) {
            console.log(`COUNTER ${name}: ${value}`);
          }
          
          // Gauge metrics
          for (const [name, metric] of gauges.entries()) {
            console.log(`GAUGE ${name}: ${metric.value} (tags: ${JSON.stringify(metric.tags)})`);
          }
          
          // Histogram metrics (show recent values)
          for (const [name, values] of histograms.entries()) {
            const recent = values.slice(-10); // Last 10 values
            const avg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
            const min = Math.min(...recent.map(v => v.value));
            const max = Math.max(...recent.map(v => v.value));
            console.log(`HISTOGRAM ${name}: avg=${avg.toFixed(2)}, min=${min}, max=${max}`);
          }
        })
      )
    );
    
    // Export metrics every 30 seconds
    yield* pipe(
      exportMetrics,
      Effect.repeat(Schedule.fixed(Duration.seconds(30))),
      Effect.fork
    );
    
    return Metrics.of({
      counter: (name: string, value: number, tags = {}) =>
        Ref.update(counters, map => {
          const key = `${name}:${JSON.stringify(tags)}`;
          const current = map.get(key) || 0;
          map.set(key, current + value);
          return map;
        }),
      
      gauge: (name: string, value: number, tags = {}) =>
        Ref.update(gauges, map => {
          const key = `${name}:${JSON.stringify(tags)}`;
          map.set(key, {
            timestamp: new Date(),
            value,
            tags
          });
          return map;
        }),
      
      histogram: (name: string, value: number, tags = {}) =>
        Ref.update(histograms, map => {
          const key = `${name}:${JSON.stringify(tags)}`;
          const current = map.get(key) || [];
          const updated = [...current, {
            timestamp: new Date(),
            value,
            tags
          }].slice(-1000); // Keep last 1000 values
          map.set(key, updated);
          return map;
        }),
      
      timer: <A, E>(name: string, effect: Effect.Effect<A, E>, tags = {}) =>
        pipe(
          Effect.sync(() => Date.now()),
          Effect.flatMap(startTime =>
            pipe(
              effect,
              Effect.tap(() => {
                const duration = Date.now() - startTime;
                return pipe(
                  Ref.update(histograms, map => {
                    const key = `${name}:${JSON.stringify(tags)}`;
                    const current = map.get(key) || [];
                    const updated = [...current, {
                      timestamp: new Date(),
                      value: duration,
                      tags
                    }].slice(-1000);
                    map.set(key, updated);
                    return map;
                  })
                );
              })
            )
          )
        )
    });
  })
);

// AI-specific metrics
interface AIMetrics {
  readonly recordPrediction: (modelName: string, latency: number, success: boolean, cached: boolean) => Effect.Effect<void, never>;
  readonly recordModelLoad: (modelName: string, loadTime: number, success: boolean) => Effect.Effect<void, never>;
  readonly recordCacheOperation: (operation: 'hit' | 'miss' | 'set', latency: number) => Effect.Effect<void, never>;
  readonly recordExperimentResult: (experimentId: string, variant: string, success: boolean) => Effect.Effect<void, never>;
}

const AIMetrics = Context.GenericTag<AIMetrics>('AIMetrics');

const AIMetricsLive = Layer.effect(
  AIMetrics,
  Effect.gen(function* () {
    const metrics = yield* Metrics;
    
    return AIMetrics.of({
      recordPrediction: (modelName: string, latency: number, success: boolean, cached: boolean) =>
        pipe(
          metrics.counter('ai.predictions.total', 1, { model: modelName, success: String(success), cached: String(cached) }),
          Effect.flatMap(() => metrics.histogram('ai.predictions.latency', latency, { model: modelName })),
          Effect.flatMap(() => 
            success 
              ? metrics.counter('ai.predictions.success', 1, { model: modelName })
              : metrics.counter('ai.predictions.error', 1, { model: modelName })
          )
        ),
      
      recordModelLoad: (modelName: string, loadTime: number, success: boolean) =>
        pipe(
          metrics.counter('ai.model.loads', 1, { model: modelName, success: String(success) }),
          Effect.flatMap(() => 
            success 
              ? metrics.histogram('ai.model.load_time', loadTime, { model: modelName })
              : Effect.unit
          )
        ),
      
      recordCacheOperation: (operation: 'hit' | 'miss' | 'set', latency: number) =>
        pipe(
          metrics.counter(`ai.cache.${operation}`, 1),
          Effect.flatMap(() => metrics.histogram('ai.cache.latency', latency, { operation }))
        ),
      
      recordExperimentResult: (experimentId: string, variant: string, success: boolean) =>
        metrics.counter('ai.experiments.results', 1, { 
          experiment: experimentId, 
          variant, 
          success: String(success) 
        })
    });
  })
);

// Monitored AI Orchestrator
const MonitoredAIOrchestrator = Layer.effect(
  AIOrchestrator,
  Effect.gen(function* () {
    const modelPool = yield* ModelPool;
    const cache = yield* CacheService;
    const experiments = yield* ExperimentService;
    const logger = yield* StructuredLogger;
    const tracer = yield* Tracer;
    const aiMetrics = yield* AIMetrics;
    
    return AIOrchestrator.of({
      predict: (userId: string, input: string, options = {}) =>
        pipe(
          Effect.gen(function* () {
            const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const startTime = Date.now();
            
            const logContext: LogContext = {
              requestId,
              userId,
              operation: 'predict',
              experimentId: options.experimentId,
              timestamp: new Date()
            };
            
            const cacheKey = `${userId}-${input.substring(0, 100)}`;
            
            // Try cache first
            const cacheStartTime = Date.now();
            const cached = yield* cache.get(cacheKey);
            const cacheLatency = Date.now() - cacheStartTime;
            
            if (cached._tag === 'Some') {
              const totalLatency = Date.now() - startTime;
              
              yield* aiMetrics.recordCacheOperation('hit', cacheLatency);
              yield* aiMetrics.recordPrediction('cache', totalLatency, true, true);
              
              return {
                response: cached.value,
                modelUsed: 'cache',
                latency: totalLatency,
                cached: true
              };
            }
            
            yield* aiMetrics.recordCacheOperation('miss', cacheLatency);
            
            // Determine model
            const modelOption = options.experimentId
              ? yield* experiments.getVariant(userId, options.experimentId)
              : Effect.succeed(Option.some('gpt-3.5-turbo'));
            
            const modelName = modelOption._tag === 'Some' ? modelOption.value : 'gpt-3.5-turbo';
            
            // Acquire and use model
            const instance = yield* modelPool.acquireModel(modelName);
            const predictionStartTime = Date.now();
            const response = yield* instance.predict(input);
            const predictionLatency = Date.now() - predictionStartTime;
            
            // Cache result
            const cacheSetStartTime = Date.now();
            yield* cache.set(cacheKey, response, Duration.minutes(30));
            const cacheSetLatency = Date.now() - cacheSetStartTime;
            
            yield* modelPool.releaseModel(instance);
            
            const totalLatency = Date.now() - startTime;
            
            // Record metrics
            yield* aiMetrics.recordPrediction(modelName, predictionLatency, true, false);
            yield* aiMetrics.recordCacheOperation('set', cacheSetLatency);
            
            if (options.experimentId) {
              yield* aiMetrics.recordExperimentResult(options.experimentId, modelName, true);
            }
            
            return {
              response,
              modelUsed: modelName,
              latency: totalLatency,
              cached: false
            };
          }),
          // Wrap with error handling and metrics
          Effect.catchAll(error => {
            const errorLatency = Date.now() - Date.now(); // This would be calculated properly
            return pipe(
              aiMetrics.recordPrediction('unknown', errorLatency, false, false),
              Effect.flatMap(() => Effect.fail(error))
            );
          })
        ),
      
      getSystemStats: () =>
        pipe(
          Effect.all({
            pools: modelPool.getPoolStats(),
            cache: cache.getStats(),
            experiments: Effect.succeed({})
          })
        )
    });
  })
);

// Health checks and alerting
interface HealthCheck {
  readonly name: string;
  readonly check: () => Effect.Effect<{ healthy: boolean; message: string }, never>;
}

interface HealthMonitor {
  readonly addCheck: (check: HealthCheck) => Effect.Effect<void, never>;
  readonly runChecks: () => Effect.Effect<Array<{ name: string; healthy: boolean; message: string }>, never>;
  readonly startMonitoring: () => Effect.Effect<void, never>;
}

const HealthMonitor = Context.GenericTag<HealthMonitor>('HealthMonitor');

const HealthMonitorLive = Layer.effect(
  HealthMonitor,
  Effect.gen(function* () {
    const checks = yield* Ref.make(new Array<HealthCheck>());
    const metrics = yield* Metrics;
    
    return HealthMonitor.of({
      addCheck: (check: HealthCheck) =>
        Ref.update(checks, arr => [...arr, check]),
      
      runChecks: () =>
        pipe(
          Ref.get(checks),
          Effect.flatMap(checkList =>
            Effect.forEach(
              checkList,
              check =>
                pipe(
                  check.check(),
                  Effect.map(result => ({
                    name: check.name,
                    healthy: result.healthy,
                    message: result.message
                  }))
                ),
              { concurrency: 10 }
            )
          )
        ),
      
      startMonitoring: () =>
        pipe(
          Effect.gen(function* () {
            const results = yield* Effect.flatMap(Ref.get(checks), checkList =>
              Effect.forEach(
                checkList,
                check =>
                  pipe(
                    check.check(),
                    Effect.map(result => ({
                      name: check.name,
                      healthy: result.healthy,
                      message: result.message
                    }))
                  ),
                { concurrency: 10 }
              )
            );
            
            // Record health metrics
            yield* Effect.forEach(
              results,
              result => metrics.gauge(`health.${result.name}`, result.healthy ? 1 : 0),
              { concurrency: 10 }
            );
            
            // Log unhealthy services
            const unhealthy = results.filter(r => !r.healthy);
            if (unhealthy.length > 0) {
              console.warn('🚨 UNHEALTHY SERVICES:', unhealthy);
            }
            
            return results;
          }),
          Effect.repeat(Schedule.fixed(Duration.seconds(30))),
          Effect.fork
        )
    });
  })
);
```

---

## 🛠️ Hands-On Workshop: Build Your Testing & Observability Suite (75 minutes)

### Setup (10 minutes)

```bash
mkdir ai-testing-observability
cd ai-testing-observability
npm init -y
npm install effect @effect/vitest vitest
npm install -D typescript @types/node tsx
```

### Phase 1: Property-Based Testing (25 minutes)

**Instructions:**
- Form pairs
- Write property-based tests for your AI system
- Test edge cases and error conditions
- Implement chaos engineering tests

**Starter Code (`src/__tests__/property-tests.ts`):**
```typescript
import { Effect, pipe, Gen } from 'effect';
import { describe, it, expect } from '@effect/vitest';

// TODO: Define test data generators
const genUserId = Gen.string({ minLength: 1, maxLength: 50 });
const genTextInput = Gen.string({ minLength: 1, maxLength: 1000 });
const genEmptyInput = Gen.constant('');
const genLargeInput = Gen.string({ minLength: 10000, maxLength: 50000 });

// TODO: Create mock AI service for testing
interface MockAIService {
  readonly predict: (input: string) => Effect.Effect<string, Error>;
  readonly setFailureRate: (rate: number) => Effect.Effect<void, never>;
  readonly setLatency: (ms: number) => Effect.Effect<void, never>;
}

const makeMockAIService = (): Effect.Effect<MockAIService, never> =>
  Effect.gen(function* () {
    const failureRate = yield* Ref.make(0);
    const latency = yield* Ref.make(100);
    
    return {
      predict: (input: string) =>
        pipe(
          Ref.get(latency),
          Effect.flatMap(ms => Effect.sleep(Duration.millis(ms))),
          Effect.flatMap(() => Ref.get(failureRate)),
          Effect.flatMap(rate => {
            if (Math.random() < rate) {
              return Effect.fail(new Error('Mock service failure'));
            }
            return Effect.succeed(`Mock response for: ${input.substring(0, 20)}...`);
          })
        ),
      
      setFailureRate: (rate: number) => Ref.set(failureRate, rate),
      setLatency: (ms: number) => Ref.set(latency, ms)
    };
  });

describe('AI System Property Tests', () => {
  
  // TODO: Test that system handles any valid input
  it('should handle any valid text input without crashing', () =>
    Effect.gen(function* () {
      const mockService = yield* makeMockAIService();
      
      // Generate 50 random test cases
      const testCases = yield* pipe(
        Gen.tuple(genUserId, genTextInput),
        Gen.sample(50)
      );
      
      const results = yield* Effect.forEach(
        testCases,
        ([userId, input]) =>
          pipe(
            mockService.predict(input),
            Effect.either // Don't fail the test on business errors
          ),
        { concurrency: 5 }
      );
      
      // Verify we got responses for all inputs
      expect(results).toHaveLength(50);
      
      // Verify no unexpected crashes
      const crashes = results.filter(r => 
        r._tag === 'Left' && !(r.left instanceof Error)
      );
      expect(crashes).toHaveLength(0);
      
    }).pipe(Effect.runPromise)
  );
  
  // TODO: Test system behavior under load
  it('should maintain performance under concurrent load', () =>
    Effect.gen(function* () {
      const mockService = yield* makeMockAIService();
      yield* mockService.setLatency(50); // Fast responses
      
      const startTime = Date.now();
      
      // Simulate 100 concurrent requests
      const results = yield* Effect.forEach(
        Array.from({ length: 100 }, (_, i) => `request-${i}`),
        input => 
          pipe(
            mockService.predict(input),
            Effect.either
          ),
        { concurrency: 20 }
      );
      
      const totalTime = Date.now() - startTime;
      const successCount = results.filter(r => r._tag === 'Right').length;
      
      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(successCount).toBeGreaterThan(90); // Most requests should succeed
      
    }).pipe(Effect.runPromise)
  );
  
  // TODO: Test error recovery
  it('should recover gracefully from failures', () =>
    Effect.gen(function* () {
      const mockService = yield* makeMockAIService();
      yield* mockService.setFailureRate(0.3); // 30% failure rate
      
      const results = yield* Effect.forEach(
        Array.from({ length: 50 }, (_, i) => `test-${i}`),
        input =>
          pipe(
            mockService.predict(input),
            Effect.retry(Schedule.recurs(2)), // Retry failed requests
            Effect.either
          ),
        { concurrency: 10 }
      );
      
      const successes = results.filter(r => r._tag === 'Right').length;
      const failures = results.filter(r => r._tag === 'Left').length;
      
      // Should have some successes despite failures
      expect(successes).toBeGreaterThan(0);
      expect(successes + failures).toBe(50);
      
      // Retry should improve success rate
      expect(successes).toBeGreaterThan(30); // Better than 30% due to retries
      
    }).pipe(Effect.runPromise)
  );
});

// TODO: Add chaos engineering tests
describe('Chaos Engineering Tests', () => {
  
  it('should survive random service degradation', () =>
    Effect.gen(function* () {
      const mockService = yield* makeMockAIService();
      
      // Start chaos monkey
      const chaosEffect = pipe(
        Effect.forever(
          pipe(
            Effect.sleep(Duration.millis(200)),
            Effect.flatMap(() => {
              const chaos = Math.random();
              if (chaos < 0.2) {
                return mockService.setFailureRate(0.8); // High failure rate
              } else if (chaos < 0.4) {
                return mockService.setLatency(2000); // High latency
              } else {
                return pipe(
                  mockService.setFailureRate(0.1),
                  Effect.flatMap(() => mockService.setLatency(100))
                );
              }
            })
          )
        ),
        Effect.fork
      );
      
      const chaosFiber = yield* chaosEffect;
      
      // Run requests while chaos is happening
      const results = yield* Effect.forEach(
        Array.from({ length: 30 }, (_, i) => `chaos-${i}`),
        input =>
          pipe(
            mockService.predict(input),
            Effect.timeout(Duration.seconds(5)), // Don't wait forever
            Effect.retry(Schedule.recurs(1)),
            Effect.either
          ),
        { concurrency: 5 }
      );
      
      yield* Fiber.interrupt(chaosFiber);
      
      // System should survive chaos
      const successes = results.filter(r => r._tag === 'Right').length;
      expect(successes).toBeGreaterThan(0);
      
    }).pipe(Effect.runPromise)
  );
});
```

### Phase 2: Structured Logging (25 minutes)

**Instructions:**
- Implement structured logging with correlation IDs
- Add distributed tracing for request flows
- Create log aggregation and search

**Starter Code (`src/observability.ts`):**
```typescript
import { Effect, pipe, Context, Layer, Ref } from 'effect';

// TODO: Define structured log entry
interface LogEntry {
  readonly timestamp: string;
  readonly level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  readonly message: string;
  readonly requestId: string;
  readonly userId?: string;
  readonly operation: string;
  readonly metadata: Record<string, any>;
  readonly error?: {
    readonly message: string;
    readonly stack?: string;
    readonly name: string;
  };
}

// TODO: Implement structured logger
interface StructuredLogger {
  readonly info: (message: string, context: { requestId: string; userId?: string; operation: string }, metadata?: Record<string, any>) => Effect.Effect<void, never>;
  readonly error: (message: string, context: { requestId: string; userId?: string; operation: string }, error?: unknown, metadata?: Record<string, any>) => Effect.Effect<void, never>;
  readonly warn: (message: string, context: { requestId: string; userId?: string; operation: string }, metadata?: Record<string, any>) => Effect.Effect<void, never>;
  readonly debug: (message: string, context: { requestId: string; userId?: string; operation: string }, metadata?: Record<string, any>) => Effect.Effect<void, never>;
}

const StructuredLogger = Context.GenericTag<StructuredLogger>('StructuredLogger');

const makeStructuredLogger = (): Effect.Effect<StructuredLogger, never> =>
  Effect.gen(function* () {
    const logs = yield* Ref.make(new Array<LogEntry>());
    
    const createLogEntry = (
      level: LogEntry['level'],
      message: string,
      context: { requestId: string; userId?: string; operation: string },
      error?: unknown,
      metadata: Record<string, any> = {}
    ): LogEntry => ({
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: context.requestId,
      userId: context.userId,
      operation: context.operation,
      metadata,
      ...(error && {
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'UnknownError'
        }
      })
    });
    
    const logEntry = (entry: LogEntry) =>
      pipe(
        Ref.update(logs, arr => [...arr, entry]),
        Effect.tap(() => 
          Effect.sync(() => {
            // In production, this would go to a logging service
            console.log(JSON.stringify(entry));
          })
        )
      );
    
    return {
      info: (message, context, metadata) =>
        logEntry(createLogEntry('INFO', message, context, undefined, metadata)),
      
      error: (message, context, error, metadata) =>
        logEntry(createLogEntry('ERROR', message, context, error, metadata)),
      
      warn: (message, context, metadata) =>
        logEntry(createLogEntry('WARN', message, context, undefined, metadata)),
      
      debug: (message, context, metadata) =>
        logEntry(createLogEntry('DEBUG', message, context, undefined, metadata))
    };
  });

// TODO: Implement distributed tracing
interface TraceSpan {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly operationName: string;
  readonly startTime: Date;
  readonly tags: Record<string, string | number | boolean>;
}

interface Tracer {
  readonly startSpan: (operationName: string, parentSpan?: TraceSpan) => Effect.Effect<TraceSpan, never>;
  readonly finishSpan: (span: TraceSpan) => Effect.Effect<void, never>;
  readonly addTag: (span: TraceSpan, key: string, value: string | number | boolean) => Effect.Effect<TraceSpan, never>;
}

const Tracer = Context.GenericTag<Tracer>('Tracer');

const makeTracer = (): Effect.Effect<Tracer, never> =>
  Effect.gen(function* () {
    const generateId = () => Math.random().toString(36).substring(2, 15);
    
    return {
      startSpan: (operationName: string, parentSpan?: TraceSpan) =>
        Effect.succeed({
          traceId: parentSpan?.traceId || generateId(),
          spanId: generateId(),
          parentSpanId: parentSpan?.spanId,
          operationName,
          startTime: new Date(),
          tags: {}
        }),
      
      finishSpan: (span: TraceSpan) =>
        Effect.sync(() => {
          const duration = Date.now() - span.startTime.getTime();
          console.log(`TRACE: ${span.operationName} (${duration}ms) [${span.traceId}:${span.spanId}]`);
        }),
      
      addTag: (span: TraceSpan, key: string, value: string | number | boolean) =>
        Effect.succeed({
          ...span,
          tags: { ...span.tags, [key]: value }
        })
    };
  });

// TODO: Test observability integration
const testObservability = pipe(
  Effect.gen(function* () {
    const logger = yield* makeStructuredLogger();
    const tracer = yield* makeTracer();
    
    // Simulate a traced operation
    const rootSpan = yield* tracer.startSpan('test-operation');
    
    yield* logger.info('Starting test operation', {
      requestId: 'test-123',
      userId: 'user-456',
      operation: 'test'
    }, { inputSize: 100 });
    
    const taggedSpan = yield* tracer.addTag(rootSpan, 'test.input', 'sample');
    
    // Simulate some work
    yield* Effect.sleep(Duration.millis(100));
    
    // Simulate an error
    yield* logger.error('Test error occurred', {
      requestId: 'test-123',
      userId: 'user-456',
      operation: 'test'
    }, new Error('Simulated error'), { errorCode: 'TEST_ERROR' });
    
    yield* tracer.finishSpan(taggedSpan);
    
    yield* logger.info('Test operation completed', {
      requestId: 'test-123',
      userId: 'user-456',
      operation: 'test'
    }, { success: false });
  })
);

Effect.runPromise(testObservability);
```

### Phase 3: Metrics and Health Monitoring (25 minutes)

**Instructions:**
- Implement metrics collection system
- Add health checks for all components
- Create alerting based on metrics

**Starter Code (`src/metrics.ts`):**
```typescript
import { Effect, pipe, Ref, Schedule, Duration } from 'effect';

// TODO: Define metrics types
interface Counter {
  readonly name: string;
  readonly value: number;
  readonly tags: Record<string, string>;
}

interface Gauge {
  readonly name: string;
  readonly value: number;
  readonly timestamp: Date;
  readonly tags: Record<string, string>;
}

interface Histogram {
  readonly name: string;
  readonly values: number[];
  readonly tags: Record<string, string>;
}

// TODO: Implement metrics collector
interface MetricsCollector {
  readonly incrementCounter: (name: string, value?: number, tags?: Record<string, string>) => Effect.Effect<void, never>;
  readonly setGauge: (name: string, value: number, tags?: Record<string, string>) => Effect.Effect<void, never>;
  readonly recordHistogram: (name: string, value: number, tags?: Record<string, string>) => Effect.Effect<void, never>;
  readonly getMetrics: () => Effect.Effect<{
    counters: Counter[];
    gauges: Gauge[];
    histograms: Array<{ name: string; avg: number; min: number; max: number; count: number; tags: Record<string, string> }>;
  }, never>;
}

const makeMetricsCollector = (): Effect.Effect<MetricsCollector, never> =>
  Effect.gen(function* () {
    const counters = yield* Ref.make(new Map<string, Counter>());
    const gauges = yield* Ref.make(new Map<string, Gauge>());
    const histograms = yield* Ref.make(new Map<string, Histogram>());
    
    return {
      incrementCounter: (name: string, value = 1, tags = {}) =>
        Ref.update(counters, map => {
          const key = `${name}:${JSON.stringify(tags)}`;
          const existing = map.get(key);
          
          if (existing) {
            map.set(key, { ...existing, value: existing.value + value });
          } else {
            map.set(key, { name, value, tags });
          }
          
          return map;
        }),
      
      setGauge: (name: string, value: number, tags = {}) =>
        Ref.update(gauges, map => {
          const key = `${name}:${JSON.stringify(tags)}`;
          map.set(key, { name, value, timestamp: new Date(), tags });
          return map;
        }),
      
      recordHistogram: (name: string, value: number, tags = {}) =>
        Ref.update(histograms, map => {
          const key = `${name}:${JSON.stringify(tags)}`;
          const existing = map.get(key);
          
          if (existing) {
            const newValues = [...existing.values, value].slice(-1000); // Keep last 1000 values
            map.set(key, { ...existing, values: newValues });
          } else {
            map.set(key, { name, values: [value], tags });
          }
          
          return map;
        }),
      
      getMetrics: () =>
        pipe(
          Effect.all({
            counters: Ref.get(counters),
            gauges: Ref.get(gauges),
            histograms: Ref.get(histograms)
          }),
          Effect.map(({ counters, gauges, histograms }) => ({
            counters: Array.from(counters.values()),
            gauges: Array.from(gauges.values()),
            histograms: Array.from(histograms.values()).map(h => {
              const values = h.values;
              const sum = values.reduce((a, b) => a + b, 0);
              return {
                name: h.name,
                avg: sum / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length,
                tags: h.tags
              };
            })
          }))
        )
    };
  });

// TODO: Implement health checks
interface HealthCheck {
  readonly name: string;
  readonly check: () => Effect.Effect<{ healthy: boolean; message: string; responseTime: number }, never>;
}

interface HealthMonitor {
  readonly addCheck: (check: HealthCheck) => Effect.Effect<void, never>;
  readonly runHealthChecks: () => Effect.Effect<Array<{
    name: string;
    healthy: boolean;
    message: string;
    responseTime: number;
  }>, never>;
}

const makeHealthMonitor = (): Effect.Effect<HealthMonitor, never> =>
  Effect.gen(function* () {
    const checks = yield* Ref.make(new Array<HealthCheck>());
    
    return {
      addCheck: (check: HealthCheck) =>
        Ref.update(checks, arr => [...arr, check]),
      
      runHealthChecks: () =>
        pipe(
          Ref.get(checks),
          Effect.flatMap(checkList =>
            Effect.forEach(
              checkList,
              check =>
                pipe(
                  Effect.sync(() => Date.now()),
                  Effect.flatMap(startTime =>
                    pipe(
                      check.check(),
                      Effect.map(result => ({
                        name: check.name,
                        healthy: result.healthy,
                        message: result.message,
                        responseTime: Date.now() - startTime
                      }))
                    )
                  )
                ),
              { concurrency: 10 }
            )
          )
        )
    };
  });

// TODO: Test the metrics and health system
const testMetricsAndHealth = pipe(
  Effect.gen(function* () {
    const metrics = yield* makeMetricsCollector();
    const health = yield* makeHealthMonitor();
    
    // Add some health checks
    yield* health.addCheck({
      name: 'database',
      check: () =>
        pipe(
          Effect.sleep(Duration.millis(Math.random() * 100)),
          Effect.map(() => ({
            healthy: Math.random() > 0.1, // 90% healthy
            message: 'Database connection check',
            responseTime: 0 // Will be calculated by monitor
          }))
        )
    });
    
    yield* health.addCheck({
      name: 'ai-service',
      check: () =>
        pipe(
          Effect.sleep(Duration.millis(Math.random() * 200)),
          Effect.map(() => ({
            healthy: Math.random() > 0.05, // 95% healthy
            message: 'AI service availability check',
            responseTime: 0
          }))
        )
    });
    
    // Record some metrics
    yield* metrics.incrementCounter('requests.total', 1, { endpoint: '/predict' });
    yield* metrics.incrementCounter('requests.total', 1, { endpoint: '/health' });
    yield* metrics.setGauge('active_connections', 42);
    yield* metrics.recordHistogram('request.duration', 150);
    yield* metrics.recordHistogram('request.duration', 200);
    yield* metrics.recordHistogram('request.duration', 120);
    
    // Run health checks
    const healthResults = yield* health.runHealthChecks();
    console.log('Health Check Results:', healthResults);
    
    // Get metrics
    const metricsData = yield* metrics.getMetrics();
    console.log('Metrics:', JSON.stringify(metricsData, null, 2));
    
    // Record health status as metrics
    yield* Effect.forEach(
      healthResults,
      result => metrics.setGauge(`health.${result.name}`, result.healthy ? 1 : 0),
      { concurrency: 10 }
    );
    
    const finalMetrics = yield* metrics.getMetrics();
    console.log('Final Metrics with Health:', JSON.stringify(finalMetrics, null, 2));
  })
);

Effect.runPromise(testMetricsAndHealth);
```

### Workshop Debrief (10 minutes)

**Questions to ask:**
- "How did property-based testing change your approach to test coverage?"
- "What was different about structured logging vs traditional logging?"
- "How would you use these metrics to debug production issues?"
- "What other health checks would you add for an AI system?"

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Comprehensive Testing Strategy**
- **Property-based testing** finds edge cases you wouldn't think of
- **Chaos engineering** validates system resilience under real failure conditions
- **Integration testing** ensures all components work together
- **AI-specific testing** handles non-deterministic behavior

**2. Production Observability**
- **Structured logging** with correlation IDs enables debugging
- **Distributed tracing** shows request flow across services
- **Metrics collection** provides quantitative system health data
- **Health monitoring** enables proactive issue detection

**3. AI System Monitoring**
- **Model performance metrics** track accuracy and latency
- **Business metrics** connect technical performance to user value
- **Cost tracking** prevents runaway AI expenses
- **Experiment monitoring** validates A/B test results

**4. Operational Excellence**
- **Automated alerting** reduces mean time to detection
- **Runbook integration** speeds up incident response
- **Capacity planning** prevents resource exhaustion
- **Performance profiling** identifies optimization opportunities

### Connection to Previous Weeks
"All our architectural patterns from previous weeks are now observable and testable. Our service boundaries make testing easier. Our error handling provides structured failure information. Our concurrency patterns are monitored for performance. Our streaming systems have metrics and tracing."

### Bridge to Week 8
"We've built a production-ready AI system with comprehensive testing and observability. But there's one more crucial piece: deployment and scaling. Next week, we'll learn how to deploy Effect applications to production, handle traffic spikes, and scale AI systems globally."

### Homework Assignment

**Build a comprehensive monitoring dashboard:**
1. **Real-time metrics dashboard** - Show system health at a glance
2. **Alert configuration** - Set up alerts for critical issues
3. **Log analysis tools** - Search and analyze structured logs
4. **Performance profiling** - Identify bottlenecks and optimization opportunities

**Bonus challenges:**
- Implement distributed tracing visualization
- Add ML model drift detection
- Create automated anomaly detection
- Build a chaos engineering test suite

---

## 🎓 Assessment Rubric

### Testing Excellence
- [ ] **Comprehensive test coverage** - unit, integration, property-based, chaos
- [ ] **AI-specific test strategies** - handling non-determinism and external dependencies
- [ ] **Performance testing** - load testing and resource exhaustion scenarios
- [ ] **Error scenario coverage** - testing all failure modes

### Observability Implementation
- [ ] **Structured logging** - correlation IDs, contextual information
- [ ] **Distributed tracing** - request flow across service boundaries
- [ ] **Metrics collection** - counters, gauges, histograms for all key operations
- [ ] **Health monitoring** - proactive system health checks

### Production Readiness
- [ ] **Monitoring dashboards** - actionable insights from metrics
- [ ] **Alerting configuration** - appropriate thresholds and escalation
- [ ] **Debugging capabilities** - log search, trace analysis, metric correlation
- [ ] **Performance analysis** - identifying bottlenecks and optimization opportunities

### AI System Monitoring
- [ ] **Model performance tracking** - accuracy, latency, cost metrics
- [ ] **Experiment monitoring** - A/B test result tracking
- [ ] **Business metric correlation** - connecting technical metrics to business value
- [ ] **Anomaly detection** - identifying unusual patterns and behaviors

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Testing](https://effect.website/docs/testing)
- [Property-Based Testing Guide](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Observability Engineering](https://info.honeycomb.io/observability-engineering-oreilly-book-2022)

### Code Examples
- [Complete Testing Suite](./examples/comprehensive-testing/)
- [Observability Implementation](./examples/production-observability/)
- [Monitoring Dashboards](./examples/monitoring-dashboards/)

### Next Week Prep
- Think about deployment strategies for Effect applications
- Consider: How do you handle traffic spikes in AI systems?
- Read about container orchestration and auto-scaling

---

*"You cannot improve what you cannot measure, and you cannot debug what you cannot observe."*