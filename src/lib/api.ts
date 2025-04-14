import { toast } from "sonner";

interface TravelPreferences {
  destination: string;
  duration: string;
  budget: number;
  interests: string;
  travelStyle: string;
  apiKey: string;
}

// Cache for storing generated itineraries
const itineraryCache = new Map<string, string>();

// Function to generate travel-related links
const getTravelLinks = (place: string, destination: string): string[] => {
  const searchQuery = `${place} ${destination}`.replace(/\s+/g, '+');
  
  // Generate links for different travel services
  return [
    // Booking.com search
    `https://www.booking.com/searchresults.html?ss=${searchQuery}`,
    // TripAdvisor search
    `https://www.tripadvisor.com/Search?q=${searchQuery}`,
    // Google Maps search
    `https://www.google.com/maps/search/${searchQuery}`,
    // Google Images search
    `https://www.google.com/search?q=${searchQuery}&tbm=isch`,
    // Hotels.com search
    `https://www.hotels.com/search.do?q-destination=${searchQuery}`,
    // Expedia search
    `https://www.expedia.com/Hotel-Search?destination=${searchQuery}`
  ];
};

export const generateItinerary = async (preferences: TravelPreferences): Promise<string> => {
  try {
    const { apiKey, ...userPrefs } = preferences;
    
    // Create a cache key based on the preferences
    const cacheKey = `${userPrefs.destination}-${userPrefs.duration}-${userPrefs.budget}-${userPrefs.interests}-${userPrefs.travelStyle}`;
    
    // Check if we have a cached result
    if (itineraryCache.has(cacheKey)) {
      return itineraryCache.get(cacheKey)!;
    }

    const prompt = `
      Create a detailed day-by-day travel itinerary for a trip to ${userPrefs.destination} for ${userPrefs.duration} days.
      
      Preferences:
      - Budget Level: ${getBudgetText(userPrefs.budget)}
      - Interests: ${userPrefs.interests || 'General sightseeing'}
      - Travel Style: ${userPrefs.travelStyle}
      
      Format the itinerary with clear sections for each day. For each day, include:
      - Morning activities with suggested times
      - Lunch recommendations with estimated costs
      - Afternoon activities
      - Dinner options with estimated costs
      - Evening entertainment if applicable
      
      For each activity, include:
      - Brief descriptions
      - Practical tips
      - Estimated costs or price ranges
      - Transportation options and costs
      
      Make the itinerary flow naturally with logical geographic progression through the destination.
      
      Important formatting rules:
      - Do not use markdown formatting (no **, ##, etc.)
      - Use clear section headers with proper spacing
      - Include estimated costs for each major activity and meal
      - Provide a daily budget summary at the end of each day
      - Use consistent spacing and formatting throughout
      - For each major attraction, hotel, or restaurant, include a [LINK] placeholder that will be replaced with actual booking/search links
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional travel planner with extensive knowledge of destinations worldwide. Create detailed, realistic, and personalized travel itineraries.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate itinerary');
    }

    const data = await response.json();
    let itinerary = data.choices[0].message.content;

    // Find all [LINK] placeholders and replace them with actual links
    const linkMatches = itinerary.match(/\[LINK\]/g);
    if (linkMatches) {
      for (const match of linkMatches) {
        const context = itinerary.substring(0, itinerary.indexOf(match));
        const lastPlace = context.split('\n').pop()?.trim() || '';
        const links = getTravelLinks(lastPlace, userPrefs.destination);
        const link = links[0]; // Use the first link (Booking.com) as default
        itinerary = itinerary.replace('[LINK]', link);
      }
    }

    // Cache the result
    itineraryCache.set(cacheKey, itinerary);
    
    // Clear cache after 1 hour
    setTimeout(() => {
      itineraryCache.delete(cacheKey);
    }, 60 * 60 * 1000);

    return itinerary;
  } catch (error) {
    console.error('Error generating itinerary:', error);
    let errorMessage = 'Failed to generate itinerary';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('invalid_api_key')) {
        errorMessage = 'Invalid OpenAI API key. Please check your key and try again.';
      } else if (errorMessage.includes('insufficient_quota')) {
        errorMessage = 'Your OpenAI account has insufficient quota. Please check your billing.';
      }
    }
    
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

function getBudgetText(budgetValue: number): string {
  if (budgetValue < 25) return 'Budget-friendly options, focusing on free/low-cost activities and affordable dining';
  if (budgetValue < 50) return 'Moderate budget with a mix of affordable and mid-range options';
  if (budgetValue < 75) return 'Higher-end budget with premium experiences and fine dining options';
  return 'Luxury experiences with high-end accommodations, fine dining, and exclusive activities';
}
