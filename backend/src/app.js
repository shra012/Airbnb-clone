const path = require("path");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { env } = require("./config/env");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const swaggerDocument = YAML.load(path.join(__dirname, "docs", "openapi.yaml"));

const corsOptions = {
  origin: env.corsOrigins.length ? env.corsOrigins : true,
  credentials: true,
};

app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use(
  session({
    name: "airbnb.sid",
    secret: env.sessionSecret,
    genid: () => env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.sessionCookieSecure,
      sameSite: env.sessionCookieSameSite,
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
