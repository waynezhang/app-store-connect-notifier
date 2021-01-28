import { Identifiable } from './identifiable';
import { App } from './app';

export enum MetricIdentifier {
  HangRate = 'HANG-hangRate',
  LaunchTime = 'LAUNCH-launchTime',
  PeakMemory = 'MEMORY-peakMemory',
  MemoryAtSuspension = 'MEMORY-memoryAtSuspension',
  DiskWrites = 'DISK-diskWrites',
  BatteryUsage = 'BATTERY-batteryUsage',
  BatteryOnScreen = 'BATTERY-onScreen',
  BatteryBackground = 'BATTERY-background',
  ScrollHitchRate = 'ANIMATION-scrollHitchRate',
}

export enum MetricDevice {
  iPad = 'all_ipads',
  iPhone = 'all_iphones',
}

export enum MetricPercentile {
  fifty = 'percentile.fifty',
  ninety = 'percentile.ninety',
}

export class Metric implements Identifiable {

  app: App
  metricIdentifier: MetricIdentifier
  unit: string
  device: MetricDevice
  percentile: MetricPercentile
  version: string
  value: number

  constructor(app: App, identifier: MetricIdentifier, unit: string, device: MetricDevice, percentile: MetricPercentile, version: string, value: number) {
    this.app = app;
    this.metricIdentifier = identifier;
    this.unit = unit;
    this.device = device ;
    this.percentile = percentile;
    this.version = version;
    this.value = value;
  }

  get identifier(): string {
    return [
      this.app.bundleId,
      this.version,
      this.metricIdentifier,
      this.device,
      this.percentile,
    ].join('-');
  }

  get identifierState(): string {
    return `${this.value}`;
  }
}
