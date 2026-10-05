export const defaultWebsiteSettings = {
  announcement: "Free shipping on orders over PKR 5,000",
  whatsapp: "923229701332",
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
  return {
    ...defaultWebsiteSettings,
    ...saved,
    announcement: typeof saved.announcement === "string" ? saved.announcement : defaultWebsiteSettings.announcement,
    whatsapp: typeof saved.whatsapp === "string" ? saved.whatsapp : defaultWebsiteSettings.whatsapp,
    videos: defaultWebsiteSettings.videos.map((fallback, index) => ({
      ...fallback,
      ...(savedVideos[index] && typeof savedVideos[index] === "object" ? savedVideos[index] : {}),
    })),
  };
}

export function whatsappDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}
