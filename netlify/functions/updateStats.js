// === NETLIFY FUNCTION: updateStats ===
// Menambah total pengunjung & pengunjung hari ini di GitHub, reset otomatis jam 00:00 WIB

import fetch from "node-fetch";

export async function handler() {
  const token   = process.env.GITHUB_TOKEN; // Token GitHub dari Environment Variable Netlify
  const user    = "Fionks";
  const repo    = "Website-xxx";
  const branch  = "main";
  const file    = "stats.json";
  const apiUrl  = `https://api.github.com/repos/${user}/${repo}/contents/${file}`;

  try {
    const res  = await fetch(apiUrl);
    const data = await res.json();
    const stats = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));

    // Reset otomatis setiap 00:00 WIB
    const nowDate = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
    if (stats.lastDate !== nowDate) {
      stats.todayVisitors = 1;
      stats.lastDate = nowDate;
    } else {
      stats.todayVisitors = (stats.todayVisitors || 0) + 1;
    }

    stats.totalVisitors = (stats.totalVisitors || 0) + 1;

    const updated = Buffer.from(JSON.stringify(stats, null, 2)).toString("base64");
    const save = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Auto update visitors (Netlify Function)",
        content: updated,
        sha: data.sha,
        branch,
      }),
    });

    if (!save.ok) throw new Error("Gagal menyimpan stats.json");
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: e.message }) };
  }
}
