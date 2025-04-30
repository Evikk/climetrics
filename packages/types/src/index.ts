// Shared types will be exported from here

// Define the structure for the location field
export interface ILocation {
  type: "City" | "Coordinates";
  value: string | { lat: number; lon: number };
}

// Define the possible weather parameters
export type WeatherParameter = "temperature" | "windSpeed" | "precipitation"; // Add more as needed

// Define the structure for the condition
export interface ICondition {
  parameter: WeatherParameter;
  operator: ">" | "<" | ">=" | "<=" | "=";
  threshold: number;
}

// Define the shared Alert data structure
// Note: This is the data shape, omitting Mongoose-specific Document type
export interface IAlert {
  _id: string; // Frontend usually needs the ID as a string
  name?: string;
  location: ILocation;
  condition: ICondition;
  status: "active" | "triggered" | "inactive";
  lastCheckedAt?: string | Date; // Use string for API transfer, Date internally maybe
  lastTriggeredAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}
