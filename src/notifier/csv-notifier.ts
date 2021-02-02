import { Notifier } from './notifier';
import { AppVersion } from '../api/app-version';
import { TestFlightBuild } from '../api/testflight-build';
import { Metric, MetricDevice, MetricIdentifier } from '../api/app-metric';
import fs from 'fs';
import csvParse from 'csv-parse/lib/sync';
import csvStringify from 'csv-stringify/lib/sync';
import * as semver from 'semver'

type FileName = string
type Version = string
type RowType = string
type Column = Record<Version, number>
type Row = Record<RowType, Column>

class CSVNotifier implements Notifier {


  private readonly path: string
  private readonly metrics: Record <FileName, Row> = {}
  private readonly metricBreakdowns: Record <FileName, Row> = {}

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

    for (const file of Object.keys(this.metricBreakdowns)) {
      this.handle(file, this.metricBreakdowns[file]);
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
    const version = metric.version;
    const value = metric.value;

    const row = this.metrics[fileName] ?? {};
    const column = row[metric.unit] ?? {};

    column[version] = value;
    row[metric.unit] = column;

    this.metrics[fileName] = row;

    const breakdownFileName = this.metricFileNameForBreakdown(metric);
    if (breakdownFileName && metric.breakdown) {
      const totalBase = Object.values(metric.breakdown).reduce((n, val) => n + val, 0);

      const breakdownRow = this.metricBreakdowns[breakdownFileName] ?? {};

      for (const label of Object.keys(metric.breakdown)) {
        const breakdownColumn = breakdownRow[label] ?? {};

        breakdownColumn[version] = metric.breakdown[label] / totalBase * value;
        breakdownRow[label] = breakdownColumn;
      }
      this.metricBreakdowns[breakdownFileName] = breakdownRow;
    }
  }

  private async handle(filename: string, metrics: Row) {
    const fullpath = this.path + '/' + filename;

    const versions = new Set<string>();
    const records: Record<string, any> = {};
    try {
      const data = fs.readFileSync(fullpath).toString();
      const parsed = csvParse(data, {
        columns: true,
        skip_empty_lines: true
      });
      for (const row of parsed) {
        const type = row.type;
        if (type) {
          delete row.type;
          records[type] = row;

          Object.keys(row).forEach((ver) => versions.add(ver));
        }
      }
    } catch {
      // File not exists
    }

    for (const type of Object.keys(metrics)) {
      for (const version of Object.keys(metrics[type])) {
        versions.add(version);
        records[type] = records[type] ?? {};
        records[type][version] = metrics[type][version];
      }
    }

    const columns = Array.from(versions.values());
    columns.sort((v1: string, v2: string) => semver.lt(v1, v2) ? -1 : 1 );
    columns.unshift('type');

    const rows = [];
    for (const type of Object.keys(records).sort()) {
      const row = records[type];
      if ((Object.values(row) as number[]).reduce((n, val) => n + val, 0) === 0) {
        continue;
      }
      for (const version of Object.keys(row)) {
        row[version] = (+row[version]).toFixed(3);
      }
      row.type = type;
      rows.push(row);
    }

    const str = csvStringify(rows, {
      header: true,
      columns
    });
    fs.writeFileSync(fullpath, str);
  }

  private metricFileName(metric: Metric): FileName {
    return [
      metric.app.bundleId,
      metric.metricIdentifier,
      metric.device,
      metric.percentile,
    ].join('-') + '.csv';
  }

  private metricFileNameForBreakdown(metric: Metric): FileName | null {
    if (metric.breakdown) {
      return [
        metric.app.bundleId,
        metric.metricIdentifier,
        metric.device,
        metric.percentile,
        'breakdown'
      ].join('-') + '.csv';
    } else {
      return null;
    }
  }
}

export default CSVNotifier;
