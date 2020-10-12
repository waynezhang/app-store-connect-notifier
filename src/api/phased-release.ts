export class PhasedRelease {

  readonly currentDayNumber: number
  readonly percentage: number
  readonly state: PhasedRelease.State
  readonly totalPauseDuration: number
  readonly startDate?: string

  constructor(data: any) {
    this.currentDayNumber = data.currentDayNumber;
    this.percentage = [ 0, 1, 2, 5, 10, 20, 50, 100 ][this.currentDayNumber];
    this.startDate = data.startDate;
    this.totalPauseDuration = data.totalPauseDuration;
    this.state = data.phasedReleaseState
    if (this.state === PhasedRelease.State.Complete) {
      this.percentage = 100;
    }
  }
}

/* tslint:disable:no-namespace */
export namespace PhasedRelease {
/* tslint:enable:no-namespace */

  export enum State {
    Inactive = 'INACTIVE',
    Active = 'ACTIVE',
    Paused = 'PAUSED',
    Complete = 'COMPLETE'
  }
}

