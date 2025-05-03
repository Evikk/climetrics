import schedule from "node-schedule";
import { Twilio } from "twilio";
import AlertModel from "../../models/Alert.model";
import { fetchWeatherData } from "../../services/weather.service";
import Logger from "../../utils/logger";
import SchedulerService from "../../services/scheduler.service";
import { ICondition, ILocation, WeatherParameter } from "@acme/types";
import { IAlertDocument } from "../../models/Alert.model";
import { WeatherData } from "../../services/weather.service";
import mongoose from "mongoose";

// Mock dependencies
jest.mock("node-schedule");
jest.mock("twilio");
jest.mock("../../models/Alert.model");
jest.mock("../../services/weather.service");
jest.mock("../../utils/logger");

// Mock Twilio implementation (optional, but good for type safety)
const mockTwilioMessagesCreate = jest.fn();
const MockTwilio = Twilio as jest.MockedClass<typeof Twilio>;
MockTwilio.mockImplementation(
  () =>
    ({
      messages: {
        create: mockTwilioMessagesCreate,
      },
    } as any)
); // Using 'as any' to simplify mock structure

const mockScheduleJob = jest.fn();
const mockCancelJob = jest.fn();
(schedule.scheduleJob as jest.Mock).mockImplementation((cron, callback) => {
  // Store callback to potentially trigger manually
  mockScheduleJob(cron, callback);
  return {
    cancel: mockCancelJob,
  };
});

// --- Mock Data Helpers ---
const mockWeatherData: WeatherData = {
  temperature: 25,
  humidity: 60,
  windSpeed: 15,
  weatherCode: 800, // Example: Clear sky
};

// A helper type for the parts of IAlertDocument we are mocking
// This avoids needing to mock *all* Mongoose properties
type MockAlertInput = Partial<
  Omit<IAlertDocument, "_id" | "createdAt" | "updatedAt">
> & {
  _id?: mongoose.Types.ObjectId | string; // Allow string for easier test writing, convert internally
};

const createMockAlert = (overrides: MockAlertInput): IAlertDocument => {
  const alertId =
    overrides._id instanceof mongoose.Types.ObjectId
      ? overrides._id
      : new mongoose.Types.ObjectId(overrides._id); // Convert string ID if provided

  const baseAlert = {
    _id: alertId,
    name: "Test Alert",
    condition: {
      // Use string literals based on WeatherParameter type definition
      parameter: "temperature" as WeatherParameter,
      operator: ">",
      threshold: 20,
    },
    location: {
      type: "City",
      value: "London",
    },
    status: "active",
    lastCheckedAt: null,
    lastTriggeredAt: null,
    phoneNumber: "+1234567890",
    notifySMS: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add essential Mongoose document properties/methods if needed by the service logic being tested
    // Often, the static mocks are sufficient.
    // For this service, the properties above seem sufficient.
  };

  // Combine base and overrides. Ensure overrides don't mismatch types badly.
  const mockedAlertData = { ...baseAlert, ...overrides, _id: alertId };

  // Cast carefully, assuming the properties used by the service are correctly mocked
  return mockedAlertData as IAlertDocument;
};

// --- Typed Mocks ---
const mockedFetchWeatherData = fetchWeatherData as jest.MockedFunction<
  typeof fetchWeatherData
>;
const MockedAlertModel = AlertModel as jest.Mocked<typeof AlertModel>; // Static methods

describe("SchedulerService", () => {
  let schedulerService: SchedulerService;
  // Expose the mocked functions for easier access in tests
  let mockScheduleCallback: (() => Promise<void>) | null = null;

  const mockScheduleJob = jest.fn();
  const mockCancelJob = jest.fn();

  beforeAll(() => {
    // Mock schedule.scheduleJob before any tests run
    (schedule.scheduleJob as jest.Mock).mockImplementation((cron, callback) => {
      mockScheduleJob(cron, callback);
      mockScheduleCallback = callback; // Store the callback
      return {
        cancel: mockCancelJob,
      };
    });
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockScheduleCallback = null; // Reset callback
    // Instantiate the service. It will use the mocked constructor for Twilio.
    schedulerService = new SchedulerService();

    // Reset mock implementations for checkAlerts tests
    mockedFetchWeatherData.mockResolvedValue(mockWeatherData);
    MockedAlertModel.find.mockResolvedValue([]); // Default to no alerts

    // REMOVED default findByIdAndUpdate mock from here
    // MockedAlertModel.findByIdAndUpdate.mockImplementation(...);
  });

  afterAll(() => {
    // Restore original implementation if needed, though mocks should be cleared by jest
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(schedulerService).toBeDefined();
  });

  // --- Tests for checkAlerts (Integration) ---
  describe("checkAlerts", () => {
    it("should transition an active alert to triggered and send notification if condition met", async () => {
      const alert = createMockAlert({
        status: "active",
        condition: { parameter: "temperature", operator: ">", threshold: 20 },
        notifySMS: true,
        phoneNumber: "+111",
      });
      const mockWeatherDataMet = {
        ...mockWeatherData,
        temperature: 25, // Ensures condition is met (25 > 20)
      };
      MockedAlertModel.find.mockResolvedValue([alert]);
      mockedFetchWeatherData.mockResolvedValue(mockWeatherDataMet);

      // Simple mock for findByIdAndUpdate - should resolve *directly* to the document when awaited
      const updatedAlertData = { ...alert, status: "triggered" };
      // Mock findByIdAndUpdate to return the resolved document directly
      MockedAlertModel.findByIdAndUpdate.mockResolvedValue(
        updatedAlertData as any
      );

      // SPY on checkCondition to verify its output
      const checkConditionSpy = jest.spyOn(
        schedulerService as any,
        "checkCondition"
      );

      // SPY on shouldSendNotification and force return true
      const shouldSendNotificationSpy = jest
        .spyOn(schedulerService as any, "shouldSendNotification")
        .mockReturnValue(true);

      // SPY on sendNotification itself to ensure it's called
      const sendNotificationSpy = jest.spyOn(
        schedulerService as any,
        "sendNotification"
      );

      await schedulerService.checkAlerts();

      // --- Assertions ---

      // 1. Verify checkCondition
      expect(checkConditionSpy).toHaveBeenCalledTimes(1);
      expect(checkConditionSpy).toHaveReturnedWith(true);

      // 2. Verify findByIdAndUpdate
      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);

      // 3. Verify shouldSendNotification spy call
      expect(shouldSendNotificationSpy).toHaveBeenCalledTimes(1);
      // Pass the object resolved from findByIdAndUpdate mock, and statusChanged=true
      expect(shouldSendNotificationSpy).toHaveBeenCalledWith(
        updatedAlertData,
        true
      );

      // 4. Verify sendNotification spy was called
      expect(sendNotificationSpy).toHaveBeenCalledTimes(1);
      expect(sendNotificationSpy).toHaveBeenCalledWith(updatedAlertData);

      // 5. Verify Twilio was called (The core issue)
      expect(mockTwilioMessagesCreate).toHaveBeenCalledTimes(1);
      expect(mockTwilioMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({ to: "+111" })
      );

      // 6. Verify log message
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Alert ${alert._id} triggered!`)
      );

      // 7. Ensure no unexpected errors were logged
      expect(Logger.error).not.toHaveBeenCalled();

      // Restore spies
      checkConditionSpy.mockRestore();
      shouldSendNotificationSpy.mockRestore();
      sendNotificationSpy.mockRestore();
    });

    it("should transition a triggered alert to active and NOT send notification if condition no longer met", async () => {
      const alert = createMockAlert({
        status: "triggered",
        condition: { parameter: "temperature", operator: ">", threshold: 30 },
      });
      MockedAlertModel.find.mockResolvedValue([alert]);
      mockedFetchWeatherData.mockResolvedValue({
        ...mockWeatherData,
        temperature: 25,
      }); // Condition NOT met

      MockedAlertModel.findByIdAndUpdate.mockImplementation((id, update) => {
        const finalDoc = {
          ...alert,
          ...(update.$set || {}),
          _id: id,
          status: "active",
        };
        return { exec: jest.fn().mockResolvedValue(finalDoc) } as any;
      });

      await schedulerService.checkAlerts();

      expect(mockedFetchWeatherData).toHaveBeenCalledWith(alert.location.value);
      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alert._id,
        { $set: { status: "active", lastCheckedAt: expect.any(Date) } },
        { new: true }
      );
      expect(mockTwilioMessagesCreate).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Alert ${alert._id} condition no longer met. Resetting to active.`
        )
      );
    });

    it("should NOT send notification if condition met but notifySMS is false", async () => {
      const alert = createMockAlert({
        status: "active",
        condition: { parameter: "temperature", operator: ">", threshold: 20 },
        notifySMS: false, // SMS disabled
      });
      MockedAlertModel.find.mockResolvedValue([alert]);
      mockedFetchWeatherData.mockResolvedValue({
        ...mockWeatherData,
        temperature: 25,
      }); // Condition met

      MockedAlertModel.findByIdAndUpdate.mockImplementation((id, update) => {
        const finalDoc = {
          ...alert,
          ...(update.$set || {}),
          _id: id,
          status: "triggered",
        };
        return { exec: jest.fn().mockResolvedValue(finalDoc) } as any;
      });

      await schedulerService.checkAlerts();

      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alert._id,
        expect.objectContaining({
          $set: expect.objectContaining({ status: "triggered" }),
        }),
        { new: true }
      );
      expect(mockTwilioMessagesCreate).not.toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Alert ${alert._id} triggered!`)
      ); // Still logs trigger
    });

    it("should NOT send notification if alert condition remains met (already triggered)", async () => {
      const alert = createMockAlert({
        status: "triggered", // Already triggered
        condition: { parameter: "temperature", operator: ">", threshold: 20 },
        notifySMS: true, // SMS enabled, but shouldn't matter here
      });
      MockedAlertModel.find.mockResolvedValue([alert]);
      mockedFetchWeatherData.mockResolvedValue({
        ...mockWeatherData,
        temperature: 25,
      }); // Condition still met

      MockedAlertModel.findByIdAndUpdate.mockImplementation((id, update) => {
        // Status remains triggered
        const finalDoc = {
          ...alert,
          ...(update.$set || {}),
          _id: id,
          status: "triggered",
        };
        return { exec: jest.fn().mockResolvedValue(finalDoc) } as any;
      });

      await schedulerService.checkAlerts();

      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alert._id,
        { $set: { lastCheckedAt: expect.any(Date) } }, // Only lastCheckedAt should be updated
        { new: true }
      );
      expect(mockTwilioMessagesCreate).not.toHaveBeenCalled();
      expect(Logger.info).not.toHaveBeenCalledWith(
        expect.stringContaining(`Alert ${alert._id} triggered!`)
      ); // No trigger log
    });

    // --- Edge Cases / Error Handling ---

    it("should handle Coordinates location type", async () => {
      const coords = { lat: 51.5, lon: -0.1 };
      const alert = createMockAlert({
        status: "active",
        location: { type: "Coordinates", value: coords },
        condition: { parameter: "humidity", operator: ">=", threshold: 50 },
      });
      MockedAlertModel.find.mockResolvedValue([alert]);
      mockedFetchWeatherData.mockResolvedValue({
        ...mockWeatherData,
        humidity: 60,
      }); // Condition met

      MockedAlertModel.findByIdAndUpdate.mockImplementation((id, update) => {
        const finalDoc = {
          ...alert,
          ...(update.$set || {}),
          _id: id,
          status: "triggered",
        };
        return { exec: jest.fn().mockResolvedValue(finalDoc) } as any;
      });

      await schedulerService.checkAlerts();

      expect(mockedFetchWeatherData).toHaveBeenCalledWith(
        `${coords.lat},${coords.lon}`
      );
      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alert._id,
        expect.objectContaining({
          $set: expect.objectContaining({ status: "triggered" }),
        }),
        { new: true }
      );
      // Could add notification check if notifySMS was true in mock
    });

    it("should log error and continue if fetching weather data fails for one alert", async () => {
      const alertOK1 = createMockAlert({
        location: { type: "City", value: "London" },
      });
      const alertFail = createMockAlert({
        location: { type: "City", value: "Paris" },
      });
      const alertOK2 = createMockAlert({
        location: { type: "City", value: "Berlin" },
      });
      MockedAlertModel.find.mockResolvedValue([alertOK1, alertFail, alertOK2]);

      const weatherError = new Error("Weather API timeout");
      mockedFetchWeatherData
        .mockResolvedValueOnce(mockWeatherData) // Success for alertOK1
        .mockRejectedValueOnce(weatherError) // Fail for alertFail
        .mockResolvedValueOnce(mockWeatherData); // Success for alertOK2

      // Spy on _processAlert to verify it's called for all, even if one fails internally
      const processAlertSpy = jest.spyOn(
        schedulerService as any,
        "_processAlert"
      );

      await schedulerService.checkAlerts();

      expect(processAlertSpy).toHaveBeenCalledTimes(3); // Called for all alerts
      expect(mockedFetchWeatherData).toHaveBeenCalledWith("London");
      expect(mockedFetchWeatherData).toHaveBeenCalledWith("Paris");
      expect(mockedFetchWeatherData).toHaveBeenCalledWith("Berlin");

      // Check error log for the failed alert - expecting ONE string argument
      expect(Logger.error).toHaveBeenCalledWith(
        // Check that the single string contains the necessary parts
        expect.stringContaining(`Error processing alert ${alertFail._id}`)
        // Optionally add more contains checks if needed, e.g., for location or error message
        // expect.stringContaining(weatherError.message)
        // expect.stringContaining(alertFail.location.value as string)
      );
      // Check that successful alerts were still updated
      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alertOK1._id,
        expect.any(Object),
        expect.any(Object)
      );
      // Check that the failed alert was *not* updated (due to error)
      expect(MockedAlertModel.findByIdAndUpdate).not.toHaveBeenCalledWith(
        alertFail._id,
        expect.any(Object),
        expect.any(Object)
      );
      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alertOK2._id,
        expect.any(Object),
        expect.any(Object)
      );

      processAlertSpy.mockRestore();
    });

    it("should handle invalid condition parameters gracefully", async () => {
      const alert = createMockAlert({
        condition: {
          parameter: "invalidParam" as any,
          operator: ">",
          threshold: 10,
        },
      });
      MockedAlertModel.find.mockResolvedValue([alert]);
      mockedFetchWeatherData.mockResolvedValue(mockWeatherData);

      MockedAlertModel.findByIdAndUpdate.mockImplementation((id, update) => {
        const finalDoc = { ...alert, ...(update.$set || {}), _id: id };
        return { exec: jest.fn().mockResolvedValue(finalDoc) } as any;
      });

      await schedulerService.checkAlerts();

      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "No mapping found for condition parameter: invalidParam"
        )
      );
      // Should still update lastCheckedAt even if condition check fails
      expect(MockedAlertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        alert._id,
        { $set: { lastCheckedAt: expect.any(Date) } },
        { new: true }
      );
      expect(mockTwilioMessagesCreate).not.toHaveBeenCalled(); // No notification
    });
  });
});
