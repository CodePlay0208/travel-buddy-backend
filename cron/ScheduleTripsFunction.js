const baseTripRepository = require("../repositories/BaseTripRepository");
const tripInstanceRepository = require("../repositories/TripInstanceRepository");
const userTripsRepository = require("../repositories/UserTripsRepository.js");
const { v4: uuidv4 } = require("uuid");
const logger = require("../logger");

const weekdayNameToIndex = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

async function getAllFutureDatesMatchingWeekdays(start, end, weekdays) {
  const matchingDates = [];

  const weekdayIndices = weekdays.map((day) => weekdayNameToIndex[day]);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayIndex = d.getDay();
    if (weekdayIndices.includes(dayIndex)) {
      matchingDates.push(new Date(d));
    }
  }

  return matchingDates;
}

async function generateTripInstancesFor3Months() {
  try {
    logger.info(`Generating Trip Instances`);
    const baseTrips = await baseTripRepository.findTripsWithQuery(
      {
        scheduledWeekdays: { $exists: true, $ne: [] },
      },
      10000,
      0
    );

    const today = new Date();
    const endDateLimit = new Date();
    endDateLimit.setMonth(today.getMonth() + parseInt(process.env.ROLLING_WINDOW_FOR_SCHEDULED_TRIPS));

    for (const baseTrip of baseTrips) {
      const { scheduledWeekdays, duration, baseTripId } = baseTrip;
      const matchingDates = await getAllFutureDatesMatchingWeekdays(
        today,
        endDateLimit,
        scheduledWeekdays
      );

      if (matchingDates.length === 0) continue;

      const existingInstances = await tripInstanceRepository.findTripsWithQuery(
        {
          baseTripId,
          startDate: { $gte: today, $lte: endDateLimit },
        },
        10000,
        0
      );

      const existingStartDates = new Set(
        existingInstances.map(
          (doc) => doc.startDate.toISOString().split("T")[0]
        )
      );

      const newInstances = [];

      for (const date of matchingDates) {
        const startDateStr = date.toISOString().split("T")[0];
        if (existingStartDates.has(startDateStr)) continue;

        const instanceEndDate = new Date(date);
        instanceEndDate.setDate(instanceEndDate.getDate() + duration);

        newInstances.push({
          destination: baseTrip.destination,
          startLocation: baseTrip.startLocation,
          startDate: new Date(date),
          endDate: instanceEndDate,
          hostId: baseTrip.hostId,
          tripInstanceId: uuidv4(),
          baseTripId,
        });
      }

      if (newInstances.length > 0) {
        await tripInstanceRepository.createInstances(newInstances);
        logger.info(
          `Created ${newInstances.length} trip instance(s) for baseTripId: ${baseTripId}, newInstances=${newInstances}`
        );
        newInstances.forEach(async (tripInstance) => {
          const userTrips = await userTripsRepository.updateUserTrips(
            baseTrip.hostId,
            tripInstance.tripInstanceId,
            true,
            true,
            false,
            false
          );
        });
      }

    }
  } catch (error) {
    logger.error(`Error occurred while scheduling trips, error=${error}`);
    throw error;
  }
}

module.exports = {
  generateTripInstancesFor3Months,
};
