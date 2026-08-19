// "use client";

// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X } from "lucide-react";

// export default function SupportPage() {
//   const [showModal, setShowModal] = useState(false);
//   const [formData, setFormData] = useState({
//     phone: "",
//     amount: "",
//     name: "",
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const loadRazorpayScript = () => {
//     return new Promise((resolve, reject) => {
//       if (document.getElementById("razorpay-sdk")) return resolve(true);
  
//       const script = document.createElement("script");
//       script.id = "razorpay-sdk";
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => resolve(true);
//       script.onerror = () => reject("Razorpay SDK failed to load.");
//       document.body.appendChild(script);
//     });
//   };
  

//   const handleDonate = async () => {
//     const { phone, amount, name } = formData;
  
//     if (!phone || !amount || Number(amount) <= 0) {
//       alert("Please enter a valid phone number and donation amount.");
//       return;
//     }
  
//     const res = await loadRazorpayScript();
//     if (!res) {
//       alert("Failed to load Razorpay SDK. Please try again.");
//       return;
//     }
  
//     const orderRes = await fetch("/api/razorpay", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ amount }),
//     });
  
//     const data = await orderRes.json();
  
//     const options = {
//       key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//       amount: data.amount,
//       currency: "INR",
//       name: "Namo Buddhaya",
//       description: "Support Donation",
//       order_id: data.id,
//       prefill: {
//         name: name || "Supporter",
//         contact: phone,
//       },
//       handler: async function (response: any) {
//         const receiptRes = await fetch("/api/generate-receipt", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             razorpay_payment_id: response.razorpay_payment_id,
//             razorpay_order_id: response.razorpay_order_id,
//             razorpay_signature: response.razorpay_signature,
//             phone,
//             amount,
//             name,
//           }),
//         });
        
//         if (!receiptRes.ok) {
//           alert("Payment successful, but failed to download receipt.");
//           return;
//         }
        
//         const blob = await receiptRes.blob();
//         const url = window.URL.createObjectURL(blob);
        
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `receipt-${Date.now()}.pdf`;
//         a.click();
//         window.URL.revokeObjectURL(url);
        
      
//         const receiptData = await receiptRes.json();
//         if (receiptData?.success) {
//           alert("Payment successful! You can now download your receipt.");
//           window.location.href = `/receipt/${receiptData.receiptId}`;
//         } else {
//           alert("Payment succeeded, but failed to generate receipt. Please contact support.");
//         }
//       },
//       theme: {
//         color: "#facc15",
//       },
//     };
  
//     const razor = new (window as any).Razorpay(options);
//     razor.open();
  
//     setShowModal(false);
//   };
  

//   return (
//     <div className="min-h-[70vh] px-6 pt-12 text-center">
//       <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 text-transparent bg-clip-text mb-4">
//         Support Our Work
//       </h1>
//       <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
//         You can support our mission to share the Dhamma. Every donation goes
//         toward charity, education, and community welfare.
//       </p>
//       <button
//         onClick={() => setShowModal(true)}
//         className="bg-yellow-400 text-black font-semibold text-base px-6 py-3 rounded-lg hover:bg-yellow-300 transition active:scale-95 cursor-pointer"
//       >
//         Make a Donation
//       </button>

//       {/* Modal */}
//       <AnimatePresence>
//         {showModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
//           >
//             <motion.div
//               initial={{ y: 40, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 20, opacity: 0 }}
//               className="relative bg-[#181818] text-white rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-xl"
//             >
//               {/* Close Button */}
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
//               >
//                 <X className="w-5 h-5 cursor-pointer" />
//               </button>

//               <h2 className="text-2xl font-semibold mb-5">Make a Donation</h2>

//               <div className="space-y-4">
//                 <input
//                   name="phone"
//                   type="text"
//                   placeholder="Phone Number (required)"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   className="w-full p-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
//                 />

//                 <div className="relative">
//                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                     ₹
//                   </span>
//                   <input
//                     name="amount"
//                     type="number"
//                     placeholder="Amount (required)"
//                     min={1}
//                     value={formData.amount}
//                     onChange={handleChange}
//                     className="w-full pl-7 pr-3 p-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 placeholder-gray-400 
//                focus:outline-none focus:ring-2 focus:ring-yellow-500 appearance-none [&::-webkit-outer-spin-button]:appearance-none 
//                [&::-webkit-inner-spin-button]:appearance-none"
//                   />
//                 </div>

//                 <input
//                   name="name"
//                   type="text"
//                   placeholder="Name (optional for receipt)"
//                   value={formData.name}
//                   onChange={handleChange}
//                   className="w-full p-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700 placeholder-gray-400 focus:outline-none"
//                 />

//                 <p className="text-red-400 text-sm">
//                   ⚠️ Receipt can only be downloaded once. Please double-check
//                   your details.
//                 </p>
//               </div>

//               <div className="mt-6 flex justify-end">
//                 <button
//                   className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-medium hover:bg-yellow-300 transition active:scale-95 cursor-pointer"
//                   onClick={handleDonate}
//                 >
//                   Proceed to Pay
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
export default function SupportPage() {
  return null;
}