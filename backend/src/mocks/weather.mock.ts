export const mockWeatherData = {
  temperature: 15.5,
  windSpeed: 5.2,
  precipitationIntensity: 0.1,
  weatherCode: 1001, // Example: Cloudy
};

export const getMockWeatherResponse = (location: string) => {
  console.log(
    `\\n--- MOCK API --- Returning mock weather for ${location} ---\\n`
  );
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
