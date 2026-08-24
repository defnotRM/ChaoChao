import { redirect } from "next/navigation";

export default function AddProductRedirect() {
  redirect("/lender/postproduct");
}
