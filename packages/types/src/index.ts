export interface ILocation {
  type: "City" | "Coordinates";
  value: string | { lat: number; lon: number };
}

export type WeatherParameter =
  | "temperature"
  | "windSpeed"
  | "humidity"
  | "weatherCode"; // Add more as needed

export interface ICondition {
  parameter: WeatherParameter;
  operator: ">" | "<" | ">=" | "<=" | "=";
  threshold: number;
}

export interface IAlert {
  _id: string;
  name?: string;
  location: ILocation;
  condition: ICondition;
  status: "active" | "triggered" | "inactive";
  notifySMS?: boolean;
  phoneNumber?: string;
  lastCheckedAt?: string | Date;
  lastTriggeredAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}
