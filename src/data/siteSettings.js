export const defaultHeroImages = [
  "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=2000&q=85",
];

export const defaultWebsiteSettings = {
  announcement: "Free shipping on orders over PKR 5,000",
  whatsapp: "923229701332",
  deliveryFee: 0,
  paymentPolicy: "full",
  promotions: [],
  paymentMethods: [],
  paymentVisibility: { easypaisa: true, sadapay: true, bank_transfer: true },
  heroImages: defaultHeroImages.map((url) => ({ url, storagePath: "" })),
  videos: [
    {
      enabled: true,
      title: "Wireless audio, up close",
      description: "A closer look at the sound and design behind everyday listening.",
      url: "https://videos.pexels.com/video-files/8005699/8005699-uhd_2160_3840_25fps.mp4",
      poster: "https://images.pexels.com/videos/8005699/pexels-photo-8005699.jpeg?auto=compress&cs=tinysrgb&w=1000",
      sourceLabel: "Pexels",
      sourceUrl: "https://www.pexels.com/video/headphones-with-a-stand-8005699/",
    },
    {
      enabled: true,
      title: "Smart tech in everyday life",
      description: "Modern wearables designed to keep up with your day.",
      url: "https://videos.pexels.com/video-files/36124120/15319560_1080_1920_30fps.mp4",
      poster: "https://images.pexels.com/videos/36124120/pexels-photo-36124120.jpeg?auto=compress&cs=tinysrgb&w=1000",
      sourceLabel: "Pexels",
      sourceUrl: "https://www.pexels.com/video/modern-smartwatch-on-wrist-for-fitness-tracking-36124120/",
    },
  ],
};

export function normalizeWebsiteSettings(value) {
  const saved = value && typeof value === "object" ? value : {};
  const savedVideos = Array.isArray(saved.videos) ? saved.videos : defaultWebsiteSettings.videos;
  const savedHeroImages = Array.isArray(saved.heroImages) ? saved.heroImages : defaultWebsiteSettings.heroImages;
  return {
    ...defaultWebsiteSettings,
    ...saved,
    announcement: typeof saved.announcement === "string" ? saved.announcement : defaultWebsiteSettings.announcement,
    whatsapp: typeof saved.whatsapp === "string" ? saved.whatsapp : defaultWebsiteSettings.whatsapp,
    deliveryFee: Number.isFinite(Number(saved.deliveryFee)) ? Math.max(0, Number(saved.deliveryFee)) : defaultWebsiteSettings.deliveryFee,
    paymentPolicy: ["full", "products", "delivery"].includes(saved.paymentPolicy) ? saved.paymentPolicy : defaultWebsiteSettings.paymentPolicy,
    promotions: Array.isArray(saved.promotions) ? saved.promotions.filter((promo) => promo && typeof promo === "object") : defaultWebsiteSettings.promotions,
    paymentMethods: Array.isArray(saved.paymentMethods) ? saved.paymentMethods.filter((method) => method && typeof method === "object") : defaultWebsiteSettings.paymentMethods,
    paymentVisibility: {
      ...defaultWebsiteSettings.paymentVisibility,
      ...(saved.paymentVisibility && typeof saved.paymentVisibility === "object" ? saved.paymentVisibility : {}),
    },
    heroImages: Array.from({ length: defaultHeroImages.length }, (_, index) => {
      const image = savedHeroImages[index];
      if (image && typeof image === "object") return { url: typeof image.url === "string" ? image.url : "", storagePath: typeof image.storagePath === "string" ? image.storagePath : "" };
      if (typeof image === "string") return { url: image, storagePath: "" };
      return { url: defaultHeroImages[index], storagePath: "" };
    }),
    videos: savedVideos.map((video, index) => ({
      ...(defaultWebsiteSettings.videos[index] || {}),
      ...(video && typeof video === "object" ? video : {}),
    })),
  };
}

export function whatsappDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}
