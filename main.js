// FYP Radar Agent -- loop utama. Jalankan lewat AutoJs6, HENTIKAN lewat
// tombol stop bawaan AutoJs6 di tab Task (bukan mekanisme henti buatan
// sendiri) -- flush() dipanggil sekali lagi di akhir cuma menjaga sisa
// data tersimpan kalau skrip berhenti scr wajar, bukan pengganti tombol
// stop asli.
var config = require("./config.js");
var Session = require("./session.js");
var capture = require("./capture.js");

auto();
config.getDeviceToken(); // minta token SEKALI di awal, bukan di tengah loop

app.launchPackage(config.TIKTOK_PACKAGE);
sleep(3000);

// Pastikan tab "For You" terpilih -- aman diketuk berulang (idempoten,
// bukan toggle).
var forYouTab = desc("For You").findOne(3000);
if (forYouTab) forYouTab.click();
sleep(1000);

var session = new Session();
var running = true;

/**
 * Jeda "menonton" ACAK (BUKAN tetap) -- server menandai sesi dgn durasi
 * tonton yg terlalu seragam sbg mencurigakan (SessionAnomalyDetector,
 * S3 REQ-305). Rentang 2.5-5.5 detik ASUMSI AWAL, BELUM diverifikasi
 * thd data produksi sungguhan -- boleh disetel ulang stlh lihat hasil
 * nyata.
 */
function randomWatchDelayMs() {
  return 2500 + Math.floor(Math.random() * 3000);
}

while (running) {
  try {
    var videoStartedAt = new Date();
    sleep(randomWatchDelayMs());

    var data = capture.captureCurrentVideo();
    if (data) {
      session.addImpression({
        videoId: data.videoId,
        watchDurationMs: Date.now() - videoStartedAt.getTime(),
        rawEngagement: data.rawEngagement,
        hashtags: data.hashtags,
        isAd: data.isAd,
        capturedAt: videoStartedAt,
      });
      console.log("Tercatat #" + session.feedPosition + " (" + data.username + "): " + data.videoId);
    } else {
      console.log("Video dilewati -- videoId tak terbaca.");
    }

    if (session.shouldFlush()) {
      running = session.flush();
    }

    // Gulir ke video berikutnya: swipe dari 80% ke 20% tinggi layar.
    var w = device.width;
    var h = device.height;
    swipe(w / 2, h * 0.8, w / 2, h * 0.2, 300);
    sleep(500);
  } catch (e) {
    console.error("Galat di 1 putaran (dilewati, lanjut jalan): " + e);
    toast("Galat: " + e);
    sleep(2000);
  }
}

// Kirim sisa impresi yg belum sempat mencapai ambang batch.
session.flush();
toast("Agen FYP Radar berhenti.");
