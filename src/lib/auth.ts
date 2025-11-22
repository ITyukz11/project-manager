import { getServerSession, NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<"username" | "password", string> | undefined
      ): Promise<User | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) throw new Error("User not found");
        if (!user.active)
          throw new Error("Your account is deactivated. Please contact admin.");

        const passwordValid = await compare(
          credentials.password,
          user.password
        );
        if (!passwordValid) throw new Error("Invalid password");

        // Explicitly cast return object as User
        const authUser: User = {
          id: user.id,
          email: user.email,
          username: user.username || "",
          name: user.name || "",
          role: user.role,
        };

        return authUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.name = user.name;
        token.role = user.role;
      }

      // 👇 Allow `update()` to work dynamically
      if (trigger === "update" && session?.user) {
        token.userName = session.user.userName;
        token.email = session.user.email;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email,
          username: token.username,
          name: token.name,
          role: token.role,
        };
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  // You can also use id if the session includes it!
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    // or:   { id: session.user.id }
  });
  if (!user) return null;
  // Optionally remove sensitive info
  const { ...safeUser } = user;
  return safeUser;
}
