import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { submitSocialToken } from "@/lib/actions/users.action";
import apiAuthSignIn from "@/lib/auth";
import { BASE_URL, DEFAULT_EXPIRATION } from "@/lib/constants";
import { initializeUserLocale } from "@/lib/locale";

export const { handlers, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Partial<Record<"email" | "password", unknown>> | undefined,
      ) {
        if (!credentials) {
          throw new Error("Invalid credentials");
        }
        const user = await apiAuthSignIn(credentials);
        // Ensure the user object contains the required fields
        if (!user || !user.id || !user.email || !user.accessToken) {
          throw new Error("Authentication failed");
        }
        return user;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Works for the deployment model while API_URL is the front url of the reverse proxy
      else if (
        process.env.NODE_ENV === "production" &&
        new URL(url).origin === BASE_URL
      )
        return url;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    jwt({ token, account, user, trigger, session }) {
      // Handle initial sign-in (both credentials and OAuth flows)
      if (user) {
        token.accessToken = user.accessToken as string; // Credentials-based accessToken
        token.id = user.id as string; // User ID from either credentials or OAuth2
        token.user = user; // Full user object for credentials
        token.exp = Math.floor(Date.now() / 1000) + DEFAULT_EXPIRATION;
      } else if (account) {
        // If an account exists (OAuth2 flow)
        token.accessToken = account.access_token ?? null; // Social token from the provider
        token.provider = account.provider ?? null; // e.g., "google"
        token.exp =
          account.expires_at ??
          Math.floor(Date.now() / 1000) + DEFAULT_EXPIRATION;
      }

      // Handle session updates (this is triggered by update() call from client)
      if (trigger === "update" && session) {
        // If the client is updating the user's imageUrl
        if (session.user?.imageUrl) {
          // Ensure token.user exists before spreading
          token.user = {
            ...(token.user || {}),
            imageUrl: session.user.imageUrl,
          };
        }
      }

      // Check if the token is expired
      if (token.exp && Date.now() >= token.exp * 1000) {
        // Clear the token to force re-login
        return { expired: true };
      }

      return token;
    },

    async session({ session, token }) {
      session.provider = token.provider as string; // Add provider for OAuth2

      // Ensure token.user properties are copied to session.user
      // This is important for the imageUrl to be reflected in the session
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
        };
      }

      // Check if token.accessToken is not undefined
      if (token.accessToken !== undefined) {
        session.accessToken = token.accessToken as string;
      } else {
        session.accessToken = session.user.accessToken as string;
      }

      // Social login - Exchange the social token for a backend JWT
      if (token.provider === "google") {
        try {
          const response = await submitSocialToken(
            session.provider,
            session.accessToken,
          );
          session.accessToken = response.jwtToken;
          session.user = {
            ...session.user, // Retain existing attributes in session.user
            ...response.user, // Overwrite or add attributes from response.user
          };
          await initializeUserLocale();
        } catch (error) {
          console.error(
            `Error to get the jwt token from backend ${JSON.stringify(error)}`,
          );
          session.error =
            "Social login token exchange failed: " + (error as any)?.details ||
            "Unknown error";
        }
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Maximum session age in seconds (30 days)
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== "production",
});
