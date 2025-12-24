
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ReactNode } from "react";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
