const { Router } = require("express");
const uploadController = require("../controllers/upload.controller");
const upload = require("../middleware/upload.middleware");
const { authenticateJWT } = require("../../auth/middleware/auth.middleware");
const config = require("../../../config/env");

const router = Router();

router.use(authenticateJWT(config.jwtSecret));

router.post("/", upload.array("files", 10), uploadController.uploadFiles);

module.exports = router;
