export default async function handler(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });

    const token = process.env.BOT_TOKEN;
    if (!token) return res.status(500).json({ ok: false, error: "Missing BOT_TOKEN env var" });

    const api = (method, params) =>
      fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }).then(r => r.json());

    // 1) get profile photos
    const photos = await api("getUserProfilePhotos", { user_id: Number(userId), limit: 1 });
    if (!photos.ok || !photos.result.total_count) {
      return res.status(200).json({ ok: true, url: null });
    }

    // pick the biggest size in the first photo set
    const sizes = photos.result.photos[0];
    const biggest = sizes[sizes.length - 1];
    const fileId = biggest.file_id;

    // 2) get file path
    const file = await api("getFile", { file_id: fileId });
    if (!file.ok) return res.status(200).json({ ok: true, url: null });

    const filePath = file.result.file_path;
    const url = `https://api.telegram.org/file/bot${8587747992:AAGsQ7KeyDc2VgVu4c5Pi1oraih6irDxvv0}/${filePath}`;

    return res.status(200).json({ ok: true, url });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
