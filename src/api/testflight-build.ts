import { App } from './app';
import { Identifiable } from './identifiable';
import { formatEnumString } from '../util/string-utils';

export class TestFlightBuild implements Identifiable {

  readonly iconUrl: string
  readonly version: string
  readonly processingState: TestFlightBuild.ProcessingState
  readonly internalBuildState: TestFlightBuild.InternalState
  readonly externalBuildState: TestFlightBuild.ExternalState

  constructor(readonly app: App, readonly appVersion: string, response: any, testState: any) {
    this.version = response.attributes.version;
    this.processingState = response.attributes.processingState;
    this.iconUrl = response.attributes.iconAssetToken.templateUrl
                      .replace('{w}', '512')
                      .replace('{h}', '512')
                      .replace('{f}', 'png');
    this.internalBuildState = testState.attributes.internalBuildState;
    this.externalBuildState = testState.attributes.externalBuildState;
  }

  get identifier(): string {
    return `${this.app.bundleId}-${this.appVersion}-${this.version}`;
  }

  get identifierState(): string {
    return [ this.processingState, this.internalBuildState, this.externalBuildState ].join('-');
  }
}

/* tslint:disable:no-namespace */
export namespace TestFlightBuild {
/* tslint:enable:no-namespace */

  export enum ProcessingState {
    Processing = 'PROCESSING',
    Failed = 'FAILED',
    Invalid = 'INVALID',
    Valid = 'VALID'
  }

  export enum InternalState {
    Processing = 'ROCESSING',
    ProcessingException = 'PROCESSING_EXCEPTION',
    MissingExportCompliance = 'MISSING_EXPORT_COMPLIANCE',
    ReadyForBetaTesting = 'READY_FOR_BETA_TESTING',
    InBetaTesting = 'IN_BETA_TESTING',
    Expired = 'EXPIRED',
    InExportComplianceReview = 'IN_EXPORT_COMPLIANCE_REVIEW',
  }

  export enum ExternalState {
    Processing = 'PROCESSING',
    ProcessingException = 'PROCESSING_EXCEPTION',
    MissingExportCompliance = 'MISSING_EXPORT_COMPLIANCE',
    ReadyForBetaTesting = 'READY_FOR_BETA_TESTING',
    InBetaTesting = 'IN_BETA_TESTING',
    Expired = 'EXPIRED',
    ReadyForBetaSubmission = 'READY_FOR_BETA_SUBMISSION',
    InExportComplianceReview = 'IN_EXPORT_COMPLIANCE_REVIEW',
    WaitingForBetaReview = 'WAITING_FOR_BETA_REVIEW',
    InBetaReview = 'IN_BETA_REVIEW',
    BetaRejected = 'BETA_REJECTED',
    BetaApproved = 'BETA_APPROVED',
  }
}
