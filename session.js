// FYP Radar Agent -- kumpulkan impresi jadi 1 "sesi" (batch), kirim
// begitu 25 impresi ATAU 5 menit tercapai (config.js), lalu mulai sesi
// baru dgn sessionExternalId BARU. SATU sesi = SATU panggilan
// POST /ingest/sessions -- server tidak mendukung menambah impresi ke
// sesi yg sudah terkirim (externalId yg sama + isi beda = ditolak 409),
// jadi setiap batch harus jadi sesi independen, bukan 1 sesi raksasa
// yg "ditambah-tambah" lewat banyak panggilan.
var config = require("./config.js");
var network = require("./network.js");

// UUID v4 sederhana -- cukup utk sessionExternalId (server cuma butuh
// string tak-kosong yg unik, bukan format UUID formal).
function randomId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    var v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toIso(date) {
  return date.toISOString();
}

function Session() {
  this.reset();
}

Session.prototype.reset = function () {
  this.externalId = randomId();
  this.startedAt = new Date();
  this.impressions = [];
  this.feedPosition = 0;
};

Session.prototype.addImpression = function (data) {
  this.feedPosition += 1;
  this.impressions.push({
    videoId: data.videoId,
    feedPosition: this.feedPosition,
    watchDurationMs: data.watchDurationMs,
    rawEngagement: data.rawEngagement,
    hashtags: data.hashtags,
    isAd: data.isAd,
    capturedAt: toIso(data.capturedAt),
  });
};

Session.prototype.shouldFlush = function () {
  if (this.impressions.length >= config.BATCH_MAX_IMPRESSIONS) return true;
  var elapsed = Date.now() - this.startedAt.getTime();
  return elapsed >= config.BATCH_MAX_DURATION_MS;
};

Session.prototype.isEmpty = function () {
  return this.impressions.length === 0;
};

/**
 * Kirim batch saat ini, lalu SELALU mulai sesi baru (apa pun hasilnya)
 * -- kegagalan kirim 1 batch tidak boleh menghentikan seluruh agen,
 * cukup batch itu yg hilang (dicatat lewat toast, bukan diam-diam).
 * @returns {boolean} true kalau boleh lanjut jalan, false kalau harus berhenti (galat fatal, mis. token ditolak).
 */
Session.prototype.flush = function () {
  if (this.isEmpty()) {
    this.reset();
    return true;
  }

  var payload = {
    sessionExternalId: this.externalId,
    scriptVersion: config.SCRIPT_VERSION,
    startedAt: toIso(this.startedAt),
    endedAt: toIso(new Date()),
    impressions: this.impressions,
  };

  var result = network.postSessionBatch(payload);
  if (result.ok) {
    toast("Terkirim: " + result.body.accepted + " diterima, " + result.body.rejected + " ditolak.");
  } else {
    toast("GAGAL kirim batch (" + this.impressions.length + " impresi hilang): " + result.error);
    console.error("Gagal kirim batch: " + result.error);
    if (result.fatal) {
      this.reset();
      return false;
    }
  }

  this.reset();
  return true;
};

module.exports = Session;
