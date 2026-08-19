import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import ReceiptDocument from "../../../components/receipt-pdf";
import React from "react";

export async function POST(req: Request) {
  const body = await req.json();

  const receipt = {
    id: `R-${Date.now()}`,
    name: body.name,
    phone: body.phone,
    amount: body.amount,
    paymentId: body.razorpay_payment_id,
    orderId: body.razorpay_order_id,
  };

  console.log("receipt data:",receipt)

  const file = await pdf(
    React.createElement(ReceiptDocument, { receipt })
  ).toBuffer();
  
  //@ts-ignore
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=receipt-${receipt.id}.pdf`,
    },
  });
}
