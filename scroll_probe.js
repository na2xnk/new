// fyp-radar-agent -- SKRIP SEKALI PAKAI, bukan bagian dari agen utama.
// Tujuan: cari elemen SCROLLABLE (kontainer feed TikTok) & cek apakah
// AutoJs6 bisa menyuruhnya "gulir ke depan" lewat aksi aksesibilitas
// langsung (scrollForward) -- BUKAN simulasi sentuhan/swipe spt sblm-nya.
// Kalau ini berhasil, agen bisa pindah video TANPA PERNAH salah sasaran
// ke kartu/tombol apa pun, krn bukan koordinat sentuhan sama sekali.
//
// CARA PAKAI: buka TikTok, pastikan sedang di tab For You dgn 1 video
// tampil, lalu Run skrip ini. Hasil disalin ke clipboard -- tempel ke chat.

function safe(fn) {
  try {
    return fn();
  } catch (e) {
    return "GALAT: " + e;
  }
}

try {
  var node = scrollable(true).findOne(3000);

  var info = {
    ketemuNodeScrollable: !!node,
    className: safe(function () { return node ? node.className() : null; }),
    idNode: safe(function () { return node ? node.id() : null; }),
    tipeScrollForward: safe(function () { return node ? typeof node.scrollForward : "node tdk ada"; }),
  };

  if (node && typeof node.scrollForward === "function") {
    info.hasilScrollForward = safe(function () { return node.scrollForward(); });
  }

  var output = JSON.stringify(info, null, 2);
  setClip(output);
  toast("Selesai -- hasil disalin ke clipboard, tempel ke chat.");
  console.log(output);
} catch (e) {
  var failMsg = "GAGAL TOTAL: " + e;
  setClip(failMsg);
  toast(failMsg);
  console.error(failMsg);
}
