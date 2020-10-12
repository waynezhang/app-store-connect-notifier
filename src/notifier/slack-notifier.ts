import { Notifier } from  './notifier';
import { AppVersion } from '../api/app-version';
import { WebClient } from '@slack/web-api';
import { TestFlightBuild } from '../api/testflight-build';
import { formatEnumString } from '../util/string-utils';

enum State {
  Neutral,
  Failed,
  Succeed
}

/* tslint:disable:no-namespace */
namespace State {
/* tslint:enable:no-namespace */

  export function color(state: State): string {
    switch (state) {
      case State.Succeed: return '#3ddc97';
      case State.Neutral: return '#ffbb91';
      case State.Failed: return '#fb378c';
    }
  }
}

class SlackNotifier implements Notifier {

  private notifier: WebClient

  constructor(token: string, private channel: string) {
    this.notifier = new WebClient(token);
  }

  async notify(appVersion: AppVersion) {
    const message: any = {
      channel: this.channel,
      as_user: true,
      text: '',
      attachments: [
        {
          author_name: appVersion.app.name,
          author_icon: appVersion.iconUrl,
          color: this.colorOfAppVersion(appVersion),
          fields: [
            {
              title: '',
              value: `${appVersion.app.name} *${appVersion.version}* has been changed to *${formatEnumString(appVersion.state)}*`
            },
            {
              value: `Version: *${appVersion.version}*`,
              short: true
            },
            {
              value: `Status: *${formatEnumString(appVersion.state)}*`,
              short: true
            }
          ]
        }
      ]
    }
    if (appVersion.phasedRelease) {
      message.attachments[0].fields.push(
        {
          value: `Phased Release: *${formatEnumString(appVersion.phasedRelease.state)}*`,
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

  async notifyTestFlightBuild(build: TestFlightBuild): Promise<void> {
    const message = {
      channel: this.channel,
      as_user: true,
      text: '',
      attachments: [
        {
          author_name: 'TestFlight',
          author_icon: build.iconUrl,
          color: this.colorOfTestFlightBuild(build),
          text: [
            `${build.app.name} *${build.appVersion}* build *${build.version}* has been changed to *${formatEnumString(build.processingState)}*`,
            `Internal Test: *${formatEnumString(build.internalBuildState)}*`,
            `External Test: *${formatEnumString(build.externalBuildState)}*`
          ].join('\n')
        }
      ]
    };
    await this.notifier.chat.postMessage(message);
  }

  private colorOfAppVersion(version: AppVersion): string {
    const state = this.checkState(
      version.state,
      [
        AppVersion.State.InReiew,
        AppVersion.State.WatingForReiew,
        AppVersion.State.PrepareForSubmission,
        AppVersion.State.ProcessingForAppStore,
      ],
      [
        AppVersion.State.DeveloperRejected,
        AppVersion.State.MetadataRejected,
        AppVersion.State.Rejected,
        AppVersion.State.InvalidBinary,
      ]
    )
    return State.color(state);
  }

  private colorOfTestFlightBuild(build: TestFlightBuild): string {
    return State.color(this.testFlightBuildState(build));
  }

  private testFlightBuildState(build: TestFlightBuild): State {
    let state = this.checkState(
      build.processingState,
      [
        TestFlightBuild.ProcessingState.Processing,
      ],
      [
        TestFlightBuild.ProcessingState.Failed,
        TestFlightBuild.ProcessingState.Invalid,
      ]
    );
    if (state !== State.Succeed) {
      return state;
    }

    state = this.checkState(
      build.internalBuildState,
      [
        TestFlightBuild.InternalState.Processing,
        TestFlightBuild.InternalState.InExportComplianceReview,
      ],
      [
        TestFlightBuild.InternalState.ProcessingException,
        TestFlightBuild.InternalState.MissingExportCompliance,
        TestFlightBuild.InternalState.Expired,
      ]
    );
    if (state !== State.Succeed) {
      return state;
    }

    state = this.checkState(
      build.externalBuildState,
      [
        TestFlightBuild.ExternalState.Processing,
        TestFlightBuild.ExternalState.WaitingForBetaReview,
        TestFlightBuild.ExternalState.InExportComplianceReview,
      ],
      [
        TestFlightBuild.ExternalState.ProcessingException,
        TestFlightBuild.ExternalState.MissingExportCompliance,
        TestFlightBuild.ExternalState.Expired,
        TestFlightBuild.ExternalState.BetaRejected,
      ]
    );
    return state;
  }

  private checkState<T>(state: T, neutralStates: T[], failedStates: T[]): State {
    if (neutralStates.indexOf(state) !== -1) {
      return State.Neutral;
    }
    if (failedStates.indexOf(state) !== -1) {
      return State.Failed;
    }

    return State.Succeed;
  }
}

export default SlackNotifier;
