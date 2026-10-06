import easypaisaLogo from "../assets/easypaisa.png";

const fallback={easypaisa_number:"03234724373",easypaisa_name:"Muhammad Usama",jazzcash_number:"03234724373",jazzcash_name:"Muhammad Usama",bank_name:"HBL",bank_account:"06147900940851",bank_account_name:"Muhammad Usama"};

export default function PaymentInstructions({settings=fallback,websiteSettings={},amountDue}) {
  const visibility=websiteSettings.paymentVisibility||{};
  const rows=[
    visibility.easypaisa!==false&&{name:"EasyPaisa",number:settings.easypaisa_number,title:settings.easypaisa_name,logo:easypaisaLogo},
    visibility.sadapay!==false&&{name:"SadaPay",number:settings.jazzcash_number,title:settings.jazzcash_name,logo:"/payment-assets/sadapay.png"},
    visibility.bank_transfer!==false&&{name:(settings.bank_name||"Bank")+" transfer",number:settings.bank_account,title:settings.bank_account_name,logo:String(settings.bank_name||"").toLowerCase().includes("hbl")?"/payment-assets/hbl-konnect.png":""},
    ...(websiteSettings.paymentMethods||[]).filter(method=>method.enabled!==false).map(method=>({name:method.name,number:method.accountNumber,title:method.accountName,logo:method.logoUrl||""})),
  ].filter(Boolean);
  const policy=websiteSettings.paymentPolicy||"full";
  const policyText=policy==="products"?"Pay the product amount now. Delivery charges are paid when the order arrives.":policy==="delivery"?"Pay the delivery charges now. The product balance is paid when the order arrives.":"Pay the full order total shown above now.";
  return <div className="advance-instructions"><p><strong>{Number(amountDue)===0?"No advance payment is due now.":policyText}</strong>{Number(amountDue)>0?" After placing your order, upload a screenshot of the amount due in My Orders so the team can verify it.":" The remaining order balance is collected on arrival."}</p>{rows.length>0?<div className="payment-instruction-methods">{rows.map((method,index)=><div className="payment-instruction-method" key={method.name+index}>{method.logo?<img src={method.logo} alt={method.name+" logo"}/>:<span className="payment-option-icon">{method.name.slice(0,1)}</span>}<span><strong>{method.name}</strong><small>{method.number||"Payment details not added yet"}{method.title?" · "+method.title:""}</small></span></div>)}</div>:<p className="payment-proof-reminder">No payment methods are enabled. Contact Techora before placing the order.</p>}{Number(amountDue)>0&&<span className="payment-proof-reminder">Order status stays pending until the payment screenshot is checked by Techora.</span>}</div>;
}
