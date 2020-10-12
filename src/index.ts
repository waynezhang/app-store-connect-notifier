import yargs from 'yargs';
import { CronJob } from 'cron';
import { Updater } from './lib/updater';
import * as config from '../config.json';

async function getUpdater(updateConfig: any, silence: boolean): Promise<Updater> {
  const updater = new Updater(updateConfig, silence);
  await updater.initialize();
  return updater;
}

async function schedule() {
  console.log('Scheduling...');

  const updater = await getUpdater(config, false);
  const job = new CronJob(config.schedule, async () => {
    console.log('Start to update');
    await updater.update();
    console.log('Update finished');
  });
  job.start();
}

async function update() {
  console.log("Updating...");
  (await getUpdater(config, false)).update();
}

async function migrate() {
  console.log("Migrating...");
  (await getUpdater(config, true)).update();
}

const _ = yargs
  .command('schedule', 'Schedule', schedule)
  .command('migrate', 'Update without notification', migrate)
  .command('update', 'Update', update)
  .argv;
