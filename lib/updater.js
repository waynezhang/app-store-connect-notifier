const Keyv = require('keyv');
const Client = require('./client');

const keyv = new Keyv('sqlite://status.sqlite');
keyv.on('error', err => console.log('Connection Error', err));

function initializeAPI(config) {
  const type = config.API.type;
  const params = config.API.constructor;
  params.unshift(null);

  const cls = require(`../${type}`); 
  return new (Function.prototype.bind.apply(cls, params));
}

function initializeNotifiers(config) {
  let notifiers = {};
  for (const notifier of config.notifiers) {
    const type = notifier.class;
    const params = notifier.constructor;
    params.unshift(null);

    const cls = require(`../${type}`);
    notifiers[notifier.name] = new (Function.prototype.bind.apply(cls, params));
  }

  return notifiers;
}

async function notify(configApp, appVersion, notifiers) {
  for (const configNotifier of configApp.notifiers) {
    const notifier = notifiers[configNotifier];
    try {
      await notifier.notify(appVersion);
    } catch(err) {
      console.log(`Failed to notify ${appVersion.id} by ${configNotifier} due to ${err}`);
    }
  }
}

async function notifyTestFlightBuild(configBuild, build, notifiers) {
  for (const configNotifier of configBuild.notifiers) {
    const notifier = notifiers[configNotifier];
    try {
      await notifier.notifyTestFlightBuild(build);
    } catch(err) {
      console.log(`Failed to notify ${build.version} by ${configNotifier} due to ${err}`);
    }
  }
}

async function updateApps(client, config, notifiers, silence) {
  for (const configApp of config.apps) {
    const app = await client.findApp(configApp.bundleId);
    const versions = await client.appVersions(app);

    for (const ver of versions) {
      const key = ver.versionKey();
      const state = ver.versionState();

      const lastState = await keyv.get(key);
      if (lastState != state) {
        console.log(`[Log] ${key} -> ${state}`);
        await keyv.set(key, state);
        if (!silence) {
          await notify(configApp, ver, notifiers);
        }
        continue;
      }

      console.log(`[Log] ${key} state ${state} not changed`);
    }
  }
}

async function updateTestFlightBuilds(client, config, notifiers, silence) {
  for (const configBuild of config.testflight) {
    const app = await client.findApp(configBuild.bundleId);
    const builds = await client.testFlightBuilds(app);

    for (const build of builds) {
      const key = build.buildKey();
      const state = build.buildState();
      const lastState = await keyv.get(key);
      if (lastState != state) {
        console.log(`[Log] ${key} -> ${state}`);
        await keyv.set(key, state);

        if (!silence) {
          notifyTestFlightBuild(configBuild, build, notifiers);
        }
        continue;
      }

      console.log(`[Log] ${key} state ${state} not changed`);
    }
  }
}

class Updater {

  constructor(config, silence) {
    this.config = config;
    this.silence = silence;

    this.notifiers = initializeNotifiers(this.config);
    this.api = initializeAPI(this.config);
    this.client = new Client(this.api);
  }

  async update() {
    await this.client.login();
    await updateApps(this.client, this.config, this.notifiers, this.silence);
    await updateTestFlightBuilds(this.client, this.config, this.notifiers, this.silence);
  }
}

module.exports = Updater;
