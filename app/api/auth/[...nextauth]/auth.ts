import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const DEMO_USERS = {
  hospital_admin: {
    id: "hospital_admin",
    displayName: "张伟",
    email: "zhangwei@hospital.js.cn",
    role: "hospital",
    organizationId: "aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    organizationName: "江苏省人民医院",
    isAdmin: false,
  },
  doctor: {
    id: "doctor",
    displayName: "李医生",
    email: "li@hospital.js.cn",
    role: "doctor",
    organizationId: "aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    organizationName: "江苏省人民医院",
    isAdmin: false,
  },
  researcher: {
    id: "researcher",
    displayName: "王研究员",
    email: "wang@research.js.cn",
    role: "research",
    organizationId: "bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    organizationName: "南京某科研院",
    isAdmin: false,
  },
  regulator: {
    id: "regulator",
    displayName: "赵监管",
    email: "zhao@regulator.js.cn",
    role: "regulator",
    organizationId: "cccc3333-cccc-cccc-cccc-cccccccccccc",
    organizationName: "江苏监管机构",
    isAdmin: false,
  },
  admin: {
    id: "admin",
    displayName: "系统管理员",
    email: "admin@system.cn",
    role: "regulator",
    organizationId: "cccc3333-cccc-cccc-cccc-cccccccccccc",
    organizationName: "江苏监管机构",
    isAdmin: true,
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Demo Login",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const { username } = credentials as { username: string; password: string };
        const user = DEMO_USERS[username as keyof typeof DEMO_USERS];
        if (user) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return user as any;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role;
        token.organizationId = (user as Record<string, unknown>).organizationId;
        token.organizationName = (user as Record<string, unknown>).organizationName;
        token.displayName = (user as Record<string, unknown>).displayName;
        token.isAdmin = (user as Record<string, unknown>).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).organizationName = token.organizationName;
        (session.user as any).displayName = token.displayName;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export async function getServerSession() {
  return auth();
}
