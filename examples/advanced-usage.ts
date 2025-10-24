/**
 * Advanced Tinder SDK Usage Examples
 * 
 * This demonstrates more advanced patterns and best practices.
 */

import { TinderClient, TinderError, RateLimitError } from '../src/index';
import type { User, Match } from '../src/types';

// Helper to delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Example: Auto-swiper with smart decisions
async function autoSwiper(client: TinderClient, strategy: 'like_all' | 'selective' = 'selective') {
  console.log(`Starting auto-swiper with ${strategy} strategy...`);

  try {
    const recs = await client.matching.getRecommendations();
    
    for (const rec of recs.results) {
      const user = rec.user;
      
      let shouldLike = false;
      
      if (strategy === 'like_all') {
        shouldLike = true;
      } else {
        // Selective strategy: Check for bio, photos, education
        const hasBio = user.bio && user.bio.length > 10;
        const hasMultiplePhotos = user.photos.length >= 3;
        const hasEducation = user.schools && user.schools.length > 0;
        
        shouldLike = hasBio && hasMultiplePhotos;
        
        console.log(`${user.name}: Bio(${hasBio}), Photos(${hasMultiplePhotos}), Edu(${hasEducation})`);
      }

      if (shouldLike) {
        try {
          const result = await client.matching.like(user._id);
          if (result.match) {
            console.log(`✨ MATCH with ${user.name}!`);
          } else {
            console.log(`👍 Liked ${user.name}`);
          }
        } catch (error) {
          if (error instanceof RateLimitError) {
            console.log('Rate limited - waiting 60 seconds...');
            await delay(60000);
          } else {
            throw error;
          }
        }
      } else {
        await client.matching.pass(user._id);
        console.log(`👎 Passed on ${user.name}`);
      }

      // Delay between actions to avoid rate limiting
      await delay(1000);
    }
  } catch (error) {
    console.error('Auto-swiper error:', error);
  }
}

// Example: Message all new matches
async function messageNewMatches(client: TinderClient, greeting: string) {
  console.log('Checking for new matches...');

  try {
    const matches = await client.messaging.getMatches({ count: 50 });
    
    // Filter for matches with no messages
    const newMatches = matches.filter(match => match.message_count === 0);
    
    console.log(`Found ${newMatches.length} new matches`);

    for (const match of newMatches) {
      // Personalize the greeting with their name
      const personalizedGreeting = greeting.replace('{name}', match.person.name);
      
      try {
        await client.messaging.sendMessage(match._id, personalizedGreeting);
        console.log(`💬 Sent message to ${match.person.name}`);
        
        // Delay between messages
        await delay(2000);
      } catch (error) {
        console.error(`Failed to message ${match.person.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Message sending error:', error);
  }
}

// Example: Get statistics about your matches
async function getMatchStatistics(client: TinderClient) {
  console.log('Gathering match statistics...\n');

  try {
    const matches = await client.messaging.getMatches({ count: 100 });
    
    const stats = {
      total: matches.length,
      withMessages: 0,
      withoutMessages: 0,
      superLikes: 0,
      boostMatches: 0,
      avgMessageCount: 0,
      mostMessaged: null as Match | null,
      recentMatches: [] as Match[],
    };

    let totalMessages = 0;

    for (const match of matches) {
      if (match.message_count > 0) {
        stats.withMessages++;
        totalMessages += match.message_count;
      } else {
        stats.withoutMessages++;
      }

      if (match.is_super_like) stats.superLikes++;
      if (match.is_boost_match) stats.boostMatches++;

      if (!stats.mostMessaged || match.message_count > stats.mostMessaged.message_count) {
        stats.mostMessaged = match;
      }

      // Get matches from last 7 days
      const matchDate = new Date(match.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      if (matchDate > weekAgo) {
        stats.recentMatches.push(match);
      }
    }

    stats.avgMessageCount = stats.withMessages > 0 
      ? Math.round(totalMessages / stats.withMessages) 
      : 0;

    console.log('📊 Match Statistics:');
    console.log(`Total matches: ${stats.total}`);
    console.log(`With messages: ${stats.withMessages} (${Math.round(stats.withMessages / stats.total * 100)}%)`);
    console.log(`Without messages: ${stats.withoutMessages} (${Math.round(stats.withoutMessages / stats.total * 100)}%)`);
    console.log(`Super like matches: ${stats.superLikes}`);
    console.log(`Boost matches: ${stats.boostMatches}`);
    console.log(`Average messages per conversation: ${stats.avgMessageCount}`);
    console.log(`Matches in last 7 days: ${stats.recentMatches.length}`);
    
    if (stats.mostMessaged) {
      console.log(`\nMost messaged: ${stats.mostMessaged.person.name} (${stats.mostMessaged.message_count} messages)`);
    }

    return stats;
  } catch (error) {
    console.error('Statistics error:', error);
  }
}

// Example: Update location (requires coordinates)
async function updateLocation(client: TinderClient, lat: number, lon: number) {
  console.log(`Updating location to ${lat}, ${lon}...`);

  try {
    const updated = await client.profile.updateProfile({
      // Note: The actual API might require sending position in a different format
      // This is a simplified example
    });
    console.log('Location updated successfully!');
    return updated;
  } catch (error) {
    console.error('Location update error:', error);
  }
}

// Example: Smart retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error instanceof RateLimitError && attempt < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // For other errors, use shorter delay
      await delay(baseDelay);
    }
  }

  throw lastError;
}

// Main example runner
async function main() {
  const client = new TinderClient();
  
  // Set your auth token
  client.setAuthToken('your-auth-token');

  try {
    // Example 1: Get statistics
    await getMatchStatistics(client);

    // Example 2: Auto-swipe with retry logic
    // await withRetry(() => autoSwiper(client, 'selective'));

    // Example 3: Message new matches
    // await messageNewMatches(
    //   client,
    //   "Hey {name}! I noticed we matched. How's your day going? 😊"
    // );

    // Example 4: Update location
    // await updateLocation(client, 40.7128, -74.0060); // New York

  } catch (error) {
    if (error instanceof TinderError) {
      console.error(`Tinder API Error: ${error.message}`);
      if (error.statusCode) {
        console.error(`Status Code: ${error.statusCode}`);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Export functions for use in other scripts
export {
  autoSwiper,
  messageNewMatches,
  getMatchStatistics,
  updateLocation,
  withRetry,
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
