const yargs = require('yargs');
const fs = require('fs');
const CronJob = require('cron').CronJob;
const Updater = require('./lib/updater');

const config = (() => {
  const content = fs.readFileSync('config.json');
  return JSON.parse(content);
})();

yargs
  .command('schedule', 'Schedule', () => {}, () => {
    console.log('Scheduling...');
    
    const updater = new Updater(config, false);
    const job = new CronJob(config.schedule, async () => {
      console.log('Start to update');
      await updater.update();
      console.log('Update finished');
    });
    job.start();
  })
  .command('migrate', 'Update without notification',() => {}, () => {
    console.log("Migrating...");

    new Updater(config, true).update();
  })
  .command('update', 'Update', () => {}, () => {
    console.log("Updating...");

    new Updater(config, false).update();
  })
  .argv
