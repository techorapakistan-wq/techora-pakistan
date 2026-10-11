import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { defaultHeroImages, defaultWebsiteSettings, normalizeWebsiteSettings } from "../data/siteSettings";

const emptyPromo={code:"",discountType:"percent",value:"",expiresAt:""};
const emptyPaymentMethod={name:"",accountName:"",accountNumber:""};
const emptyVideo={enabled:true,title:"",description:"",url:"",poster:"",sourceLabel:"",sourceUrl:"",sourceType:"video",aspectRatio:"wide"};
const makeId=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const filePath=(file,folder)=>folder+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");

const collectStoragePaths=(settings)=>new Set([
  ...(settings.heroImages||[]).map(image=>image?.storagePath).filter(Boolean),
  ...(settings.videos||[]).flatMap(video=>[video?.storagePath,video?.posterStoragePath]).filter(Boolean),
  ...(settings.paymentMethods||[]).map(method=>method?.storagePath).filter(Boolean),
]);

export default function WebsiteSettingsAdmin({ notice, mode="settings", products=[] }) {
  const isAppearance=mode==="appearance";
  const [form, setForm] = useState(defaultWebsiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(-1);
  const [uploadingPoster, setUploadingPoster] = useState(-1);
  const [uploadingHero, setUploadingHero] = useState(-1);
  const [videoDialogOpen,setVideoDialogOpen]=useState(false);
  const [draftVideo,setDraftVideo]=useState(emptyVideo);
  const [draftVideoFile,setDraftVideoFile]=useState(null);
  const [draftPosterFile,setDraftPosterFile]=useState(null);
  const [draftPosterPreview,setDraftPosterPreview]=useState("");
  const [addingVideo,setAddingVideo]=useState(false);
  const [newPromo,setNewPromo]=useState(emptyPromo);
  const [newMethod,setNewMethod]=useState(emptyPaymentMethod);
  const [methodLogo,setMethodLogo]=useState(null);
  const [addingMethod,setAddingMethod]=useState(false);
  const savedSettings=useRef(defaultWebsiteSettings);

  useEffect(()=>{
    if(!draftPosterFile){setDraftPosterPreview("");return undefined;}
    const preview=URL.createObjectURL(draftPosterFile);
    setDraftPosterPreview(preview);
    return ()=>URL.revokeObjectURL(preview);
  },[draftPosterFile]);

  useEffect(() => {
    let active = true;
    supabase.from("store_settings").select("website_config").eq("id", true).single().then(({ data, error }) => {
      if (!active) return;
      const normalized=normalizeWebsiteSettings(data?.website_config);
      setForm(normalized);
      savedSettings.current=normalized;
      if (error) notice(error.message);
      setLoading(false);
    });
    return () => { active = false; };
  }, [notice]);

  const updateVideo = (index, key, value) => setForm((current) => ({
    ...current,
    videos: current.videos.map((video, videoIndex) => videoIndex === index ? { ...video, [key]: value } : video),
  }));

  const addVideo = () => {
    setDraftVideo(emptyVideo);
    setDraftVideoFile(null);
    setDraftPosterFile(null);
    setVideoDialogOpen(true);
  };

  const uploadAsset=async(file,folder,acceptedTypes,maxBytes,label)=>{
    const extension=file.name.split(".").pop()?.toLowerCase();
    const inferredType=({jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",mp4:"video/mp4",webm:"video/webm",ogg:"video/ogg",mov:"video/quicktime"})[extension]||"";
    const type=file.type||inferredType;
    if(!acceptedTypes.includes(type))throw new Error(`Choose a supported ${label} file.`);
    if(file.size>maxBytes)throw new Error(`${label} files must be ${maxBytes===100*1024*1024?"100 MB":"6 MB"} or smaller.`);
    const path=filePath(file,folder);
    const {error}=await supabase.storage.from("store-media").upload(path,file,{upsert:false,contentType:type,cacheControl:"3600"});
    if(error)throw error;
    return {path,url:supabase.storage.from("store-media").getPublicUrl(path).data.publicUrl,type};
  };

  const commitDraftVideo=async()=>{
    if(addingVideo)return;
    if(!draftVideo.url.trim()&&!draftVideoFile){notice(draftVideo.sourceType==="iframe"?"Add the iframe embed URL first.":"Add a video link or choose a video from your gallery.");return;}
    setAddingVideo(true);
    const uploadedPaths=[];
    try{
      let uploadedVideo=null,uploadedPoster=null;
      if(draftVideoFile){uploadedVideo=await uploadAsset(draftVideoFile,"homepage-videos",["video/mp4","video/webm","video/ogg","video/quicktime"],100*1024*1024,"Video");uploadedPaths.push(uploadedVideo.path);}
      if(draftPosterFile){uploadedPoster=await uploadAsset(draftPosterFile,"homepage-video-posters",["image/jpeg","image/png","image/webp"],6*1024*1024,"Poster image");uploadedPaths.push(uploadedPoster.path);}
      const video={...draftVideo,url:uploadedVideo?.url||draftVideo.url.trim(),storagePath:uploadedVideo?.path||"",mediaType:uploadedVideo?"upload":"",poster:uploadedPoster?.url||draftVideo.poster.trim(),posterStoragePath:uploadedPoster?.path||""};
      setForm(current=>({...current,videos:[...current.videos,video]}));
      setVideoDialogOpen(false);
      notice("Video added. Save appearance to publish it.");
      window.setTimeout(()=>document.getElementById(`website-video-${form.videos.length}`)?.scrollIntoView({behavior:"smooth",block:"center"}),120);
    }catch(error){
      if(uploadedPaths.length)await supabase.storage.from("store-media").remove(uploadedPaths);
      notice(error.message||"The video could not be uploaded. Please try again.");
    }finally{setAddingVideo(false);}
  };

  const removeVideo = (index) => {
    setForm((current) => ({ ...current, videos: current.videos.filter((_, videoIndex) => videoIndex !== index) }));
  };

  const updateHeroImage=(index,patch)=>setForm(current=>({...current,heroImages:current.heroImages.map((image,imageIndex)=>imageIndex===index?{...image,...patch}:image)}));

  const uploadHeroImage=async(index,file)=>{
    if(!file)return;
    const extension=file.name.split(".").pop()?.toLowerCase();
    const imageType=file.type||({jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"}[extension]||"");
    if(!["image/jpeg","image/png","image/webp"].includes(imageType)){notice("Choose a JPG, PNG, or WebP image.");return;}
    if(file.size>6*1024*1024){notice("Hero images must be 6 MB or smaller.");return;}
    setUploadingHero(index);
    const path=filePath(file,"homepage-hero");
    const {error}=await supabase.storage.from("store-media").upload(path,file,{upsert:false,contentType:imageType,cacheControl:"3600"});
    if(error){notice(error.message);setUploadingHero(-1);return;}
    const url=supabase.storage.from("store-media").getPublicUrl(path).data.publicUrl;
    updateHeroImage(index,{url,storagePath:path});
    notice("Hero image uploaded. Save appearance to publish it.");
    setUploadingHero(-1);
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
    notice(`Video uploaded. Save ${isAppearance?"appearance":"website settings"} to publish it.`);
    setUploadingVideo(-1);
  };

  const uploadPoster=async(index,file)=>{
    if(!file)return;
    setUploadingPoster(index);
    try{
      const uploaded=await uploadAsset(file,"homepage-video-posters",["image/jpeg","image/png","image/webp"],6*1024*1024,"Poster image");
      updateVideo(index,"poster",uploaded.url);
      updateVideo(index,"posterStoragePath",uploaded.path);
      notice("Poster uploaded. Save appearance to publish it.");
    }catch(error){notice(error.message||"The poster could not be uploaded.");}
    setUploadingPoster(-1);
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
    let logoUrl="",storagePath="";
    if(methodLogo){
      const extension=methodLogo.name.split(".").pop()?.toLowerCase();
      const imageType=methodLogo.type||({jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"}[extension]||"");
      if(!["image/jpeg","image/png","image/webp"].includes(imageType)||methodLogo.size>10*1024*1024){notice("Choose a JPG, PNG, or WebP logo under 10 MB.");setAddingMethod(false);return;}
      storagePath=filePath(methodLogo,"payment-methods");
      const {error}=await supabase.storage.from("store-media").upload(storagePath,methodLogo,{upsert:false,contentType:imageType,cacheControl:"3600"});
      if(error){notice(error.message);setAddingMethod(false);return;}
      logoUrl=supabase.storage.from("store-media").getPublicUrl(storagePath).data.publicUrl;
    }
    setForm(current=>({...current,paymentMethods:[...current.paymentMethods,{id:makeId(),...newMethod,name:newMethod.name.trim(),accountName:newMethod.accountName.trim(),accountNumber:newMethod.accountNumber.trim(),logoUrl,storagePath,enabled:true}]}));
    setNewMethod(emptyPaymentMethod);
    setMethodLogo(null);
    setAddingMethod(false);
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const hasPaymentMethod=Object.values(form.paymentVisibility||{}).some(Boolean)||(form.paymentMethods||[]).some(method=>method.enabled!==false);
    if(isAppearance&&!hasPaymentMethod){notice("Keep at least one payment method active before saving.");return;}
    setSaving(true);
    const normalized=normalizeWebsiteSettings(form);
    const { error } = await supabase.from("store_settings").update({
      website_config: normalized,
      updated_at: new Date().toISOString(),
    }).eq("id", true);
    if(error){notice(error.message);setSaving(false);return;}
    const oldPaths=collectStoragePaths(savedSettings.current);
    const currentPaths=collectStoragePaths(normalized);
    const removedPaths=[...oldPaths].filter(path=>!currentPaths.has(path));
    savedSettings.current=normalized;
    if(removedPaths.length){
      const {error:cleanupError}=await supabase.storage.from("store-media").remove(removedPaths);
      notice(cleanupError?`Changes saved, but some old uploads could not be deleted: ${cleanupError.message}`:isAppearance?"Appearance saved and old uploads removed.":"Website settings saved and old uploads removed.");
    }else notice(isAppearance?"Appearance saved.":"Website settings saved.");
    setSaving(false);
  };

  const paymentVisibility=form.paymentVisibility||defaultWebsiteSettings.paymentVisibility;
  const hasPaymentMethod=Object.values(paymentVisibility).some(Boolean)||(form.paymentMethods||[]).some(method=>method.enabled!==false);
  const exploreGroups=new Map();
  products.filter(product=>product.is_active!==false).forEach(product=>{
    const category=String(product.category||"").trim();
    if(!category)return;
    const key=category.toLocaleLowerCase();
    if(!exploreGroups.has(key))exploreGroups.set(key,{category,products:[]});
    exploreGroups.get(key).products.push(product);
  });

  return <form className="admin-product-form website-settings-form" onSubmit={save}>
    <header className="website-settings-heading"><div><p className="eyebrow">STOREFRONT CONTROLS</p><h2>{isAppearance?"Appearance":"Website settings"}</h2><p>{isAppearance?"Update homepage images, videos, and the payment methods customers can use.":"Manage store messages, delivery charges, advance payment, and promotions."}</p></div><span>LIVE STORE SETTINGS</span></header>
    {loading && <p className="website-settings-loading">Loading saved website settings…</p>}
    {isAppearance&&<>
    <section className="website-setting-group appearance-hero-section">
      <div className="website-video-settings-title"><div><h3>Homepage hero images</h3><p>Replace an image with a URL or upload one from your gallery. Remove it to show a clean colour background.</p></div></div>
      <div className="appearance-hero-grid">{form.heroImages.map((image,index)=><article className="appearance-hero-card" key={index}>
        <header><strong>Hero slide {index+1}</strong><span>{image.url?"Image set":"No image"}</span></header>
        {image.url?<img className="appearance-hero-preview" src={image.url} alt={`Hero slide ${index+1} preview`}/>:<div className="appearance-hero-empty">Background image removed</div>}
        <label className="admin-field"><span>Image URL</span><input type="url" value={image.url||""} onChange={event=>updateHeroImage(index,{url:event.target.value,storagePath:""})} placeholder="https://…"/></label>
        <div className="appearance-hero-actions"><label className="website-video-add appearance-upload-label"><span>{uploadingHero===index?"Uploading image…":"Upload from gallery"}</span><input accept="image/jpeg,image/png,image/webp" type="file" disabled={uploadingHero===index} onChange={event=>{uploadHeroImage(index,event.target.files?.[0]);event.target.value="";}}/></label><button type="button" className="website-video-remove" onClick={()=>updateHeroImage(index,{url:"",storagePath:""})} disabled={!image.url}>Remove image</button><button type="button" className="appearance-default-button" onClick={()=>updateHeroImage(index,{url:defaultHeroImages[index],storagePath:""})}>Restore default</button></div>
      </article>)}</div>
    </section>
    <section className="website-setting-group">
      <h3>Standard payment methods</h3>
      <p className="appearance-payment-help">Choose which built-in accounts appear at checkout. Update account numbers and names in Payment details.</p>
      <div className="appearance-payment-toggles">
        {[["easypaisa","EasyPaisa"],["sadapay","SadaPay"],["bank_transfer","HBL bank transfer"]].map(([id,label])=><label key={id}><input type="checkbox" checked={paymentVisibility[id]!==false} onChange={event=>setForm(current=>({...current,paymentVisibility:{...current.paymentVisibility,[id]:event.target.checked}}))}/><span><strong>{label}</strong><small>{paymentVisibility[id]!==false?"Visible at checkout":"Hidden from checkout"}</small></span></label>)}
      </div>
    </section>
    </>}
    {!isAppearance&&<>
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
    </>}
    {isAppearance&&<>
    <section className="website-setting-group website-explore-picks">
      <div className="website-video-settings-title"><div><h3>Homepage Explore cards</h3><p>Choose one featured product for each category. Categories and options update from your active products.</p></div></div>
      {[...exploreGroups.entries()].map(([key,group])=>{
        const selectedId=form.explorePicks?.[key]||String(group.products[0].id);
        const selectedProduct=group.products.find(product=>String(product.id)===selectedId)||group.products[0];
        return <label className="admin-field website-explore-pick" key={key}>
          <span>{group.category}</span>
          <select value={String(selectedProduct.id)} onChange={event=>setForm(current=>({...current,explorePicks:{...(current.explorePicks||{}),[key]:event.target.value}}))}>
            {group.products.map(product=><option key={product.id} value={String(product.id)}>{product.name}</option>)}
          </select>
          <img src={selectedProduct.image_url||selectedProduct.image||""} alt=""/>
        </label>;
      })}
      {!exploreGroups.size&&<p className="website-videos-empty">Add active products with a category to manage these cards.</p>}
    </section>
    </>}
    {isAppearance&&<>
    <section className="website-setting-group">
      <div className="website-video-settings-title"><div><h3>Additional payment methods</h3><p>Add bank or wallet details that customers can select at checkout. The standard EasyPaisa, SadaPay, and HBL accounts remain available.</p></div></div>
      <div className="website-payment-create"><label className="admin-field"><span>Method name</span><input value={newMethod.name} onChange={event=>setNewMethod({...newMethod,name:event.target.value})} placeholder="e.g. Meezan Bank"/></label><label className="admin-field"><span>Account title</span><input value={newMethod.accountName} onChange={event=>setNewMethod({...newMethod,accountName:event.target.value})} placeholder="Account holder name"/></label><label className="admin-field"><span>Account number / IBAN</span><input value={newMethod.accountNumber} onChange={event=>setNewMethod({...newMethod,accountNumber:event.target.value})} placeholder="Account details"/></label><label className="admin-field website-method-logo"><span>Logo image (optional)</span><input accept="image/jpeg,image/png,image/webp" type="file" onChange={event=>setMethodLogo(event.target.files?.[0]||null)}/></label><button type="button" className="button button-ink" onClick={addPaymentMethod} disabled={addingMethod}>{addingMethod?"Adding…":"Add payment method"}</button></div>
      {form.paymentMethods.length>0&&<div className="website-managed-list">{form.paymentMethods.map(method=><article key={method.id}>{method.logoUrl&&<img className="website-method-logo-preview" src={method.logoUrl} alt=""/>}<div><strong>{method.name}</strong><small>{method.accountNumber} · {method.accountName}</small></div><label><input type="checkbox" checked={method.enabled!==false} onChange={event=>setForm(current=>({...current,paymentMethods:current.paymentMethods.map(item=>item.id===method.id?{...item,enabled:event.target.checked}:item)}))}/> Active</label><button type="button" onClick={()=>setForm(current=>({...current,paymentMethods:current.paymentMethods.filter(item=>item.id!==method.id)}))}>Remove</button></article>)}</div>}
    </section>
    <section className="website-setting-group">
      <div className="website-video-settings-title"><div><h3>Homepage videos</h3><p>Use a direct video link or upload a clip from your phone or computer gallery.</p></div><button type="button" className="website-video-add" onClick={addVideo}>+ Add video</button></div>
      {!form.videos.length && <p className="website-videos-empty">No homepage videos yet. Add one whenever you are ready.</p>}
      {form.videos.map((video, index) => <article className="website-video-setting" id={`website-video-${index}`} key={index}>
        <label className="website-video-toggle"><input type="checkbox" checked={video.enabled !== false} onChange={(event) => updateVideo(index, "enabled", event.target.checked)}/><strong>Show video {index + 1}</strong></label>
        <button type="button" className="website-video-remove" onClick={() => removeVideo(index)} aria-label={"Remove video " + (index + 1)}>Remove video</button>
        <label className="admin-field"><span>Video title</span><input maxLength={70} value={video.title || ""} onChange={(event) => updateVideo(index, "title", event.target.value)} placeholder="A closer look at the product"/></label>
        <label className="admin-field"><span>Video link</span><input type="url" value={video.url || ""} onChange={(event) => updateVideo(index, "url", event.target.value)} placeholder="https://…"/><small>For MP4 clips, use a public video URL. YouTube and Vimeo links are also supported.</small></label>
        <label className="admin-field website-video-upload"><span>{uploadingVideo===index?"Uploading video…":"Or upload from device"}</span><input accept="video/mp4,video/webm,video/ogg,video/quicktime" type="file" disabled={uploadingVideo===index} onChange={event=>{uploadVideo(index,event.target.files?.[0]);event.target.value="";}}/><small>MP4, WebM, OGG, or MOV. Maximum 100 MB. The storage access SQL must be enabled once.</small></label>
        <label className="admin-field"><span>Source type</span><select value={video.sourceType||"video"} onChange={event=>updateVideo(index,"sourceType",event.target.value)}><option value="video">Video link or upload</option><option value="iframe">Iframe embed URL</option></select></label>
        <label className="admin-field"><span>Video shape</span><select value={video.aspectRatio||"wide"} onChange={event=>updateVideo(index,"aspectRatio",event.target.value)}><option value="wide">16:9 landscape</option><option value="reel">9:16 Reel</option></select></label>
        <label className="admin-field"><span>Short caption</span><input maxLength={140} value={video.description || ""} onChange={(event) => updateVideo(index, "description", event.target.value)} placeholder="Short supporting text"/></label>
        <label className="admin-field"><span>Poster image URL (optional)</span><input type="url" value={video.poster || ""} onChange={(event) => {updateVideo(index,"poster",event.target.value);updateVideo(index,"posterStoragePath","");}} placeholder="https://…"/></label>
        <div className="admin-field website-video-poster-field"><span>Poster image from gallery</span>{video.poster&&<img src={video.poster} alt={`Poster preview for video ${index+1}`}/>}<label className="website-video-add appearance-upload-label"><span>{uploadingPoster===index?"Uploading poster…":"Choose poster image"}</span><input accept="image/jpeg,image/png,image/webp" type="file" disabled={uploadingPoster===index} onChange={event=>{uploadPoster(index,event.target.files?.[0]);event.target.value="";}}/></label><button type="button" className="website-video-remove" onClick={()=>{updateVideo(index,"poster","");updateVideo(index,"posterStoragePath","");}} disabled={!video.poster}>Remove poster</button></div>
        <label className="admin-field"><span>Video credit label (optional)</span><input maxLength={40} value={video.sourceLabel || ""} onChange={(event) => updateVideo(index, "sourceLabel", event.target.value)} placeholder="Source or creator name"/></label>
        <label className="admin-field"><span>Video credit link (optional)</span><input type="url" value={video.sourceUrl || ""} onChange={(event) => updateVideo(index, "sourceUrl", event.target.value)} placeholder="https://…"/></label>
      </article>)}
    </section>
    </>}
    {isAppearance&&!hasPaymentMethod&&<p className="appearance-payment-warning">Add or turn on at least one payment method before saving these changes.</p>}
    <button className="button button-ink website-settings-save" disabled={saving || loading || (isAppearance&&!hasPaymentMethod)}>{saving ? "Saving settings…" : isAppearance?"Save appearance":"Save website settings"}</button>
    <AnimatePresence>{videoDialogOpen&&<motion.div className="website-video-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={()=>setVideoDialogOpen(false)}><motion.section className="website-video-modal" role="dialog" aria-modal="true" aria-labelledby="website-video-dialog-title" initial={{opacity:0,y:24,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:12,scale:.98}} transition={{type:"spring",damping:28,stiffness:280}} onMouseDown={event=>event.stopPropagation()}>
      <header><div><p className="eyebrow">STOREFRONT VIDEO</p><h2 id="website-video-dialog-title">Add homepage video</h2><p>Choose how it looks and when customers see it.</p></div><button type="button" className="icon-button" onClick={()=>setVideoDialogOpen(false)} aria-label="Close add video">×</button></header>
      <div className="website-video-modal-fields">
        <label className="admin-field"><span>Video title</span><input autoFocus maxLength={70} value={draftVideo.title} onChange={event=>setDraftVideo(current=>({...current,title:event.target.value}))} placeholder="A closer look at the product"/></label>
        <label className="admin-field"><span>Source type</span><select value={draftVideo.sourceType} onChange={event=>setDraftVideo(current=>({...current,sourceType:event.target.value}))}><option value="video">Video URL or gallery upload</option><option value="iframe">Iframe embed URL</option></select></label>
        <label className="admin-field website-video-modal-wide"><span>{draftVideo.sourceType==="iframe"?"Iframe embed URL":"Video URL (optional if uploading)"}</span><input type="url" value={draftVideo.url} onChange={event=>setDraftVideo(current=>({...current,url:event.target.value}))} placeholder={draftVideo.sourceType==="iframe"?"https://…/embed/…":"https://…/video.mp4"}/><small>YouTube and Vimeo links work with Video URL. For iframe, paste the provider's embed URL.</small></label>
        {draftVideo.sourceType==="video"&&<label className="admin-field website-video-upload website-video-modal-wide"><span>Or upload video from gallery</span><input accept="video/mp4,video/webm,video/ogg,video/quicktime" type="file" onChange={event=>setDraftVideoFile(event.target.files?.[0]||null)}/><small>{draftVideoFile?draftVideoFile.name:"MP4, WebM, OGG, or MOV. Maximum 100 MB."}</small></label>}
        <label className="admin-field"><span>Video shape</span><select value={draftVideo.aspectRatio} onChange={event=>setDraftVideo(current=>({...current,aspectRatio:event.target.value}))}><option value="wide">16:9 landscape</option><option value="reel">9:16 Reel</option></select></label>
        <label className="admin-field"><span>Short caption</span><input maxLength={140} value={draftVideo.description} onChange={event=>setDraftVideo(current=>({...current,description:event.target.value}))} placeholder="Short supporting text"/></label>
        <label className="admin-field website-video-modal-wide"><span>Poster image URL (optional)</span><input type="url" value={draftVideo.poster} onChange={event=>setDraftVideo(current=>({...current,poster:event.target.value}))} placeholder="https://…"/></label>
        <label className="admin-field website-video-upload website-video-modal-wide"><span>Or choose poster from gallery</span><input accept="image/jpeg,image/png,image/webp" type="file" onChange={event=>setDraftPosterFile(event.target.files?.[0]||null)}/><small>{draftPosterFile?draftPosterFile.name:"JPG, PNG, or WebP. Maximum 6 MB."}</small></label>
        {(draftPosterPreview||draftVideo.poster)&&<img className="website-video-modal-poster" src={draftPosterPreview||draftVideo.poster} alt="Selected poster preview"/>}
      </div>
      <footer><button type="button" className="appearance-default-button" onClick={()=>setVideoDialogOpen(false)} disabled={addingVideo}>Cancel</button><button type="button" className="button button-ink" onClick={commitDraftVideo} disabled={addingVideo}>{addingVideo?"Uploading…":"Add video to list"}</button></footer>
    </motion.section></motion.div>}</AnimatePresence>
  </form>;
}
