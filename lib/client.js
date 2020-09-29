const App = require('../models/app');
const AppVersion = require('../models/appversion');
const AppState = require('../models/appstate');
const TestFlightBuild = require('../models/testflight-build');
const semver = require('semver');

class Client {

  constructor(api) {
    this.api = api;
  }
  
  async login() {
    await this.api.login();
    this.apiClient = this.api.apiClient();
  }

  async findApp(bundleId) {
    try {
      const { body } = await this.apiClient('apps', {
        searchParams: {
          'filter[bundleId]': bundleId,
          'include': 'appStoreVersions'
        }
      });
      const apps = body.data.filter((app) => app.attributes.bundleId == bundleId );
      if (apps.length > 0) {
        return new App(apps[0]);
      } else {
        return null;
      }
    } catch (err) {
      console.log(`Failed to find app ${err}`);
    }
  }

  async appVersions(app) {
    const states = [
      AppState.ProcessingForAppStore,
      AppState.PendingDeveloperRelease,
      AppState.InReiew,
      AppState.WatingForReiew,
      AppState.DeveloperRejected,
      AppState.Rejected,
      AppState.PrepareForSubmission,
      AppState.MetadataRejected,
      AppState.InvalidBinary,
      AppState.ReadyForSale,
    ];
    return await this.fetchAppVersions(app, states);
  }

  async releasedAppVersion(app) {
    const states = [
      AppState.ProcessingForAppStore,
      AppState.PendingDeveloperRelease,
      AppState.ReadyForSale,
    ];
    return (await this.fetchAppVersions(app, states))[0];
  }

  async fetchAppVersions(app, states) {
    try {
      const { body } = await this.apiClient(`apps/${app.id}/appStoreVersions`, {
        searchParams: {
          'filter[appStoreState]': states.join(','),
          'filter[platform]': 'IOS',
          'include': 'appStoreVersionSubmission,build,appStoreVersionPhasedRelease',
        }
      });

      const versions = [];
      for (const version of body.data) {
        let extra = {}
        if (version.relationships.build.data) {
          const { body } = await this.apiClient(`builds/${version.relationships.build.data.id}`);
          extra['storeIcon'] = body.data.attributes.iconAssetToken;
        } else {
          extra['storeIcon'] = { templateUrl: '' }
        }

        // Phased release
        if (version.relationships.appStoreVersionPhasedRelease.data) {
          const { body } = await this.apiClient(`appStoreVersions/${version.relationships.appStoreVersionPhasedRelease.data.id}/appStoreVersionPhasedRelease`);
          extra['phasedRelease'] = body.data.attributes
        }
        versions.push(new AppVersion(app, version, extra));
      }
      return versions;
    } catch (err) {
      console.log(`Failed to get app version info ${err}`);
      return [];
    }
  }

  async fetchBuild(buildId) {
    try {
    } catch (err) {
      console.log(`Failed to get app version info ${err}`);
    }
  }

  async testFlightBuilds(app) {
    try {
      const storeVersion = await this.releasedAppVersion(app);
      const { body } = await this.apiClient(`preReleaseVersions`, {
        searchParams: {
          'filter[app]': app.id,
          'filter[platform]': 'IOS',
          'filter[builds.expired]': false,
          'sort': '-version',
          'limit': 25
        }
      });
      const versions = body.data.filter((item) => semver.gt(item.attributes.version, storeVersion.version));
      const builds = [];
      for (const ver of versions) {
        const response = await this.testFlightBuild(ver.id)
        const testState = await this.testStateOfTestFlightBuild(response.id);
        const build = new TestFlightBuild(app, ver.attributes.version, response, testState);
        builds.push(build);
      }
      return builds;
    } catch (err) {
      console.log(`Failed to find pre release versions ${err}`);
    }
  }

  async testFlightBuild(id) {
    try {
      const { body } = await this.apiClient(`builds`, {
        searchParams: {
          'filter[preReleaseVersion]': id,
          'filter[expired]': false,
          'sort': '-version',
          'limit': 1
        }
      });
      return body.data[0];
    } catch (err) {
      console.log(`Failed to find test build ${err}`);
    }
  }

  async testStateOfTestFlightBuild(id) {
    try {
      const { body } = await this.apiClient(`builds/${id}/buildBetaDetail`);
      return body.data;
    } catch (err) {
      console.log(`Failed to find test build ${err}`);
    }
  }
}

module.exports = Client;
