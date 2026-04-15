import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.name  = profile.name;
        token.email = profile.email;
        token.image = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.name  = token.name;
      session.user.email = token.email;
      session.user.image = token.image;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After login always go to the dashboard
      if (url === baseUrl || url === `${baseUrl}/login`) {
        return `${baseUrl}/app`;
      }
      return url.startsWith(baseUrl) ? url : `${baseUrl}/app`;
    },
  },
});

export { handler as GET, handler as POST };
