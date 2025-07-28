# Week 3: Concurrency & AI Image Pipeline
## Making Parallel Processing Safe and Composable

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Master Effect's concurrency primitives** (`Effect.forEach`, `Effect.all`, resource management)
- **Understand the difference between concurrency and parallelism** in Effect systems
- **Build a production-ready AI image processing pipeline** that handles thousands of images safely
- **Implement proper resource management** with `acquireUseRelease` patterns
- **Design systems that handle backpressure** and resource exhaustion gracefully

---

## 🔥 Opening Demo: The Sequential Nightmare (25 minutes)

### The Scenario
You're building an AI-powered image processing service. Users upload batches of images, and you need to:
1. Load each image from disk
2. Resize it for optimal processing
3. Run AI analysis (object detection, OCR, classification)
4. Save the results
5. Generate a summary report

Let's see what happens when we process 10 images sequentially...

### Live Coding: Sequential Image Processing

```typescript
// image-processor-sequential.ts - The slow way
import fs from 'fs/promises';
import sharp from 'sharp';
import OpenAI from 'openai';

interface ImageAnalysis {
  imagePath: string;
  objects: string[];
  text: string;
  classification: string;
  processingTime: number;
}

interface ProcessingReport {
  totalImages: number;
  successfulImages: number;
  failedImages: number;
  totalTime: number;
  analyses: ImageAnalysis[];
}

// Step 1: Load and resize image
async function loadAndResizeImage(imagePath: string): Promise<Buffer> {
  console.log(`📁 Loading ${imagePath}...`);
  const startTime = Date.now();
  
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const resizedBuffer = await sharp(imageBuffer)
      .resize(512, 512, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    console.log(`✅ Loaded ${imagePath} in ${Date.now() - startTime}ms`);
    return resizedBuffer;
  } catch (error) {
    console.error(`❌ Failed to load ${imagePath}:`, error.message);
    throw error;
  }
}

// Step 2: Object detection
async function detectObjects(imageBuffer: Buffer): Promise<string[]> {
  console.log('🔍 Detecting objects...');
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  
  // Mock results
  const objects = ['person', 'car', 'building', 'tree'];
  return objects.slice(0, Math.floor(Math.random() * 4) + 1);
}

// Step 3: OCR text extraction
async function extractText(imageBuffer: Buffer): Promise<string> {
  console.log('📝 Extracting text...');
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  return `Sample text extracted from image`;
}

// Step 4: Image classification
async function classifyImage(imageBuffer: Buffer): Promise<string> {
  console.log('🏷️ Classifying image...');
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
  
  const categories = ['nature', 'urban', 'portrait', 'abstract'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Step 5: Save results
async function saveResults(imagePath: string, analysis: Omit<ImageAnalysis, 'imagePath' | 'processingTime'>): Promise<void> {
  console.log(`💾 Saving results for ${imagePath}...`);
  const outputPath = imagePath.replace(/\.[^/.]+$/, '_analysis.json');
  await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
}

// The main processing function - PAINFULLY SLOW
async function processImagesSequentially(imagePaths: string[]): Promise<ProcessingReport> {
  const startTime = Date.now();
  const analyses: ImageAnalysis[] = [];
  let successfulImages = 0;
  let failedImages = 0;

  console.log(`🚀 Starting sequential processing of ${imagePaths.length} images...`);

  for (const imagePath of imagePaths) {
    const imageStartTime = Date.now();
    
    try {
      console.log(`\n--- Processing ${imagePath} ---`);
      
      // Step 1: Load and resize (sequential)
      const imageBuffer = await loadAndResizeImage(imagePath);
      
      // Step 2-4: AI processing (sequential - this is the killer!)
      const objects = await detectObjects(imageBuffer);
      const text = await extractText(imageBuffer);
      const classification = await classifyImage(imageBuffer);
      
      // Step 5: Save results
      const analysis = { objects, text, classification };
      await saveResults(imagePath, analysis);
      
      const processingTime = Date.now() - imageStartTime;
      analyses.push({
        imagePath,
        objects,
        text,
        classification,
        processingTime
      });
      
      successfulImages++;
      console.log(`✅ Completed ${imagePath} in ${processingTime}ms`);
      
    } catch (error) {
      failedImages++;
      console.error(`❌ Failed to process ${imagePath}:`, error.message);
    }
  }

  const totalTime = Date.now() - startTime;
  
  return {
    totalImages: imagePaths.length,
    successfulImages,
    failedImages,
    totalTime,
    analyses
  };
}

// Demo with 10 images
async function demo() {
  const imagePaths = Array.from({ length: 10 }, (_, i) => `image_${i + 1}.jpg`);
  
  console.log('⏱️ Starting sequential processing...');
  const report = await processImagesSequentially(imagePaths);
  
  console.log('\n📊 FINAL REPORT:');
  console.log(`Total time: ${report.totalTime}ms (${(report.totalTime / 1000).toFixed(1)}s)`);
  console.log(`Average per image: ${(report.totalTime / report.totalImages).toFixed(0)}ms`);
  console.log(`Success rate: ${((report.successfulImages / report.totalImages) * 100).toFixed(1)}%`);
  
  // Show CPU usage during processing
  console.log('\n💻 System Impact:');
  console.log('- Single CPU core maxed out');
  console.log('- Other cores idle');
  console.log('- Memory usage spikes with each image');
  console.log('- Network connections unused during AI processing');
}

demo();
```

### Discussion Questions (10 minutes)

**Ask the class:**
1. "How long do you think this took?" *(Probably 45-60 seconds for 10 images)*
2. "What's the problem here?"
   - **Sequential bottleneck**: Each AI operation waits for the previous one
   - **Resource underutilization**: Only using one CPU core, one network connection
   - **No parallelism**: Object detection, OCR, and classification could run simultaneously
   - **Memory inefficiency**: Loading images one at a time
   - **Poor user experience**: Users wait forever for results

3. "How would you make this faster?"
   - Common answers: "Use threads", "Process multiple images at once", "Run AI operations in parallel"
   - "What about error handling? Resource management? Memory limits?"

**The Setup:** "Let's see how Effect makes concurrent processing both fast AND safe..."

---

## 🚀 Enter Effect: Concurrency Made Safe (50 minutes)

### Part 1: Understanding Effect Concurrency (15 minutes)

```typescript
// image-processor-effect.ts - The Effect way
import { Effect, pipe, Duration } from 'effect';
import { FileSystem } from '@effect/platform';
import { Data } from 'effect';

// First, let's define our domain types and errors
interface ImageAnalysis {
  readonly imagePath: string;
  readonly objects: ReadonlyArray<string>;
  readonly text: string;
  readonly classification: string;
  readonly processingTime: number;
}

interface ProcessingReport {
  readonly totalImages: number;
  readonly successfulImages: number;
  readonly failedImages: number;
  readonly totalTime: number;
  readonly analyses: ReadonlyArray<ImageAnalysis>;
}

// Error types from our previous lessons
class ImageLoadError extends Data.TaggedError('ImageLoadError')<{
  readonly imagePath: string;
  readonly reason: string;
}> {}

class AIProcessingError extends Data.TaggedError('AIProcessingError')<{
  readonly operation: string;
  readonly reason: string;
}> {}

class FileSystemError extends Data.TaggedError('FileSystemError')<{
  readonly operation: string;
  readonly path: string;
  readonly reason: string;
}> {}

type ProcessingError = ImageLoadError | AIProcessingError | FileSystemError;
```

**Key Concept: Concurrency vs Parallelism**
```typescript
// Sequential - one after another
const sequential = pipe(
  operation1,
  Effect.flatMap(() => operation2),
  Effect.flatMap(() => operation3)
);

// Concurrent - Effect manages the execution
const concurrent = Effect.all({
  result1: operation1,
  result2: operation2,
  result3: operation3
}, { concurrency: 3 }); // Run up to 3 at once

// Parallel - all at once (can be dangerous!)
const parallel = Effect.all({
  result1: operation1,
  result2: operation2,
  result3: operation3
}, { concurrency: "unbounded" }); // No limits!
```

### Part 2: Concurrent Image Processing (20 minutes)

```typescript
// Service implementations with Effect
const loadAndResizeImage = (imagePath: string): Effect.Effect<Buffer, ImageLoadError> =>
  pipe(
    FileSystem.readFile(imagePath),
    Effect.flatMap(buffer =>
      // Simulate sharp processing
      Effect.promise(() => 
        new Promise<Buffer>((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate
              resolve(Buffer.from(`processed-${imagePath}`));
            } else {
              reject(new Error('Image processing failed'));
            }
          }, 200 + Math.random() * 300); // 200-500ms
        })
      )
    ),
    Effect.mapError(error => 
      new ImageLoadError({ imagePath, reason: error.message })
    ),
    Effect.timeout(Duration.seconds(5)),
    Effect.withSpan('load-resize-image', { attributes: { imagePath } })
  );

const detectObjects = (imageBuffer: Buffer): Effect.Effect<ReadonlyArray<string>, AIProcessingError> =>
  pipe(
    Effect.promise(() => 
      new Promise<string[]>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.05) { // 95% success rate
            const objects = ['person', 'car', 'building', 'tree'];
            resolve(objects.slice(0, Math.floor(Math.random() * 4) + 1));
          } else {
            reject(new Error('Object detection service unavailable'));
          }
        }, 1500 + Math.random() * 1000); // 1.5-2.5s
      })
    ),
    Effect.mapError(error => 
      new AIProcessingError({ operation: 'object-detection', reason: error.message })
    ),
    Effect.timeout(Duration.seconds(10)),
    Effect.withSpan('detect-objects')
  );

const extractText = (imageBuffer: Buffer): Effect.Effect<string, AIProcessingError> =>
  pipe(
    Effect.promise(() => 
      new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.05) {
            resolve(`Extracted text from image`);
          } else {
            reject(new Error('OCR service timeout'));
          }
        }, 1000 + Math.random() * 1000); // 1-2s
      })
    ),
    Effect.mapError(error => 
      new AIProcessingError({ operation: 'text-extraction', reason: error.message })
    ),
    Effect.timeout(Duration.seconds(8)),
    Effect.withSpan('extract-text')
  );

const classifyImage = (imageBuffer: Buffer): Effect.Effect<string, AIProcessingError> =>
  pipe(
    Effect.promise(() => 
      new Promise<string>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.03) {
            const categories = ['nature', 'urban', 'portrait', 'abstract'];
            resolve(categories[Math.floor(Math.random() * categories.length)]);
          } else {
            reject(new Error('Classification model overloaded'));
          }
        }, 800 + Math.random() * 400); // 0.8-1.2s
      })
    ),
    Effect.mapError(error => 
      new AIProcessingError({ operation: 'classification', reason: error.message })
    ),
    Effect.timeout(Duration.seconds(5)),
    Effect.withSpan('classify-image')
  );

// The magic happens here - concurrent AI processing per image
const processImageAI = (imageBuffer: Buffer): Effect.Effect<{
  objects: ReadonlyArray<string>;
  text: string;
  classification: string;
}, AIProcessingError> =>
  pipe(
    Effect.all({
      objects: detectObjects(imageBuffer),
      text: extractText(imageBuffer),
      classification: classifyImage(imageBuffer)
    }, { concurrency: 3 }), // Run all 3 AI operations in parallel!
    Effect.withSpan('process-image-ai')
  );

// Process a single image end-to-end
const processSingleImage = (imagePath: string): Effect.Effect<ImageAnalysis, ProcessingError> =>
  pipe(
    Effect.sync(() => Date.now()),
    Effect.flatMap(startTime =>
      pipe(
        loadAndResizeImage(imagePath),
        Effect.flatMap(imageBuffer => processImageAI(imageBuffer)),
        Effect.map(aiResults => ({
          imagePath,
          ...aiResults,
          processingTime: Date.now() - startTime
        }))
      )
    ),
    Effect.withSpan('process-single-image', { attributes: { imagePath } })
  );
```

### Part 3: Resource Management and Backpressure (15 minutes)

```typescript
// Resource-aware concurrent processing
const processImagesWithResourceManagement = (
  imagePaths: ReadonlyArray<string>
): Effect.Effect<ProcessingReport, ProcessingError> =>
  pipe(
    Effect.sync(() => Date.now()),
    Effect.flatMap(startTime =>
      pipe(
        imagePaths,
        // THIS IS THE KEY - controlled concurrency
        Effect.forEach(
          imagePath => 
            pipe(
              processSingleImage(imagePath),
              Effect.either, // Convert failures to Either so we can collect them
              Effect.tap(result => 
                Effect.sync(() => 
                  console.log(
                    result._tag === 'Right' 
                      ? `✅ Completed ${imagePath} in ${result.right.processingTime}ms`
                      : `❌ Failed ${imagePath}: ${result.left.reason}`
                  )
                )
              )
            ),
          { 
            concurrency: 5, // Process max 5 images simultaneously
            discard: false  // Keep all results
          }
        ),
        Effect.map(results => {
          const successes = results.filter(r => r._tag === 'Right').map(r => r.right);
          const failures = results.filter(r => r._tag === 'Left');
          
          return {
            totalImages: imagePaths.length,
            successfulImages: successes.length,
            failedImages: failures.length,
            totalTime: Date.now() - startTime,
            analyses: successes
          } as ProcessingReport;
        })
      )
    ),
    Effect.withSpan('process-images-batch', { 
      attributes: { totalImages: imagePaths.length } 
    })
  );

// Advanced: Resource pool for managing file handles
const withFileHandlePool = <A, E>(
  effect: Effect.Effect<A, E>
): Effect.Effect<A, E> =>
  pipe(
    Effect.acquireUseRelease(
      Effect.sync(() => {
        console.log('📂 Acquiring file handle pool...');
        return { maxHandles: 10, currentHandles: 0 };
      }),
      pool => 
        pipe(
          effect,
          Effect.tap(() => Effect.sync(() => console.log(`📁 Using ${pool.currentHandles}/${pool.maxHandles} handles`)))
        ),
      pool => 
        Effect.sync(() => {
          console.log('📂 Releasing file handle pool...');
          // Cleanup logic here
        })
    )
  );

// Memory-aware processing with backpressure
const processImagesWithBackpressure = (
  imagePaths: ReadonlyArray<string>
): Effect.Effect<ProcessingReport, ProcessingError> =>
  pipe(
    processImagesWithResourceManagement(imagePaths),
    withFileHandlePool,
    Effect.timeout(Duration.minutes(10)), // Overall timeout
    Effect.retry({
      schedule: Schedule.exponential(Duration.seconds(1)),
      while: error => error._tag === 'AIProcessingError' // Only retry AI errors
    })
  );
```

**Key Insights to Highlight:**

1. **Controlled Concurrency**: `{ concurrency: 5 }` prevents overwhelming the system
2. **Resource Management**: `acquireUseRelease` ensures cleanup even on errors
3. **Error Isolation**: One image failure doesn't crash the whole batch
4. **Backpressure Handling**: System adapts to available resources
5. **Observability**: Built-in tracing shows exactly what's happening

---

## 🛠️ Hands-On Workshop: Build Your Image Pipeline (80 minutes)

### Setup (10 minutes)

```bash
mkdir ai-image-pipeline
cd ai-image-pipeline
npm init -y
npm install effect @effect/platform
npm install -D typescript @types/node tsx
```

### Phase 1: Basic Concurrent Processing (25 minutes)

**Instructions:**
- Form pairs
- Start with sequential processing
- Add concurrency step by step
- Measure the performance improvement

**Starter Code (`src/processor.ts`):**
```typescript
import { Effect, pipe, Duration } from 'effect';
import { Data } from 'effect';

interface ImageResult {
  readonly imagePath: string;
  readonly success: boolean;
  readonly processingTime: number;
  readonly result?: {
    readonly objects: ReadonlyArray<string>;
    readonly text: string;
    readonly classification: string;
  };
  readonly error?: string;
}

// TODO: Define your error types
class ProcessingError extends Data.TaggedError('ProcessingError')<{
  readonly imagePath: string;
  readonly reason: string;
}> {}

// TODO: Implement AI simulation functions
const simulateObjectDetection = (imagePath: string): Effect.Effect<ReadonlyArray<string>, ProcessingError> =>
  pipe(
    Effect.sleep(Duration.millis(1500 + Math.random() * 1000)), // 1.5-2.5s
    Effect.flatMap(() => {
      if (Math.random() > 0.1) {
        const objects = ['person', 'car', 'building', 'tree', 'sky'];
        return Effect.succeed(objects.slice(0, Math.floor(Math.random() * 3) + 1));
      } else {
        return Effect.fail(new ProcessingError({ 
          imagePath, 
          reason: 'Object detection failed' 
        }));
      }
    })
  );

const simulateTextExtraction = (imagePath: string): Effect.Effect<string, ProcessingError> =>
  pipe(
    Effect.sleep(Duration.millis(1000 + Math.random() * 1000)), // 1-2s
    Effect.flatMap(() => {
      if (Math.random() > 0.05) {
        return Effect.succeed(`Text found in ${imagePath}`);
      } else {
        return Effect.fail(new ProcessingError({ 
          imagePath, 
          reason: 'Text extraction failed' 
        }));
      }
    })
  );

const simulateClassification = (imagePath: string): Effect.Effect<string, ProcessingError> =>
  pipe(
    Effect.sleep(Duration.millis(800 + Math.random() * 400)), // 0.8-1.2s
    Effect.flatMap(() => {
      if (Math.random() > 0.03) {
        const categories = ['nature', 'urban', 'portrait', 'abstract'];
        return Effect.succeed(categories[Math.floor(Math.random() * categories.length)]);
      } else {
        return Effect.fail(new ProcessingError({ 
          imagePath, 
          reason: 'Classification failed' 
        }));
      }
    })
  );

// TODO: Implement sequential processing first
const processImageSequential = (imagePath: string): Effect.Effect<ImageResult, never> =>
  pipe(
    Effect.sync(() => Date.now()),
    Effect.flatMap(startTime =>
      pipe(
        // Process AI operations one by one
        simulateObjectDetection(imagePath),
        Effect.flatMap(objects =>
          pipe(
            simulateTextExtraction(imagePath),
            Effect.flatMap(text =>
              pipe(
                simulateClassification(imagePath),
                Effect.map(classification => ({
                  imagePath,
                  success: true as const,
                  processingTime: Date.now() - startTime,
                  result: { objects, text, classification }
                }))
              )
            )
          )
        ),
        Effect.catchAll(error => 
          Effect.succeed({
            imagePath,
            success: false as const,
            processingTime: Date.now() - startTime,
            error: error.reason
          })
        )
      )
    )
  );

// TODO: Now implement concurrent processing
const processImageConcurrent = (imagePath: string): Effect.Effect<ImageResult, never> =>
  pipe(
    Effect.sync(() => Date.now()),
    Effect.flatMap(startTime =>
      pipe(
        // TODO: Run all AI operations concurrently using Effect.all
        Effect.all({
          objects: simulateObjectDetection(imagePath),
          text: simulateTextExtraction(imagePath),
          classification: simulateClassification(imagePath)
        }, { concurrency: 3 }), // Run all 3 in parallel
        
        Effect.map(result => ({
          imagePath,
          success: true as const,
          processingTime: Date.now() - startTime,
          result
        })),
        
        Effect.catchAll(error => 
          Effect.succeed({
            imagePath,
            success: false as const,
            processingTime: Date.now() - startTime,
            error: error.reason
          })
        )
      )
    )
  );

// TODO: Process multiple images
const processMultipleImages = (
  imagePaths: ReadonlyArray<string>,
  concurrent: boolean = false
): Effect.Effect<ReadonlyArray<ImageResult>, never> =>
  pipe(
    imagePaths,
    Effect.forEach(
      concurrent ? processImageConcurrent : processImageSequential,
      { 
        concurrency: concurrent ? 3 : 1, // Process 3 images at once when concurrent
        discard: false 
      }
    )
  );

// Test program
const testProgram = pipe(
  Effect.sync(() => Array.from({ length: 6 }, (_, i) => `image_${i + 1}.jpg`)),
  Effect.flatMap(imagePaths =>
    pipe(
      Effect.all({
        sequential: pipe(
          Effect.sync(() => console.log('\n🐌 Sequential Processing:')),
          Effect.flatMap(() => processMultipleImages(imagePaths, false))
        ),
        concurrent: pipe(
          Effect.sync(() => console.log('\n🚀 Concurrent Processing:')),
          Effect.flatMap(() => processMultipleImages(imagePaths, true))
        )
      })
    )
  ),
  Effect.tap(({ sequential, concurrent }) =>
    Effect.sync(() => {
      const seqTotal = sequential.reduce((sum, r) => sum + r.processingTime, 0);
      const concTotal = concurrent.reduce((sum, r) => sum + r.processingTime, 0);
      const seqSuccess = sequential.filter(r => r.success).length;
      const concSuccess = concurrent.filter(r => r.success).length;
      
      console.log('\n📊 COMPARISON:');
      console.log(`Sequential: ${seqTotal}ms total, ${seqSuccess}/${sequential.length} success`);
      console.log(`Concurrent: ${concTotal}ms total, ${concSuccess}/${concurrent.length} success`);
      console.log(`Speedup: ${(seqTotal / concTotal).toFixed(1)}x faster`);
    })
  )
);

Effect.runPromise(testProgram);
```

### Phase 2: Resource Management (25 minutes)

**Instructions:**
- Add proper resource management
- Implement file handle limits
- Add memory usage monitoring
- Handle resource exhaustion gracefully

**Starter Code (`src/resources.ts`):**
```typescript
import { Effect, pipe, Ref, Semaphore } from 'effect';

// TODO: Create a resource pool
interface ResourcePool {
  readonly acquire: () => Effect.Effect<string, never>; // Resource ID
  readonly release: (resourceId: string) => Effect.Effect<void, never>;
  readonly stats: () => Effect.Effect<{ inUse: number; available: number }, never>;
}

const makeResourcePool = (maxResources: number): Effect.Effect<ResourcePool, never> =>
  pipe(
    Effect.all({
      semaphore: Effect.sync(() => Semaphore.unsafeMake(maxResources)),
      inUse: Ref.make(new Set<string>())
    }),
    Effect.map(({ semaphore, inUse }) => ({
      acquire: () =>
        pipe(
          semaphore.take(1),
          Effect.flatMap(() => {
            const resourceId = `resource-${Date.now()}-${Math.random()}`;
            return pipe(
              Ref.update(inUse, set => set.add(resourceId)),
              Effect.map(() => resourceId)
            );
          })
        ),
      
      release: (resourceId: string) =>
        pipe(
          Ref.update(inUse, set => set.delete(resourceId)),
          Effect.flatMap(() => semaphore.release(1))
        ),
      
      stats: () =>
        pipe(
          Ref.get(inUse),
          Effect.map(inUseSet => ({
            inUse: inUseSet.size,
            available: maxResources - inUseSet.size
          }))
        )
    }))
  );

// TODO: Use the resource pool in image processing
const processImageWithResources = (
  imagePath: string,
  resourcePool: ResourcePool
): Effect.Effect<ImageResult, never> =>
  pipe(
    Effect.acquireUseRelease(
      resourcePool.acquire(),
      resourceId => 
        pipe(
          Effect.sync(() => console.log(`🔧 Processing ${imagePath} with ${resourceId}`)),
          Effect.flatMap(() => processImageConcurrent(imagePath)),
          Effect.tap(result => 
            resourcePool.stats().pipe(
              Effect.tap(stats => 
                Effect.sync(() => 
                  console.log(`📊 Resources: ${stats.inUse} in use, ${stats.available} available`)
                )
              )
            )
          )
        ),
      resourceId => resourcePool.release(resourceId)
    )
  );

// Test with resource management
const testWithResources = pipe(
  makeResourcePool(3), // Only 3 concurrent resources
  Effect.flatMap(pool =>
    pipe(
      Array.from({ length: 8 }, (_, i) => `image_${i + 1}.jpg`),
      Effect.forEach(
        imagePath => processImageWithResources(imagePath, pool),
        { concurrency: 5 } // Try to process 5 at once, but limited by resource pool
      )
    )
  )
);

Effect.runPromise(testWithResources);
```

### Phase 3: Performance Analysis and Optimization (30 minutes)

**Instructions:**
- Add performance monitoring
- Implement different concurrency strategies
- Test with varying load levels
- Identify optimal concurrency settings

**Starter Code (`src/benchmark.ts`):**
```typescript
import { Effect, pipe, Duration, Ref } from 'effect';

interface BenchmarkResult {
  readonly strategy: string;
  readonly totalTime: number;
  readonly averageTime: number;
  readonly successRate: number;
  readonly throughput: number; // images per second
}

// TODO: Implement different concurrency strategies
const strategies = {
  sequential: (images: ReadonlyArray<string>) =>
    Effect.forEach(images, processImageConcurrent, { concurrency: 1 }),
  
  lowConcurrency: (images: ReadonlyArray<string>) =>
    Effect.forEach(images, processImageConcurrent, { concurrency: 2 }),
  
  mediumConcurrency: (images: ReadonlyArray<string>) =>
    Effect.forEach(images, processImageConcurrent, { concurrency: 5 }),
  
  highConcurrency: (images: ReadonlyArray<string>) =>
    Effect.forEach(images, processImageConcurrent, { concurrency: 10 }),
  
  unbounded: (images: ReadonlyArray<string>) =>
    Effect.forEach(images, processImageConcurrent, { concurrency: "unbounded" })
};

// TODO: Benchmark each strategy
const benchmarkStrategy = (
  name: string,
  strategy: (images: ReadonlyArray<string>) => Effect.Effect<ReadonlyArray<ImageResult>, never>,
  images: ReadonlyArray<string>
): Effect.Effect<BenchmarkResult, never> =>
  pipe(
    Effect.sync(() => {
      console.log(`\n🏃 Running ${name} strategy...`);
      return Date.now();
    }),
    Effect.flatMap(startTime =>
      pipe(
        strategy(images),
        Effect.map(results => {
          const totalTime = Date.now() - startTime;
          const successful = results.filter(r => r.success).length;
          
          return {
            strategy: name,
            totalTime,
            averageTime: totalTime / images.length,
            successRate: (successful / images.length) * 100,
            throughput: (images.length / totalTime) * 1000 // per second
          };
        })
      )
    )
  );

// TODO: Run comprehensive benchmark
const runBenchmark = pipe(
  Effect.sync(() => Array.from({ length: 12 }, (_, i) => `benchmark_image_${i + 1}.jpg`)),
  Effect.flatMap(images =>
    pipe(
      Object.entries(strategies),
      Effect.forEach(
        ([name, strategy]) => benchmarkStrategy(name, strategy, images),
        { concurrency: 1 } // Run benchmarks sequentially for fair comparison
      )
    )
  ),
  Effect.tap(results =>
    Effect.sync(() => {
      console.log('\n📈 BENCHMARK RESULTS:');
      console.log('Strategy'.padEnd(20) + 'Time(ms)'.padEnd(12) + 'Success%'.padEnd(12) + 'Throughput(img/s)');
      console.log('-'.repeat(60));
      
      results.forEach(result => {
        console.log(
          result.strategy.padEnd(20) +
          result.totalTime.toString().padEnd(12) +
          result.successRate.toFixed(1).padEnd(12) +
          result.throughput.toFixed(2)
        );
      });
      
      const fastest = results.reduce((min, curr) => 
        curr.totalTime < min.totalTime ? curr : min
      );
      console.log(`\n🏆 Winner: ${fastest.strategy} (${fastest.totalTime}ms)`);
    })
  )
);

Effect.runPromise(runBenchmark);
```

### Workshop Debrief (10 minutes)

**Questions to ask:**
- "What was the performance difference between sequential and concurrent?"
- "At what concurrency level did you see diminishing returns?"
- "What happened when you used unbounded concurrency?"
- "How did resource management affect the results?"

---

## 🎯 Advanced Concurrency Patterns (15 minutes)

### Semaphores for Rate Limiting
```typescript
// Limit concurrent API calls to avoid overwhelming services
const aiServiceSemaphore = Effect.unsafeMakeSemaphore(3);

const rateLimitedAICall = <A, E>(operation: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  aiServiceSemaphore.withPermit(operation);

const processWithRateLimit = (imagePath: string) =>
  pipe(
    loadAndResizeImage(imagePath),
    Effect.flatMap(imageBuffer =>
      Effect.all({
        objects: rateLimitedAICall(detectObjects(imageBuffer)),
        text: rateLimitedAICall(extractText(imageBuffer)),
        classification: rateLimitedAICall(classifyImage(imageBuffer))
      })
    )
  );
```

### Queue-Based Processing
```typescript
// Producer-consumer pattern for backpressure handling
const imageQueue = Effect.unsafeMakeQueue<string>(100);

const producer = Effect.forever(
  pipe(
    getNextImagePath(), // Your image source
    Effect.flatMap(imagePath => imageQueue.offer(imagePath))
  )
);

const consumer = Effect.forever(
  pipe(
    imageQueue.take,
    Effect.flatMap(imagePath => processSingleImage(imagePath)),
    Effect.tap(result => saveResult(result))
  )
);

// Run producer and consumer concurrently
const queueBasedProcessing = Effect.all({
  producer: Effect.fork(producer),
  consumers: Effect.forEach(
    Array.from({ length: 3 }, (_, i) => i), // 3 consumers
    () => Effect.fork(consumer),
    { concurrency: "unbounded" }
  )
});
```

### Circuit Breaker for Failing Services
```typescript
// Stop calling a service that's consistently failing
const circuitBreaker = makeCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: Duration.minutes(1)
});

const resilientAICall = <A, E>(operation: Effect.Effect<A, E>) =>
  pipe(
    operation,
    circuitBreaker.execute,
    Effect.catchTag('CircuitBreakerOpen', () => 
      Effect.fail(new AIProcessingError({ 
        operation: 'ai-call', 
        reason: 'Service circuit breaker open' 
      }))
    )
  );
```

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Concurrency vs Parallelism**
- **Concurrency**: Effect manages when things run (controlled, safe)
- **Parallelism**: Everything runs at once (can be dangerous)
- Use `{ concurrency: N }` to control resource usage

**2. Resource Management**
- `acquireUseRelease` ensures cleanup even on errors
- Semaphores control access to limited resources
- Always consider system limits (memory, file handles, network connections)

**3. Error Isolation**
- One failure doesn't crash the whole batch
- Use `Effect.either` to collect both successes and failures
- Design for partial success scenarios

**4. Performance Optimization**
- Measure before optimizing
- Find the optimal concurrency level for your system
- Consider bottlenecks: CPU, memory, network, external services

### Connection to Week 2
"Remember our error handling from last week? Notice how it just works with concurrency. When one image fails, it doesn't crash the whole pipeline. Our error types still guide recovery, but now at scale."

### Bridge to Week 4
"This pipeline works great, but it's hard to test and configure. What if we want to swap out the AI services? Or run with different concurrency settings? Next week we'll learn about Effect's dependency injection system that makes our code modular and testable."

### Homework Assignment

**Add a web interface to your image processor:**
1. **Upload endpoint**: Accept multiple images via HTTP
2. **Real-time progress**: Stream progress updates to the client
3. **Cancellation**: Allow users to cancel processing
4. **Resource monitoring**: Show current system load

**Bonus challenges:**
- Add different processing profiles (fast vs accurate)
- Implement priority queues for different user types
- Add batch processing with scheduled jobs
- Monitor and alert on resource exhaustion

---

## 🎓 Assessment Rubric

### Technical Skills Assessment
- [ ] **Proper use of concurrency controls** (`Effect.forEach`, `Effect.all` with limits)
- [ ] **Resource management** with `acquireUseRelease` patterns
- [ ] **Error handling** in concurrent scenarios without losing failures
- [ ] **Performance optimization** awareness and measurement

### Understanding Assessment
- [ ] Can explain the difference between concurrency and parallelism
- [ ] Understands when to limit concurrency and why
- [ ] Can identify resource leak scenarios
- [ ] Knows how to handle backpressure and system limits

### Red Flags to Watch For
- Using unbounded concurrency everywhere ("more = faster")
- Not managing resources properly (file handles, memory)
- Ignoring error handling in concurrent code
- Not considering system resource limits

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Concurrency](https://effect.website/docs/concurrency)
- [Effect Documentation: Resource Management](https://effect.website/docs/resource-management)

### Code Examples
- [Complete Image Pipeline Example](./examples/image-pipeline/)
- [Resource Pool Patterns](./examples/resource-pools/)
- [Concurrency Benchmarks](./examples/concurrency-benchmarks/)

### Next Week Prep
- Think about how to make your concurrent systems testable
- Consider: How do you swap out services without changing core logic?
- Read about dependency injection and why it matters for testing

---

*"Concurrency is not about going faster - it's about managing complexity while going faster safely."*