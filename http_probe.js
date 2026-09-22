// fyp-radar-agent -- SKRIP SEKALI PAKAI, bukan bagian dari agen utama.
// Tujuan: lihat bentuk ASLI objek respons http.get() di build AutoJs6 ini,
// supaya resolveCanonicalVideoUrl() di capture.js bisa dibetulkan
// berdasarkan data sungguhan, bukan tebakan lagi.
//
// CARA PAKAI:
// 1. Ganti nilai `link` di bawah dgn SALAH SATU link vt.tiktok.com dari
//    log (mis. dari screenshot: https://vt.tiktok.com/ZSqKKaNAo/).
// 2. Run skrip ini sekali (TikTok/HP tidak perlu dlm keadaan apa pun,
//    ini murni panggilan jaringan).
// 3. Hasilnya disalin ke clipboard -- tempel isinya ke chat.

var link = "https://vt.tiktok.com/ZSqKKaNAo/";

function safe(fn) {
  try {
    return fn();
  } catch (e) {
    return "GALAT: " + e;
  }
}

try {
  var res = http.get(link);

  var info = {
    linkDicoba: link,
    statusCode: safe(function () { return res.statusCode; }),
    tipeResUrl: safe(function () { return typeof res.url; }),
    nilaiResUrl: safe(function () { return res.url ? String(res.url) : null; }),
    tipeResRequest: safe(function () { return typeof res.request; }),
    tipeResRequestUrl: safe(function () { return res.request ? typeof res.request.url : "res.request tidak ada"; }),
    nilaiResRequestUrl: safe(function () {
      if (!res.request || !res.request.url) return null;
      return typeof res.request.url === "function" ? String(res.request.url()) : String(res.request.url);
    }),
    tipeResHeaders: safe(function () { return typeof res.headers; }),
    locationHeaderViaGet: safe(function () {
      return (res.headers && typeof res.headers.get === "function") ? res.headers.get("Location") : "tak ada method get()";
    }),
    daftarKeyRes: safe(function () {
      var keys = [];
      for (var k in res) keys.push(k);
      return keys;
    }),
  };

  var output = JSON.stringify(info, null, 2);
  setClip(output);
  toast("Selesai -- hasil disalin ke clipboard, tempel ke chat.");
  console.log(output);
} catch (e) {
  var failMsg = "GAGAL TOTAL memanggil http.get(): " + e;
  setClip(failMsg);
  toast(failMsg);
  console.error(failMsg);
}
