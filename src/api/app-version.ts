import { PhasedRelease } from './phased-release';
import { App } from './app';
import { Identifiable } from './identifiable';

export class AppVersion implements Identifiable {

  readonly state: AppVersion.State
  readonly version: string
  readonly iconUrl?: string
  readonly phasedRelease?: PhasedRelease

  constructor(readonly app: App, response: any, extra: any) {
    this.state = response.attributes.appStoreState;
    this.version = response.attributes.versionString;
    this.iconUrl = extra.storeIcon.templateUrl
      .replace('{w}', '512')
      .replace('{h}', '512')
      .replace('{f}', 'png');
    if (extra.phasedRelease) {
      this.phasedRelease = new PhasedRelease(extra.phasedRelease);
    }
  }

  get identifier(): string {
    return `${this.app.bundleId}-${this.version}`;
  }

  get identifierState(): string {
    let ret: string[] = [
      this.state
    ];
    if (this.phasedRelease && this.phasedRelease.startDate) {
      ret = [
        ...ret,
        this.phasedRelease.state,
        this.phasedRelease.startDate,
        `${this.phasedRelease.totalPauseDuration}`,
        `${this.phasedRelease.currentDayNumber}`
      ];
    }
    return ret.join('-');
  }
}

/* tslint:disable:no-namespace */
export namespace AppVersion {
/* tslint:enable:no-namespace */

  export enum State {
    ProcessingForAppStore = 'PROCESSING_FOR_APP_STORE',
    PendingDeveloperRelease = 'PENDING_DEVELOPER_RELEASE',
    InReiew = 'IN_REVIEW',
    WatingForReiew = 'WAITING_FOR_REVIEW',
    DeveloperRejected = 'DEVELOPER_REJECTED',
    Rejected = 'REJECTED',
    PrepareForSubmission = 'PREPARE_FOR_SUBMISSION',
    MetadataRejected = 'METADATA_REJECTED',
    InvalidBinary = 'INVALID_BINARY',
    ReadyForSale = 'READY_FOR_SALE',
  }
}
