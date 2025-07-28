# Week 6: Advanced Patterns & AI Model Management
## Production-Scale AI Orchestration

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Master advanced Effect patterns** like resource pools, circuit breakers, and bulkheads
- **Build AI model orchestrators** that manage multiple models, A/B testing, and performance monitoring
- **Implement caching strategies** with multi-level cache hierarchies and intelligent eviction
- **Design resilient systems** that handle failures gracefully and recover automatically
- **Create production-ready architectures** that scale to thousands of concurrent AI requests

---

## 🔥 Opening Challenge: When Your AI System Gets Real Traffic (30 minutes)

### The Scenario
Your streaming AI chat analyzer is a huge success! But now you have 10,000 concurrent users across 1000 chat rooms. Suddenly, you're facing new challenges:

- Model loading takes 30 seconds and costs $500/month per instance
- Each AI inference costs $0.01, adding up to $50,000/month
- Some models are better for certain types of queries
- Users expect sub-second responses
- Models sometimes fail or become unavailable
- You want to A/B test new models without affecting all users
- You need to monitor model performance and accuracy

### Live Coding: The Production Reality Check

```typescript
// ai-system-production-problems.ts - When scale hits hard
import { Effect, pipe } from 'effect';

interface ModelInstance {
  id: string;
  modelName: string;
  loadTime: number;
  costPerInference: number;
  status: 'loading' | 'ready' | 'failed' | 'overloaded';
  lastUsed: Date;
  totalInferences: number;
  errorRate: number;
}

interface InferenceRequest {
  id: string;
  userId: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  timestamp: Date;
}

interface ModelPerformanceMetrics {
  modelName: string;
  averageLatency: number;
  errorRate: number;
  throughput: number;
  accuracy: number;
  cost: number;
}

// The problems start showing up at scale...
class ProductionAISystem {
  private models: Map<string, ModelInstance> = new Map();
  private requestQueue: InferenceRequest[] = [];
  private isProcessing = false;
  private totalCost = 0;
  private failedRequests = 0;

  constructor() {
    console.log('🏭 Starting production AI system...');
    this.initializeModels();
    this.startProcessing();
    this.startMonitoring();
  }

  private async initializeModels(): Promise<void> {
    console.log('📦 Loading AI models...');
    
    // Problem 1: Sequential model loading takes forever
    const modelConfigs = [
      { name: 'gpt-4', costPerInference: 0.06 },
      { name: 'gpt-3.5-turbo', costPerInference: 0.002 },
      { name: 'claude-2', costPerInference: 0.032 },
      { name: 'llama-2-70b', costPerInference: 0.001 }
    ];

    for (const config of modelConfigs) {
      try {
        console.log(`Loading ${config.name}...`);
        const startTime = Date.now();
        
        // Simulate model loading (30 seconds each!)
        await new Promise(resolve => setTimeout(resolve, 5000)); // Reduced for demo
        
        const loadTime = Date.now() - startTime;
        
        this.models.set(config.name, {
          id: `${config.name}-${Date.now()}`,
          modelName: config.name,
          loadTime,
          costPerInference: config.costPerInference,
          status: 'ready',
          lastUsed: new Date(),
          totalInferences: 0,
          errorRate: 0
        });
        
        console.log(`✅ ${config.name} loaded in ${loadTime}ms`);
      } catch (error) {
        console.error(`❌ Failed to load ${config.name}:`, error.message);
      }
    }
    
    console.log(`📦 Model loading complete. Total models: ${this.models.size}`);
  }

  // Problem 2: No intelligent model selection
  private selectModel(request: InferenceRequest): ModelInstance | null {
    const availableModels = Array.from(this.models.values())
      .filter(model => model.status === 'ready');
    
    if (availableModels.length === 0) {
      console.warn('⚠️ No models available!');
      return null;
    }
    
    // Naive selection: just pick the first available model
    // Real problems:
    // - No cost optimization
    // - No performance-based routing
    // - No A/B testing
    // - No load balancing
    return availableModels[0];
  }

  // Problem 3: No caching, every request hits the model
  private async processInference(request: InferenceRequest, model: ModelInstance): Promise<string> {
    console.log(`🤖 Processing ${request.id} with ${model.modelName}`);
    
    try {
      // Simulate AI processing time
      const processingTime = 800 + Math.random() * 1200; // 0.8-2.0 seconds
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Problem 4: No circuit breaker - if model fails, we keep trying
      if (Math.random() < 0.05) { // 5% failure rate
        model.errorRate += 0.01;
        throw new Error(`Model ${model.modelName} inference failed`);
      }
      
      // Update model stats
      model.totalInferences++;
      model.lastUsed = new Date();
      this.totalCost += model.costPerInference;
      
      return `Response from ${model.modelName}: Processed "${request.content.substring(0, 50)}..."`;
      
    } catch (error) {
      this.failedRequests++;
      throw error;
    }
  }

  // Problem 5: Sequential processing with no concurrency control
  private async startProcessing(): Promise<void> {
    setInterval(async () => {
      if (this.isProcessing || this.requestQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      const batch = this.requestQueue.splice(0, 10); // Process 10 at a time
      
      console.log(`🔄 Processing batch of ${batch.length} requests...`);
      
      for (const request of batch) {
        try {
          const model = this.selectModel(request);
          if (!model) {
            console.error(`❌ No model available for request ${request.id}`);
            continue;
          }
          
          const result = await this.processInference(request, model);
          console.log(`✅ Request ${request.id} completed`);
          
        } catch (error) {
          console.error(`❌ Request ${request.id} failed:`, error.message);
        }
      }
      
      this.isProcessing = false;
    }, 1000); // Process every second
  }

  // Problem 6: Basic monitoring with no actionable insights
  private startMonitoring(): void {
    setInterval(() => {
      console.log('\n📊 SYSTEM METRICS:');
      console.log(`Queue size: ${this.requestQueue.length}`);
      console.log(`Total cost: $${this.totalCost.toFixed(2)}`);
      console.log(`Failed requests: ${this.failedRequests}`);
      
      this.models.forEach(model => {
        console.log(`${model.modelName}: ${model.totalInferences} inferences, ${(model.errorRate * 100).toFixed(1)}% error rate`);
      });
      
      // Problem 7: No alerting or auto-scaling
      if (this.requestQueue.length > 100) {
        console.warn('⚠️ Queue is getting large, but no auto-scaling!');
      }
      
      if (this.totalCost > 100) {
        console.warn('⚠️ Cost is getting high, but no cost controls!');
      }
      
    }, 10000); // Every 10 seconds
  }

  // Public API
  public addRequest(request: InferenceRequest): void {
    this.requestQueue.push(request);
    console.log(`📨 Added request ${request.id} (queue size: ${this.requestQueue.length})`);
  }

  // Simulate high load
  public simulateHighLoad(): void {
    console.log('🚀 Simulating high load...');
    
    const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    const contents = [
      'Analyze this text for sentiment',
      'What are the key topics in this content?',
      'Is this message toxic or inappropriate?',
      'Summarize this conversation',
      'Translate this to Spanish',
      'Generate a response to this message'
    ];
    
    // Send 200 requests over 20 seconds (10 requests/second)
    for (let i = 0; i < 200; i++) {
      setTimeout(() => {
        this.addRequest({
          id: `req-${i}`,
          userId: users[Math.floor(Math.random() * users.length)],
          content: contents[Math.floor(Math.random() * contents.length)],
          priority: Math.random() > 0.8 ? 'high' : 'normal',
          timestamp: new Date()
        });
      }, i * 100); // One request every 100ms
    }
  }
}

// Demo the problems
async function demo() {
  const system = new ProductionAISystem();
  
  // Wait for models to load
  setTimeout(() => {
    system.simulateHighLoad();
    
    // Let it run and observe the problems
    setTimeout(() => {
      console.log('\n🔍 PROBLEMS OBSERVED:');
      console.log('💸 Cost is spiraling out of control');
      console.log('🐌 Sequential model loading takes forever');
      console.log('🎯 No intelligent model selection or routing');
      console.log('💾 No caching - same requests processed multiple times');
      console.log('💥 No circuit breakers - failed models keep getting requests');
      console.log('📈 No auto-scaling or load balancing');
      console.log('🔍 Monitoring provides data but no insights or actions');
      console.log('🧪 No A/B testing or gradual rollouts');
      console.log('⚡ No performance optimization or resource pooling');
    }, 30000);
    
  }, 6000); // Wait for models to load
}

demo();
```

### Discussion Questions (10 minutes)

**Ask the class:**
1. "What happens when you have 10,000 concurrent users?"
   - Model loading becomes a bottleneck
   - Cost scales linearly with requests
   - No intelligent routing leads to poor performance
   - Queue management becomes critical

2. "How would you optimize this system?"
   - Common answers: "Cache responses", "Load balance", "Use cheaper models when possible"
   - "What about A/B testing new models?"
   - "How do you handle model failures?"

3. "What production concerns are missing?"
   - Circuit breakers for failing services
   - Resource pools for expensive resources
   - Intelligent caching with TTL
   - Performance monitoring and alerting
   - Cost optimization and budgeting

**The Setup:** "Let's build a production-grade AI orchestrator that handles all these concerns using advanced Effect patterns."

---

## 🚀 Enter Advanced Effect Patterns (80 minutes)

### Part 1: Resource Pools & Model Management (25 minutes)

```typescript
// ai-orchestrator-advanced.ts - The production-ready way
import { Effect, pipe, Context, Layer, Duration, Ref, Queue, Semaphore } from 'effect';
import { Data } from 'effect';

// Domain types
interface AIModel {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: ReadonlyArray<string>;
  readonly costPerToken: number;
  readonly averageLatency: number;
  readonly maxConcurrency: number;
}

interface ModelInstance {
  readonly model: AIModel;
  readonly status: 'loading' | 'ready' | 'failed' | 'maintenance';
  readonly loadedAt: Date;
  readonly lastUsed: Date;
  readonly totalRequests: number;
  readonly errorCount: number;
  readonly predict: (input: string) => Effect.Effect<string, ModelError>;
  readonly unload: () => Effect.Effect<void, never>;
}

// Advanced error types
class ModelError extends Data.TaggedError('ModelError')<{
  readonly modelId: string;
  readonly reason: string;
  readonly retryable: boolean;
}> {}

class ResourceExhaustedError extends Data.TaggedError('ResourceExhaustedError')<{
  readonly resource: string;
  readonly limit: number;
  readonly current: number;
}> {}

class CircuitBreakerOpenError extends Data.TaggedError('CircuitBreakerOpenError')<{
  readonly service: string;
  readonly resetTime: Date;
}> {}

// Resource Pool Pattern
interface ResourcePool<T> {
  readonly acquire: () => Effect.Effect<T, ResourceExhaustedError>;
  readonly release: (resource: T) => Effect.Effect<void, never>;
  readonly size: () => Effect.Effect<{ inUse: number; available: number }, never>;
  readonly health: () => Effect.Effect<{ healthy: number; unhealthy: number }, never>;
}

const makeResourcePool = <T>(
  factory: () => Effect.Effect<T, ModelError>,
  maxSize: number,
  healthCheck: (resource: T) => Effect.Effect<boolean, never>,
  cleanup: (resource: T) => Effect.Effect<void, never>
): Effect.Effect<ResourcePool<T>, never> =>
  Effect.gen(function* () {
    const available = yield* Queue.bounded<T>(maxSize);
    const inUse = yield* Ref.make(new Set<T>());
    const semaphore = yield* Semaphore.make(maxSize);
    const totalCreated = yield* Ref.make(0);
    
    return {
      acquire: () =>
        pipe(
          semaphore.take(1),
          Effect.flatMap(() =>
            pipe(
              available.poll,
              Effect.flatMap(option =>
                option._tag === 'Some'
                  ? pipe(
                      // Check if existing resource is healthy
                      healthCheck(option.value),
                      Effect.flatMap(isHealthy =>
                        isHealthy
                          ? Effect.succeed(option.value)
                          : pipe(
                              cleanup(option.value),
                              Effect.flatMap(() => factory())
                            )
                      )
                    )
                  : factory()
              ),
              Effect.tap(resource =>
                Ref.update(inUse, set => set.add(resource))
              ),
              Effect.tap(() => Ref.update(totalCreated, n => n + 1))
            )
          ),
          Effect.mapError(error => 
            new ResourceExhaustedError({
              resource: 'model-instance',
              limit: maxSize,
              current: maxSize // All slots taken
            })
          )
        ),
      
      release: (resource: T) =>
        pipe(
          healthCheck(resource),
          Effect.flatMap(isHealthy =>
            isHealthy
              ? pipe(
                  available.offer(resource),
                  Effect.flatMap(success =>
                    success
                      ? Effect.unit
                      : cleanup(resource) // Queue full, cleanup
                  )
                )
              : cleanup(resource) // Unhealthy, cleanup
          ),
          Effect.tap(() => Ref.update(inUse, set => set.delete(resource))),
          Effect.flatMap(() => semaphore.release(1))
        ),
      
      size: () =>
        pipe(
          Effect.all({
            inUseSet: Ref.get(inUse),
            availableSize: available.size
          }),
          Effect.map(({ inUseSet, availableSize }) => ({
            inUse: inUseSet.size,
            available: availableSize
          }))
        ),
      
      health: () =>
        pipe(
          available.takeAll,
          Effect.flatMap(resources =>
            pipe(
              resources,
              Effect.forEach(resource =>
                pipe(
                  healthCheck(resource),
                  Effect.map(healthy => ({ resource, healthy }))
                )
              ),
              Effect.tap(results => {
                // Put healthy resources back
                const healthyResources = results
                  .filter(r => r.healthy)
                  .map(r => r.resource);
                
                return pipe(
                  healthyResources,
                  Effect.forEach(resource => available.offer(resource)),
                  Effect.asUnit
                );
              }),
              Effect.map(results => ({
                healthy: results.filter(r => r.healthy).length,
                unhealthy: results.filter(r => !r.healthy).length
              }))
            )
          )
        )
    };
  });

// Model Pool Service
interface ModelPool {
  readonly acquireModel: (modelName: string) => Effect.Effect<ModelInstance, ModelError | ResourceExhaustedError>;
  readonly releaseModel: (instance: ModelInstance) => Effect.Effect<void, never>;
  readonly getPoolStats: () => Effect.Effect<Record<string, { inUse: number; available: number }>, never>;
  readonly deployModel: (model: AIModel) => Effect.Effect<void, ModelError>;
  readonly retireModel: (modelName: string) => Effect.Effect<void, never>;
}

const ModelPool = Context.GenericTag<ModelPool>('ModelPool');

const ModelPoolLive = Layer.effect(
  ModelPool,
  Effect.gen(function* () {
    const pools = yield* Ref.make(new Map<string, ResourcePool<ModelInstance>>());
    
    const createModelInstance = (model: AIModel): Effect.Effect<ModelInstance, ModelError> =>
      Effect.gen(function* () {
        console.log(`🔄 Loading model ${model.name}...`);
        
        // Simulate model loading with realistic timing
        yield* Effect.sleep(Duration.seconds(2 + Math.random() * 3));
        
        // Simulate loading failures
        if (Math.random() < 0.1) {
          yield* Effect.fail(new ModelError({
            modelId: model.id,
            reason: 'Model loading failed - insufficient memory',
            retryable: true
          }));
        }
        
        const instance: ModelInstance = {
          model,
          status: 'ready',
          loadedAt: new Date(),
          lastUsed: new Date(),
          totalRequests: 0,
          errorCount: 0,
          predict: (input: string) =>
            pipe(
              Effect.sleep(Duration.millis(model.averageLatency + Math.random() * 200)),
              Effect.flatMap(() => {
                if (Math.random() < 0.02) { // 2% error rate
                  return Effect.fail(new ModelError({
                    modelId: model.id,
                    reason: 'Inference failed - model overloaded',
                    retryable: true
                  }));
                }
                return Effect.succeed(`${model.name} response: ${input.substring(0, 100)}...`);
              })
            ),
          unload: () =>
            Effect.sync(() => {
              console.log(`🗑️ Unloading model instance ${model.name}`);
            })
        };
        
        console.log(`✅ Model ${model.name} loaded successfully`);
        return instance;
      });
    
    const healthCheck = (instance: ModelInstance): Effect.Effect<boolean, never> =>
      Effect.sync(() => {
        const now = new Date();
        const lastUsedMs = now.getTime() - instance.lastUsed.getTime();
        const errorRate = instance.totalRequests > 0 
          ? instance.errorCount / instance.totalRequests 
          : 0;
        
        // Consider unhealthy if unused for 10 minutes or error rate > 10%
        return lastUsedMs < 10 * 60 * 1000 && errorRate < 0.1;
      });
    
    const cleanup = (instance: ModelInstance): Effect.Effect<void, never> =>
      instance.unload();
    
    return ModelPool.of({
      acquireModel: (modelName: string) =>
        pipe(
          Ref.get(pools),
          Effect.flatMap(poolMap => {
            const pool = poolMap.get(modelName);
            if (!pool) {
              return Effect.fail(new ModelError({
                modelId: modelName,
                reason: 'Model not deployed',
                retryable: false
              }));
            }
            return pool.acquire();
          })
        ),
      
      releaseModel: (instance: ModelInstance) =>
        pipe(
          Ref.get(pools),
          Effect.flatMap(poolMap => {
            const pool = poolMap.get(instance.model.name);
            if (pool) {
              return pool.release(instance);
            }
            return cleanup(instance);
          })
        ),
      
      getPoolStats: () =>
        pipe(
          Ref.get(pools),
          Effect.flatMap(poolMap =>
            pipe(
              Array.from(poolMap.entries()),
              Effect.forEach(([modelName, pool]) =>
                pipe(
                  pool.size(),
                  Effect.map(size => [modelName, size] as const)
                )
              ),
              Effect.map(entries => Object.fromEntries(entries))
            )
          )
        ),
      
      deployModel: (model: AIModel) =>
        pipe(
          makeResourcePool(
            () => createModelInstance(model),
            model.maxConcurrency,
            healthCheck,
            cleanup
          ),
          Effect.flatMap(pool =>
            Ref.update(pools, poolMap => 
              poolMap.set(model.name, pool)
            )
          ),
          Effect.tap(() => 
            Effect.sync(() => console.log(`🚀 Deployed model ${model.name} with max concurrency ${model.maxConcurrency}`))
          )
        ),
      
      retireModel: (modelName: string) =>
        pipe(
          Ref.get(pools),
          Effect.flatMap(poolMap => {
            const pool = poolMap.get(modelName);
            if (pool) {
              return pipe(
                // Drain the pool
                pool.health(),
                Effect.flatMap(() =>
                  Ref.update(pools, map => {
                    map.delete(modelName);
                    return map;
                  })
                ),
                Effect.tap(() =>
                  Effect.sync(() => console.log(`🔄 Retired model ${modelName}`))
                )
              );
            }
            return Effect.unit;
          })
        )
    });
  })
);
```

### Part 2: Multi-Level Caching Strategy (25 minutes)

```typescript
// Advanced caching with multiple levels and intelligent eviction
interface CacheEntry<T> {
  readonly value: T;
  readonly createdAt: Date;
  readonly lastAccessed: Date;
  readonly accessCount: number;
  readonly ttl: Duration.Duration;
  readonly cost: number; // For cost-based eviction
}

interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
  readonly size: number;
  readonly hitRate: number;
}

interface Cache<T> {
  readonly get: (key: string) => Effect.Effect<Option.Option<T>, never>;
  readonly set: (key: string, value: T, ttl?: Duration.Duration) => Effect.Effect<void, never>;
  readonly delete: (key: string) => Effect.Effect<void, never>;
  readonly clear: () => Effect.Effect<void, never>;
  readonly stats: () => Effect.Effect<CacheStats, never>;
}

// L1: In-Memory Cache (fastest, smallest)
const makeMemoryCache = <T>(maxSize: number): Effect.Effect<Cache<T>, never> =>
  Effect.gen(function* () {
    const cache = yield* Ref.make(new Map<string, CacheEntry<T>>());
    const stats = yield* Ref.make({
      hits: 0,
      misses: 0,
      evictions: 0
    });
    
    const evictLRU = () =>
      pipe(
        Ref.get(cache),
        Effect.flatMap(cacheMap => {
          if (cacheMap.size < maxSize) return Effect.unit;
          
          // Find least recently used entry
          let oldestKey = '';
          let oldestTime = Date.now();
          
          for (const [key, entry] of cacheMap.entries()) {
            if (entry.lastAccessed.getTime() < oldestTime) {
              oldestTime = entry.lastAccessed.getTime();
              oldestKey = key;
            }
          }
          
          if (oldestKey) {
            return pipe(
              Ref.update(cache, map => {
                map.delete(oldestKey);
                return map;
              }),
              Effect.tap(() => Ref.update(stats, s => ({ ...s, evictions: s.evictions + 1 })))
            );
          }
          
          return Effect.unit;
        })
      );
    
    return {
      get: (key: string) =>
        pipe(
          Ref.get(cache),
          Effect.flatMap(cacheMap => {
            const entry = cacheMap.get(key);
            if (!entry) {
              return pipe(
                Ref.update(stats, s => ({ ...s, misses: s.misses + 1 })),
                Effect.map(() => Option.none())
              );
            }
            
            // Check TTL
            const now = new Date();
            const age = now.getTime() - entry.createdAt.getTime();
            if (age > Duration.toMillis(entry.ttl)) {
              return pipe(
                Ref.update(cache, map => {
                  map.delete(key);
                  return map;
                }),
                Effect.flatMap(() => Ref.update(stats, s => ({ ...s, misses: s.misses + 1 }))),
                Effect.map(() => Option.none())
              );
            }
            
            // Update access info
            const updatedEntry = {
              ...entry,
              lastAccessed: now,
              accessCount: entry.accessCount + 1
            };
            
            return pipe(
              Ref.update(cache, map => {
                map.set(key, updatedEntry);
                return map;
              }),
              Effect.flatMap(() => Ref.update(stats, s => ({ ...s, hits: s.hits + 1 }))),
              Effect.map(() => Option.some(entry.value))
            );
          })
        ),
      
      set: (key: string, value: T, ttl = Duration.hours(1)) =>
        pipe(
          evictLRU(),
          Effect.flatMap(() => {
            const entry: CacheEntry<T> = {
              value,
              createdAt: new Date(),
              lastAccessed: new Date(),
              accessCount: 1,
              ttl,
              cost: JSON.stringify(value).length // Simple cost metric
            };
            
            return Ref.update(cache, map => {
              map.set(key, entry);
              return map;
            });
          })
        ),
      
      delete: (key: string) =>
        Ref.update(cache, map => {
          map.delete(key);
          return map;
        }),
      
      clear: () =>
        Ref.set(cache, new Map()),
      
      stats: () =>
        pipe(
          Effect.all({
            cache: Ref.get(cache),
            stats: Ref.get(stats)
          }),
          Effect.map(({ cache, stats }) => ({
            hits: stats.hits,
            misses: stats.misses,
            evictions: stats.evictions,
            size: cache.size,
            hitRate: stats.hits + stats.misses > 0 
              ? stats.hits / (stats.hits + stats.misses) 
              : 0
          }))
        )
    };
  });

// Multi-level cache service
interface CacheService {
  readonly get: (key: string) => Effect.Effect<Option.Option<string>, never>;
  readonly set: (key: string, value: string, ttl?: Duration.Duration) => Effect.Effect<void, never>;
  readonly getStats: () => Effect.Effect<{ l1: CacheStats; l2: CacheStats }, never>;
}

const CacheService = Context.GenericTag<CacheService>('CacheService');

const CacheServiceLive = Layer.effect(
  CacheService,
  Effect.gen(function* () {
    const l1Cache = yield* makeMemoryCache<string>(1000); // 1K entries
    const l2Cache = yield* makeMemoryCache<string>(10000); // 10K entries (simulating Redis)
    
    return CacheService.of({
      get: (key: string) =>
        pipe(
          l1Cache.get(key),
          Effect.flatMap(l1Result =>
            l1Result._tag === 'Some'
              ? Effect.succeed(l1Result)
              : pipe(
                  l2Cache.get(key),
                  Effect.tap(l2Result => {
                    // Promote to L1 if found in L2
                    if (l2Result._tag === 'Some') {
                      return l1Cache.set(key, l2Result.value);
                    }
                    return Effect.unit;
                  })
                )
          )
        ),
      
      set: (key: string, value: string, ttl?: Duration.Duration) =>
        pipe(
          l1Cache.set(key, value, ttl),
          Effect.flatMap(() => l2Cache.set(key, value, ttl))
        ),
      
      getStats: () =>
        pipe(
          Effect.all({
            l1: l1Cache.stats(),
            l2: l2Cache.stats()
          })
        )
    });
  })
);
```

### Part 3: Circuit Breaker & A/B Testing (30 minutes)

```typescript
// Circuit Breaker Pattern
interface CircuitBreakerState {
  readonly status: 'Closed' | 'Open' | 'HalfOpen';
  readonly failures: number;
  readonly lastFailureTime: Date;
  readonly nextAttemptTime: Date;
}

const makeCircuitBreaker = (
  failureThreshold: number,
  timeout: Duration.Duration
): Effect.Effect<{
  execute: <A, E>(effect: Effect.Effect<A, E>) => Effect.Effect<A, E | CircuitBreakerOpenError>;
}, never> =>
  Effect.gen(function* () {
    const state = yield* Ref.make<CircuitBreakerState>({
      status: 'Closed',
      failures: 0,
      lastFailureTime: new Date(0),
      nextAttemptTime: new Date(0)
    });
    
    const recordSuccess = () =>
      Ref.set(state, {
        status: 'Closed',
        failures: 0,
        lastFailureTime: new Date(0),
        nextAttemptTime: new Date(0)
      });
    
    const recordFailure = () =>
      pipe(
        Ref.get(state),
        Effect.flatMap(currentState => {
          const now = new Date();
          const newFailures = currentState.failures + 1;
          
          if (newFailures >= failureThreshold) {
            return Ref.set(state, {
              status: 'Open',
              failures: newFailures,
              lastFailureTime: now,
              nextAttemptTime: new Date(now.getTime() + Duration.toMillis(timeout))
            });
          } else {
            return Ref.update(state, s => ({
              ...s,
              failures: newFailures,
              lastFailureTime: now
            }));
          }
        })
      );
    
    return {
      execute: <A, E>(effect: Effect.Effect<A, E>) =>
        pipe(
          Ref.get(state),
          Effect.flatMap(currentState => {
            const now = new Date();
            
            switch (currentState.status) {
              case 'Open':
                if (now >= currentState.nextAttemptTime) {
                  // Try half-open
                  return pipe(
                    Ref.update(state, s => ({ ...s, status: 'HalfOpen' })),
                    Effect.flatMap(() =>
                      pipe(
                        effect,
                        Effect.tap(() => recordSuccess()),
                        Effect.tapError(() => recordFailure())
                      )
                    )
                  );
                } else {
                  return Effect.fail(new CircuitBreakerOpenError({
                    service: 'ai-model',
                    resetTime: currentState.nextAttemptTime
                  }));
                }
              
              case 'HalfOpen':
              case 'Closed':
                return pipe(
                  effect,
                  Effect.tap(() => recordSuccess()),
                  Effect.tapError(() => recordFailure())
                );
            }
          })
        )
    };
  });

// A/B Testing Framework
interface Experiment {
  readonly id: string;
  readonly name: string;
  readonly variants: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly weight: number;
    readonly modelName: string;
  }>;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly userSegments: ReadonlyArray<string>;
}

interface ExperimentResult {
  readonly experimentId: string;
  readonly variantId: string;
  readonly userId: string;
  readonly modelName: string;
  readonly latency: number;
  readonly success: boolean;
  readonly timestamp: Date;
}

interface ExperimentService {
  readonly getVariant: (userId: string, experimentId: string) => Effect.Effect<Option.Option<string>, never>;
  readonly recordResult: (result: ExperimentResult) => Effect.Effect<void, never>;
  readonly getExperimentStats: (experimentId: string) => Effect.Effect<Record<string, {
    requests: number;
    successRate: number;
    averageLatency: number;
  }>, never>;
}

const ExperimentService = Context.GenericTag<ExperimentService>('ExperimentService');

const ExperimentServiceLive = Layer.effect(
  ExperimentService,
  Effect.gen(function* () {
    const experiments = yield* Ref.make(new Map<string, Experiment>());
    const results = yield* Ref.make(new Array<ExperimentResult>());
    
    // Hash-based consistent assignment
    const hashUserId = (userId: string, experimentId: string): number => {
      let hash = 0;
      const str = `${userId}-${experimentId}`;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash) / 2147483647; // Normalize to 0-1
    };
    
    return ExperimentService.of({
      getVariant: (userId: string, experimentId: string) =>
        pipe(
          Ref.get(experiments),
          Effect.map(expMap => {
            const experiment = expMap.get(experimentId);
            if (!experiment) return Option.none();
            
            const now = new Date();
            if (now < experiment.startDate || now > experiment.endDate) {
              return Option.none();
            }
            
            const hash = hashUserId(userId, experimentId);
            let cumulativeWeight = 0;
            
            for (const variant of experiment.variants) {
              cumulativeWeight += variant.weight;
              if (hash <= cumulativeWeight) {
                return Option.some(variant.modelName);
              }
            }
            
            // Fallback to first variant
            return experiment.variants.length > 0 
              ? Option.some(experiment.variants[0].modelName)
              : Option.none();
          })
        ),
      
      recordResult: (result: ExperimentResult) =>
        Ref.update(results, arr => [...arr, result]),
      
      getExperimentStats: (experimentId: string) =>
        pipe(
          Ref.get(results),
          Effect.map(allResults => {
            const expResults = allResults.filter(r => r.experimentId === experimentId);
            const variantStats: Record<string, { requests: number; successRate: number; averageLatency: number; }> = {};
            
            for (const result of expResults) {
              if (!variantStats[result.variantId]) {
                variantStats[result.variantId] = {
                  requests: 0,
                  successRate: 0,
                  averageLatency: 0
                };
              }
              
              const stats = variantStats[result.variantId];
              stats.requests++;
              
              if (result.success) {
                stats.successRate = (stats.successRate * (stats.requests - 1) + 1) / stats.requests;
              } else {
                stats.successRate = (stats.successRate * (stats.requests - 1)) / stats.requests;
              }
              
              stats.averageLatency = (stats.averageLatency * (stats.requests - 1) + result.latency) / stats.requests;
            }
            
            return variantStats;
          })
        )
    });
  })
);

// Main AI Orchestrator Service
interface AIOrchestrator {
  readonly predict: (
    userId: string,
    input: string,
    options?: { priority?: 'low' | 'normal' | 'high'; experimentId?: string }
  ) => Effect.Effect<{
    response: string;
    modelUsed: string;
    latency: number;
    cached: boolean;
  }, ModelError | ResourceExhaustedError | CircuitBreakerOpenError>;
  
  readonly getSystemStats: () => Effect.Effect<{
    pools: Record<string, { inUse: number; available: number }>;
    cache: { l1: CacheStats; l2: CacheStats };
    experiments: Record<string, Record<string, { requests: number; successRate: number; averageLatency: number }>>;
  }, never>;
}

const AIOrchestrator = Context.GenericTag<AIOrchestrator>('AIOrchestrator');

const AIOrchestratorLive = Layer.effect(
  AIOrchestrator,
  Effect.gen(function* () {
    const modelPool = yield* ModelPool;
    const cache = yield* CacheService;
    const experiments = yield* ExperimentService;
    
    // Create circuit breakers for each model
    const circuitBreakers = yield* Ref.make(new Map<string, any>());
    
    const getOrCreateCircuitBreaker = (modelName: string) =>
      pipe(
        Ref.get(circuitBreakers),
        Effect.flatMap(cbMap => {
          const existing = cbMap.get(modelName);
          if (existing) return Effect.succeed(existing);
          
          return pipe(
            makeCircuitBreaker(5, Duration.minutes(1)), // 5 failures, 1 minute timeout
            Effect.tap(cb => 
              Ref.update(circuitBreakers, map => map.set(modelName, cb))
            )
          );
        })
      );
    
    return AIOrchestrator.of({
      predict: (userId: string, input: string, options = {}) =>
        pipe(
          Effect.sync(() => Date.now()),
          Effect.flatMap(startTime => {
            const cacheKey = `${userId}-${input.substring(0, 100)}`;
            
            return pipe(
              // Try cache first
              cache.get(cacheKey),
              Effect.flatMap(cached =>
                cached._tag === 'Some'
                  ? Effect.succeed({
                      response: cached.value,
                      modelUsed: 'cache',
                      latency: Date.now() - startTime,
                      cached: true
                    })
                  : pipe(
                      // Determine model to use
                      options.experimentId
                        ? experiments.getVariant(userId, options.experimentId)
                        : Effect.succeed(Option.some('gpt-3.5-turbo')), // Default model
                      
                      Effect.flatMap(modelOption => {
                        const modelName = modelOption._tag === 'Some' 
                          ? modelOption.value 
                          : 'gpt-3.5-turbo';
                        
                        return pipe(
                          getOrCreateCircuitBreaker(modelName),
                          Effect.flatMap(circuitBreaker =>
                            pipe(
                              modelPool.acquireModel(modelName),
                              Effect.flatMap(instance =>
                                pipe(
                                  circuitBreaker.execute(instance.predict(input)),
                                  Effect.tap(response =>
                                    cache.set(cacheKey, response, Duration.minutes(30))
                                  ),
                                  Effect.map(response => ({
                                    response,
                                    modelUsed: modelName,
                                    latency: Date.now() - startTime,
                                    cached: false
                                  })),
                                  Effect.ensuring(modelPool.releaseModel(instance))
                                )
                              )
                            )
                          )
                        );
                      })
                    )
              )
            );
          })
        ),
      
      getSystemStats: () =>
        pipe(
          Effect.all({
            pools: modelPool.getPoolStats(),
            cache: cache.getStats(),
            experiments: Effect.succeed({}) // Simplified for demo
          })
        )
    });
  })
);
```

---

## 🛠️ Hands-On Workshop: Build Your AI Orchestrator (75 minutes)

### Setup (10 minutes)

```bash
mkdir ai-orchestrator
cd ai-orchestrator
npm init -y
npm install effect @effect/platform
npm install -D typescript @types/node tsx
```

### Phase 1: Resource Pool Implementation (25 minutes)

**Instructions:**
- Form pairs
- Implement a basic model pool with health checks
- Add resource limits and cleanup
- Test with multiple concurrent requests

**Starter Code (`src/resource-pool.ts`):**
```typescript
import { Effect, pipe, Ref, Queue, Semaphore } from 'effect';
import { Data } from 'effect';

interface MockModel {
  readonly id: string;
  readonly name: string;
  readonly status: 'ready' | 'failed';
  readonly predict: (input: string) => Effect.Effect<string, ModelError>;
  readonly cleanup: () => Effect.Effect<void, never>;
}

class ModelError extends Data.TaggedError('ModelError')<{
  readonly modelId: string;
  readonly reason: string;
}> {}

// TODO: Implement resource pool
interface ResourcePool<T> {
  readonly acquire: () => Effect.Effect<T, never>;
  readonly release: (resource: T) => Effect.Effect<void, never>;
  readonly stats: () => Effect.Effect<{ inUse: number; available: number }, never>;
}

const makeResourcePool = <T>(
  factory: () => Effect.Effect<T, never>,
  maxSize: number
): Effect.Effect<ResourcePool<T>, never> =>
  Effect.gen(function* () {
    // TODO: Implement using Queue, Ref, and Semaphore
    const available = yield* Queue.bounded<T>(maxSize);
    const inUse = yield* Ref.make(new Set<T>());
    const semaphore = yield* Semaphore.make(maxSize);
    
    return {
      acquire: () =>
        pipe(
          semaphore.take(1),
          Effect.flatMap(() =>
            pipe(
              available.poll,
              Effect.flatMap(option =>
                option._tag === 'Some'
                  ? Effect.succeed(option.value)
                  : factory()
              ),
              Effect.tap(resource =>
                Ref.update(inUse, set => set.add(resource))
              )
            )
          )
        ),
      
      release: (resource: T) =>
        pipe(
          Ref.update(inUse, set => set.delete(resource)),
          Effect.flatMap(() => available.offer(resource)),
          Effect.flatMap(() => semaphore.release(1))
        ),
      
      stats: () =>
        pipe(
          Effect.all({
            inUseSet: Ref.get(inUse),
            availableSize: available.size
          }),
          Effect.map(({ inUseSet, availableSize }) => ({
            inUse: inUseSet.size,
            available: availableSize
          }))
        )
    };
  });

// TODO: Create mock model factory
const createMockModel = (name: string): Effect.Effect<MockModel, never> =>
  Effect.gen(function* () {
    console.log(`🔄 Creating model ${name}...`);
    
    // Simulate model loading time
    yield* Effect.sleep(Duration.millis(1000 + Math.random() * 2000));
    
    const model: MockModel = {
      id: `${name}-${Date.now()}`,
      name,
      status: 'ready',
      predict: (input: string) =>
        pipe(
          Effect.sleep(Duration.millis(200 + Math.random() * 300)),
          Effect.flatMap(() => {
            if (Math.random() < 0.05) { // 5% failure rate
              return Effect.fail(new ModelError({
                modelId: model.id,
                reason: 'Model prediction failed'
              }));
            }
            return Effect.succeed(`${name} response: ${input.substring(0, 50)}...`);
          })
        ),
      cleanup: () =>
        Effect.sync(() => console.log(`🗑️ Cleaning up model ${model.id}`))
    };
    
    console.log(`✅ Model ${name} created: ${model.id}`);
    return model;
  });

// TODO: Test the resource pool
const testResourcePool = pipe(
  makeResourcePool(() => createMockModel('gpt-3.5-turbo'), 3),
  Effect.flatMap(pool =>
    pipe(
      // Simulate concurrent requests
      Array.from({ length: 10 }, (_, i) => i),
      Effect.forEach(
        i =>
          pipe(
            pool.acquire(),
            Effect.flatMap(model =>
              pipe(
                model.predict(`Test input ${i}`),
                Effect.tap(response => 
                  Effect.sync(() => console.log(`Response ${i}: ${response}`))
                ),
                Effect.ensuring(pool.release(model))
              )
            ),
            Effect.catchAll(error =>
              Effect.sync(() => console.error(`Request ${i} failed:`, error))
            )
          ),
        { concurrency: 5 }
      ),
      Effect.flatMap(() => pool.stats()),
      Effect.tap(stats =>
        Effect.sync(() => console.log('Final pool stats:', stats))
      )
    )
  )
);

Effect.runPromise(testResourcePool);
```

### Phase 2: Caching Implementation (25 minutes)

**Instructions:**
- Add memory cache for frequent queries
- Implement cache invalidation with TTL
- Add cache hit/miss metrics
- Test cache performance impact

**Starter Code (`src/cache.ts`):**
```typescript
import { Effect, pipe, Ref, Duration } from 'effect';

interface CacheEntry<T> {
  readonly value: T;
  readonly createdAt: Date;
  readonly ttl: Duration.Duration;
}

interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly size: number;
  readonly hitRate: number;
}

// TODO: Implement simple cache
interface Cache<T> {
  readonly get: (key: string) => Effect.Effect<Option.Option<T>, never>;
  readonly set: (key: string, value: T, ttl?: Duration.Duration) => Effect.Effect<void, never>;
  readonly stats: () => Effect.Effect<CacheStats, never>;
}

const makeCache = <T>(maxSize: number): Effect.Effect<Cache<T>, never> =>
  Effect.gen(function* () {
    const cache = yield* Ref.make(new Map<string, CacheEntry<T>>());
    const stats = yield* Ref.make({ hits: 0, misses: 0 });
    
    const cleanup = () =>
      pipe(
        Ref.get(cache),
        Effect.flatMap(cacheMap => {
          const now = new Date();
          const toDelete: string[] = [];
          
          for (const [key, entry] of cacheMap.entries()) {
            const age = now.getTime() - entry.createdAt.getTime();
            if (age > Duration.toMillis(entry.ttl)) {
              toDelete.push(key);
            }
          }
          
          return Ref.update(cache, map => {
            toDelete.forEach(key => map.delete(key));
            return map;
          });
        })
      );
    
    return {
      get: (key: string) =>
        pipe(
          cleanup(),
          Effect.flatMap(() => Ref.get(cache)),
          Effect.flatMap(cacheMap => {
            const entry = cacheMap.get(key);
            if (entry) {
              return pipe(
                Ref.update(stats, s => ({ ...s, hits: s.hits + 1 })),
                Effect.map(() => Option.some(entry.value))
              );
            } else {
              return pipe(
                Ref.update(stats, s => ({ ...s, misses: s.misses + 1 })),
                Effect.map(() => Option.none())
              );
            }
          })
        ),
      
      set: (key: string, value: T, ttl = Duration.minutes(30)) =>
        pipe(
          cleanup(),
          Effect.flatMap(() => {
            const entry: CacheEntry<T> = {
              value,
              createdAt: new Date(),
              ttl
            };
            
            return Ref.update(cache, map => {
              // Simple eviction: remove oldest if at capacity
              if (map.size >= maxSize) {
                const firstKey = map.keys().next().value;
                if (firstKey) map.delete(firstKey);
              }
              
              map.set(key, entry);
              return map;
            });
          })
        ),
      
      stats: () =>
        pipe(
          Effect.all({
            cache: Ref.get(cache),
            stats: Ref.get(stats)
          }),
          Effect.map(({ cache, stats }) => ({
            hits: stats.hits,
            misses: stats.misses,
            size: cache.size,
            hitRate: stats.hits + stats.misses > 0 
              ? stats.hits / (stats.hits + stats.misses) 
              : 0
          }))
        )
    };
  });

// TODO: Test caching performance
const testCache = pipe(
  makeCache<string>(100),
  Effect.flatMap(cache =>
    pipe(
      // Set some values
      Effect.all([
        cache.set('key1', 'value1'),
        cache.set('key2', 'value2'),
        cache.set('key3', 'value3')
      ]),
      Effect.flatMap(() =>
        // Test cache hits and misses
        Effect.all([
          cache.get('key1'), // Should hit
          cache.get('key2'), // Should hit
          cache.get('nonexistent'), // Should miss
          cache.get('key3') // Should hit
        ])
      ),
      Effect.tap(results =>
        Effect.sync(() => console.log('Cache results:', results))
      ),
      Effect.flatMap(() => cache.stats()),
      Effect.tap(stats =>
        Effect.sync(() => console.log('Cache stats:', stats))
      )
    )
  )
);

Effect.runPromise(testCache);
```

### Phase 3: Circuit Breaker and A/B Testing (25 minutes)

**Instructions:**
- Implement experiment configuration
- Add user segmentation logic
- Route requests to different models
- Collect experiment metrics

**Starter Code (`src/experiments.ts`):**
```typescript
import { Effect, pipe, Ref } from 'effect';

interface Experiment {
  readonly id: string;
  readonly variants: ReadonlyArray<{
    readonly name: string;
    readonly weight: number;
  }>;
}

interface ExperimentResult {
  readonly experimentId: string;
  readonly variant: string;
  readonly userId: string;
  readonly success: boolean;
  readonly latency: number;
}

// TODO: Implement A/B testing
interface ExperimentService {
  readonly getVariant: (userId: string, experimentId: string) => Effect.Effect<string, never>;
  readonly recordResult: (result: ExperimentResult) => Effect.Effect<void, never>;
  readonly getStats: (experimentId: string) => Effect.Effect<Record<string, {
    requests: number;
    successRate: number;
    avgLatency: number;
  }>, never>;
}

const makeExperimentService = (): Effect.Effect<ExperimentService, never> =>
  Effect.gen(function* () {
    const experiments = yield* Ref.make(new Map<string, Experiment>());
    const results = yield* Ref.make(new Array<ExperimentResult>());
    
    // Simple hash function for consistent user assignment
    const hashUser = (userId: string, experimentId: string): number => {
      let hash = 0;
      const str = `${userId}-${experimentId}`;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
      }
      return Math.abs(hash) % 100 / 100; // 0-1
    };
    
    // Set up a sample experiment
    yield* Ref.set(experiments, new Map([
      ['model-comparison', {
        id: 'model-comparison',
        variants: [
          { name: 'gpt-3.5-turbo', weight: 0.5 },
          { name: 'gpt-4', weight: 0.5 }
        ]
      }]
    ]));
    
    return {
      getVariant: (userId: string, experimentId: string) =>
        pipe(
          Ref.get(experiments),
          Effect.map(expMap => {
            const experiment = expMap.get(experimentId);
            if (!experiment) return 'gpt-3.5-turbo'; // Default
            
            const hash = hashUser(userId, experimentId);
            let cumulative = 0;
            
            for (const variant of experiment.variants) {
              cumulative += variant.weight;
              if (hash <= cumulative) {
                return variant.name;
              }
            }
            
            return experiment.variants[0].name; // Fallback
          })
        ),
      
      recordResult: (result: ExperimentResult) =>
        Ref.update(results, arr => [...arr, result]),
      
      getStats: (experimentId: string) =>
        pipe(
          Ref.get(results),
          Effect.map(allResults => {
            const expResults = allResults.filter(r => r.experimentId === experimentId);
            const variantStats: Record<string, { requests: number; successRate: number; avgLatency: number }> = {};
            
            for (const result of expResults) {
              if (!variantStats[result.variant]) {
                variantStats[result.variant] = {
                  requests: 0,
                  successRate: 0,
                  avgLatency: 0
                };
              }
              
              const stats = variantStats[result.variant];
              const prevRequests = stats.requests;
              stats.requests++;
              
              // Update success rate
              stats.successRate = (stats.successRate * prevRequests + (result.success ? 1 : 0)) / stats.requests;
              
              // Update average latency
              stats.avgLatency = (stats.avgLatency * prevRequests + result.latency) / stats.requests;
            }
            
            return variantStats;
          })
        )
    };
  });

// TODO: Test A/B testing
const testExperiments = pipe(
  makeExperimentService(),
  Effect.flatMap(service =>
    pipe(
      // Test variant assignment for different users
      Effect.all([
        service.getVariant('user1', 'model-comparison'),
        service.getVariant('user2', 'model-comparison'),
        service.getVariant('user3', 'model-comparison'),
        service.getVariant('user1', 'model-comparison'), // Should be consistent
      ]),
      Effect.tap(variants =>
        Effect.sync(() => console.log('Variant assignments:', variants))
      ),
      Effect.flatMap(() =>
        // Record some results
        Effect.all([
          service.recordResult({
            experimentId: 'model-comparison',
            variant: 'gpt-3.5-turbo',
            userId: 'user1',
            success: true,
            latency: 800
          }),
          service.recordResult({
            experimentId: 'model-comparison',
            variant: 'gpt-4',
            userId: 'user2',
            success: true,
            latency: 1200
          }),
          service.recordResult({
            experimentId: 'model-comparison',
            variant: 'gpt-3.5-turbo',
            userId: 'user3',
            success: false,
            latency: 500
          })
        ])
      ),
      Effect.flatMap(() => service.getStats('model-comparison')),
      Effect.tap(stats =>
        Effect.sync(() => console.log('Experiment stats:', stats))
      )
    )
  )
);

Effect.runPromise(testExperiments);
```

### Workshop Debrief (10 minutes)

**Questions to ask:**
- "How did resource pooling change your approach to managing expensive resources?"
- "What was the impact of adding caching to your system?"
- "How would you decide when to use circuit breakers?"
- "What challenges did you encounter with A/B testing implementation?"

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Production-Scale Patterns**
- **Resource pools** manage expensive resources efficiently
- **Circuit breakers** prevent cascade failures
- **Multi-level caching** reduces latency and cost
- **A/B testing** enables safe model experimentation

**2. Advanced Effect Patterns**
- **Ref and Queue** for managing mutable state safely
- **Semaphores** for controlling resource access
- **Complex service composition** with multiple dependencies
- **Error recovery strategies** that adapt to different failure modes

**3. AI System Architecture**
- **Model orchestration** with intelligent routing
- **Performance monitoring** and cost optimization
- **Graceful degradation** when services fail
- **Experimentation frameworks** for continuous improvement

**4. Production Considerations**
- **Resource management** prevents memory leaks and resource exhaustion
- **Observability** provides actionable insights
- **Cost optimization** through intelligent caching and routing
- **Reliability** through redundancy and fallback strategies

### Connection to Previous Weeks
"All our previous patterns come together here. Our service architecture enables clean model management. Our error handling ensures graceful failures. Our concurrency patterns allow parallel model inference. Our streaming capabilities enable real-time model monitoring."

### Bridge to Week 7
"We've built a sophisticated AI orchestrator, but how do we know it's working correctly in production? How do we debug issues when they arise? Next week we'll focus on testing strategies and observability - the tools that let us ship with confidence and maintain systems at scale."

### Homework Assignment

**Add model performance benchmarking to your orchestrator:**
1. **Automated benchmarking** - Run test queries against new models
2. **Accuracy measurement** - Compare against ground truth datasets
3. **Performance profiling** - Track latency, throughput, and resource usage
4. **Quality gates** - Only promote models that meet thresholds

**Bonus challenges:**
- Implement model versioning and rollback capabilities
- Add cost budgeting and alerts
- Create a model recommendation engine
- Build a model performance dashboard

---

## 🎓 Assessment Rubric

### Advanced Technical Skills
- [ ] **Resource pool implementation** - proper lifecycle management
- [ ] **Multi-level caching strategies** - efficient cache hierarchies
- [ ] **A/B testing framework design** - consistent user assignment
- [ ] **Circuit breaker patterns** - failure detection and recovery

### System Design Maturity
- [ ] Understanding of production AI challenges and solutions
- [ ] Ability to design for scale and reliability
- [ ] Knowledge of performance optimization techniques
- [ ] Awareness of operational concerns and monitoring needs

### Code Quality and Architecture
- [ ] **Proper abstraction** - clean interfaces and implementations
- [ ] **Effective composition** - services work together seamlessly
- [ ] **Comprehensive error handling** - all failure modes considered
- [ ] **Resource management** - no leaks or exhaustion

### Production Readiness
- [ ] **Monitoring integration** - metrics and observability
- [ ] **Graceful degradation** - fallback strategies
- [ ] **Configuration management** - externalized settings
- [ ] **Deployment considerations** - scalability and reliability

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Resource Management](https://effect.website/docs/resource-management)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Cache Strategies](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)

### Code Examples
- [Complete AI Orchestrator](./examples/ai-orchestrator/)
- [Advanced Effect Patterns](./examples/advanced-patterns/)
- [Production Monitoring](./examples/production-monitoring/)

### Next Week Prep
- Think about testing strategies for complex systems
- Consider: How do you test AI systems that are non-deterministic?
- Read about observability and monitoring best practices

---

*"Production systems are not just about handling the happy path - they're about gracefully handling everything that can go wrong, and many things you haven't thought of yet."*