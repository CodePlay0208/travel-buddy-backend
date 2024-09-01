const express = require("express");
const {protect} = require("../middleware/AuthMiddleware");
const {
    createTripHandler, 
    getTripByIdHandler, 
    getTripsByUserHandler, 
    editTripHandler,
    deleteTripHandler} = require("../controller/TripsDataController");
const router = express.Router();
const multer = require('multer');
const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });

router.route("/createTrip").post(protect, uploadMiddleware.array("destinationImages"), createTripHandler);
router.route("/getTripById/:tripId").get(getTripByIdHandler);
router.route("/getTripsByUser").get(protect, getTripsByUserHandler);
router.route("/editTrip/:tripId").put(protect, uploadMiddleware.array("destinationImages"), editTripHandler);
router.route("/deleteTrip/:tripId").delete(protect, deleteTripHandler);

module.exports = router;