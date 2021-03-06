import fs from 'fs';
import Keyv from 'keyv';
import { Notifier } from '../notifier/notifier';
import { ConnectAPI } from '../api/connect-api';
import { APIClient } from '../api/api-client';
import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';
import { Metric } from '../api/app-metric';
import { Identifiable } from '../api/identifiable';

interface NotifierMap {
  [index: string]: Notifier
}

export class Updater {

  private notifiers!: NotifierMap
  private apiClient!: APIClient
  private readonly keyv: Keyv

  constructor(private readonly config: any, private readonly silence: boolean) {
    this.config = config;
    this.silence = silence;

    const directory = 'data';
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
    this.keyv = new Keyv(`sqlite://${directory}/status.sqlite`);
    this.keyv.on('error', err => console.log('Connection Error', err));
  }

  async initialize(): Promise<void> {
    this.notifiers = await this.initializeNotifiers(this.config);

    const api = await this.initializeAPI(this.config);
    this.apiClient = new APIClient(api);
  }

  async update() {
    Object.values(this.notifiers).forEach(n => n.setUp());

    await this.apiClient.login();
    await this.updateApps();
    await this.updateTestFlightBuilds();

    Object.values(this.notifiers).forEach(n => n.tearDown());
  }

  private async initializeNotifiers(config: any): Promise<NotifierMap> {
    const map: NotifierMap = { };

    for (const notifier of config.notifiers) {
      const type = notifier.class;
      const params = notifier.constructor;
      params.unshift(null);

      const cls = (await import(`../${type}`)).default;
      map[notifier.name] = new (Function.prototype.bind.apply(cls, params))();
    }

    return map;
  }

  private async initializeAPI(config: any): Promise<ConnectAPI> {
    const type = config.API.type;
    const params = config.API.constructor;
    params.unshift(null);

    const cls = (await import(`../${type}`)).default;
    return new (Function.prototype.bind.apply(cls, params))();
  }

  private async updateApps() {
    for (const item of this.config.apps) {
      try {
        const app = await this.apiClient.findApp(item.bundleId);
        const versions = await this.apiClient.findAppVersions(app);

        await this.checkAndNotify(versions, item.notifiers, async (notifier, appVersion) => {
          await notifier.notify(appVersion as AppVersion);
        });

        const metrics = await this.apiClient.fetchMetric(app);
        await this.checkAndNotify(metrics, item.notifiers, async (notifier, metric) => {
          await notifier.notifyMetric(metric as Metric);
        });
      } catch(err) {
        console.log(`[Log] Failed to retrieve app due to ${err}`);
      }
    }
  }

  private async updateTestFlightBuilds() {
    for (const item of this.config.testflight) {
      try {
        const app = await this.apiClient.findApp(item.bundleId);
        const builds = await this.apiClient.findTestFlightBuild(app);

        await this.checkAndNotify(builds, item.notifiers, async (notifier, build) => {
          await notifier.notifyTestFlightBuild(build as TestFlightBuild);
        });
      } catch(err) {
        console.log(`[Log] Failed to retrieve testflight build due to ${err}`);
      }
    }
  }

  private async checkAndNotify(identifiables: Identifiable[], notifierNames: string[], notifyFunction: (notifier: Notifier, item: Identifiable) => Promise<void>) {
    for (const item of identifiables) {
      const identifier = item.identifier;
      const state = item.identifierState;

      const lastState = await this.keyv.get(identifier);
      if (lastState !== state) {
        console.log(`[Log] ${identifier} -> ${state}`);
        await this.keyv.set(identifier, state);

        if (!this.silence) {
          for (const notifierName of notifierNames) {
            const notifier = this.notifiers[notifierName];
            await notifyFunction(notifier, item);
          }
        }
        continue;
      }

      console.log(`[Log] ${identifier} state ${state} not changed`);
    }
  }
}
