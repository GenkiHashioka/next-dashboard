"use client";
// useEffectをインポート
import { useEffect } from "react";

// エラーページのコンポーネント
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // コンポーネントがマウントされたときにエラーメッセージをコンソールに表示
  useEffect(() => {
    // エラーメッセージをコンソールに表示
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center">Something went wrong!</h2>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={
          // 請求書を再読み込みして復旧を試みる
          () => reset()
        }
      >
        Try again
      </button>
    </main>
  );
}
