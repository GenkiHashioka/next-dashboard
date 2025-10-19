// Formをインポート
import Form from "@/app/ui/invoices/edit-form";
// Breadcrumbsをインポート
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
// 顧客データを取得する関数をインポート
import { fetchInvoiceById, fetchCustomers } from "@/app/lib/data";
// next/navigationからnotFoundをインポート
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "edit",
};

// propsからidを取得してinvoiceデータを取得
export default async function Page(props: { params: Promise<{ id: string }> }) {
  // paramsからidを取得
  const params = await props.params;
  const id = params.id;
  // idに基づいて請求書データと、顧客データを並行して取得
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);
  // invoiceが存在しない場合は404エラーページを表示
  if (!invoice) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: "Edit Invoice",
            // 動的なルートセグメントに対応
            href: `./dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}
