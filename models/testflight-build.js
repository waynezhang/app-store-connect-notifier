const { formatState } = require('../util/string-utils');


const StateNeutral = 'neutral';
const StateFailed = 'failed';
const StateSucceed = 'succeed';

function checkState(state, neutralStates, failedStates) {
  if (neutralStates.indexOf(state) != -1) {
    return StateNeutral;
  }
  if (failedStates.indexOf(state) != -1) {
    return StateFailed;
  }

  return StateSucceed;
}

class TestFlightBuild {
  constructor(app, appVersion, response, testState) {
    this.app = app;
    this.appVersion = appVersion;
    this.version = response.attributes.version;
    this.processingState = response.attributes.processingState;
    this.processingStateString = formatState(this.processingState);
    this.iconUrl = response.attributes.iconAssetToken.templateUrl
                      .replace('{w}', '512')
                      .replace('{h}', '512')
                      .replace('{f}', 'png');
    this.internalBuildState = testState.attributes.internalBuildState;
    this.internalBuildStateString = formatState(testState.attributes.internalBuildState);
    this.externalBuildState = testState.attributes.externalBuildState;
    this.externalBuildStateString = formatState(testState.attributes.externalBuildState);
  }

  isInNeutralState() {
    return this.state() == StateNeutral;
  }

  isInFailedState() {
    return this.state() == StateFailed;
  }
  
  state() {
    /*
      processingState:
        PROCESSING, FAILED, INVALID, VALID
    */
    let state = checkState(
      this.processingState,
      [
        'PROCESSING',
      ],
      [
        'FAILED',
        'INVALID',
      ]
    );
    if (state != StateSucceed) {
      return state;
    }

    /*
      internalBuildState:
        PROCESSING
        PROCESSING_EXCEPTION
        MISSING_EXPORT_COMPLIANCE
        READY_FOR_BETA_TESTING
        IN_BETA_TESTING
        EXPIRED
        IN_EXPORT_COMPLIANCE_REVIEW
    */

    state = checkState(
      this.internalBuildState,
      [
        'PROCESSING',
        'IN_EXPORT_COMPLIANCE_REVIEW',
        // 'READY_FOR_BETA_TESTING',
      ],
      [
        'PROCESSING_EXCEPTION',
        'MISSING_EXPORT_COMPLIANCE',
        'EXPIRED',
      ]
    );
    if (state != StateSucceed) {
      return state;
    }

    /*
      externalBuildState:
        PROCESSING
        PROCESSING_EXCEPTION
        MISSING_EXPORT_COMPLIANCE
        READY_FOR_BETA_TESTING
        IN_BETA_TESTING
        EXPIRED
        READY_FOR_BETA_SUBMISSION
        IN_EXPORT_COMPLIANCE_REVIEW
        WAITING_FOR_BETA_REVIEW
        IN_BETA_REVIEW
        BETA_REJECTED
        BETA_APPROVED
    */
    state = checkState(
      this.externalBuildState,
      [
        'PROCESSING',
        'WAITING_FOR_BETA_REVIEW',
        'IN_BETA_REVIEW',
        'IN_EXPORT_COMPLIANCE_REVIEW',
        // 'READY_FOR_BETA_TESTING',
        // 'READY_FOR_BETA_SUBMISSION',
      ],
      [
        'PROCESSING_EXCEPTION',
        'MISSING_EXPORT_COMPLIANCE',
        'EXPIRED',
        'BETA_REJECTED',
      ]
    );
    return state;
  }

  buildKey() {
    return `${this.app.bundleId}-${this.appVersion}-${this.version}`;
  }
  
  buildState() {
    return [ this.processingState, this.internalBuildState, this.externalBuildState ].join('-');
  }
}

module.exports = TestFlightBuild;
