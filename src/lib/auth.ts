import { getServerSession, NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";

// Extended AuthUser type that matches your requirements!
type AuthUser = User & {
  superAdminId?: string; // Single SuperAdmin ID
  casinoGroups?: any[]; // Array of CasinoGroup objects
};

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
      ): Promise<AuthUser | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            casinoGroups: true, // ⬅️ All casino groups (many-to-many)
          },
        });

        if (!user) throw new Error("User not found");
        if (!user.active)
          throw new Error("Your account is deactivated. Please contact admin.");

        const passwordValid = await compare(
          credentials.password,
          user.password
        );
        if (!passwordValid) throw new Error("Invalid password");

        // CasinoGroups is already array from include
        const casinoGroups = user.casinoGroups;

        const authUser: AuthUser = {
          id: user.id,
          email: user.email,
          username: user.username || "",
          name: user.name || "",
          role: user.role,
          casinoGroups,
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
        token.casinoGroups = user.casinoGroups;
      }

      if (trigger === "update" && session?.user) {
        token.userName = session.user.userName;
        token.email = session.user.email;
        token.role = user.role;
        token.casinoGroups = user.casinoGroups;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.email) {
        const user = await prisma.user.findUnique({
          where: { email: token.email },
          include: { casinoGroups: true },
        });
        if (user) {
          session.user = {
            ...session.user,
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            role: user.role,
            casinoGroups: user.casinoGroups,
          };
        }
      }
      return session;
    },
  },
  pages: {
    signIn: `/auth/login`,
    signOut: "/auth/login",
  },
};

// Fetch current user with all casinoGroups and ownedSuperAdmins included
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      casinoGroups: true,
    },
  });
  if (!user) return null;

  const casinoGroups = user.casinoGroups ?? [];

  const safeUser = {
    ...user,
    casinoGroups,
  };
  return safeUser;
}
