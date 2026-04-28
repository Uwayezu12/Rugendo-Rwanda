import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";

// Route imports
import authRoutes from "./modules/auth/auth.routes.js";
import { getMe } from "./modules/auth/auth.controller.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import userRoutes from "./modules/users/users.routes.js";
import operatorRoutes from "./modules/operators/operators.routes.js";
import busRoutes from "./modules/buses/buses.routes.js";
import driverRoutes from "./modules/drivers/drivers.routes.js";
import routeRoutes from "./modules/routes/routes.routes.js";
import scheduleRoutes from "./modules/schedules/schedules.routes.js";
import bookingRoutes from "./modules/bookings/bookings.routes.js";
import paymentRoutes from "./modules/payments/payments.routes.js";
import boardingRoutes from "./modules/boarding/boarding.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import companyRoutes from "./modules/companies/companies.routes.js";
import companyAdminRoutes from "./modules/companyAdmin/companyAdmin.routes.js";

// Middleware imports
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: env.nodeEnv });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
// Convenience endpoint — same handler as /api/auth/me
app.get("/api/me", authenticate, getMe);
app.use("/api/users", userRoutes);
app.use("/api/operators", operatorRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/boarding", boardingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/company-admin", companyAdminRoutes);

// ── Error handling (must be last) ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
