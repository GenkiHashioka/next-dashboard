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
  customerId: z.string({ invalid_type_error: "Please select a customer" }), // customerIdは文字列型 string以外が渡された場合はエラーメッセージを表示
  // その型を数値に強制変換
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }), // 金額は0より大きい数値
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status",
  }), // statusは"pending"か"paid"のいずれか
  date: z.string(),
});
// 作成用のスキーマをidとdateを除いて定義
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// State型を定義
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// formDataを受け入れる非同期関数
export async function createInvoice(prevState: State, formData: FormData) {
  // フォームデータをスキーマに基づいて解析,検証
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }
  // 検証に成功した場合、各フィールドの値を取得
  const { customerId, amount, status } = validatedFields.data;
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

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // 検証に失敗した場合、エラーメッセージを返す
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }
  // フォームデータをスキーマに基づいて解析,検証
  const { customerId, amount, status } = validatedFields.data;

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
