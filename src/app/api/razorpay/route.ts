// const Razorpay = require('razorpay');
// import { NextResponse } from "next/server";


// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export async function POST(req: Request) {
//   const { amount } = await req.json();

//   const options = {
//     amount: Number(amount) * 100,
//     receipt: `donation_rcpt_${Date.now()}`,
//     payment_capture: 1,
//   };

//   try {
//     const order = await razorpay.orders.create(options);
//     return NextResponse.json(order);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: "Razorpay order creation failed" }, { status: 500 });
//   }
// }
export function POST(req: Request) {
  return new Response(JSON.stringify({ message: "Razorpay order creation is currently disabled." }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
