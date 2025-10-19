"use server"; // サーバーサイドで実行されることを明示
// 型検証のためのライブラリをインポート
import { z } from "zod";
// revaldatePathの型をインポート
import { revalidatePath } from "next/cache";
// PostgreSQLクライアントをインポート
import postgres from "postgres";
// ページリダイレクト用の関数をインポート
import { redirect } from "next/navigation";

// データベース接続の設定
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// フォームデータのスキーマを定義
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  // その型を数値に強制変換
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});
// 作成用のスキーマをidとdateを除いて定義
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// formDataを受け入れる非同期関数
export async function createInvoice(formData: FormData) {
  // フォームデータをスキーマに基づいて解析,検証
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // javascriptの浮動小数点エラーを防ぐために、金額をセント単位で保存
  const amountInCents = amount * 100;
  // 請求書の作成日を取得 YYYY-MM-DD形式
  const date = new Date().toISOString().split("T")[0];
  // データベースにデータを挿入する処理をここに追加

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch (error) {
    console.error(error);
    return {
      message: "Database error: Failed to create invoice",
    };
  }

  // データベースを更新した後に、ユーザーのブラウザのキャッシュを削除
  revalidatePath("/dashboard/invoices");
  // 請求書一覧ページにリダイレクト
  redirect("/dashboard/invoices");
}

// 更新用のスキーマをidとdateを除いて定義
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  // フォームデータをスキーマに基づいて解析,検証
  const { customerId, amount, status } = UpdateInvoice.parse({
    // formDataから値を取得
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // javascriptの浮動小数点エラーを防ぐために、金額をセント単位で保存
  const amountInCents = amount * 100;

  // データベースの請求書データを更新
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId},
          amount = ${amountInCents},
          status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error(error);
    return { message: "Database error: Failed to update invoice" };
  }

  // データベースを更新した後に、ユーザーのブラウザのキャッシュを削除
  revalidatePath("/dashboard/invoices");
  // 請求書一覧ページにリダイレクト
  redirect("/dashboard/invoices");
}

// 請求書削除用のサーバーアクション
export async function deleteInvoice(id: string) {
  throw new Error("Failed to delete invoice");
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  // データベースを更新した後に、ユーザーのブラウザのキャッシュを削除
  revalidatePath("/dashboard/invoices");
}
