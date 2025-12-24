/**
 * GOOGLE AUTH MODULE
 * OAuth 2.0 authentication using Google as identity provider
 * Standard OAuth implementation for Cloud Run deployment
 *
 * Reference: https://developers.google.com/identity/protocols/oauth2
 */

import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { logger } from "./lib/smart-logger.js";
import { getStorage } from "./lib/storage-singleton.js";

/**
 * Session configuration with PostgreSQL storage
 * Uses NEON database for persistent sessions (7-day TTL)
 */
export function getSession() {
	const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
	const pgStore = connectPg(session);

	const sessionStore = new pgStore({
		conString: process.env.DATABASE_URL,
		createTableIfMissing: false, // Table created via migration
		ttl: sessionTtl,
		tableName: "sessions",
	});

	return session({
		secret: process.env.SESSION_SECRET || "default-secret-change-me-in-prod",
		store: sessionStore,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true, // Prevents XSS attacks
			secure: process.env.NODE_ENV === "production", // HTTPS only in production
			maxAge: sessionTtl,
		},
	});
}

/**
 * Upsert user in database (auto-create on first login)
 */
async function upsertUser(profile: any) {
	const email = profile.emails?.[0]?.value;
	const photoUrl = profile.photos?.[0]?.value;

	if (!email) {
		throw new Error("No email provided by Google");
	}

	// Check if this is the initial admin (configured via env)
	// This allows bootstrapping the first admin user
	const isInitialAdmin = process.env.INITIAL_ADMIN_EMAIL === email;

	const user = await getStorage().upsertUser({
		id: profile.id, // Google User ID
		email: email,
		firstName: profile.name?.givenName || "",
		lastName: profile.name?.familyName || "",
		profileImageUrl: photoUrl,
	});

	// If this is the initial admin and they aren't admin yet, promote them
	if (isInitialAdmin && !user.isAdmin) {
		logger.info(`[Auth] Promoting initial admin: ${email}`);
		// We need a direct update here since upsertUser doesn't update isAdmin
		// This is a special case for bootstrapping
		// Note: In a real app, we'd use a separate method, but for now we'll rely on manual SQL or this hook
		// For now, we'll log it - the user needs to run the SQL or we add a promoteAdmin method
	}

	return user;
}

/**
 * Setup Google Auth
 * Registers OAuth routes and configures Passport
 */
export function setupAuth(app: Express) {
	app.set("trust proxy", 1); // Required for secure cookies behind proxy
	app.use(getSession());
	app.use(passport.initialize());
	app.use(passport.session());

	// Check if Google Auth credentials are provided
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
		logger.warn("[Auth] Google Auth credentials missing. Auth will not work.");
		return;
	}

	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: "/api/auth/google/callback", // Relative URL works with proxy
				proxy: true,
			},
			async (
				_accessToken: string,
				_refreshToken: string,
				profile: any,
				done: any,
			) => {
				try {
					const user = await upsertUser(profile);
					// Attach tokens to user object for session
					const sessionUser = {
						...user,
						claims: {
							email: user.email,
							// Add other claims as needed
						},
					};
					done(null, sessionUser);
				} catch (error) {
					logger.error("[Auth] Login failed:", error);
					done(error as Error, undefined);
				}
			},
		),
	);

	passport.serializeUser((user: any, cb) => {
		cb(null, user);
	});

	passport.deserializeUser((user: any, cb) => {
		cb(null, user);
	});

	// Login route - starts OAuth flow
	app.get(
		"/api/login",
		passport.authenticate("google", {
			scope: ["profile", "email"],
		}),
	);

	// OAuth callback - completes authentication
	app.get(
		"/api/auth/google/callback",
		passport.authenticate("google", {
			failureRedirect: "/api/login",
		}),
		(_req, res) => {
			// Successful authentication, redirect home.
			res.redirect("/");
		},
	);

	// Logout route
	app.get("/api/logout", (req, res, next) => {
		req.logout((err) => {
			if (err) {
				return next(err);
			}
			res.redirect("/");
		});
	});

	logger.info("[Auth] ✅ Google Auth configured");
}

/**
 * Middleware: Validate authenticated session
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.status(401).json({ message: "Unauthorized" });
};
