# Week 1: Effect Foundations & AI Weather Assistant
## From Promise Hell to Effect Heaven

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- **Experience the "aha moment"** of Effect vs Promises for async operations
- **Write basic Effect pipelines** using `pipe`, `map`, `flatMap`, and error handling
- **Build a working AI weather assistant** that handles multiple failure scenarios gracefully
- **Understand why Effect makes async operations more composable** than traditional approaches

---

## 🔥 Opening Hook: The Promise Problem (30 minutes)

### The Scenario
Let's build a weather app the "traditional" way first. I want you to feel the pain before we show you the cure.

### Live Coding: Weather App with Promises

```typescript
// weather-promises.ts - The "traditional" approach
import axios from 'axios';
import OpenAI from 'openai';

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  city: string;
}

interface AIEnhancedReport {
  weather: WeatherData;
  aiInsight: string;
  recommendations: string[];
}

// Step 1: Fetch weather data
async function fetchWeatherData(city: string): Promise<WeatherData> {
  try {
    console.log(`Fetching weather for ${city}...`);
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: city,
          appid: process.env.WEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    return {
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      city: response.data.name
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Weather service timeout for ${city}`);
      }
      if (error.response?.status === 404) {
        throw new Error(`City "${city}" not found`);
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid weather API key');
      }
    }
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
}

// Step 2: Enhance with AI
async function enhanceWithAI(weather: WeatherData): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const prompt = `
      Current weather in ${weather.city}:
      - Temperature: ${weather.temperature}°C
      - Conditions: ${weather.description}
      - Humidity: ${weather.humidity}%
      
      Provide a brief, friendly weather insight and 2-3 practical recommendations.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No AI insight available';
  } catch (error) {
    console.warn('AI enhancement failed:', error.message);
    return `Based on ${weather.temperature}°C and ${weather.description} in ${weather.city}, dress appropriately and stay hydrated!`;
  }
}

// Step 3: Generate recommendations
function generateRecommendations(weather: WeatherData): string[] {
  const recommendations: string[] = [];
  
  if (weather.temperature < 10) {
    recommendations.push('Wear warm clothing');
    recommendations.push('Consider a hot beverage');
  } else if (weather.temperature > 25) {
    recommendations.push('Stay hydrated');
    recommendations.push('Wear light, breathable clothing');
  }
  
  if (weather.humidity > 70) {
    recommendations.push('Expect muggy conditions');
  }
  
  if (weather.description.includes('rain')) {
    recommendations.push('Bring an umbrella');
  }
  
  return recommendations;
}

// Step 4: The main function - THIS IS WHERE IT GETS MESSY
async function getWeatherReportWithRetry(city: string, maxRetries = 3): Promise<AIEnhancedReport> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for ${city}`);
      
      // Fetch weather with timeout
      const weatherPromise = fetchWeatherData(city);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Overall timeout')), 30000)
      );
      
      const weather = await Promise.race([weatherPromise, timeoutPromise]);
      
      // Try AI enhancement (but don't fail if it doesn't work)
      let aiInsight: string;
      try {
        aiInsight = await enhanceWithAI(weather);
      } catch (aiError) {
        console.warn('AI failed, using fallback');
        aiInsight = `Weather in ${weather.city}: ${weather.temperature}°C, ${weather.description}`;
      }
      
      const recommendations = generateRecommendations(weather);
      
      return {
        weather,
        aiInsight,
        recommendations
      };
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`All ${maxRetries} attempts failed. Last error: ${lastError.message}`);
}

// Usage
async function main() {
  try {
    const report = await getWeatherReportWithRetry('London');
    console.log('Weather Report:', report);
  } catch (error) {
    console.error('Failed to get weather report:', error.message);
  }
}
```

### Discussion Questions (10 minutes)
**Ask the class:**
1. "Who has written code like this?" *(Everyone raises hand)*
2. "What problems do you see here?"
   - Error handling scattered everywhere
   - Retry logic is boilerplate-heavy
   - Timeout handling is manual and error-prone
   - Hard to test (how do you mock all these failure scenarios?)
   - Hard to compose (what if we want to get weather for multiple cities?)
   - Inconsistent error types

3. "How would you make this better?"
   - Collect their ideas on the board
   - Common answers: "Extract functions", "Use a library", "Better error handling"

**The Setup:** "Let's see how Effect solves these exact problems..."

---

## 🚀 Enter Effect: The Same App, But Better (45 minutes)

### Core Concept Introduction

```typescript
// weather-effect.ts - The Effect way
import { Effect, pipe, Schedule, Duration } from 'effect';
import { HttpClient, HttpClientRequest, HttpClientResponse } from '@effect/platform';
import { Data } from 'effect';

// First, let's define our domain types
interface WeatherData {
  readonly temperature: number;
  readonly description: string;
  readonly humidity: number;
  readonly city: string;
}

interface AIEnhancedReport {
  readonly weather: WeatherData;
  readonly aiInsight: string;
  readonly recommendations: ReadonlyArray<string>;
}

// Define our error types - this is KEY!
class WeatherAPIError extends Data.TaggedError('WeatherAPIError')<{
  readonly city: string;
  readonly reason: string;
}> {}

class CityNotFoundError extends Data.TaggedError('CityNotFoundError')<{
  readonly city: string;
}> {}

class AIServiceError extends Data.TaggedError('AIServiceError')<{
  readonly reason: string;
}> {}

class TimeoutError extends Data.TaggedError('TimeoutError')<{
  readonly operation: string;
  readonly timeoutMs: number;
}> {}

// Now let's build our weather service with Effect
const fetchWeatherData = (city: string) =>
  pipe(
    // Create the HTTP request
    HttpClientRequest.get(`https://api.openweathermap.org/data/2.5/weather`),
    HttpClientRequest.setUrlParams({
      q: city,
      appid: process.env.WEATHER_API_KEY!,
      units: 'metric'
    }),
    
    // Execute the request
    HttpClient.execute,
    
    // Parse the response
    Effect.flatMap(response => 
      HttpClientResponse.json(response)
    ),
    
    // Transform to our domain type
    Effect.map((data: any) => ({
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      city: data.name
    } as WeatherData)),
    
    // Handle errors by mapping them to our error types
    Effect.mapError(error => {
      if (error.message.includes('404')) {
        return new CityNotFoundError({ city });
      }
      return new WeatherAPIError({ city, reason: error.message });
    }),
    
    // Add timeout
    Effect.timeout(Duration.seconds(5)),
    Effect.mapError(error => {
      if (error._tag === 'TimeoutException') {
        return new TimeoutError({ operation: 'weather-fetch', timeoutMs: 5000 });
      }
      return error;
    })
  );

// AI enhancement service
const enhanceWithAI = (weather: WeatherData) =>
  pipe(
    Effect.sync(() => {
      const prompt = `
        Current weather in ${weather.city}:
        - Temperature: ${weather.temperature}°C
        - Conditions: ${weather.description}
        - Humidity: ${weather.humidity}%
        
        Provide a brief, friendly weather insight and 2-3 practical recommendations.
      `;
      return prompt;
    }),
    
    Effect.flatMap(prompt =>
      // Simulate OpenAI API call
      Effect.promise(() =>
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
          }),
        })
      )
    ),
    
    Effect.flatMap(response => Effect.promise(() => response.json())),
    
    Effect.map((data: any) => 
      data.choices[0]?.message?.content || 'No AI insight available'
    ),
    
    Effect.mapError(error => 
      new AIServiceError({ reason: error.message })
    ),
    
    Effect.timeout(Duration.seconds(10)),
    
    // Fallback if AI fails - this is beautiful in Effect!
    Effect.catchAll(() =>
      Effect.succeed(
        `Based on ${weather.temperature}°C and ${weather.description} in ${weather.city}, dress appropriately and stay hydrated!`
      )
    )
  );

// Simple pure function for recommendations
const generateRecommendations = (weather: WeatherData): ReadonlyArray<string> => {
  const recommendations: string[] = [];
  
  if (weather.temperature < 10) {
    recommendations.push('Wear warm clothing', 'Consider a hot beverage');
  } else if (weather.temperature > 25) {
    recommendations.push('Stay hydrated', 'Wear light, breathable clothing');
  }
  
  if (weather.humidity > 70) {
    recommendations.push('Expect muggy conditions');
  }
  
  if (weather.description.includes('rain')) {
    recommendations.push('Bring an umbrella');
  }
  
  return recommendations;
};

// The main pipeline - THIS IS WHERE THE MAGIC HAPPENS
const getWeatherReport = (city: string) =>
  pipe(
    // Step 1: Fetch weather data
    fetchWeatherData(city),
    
    // Step 2: Enhance with AI (in parallel with recommendations)
    Effect.flatMap(weather =>
      pipe(
        Effect.all({
          weather: Effect.succeed(weather),
          aiInsight: enhanceWithAI(weather),
          recommendations: Effect.succeed(generateRecommendations(weather))
        })
      )
    ),
    
    // Step 3: Combine into final report
    Effect.map(({ weather, aiInsight, recommendations }) => ({
      weather,
      aiInsight,
      recommendations
    } as AIEnhancedReport)),
    
    // Step 4: Add retry with exponential backoff
    Effect.retry(
      pipe(
        Schedule.exponential(Duration.seconds(1)),
        Schedule.intersect(Schedule.recurs(3))
      )
    ),
    
    // Step 5: Add overall timeout
    Effect.timeout(Duration.seconds(30))
  );

// Usage - so clean!
const program = pipe(
  getWeatherReport('London'),
  Effect.tap(report => 
    Effect.sync(() => console.log('Weather Report:', report))
  ),
  Effect.catchAll(error => 
    Effect.sync(() => console.error('Failed to get weather:', error))
  )
);

// Run the program
Effect.runPromise(program);
```

### Key Insights to Highlight (15 minutes)

**1. Composability**
```typescript
// With Promises - hard to compose
const result1 = await fetchWeather(city);
const result2 = await enhanceWithAI(result1);
const result3 = await generateReport(result2);

// With Effect - pipe everything together
const result = pipe(
  fetchWeather(city),
  Effect.flatMap(enhanceWithAI),
  Effect.flatMap(generateReport)
);
```

**2. Explicit Error Types**
```typescript
// Promise: What errors can this throw? 🤷‍♂️
async function fetchWeather(city: string): Promise<WeatherData>

// Effect: Exactly these errors! 🎯
function fetchWeather(city: string): Effect.Effect<
  WeatherData, 
  WeatherAPIError | CityNotFoundError | TimeoutError
>
```

**3. Built-in Retry & Timeout**
```typescript
// Promise: Manual retry logic (lots of boilerplate)
for (let i = 0; i < 3; i++) { /* ... */ }

// Effect: Declarative retry policies
Effect.retry(Schedule.exponential(Duration.seconds(1)))
```

**4. Resource Safety**
```typescript
// Effect automatically handles cleanup, even on errors
// No more "did I close that connection?" worries
```

---

## 🛠️ Hands-On Workshop: Build Your Weather Assistant (60 minutes)

### Setup (10 minutes)

Create a new project:
```bash
mkdir weather-assistant
cd weather-assistant
npm init -y
npm install effect @effect/platform
npm install -D typescript @types/node tsx
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Pair Programming Exercise (45 minutes)

**Instructions:**
- Form pairs
- Each pair will build their own weather CLI
- Use the starter code below
- Focus on getting the basic pipeline working first
- Add features incrementally

**Starter Code (`src/weather.ts`):**
```typescript
import { Effect, pipe, Schedule, Duration, Console } from 'effect';
import { Data } from 'effect';

// TODO: Define your error types here
class WeatherError extends Data.TaggedError('WeatherError')<{
  readonly message: string;
}> {}

// TODO: Define your weather data type
interface WeatherData {
  // Fill this in!
}

// TODO: Implement this function
const fetchWeatherData = (city: string) =>
  pipe(
    // Hint: Use Effect.sync to simulate an API call for now
    Effect.sync(() => {
      // Simulate different scenarios:
      // - Success case
      // - City not found
      // - Network timeout
      // Use Math.random() to simulate different outcomes
      
      throw new Error('TODO: Implement me!');
    })
  );

// TODO: Implement AI enhancement (simulate for now)
const enhanceWithAI = (weather: WeatherData) =>
  pipe(
    Effect.sync(() => `AI says: It's ${weather.temperature}°C in ${weather.city}!`),
    // Add some random failures to test error handling
    Effect.flatMap(insight => 
      Math.random() > 0.3 
        ? Effect.succeed(insight)
        : Effect.fail(new WeatherError({ message: 'AI service temporarily unavailable' }))
    )
  );

// TODO: Create the main pipeline
const getWeatherReport = (city: string) =>
  pipe(
    // Your pipeline here!
    Effect.succeed(`Weather report for ${city}`)
  );

// TODO: Create a CLI program
const program = pipe(
  // Get city from command line arguments
  Effect.sync(() => process.argv[2] || 'London'),
  Effect.flatMap(city => getWeatherReport(city)),
  Effect.tap(report => Console.log(report)),
  Effect.catchAll(error => 
    Console.error(`Error: ${error.message}`)
  )
);

// Run it!
Effect.runPromise(program);
```

**Challenges to Work Through:**
1. **Basic pipeline**: Fetch weather → enhance with AI → display result
2. **Error handling**: Handle different error types appropriately
3. **Retry logic**: Add exponential backoff for transient failures
4. **Timeout**: Add overall timeout for the operation
5. **Fallback**: If AI fails, provide a basic weather summary

**Common Issues Students Will Hit:**
- Forgetting to use `pipe`
- Trying to use Promise patterns (`await`, `.then()`)
- Not understanding the type signatures yet (that's OK!)
- Confusion about when to use `map` vs `flatMap`

**Instructor Notes:**
- Walk around and help, but let them struggle a bit
- Point out when they're falling back to Promise thinking
- Emphasize the type safety - show how the compiler helps
- Don't worry about explaining monads or functors yet

### Workshop Debrief (5 minutes)

**Questions to ask:**
- "What felt different about this approach?"
- "What was confusing?"
- "What was easier than expected?"
- "What would you want to add next?"

---

## 🎯 Key Takeaways & Wrap-Up (15 minutes)

### What We Just Learned

**1. Effect vs Promises**
- Effect makes async operations **composable**
- Error types are **explicit** in the type signature
- Retry and timeout are **built-in**, not boilerplate

**2. The Power of `pipe`**
```typescript
// Instead of nested calls
f(g(h(x)))

// We pipe data through transformations
pipe(x, h, g, f)
```

**3. Error Handling is Architecture**
- Design your error types first
- Use tagged errors for specific cases
- Let the compiler guide your error handling

**4. Composability Wins**
- Small, focused functions
- Combine them with `pipe`
- Each step handles one concern

### Preview: Next Week

"That error handling was pretty nice, right? We used `catchAll` and tagged errors, but we barely scratched the surface. Next week, we're going deep on error handling. Instead of throwing strings or generic Error objects, we'll create rich, typed error hierarchies that make debugging and error recovery much more sophisticated."

"You'll build an AI content moderator that handles multiple services, rate limits, fallback strategies, and business logic errors - all with explicit, composable error handling."

### Homework Assignment

**Extend your weather app with these features:**
1. **Multiple cities**: Get weather for multiple cities concurrently
2. **Weather comparison**: Compare temperatures across cities
3. **Historical data**: Cache results and show trends
4. **More AI features**: Weather-based activity suggestions

**Bonus challenges:**
- Add a web server that serves weather reports
- Store results in a database
- Add weather alerts based on conditions

**Don't worry about solving everything perfectly** - we'll address concurrent processing, caching, and service architecture in the coming weeks. For now, focus on getting comfortable with Effect's basic patterns.

---

## 🎓 Assessment Rubric

### Formative Assessment (During Workshop)
- [ ] Student can write basic Effect pipelines using `pipe`
- [ ] Student uses `Effect.map` and `Effect.flatMap` appropriately
- [ ] Student creates and handles custom error types
- [ ] Student can explain why Effect is different from Promises

### Summative Assessment (Homework)
- [ ] **Working weather app** that handles at least 3 error scenarios
- [ ] **Proper use of Effect patterns** (pipe, error handling, retry)
- [ ] **Code quality** (readable, well-structured)
- [ ] **Written reflection**: "What was hardest about switching from Promises to Effect?"

### Success Indicators
✅ Student can write basic Effect pipelines  
✅ Student understands that Effect makes error handling explicit  
✅ Student is curious about more advanced features  
✅ Student sees the value over traditional Promise-based code  

---

## 📚 Additional Resources

### Essential Reading
- [Effect Documentation: Getting Started](https://effect.website/docs/getting-started)
- [Effect Documentation: Error Handling](https://effect.website/docs/error-handling)

### Code Examples
- [Complete Weather Assistant Example](./examples/weather-assistant/)
- [Error Handling Patterns](./examples/error-patterns/)

### Next Week Prep
- Read about tagged errors in Effect
- Think about different types of errors in software systems
- Consider: What makes an error "retryable" vs "non-retryable"?

---

*"The best way to learn Effect is to build with Effect. Don't just read about it - get your hands dirty with real code!"*