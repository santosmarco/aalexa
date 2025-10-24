/**
 * Example usage of the Tinder SDK
 * 
 * This demonstrates basic usage patterns for the SDK.
 * Remember: This is an unofficial SDK - use responsibly!
 */

import { TinderClient, AuthenticationError, RateLimitError } from './index';

async function main() {
  // Initialize the client
  const client = new TinderClient({
    timeout: 15000,
  });

  try {
    // Example 1: Authentication
    // Option A: Login with Facebook
    // const auth = await client.auth.loginWithFacebook(
    //   'your_facebook_token',
    //   'your_facebook_id'
    // );
    
    // Option B: Use existing token
    client.setAuthToken('your-existing-auth-token');

    // Example 2: Get your profile
    const profile = await client.profile.getProfile();
    console.log(`Logged in as: ${profile.name}`);
    console.log(`Bio: ${profile.bio}`);
    console.log(`Age range: ${profile.age_filter_min}-${profile.age_filter_max}`);

    // Example 3: Update your profile
    const updated = await client.profile.updateProfile({
      bio: 'Love hiking and coffee ☕',
      age_filter_min: 25,
      age_filter_max: 35,
      distance_filter: 30,
    });
    console.log('Profile updated!');

    // Example 4: Get recommendations (potential matches)
    const recommendations = await client.matching.getRecommendations();
    console.log(`Found ${recommendations.results.length} potential matches`);

    for (const rec of recommendations.results) {
      const user = rec.user;
      console.log(`\n${user.name}, ${user.distance_mi} miles away`);
      console.log(`Bio: ${user.bio}`);
      
      // Example 5: Make a decision (like, pass, or super-like)
      // Uncomment to actually perform actions:
      
      // Like
      // const likeResult = await client.matching.like(user._id);
      // if (likeResult.match) {
      //   console.log("🎉 It's a match!");
      // } else {
      //   console.log(`Liked! ${likeResult.likes_remaining} likes remaining`);
      // }
      
      // Pass
      // await client.matching.pass(user._id);
      // console.log('Passed');
      
      // Super Like
      // const superLikeResult = await client.matching.superLike(user._id);
      // console.log(`Super liked! ${superLikeResult.super_likes.remaining} super likes remaining`);
    }

    // Example 6: Get matches
    const matches = await client.messaging.getMatches({ count: 20 });
    console.log(`\nYou have ${matches.length} matches`);

    for (const match of matches) {
      console.log(`\nMatch with ${match.person.name}`);
      console.log(`Messages: ${match.message_count}`);
      console.log(`Last activity: ${match.last_activity_date}`);

      // Example 7: Send a message
      // Uncomment to send a message:
      // await client.messaging.sendMessage(
      //   match._id,
      //   'Hey! How are you doing? 👋'
      // );
      // console.log('Message sent!');
    }

    // Example 8: Get a specific match
    if (matches.length > 0) {
      const firstMatch = matches[0];
      const matchDetails = await client.messaging.getMatch(firstMatch._id);
      console.log(`\nMatch details for ${matchDetails.person.name}:`);
      console.log(`Common friends: ${matchDetails.common_friend_count}`);
      console.log(`Common likes: ${matchDetails.common_like_count}`);
      console.log(`Is super like: ${matchDetails.is_super_like}`);
      
      // View messages
      if (matchDetails.messages && matchDetails.messages.length > 0) {
        console.log('\nRecent messages:');
        matchDetails.messages.slice(-5).forEach(msg => {
          console.log(`  [${msg.sent_date}] ${msg.message}`);
        });
      }
    }

  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('❌ Authentication failed. Please check your token.');
    } else if (error instanceof RateLimitError) {
      console.error('❌ Rate limit exceeded. Please wait before trying again.');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    // Logout when done
    client.auth.logout();
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
