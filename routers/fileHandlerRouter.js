const express = require("express");

const router = express.Router();

const httpProxy = require('express-http-proxy');

const fileHandlerProxy = httpProxy("http://localhost:4001", {
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
        if (srcReq.user) {
            proxyReqOpts.headers["user"] = JSON.stringify(srcReq.user);
        }
        return proxyReqOpts;
    },
});


router.get("/", (req, res, next) => {
    fileHandlerProxy(req, res, next);
})

const auth = require("../middleware/auth");

router.post("/", auth, (req, res, next) => {
    fileHandlerProxy(req, res, next);
})

module.exports = router;