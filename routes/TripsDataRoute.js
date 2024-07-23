const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const {
    createTripHandler, 
    getTripsWithFiltersHandler, 
    getTripByIdHandler, 
    getTripsByUserHandler, 
    editTripHandler,
    deleteTripHandler} = require("../controller/TripsDataController");
const router = express.Router();

router.route("/createTrip").post(protect, createTripHandler);
router.route("/getTripsWithFilters").get(getTripsWithFiltersHandler);
router.route("/getTripById/:id").post(getTripByIdHandler);
router.route("/getTripsByUser").get(protect, getTripsByUserHandler);
router.route("/editTrip/:tripId").put(protect, editTripHandler);
router.route("/deleteTrip/:id").delete(protect, deleteTripHandler);

module.exports = router;