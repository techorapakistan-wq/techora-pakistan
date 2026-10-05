import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { defaultWebsiteSettings, normalizeWebsiteSettings } from "../data/siteSettings";

export default function WebsiteSettingsAdmin({ notice }) {
  const [form, setForm] = useState(defaultWebsiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const removeVideo = (index) => setForm((current) => ({
    ...current,
    videos: current.videos.filter((_, videoIndex) => videoIndex !== index),
  }));

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
    <header className="website-settings-heading"><div><p className="eyebrow">STOREFRONT CONTROLS</p><h2>Website settings</h2><p>Update the customer announcement, WhatsApp contact, and homepage videos.</p></div><span>LIVE STORE SETTINGS</span></header>
    {loading && <p className="website-settings-loading">Loading saved website settings…</p>}
    <section className="website-setting-group">
      <h3>Customer-facing details</h3>
      <label className="admin-field"><span>Announcement bar</span><input maxLength={120} value={form.announcement} onChange={(event) => setForm({ ...form, announcement: event.target.value })} placeholder="Free shipping on orders over PKR 5,000"/><small>Leave blank to hide the message at the top of the storefront.</small></label>
      <label className="admin-field"><span>WhatsApp number</span><input required inputMode="tel" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="923001234567"/><small>Include the country code. You can type the number with or without spaces or +.</small></label>
    </section>
    <section className="website-setting-group">
      <div className="website-video-settings-title"><div><h3>Homepage videos</h3><p>Add, edit, or remove clips shown on the customer homepage. Use a direct MP4 link or a YouTube/Vimeo link.</p></div><button type="button" className="website-video-add" onClick={addVideo}>+ Add video</button></div>
      {!form.videos.length && <p className="website-videos-empty">No homepage videos yet. Add one whenever you are ready.</p>}
      {form.videos.map((video, index) => <article className="website-video-setting" key={index}>
        <label className="website-video-toggle"><input type="checkbox" checked={video.enabled !== false} onChange={(event) => updateVideo(index, "enabled", event.target.checked)}/><strong>Show video {index + 1}</strong></label>
        <button type="button" className="website-video-remove" onClick={() => removeVideo(index)} aria-label={`Remove video ${index + 1}`}>Remove video</button>
        <label className="admin-field"><span>Video title</span><input maxLength={70} value={video.title || ""} onChange={(event) => updateVideo(index, "title", event.target.value)} placeholder="A closer look at the product"/></label>
        <label className="admin-field"><span>Video link</span><input type="url" value={video.url || ""} onChange={(event) => updateVideo(index, "url", event.target.value)} placeholder="https://…"/><small>For MP4 clips, use a public video URL. YouTube and Vimeo links are also supported.</small></label>
        <label className="admin-field"><span>Short caption</span><input maxLength={140} value={video.description || ""} onChange={(event) => updateVideo(index, "description", event.target.value)} placeholder="Short supporting text"/></label>
        <label className="admin-field"><span>Poster image URL (optional)</span><input type="url" value={video.poster || ""} onChange={(event) => updateVideo(index, "poster", event.target.value)} placeholder="https://…"/></label>
        <label className="admin-field"><span>Video credit label (optional)</span><input maxLength={40} value={video.sourceLabel || ""} onChange={(event) => updateVideo(index, "sourceLabel", event.target.value)} placeholder="Source or creator name"/></label>
        <label className="admin-field"><span>Video credit link (optional)</span><input type="url" value={video.sourceUrl || ""} onChange={(event) => updateVideo(index, "sourceUrl", event.target.value)} placeholder="https://…"/></label>
      </article>)}
    </section>
    <button className="button button-ink website-settings-save" disabled={saving || loading}>{saving ? "Saving settings…" : "Save website settings"}</button>
  </form>;
}
