import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, MapPin, UtilityPole, DollarSign, Hotel, Map, Image, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ItineraryDisplayProps {
  itinerary: string;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary }) => {
  // Parse days from the itinerary text
  const days = itinerary.split(/Day \d+:/g).filter(Boolean).map((day, index) => ({
    id: `day-${index + 1}`,
    title: `Day ${index + 1}`,
    content: day.trim()
  }));

  const isEmpty = !itinerary || days.length === 0;

  if (isEmpty) {
    return null;
  }

  const getTravelLinks = (place: string, destination: string) => {
    const searchQuery = `${place} ${destination}`.replace(/\s+/g, '+');
    return [
      {
        name: 'Booking.com',
        icon: <Hotel className="h-4 w-4" />,
        url: `https://www.booking.com/searchresults.html?ss=${searchQuery}`
      },
      {
        name: 'TripAdvisor',
        icon: <Star className="h-4 w-4" />,
        url: `https://www.tripadvisor.com/Search?q=${searchQuery}`
      },
      {
        name: 'Google Maps',
        icon: <Map className="h-4 w-4" />,
        url: `https://www.google.com/maps/search/${searchQuery}`
      },
      {
        name: 'Images',
        icon: <Image className="h-4 w-4" />,
        url: `https://www.google.com/search?q=${searchQuery}&tbm=isch`
      }
    ];
  };

  const formatDayContent = (content: string, destination: string) => {
    const sections = content.split('\n\n').filter(Boolean);
    
    return sections.map((section, sectionIndex) => {
      const lines = section.split('\n').filter(Boolean);
      const sectionTitle = lines[0].trim();
      
      return (
        <div key={sectionIndex} className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-primary">
            {sectionTitle}
          </h3>
          
          {lines.slice(1).map((line, lineIndex) => {
            // Skip empty lines
            if (!line.trim()) return null;
            
            // Handle activity lines with [LINK]
            if (line.includes('[LINK]')) {
              const [timeAndPlace, ...description] = line.split('Description:');
              const place = timeAndPlace.split('-')[1]?.trim().replace('[LINK]', '').trim() || '';
              const time = timeAndPlace.split('-')[0]?.trim() || '';
              
              return (
                <div key={lineIndex} className="mb-4">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-primary/80">{time}</span>
                    <div className="flex-1">
                      <p className="font-medium">{place}</p>
                      {description.length > 0 && (
                        <p className="text-muted-foreground mt-1">{description.join('').trim()}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getTravelLinks(place, destination).map((link, linkIndex) => (
                          <a 
                            key={linkIndex}
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                          >
                            {link.icon}
                            <span className="ml-2">{link.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            // Handle cost lines
            if (line.toLowerCase().includes('cost:')) {
              return (
                <div key={lineIndex} className="bg-primary/5 p-3 rounded-lg my-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">{line}</span>
                </div>
              );
            }
            
            // Handle regular lines
            return (
              <p key={lineIndex} className="mb-2 leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Travel Itinerary</CardTitle>
            <CardDescription>
              A personalized plan based on your preferences
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <MapPin className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {days.length > 0 ? (
          <Tabs defaultValue={days[0].id} className="w-full">
            <TabsList className="mb-4 w-full overflow-x-auto flex flex-nowrap">
              {days.map((day) => (
                <TabsTrigger key={day.id} value={day.id} className="whitespace-nowrap">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {day.title}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {days.map((day) => (
              <TabsContent key={day.id} value={day.id} className="space-y-4">
                <div className="prose max-w-none">
                  {formatDayContent(day.content, day.title)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <UtilityPole className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No itinerary data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ItineraryDisplay;
