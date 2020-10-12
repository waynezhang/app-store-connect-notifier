import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';

export interface Notifier {
  notify(appVersion: AppVersion): Promise<void>
  notifyTestFlightBuild(build: TestFlightBuild): Promise<void>
}

