import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { defaultWebsiteSettings, normalizeWebsiteSettings } from "../data/siteSettings";

const emptyPromo={code:"",discountType:"percent",value:"",expiresAt:""};
const emptyPaymentMethod={name:"",accountName:"",accountNumber:""};
const makeId=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const filePath=(file,folder)=>folder+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");

export default function WebsiteSettingsAdmin({ notice }) {
  const [form, setForm] = useState(defaultWebsiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(-1);
  const [newPromo,setNewPromo]=useState(emptyPromo);
  const [newMethod,setNewMethod]=useState(emptyPaymentMethod);
  const [methodLogo,setMethodLogo]=useState(null);
  const [addingMethod,setAddingMethod]=useState(false);

  useEffect(() => {
    let active = true;
    supabase.from("store_settings").select("website_config").eq("id", true).single().then(({ data, error }) => {
      if (!active) return;
      if (data?.website_config) setForm(normalizeWebsiteSettings(data.website_config));
      if (error) notice(error.message);
      setLoading(false);
    });
    return () => { active = false; };
  }, [notice]);

  const updateVideo = (index, key, value) => setForm((current) => ({
    ...current,
    videos: current.videos.map((video, videoIndex) => videoIndex === index ? { ...video, [key]: value } : video),
  }));

  const addVideo = () => setForm((current) => ({
    ...current,
    videos: [...current.videos, { enabled: true, title: "", description: "", url: "", poster: "", sourceLabel: "", sourceUrl: "" }],
  }));

  const removeVideo = async (index) => {
    const video=form.videos[index];
    setForm((current) => ({ ...current, videos: current.videos.filter((_, videoIndex) => videoIndex !== index) }));
    if(video?.storagePath) await supabase.storage.from("store-media").remove([video.storagePath]);
  };

  const uploadVideo = async (index,file) => {
    if(!file)return;
    const extension=file.name.split(".").pop()?.toLowerCase();
    const mediaType=file.type||({mp4:"video/mp4",webm:"video/webm",ogg:"video/ogg",mov:"video/quicktime"}[extension]||"");
    if(!mediaType.startsWith("video/")){notice("Choose a video file from your gallery.");return;}
    if(file.size>100*1024*1024){notice("Video files must be 100 MB or smaller.");return;}
    setUploadingVideo(index);
    const path=filePath(file,"homepage-videos");
    const {error}=await supabase.storage.from("store-media").upload(path,file,{upsert:false,contentType:mediaType,cacheControl:"3600"});
    if(error){notice(error.message);setUploadingVideo(-1);return;}
    const url=supabase.storage.from("store-media").getPublicUrl(path).data.publicUrl;
    setForm(current=>({...current,videos:current.videos.map((video,videoIndex)=>videoIndex===index?{...video,url,storagePath:path,mediaType:"upload"}:video)}));
    notice("Video uploaded. Save website settings to publish it.");
    setUploadingVideo(-1);
  };

  const addPromo=(event)=>{
    event.preventDefault();
    const code=newPromo.code.trim().toUpperCase();
    const value=Number(newPromo.value);
    if(!code||value<=0||(newPromo.discountType==="percent"&&value>100)){notice("Enter a valid promo code and discount.");return;}
    if(form.promotions.some(promo=>String(promo.code).toUpperCase()===code)){notice("That promo code already exists.");return;}
    setForm(current=>({...current,promotions:[...current.promotions,{id:makeId(),code,discountType:newPromo.discountType,value,expiresAt:newPromo.expiresAt||"",active:true}]}));
    setNewPromo(emptyPromo);
  };

  const addPaymentMethod=async(event)=>{
    event.preventDefault();
    if(!newMethod.name.trim()||!newMethod.accountName.trim()||!newMethod.accountNumber.trim()){notice("Add the payment name, account title, and account number.");return;}
    setAddingMethod(true);
    let logoUrl="";
    if(methodLogo){
      const extension=methodLogo.name.split(".").pop()?.toLowerCase();
      const imageType=methodLogo.type||({jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"}[extension]||"");
      if(!["image/jpeg","image/png","image/webp"].includes(imageType)||methodLogo.size>10*1024*1024){notice("Choose a JPG, PNG, or WebP logo under 10 MB.");setAddingMethod(false);return;}
      const path=filePath(methodLogo,"payment-methods");
      const {error}=await supabase.storage.from("store-media").upload(path,methodLogo,{upsert:false,contentType:imageType,cacheControl:"3600"});
      if(error){notice(error.message);setAddingMethod(false);return;}
      logoUrl=supabase.storage.from("store-media").getPublicUrl(path).data.publicUrl;
    }
    setForm(current=>({...current,paymentMethods:[...current.paymentMethods,{id:makeId(),...newMethod,name:newMethod.name.trim(),accountName:newMethod.accountName.trim(),accountNumber:newMethod.accountNumber.trim(),logoUrl,enabled:true}]}));
    setNewMethod(emptyPaymentMethod);
    setMethodLogo(null);
    setAddingMethod(false);
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const { error } = await supabase.from("store_settings").update({
      website_config: normalizeWebsiteSettings(form),
      updated_at: new Date().toISOString(),
    }).eq("id", true);
    notice(error?.message || "Website settings saved.");
    setSaving(false);
  };

  return <form className="admin-product-form website-settings-form" onSubmit={save}>
    <header className="website-settings-heading"><div><p className="eyebrow">STOREFRONT CONTROLS</p><h2>Website settings</h2><p>Manage delivery, advance payment, promotions, payment accounts, and homepage videos.</p></div><span>LIVE STORE SETTINGS</span></header>
    {loading && <p className="website-settings-loading">Loading saved website settings…</p>}
    <section className="website-setting-group">
      <h3>Customer-facing details</h3>
      <label className="admin-field"><span>Announcement bar</span><input maxLength={120} value={form.announcement} onChange={(event) => setForm({ ...form, announcement: event.target.value })} placeholder="Free shipping on orders over PKR 5,000"/><small>Leave blank to hide the message at the top of the storefront.</small></label>
      <label className="admin-field"><span>WhatsApp number</span><input required inputMode="tel" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="923001234567"/><small>Include the country code. You can type the number with or without spaces or +.</small></label>
    </section>
    <section className="website-setting-group">
      <h3>Delivery and advance payment</h3>
      <label className="admin-field"><span>Delivery charge per order (PKR)</span><input type="number" min="0" value={form.deliveryFee} onChange={event=>setForm(current=>({...current,deliveryFee:Number(event.target.value)}))}/><small>This is added to each order before the total is shown.</small></label>
      <label className="admin-field"><span>What should customers pay now?</span><select value={form.paymentPolicy} onChange={event=>setForm(current=>({...current,paymentPolicy:event.target.value}))}><option value="full">Full order total now</option><option value="products">Product amount now, delivery on arrival</option><option value="delivery">Delivery charge now, product balance on arrival</option></select><small>Customers will see the amount due now and any balance due on delivery.</small></label>
    </section>
    <section className="website-setting-group">
      <div className="website-video-settings-title"><div><h3>Promotional codes</h3><p>Create discounts customers can enter at checkout. Percent discounts apply to product prices, not delivery.</p></div></div>
      <div className="website-promo-create"><label className="admin-field"><span>Promo code</span><input value={newPromo.code} onChange={event=>setNewPromo({...newPromo,code:event.target.value})} placeholder="e.g. TECHORA10"/></label><label className="admin-field"><span>Discount type</span><select value={newPromo.discountType} onChange={event=>setNewPromo({...newPromo,discountType:event.target.value})}><option value="percent">Percent off</option><option value="fixed">Fixed PKR off</option></select></label><label className="admin-field"><span>{newPromo.discountType==="percent"?"Percent":"Discount amount (PKR)"}</span><input type="number" min="1" max={newPromo.discountType==="percent"?100:undefined} value={newPromo.value} onChange={event=>setNewPromo({...newPromo,value:event.target.value})} placeholder={newPromo.discountType==="percent"?"10":"500"}/></label><label className="admin-field"><span>Expiry date (optional)</span><input type="date" value={newPromo.expiresAt} onChange={event=>setNewPromo({...newPromo,expiresAt:event.target.value})}/></label><button type="button" className="button button-ink" onClick={addPromo}>Add promo</button></div>
      {form.promotions.length>0&&<div className="website-managed-list">{form.promotions.map(promo=><article key={promo.id}><div><strong>{promo.code}</strong><small>{promo.discountType==="percent"?promo.value+"% off":"PKR "+Number(promo.value).toLocaleString()+" off"}{promo.expiresAt?" · expires "+promo.expiresAt:""}</small></div><label><input type="checkbox" checked={promo.active!==false} onChange={event=>setForm(current=>({...current,promotions:current.promotions.map(item=>item.id===promo.id?{...item,active:event.target.checked}:item)}))}/> Active</label><button type="button" onClick={()=>setForm(current=>({...current,promotions:current.promotions.filter(item=>item.id!==promo.id)}))}>Remove</button></article>)}</div>}
    </section>
    <section className="website-setting-group">
      <div className="website-video-settings-title"><div><h3>Additional payment methods</h3><p>Add bank or wallet details that customers can select at checkout. The standard EasyPaisa, SadaPay, and HBL accounts remain available.</p></div></div>
      <div className="website-payment-create"><label className="admin-field"><span>Method name</span><input value={newMethod.name} onChange={event=>setNewMethod({...newMethod,name:event.target.value})} placeholder="e.g. Meezan Bank"/></label><label className="admin-field"><span>Account title</span><input value={newMethod.accountName} onChange={event=>setNewMethod({...newMethod,accountName:event.target.value})} placeholder="Account holder name"/></label><label className="admin-field"><span>Account number / IBAN</span><input value={newMethod.accountNumber} onChange={event=>setNewMethod({...newMethod,accountNumber:event.target.value})} placeholder="Account details"/></label><label className="admin-field website-method-logo"><span>Logo image (optional)</span><input accept="image/jpeg,image/png,image/webp" type="file" onChange={event=>setMethodLogo(event.target.files?.[0]||null)}/></label><button type="button" className="button button-ink" onClick={addPaymentMethod} disabled={addingMethod}>{addingMethod?"Adding…":"Add payment method"}</button></div>
      {form.paymentMethods.length>0&&<div className="website-managed-list">{form.paymentMethods.map(method=><article key={method.id}>{method.logoUrl&&<img className="website-method-logo-preview" src={method.logoUrl} alt=""/>}<div><strong>{method.name}</strong><small>{method.accountNumber} · {method.accountName}</small></div><label><input type="checkbox" checked={method.enabled!==false} onChange={event=>setForm(current=>({...current,paymentMethods:current.paymentMethods.map(item=>item.id===method.id?{...item,enabled:event.target.checked}:item)}))}/> Active</label><button type="button" onClick={()=>setForm(current=>({...current,paymentMethods:current.paymentMethods.filter(item=>item.id!==method.id)}))}>Remove</button></article>)}</div>}
    </section>
    <section className="website-setting-group">
      <div className="website-video-settings-title"><div><h3>Homepage videos</h3><p>Use a direct video link or upload a clip from your phone or computer gallery.</p></div><button type="button" className="website-video-add" onClick={addVideo}>+ Add video</button></div>
      {!form.videos.length && <p className="website-videos-empty">No homepage videos yet. Add one whenever you are ready.</p>}
      {form.videos.map((video, index) => <article className="website-video-setting" key={index}>
        <label className="website-video-toggle"><input type="checkbox" checked={video.enabled !== false} onChange={(event) => updateVideo(index, "enabled", event.target.checked)}/><strong>Show video {index + 1}</strong></label>
        <button type="button" className="website-video-remove" onClick={() => removeVideo(index)} aria-label={"Remove video " + (index + 1)}>Remove video</button>
        <label className="admin-field"><span>Video title</span><input maxLength={70} value={video.title || ""} onChange={(event) => updateVideo(index, "title", event.target.value)} placeholder="A closer look at the product"/></label>
        <label className="admin-field"><span>Video link</span><input type="url" value={video.url || ""} onChange={(event) => updateVideo(index, "url", event.target.value)} placeholder="https://…"/><small>For MP4 clips, use a public video URL. YouTube and Vimeo links are also supported.</small></label>
        <label className="admin-field website-video-upload"><span>{uploadingVideo===index?"Uploading video…":"Or upload from device"}</span><input accept="video/mp4,video/webm,video/ogg,video/quicktime" type="file" disabled={uploadingVideo===index} onChange={event=>{uploadVideo(index,event.target.files?.[0]);event.target.value="";}}/><small>MP4, WebM, OGG, or MOV. Maximum 100 MB. The storage access SQL must be enabled once.</small></label>
        <label className="admin-field"><span>Short caption</span><input maxLength={140} value={video.description || ""} onChange={(event) => updateVideo(index, "description", event.target.value)} placeholder="Short supporting text"/></label>
        <label className="admin-field"><span>Poster image URL (optional)</span><input type="url" value={video.poster || ""} onChange={(event) => updateVideo(index, "poster", event.target.value)} placeholder="https://…"/></label>
        <label className="admin-field"><span>Video credit label (optional)</span><input maxLength={40} value={video.sourceLabel || ""} onChange={(event) => updateVideo(index, "sourceLabel", event.target.value)} placeholder="Source or creator name"/></label>
        <label className="admin-field"><span>Video credit link (optional)</span><input type="url" value={video.sourceUrl || ""} onChange={(event) => updateVideo(index, "sourceUrl", event.target.value)} placeholder="https://…"/></label>
      </article>)}
    </section>
    <button className="button button-ink website-settings-save" disabled={saving || loading}>{saving ? "Saving settings…" : "Save website settings"}</button>
  </form>;
}
