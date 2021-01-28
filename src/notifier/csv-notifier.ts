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
  }

  private async handle(filename: string, metrics: Items) {
    const fullpath = this.path + '/' + filename;
    let data: string;
    try {
      data = fs.readFileSync(fullpath).toString();
    } catch {
      data = "version,value";
    }

    const records = csvParse(data, {
      columns: true,
      skip_empty_lines: true
    });

    for (const record of records) {
      const version = record.version;
      const newValue = metrics[version];
      if (newValue) {
        record.value = newValue;
        delete metrics[version];
      }
    }

    for (const version of Object.keys(metrics)) {
      records.push({
        version,
        value: metrics[version]
      });
    }

    records.sort((r1: any, r2: any) => semver.lt(r1.version, r2.version) ? -1 : 1);

    const str = csvStringify(records, {
      header: true,
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
