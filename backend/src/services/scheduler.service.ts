import { EventEmitter } from "events";
import schedule from "node-schedule";
import { Twilio } from "twilio";

import Logger from "../utils/logger";
import Alert from "../models/Alert.model";
import { fetchWeatherData, WeatherData } from "./weather.service";
import { IAlert, ICondition, WeatherParameter } from "@acme/types";
// Map condition parameters to WeatherData properties if they differ
const parameterMap: { [key in WeatherParameter]?: keyof WeatherData } = {
  temperature: "temperature",
  windSpeed: "windSpeed",
  precipitation: "precipitationIntensity", // Map 'precipitation' condition to 'precipitationIntensity' data
};

class SchedulerService {
  private job: schedule.Job | null = null;
  private schedulerServiceName: string = "[SchedulerService]";
  private twilio: Twilio;
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  /**
   * Checks if the current weather data satisfies the alert condition.
   * @param condition The alert condition (parameter, operator, threshold).
   * @param weatherData The current weather data.
   * @returns True if the condition is met, false otherwise.
   */
  private checkCondition(
    condition: ICondition,
    weatherData: WeatherData
  ): boolean {
    const { parameter, operator, threshold } = condition;

    // Map the condition parameter to the actual data key
    const dataKey = parameterMap[parameter];
    if (!dataKey) {
      Logger.warn(
        `${this.schedulerServiceName} No mapping found for condition parameter: ${parameter}`
      );
      return false;
    }

    const currentValue = weatherData[dataKey]; // Access using the mapped key

    if (currentValue === undefined || currentValue === null) {
      Logger.warn(
        `${this.schedulerServiceName} Weather data missing for parameter: ${parameter} (mapped to ${dataKey})`
      );
      return false; // Cannot evaluate if data is missing
    }

    switch (operator) {
      case ">":
        return currentValue > threshold;
      case "<":
        return currentValue < threshold;
      case ">=":
        return currentValue >= threshold;
      case "<=":
        return currentValue <= threshold;
      case "=":
        return currentValue === threshold;
      default:
        Logger.warn(
          `${this.schedulerServiceName} Unknown operator: ${operator}`
        );
        return false;
    }
  }

  private handleTriggeredAlert(alert: IAlert): void {
    Logger.info(
      `${this.schedulerServiceName} Handling triggered alert ${alert._id}`
    );

    // 1. Emit event for SSE
    this.eventEmitter.emit("alertTriggered", alert);
    Logger.debug(
      `${this.schedulerServiceName} Emitted 'alertTriggered' event for alert ${alert._id}`
    );

    // 2. Trigger SMS (optional, kept for now)
    const message = `Alert: ${alert.name} - ${alert.condition.parameter} ${alert.condition.operator} ${alert.condition.threshold}`;
    // Consider moving Twilio client instantiation out if reused elsewhere
    const twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    twilio.messages
      .create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: "+1234567890", // TODO: Make recipient dynamic or configurable
      })
      .then((msg) =>
        Logger.info(
          `${this.schedulerServiceName} SMS sent for alert ${alert._id}: ${msg.sid}`
        )
      )
      .catch((err) =>
        Logger.error(
          `${this.schedulerServiceName} Failed to send SMS for alert ${alert._id}: ${err.message}`
        )
      );
  }

  /**
   * Fetches active alerts, checks their conditions against current weather, and updates status.
   */
  public async checkAlerts(): Promise<void> {
    Logger.info(`${this.schedulerServiceName} Starting checkAlerts cycle...`);
    try {
      // Fetch only necessary fields
      const activeAlerts = await Alert.find({ status: "active" }).lean(); // Use lean() for plain JS objects
      Logger.debug(
        `${this.schedulerServiceName} Found ${activeAlerts.length} active alerts.`
      );

      for (const alert of activeAlerts) {
        let locationString: string;
        if (alert.location.type === "City") {
          locationString = alert.location.value as string;
        } else if (alert.location.type === "Coordinates") {
          // Ensure value is correctly typed if using lean()
          const coords = alert.location.value as { lat: number; lon: number };
          locationString = `${coords.lat},${coords.lon}`;
        } else {
          Logger.warn(
            `${this.schedulerServiceName} Unknown location type for alert ${alert._id}`
          );
          continue;
        }

        try {
          Logger.debug(
            `${this.schedulerServiceName} Fetching weather for alert ${alert._id} at location ${locationString}`
          );
          const weatherData = await fetchWeatherData(locationString);

          const conditionMet = this.checkCondition(
            alert.condition,
            weatherData
          );
          Logger.debug(
            `${this.schedulerServiceName} Alert ${alert._id} condition met: ${conditionMet}`
          );

          if (conditionMet) {
            // Update status first
            const updatedAlert = await Alert.findByIdAndUpdate(
              alert._id,
              { status: "triggered" },
              { new: true } // Return the updated document
            );

            if (updatedAlert) {
              Logger.info(
                `${this.schedulerServiceName} Alert ${updatedAlert._id} triggered! Status updated.`
              );
              // Pass the updated alert object
              const alertObject: IAlert = {
                ...updatedAlert.toObject(), // Spread plain object properties
                _id: updatedAlert._id.toString(), // Explicitly convert _id
              };
              this.handleTriggeredAlert(alertObject);
            } else {
              Logger.warn(
                `${this.schedulerServiceName} Alert ${alert._id} could not be found after triggering condition was met.`
              );
            }
          }
        } catch (error: any) {
          Logger.error(
            `${this.schedulerServiceName} Error processing alert ${alert._id} for location ${locationString}: ${error.message}`
          );
          // Continue to the next alert even if one fails
        }
      }
      Logger.info(`${this.schedulerServiceName} Finished checkAlerts cycle.`);
    } catch (error: any) {
      Logger.error(
        `${this.schedulerServiceName} Error fetching active alerts: ${error.message}`
      );
    }
  }

  /**
   * Starts the scheduler to run checkAlerts periodically.
   * Defaults to running every minute.
   */
  public start(
    cronExpression: string = "* * * * *",
    runImmediately: boolean = false
  ): void {
    if (this.job) {
      Logger.warn(
        `${this.schedulerServiceName} Scheduler job already running.`
      );
      return;
    }

    Logger.info(
      `${this.schedulerServiceName} Starting scheduler with cron: ${cronExpression}`
    );
    // Schedule the job
    this.job = schedule.scheduleJob(cronExpression, async () => {
      await this.checkAlerts();
    });

    if (runImmediately) {
      // Run async without awaiting completion here
      this.checkAlerts().catch((err) => {
        Logger.error(
          `${this.schedulerServiceName} Initial checkAlerts run failed: ${err.message}`
        );
      });
    }

    Logger.info(`${this.schedulerServiceName} Scheduler started.`);
  }

  /**
   * Stops the scheduled job.
   */
  public stop(): void {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      Logger.info(`${this.schedulerServiceName} Scheduler stopped.`);
    }
  }
}

// Export an instance or the class itself depending on usage preference
// Exporting the class allows for configuration/dependency injection if needed later
export default SchedulerService;
