// このオブジェクトには認証に関する設定が含まれています
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // カスタムのサインイン、サインアウト、エラーページのルートを指定する。
  pages: {
    signIn: "/login",
  },
  // ルートを保護するロジックを追加する。これにより、認証されていないユーザーが特定のページにアクセスするのを防ぐことができます。
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // サインインページにリダイレクト
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [], // 認証プロバイダーをここに追加します
} satisfies NextAuthConfig;
