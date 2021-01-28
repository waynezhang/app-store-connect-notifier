import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';
import { Metric } from '../api/app-metric';

export interface Notifier {
  setUp(): void
  tearDown(): void
  notify(appVersion: AppVersion): Promise<void>
  notifyTestFlightBuild(build: TestFlightBuild): Promise<void>
  notifyMetric(metric: Metric): Promise<void>
}

