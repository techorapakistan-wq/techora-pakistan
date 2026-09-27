import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
const fallback={easypaisa_number:"03234724373",easypaisa_name:"Muhammad Usama",jazzcash_number:"03234724373",jazzcash_name:"Muhammad Usama",bank_name:"HBL",bank_account:"06147900940851",bank_account_name:"Muhammad Usama"};
const replaceLegacyDetails=(data={})=>({
 ...fallback,...data,
 easypaisa_number:data.easypaisa_number==="03317047951"?fallback.easypaisa_number:(data.easypaisa_number||fallback.easypaisa_number),
 easypaisa_name:data.easypaisa_name==="Muhammad Hamdan Amir"?fallback.easypaisa_name:(data.easypaisa_name||fallback.easypaisa_name),
 jazzcash_number:data.jazzcash_number==="03317047951"?fallback.jazzcash_number:(data.jazzcash_number||fallback.jazzcash_number),
 jazzcash_name:data.jazzcash_name==="Muhammad Hamdan Amir"?fallback.jazzcash_name:(data.jazzcash_name||fallback.jazzcash_name),
 bank_name:data.bank_name==="Meezan Bank"?fallback.bank_name:(data.bank_name||fallback.bank_name),
 bank_account:data.bank_account==="00300115864047"?fallback.bank_account:(data.bank_account||fallback.bank_account),
 bank_account_name:data.bank_account_name==="Muhammad Hamdan Amir"?fallback.bank_account_name:(data.bank_account_name||fallback.bank_account_name)
});
export default function PaymentInstructions() {
 const [settings,setSettings]=useState(fallback);
 useEffect(()=>{if(!supabase)return; const load=()=>supabase.from("store_settings").select("*").eq("id",true).single().then(({data})=>{if(data)setSettings(replaceLegacyDetails(data))}); load(); const timer=window.setInterval(load,15000); return()=>window.clearInterval(timer)},[]);
 return <div className="advance-instructions"><p><strong>Advance payment required.</strong> Pay through one method below, then send the payment screenshot on WhatsApp for manual approval.</p><div><strong>EasyPaisa</strong><span>{settings.easypaisa_number} · {settings.easypaisa_name}</span></div><div><strong>SadaPay</strong><span>{settings.jazzcash_number} · {settings.jazzcash_name}</span></div><div><strong>{settings.bank_name} bank transfer</strong><span>{settings.bank_account} · {settings.bank_account_name}</span></div><a href="https://wa.me/923229701332?text=Hi%20Techora%2C%20I%20have%20sent%20the%20advance%20payment%20screenshot%20for%20my%20order." target="_blank" rel="noreferrer">Send screenshot on WhatsApp →</a></div>;
}
