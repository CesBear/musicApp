import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      return user.email === process.env.ALLOWED_EMAIL
    },
    async session({ session, token }) {
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
