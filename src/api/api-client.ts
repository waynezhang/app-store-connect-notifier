import { ConnectAPI } from './connect-api';
import { AppVersion } from './app-version';
import { App } from './app';
import { Metric, MetricIdentifier, MetricDevice, MetricPercentile } from './app-metric';
import { TestFlightBuild } from './testflight-build';
import * as semver from 'semver';
import got from 'got';

export class APIClient {

  private requestClient!: typeof got

  constructor(private readonly api: ConnectAPI) { }

  async login(): Promise<void> {
    await this.api.login();
    this.requestClient = this.api.requestClient();
  }

  async findApp(bundleId: string): Promise<App> {
    const { body } = await this.requestClient('apps', {
      searchParams: {
        'filter[bundleId]': bundleId,
        'include': 'appStoreVersions'
      }
    });
    const apps = (body as any).data.filter((app: any) => app.attributes.bundleId === bundleId );

    return {
      id: apps[0].id as string,
      name: apps[0].attributes.name,
      bundleId: apps[0].attributes.bundleId,
    }
  }

  async findAppVersions(app: App): Promise<AppVersion[]> {
    const states = [
      AppVersion.State.ProcessingForAppStore,
      AppVersion.State.PendingDeveloperRelease,
      AppVersion.State.InReiew,
      AppVersion.State.WatingForReiew,
      AppVersion.State.DeveloperRejected,
      AppVersion.State.Rejected,
      AppVersion.State.PrepareForSubmission,
      AppVersion.State.MetadataRejected,
      AppVersion.State.InvalidBinary,
      AppVersion.State.ReadyForSale,
    ];

    return await this.fetchAppVersions(app, states);
  }

  async findTestFlightBuild(app: App): Promise<TestFlightBuild[]> {
    const storeVersion = await this.releasedAppVersion(app);
    const { body } = await this.requestClient(`preReleaseVersions`, {
      searchParams: {
        'filter[app]': app.id,
        'filter[platform]': 'IOS',
        'filter[builds.expired]': false,
        'sort': '-version',
        'limit': 25
      }
    });
    const versions = (body as any).data.filter((item: any) => semver.gt(item.attributes.version, storeVersion.version));
    const builds: TestFlightBuild[] = [];
    for (const ver of versions) {
      const info = await this.fetchTestFlightBuild(ver.id)
      const detail = await this.fetchTestFlightBuildDetail(info.id);
      const build = new TestFlightBuild(app, ver.attributes.version, info, detail);
      builds.push(build);
    }
    return builds;
  }

  async fetchMetric(app: App): Promise<Metric[]> {
    const { body } = await this.requestClient(`apps/${app.id}/perfPowerMetrics`, {
      searchParams: {
        'filter[deviceType]': 'all_ipads,all_iphones'
      },
      headers: {
        'Accept': 'application/vnd.apple.xcode-metrics+json'
      }
    });

    const metrics: Metric[] = [];
    for (const category of (body as any).productData[0].metricCategories) {
      for (const metric of category.metrics) {
        const identifierString = `${category.identifier}-${metric.identifier}`;
        const identifier = identifierString as MetricIdentifier;
        const unit = metric.unit.displayName;
        for (const dataset of metric.datasets) {
          const percentile = dataset.filterCriteria.percentile as MetricPercentile;
          const device = dataset.filterCriteria.device as MetricDevice;

          for (const point of dataset.points) {
            const version = point.version;
            const value = point.value;

            const item = new Metric(app, identifier, unit, device, percentile, version, value, point.percentageBreakdown);
            metrics.push(item);
          }
        }
      }
    }
    return metrics;
  }

  private async fetchTestFlightBuild(versionId: string): Promise<any> {
    const { body } = await this.requestClient(`builds`, {
      searchParams: {
        'filter[preReleaseVersion]': versionId,
        'filter[expired]': false,
        'sort': '-version',
        'limit': 1
      }
    });
    return (body as any).data[0];
  }

  private async fetchTestFlightBuildDetail(buildId: string): Promise<any> {
    const { body } = await this.requestClient(`builds/${buildId}/buildBetaDetail`);
    return (body as any).data;
  }

  private async releasedAppVersion(app: App): Promise<AppVersion> {
    const states = [
      AppVersion.State.ProcessingForAppStore,
      AppVersion.State.PendingDeveloperRelease,
      AppVersion.State.ReadyForSale,
    ];
    return (await this.fetchAppVersions(app, states))[0];
  }

  private async fetchAppVersions(app: App, states: AppVersion.State[]): Promise<AppVersion[]> {
    const { body } = await this.requestClient(`apps/${app.id}/appStoreVersions`, {
      searchParams: {
        'filter[appStoreState]': states.join(','),
        'filter[platform]': 'IOS',
        'include': 'appStoreVersionSubmission,build,appStoreVersionPhasedRelease',
      }
    });

    const versions: AppVersion[] = [];
    for (const version of (body as any).data) {
      const extra: any = {}
      if (version.relationships.build.data) {
        /* tslint:disable:no-shadowed-variable */
        const { body } = await this.requestClient(`builds/${version.relationships.build.data.id}`);
        /* tslint:enable:no-shadowed-variable */
        extra.storeIcon = (body as any).data.attributes.iconAssetToken;
      } else {
        extra.storeIcon = { templateUrl: '' }
      }

      // Phased release
      if (version.relationships.appStoreVersionPhasedRelease.data) {
        /* tslint:disable:no-shadowed-variable */
        const { body } = await this.requestClient(`appStoreVersions/${version.relationships.appStoreVersionPhasedRelease.data.id}/appStoreVersionPhasedRelease`);
        /* tslint:enable:no-shadowed-variable */
        extra.phasedRelease = (body as any).data.attributes
      }
      versions.push(new AppVersion(app, version, extra));
    }
    return versions;
  }
}
