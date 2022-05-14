const express = require("express");

const router = express.Router();

const httpProxy = require('express-http-proxy');

const fileHandlerProxy = httpProxy("http://localhost:4001");

router.get("/", (req, res, next) => {
    fileHandlerProxy(req, res, next);
})

module.exports = router;