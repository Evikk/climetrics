export const mockWeatherData = {
  temperature: 15.5,
  windSpeed: 5.2,
  humidity: 50,
  weatherCode: 1001, // Example: Cloudy
};

export const getMockWeatherResponse = (location: string) => {
  return {
    data: {
      values: {
        ...mockWeatherData,
        // Add some slight variation based on location hash for fun
        temperature: mockWeatherData.temperature + (location.length % 3) - 1,
        windSpeed: mockWeatherData.windSpeed + (location.length % 2) * 0.5,
      },
    },
  };
};
