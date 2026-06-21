import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    {},
        password: {},
      },
      async authorize(credentials) {
        if (
          credentials.email    === process.env.ALLOWED_EMAIL &&
          credentials.password === process.env.ALLOWED_PASSWORD
        ) {
          return { id: "1", name: "Estudiante", email: credentials.email as string }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error:  "/login",
  },
})
