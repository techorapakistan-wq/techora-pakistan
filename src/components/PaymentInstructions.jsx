import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
const fallback={easypaisa_number:"03317047951",easypaisa_name:"Muhammad Hamdan Amir",jazzcash_number:"03317047951",jazzcash_name:"Muhammad Hamdan Amir",bank_name:"Meezan Bank",bank_account:"00300115864047",bank_account_name:"Muhammad Hamdan Amir"};
export default function PaymentInstructions() {
 const [settings,setSettings]=useState(fallback);
 useEffect(()=>{if(!supabase)return; const load=()=>supabase.from("store_settings").select("*").eq("id",true).single().then(({data})=>{if(data)setSettings(data)}); load(); const timer=window.setInterval(load,15000); return()=>window.clearInterval(timer)},[]);
 return <div className="advance-instructions"><p><strong>Advance payment required.</strong> Pay through one method below, then send the payment screenshot on WhatsApp for manual approval.</p><div><strong>EasyPaisa</strong><span>{settings.easypaisa_number} · {settings.easypaisa_name}</span></div><div><strong>JazzCash</strong><span>{settings.jazzcash_number} · {settings.jazzcash_name}</span></div><div><strong>{settings.bank_name} debit card / bank transfer</strong><span>{settings.bank_account} · {settings.bank_account_name}</span></div><a href="https://wa.me/92323472378" target="_blank" rel="noreferrer">Send screenshot on WhatsApp →</a></div>;
}