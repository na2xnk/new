// FYP Radar Agent -- konfigurasi. Token perangkat disimpan persisten di
// HP (storages, bukan variabel biasa yg hilang tiap skrip di-restart),
// diisi SEKALI lewat dialog saat pertama kali dijalankan.
//
// Cara dapat token: di server, jalankan
//   POST https://fyp-radar.rumahbambu.my.id/devices/{deviceId}/credentials
// (deviceId didapat dari POST /panels/{panelId}/devices sblm itu).
// Token PLAINTEXT cuma ditampilkan SEKALI saat itu -- kalau hilang,
// terbitkan ulang (otomatis menggantikan yg lama, yg lama jadi tak valid).

var SERVER_URL = "https://fyp-radar.rumahbambu.my.id";
var TIKTOK_PACKAGE = "com.ss.android.ugc.trill";
var SCRIPT_VERSION = "0.1.0";

// REQ dari diskusi kalibrasi: kirim per 25 impresi ATAU per 5 menit,
// mana yg lebih dulu tercapai.
var BATCH_MAX_IMPRESSIONS = 25;
var BATCH_MAX_DURATION_MS = 5 * 60 * 1000;

var store = storages.create("fyp_radar_agent");

function getDeviceToken() {
  var token = store.get("deviceToken", null);
  if (token) return token;

  // dialogs.rawInput() -- dialog blocking (API lama tapi paling stabil
  // lintas versi AutoJs/AutoJs6), skrip berhenti di sini sampai user
  // mengisi & menekan OK. Ditanya SEKALI saja (tersimpan setelahnya).
  // (dialogs.input() sempat dicoba tapi galat "Failed to call method"
  // di build AutoJs6 ini -- rawInput() lebih dijamin ada di semua versi.)
  var input = dialogs.rawInput("Token perangkat FYP Radar -- tempel token dari POST /devices/{id}/credentials:", "");
  if (!input) {
    throw new Error("Token tidak diisi -- skrip dihentikan. Jalankan ulang & isi token utk lanjut.");
  }
  store.put("deviceToken", input);
  return input;
}

module.exports = {
  SERVER_URL: SERVER_URL,
  TIKTOK_PACKAGE: TIKTOK_PACKAGE,
  SCRIPT_VERSION: SCRIPT_VERSION,
  BATCH_MAX_IMPRESSIONS: BATCH_MAX_IMPRESSIONS,
  BATCH_MAX_DURATION_MS: BATCH_MAX_DURATION_MS,
  getDeviceToken: getDeviceToken,
};
