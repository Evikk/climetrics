import schedule from "node-schedule";
import { Twilio } from "twilio";

import Logger from "../utils/logger";
import AlertModel, { IAlertDocument } from "../models/Alert.model";
import { fetchWeatherData, WeatherData } from "./weather.service";
import { IAlert, ICondition, ILocation, WeatherParameter } from "@acme/types";

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

  private async sendNotification(alert: IAlertDocument): Promise<void> {
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

  private getLocationString(location: ILocation): string {
    if (location.type === "City") {
      return location.value as string;
    } else if (location.type === "Coordinates") {
      const coords = location.value as { lat: number; lon: number };
      return `${coords.lat},${coords.lon}`;
    } else {
      throw new Error(`Unknown location type encountered: ${location.type}`);
    }
  }

  private shouldSendNotification(
    alert: IAlertDocument,
    statusChanged: boolean
  ): boolean {
    return (
      alert.status === "triggered" &&
      statusChanged &&
      !!alert.notifySMS &&
      !!alert.phoneNumber
    );
  }

  /**
   * Processes a single alert: fetches weather, checks condition, updates status, and sends notification if needed.
   * @param alert The alert object to process.
   */
  private async _processAlert(alert: IAlertDocument): Promise<void> {
    const locationString = this.getLocationString(alert.location);
    try {
      Logger.debug(
        `${this.schedulerServiceName} Fetching weather for alert ${alert._id} at location ${locationString}`
      );
      const weatherData = await fetchWeatherData(locationString);
      const conditionMet = this.checkCondition(alert.condition, weatherData);

      const fieldsToUpdate: Partial<IAlertDocument> = {
        lastCheckedAt: new Date(),
      };

      let statusChanged = false;
      let newStatus = alert.status;

      if (conditionMet && alert.status === "active") {
        newStatus = "triggered";
        statusChanged = true;
        fieldsToUpdate.status = newStatus;
        fieldsToUpdate.lastTriggeredAt = new Date();
        Logger.info(
          `${this.schedulerServiceName} Alert ${alert._id} triggered!`
        );
      } else if (!conditionMet && alert.status === "triggered") {
        newStatus = "active";
        statusChanged = true;
        fieldsToUpdate.status = newStatus;
        // Note: lastTriggeredAt remains the timestamp of the last trigger event
        Logger.info(
          `${this.schedulerServiceName} Alert ${alert._id} condition no longer met. Resetting to active.`
        );
      }

      const updatedAlert = (await AlertModel.findByIdAndUpdate(
        alert._id,
        { $set: fieldsToUpdate },
        { new: true }
      )) as IAlertDocument;

      // Send notification only if the alert just transitioned to 'triggered'
      if (this.shouldSendNotification(updatedAlert, statusChanged)) {
        await this.sendNotification(updatedAlert);
      }
    } catch (error: any) {
      Logger.error(
        `${this.schedulerServiceName} Error processing alert ${alert._id} for location ${locationString}: ${error.message}`
      );
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
      });

      Logger.debug(
        `${this.schedulerServiceName} Found ${alertsToCheck.length} alerts to check (active or triggered).`
      );

      for (const alert of alertsToCheck) {
        await this._processAlert(alert);
      }

      Logger.info(`${this.schedulerServiceName} Finished checkAlerts cycle.`);
    } catch (error: any) {
      Logger.error(
        `${this.schedulerServiceName} Error fetching alerts to check: ${error.message}`
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

export default SchedulerService;
