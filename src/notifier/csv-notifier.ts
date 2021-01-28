import { Notifier } from './notifier';
import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';
import { Metric, MetricDevice, MetricIdentifier, MetricPercentile } from '../api/app-metric';
import fs from 'fs';
import csvParse from 'csv-parse/lib/sync';
import csvStringify from 'csv-stringify/lib/sync';
import * as semver from 'semver'

type Items = Record<string, number>

class CSVNotifier implements Notifier {

  private readonly path: string
  private readonly metrics: Record <string, Items> = {}
  private readonly metricUnits: Record <string, string> = {}

  constructor(path: string) {
    this.path = path;
  }

  setUp() {
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path);
    }
  }

  tearDown() {
    for (const file of Object.keys(this.metrics)) {
      this.handle(file, this.metrics[file]);
    }
  }

  async notify(_appVersion: AppVersion) {
    // NOTHING
  }

  async notifyTestFlightBuild(_build: TestFlightBuild) {
    // NOTHING
  }

  async notifyMetric(metric: Metric) {
    const fileName = this.metricFileName(metric);

    const data = this.metrics[fileName] ?? {};
    data[metric.version] = metric.value;

    this.metrics[fileName] = data;
    this.metricUnits[fileName] = metric.unit;
  }

  private async handle(filename: string, metrics: Items) {
    const fullpath = this.path + '/' + filename;

    let record: Record<string, any> = {};
    try {
      const data = fs.readFileSync(fullpath).toString();
      const records = csvParse(data, {
        columns: true,
        skip_empty_lines: true
      });
      if (records.length > 0) {
        record = records[0] as any as Record<string, any>;
        delete record.Unit;
      }
    } catch {
      // File not exists
    }

    for (const version of Object.keys(metrics)) {
      record[version] = metrics[version];
    }

    const columns = Object.keys(record);
    columns.sort((v1: string, v2: string) => semver.lt(v1, v2) ? -1 : 1 );

    columns.unshift('Unit');
    record.Unit = this.metricUnits[filename];

    const str = csvStringify([record], {
      header: true,
      columns
    });
    fs.writeFileSync(fullpath, str);
  }

  private metricFileName(metric: Metric): string {
    return [
      metric.app.bundleId,
      metric.metricIdentifier,
      metric.device,
      metric.percentile,
    ].join('-') + '.csv';
  }
}

export default CSVNotifier;
