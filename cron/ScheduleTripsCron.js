const cron = require('node-cron');
const { generateTripInstancesFor3Months } = require("../cron/ScheduleTripsFunction");
const logger = require("../logger");


cron.schedule('0 1 * * *', async () => {
   const date = new Date();
  logger.info(`Running Cron Job for scheduling trips at date=${date}`);
  try {
    await generateTripInstancesFor3Months();
  } catch (error) {
    console.error(`Error running cron job generating instancesm,error=${error}`);
  }
});
