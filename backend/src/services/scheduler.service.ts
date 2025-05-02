import schedule from "node-schedule";
import { Twilio } from "twilio";

import Logger from "../utils/logger";
import AlertModel from "../models/Alert.model";
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
  private notificationService: Twilio;

  constructor() {
    this.notificationService = new Twilio(
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
      return false;
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

  private async sendNotification(alert: IAlert): Promise<void> {
    Logger.info(
      `${this.schedulerServiceName} Handling triggered alert ${alert._id}`
    );

    const message = `[Climetrics] TriggeredAlert: ${
      alert.name || alert._id
    } - ${alert.condition.parameter} ${alert.condition.operator} ${
      alert.condition.threshold
    }, Visit the app to see more and acknowledge.`;

    try {
      await this.notificationService.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: alert.phoneNumber || "", // TODO: Make recipient dynamic or configurable
      });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Processes a single alert: fetches weather, checks condition, updates status, and sends notification if needed.
   * @param alert The alert object to process.
   */
  private async _processAlert(alert: IAlert): Promise<void> {
    let locationString: string;
    if (alert.location.type === "City") {
      locationString = alert.location.value as string;
    } else if (alert.location.type === "Coordinates") {
      const coords = alert.location.value as { lat: number; lon: number };
      locationString = `${coords.lat},${coords.lon}`;
    } else {
      Logger.warn(
        `${this.schedulerServiceName} Unknown location type for alert ${alert._id}`
      );
      return; // Skip this alert if location type is unknown
    }

    try {
      Logger.debug(
        `${this.schedulerServiceName} Fetching weather for alert ${alert._id} at location ${locationString}`
      );
      const weatherData = await fetchWeatherData(locationString);

      const conditionMet = this.checkCondition(alert.condition, weatherData);

      const updates: Partial<IAlert> & { $set?: any } = {
        $set: { lastCheckedAt: new Date() }, // Always update lastCheckedAt
      };
      let statusChanged = false;

      if (conditionMet && alert.status === "active") {
        // Condition met, was active -> Trigger it
        updates.status = "triggered";
        updates.lastTriggeredAt = new Date();
        statusChanged = true;
        Logger.info(
          `${this.schedulerServiceName} Alert ${alert._id} triggered!`
        );
      } else if (!conditionMet && alert.status === "triggered") {
        // Condition NOT met, was triggered -> Reset it
        updates.status = "active";
        statusChanged = true;
        Logger.info(
          `${this.schedulerServiceName} Alert ${alert._id} condition no longer met. Resetting to active.`
        );
      }

      // Apply updates if status changed or just to update lastCheckedAt
      if (statusChanged || updates.$set?.lastCheckedAt) {
        const updatedAlert = await AlertModel.findByIdAndUpdate(
          alert._id,
          updates,
          { new: true }
        );

        // Send notification only when it first becomes triggered
        if (
          updatedAlert &&
          updatedAlert.status === "triggered" &&
          statusChanged && // Ensure status actually changed to triggered in this cycle
          updatedAlert.notifySMS &&
          updatedAlert.phoneNumber
        ) {
          const alertObject: IAlert = {
            ...updatedAlert.toObject(),
            _id: updatedAlert._id.toString(),
          };
          await this.sendNotification(alertObject);
        }
      }
    } catch (error: any) {
      Logger.error(
        `${this.schedulerServiceName} Error processing alert ${alert._id} for location ${locationString}: ${error.message}`
      );
      // Continue to the next alert even if one fails
    }
  }

  /**
   * Fetches active and triggered alerts, then processes each one.
   */
  public async checkAlerts(): Promise<void> {
    Logger.info(`${this.schedulerServiceName} Starting checkAlerts cycle...`);
    try {
      const alertsToCheck = await AlertModel.find({
        status: { $in: ["active", "triggered"] },
      }).lean(); // Using lean() for performance as we don't need full Mongoose documents here

      Logger.debug(
        `${this.schedulerServiceName} Found ${alertsToCheck.length} alerts to check (active or triggered).`
      );

      for (const alert of alertsToCheck) {
        await this._processAlert(alert); // Cast necessary because lean returns plain objects
      }

      Logger.info(`${this.schedulerServiceName} Finished checkAlerts cycle.`);
    } catch (error: any) {
      Logger.error(
        `${this.schedulerServiceName} Error fetching alerts to check: ${error.message}`
      );
      // If fetching the list fails, we log and stop the cycle for this run
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
