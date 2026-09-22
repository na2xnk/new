// FYP Radar Agent -- pengiriman 1 batch (sesi) ke server, dgn retry.
//
// CATATAN JUJUR: saya tidak 100% yakin bentuk PERSIS pemanggilan
// http.postJson() di AutoJs6 (opsi headers bisa saja beda posisi/nama
// dari yg saya tulis) -- kalau ada galat pas Run, KIRIM PESAN GALATNYA
// PERSIS, itu akan menunjukkan baris mana yg perlu diperbaiki (pola
// sama spt perbaikan getRoot() di dump.js kemarin).
var config = require("./config.js");

var RETRY_DELAYS_MS = [2000, 5000, 15000]; // 3x percobaan ulang sebelum menyerah utk 1 batch

// Balikan: { ok: true, body } kalau sukses, ATAU { ok: false, error,
// fatal } kalau gagal -- fatal=true (mis. token ditolak, 401) berarti
// tidak ada gunanya mencoba lagi tanpa token baru, pemanggil HARUS
// menghentikan skrip.
function postSessionBatch(payload) {
  var url = config.SERVER_URL + "/ingest/sessions";
  var headers = {
    "Authorization": "Bearer " + config.getDeviceToken(),
    "Content-Type": "application/json",
  };

  var lastError = "belum dicoba";
  for (var attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      var res = http.postJson(url, payload, { headers: headers });
      var status = res.statusCode;

      if (status === 200 || status === 201) {
        return { ok: true, body: res.body.json() };
      }
      if (status === 401) {
        return { ok: false, error: "Token ditolak (401) -- terbitkan token baru dari server.", fatal: true };
      }
      if (status === 400 || status === 409) {
        // Permintaan/isi tidak valid -- mengulang PERSIS payload yg sama
        // tidak akan pernah berhasil (beda dari 429/5xx yg sementara).
        return { ok: false, error: "Server menolak (" + status + "): " + res.body.string(), fatal: true };
      }
      lastError = "status " + status + ": " + res.body.string();
    } catch (e) {
      lastError = "" + e;
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      toast("Kirim batch gagal (" + lastError + "), coba lagi...");
      sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  return { ok: false, error: lastError, fatal: false };
}

module.exports = { postSessionBatch: postSessionBatch };
