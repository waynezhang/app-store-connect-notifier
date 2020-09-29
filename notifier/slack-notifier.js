const Notifier = require('./notifier');
const AppState = require('../models/appstate');
const WebClient = require('@slack/web-api').WebClient;

class SlackNotifier extends Notifier {
  constructor(token, channel) {
    super()
    this.notifier = new WebClient(token);
    this.channel = channel
  }

  async notify(appVersion) {
    let message = {
      channel: this.channel,
      as_user: true,
      text: '',
      attachments: [
        {
          author_name: appVersion.app.name,
          author_icon: appVersion.iconUrl,
          color: colorOfAppVersion(appVersion),
          fields: [
            {
              title: '',
              value: `${appVersion.app.name} *${appVersion.version}* has been changed to *${appVersion.stateString}*`
            },
            {
              value: `Version: *${appVersion.version}*`,
              short: true
            },
            {
              value: `Status: *${appVersion.stateString}*`,
              short: true
            }
          ]
        }
      ]
    }
    if (appVersion.phasedRelease) {
      message.attachments[0].fields.push(
        {
          value: `Phased Release: *${appVersion.phasedRelease.phasedReleaseState}*`,
          short: true
        }
      );
      message.attachments[0].fields.push(
        {
          value: `Percentage: *${appVersion.phasedRelease.percentage}%* (Day ${appVersion.phasedRelease.currentDayNumber})`,
          short: true
        }
      );
    }
    await this.notifier.chat.postMessage(message);
  }

  async notifyTestFlightBuild(build) {
    let message = {
      channel: this.channel,
      as_user: true,
      text: '',
      attachments: [
        {
          author_name: 'TestFlight',
          author_icon: build.iconUrl,
          color: colorOfTestFlightBuild(build),
          text: [
            `${build.app.name} *${build.appVersion}* build *${build.version}* has been changed to *${build.processingStateString}*`,
            `Internal Test: *${build.internalBuildStateString}*`,
            `External Test: *${build.externalBuildStateString}*`
          ].join('\n')
        }
      ]
    };
    await this.notifier.chat.postMessage(message);
  }
}

const ColorSucceed = '#3ddc97';
const ColorNeutral = '#ffbb91';
const ColorFailed = '#fb378c';

function colorOfAppVersion(version) {
  switch (version.state) {
    case AppState.PendingDeveloperRelease:
    case AppState.ReadyForSale:
      return ColorSucceed;
    case AppState.InReiew:
    case AppState.WatingForReiew:
    case AppState.PrepareForSubmission:
    case AppState.ProcessingForAppStore:
      return ColorNeutral;
    case AppState.DeveloperRejected:
    case AppState.MetadataRejected:
    case AppState.Rejected:
    case AppState.InvalidBinary:
      return ColorFailed;
  }
}

function colorOfTestFlightBuild(build) {
  if (build.isInNeutralState()) {
    return ColorNeutral;
  } else if (build.isInFailedState()) {
    return ColorFailed;
  }
  return ColorSucceed;
}

module.exports = SlackNotifier;
