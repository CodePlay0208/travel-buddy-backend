const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const {
    createTripHandler, 
    getTripByIdHandler, 
    getTripsByUserHandler, 
    editTripHandler,
    deleteTripHandler} = require("../controller/TripsDataController");
const router = express.Router();

router.route("/createTrip").post(protect, createTripHandler);
router.route("/getTripById/:tripId").get(getTripByIdHandler);
router.route("/getTripsByUser").get(protect, getTripsByUserHandler);
router.route("/editTrip/:tripId").put(protect, editTripHandler);
router.route("/deleteTrip/:tripId").delete(protect, deleteTripHandler);

module.exports = router;