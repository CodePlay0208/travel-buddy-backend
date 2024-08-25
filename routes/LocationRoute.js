const express = require("express");
const {getLocationByNameHandler} = require("../controller/LocationController");
const router = express.Router();

router.route("/getLocationByName/:inputLocation").get(getLocationByNameHandler);


module.exports = router;