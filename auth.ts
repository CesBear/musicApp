import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getUserByEmail, verifyPassword } from "@/lib/users"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email:    {},
        password: {},
      },
      async authorize(credentials) {
        const email    = credentials.email as string
        const password = credentials.password as string

        // Legacy single-account login (original .env.local credentials)
        if (email === process.env.ALLOWED_EMAIL && password === process.env.ALLOWED_PASSWORD) {
          return { id: "1", name: "Estudiante", email }
        }

        // Registered users (created via /register with an invite code)
        const user = await getUserByEmail(email)
        if (user && await verifyPassword(user, password)) {
          return { id: user.id, name: user.name, email: user.email }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
