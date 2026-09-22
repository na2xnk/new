// FYP Radar Agent -- baca 1 video FYP dari layar. Selector-selector di
// sini HASIL KALIBRASI LANGSUNG di HP (TikTok bahasa Inggris,
// packageName com.ss.android.ugc.trill) -- BUKAN dokumentasi resmi,
// bisa berubah kalau TikTok update tampilannya. Tiap field dibungkus
// supaya 1 field gagal terbaca TIDAK menggagalkan seluruh impresi
// (kecuali videoId -- itu wajib, tanpanya video dilewati sepenuhnya).

var LIKE_DESC = /^Like video\.\s*([\d.,A-Za-z]+)\s*likes?$/i;
var COMMENT_DESC = /^Read or add comments\.\s*([\d.,A-Za-z]+)\s*comments?$/i;
var SHARE_DESC = /^Share video\.\s*([\d.,A-Za-z]+)\s*shares?$/i;
var SHARE_BUTTON_DESC_PREFIX = "Share video.";
var COPY_LINK_DESC = "Copy link";
var PROMOTIONAL_LABEL_ID = "fkg";
var PROMOTIONAL_LABEL_TEXT = "Promotional content";

function readEngagementFromDesc(pattern) {
  var node = descMatches(pattern).findOne(1500);
  if (!node) return null;
  var m = pattern.exec(node.desc());
  return m ? m[1] : null;
}

function readSaveCount() {
  // id/fiy (tombol simpan) TIDAK py angka di desc-nya (beda dari
  // like/komentar/share) -- angka ada di node TERPISAH ber-id "fid".
  var node = id("fid").findOne(1500);
  return node ? node.text() : null;
}

function readUsername() {
  var node = id("title").findOne(1500);
  return node ? node.text() : "";
}

function expandCaptionIfTruncated() {
  // Caption terpotong (berakhiran tanda elipsis) kalau ada tombol "more" --
  // tanpa ini, hashtag di bagian akhir caption panjang bisa hilang.
  var moreButton = id("u3h").findOne(500);
  if (moreButton && moreButton.text() === "more") {
    moreButton.click();
    sleep(300);
  }
}

function readCaptionAndHashtags() {
  expandCaptionIfTruncated();
  var node = id("desc").findOne(1500);
  var raw = node ? node.text() : "";
  // U+FEFF -- karakter kosong tak terlihat yg dipakai TikTok sbg
  // padding caption terpotong, dibuang spy tidak ikut ke hashtag.
  // Ditulis pakai kode escape unicode (BUKAN karakter mentah) --
  // karakter tak terlihat gampang hilang/rusak saat disalin lewat HP.
  raw = raw.replace(new RegExp(String.fromCharCode(65279), "g"), "").trim();
  var hashtags = raw.match(/#[^\s#]+/g) || [];
  return { caption: raw, hashtags: hashtags };
}

function readIsAd() {
  // id "fkg" DIPAKAI ULANG utk >1 jenis label ("Creator labeled as
  // AI-generated" JUGA pakai id ini) -- HARUS cek isi teksnya persis,
  // bukan cuma keberadaan id-nya.
  var node = id(PROMOTIONAL_LABEL_ID).findOne(300);
  return !!(node && node.text() === PROMOTIONAL_LABEL_TEXT);
}

// Ketuk Share -> Copy link -> baca clipboard -> tutup sheet kalau masih
// terbuka. RISIKO DIKETAHUI: TikTok memuat >1 video sekaligus di
// accessibility tree (video sblm/sesudah yg sedang tampil) -- findOne()
// ambil kecocokan PERTAMA di urutan tree, BELUM diverifikasi itu selalu
// video yg sedang tampil di layar. Kalau videoId yg tertangkap ternyata
// dari video yg salah, ini titik yg perlu diperbaiki.
function captureVideoIdViaShare() {
  var shareButton = descStartsWith(SHARE_BUTTON_DESC_PREFIX).findOne(2000);
  if (!shareButton) return null;
  shareButton.click();

  var copyLink = desc(COPY_LINK_DESC).findOne(3000);
  if (!copyLink) {
    back(); // coba tutup apa pun yg terbuka drpd dibiarkan nyangkut
    return null;
  }
  setClip(""); // kosongkan dulu -- jangan sampai salah baca clipboard basi
  copyLink.click();
  sleep(500);
  var link = getClip();

  // JANGAN back() membabi-buta -- cek dulu apa sheet-nya masih ada,
  // supaya tidak keluar dari TikTok sendiri kalau sheet sudah tertutup
  // otomatis stlh Copy Link diketuk.
  if (desc(COPY_LINK_DESC).exists()) {
    back();
    sleep(300);
  }

  return link && link.length > 0 ? link : null;
}

// Balikan: object data 1 impresi (TANPA feedPosition/capturedAt, itu
// tanggung jawab session.js), ATAU null kalau videoId gagal didapat.
function captureCurrentVideo() {
  var videoId = captureVideoIdViaShare();
  if (!videoId) return null;

  var likes = readEngagementFromDesc(LIKE_DESC);
  var comments = readEngagementFromDesc(COMMENT_DESC);
  var shares = readEngagementFromDesc(SHARE_DESC);
  var saves = readSaveCount();
  var captionData = readCaptionAndHashtags();

  var rawEngagement = {};
  if (likes !== null) rawEngagement.likes = likes;
  if (comments !== null) rawEngagement.comments = comments;
  if (shares !== null) rawEngagement.shares = shares;
  // "saves" bukan field yg diproses backend (cuma likes/comments/shares
  // yg diparsing jadi kolom terstruktur) -- tetap disertakan APA ADANYA
  // di rawEngagement, tersimpan mentah, tidak dibuang.
  if (saves !== null) rawEngagement.saves = saves;

  return {
    videoId: videoId,
    rawEngagement: rawEngagement,
    hashtags: captionData.hashtags,
    isAd: readIsAd(),
    username: readUsername(), // BUKAN field kontrak ingest -- cuma utk log lokal
  };
}

module.exports = { captureCurrentVideo: captureCurrentVideo };
