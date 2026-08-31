"""
tests/smoke.py — Uji asap end-to-end dengan Playwright.

Memeriksa:
  1. Setiap rute bisa dimuat tanpa error konsol.
  2. Setiap engine simulasi bisa dipasang (mount) tanpa melempar error.
  3. Mathpad terbuka dan keyboard OS diblokir (readonly + inputmode=none).
  4. Tidak ada pemanggilan alert()/confirm()/prompt() bawaan.
  5. <body> tidak pernah scroll (kunci viewport 100vh).

Jalankan:
    python tests/smoke.py            # butuh server sudah hidup di :5173
    python tests/smoke.py --serve    # nyalakan server sendiri
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

# Konsol Windows default-nya cp1252 dan akan meledak pada karakter seperti "→".
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright belum terpasang. Jalankan:  pip install playwright && playwright install chromium")
    sys.exit(1)

BASE = "http://localhost:5173"

# Dipakai bagian 57 & 58: kedua sub-topik invers memakai panel yang sama.
PANEL_SEGERA_HADIR = """() => ({
    panel: !!document.querySelector('.soon-panel'),
    title: (document.querySelector('.soon-panel__title') || {}).textContent.trim(),
    stage: !!document.querySelector('.stage'),
    nextEnabled: !([...document.querySelectorAll('button')]
        .find(b => b.textContent.includes('Lanjut ke Mini Kuis')) || {}).disabled,
    numfields: document.querySelectorAll('.sim .numfield').length,
})"""

# ============================================================
# Skrip peramban untuk bagian regresi Fase 15 (101-103).
# ============================================================

# Perkakas bersama: dipasang sekali, dipakai ketiga bagian.
PAPAN_SIAPKAN = """
    const pad = window.__matriksLab.state.activeView.scratchpad;
    window.__padS = pad;
    const cv = document.querySelector('.pad__canvas');
    window.__padCv = cv;
    const ctx = cv.getContext('2d');
    window.__padInk = () => {
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
        return n;
    };
    window.__padPe = (x, y, t) => new PointerEvent(t, {
        bubbles: true, cancelable: true, clientX: x, clientY: y,
        pointerId: 1, pointerType: 'pen', isPrimary: true, button: 0, buttons: 1 });
    window.__padDraw = (x, y, n, dx) => {
        const r = cv.getBoundingClientRect();
        const X = r.left + x, Y = r.top + y;
        cv.dispatchEvent(window.__padPe(X, Y, 'pointerdown'));
        for (let i = 1; i <= (n || 20); i++)
            cv.dispatchEvent(window.__padPe(X + i * (dx || 7),
                Y + Math.sin(i / 3) * 18, 'pointermove'));
        cv.dispatchEvent(window.__padPe(X + (n || 20) * (dx || 7), Y, 'pointerup'));
    };
"""

PAPAN_DASAR = """() => new Promise(resolve => {
    const fab = document.querySelector('.pad-fab');
    const stage = document.querySelector('.ws-stage');
    const fr = fab ? fab.getBoundingClientRect() : null;
    const sr = stage.getBoundingClientRect();
    const out = {
        fabAda: !!fab,
        fabUkuran: fr ? [Math.round(fr.width), Math.round(fr.height)] : [0, 0],
        // Di dalam panggung, dan menempel ke sudut kanan-bawahnya.
        diDalamPanggung: !!fr && fr.right <= sr.right + 1 && fr.bottom <= sr.bottom + 1
                         && (sr.right - fr.right) < 80 && (sr.bottom - fr.bottom) < 80,
        tertutupDiAwal: document.querySelector('.pad').hidden === true,
    };

    fab.click();
    setTimeout(() => {
        """ + PAPAN_SIAPKAN + """
        const bar = document.querySelector('.pad__bar');
        const rb = bar.getBoundingClientRect();
        const padBox = document.querySelector('.pad').getBoundingClientRect();
        // Satu baris = semua grup berbagi titik tengah vertikal. Membandingkan
        // `top` saja salah: `align-items:center` membuat grup yang lebih
        // pendek (deret warna) punya `top` berbeda di baris yang sama.
        const mids = new Set([...bar.querySelectorAll('.pad__group')]
            .map(g => { const q = g.getBoundingClientRect();
                        return Math.round(q.top + q.height / 2); }));

        out.grup = [...bar.querySelectorAll('.pad__group')]
            .map(g => g.getAttribute('aria-label'));
        out.warna = bar.querySelectorAll('.pad__swatch').length;
        out.tebal = bar.querySelectorAll('.pad__width').length;
        out.satuBaris = mids.size === 1;
        out.barTerpusat =
            Math.abs((rb.left + rb.width / 2) - (padBox.left + padBox.width / 2)) <= 2;

        const cs = getComputedStyle(window.__padCv);
        out.touchAction = cs.touchAction;
        const r = window.__padCv.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        out.bufferBenar = window.__padCv.width === Math.round(r.width * dpr)
                       && window.__padCv.height === Math.round(r.height * dpr);

        window.__padDraw(90, 110, 26, 7);
        setTimeout(() => {
            const c2 = window.__padCv.getContext('2d');
            out.lineCap = c2.lineCap;
            out.lineJoin = c2.lineJoin;
            out.tintaSetelahGambar = window.__padInk();
            out.strokes = window.__padS.state.strokes;
            resolve(out);
        }, 200);
    }, 500);
})"""

PAPAN_RIWAYAT = """() => new Promise(resolve => {
    const pad = window.__padS, out = {};
    const btn = (l) => document.querySelector('[aria-label="' + l + '"]');

    window.__padDraw(90, 230, 24, 7);
    setTimeout(() => {
        const penuh = window.__padInk();

        const strokesPenuh = pad.state.strokes;
        btn('Urungkan').click();
        setTimeout(() => {
            const sesudahUndo = window.__padInk();
            out.undoMengurangi = sesudahUndo < penuh;

            btn('Ulangi').click();
            setTimeout(() => {
                const sesudahRedo = window.__padInk();
                /**
                 * Tintanya dibandingkan dengan TOLERANSI, bukan sama persis.
                 *
                 * Saat digambar langsung, tiap ruas digambar sebagai path
                 * tersendiri mengikuti gerakan jari; saat dipulihkan,
                 * `redrawAll()` menggambar seluruh goresan sebagai SATU path.
                 * Anti-aliasing kedua cara itu berbeda tipis (terukur ~2%),
                 * jadi menuntut angka yang identik akan menandai perilaku
                 * yang sebenarnya benar sebagai gagal. Yang penting: goresannya
                 * kembali utuh dan tintanya pulih ke sekitar nilai semula.
                 */
                out.redoStrokes = pad.state.strokes;
                out.redoInk = sesudahRedo;
                out.redoMengembalikan =
                    pad.state.strokes === strokesPenuh
                    && sesudahRedo > sesudahUndo
                    && Math.abs(sesudahRedo - penuh) / penuh < 0.05;

                // Penghapus harus MENGURANGI tinta, bukan menambah cat putih.
                btn('Penghapus').click();
                const sebelumHapus = window.__padInk();
                window.__padDraw(90, 230, 24, 7);
                setTimeout(() => {
                    out.penghapusMengurangi = window.__padInk() < sebelumHapus;

                    btn('Hapus semua').click();
                    setTimeout(() => {
                        out.hapusSemuaBersih = window.__padInk() === 0
                                            && pad.state.strokes === 0;

                        // 25 goresan -> undo hanya boleh mundur 20.
                        btn('Pena').click();
                        for (let i = 0; i < 25; i++)
                            window.__padDraw(50 + i * 9, 90 + (i % 5) * 40, 6, 4);
                        setTimeout(() => {
                            out.dibuat = pad.state.strokes;
                            const u = btn('Urungkan');
                            let k = 0;
                            while (!u.disabled && k < 60) { u.click(); k += 1; }
                            out.undoSejauh = k;
                            out.tersisa = pad.state.strokes;
                            out.goresanLamaSelamat =
                                pad.state.strokes > 0 && window.__padInk() > 0;
                            resolve(out);
                        }, 900);
                    }, 250);
                }, 250);
            }, 250);
        }, 250);
    }, 250);
})"""

PAPAN_INTIP = """() => new Promise(resolve => {
    const pad = window.__padS, cv = window.__padCv;
    const bar = document.querySelector('.pad__bar');
    const eye = document.querySelector('.pad__peek');
    const out = {};
    const vis = () => ({ canvas: getComputedStyle(cv).opacity,
                         bar: getComputedStyle(bar).opacity,
                         pe: getComputedStyle(cv).pointerEvents,
                         peeking: pad.state.peeking });

    document.querySelector('[aria-label="Hapus semua"]').click();
    document.querySelector('[aria-label="Pena"]').click();
    window.__padDraw(90, 120, 24, 7);

    setTimeout(() => {
        out.strokesAwal = pad.state.strokes;
        out.sebelum = vis();

        eye.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true,
            cancelable: true, pointerId: 9, isPrimary: true, button: 0 }));

        // Transisinya dinaikkan jadi 200ms di Fase 15.5 (lihat phase15.css §4),
        // jadi jedanya ikut naik 250 -> 400ms. Dengan 250ms sisa marginnya
        // tinggal 50ms — cukup untuk lolos, tidak cukup untuk bisa dipercaya.
        setTimeout(() => {
            out.saatDitahan = vis();
            const ink = window.__padInk();
            window.__padDraw(300, 400, 12, 7);      // harus DIABAIKAN
            setTimeout(() => {
                out.gambarDiabaikan = window.__padInk() === ink
                                   && pad.state.strokes === out.strokesAwal;

                // Dilepas di `window`: jaring pengaman untuk jari yang digeser
                // ke luar panggung. Pelepasan di TOMBOLNYA sendiri diuji
                // terpisah di bagian 104.
                window.dispatchEvent(new PointerEvent('pointerup',
                    { bubbles: true, pointerId: 9, isPrimary: true }));
                setTimeout(() => {
                    out.setelahLepas = vis();
                    const ink2 = window.__padInk();
                    window.__padDraw(300, 440, 12, 7);
                    setTimeout(() => {
                        out.gambarHidupLagi = window.__padInk() > ink2
                            && pad.state.strokes === out.strokesAwal + 1;
                        resolve(out);
                    }, 400);
                }, 400);
            }, 400);
        }, 400);
    }, 250);
})"""


# ============================================================
# Skrip peramban untuk bagian regresi Fase 15.5 (104).
# ============================================================

# Perkakas bersama bagian 104: pointer sintetis yang bisa MEMBAWA titik
# gabungan, sesuatu yang tidak dimiliki `__padDraw`.
PAPAN55_ALAT = """
    const cv = window.__padCv, ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const btn = (l) => document.querySelector('[aria-label="' + l + '"]');
    const pe = (x, y, t) => { const r = cv.getBoundingClientRect();
        return new PointerEvent(t, { bubbles: true, cancelable: true,
            clientX: r.left + x, clientY: r.top + y, pointerId: 1,
            pointerType: 'pen', isPrimary: true, button: 0, buttons: 1 }); };
    const garis = (y, x0, x1) => {
        cv.dispatchEvent(pe(x0, y, 'pointerdown'));
        for (let x = x0 + 20; x <= x1; x += 20) cv.dispatchEvent(pe(x, y, 'pointermove'));
        cv.dispatchEvent(pe(x1, y, 'pointerup')); };
    const tegak = (x, y0, y1) => {
        cv.dispatchEvent(pe(x, y0, 'pointerdown'));
        for (let y = y0 + 20; y <= y1; y += 20) cv.dispatchEvent(pe(x, y, 'pointermove'));
        cv.dispatchEvent(pe(x, y1, 'pointerup')); };
    const ketuk = (x, y) => { cv.dispatchEvent(pe(x, y, 'pointerdown'));
                              cv.dispatchEvent(pe(x, y, 'pointerup')); };
    const tintaBaris = (y, x0, lebar) => {
        const d = ctx.getImageData(Math.round(x0 * dpr), Math.round(y * dpr),
                                   Math.round(lebar * dpr), 1).data;
        let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
"""

# --- Bagian 1: sapuan cepat harus menghasilkan garis UTUH ---
#
# Kuncinya `getCoalescedEvents()` yang ditimpa supaya SATU peristiwa gerak
# membawa enam titik sekaligus — persis yang dilakukan peramban saat jari
# disapu cepat, dan persis yang TIDAK bisa ditiru peristiwa sintetis biasa
# (untuk peristiwa buatan, fungsi itu selalu mengembalikan array kosong).
# Tanpa penimpaan ini, pengujiannya akan lolos pada kode yang rusak sekalipun.
PAPAN55_SAPU = """() => new Promise(resolve => {
    """ + PAPAN55_ALAT + """
    btn('Hapus semua').click();
    btn('Pena').click();

    const r = cv.getBoundingClientRect();
    const Y = Math.round(r.height * 0.18);
    const x0 = Math.round(r.width * 0.08);
    const xe = Math.round(r.width * 0.55);
    const langkah = Math.round((xe - x0) / 6);
    const xs = [1, 2, 3, 4, 5, 6].map(i => x0 + i * langkah);

    const gerak = pe(xs[xs.length - 1], Y, 'pointermove');
    const gabungan = xs.map(x => pe(x, Y, 'pointermove'));
    Object.defineProperty(gerak, 'getCoalescedEvents', { value: () => gabungan });

    cv.dispatchEvent(pe(x0, Y, 'pointerdown'));
    cv.dispatchEvent(gerak);
    cv.dispatchEvent(pe(xs[xs.length - 1], Y, 'pointerup'));

    setTimeout(() => {
        const px0 = Math.round(x0 * dpr), px1 = Math.round(xs[xs.length - 1] * dpr);
        const baris = ctx.getImageData(px0, Math.round(Y * dpr), px1 - px0, 1).data;
        let celah = 0, celahMaks = 0, bertinta = 0;
        for (let i = 3; i < baris.length; i += 4) {
            if (baris[i] > 0) { bertinta++; celah = 0; }
            else { celah++; if (celah > celahMaks) celahMaks = celah; }
        }
        resolve({ strokes: window.__padS.state.strokes,
                  titikDibawa: xs.length + 1,
                  lebarPindai: px1 - px0,
                  bertinta: bertinta,
                  celahPx: Math.round(celahMaks / dpr) });
    }, 200);
})"""

# --- Bagian 2: penghapus GORESAN, bukan penghapus piksel ---
PAPAN55_HAPUS = """() => new Promise(resolve => {
    """ + PAPAN55_ALAT + """
    const pad = window.__padS, out = {};

    btn('Hapus semua').click();
    btn('Pena').click();
    garis(140, 80, 400);
    garis(260, 80, 400);

    setTimeout(() => {
        out.awal = { strokes: pad.state.strokes,
                     barisA: tintaBaris(140, 70, 350),
                     barisB: tintaBaris(260, 70, 350) };

        btn('Penghapus').click();
        ketuk(240, 400);                     // jauh dari kedua goresan
        setTimeout(() => {
            out.ketukKosong = { strokes: pad.state.strokes,
                                barisA: tintaBaris(140, 70, 350) };

            ketuk(240, 140);                 // TEPAT di atas goresan A
            setTimeout(() => {
                out.ketukDiGoresan = { strokes: pad.state.strokes,
                                       barisA: tintaBaris(140, 70, 350),
                                       barisB: tintaBaris(260, 70, 350) };

                btn('Urungkan').click();
                setTimeout(() => {
                    out.setelahUndo = { strokes: pad.state.strokes,
                                        barisA: tintaBaris(140, 70, 350) };

                    // Satu sapuan mendatar memotong TIGA garis tegak.
                    btn('Hapus semua').click();
                    btn('Pena').click();
                    tegak(120, 90, 300); tegak(200, 90, 300); tegak(280, 90, 300);
                    setTimeout(() => {
                        out.sebelumSapu = pad.state.strokes;
                        btn('Penghapus').click();
                        cv.dispatchEvent(pe(80, 200, 'pointerdown'));
                        for (let x = 100; x <= 320; x += 10)
                            cv.dispatchEvent(pe(x, 200, 'pointermove'));
                        cv.dispatchEvent(pe(320, 200, 'pointerup'));
                        setTimeout(() => {
                            out.setelahSapu = pad.state.strokes;
                            // SATU sapuan = SATU langkah undo, walau tiga
                            // goresan yang terbawa.
                            btn('Urungkan').click();
                            setTimeout(() => {
                                out.setelahSatuUndo = pad.state.strokes;
                                out.penghapusTidakMenambahGoresan =
                                    pad.state.strokes === out.sebelumSapu;
                                resolve(out);
                            }, 250);
                        }, 250);
                    }, 250);
                }, 250);
            }, 250);
        }, 250);
    }, 250);
})"""

# --- Bagian 3: kanvas PADAT & transisi mengintip ---
PAPAN55_PADAT = """() => {
    const cv = window.__padCv, cs = getComputedStyle(cv);
    return {
        latar: cs.backgroundColor,
        adaPetak: cs.backgroundImage !== 'none',
        durasi: cs.transitionDuration,
        easing: cs.transitionTimingFunction,
        opacity: cs.opacity,
    };
}"""

PAPAN55_INTIP = """() => new Promise(resolve => {
    const pad = window.__padS, cv = window.__padCv;
    const eye = document.querySelector('.pad__peek');
    const out = {};
    const ppe = (t) => new PointerEvent(t, { bubbles: true, cancelable: true,
        pointerId: 9, isPrimary: true, button: 0 });

    eye.dispatchEvent(ppe('pointerdown'));

    // Diintip di TENGAH transisi: kalau nilainya langsung 0, berarti ia
    // berpindah seketika dan bukan memudar.
    setTimeout(() => {
        out.diTengahTransisi = parseFloat(getComputedStyle(cv).opacity);
        setTimeout(() => {
            out.saatDitahan = { peeking: pad.state.peeking,
                                opacity: getComputedStyle(cv).opacity,
                                // Tombolnya WAJIB tetap bisa menerima pointer,
                                // kalau tidak `pointerup` di atasnya hilang.
                                tombolPe: getComputedStyle(eye).pointerEvents };

            eye.dispatchEvent(ppe('pointerup'));      // dilepas DI TOMBOLNYA
            setTimeout(() => {
                out.lepasDiTombol = { peeking: pad.state.peeking,
                                      opacity: getComputedStyle(cv).opacity };

                eye.dispatchEvent(ppe('pointerdown'));
                setTimeout(() => {
                    eye.dispatchEvent(new PointerEvent('pointerleave',
                        { bubbles: false, pointerId: 9 }));
                    setTimeout(() => {
                        out.lepasPointerleave = pad.state.peeking;

                        eye.dispatchEvent(ppe('pointerdown'));
                        setTimeout(() => {
                            eye.dispatchEvent(ppe('pointercancel'));
                            setTimeout(() => {
                                out.lepasPointercancel = pad.state.peeking;
                                resolve(out);
                            }, 400);
                        }, 250);
                    }, 400);
                }, 250);
            }, 400);
        }, 350);
    }, 90);
})"""

PAPAN_SIAP_RESIZE = """() => {
    document.querySelector('[aria-label="Hapus semua"]').click();
    window.__padDraw(80, 100, 26, 7);
    window.__padDraw(80, 200, 26, 7);
}"""

PAPAN_RUTE_BARU = """() => new Promise(resolve => {
    document.querySelector('.pad-fab').click();
    setTimeout(() => {
        """ + PAPAN_SIAPKAN + """
        resolve({
            strokes: window.__padS.state.strokes,
            ink: window.__padInk(),
            instances: document.querySelectorAll('.pad').length,
            fabs: document.querySelectorAll('.pad-fab').length,
        });
    }, 500);
})"""

# ============================================================
# Skrip peramban untuk bagian regresi Fase 14 (98-100).
# ============================================================

LAYAR_MUAT = r"""() => new Promise(resolve => {
    // Layar muat sudah lewat pada halaman yang sedang tampil, jadi ia diuji
    // di IFRAME yang dimuat segar — sekaligus membuktikan markupnya memang
    // ada di HTML dan tidak bergantung pada JavaScript aplikasi.
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-9999px;width:1280px;height:800px';
    frame.src = 'index.html?bootcheck=1';
    document.body.appendChild(frame);

    frame.addEventListener('load', () => {
        const d = frame.contentDocument, w = frame.contentWindow;
        const boot = d.getElementById('boot-loader');
        const out = {
            adaDiHtml: !!boot,
            sel: d.querySelectorAll('.boot__cell').length,
            kurung: d.querySelectorAll('.boot__bracket').length,
            teks: boot ? boot.querySelector('.boot__text').textContent.trim() : '',
            warna: {},
        };

        // Bekukan sel pertama pada tiga puncak warna keyframe.
        const cell = d.querySelector('.boot__cell');
        const anim = cell && cell.getAnimations()[0];
        if (anim) {
            anim.pause();
            const D = anim.effect.getTiming().duration;
            [['royal', 0.18], ['cyan', 0.40], ['yellow', 0.60]].forEach(([k, f]) => {
                anim.currentTime = D * f;
                out.warna[k] = w.getComputedStyle(cell).backgroundColor;
            });
        }

        // Tunggu aplikasinya siap, lalu pastikan loader turun & #app tampil.
        const tunggu = setInterval(() => {
            if (d.documentElement.dataset.appReady !== 'true') return;
            clearInterval(tunggu);
            setTimeout(() => {
                out.sesudahLoaderHilang = !d.getElementById('boot-loader');
                out.sesudahAppOpacity = w.getComputedStyle(d.getElementById('app')).opacity;
                frame.remove();
                resolve(out);
            }, 900);
        }, 120);
    });
})"""

PERSISTENSI_IDENTITAS = """() => new Promise(resolve => {
    window.__matriksLab.setIdentity(
        { nama: 'Budi Santoso', sekolah: 'SMAS YPVDP Bontang', at: Date.now() });

    const out = {
        diLocal: localStorage.getItem('matriksLab.identity.v1') !== null,
        diSession: sessionStorage.getItem('matriksLab.identity.v1') !== null,
    };

    // Iframe = dokumen baru yang berbagi localStorage: setara membuka tab baru
    // ATAU menyegarkan halaman. Keduanya tidak boleh memaksa masuk ulang.
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-9999px;width:1280px;height:800px';
    frame.src = 'index.html';
    document.body.appendChild(frame);

    frame.addEventListener('load', () => {
        const d = frame.contentDocument;
        const tunggu = setInterval(() => {
            if (d.documentElement.dataset.appReady !== 'true') return;
            clearInterval(tunggu);
            setTimeout(() => {
                out.hashSetelahMuatUlang = frame.contentWindow.location.hash;
                out.sapaan = (d.querySelector('.menu__title') || {}).textContent || '';
                frame.remove();
                resolve(out);
            }, 700);
        }, 120);
    });
})"""

GANTI_AKUN = r"""() => new Promise(resolve => {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    // Hitung panggilan confirm() bawaan: kontrak §5 butir 1 melarangnya.
    let bawaan = 0;
    const asli = window.confirm;
    window.confirm = function () { bawaan += 1; return true; };

    (async () => {
        sessionStorage.setItem('matriksLab.session.v1',
            JSON.stringify({ 'lesson:uji/uji': { step: 1 } }));

        const btn = document.querySelector('.btn--switch');
        const out = {
            ada: !!btn,
            aria: btn ? btn.getAttribute('aria-label') : null,
            dekatNama: !!document.querySelector('.menu__identity .menu__title'),
            progresSebelum: localStorage.getItem('matriksLab.v1') !== null,
        };
        if (!btn) { window.confirm = asli; return resolve(out); }

        btn.click(); await wait(600);
        const modal = document.querySelector('.modal');
        out.modalTampil = !!modal;
        out.tagMentah = modal
            ? /<b>|<\/b>|<span/.test(modal.querySelector('.modal__body').textContent)
            : null;

        // Batal dulu: identitas harus selamat.
        [...document.querySelectorAll('.modal__actions button')]
            .find(b => b.textContent.includes('Batal')).click();
        await wait(600);
        out.identitasSetelahBatal = localStorage.getItem('matriksLab.identity.v1') !== null;

        // Sekarang konfirmasi.
        document.querySelector('.btn--switch').click(); await wait(600);
        [...document.querySelectorAll('.modal__actions button')]
            .find(b => b.textContent.includes('Ganti Akun')).click();
        await wait(1400);

        out.identitasSetelahKonfirmasi = localStorage.getItem('matriksLab.identity.v1') !== null;
        out.posisiTerhapus = sessionStorage.getItem('matriksLab.session.v1') === null;
        out.progresBertahan = out.progresSebelum
            ? localStorage.getItem('matriksLab.v1') !== null
            : true;
        out.hashAkhir = location.hash;
        out.dialogBawaan = bawaan;
        window.confirm = asli;
        resolve(out);
    })();
})"""

# ============================================================
# Skrip peramban untuk bagian regresi Fase 13 (94-97).
# ============================================================

KLIK_BERUNTUN = """() => new Promise(resolve => {
    const view = window.__matriksLab.state.activeView;
    const sim = view.simulation || null;
    const UNIQUE = ['.verdict-panel', '.rule-result', '.sim__done-overlay',
                    '.equation-panel', '.slide-solved'];
    const idxOf = (s) => (s ? [s.index, s.stepIndex, s.slide, s.caseIndex, s.phase]
        .map(v => (typeof v === 'number' ? v : -1)) : []);
    const before = idxOf(sim);

    const targets = [...document.querySelectorAll(
        '.stage button, .stage [role="button"], .stage .drag-card, .stage .symbol-chip,'
        + ' .stage .scalar-chip, .stage .label-chip, .stage .cell--tappable,'
        + ' .stage .option, .stage .hots__card, .stage .cell')];

    // Enam ketukan beruntun, tanpa jeda: inilah yang dilakukan siswa yang
    // tidak sabar, dan inilah yang dulu menggandakan kartu vonis.
    targets.forEach((t) => {
        for (let k = 0; k < 6; k++) {
            t.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
        }
    });

    setTimeout(() => {
        const dupes = {};
        UNIQUE.forEach((sel) => {
            const n = document.querySelectorAll(sel).length;
            if (n > 1) dupes[sel] = n;
        });
        resolve({ targets: targets.length, before, after: idxOf(sim), dupes,
                  explains: document.querySelectorAll('.stage .explain').length });
    }, 1300);
})"""

SPAM_SINGULAR = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const before = sim.index;
    const item = sim.config.cases[sim.index];
    // Cari tombol yang BENAR untuk kasus ini, lalu tekan enam kali.
    const btns = [...document.querySelectorAll('.stage button')];
    const det = item.matrix[0][0] * item.matrix[1][1] - item.matrix[0][1] * item.matrix[1][0];
    const singular = Math.abs(det) < 1e-10;
    const target = btns.find(b => b.textContent.trim() ===
        (singular ? 'Singular' : 'Non-Singular'));
    for (let k = 0; k < 6; k++) target.click();
    setTimeout(() => resolve({
        panels: document.querySelectorAll('.verdict-panel').length,
        allLocked: btns.every(b => b.disabled || b.classList.contains('is-locked')),
        advanced: sim.index - before,
    }), 900);
})"""

SPAM_SIFAT = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const pair = sim.config.pairs[sim.index];
    const chips = [...document.querySelectorAll('.symbol-chip')];
    const slot = document.querySelector('.equation__slot');
    // Ketuk chip yang benar lalu slot-nya, berkali-kali beruntun.
    const wantNe = pair.answer !== '=';
    const chip = wantNe ? chips[1] : chips[0];
    for (let k = 0; k < 6; k++) {
        chip.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
        slot.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    }
    setTimeout(() => resolve({
        proofs: document.querySelectorAll('.stage .explain').length,
        chipsLocked: chips.every(c => c.classList.contains('is-locked')
                                   || c.classList.contains('is-failed')),
    }), 1000);
})"""

KOMBINASI_HIBRIDA = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const tap = (el) => el && el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    const mats = () => [...document.querySelectorAll('.stage .matrix')];
    const cell = (mi, i, j) => mats()[mi].querySelector(
        '.cell[data-row="' + i + '"][data-col="' + j + '"]');

    // Seretan sungguhan lewat Pointer Events - bukan klik yang disamarkan.
    const pe = (x, y) => ({ bubbles: true, cancelable: true, composed: true,
                            clientX: x, clientY: y, pointerId: 7,
                            pointerType: 'mouse', button: 0, isPrimary: true });
    const drag = (from, to) => {
        const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        from.dispatchEvent(new PointerEvent('pointerdown',
            pe(a.left + a.width / 2, a.top + a.height / 2)));
        document.dispatchEvent(new PointerEvent('pointermove',
            pe(b.left + b.width / 2, b.top + b.height / 2)));
        document.dispatchEvent(new PointerEvent('pointerup',
            pe(b.left + b.width / 2, b.top + b.height / 2)));
    };

    const chip = document.querySelector('.scalar-chip');
    const out = {
        meetPoints: document.querySelectorAll('.meetpoint').length,
        usesPairEngine: typeof sim.attachPairEngine === 'function',
        chipDraggable: chip ? chip.dataset.draggable : null,
        chipText: chip ? chip.textContent.trim() : null,
        dropzonesPhase1: document.querySelectorAll(
            '.stage .matrix .cell[data-dropzone-id]').length,
        awaitingPhase1: document.querySelectorAll('.stage .cell--awaiting').length,
    };

    (async () => {
        // TAHAP 1a - jalur SERET.
        drag(chip, cell(0, 0, 0));
        await wait(1100);
        out.dragResult = cell(0, 0, 0).dataset.value;

        // TAHAP 1b - jalur KETUK (ketuk chip, lalu ketuk sel).
        tap(chip); await wait(260); tap(cell(0, 0, 1)); await wait(1100);
        out.tapResult = cell(0, 0, 1).dataset.value;
        out.doneAfterTap = sim.scalarDone.size;
        out.chipReusable = chip.dataset.dragDisabled !== 'true';

        // Selesaikan sisa tahap 1.
        for (const [i, j] of [[1, 0], [1, 1]]) {
            tap(chip); await wait(200); tap(cell(0, i, j)); await wait(950);
        }
        await wait(700);

        // Peralihan harus membongkar tahap 1 dengan tuntas.
        out.phase = sim.phase;
        out.scaledA = [...sim.viewA.cells.values()].map(x => x.dataset.value).join(',');
        out.dropzonesAfterPhase1 = document.querySelectorAll('.stage [data-dropzone-id]').length;
        out.cleanupsLeft = sim.scalarCleanups.length;
        out.chipLocked = chip.classList.contains('is-locked');
        out.chipPointerEvents = getComputedStyle(chip).pointerEvents;
        out.awaitingAfterPhase1 = document.querySelectorAll('.stage .cell--awaiting').length;

        // TAHAP 2 - ketuk-ketuk berpasangan.
        tap(cell(0, 0, 0)); await wait(420);
        out.partnerLit = cell(1, 0, 0).classList.contains('cell--pulse');
        out.muted = document.querySelectorAll('.stage .cell--muted').length;
        tap(cell(1, 0, 0)); await wait(1100);
        out.expr = (cell(2, 0, 0).querySelector('.cell__expr') || {}).textContent || '';

        const btn = document.querySelector('.workstrip__confirm');
        tap(btn); tap(btn); tap(btn);
        await wait(1200);
        out.cellText = cell(2, 0, 0).textContent;
        out.completed = sim.completed.size;
        resolve(out);
    })();
})"""

PUSAT_PANGGUNG = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    sim.complete('Uji penempatan');
    setTimeout(() => {
        const c = (e) => { const r = e.getBoundingClientRect(); return r.left + r.width / 2; };
        const stage = document.querySelector('.stage');
        const col = document.querySelector('.ws-stage');
        const ov = document.querySelector('.sim__done-overlay');
        const host = document.querySelector('.toast-host');
        const rs = stage.getBoundingClientRect();
        const ro = ov ? ov.getBoundingClientRect() : null;
        resolve({
            overlayOffset: ov ? Math.round(Math.abs(c(ov) - c(stage))) : 999,
            overlayInside: ro ? (ro.left >= rs.left - 1 && ro.right <= rs.right + 1) : false,
            toastOffset: host ? Math.round(Math.abs(c(host) - c(stage))) : 999,
            contentVsColumn: Math.round(Math.abs(c(stage) - c(col))),
        });
    }, 800);
})"""

# ============================================================
# Skrip peramban untuk bagian regresi Fase 12 (87-93).
# ============================================================

TATA_LETAK_LABEL = """() => {
    const target = document.querySelector('.label-target');
    const shelf = document.querySelector('.label-shelf');
    const pool = document.querySelector('.label-pool');
    const mx = document.querySelector('.label-target .matrix');
    if (!target || !shelf || !pool || !mx) return { found: false };
    const rs = shelf.getBoundingClientRect(), rm = mx.getBoundingClientRect();
    const chips = [...document.querySelectorAll('.label-chip')];
    const tops = new Set(chips.map(c => Math.round(c.getBoundingClientRect().top)));
    const rp = pool.getBoundingClientRect();
    return {
        found: true,
        overlap: (Math.min(rs.right, rm.right) - Math.max(rs.left, rm.left) > 2)
              && (Math.min(rs.bottom, rm.bottom) - Math.max(rs.top, rm.top) > 2),
        shelfBelow: rs.top >= rm.bottom - 1,
        poolRows: tops.size,
        poolFits: rp.left >= 0 && rp.right <= window.innerWidth + 1,
        minChipHeight: Math.min(...chips.map(c => Math.round(c.getBoundingClientRect().height))),
    };
}"""

TAMBATAN_TOAST = """() => new Promise(resolve => {
    // Ketuk sel sumber sebelum memilih sel hasil -> penolakan -> toast.
    const m = [...document.querySelectorAll('.stage .matrix')];
    m[0].querySelector('.cell').dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    setTimeout(() => {
        const host = document.querySelector('.toast-host');
        // Patokannya kanvas ISI, bukan kotak KOLOM.
        //
        // `.ws-stage` memakai margin kanan negatif agar scrollbar-nya memeluk
        // tepi layar, jadi titik tengah kotaknya ~12px di kanan sumbu isi.
        // Sampai Fase 12 uji ini memakai kolom sebagai patokan dan karena itu
        // MENGESAHKAN toast yang sebenarnya meleset dari matriksnya.
        const stage = document.querySelector('.stage');
        const col = document.querySelector('.ws-stage');
        if (!host || !stage || !col) return resolve({ toasts: 0 });
        const h = host.getBoundingClientRect(), st = stage.getBoundingClientRect();
        const cl = col.getBoundingClientRect();
        const hc = h.left + h.width / 2, sc = st.left + st.width / 2;
        resolve({
            toasts: document.querySelectorAll('.toast').length,
            offsetFromStage: Math.round(Math.abs(hc - sc)),
            stageVsWindow: Math.round(Math.abs(sc - window.innerWidth / 2)),
            withinStage: h.left >= cl.left - 1 && h.right <= cl.right + 1,
        });
    }, 600);
})"""

MULTI_KASUS_TUNTAS = """() => new Promise(resolve => {
    const sim = () => window.__matriksLab.state.activeView.simulation;
    const mats = () => [...document.querySelectorAll('.stage .matrix')];
    const cell = (mi, i, j) => mats()[mi].querySelector(
        '.cell[data-row="' + i + '"][data-col="' + j + '"]');
    const tap = (el) => el && el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    (async () => {
        // Tuntaskan SELURUH Kasus 1 - di sinilah complete() dipanggil.
        for (const [i, j] of sim().cellOrder.slice()) {
            tap(cell(2, i, j)); await wait(220);
            const need = sim().activeMatrixA[0].length;
            let spin = 0;
            while (sim().terms.length < need || sim().terms.some(t => t.b == null)) {
                if (++spin > 12) break;
                const open = sim().terms.length
                    && sim().terms[sim().terms.length - 1].b == null;
                const k = open ? sim().terms.length - 1 : sim().terms.length;
                tap(open ? cell(1, k, j) : cell(0, i, k));
                await wait(130);
                tap(cell(2, i, j));
                await wait(680);
            }
            tap(document.querySelector('.workstrip__confirm'));
            await wait(900);
        }

        const case1Complete = sim().completedCells.size === sim().total;
        const finished = sim().finished;
        const lockedAfterCase1 = sim().root.classList.contains('sim--done');

        // Kasus 2 harus tetap hidup.
        document.querySelectorAll('.case-chip')[1].click(); await wait(800);
        const src = mats()[0].querySelector('.cell');
        const r = src.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        tap(cell(2, 0, 0)); await wait(260);
        tap(cell(0, 0, 0)); await wait(140); tap(cell(2, 0, 0)); await wait(900);
        const case2Terms = sim().terms.length;
        const case2PointerEvents = getComputedStyle(src).pointerEvents;
        const case2HitTest = !!(hit && (hit === src || src.contains(hit)));

        // Tuntaskan sel Kasus 2 agar boleh berpindah, lalu kembali ke Kasus 1.
        const need2 = sim().activeMatrixA[0].length;
        const ci = sim().activeCell.i, cj = sim().activeCell.j;
        let spin2 = 0;
        while (sim().terms.length < need2 || sim().terms.some(t => t.b == null)) {
            if (++spin2 > 12) break;
            const open = sim().terms.length
                && sim().terms[sim().terms.length - 1].b == null;
            const k = open ? sim().terms.length - 1 : sim().terms.length;
            tap(open ? cell(1, k, cj) : cell(0, ci, k));
            await wait(140); tap(cell(2, ci, cj)); await wait(760);
        }
        tap(document.querySelector('.workstrip__confirm')); await wait(1000);

        document.querySelectorAll('.case-chip')[0].click(); await wait(900);
        const back = cell(2, 0, 0);
        resolve({
            case1Complete, finished, lockedAfterCase1,
            case2Terms, case2PointerEvents, case2HitTest,
            backComplete: sim().completedCells.size,
            backCellDone: back.classList.contains('cell--done'),
        });
    })();
})"""

SARRUS_SALINAN = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const tap = (el) => el && el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    const btn = [...document.querySelectorAll('.stage button')]
        .find(b => b.textContent.includes('Salin Dua Kolom'));
    tap(btn);
    setTimeout(() => {
        const copies = [...sim.cells.entries()]
            .filter(([k]) => Number(k.split(',')[1]) >= 3).map(([, c]) => c);
        // Diagonal pertama seluruhnya di matriks asli; lewati dulu.
        ['0,0', '1,1', '2,2'].forEach((k, i) => setTimeout(() => tap(sim.cells.get(k)), i * 260));
        setTimeout(() => {
            const wanted = sim.wantedKeys();
            const copyCells = wanted.filter(k => Number(k.split(',')[1]) >= 3)
                .map(k => sim.cells.get(k));
            const origCells = wanted.filter(k => Number(k.split(',')[1]) < 3)
                .map(k => sim.cells.get(k));
            const nameOf = (c) => { const a = c.getAnimations()[0]; return a ? a.animationName : null; };
            resolve({
                stillGhost: copies.filter(c => c.classList.contains('cell--ghost')).length,
                marked: copies.filter(c => c.classList.contains('cell--copy')).length,
                copyCount: copyCells.length,
                sameAnimation: copyCells.length > 0 && origCells.length > 0
                    && copyCells.every(c => nameOf(c) === nameOf(origCells[0])
                                         && String(nameOf(c)).endsWith('Fill')),
                opacity: copyCells.length ? getComputedStyle(copyCells[0]).opacity : null,
            });
        }, 3200);
    }, 2400);
})"""

KUNCI_KESAMAAN = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const tap = (el) => el && el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    const dead = () => [...sim.leftCells.values()]
        .filter(c => getComputedStyle(c).pointerEvents === 'none').length;
    const first = sim.leftCells.get('0,0');
    tap(first);
    setTimeout(() => {
        const lockedWhilePending = dead();
        const rightAlive = [...sim.rightCells.values()]
            .every(c => getComputedStyle(c).pointerEvents !== 'none');
        tap(first);                                  // ketuk lagi = batal
        setTimeout(() => resolve({
            totalLeft: sim.leftCells.size,
            lockedWhilePending, rightAlive,
            lockedAfterCancel: dead(),
            pendingCleared: !sim.pending,
        }), 420);
    }, 420);
})"""

ANTI_SPAM = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const item = sim.config.cases[sim.index];
    const btns = [...document.querySelectorAll('.stage .btn--lg')];
    const before = sim.index;
    btns[item.answerIndex].click();
    btns[item.answerIndex].click();
    btns[item.answerIndex].click();
    setTimeout(() => resolve({
        buttons: btns.length,
        allDisabled: btns.every(b => b.disabled),
        advancedOnce: sim.index === before + 1,
    }), 400);
})"""

HOTS_KETUK = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    const problem = sim.config.problems[sim.index];
    const cardsBefore = document.querySelectorAll('.hots__card').length;
    const out = {
        questionOnStage: !!document.querySelector('.hots__question'),
        questionText: (document.querySelector('.hots__text') || {}).textContent || '',
        cardsBefore,
        draggables: document.querySelectorAll('.stage [data-draggable]').length,
        dropzones: document.querySelectorAll('.stage [data-dropzone-id]').length,
    };
    const wrongIdx = sim.config.rules.findIndex(r => r.key !== problem.rule);
    const cards = [...document.querySelectorAll('.hots__card')];
    cards[wrongIdx].dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    setTimeout(() => {
        out.errorToast = !!document.querySelector('.toast--error');
        out.cardsAfterWrong = document.querySelectorAll('.hots__card').length;
        resolve(out);
    }, 900);
})"""

# ============================================================
# Skrip peramban untuk bagian regresi Fase 11 (bagian 77-86).
# Dipisahkan dari alur uji supaya blok JS yang panjang tidak
# mengaburkan urutan langkahnya.
# ============================================================

RENDER_ULANG_SLIDER = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    for (let i = 0; i < 4; i++) { sim.buildCase(); }
    setTimeout(() => resolve({
        sliders: document.querySelectorAll('.slider__nav').length,
        dots: document.querySelectorAll('.slider-dots').length,
    }), 400);
})"""

KETUK_KETUK_JUMLAH = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    sim.ordoUnderstood = true; sim.slide = 1; sim.renderSlide();
    setTimeout(() => {
        const stage = document.querySelector('.stage');
        const mats = [...stage.querySelectorAll('.matrix')];
        const cell = (mi, i, j) => mats[mi].querySelector(
            '.cell[data-row="' + i + '"][data-col="' + j + '"]');
        const out = {
            draggables: stage.querySelectorAll('[data-draggable]').length,
            dropzones: stage.querySelectorAll('[data-dropzone-id]').length,
            tappables: stage.querySelectorAll('.cell--tappable').length,
        };
        cell(0, 0, 0).click();
        setTimeout(() => {
            out.partnerLit = cell(1, 0, 0).classList.contains('cell--pulse');
            out.muted = stage.querySelectorAll('.cell--muted').length;
            cell(1, 0, 0).click();
            setTimeout(() => {
                const target = cell(2, 0, 0);
                out.expr = (target.querySelector('.cell__expr') || {}).textContent || '';
                out.building = target.classList.contains('cell--building');
                resolve(out);
            }, 1100);
        }, 300);
    }, 500);
})"""

BUNUH_GERAK = """() => new Promise(resolve => {
    const chip = document.createElement('div');
    chip.className = 'fly-chip'; document.body.appendChild(chip);
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost'; document.body.appendChild(ghost);
    document.body.classList.add('is-tap-armed');
    if (window.gsap) window.gsap.to(chip, { duration: 30, x: 900 });
    const before = {
        tweens: window.gsap ? window.gsap.globalTimeline.getChildren().length : 0,
        chips: document.querySelectorAll('.fly-chip').length,
    };
    location.hash = '#/';
    setTimeout(() => resolve({
        before: before,
        tweens: window.gsap ? window.gsap.globalTimeline.getChildren().length : 0,
        chips: document.querySelectorAll('.fly-chip').length,
        ghosts: document.querySelectorAll('.drag-ghost, .cue-layer, .cue-hand').length,
        armed: document.body.classList.contains('is-tap-armed'),
    }), 600);
})"""

TIMER_BERJEJAK = """() => new Promise(resolve => {
    const sim = window.__matriksLab.state.activeView.simulation;
    window.__fired = false;
    sim.later(() => { window.__fired = true; }, 500);
    const pending = sim.timers.size;
    sim.destroy();
    setTimeout(() => resolve({
        pending: pending,
        after: sim.timers.size,
        fired: window.__fired,
        destroyed: sim.destroyed,
    }), 900);
})"""

MULTI_KASUS = """() => new Promise(resolve => {
    const stage = () => document.querySelector('.stage');
    const mats = () => [...stage().querySelectorAll('.matrix')];
    const cell = (mi, i, j) => mats()[mi].querySelector(
        '.cell[data-row="' + i + '"][data-col="' + j + '"]');
    const tap = (el) => el && el.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    (async () => {
        tap(cell(2, 0, 0)); await wait(250);
        tap(cell(0, 0, 0)); await wait(150); tap(cell(2, 0, 0)); await wait(800);
        tap(cell(1, 0, 0)); await wait(150); tap(cell(2, 0, 0)); await wait(800);
        tap(cell(0, 0, 1)); await wait(150); tap(cell(2, 0, 0)); await wait(800);
        tap(cell(1, 1, 0)); await wait(150); tap(cell(2, 0, 0)); await wait(800);
        tap(document.querySelector('.workstrip__confirm')); await wait(1100);

        const solvedText = cell(2, 0, 0).textContent;
        const chips = [...document.querySelectorAll('.case-chip')];

        chips[1].click(); await wait(700);
        tap(cell(2, 0, 0)); await wait(250);
        const sim = window.__matriksLab.state.activeView.simulation;
        const targetPicked = !!sim.activeCell;
        tap(cell(0, 0, 0)); await wait(150); tap(cell(2, 0, 0)); await wait(900);
        const termsInCase2 = sim.terms.length;
        const slidersInCase2 = document.querySelectorAll('.slider__nav').length;

        // Berpindah kasus DITOLAK selama satu sel masih setengah dikerjakan.
        // Itu perilaku yang memang diminta, jadi dipastikan di sini.
        chips[0].click(); await wait(400);
        const refusedMidBuild = sim.caseIndex === 1;

        // Tuntaskan sel Kasus 2 secara generik: berapa pun ordonya, suku
        // dibangun berpasangan (elemen baris dari A, lalu kolom dari B).
        const need = sim.activeMatrixA[0].length;
        const ci = sim.activeCell.i, cj = sim.activeCell.j;
        let spin = 0;
        while (sim.terms.length < need || sim.terms.some(t => t.b == null)) {
            if (++spin > 12) break;
            const openTerm = sim.terms.length
                && sim.terms[sim.terms.length - 1].b == null;
            const k = openTerm ? sim.terms.length - 1 : sim.terms.length;
            tap(openTerm ? cell(1, k, cj) : cell(0, ci, k));
            await wait(150);
            tap(cell(2, ci, cj));
            await wait(800);
        }
        tap(document.querySelector('.workstrip__confirm')); await wait(1200);
        const case2Solved = cell(2, ci, cj).classList.contains('cell--done');

        // Sekarang barulah kembali ke Kasus 1.
        chips[0].click(); await wait(900);
        const backToCase1 = sim.caseIndex === 0;
        const back = cell(2, 0, 0);
        resolve({
            solvedText: solvedText,
            targetPicked: targetPicked,
            termsInCase2: termsInCase2,
            slidersInCase2: slidersInCase2,
            refusedMidBuild: refusedMidBuild,
            case2Solved: case2Solved,
            backToCase1: backToCase1,
            restoredText: back.textContent,
            restoredDone: back.classList.contains('cell--done'),
            restoredInvite: back.classList.contains('cell--invite'),
            saved: JSON.parse(sessionStorage.getItem('matriksLab.session.v1') || '{}')
                ['lesson:02_operasi_aljabar/perkalian_matriks'] || {},
        });
    })();
})"""

ULANGI_SIMULASI = """() => new Promise(resolve => {
    const btn = [...document.querySelectorAll('button')]
        .find(b => b.textContent.includes('Ulangi Simulasi'));
    if (!btn) return resolve({ found: false });
    btn.click();
    setTimeout(() => {
        const sim = window.__matriksLab.state.activeView.simulation;
        const saved = JSON.parse(sessionStorage.getItem('matriksLab.session.v1') || '{}')
            ['lesson:02_operasi_aljabar/perkalian_matriks'] || {};
        resolve({
            found: true,
            progress: sim.caseProgress ? sim.caseProgress.size : -1,
            simState: saved.simState,
            emptyCells: document.querySelectorAll('.stage .cell--done').length,
        });
    }, 1200);
})"""

PENJAGA_MASUK = """() => new Promise(resolve => {
    const home = document.querySelector('[data-role="home"]');
    const out = {
        bootHash: location.hash,
        homeDisabled: home ? home.disabled : null,
        homeHidden: home ? getComputedStyle(home).visibility === 'hidden' : null,
        ringHidden: getComputedStyle(
            document.querySelector('.header-center')).visibility === 'hidden',
    };
    if (home) home.click();
    setTimeout(() => {
        out.afterHomeClick = location.hash;
        const routes = ['#/', '#/belajar', '#/kuis', '#/tka', '#/belajar/01_konsep_dasar'];
        let i = 0;
        const step = () => {
            if (i >= routes.length) return resolve(out);
            location.hash = routes[i];
            setTimeout(() => { out['deep' + routes[i]] = location.hash; i++; step(); }, 260);
        };
        step();
    }, 400);
})"""

GULIR_DAFTAR = """() => new Promise(resolve => {
    const body = document.querySelector('.workspace__body');
    if (!body) return resolve({ found: false });
    const cs = getComputedStyle(body);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => {
        const kids = [...body.querySelectorAll(
            '.chapter-item, .chapter-card, .subtopic-item, .bank-card, .quiz-bank-card')];
        const last = kids[kids.length - 1];
        const br = body.getBoundingClientRect();
        let visible = null, clickable = null;
        if (last) {
            const lr = last.getBoundingClientRect();
            visible = lr.bottom <= br.bottom + 1;
            const hit = document.elementFromPoint(
                lr.left + lr.width / 2, lr.top + Math.min(lr.height, 30) / 2);
            clickable = !!(hit && (hit === last || last.contains(hit)));
        }
        resolve({ found: true, overflowY: cs.overflowY,
                  scrollH: body.scrollHeight, clientH: body.clientHeight,
                  scrolled: body.scrollTop, items: kids.length,
                  lastVisible: visible, lastClickable: clickable });
    }, 350);
})"""

UKUR_PANGGUNG = """() => {
    const cell = document.querySelector('.ws-stage .cell');
    const stage = document.querySelector('.ws-stage .stage');
    const r = cell ? cell.getBoundingClientRect() : null;
    return {
        cellW: r ? +r.width.toFixed(1) : 0,
        cellH: r ? +r.height.toFixed(1) : 0,
        font: cell ? parseFloat(getComputedStyle(cell).fontSize) : 0,
        stageH: stage ? +stage.getBoundingClientRect().height.toFixed(1) : 0,
        hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
}"""

UKUR_KARTU_KUIS = """() => {
    const el = document.querySelector('.quiz-slider');
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return { found: true, width: +r.width.toFixed(1),
             skew: +Math.abs(r.left - (innerWidth - r.right)).toFixed(1) };
}"""

DENYUT_LATAR = """() => new Promise(resolve => {
    const stage = document.querySelector('.stage');
    const mats = [...stage.querySelectorAll('.matrix')];
    const target = mats[2].querySelector('.cell[data-row="0"][data-col="0"]');
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
    setTimeout(() => {
        const lum = (c) => {
            const v = c.match(/[0-9.]+/g).slice(0, 3).map(Number).map(x => {
                x /= 255;
                return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
        };
        const ratio = (a, b) => {
            const l1 = lum(a), l2 = lum(b);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        const roles = {
            blue: document.querySelector('.cell--row-hl'),
            magenta: document.querySelector('.cell--col-hl'),
            amber: document.querySelector('.cell--target'),
        };
        const out = {};
        Object.entries(roles).forEach(([k, el]) => {
            if (!el) { out[k] = null; return; }
            // Bekukan animasi pada puncak denyut (50%) untuk mengambil latar
            // TERPEKAT - di situlah kontras paling tertekan.
            const anim = el.getAnimations()[0];
            if (anim) { anim.pause(); anim.currentTime = anim.effect.getTiming().duration / 2; }
            const cs = getComputedStyle(el);
            out[k] = { name: anim ? anim.animationName : null,
                       bg: cs.backgroundColor, fg: cs.color,
                       contrast: +ratio(cs.color, cs.backgroundColor).toFixed(2) };
        });
        resolve(out);
    }, 600);
})"""

ROOT = Path(__file__).resolve().parent.parent

SUBTOPICS = [
    ("01_konsep_dasar", ["pengertian_letak", "ordo_matriks", "jenis_matriks", "transpose", "kesamaan_matriks"]),
    ("02_operasi_aljabar", ["penjumlahan_pengurangan", "perkalian_skalar", "kombinasi_operasi", "ordo_perkalian", "perkalian_matriks", "sifat_operasi"]),
    ("03_determinan_invers", ["determinan_2x2", "determinan_3x3", "singular_nonsingular", "sifat_determinan", "invers_2x2", "invers_3x3", "persamaan_matriks"]),
    ("04_pemodelan_tka", ["translasi_data", "spldv_matriks", "spltv_matriks", "analisis_multi_kondisi"]),
]

results = []


def dismiss_pad(page):
    """Tutup Mathpad kalau masih terbuka — scrim-nya memblokir klik berikutnya."""
    page.keyboard.press("Escape")
    page.wait_for_timeout(250)


def clear_session(page):
    """
    Buang ingatan POSISI sesi (Fase 8) — dan hanya itu.

    Sejak Fase 8 aplikasi mengingat langkah terakhir siswa di sessionStorage,
    jadi kunjungan berikutnya mendarat di sana — bukan di Materi. Bagian uji
    yang memang ingin memulai dari nol harus menyatakannya secara eksplisit.

    Sejak Fase 14 identitas pindah ke localStorage, jadi `sessionStorage.clear()`
    tidak bisa lagi menyentuhnya — fungsi ini kembali sesederhana namanya.
    (Di Fase 11–13 ia harus menyelamatkan identitas dari sessionStorage lebih
    dulu, karena penjaga rute akan melempar uji ke #/login begitu identitas
    hilang di tengah sesi.)
    """
    page.evaluate("() => { try { sessionStorage.clear(); } catch (e) {} }")


def open_fresh(page, route):
    """Buka sebuah rute dari kondisi bersih: tanpa ingatan posisi."""
    clear_session(page)
    page.goto(f"{BASE}/{route}")
    page.reload()
    page.wait_for_timeout(800)


def record(name, ok, detail=""):
    results.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    line = f"  [{mark}] {name}"
    if detail and not ok:
        line += f"\n         → {detail}"
    print(line)


def run(page, errors):
    # --- Blokir dialog native: kalau terpanggil, uji harus gagal ---
    page.add_init_script("""
        window.__nativeDialogCalls = [];
        ['alert','confirm','prompt'].forEach(function (fn) {
            window[fn] = function () {
                window.__nativeDialogCalls.push(fn);
                return fn === 'confirm' ? false : null;
            };
        });
    """)

    print("\n1. Rute utama")
    for route, label in [("#/", "Main Menu"), ("#/belajar", "Daftar Bab"),
                         ("#/tka", "Simulasi TKA"), ("#/kuis", "Menu Kuis"),
                         ("#/login", "Layar Masuk")]:
        errors.clear()
        page.goto(f"{BASE}/{route}")
        page.wait_for_selector("[data-app-ready='true']", timeout=8000)
        page.wait_for_timeout(500)
        record(f"Rute {label}", not errors, "; ".join(errors[:3]))

    print("\n2. Simulasi tiap sub-topik")
    for chapter, subs in SUBTOPICS:
        for sub in subs:
            errors.clear()
            page.goto(f"{BASE}/#/belajar/{chapter}/{sub}")
            page.wait_for_timeout(700)

            # Materi → Simulasi
            btn = page.query_selector("button:has-text('Mulai Simulasi')")
            if btn:
                btn.click()
                page.wait_for_timeout(900)

            has_stage = page.query_selector(".stage, .sim, .checklist") is not None
            ok = has_stage and not errors
            record(f"Simulasi {chapter}/{sub}", ok, "; ".join(errors[:2]) or "panggung tidak dirender")

    print("\n3. Mathpad memblokir keyboard OS")
    errors.clear()
    page.goto(f"{BASE}/#/kuis/latihan_bab/01_konsep_dasar")
    page.wait_for_timeout(800)

    field = page.query_selector(".numfield")
    if field:
        attrs = page.evaluate("""() => {
            const i = document.querySelector('.numfield');
            return { readOnly: i.readOnly, inputmode: i.getAttribute('inputmode') };
        }""")
        record("Field angka readonly", attrs["readOnly"] is True, str(attrs))
        record("Field angka inputmode=none", attrs["inputmode"] == "none", str(attrs))

        field.click()
        page.wait_for_timeout(400)
        pad_open = page.evaluate("() => { const p = document.querySelector('.mathpad'); return p && p.dataset.open; }")
        record("Mathpad terbuka saat field diketuk", pad_open == "true", f"data-open={pad_open}")
        dismiss_pad(page)
    else:
        record("Field angka ditemukan", False, "tidak ada .numfield pada soal pertama")

    print("\n4. Tidak ada dialog native")
    calls = page.evaluate("() => window.__nativeDialogCalls || []")
    record("alert/confirm/prompt tidak dipanggil", len(calls) == 0, f"terpanggil: {calls}")

    print("\n5. Kunci viewport 100vh")
    page.goto(f"{BASE}/#/")
    page.wait_for_timeout(600)
    overflow = page.evaluate("""() => ({
        bodyScroll: document.body.scrollHeight > document.body.clientHeight + 2,
        htmlOverflow: getComputedStyle(document.documentElement).overflow
    })""")
    record("Body tidak scroll", overflow["bodyScroll"] is False, json.dumps(overflow))
    record("html overflow hidden", overflow["htmlOverflow"] == "hidden", json.dumps(overflow))

    # ============================================================
    # Fase 4 — pemolesan premium
    # ============================================================
    print("\n6. Tema Blueprint gelap & kontras")
    design = page.evaluate("""() => {
        const cs = getComputedStyle(document.documentElement);
        const bg = cs.getPropertyValue('--bg-canvas').trim();
        const ink = cs.getPropertyValue('--ink-900').trim();
        const body = getComputedStyle(document.body);
        const blobs = document.querySelectorAll('.backdrop .blob').length;
        const heading = getComputedStyle(document.querySelector('h1, h2, .menu__title') || document.body).fontFamily;
        return { bg, ink, blobs, heading, theme: document.documentElement.dataset.theme || '' };
    }""")
    record("Kanvas kertas terang (#EFF4FF)", design["bg"].lower() == "#eff4ff", json.dumps(design))
    record("Teks tinta gelap (#0A1B45)", design["ink"].lower() == "#0a1b45", json.dumps(design))
    record("Latar blob terpasang (tiga bidang)", design["blobs"] == 3, json.dumps(design))
    record("Judul memakai Montserrat", "Montserrat" in design["heading"], json.dumps(design))

    grid = page.evaluate("""() => {
        const s = getComputedStyle(document.body, '::before');
        return { img: s.backgroundImage.slice(0, 40), size: s.backgroundSize };
    }""")
    record("Pola grid blueprint aktif", "gradient" in grid["img"], json.dumps(grid))

    print("\n7. Hero 'Lanjutkan Belajar'")
    hero = page.evaluate("""() => ({
        panels: document.querySelectorAll('.hero__panel').length,
        snippet: !!document.querySelector('.hero__snippet'),
        stats: document.querySelectorAll('.hero-stat').length
    })""")
    record("Hero dua panel", hero["panels"] == 2, json.dumps(hero))
    record("Cuplikan materi tampil", hero["snippet"] is True, json.dumps(hero))
    record("Kartu statistik tampil", hero["stats"] == 3, json.dumps(hero))

    print("\n8. Tidak ada tautan teks telanjang")
    naked = page.evaluate("""() => {
        const bad = [];
        document.querySelectorAll('button').forEach(b => {
            if (!b.offsetParent) return;
            const cs = getComputedStyle(b);
            const flat = cs.backgroundColor === 'rgba(0, 0, 0, 0)' &&
                         cs.borderTopWidth === '0px' &&
                         cs.backgroundImage === 'none';
            if (flat && b.textContent.trim()) bad.push(b.textContent.trim().slice(0, 24));
        });
        return bad;
    }""")
    record("Semua tombol punya kotak/batas", len(naked) == 0, f"tanpa kotak: {naked}")

    print("\n9. Materi di dalam kartu solid")
    page.goto(f"{BASE}/#/belajar/01_konsep_dasar/pengertian_letak")
    page.wait_for_timeout(800)
    card = page.evaluate("""() => {
        const c = document.querySelector('.content-card');
        if (!c) return { found: false };
        const cs = getComputedStyle(c);
        return { found: true, bg: cs.backgroundColor, opaque: !cs.backgroundColor.includes('rgba(0, 0, 0, 0)') };
    }""")
    record("Materi dibungkus kartu opak", card.get("found") and card.get("opaque"), json.dumps(card))

    print("\n10. Simulasi: warna + denyut + slider")
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(900)

    sim = page.evaluate("""() => {
        const hl = document.querySelector('.cell--row-hl, .cell--col-hl, .cell--pulse, .cell--diag-main');
        return {
            legend: !!document.querySelector('.color-legend'),
            dots: document.querySelectorAll('.slider-dot').length,
            pulseAnim: hl ? getComputedStyle(hl).animationName : 'none',
            promptText: (document.querySelector('.sim__prompt') || {}).textContent || ''
        };
    }""")
    record("Legenda warna tampil", sim["legend"] is True, json.dumps(sim))
    record("Titik slider langkah tampil", sim["dots"] >= 2, json.dumps(sim))
    record("Sorotan berdenyut terus-menerus", sim["pulseAnim"].startswith("hlPulse"), json.dumps(sim))
    record("Istilah 'disorot' sudah diganti", "disorot" not in sim["promptText"], sim["promptText"][:80])

    print("\n11. Kuis: slider satu soal per layar")
    page.goto(f"{BASE}/#/kuis/latihan_bab/01_konsep_dasar")
    page.wait_for_timeout(800)
    quiz = page.evaluate("""() => ({
        slider: !!document.querySelector('.quiz-slider'),
        cards: document.querySelectorAll('.quiz__card').length,
        steps: document.querySelectorAll('.quiz-nav__step').length,
        counter: (document.querySelector('.quiz-nav__count') || {}).textContent || ''
    })""")
    record("Kuis memakai slider", quiz["slider"] is True, json.dumps(quiz))
    record("Satu soal per tampilan", quiz["cards"] == 1, json.dumps(quiz))
    record("Pelacak langkah soal tampil", quiz["steps"] >= 2, json.dumps(quiz))
    record("Nomor soal tertulis jelas", "dari" in quiz["counter"], json.dumps(quiz))

    print("\n12. Mathpad: pecahan tersusun vertikal")
    field = page.query_selector(".numfield")
    if field:
        field.click()
        page.wait_for_timeout(300)
        page.click("[data-mode-btn='fraction']")
        page.wait_for_timeout(400)
        frac = page.evaluate("""() => {
            const stack = document.querySelector('.mathpad__frac-stack');
            const num = document.querySelector('[data-slot="num"]');
            const den = document.querySelector('[data-slot="den"]');
            const bar = document.querySelector('.mathpad__frac-bar');
            const pad = document.querySelector('.mathpad');
            if (!stack || !num || !den || !bar) return { ok: false };
            const r = e => e.getBoundingClientRect();
            return {
                ok: true,
                dir: getComputedStyle(stack).flexDirection,
                stacked: r(num).top < r(bar).top && r(bar).top < r(den).top,
                padFits: r(pad).bottom <= window.innerHeight + 1
            };
        }""")
        record("Pecahan bertumpuk vertikal", frac.get("stacked") is True and frac.get("dir") == "column", json.dumps(frac))
        record("Mathpad muat di layar", frac.get("padFits") is True, json.dumps(frac))
        dismiss_pad(page)
    else:
        record("Field mathpad ditemukan", False, "tidak ada .numfield")

    print("\n13. Anti-spam tombol Selesai")
    spam = page.evaluate("""() => {
        // Paksa selesai lewat jalur yang sama dengan tombol, berkali-kali.
        return new Promise(resolve => {
            const host = document.querySelector('.quiz-slider');
            if (!host) return resolve({ skipped: true });
            resolve({ skipped: false });
        });
    }""")
    # Uji nyata: jawab semua soal bank lalu spam tombol Selesai
    page.goto(f"{BASE}/#/kuis/latihan_bab/04_pemodelan_tka")
    page.wait_for_timeout(700)
    result_cards = page.evaluate("""() => {
        // Klik "Periksa" lalu "Berikutnya"/"Selesai" berulang secepat mungkin.
        const clickAll = () => {
            document.querySelectorAll('button').forEach(b => {
                const t = b.textContent;
                if (t.includes('Periksa Jawaban') || t.includes('Soal Berikutnya') || t.includes('Selesai')) {
                    for (let i = 0; i < 5; i++) b.click();
                }
            });
        };
        for (let round = 0; round < 12; round++) clickAll();
        return document.querySelectorAll('.quiz__card').length;
    }""")
    page.wait_for_timeout(600)
    final_cards = page.evaluate("() => document.querySelectorAll('.quiz__card').length")
    record("Tidak ada kartu hasil beranak-pinak", final_cards <= 2, f"kartu terlihat: {final_cards}")

    print("\n14. Confetti bersih")
    conf = page.evaluate("() => document.querySelectorAll('.confetti-host').length")
    record("Maksimal satu lapis confetti", conf <= 1, f"jumlah host: {conf}")

    print("\n15. Bab tuntas & tab review")
    page.evaluate("""() => {
        const k = 'matriksLab.v1';
        const s = JSON.parse(localStorage.getItem(k) || '{}');
        s.schemaVersion = 1;
        s.progress = s.progress || { chapters: {} };
        const subs = ['pengertian_letak','ordo_matriks','jenis_matriks','transpose','kesamaan_matriks'];
        s.progress.chapters['01_konsep_dasar'] = { status: 'completed', subtopics: {} };
        subs.forEach(id => {
            s.progress.chapters['01_konsep_dasar'].subtopics[id] =
                { status: 'completed', bestQuizScore: 100, attempts: 1 };
        });
        localStorage.setItem(k, JSON.stringify(s));
    }""")
    page.goto(f"{BASE}/#/belajar")
    page.reload()          # wajib: hash-only nav tidak me-reset cache progressStore
    page.wait_for_timeout(800)
    done_style = page.evaluate("() => document.querySelectorAll('.chapter-item--completed').length")
    record("Bab tuntas bergaya khusus (emas)", done_style >= 1, f"ditemukan: {done_style}")

    page.goto(f"{BASE}/#/belajar/01_konsep_dasar/pengertian_letak")
    page.wait_for_timeout(800)
    review = page.evaluate("""() => {
        const steps = document.querySelector('.steps');
        const items = [...document.querySelectorAll('.steps__item')];
        if (!steps || !items.length) return { ok: false };
        items[2].click();
        return {
            ok: true,
            mode: steps.dataset.mode,
            clickable: items.every(i => i.tagName === 'BUTTON'),
            flag: !!document.querySelector('.review-flag')
        };
    }""")
    page.wait_for_timeout(500)
    # Mode review TIDAK menjalankan logika kuis: yang muncul adalah kunci jawaban.
    jumped = page.evaluate("() => !!document.querySelector('.answer-key')")
    record("Tab review bisa diklik", review.get("clickable") is True and review.get("mode") == "review", json.dumps(review))
    record("Penanda Mode Review tampil", review.get("flag") is True, json.dumps(review))
    record("Review Kuis menampilkan kunci jawaban", jumped is True, f"answer-key: {jumped}")


    # ============================================================
    # Fase 5 — pembenahan mekanik mendalam
    # ============================================================
    print("\n17. Pengatur kecepatan animasi sudah dihapus")
    # Bagian sebelumnya meninggalkan tampilan pada tab review DAN menuliskan
    # posisi terakhir ke ingatan sesi — keduanya harus dibersihkan dulu.
    open_fresh(page, "#/belajar/01_konsep_dasar/pengertian_letak")
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    speed = page.evaluate("() => document.querySelectorAll('.speed-toggle').length")
    record("Tidak ada toggle 0.5x/1x/2x", speed == 0, f"ditemukan: {speed}")

    print("\n18. Toast error singleton + opsi salah dikunci")
    # Yang diklik HARUS opsi yang salah.
    #
    # Versi lama menekan SEMUA tombol lalu berharap salah satunya tercatat
    # keliru. Sejak Fase 13, menekan opsi yang BENAR langsung mengunci sisanya
    # (`.is-locked`) — dan opsi yang tidak pernah dipilih siswa memang tidak
    # boleh ditandai salah. Kalau jawaban benar kebetulan berada paling kiri,
    # tidak ada satu pun `.is-failed` yang lahir, dan uji lama gagal karena
    # patokannya, bukan karena aplikasinya.
    errs = page.evaluate("""() => new Promise(resolve => {
        const sim = window.__matriksLab.state.activeView.simulation;
        const step = sim.config.steps[sim.stepIndex];
        const opts = [...document.querySelectorAll('.stage__row .btn')];
        if (!opts.length || !step) return resolve({ skipped: true });

        const wrongIdx = step.options.findIndex((_, i) => i !== step.answerIndex);
        if (wrongIdx < 0 || !opts[wrongIdx]) return resolve({ skipped: true });

        opts[wrongIdx].click();
        setTimeout(() => resolve({
            skipped: false,
            errorToasts: document.querySelectorAll('.toast--error').length,
            locked: document.querySelectorAll('.is-failed').length,
            // Opsi yang benar HARUS tetap bisa ditekan sesudahnya.
            correctStillLive: !opts[step.answerIndex].disabled,
        }), 500);
    })""")
    if errs.get("skipped"):
        record("Toast error singleton", False, "tidak ada tombol untuk memicu error")
    else:
        record("Toast error singleton (maks 1)", errs["errorToasts"] <= 1, f"aktif: {errs['errorToasts']}")
        record("Opsi salah dinonaktifkan", errs["locked"] >= 1, f"terkunci: {errs['locked']}")
        record("Opsi yang benar tetap bisa ditekan setelah satu salah",
               errs.get("correctStillLive") is True, json.dumps(errs))

    print("\n19. Materi Jenis Matriks: lima kategori penggolongan")
    # Fase 12 mengganti carousel dengan struktur kategori. Carousel hanya
    # memperlihatkan satu jenis pada satu waktu, padahal justru PERBANDINGAN
    # di dalam satu kategori yang jadi pelajarannya — beda matriks diagonal,
    # skalar, dan identitas cuma terlihat kalau ketiganya berdampingan.
    open_fresh(page, "#/belajar/01_konsep_dasar/jenis_matriks")
    car = page.evaluate("""() => {
        const groups = [...document.querySelectorAll('.typegroup')];
        return {
            groups: groups.length,
            titles: groups.map(g => (g.querySelector('.typegroup__title') || {}).textContent || ''),
            cards: document.querySelectorAll('.typecard').length,
            figures: document.querySelectorAll('.typecard__figure .katex').length,
            named: [...document.querySelectorAll('.typecard__name')].map(n => n.textContent.trim()),
            notes: document.querySelectorAll('.typegroup__note').length,
        };
    }""")
    record("Lima kategori penggolongan ditampilkan", car["groups"] == 5, json.dumps(car)[:200])
    record("Setiap jenis punya SATU contoh matriks",
           car["cards"] == 19 and car["figures"] == 19, json.dumps(car)[:200])
    WAJIB = ["Matriks Baris", "Matriks Kolom", "Matriks Persegi Panjang", "Matriks Persegi",
             "Matriks Nol", "Matriks Diagonal", "Matriks Skalar", "Matriks Identitas",
             "Matriks Segitiga Atas", "Matriks Segitiga Bawah",
             "Matriks Simetris", "Matriks Simetris Miring", "Matriks Ortogonal",
             "Matriks Idempoten", "Matriks Involutori", "Matriks Nilpoten", "Matriks Periodik",
             "Matriks Singular", "Matriks Non-Singular"]
    hilang = [n for n in WAJIB if n not in car["named"]]
    record("Sembilan belas jenis lengkap, tidak ada yang hilang",
           not hilang, "hilang: " + json.dumps(hilang, ensure_ascii=False))
    record("Kategori pengayaan & rujukan bab lain diberi catatan",
           car["notes"] == 2, json.dumps(car)[:200])

    print("\n20. Simulasi jenis matriks: seret label ke matriks")
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    lbl = page.evaluate("""() => ({
        target: !!document.querySelector('.label-target'),
        chips: document.querySelectorAll('.label-chip').length
    })""")
    record("Target matriks + label draggable", lbl["target"] is True and lbl["chips"] >= 4, json.dumps(lbl))

    print("\n21. Transpose memakai morph (bukan lipat)")
    page.goto(f"{BASE}/#/belajar/01_konsep_dasar/transpose")
    page.wait_for_timeout(700)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    tr = page.evaluate("""() => {
        const txt = document.body.innerText.toLowerCase();
        return {
            hasFoldWord: txt.includes('lipat'),
            hasMorphBtn: !!([...document.querySelectorAll('button')].find(b => b.textContent.includes('Pindahkan Baris')))
        };
    }""")
    record("Metafora 'lipat' dihapus", tr["hasFoldWord"] is False, json.dumps(tr))
    record("Tombol morph baris ke kolom ada", tr["hasMorphBtn"] is True, json.dumps(tr))

    print("\n22. Kesamaan: klik kiri menyalakan pasangan kanan")
    page.goto(f"{BASE}/#/belajar/01_konsep_dasar/kesamaan_matriks")
    page.wait_for_timeout(700)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    eq = page.evaluate("""() => new Promise(resolve => {
        const mats = document.querySelectorAll('.matrix');
        if (mats.length < 2) return resolve({ ok: false });
        mats[0].querySelectorAll('.cell')[0].click();
        setTimeout(() => resolve({
            ok: true,
            rightLit: mats[1].querySelectorAll('.cell--pulse, .cell--done').length
        }), 400);
    })""")
    record("Klik kiri menyalakan pasangan kanan", eq.get("rightLit", 0) >= 1, json.dumps(eq))

    print("\n23. Perkalian: horizontal, tanpa akumulator terpisah")
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/perkalian_matriks")
    page.wait_for_timeout(700)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(900)
    mul = page.evaluate("""() => ({
        equationRow: !!document.querySelector('.stage__row--equation'),
        hasEquals: [...document.querySelectorAll('.op-glyph')].some(e => e.textContent === '='),
        accumulator: document.querySelectorAll('.accumulator').length,
        workstrip: !!document.querySelector('.workstrip')
    })""")
    record("Tata letak horizontal dengan tanda sama dengan", mul["equationRow"] and mul["hasEquals"], json.dumps(mul))
    record("Akumulator terpisah dihapus", mul["accumulator"] == 0, json.dumps(mul))
    record("Papan kerja menempel di hasil", mul["workstrip"] is True, json.dumps(mul))

    print("\n24. Mini-simulasi ordo perkalian")
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/ordo_perkalian")
    page.wait_for_timeout(700)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    oc = page.evaluate("""() => ({
        widget: !!document.querySelector('.ordo-check'),
        inner: document.querySelectorAll('.ordo-check__num--inner').length,
        outer: document.querySelectorAll('.ordo-check__num--outer').length
    })""")
    record("Simulasi ordo hasil tersedia", oc["widget"] is True, json.dumps(oc))
    record("Angka dalam & luar diberi warna", oc["inner"] == 2 and oc["outer"] == 2, json.dumps(oc))

    print("\n25. Determinan: pemisah Sarrus + ekspresi, tanpa hantu")
    page.goto(f"{BASE}/#/belajar/03_determinan_invers/determinan_3x3")
    page.wait_for_timeout(700)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    copy = page.query_selector("button:has-text('Salin Dua Kolom')")
    if copy:
        copy.click()
        page.wait_for_timeout(1500)
    det = page.evaluate("""() => ({
        divider: !!document.querySelector('.matrix__grid--sarrus.has-divider'),
        expr: !!document.querySelector('.det-expr'),
        ghosts: document.querySelectorAll('.diag-trace').length
    })""")
    record("Garis pemisah Sarrus tergambar", det["divider"] is True, json.dumps(det))
    record("Ekspresi determinan tampil", det["expr"] is True, json.dumps(det))
    record("Tidak ada elemen hantu tersisa", det["ghosts"] == 0, json.dumps(det))

    print("\n27. KaTeX: escape LaTeX utuh")
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/ordo_perkalian")
    page.reload()
    page.wait_for_timeout(800)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    tex = page.evaluate("""() => ({
        imes: document.body.innerText.includes('imes'),
        hasTimes: document.body.innerText.includes('×')
    })""")
    record("Tidak ada sisa 'imes' (escape rusak)", tex["imes"] is False, json.dumps(tex))
    record("Simbol kali tampil benar", tex["hasTimes"] is True, json.dumps(tex))

    print("\n28. Opsi salah dikunci + toast error singleton")
    lock = page.evaluate("""() => new Promise(resolve => {
        const opts = [...document.querySelectorAll('.stage__row .btn')];
        if (opts.length < 2) return resolve({ skipped: true });
        opts[0].click();
        setTimeout(() => {
            const again = [...document.querySelectorAll('.stage__row .btn')];
            again.forEach(b => b.click());
            setTimeout(() => resolve({
                skipped: false,
                failed: document.querySelectorAll('.is-failed').length,
                errorToasts: document.querySelectorAll('.toast--error').length
            }), 400);
        }, 350);
    })""")
    if lock.get("skipped"):
        record("Opsi salah terkunci", False, "tidak ada opsi untuk diuji")
    else:
        record("Opsi salah terkunci seketika", lock["failed"] >= 1, json.dumps(lock))
        record("Toast error singleton (maks 1)", lock["errorToasts"] <= 1, json.dumps(lock))

    print("\n29. State slide tidak bocor saat navigasi bolak-balik")
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/ordo_perkalian")
    page.reload()
    page.wait_for_timeout(800)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    bleed = page.evaluate("""() => new Promise(resolve => {
        const answer = () => {
            const opts = [...document.querySelectorAll('.stage__row .btn')];
            if (opts[1]) opts[1].click();          // jawaban benar kasus 1
        };
        answer();
        setTimeout(() => {
            const advanced = document.querySelector('.slider__counter').textContent;
            const dots = document.querySelectorAll('.slider-dot');
            if (dots[0]) dots[0].click();          // kembali ke kasus 1
            setTimeout(() => resolve({
                advanced,
                back: document.querySelector('.slider__counter').textContent,
                solvedBanner: !!document.querySelector('.slide-solved'),
                allDisabled: [...document.querySelectorAll('.stage__row .btn')].every(b => b.disabled)
            }), 700);
        }, 3200);
    })""")
    record("Kasus 1 tetap 'selesai' saat dikunjungi ulang", bleed.get("solvedBanner") is True, json.dumps(bleed))
    record("Opsi tidak bisa dijawab ulang", bleed.get("allDisabled") is True, json.dumps(bleed))

    print("\n30. Isyarat gerak pada perkalian matriks")
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/perkalian_matriks")
    page.reload()
    page.wait_for_timeout(800)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(900)
    cue = page.evaluate("""() => new Promise(resolve => {
        const mats = document.querySelectorAll('.matrix');
        mats[2].querySelectorAll('.cell')[0].click();
        setTimeout(() => resolve({
            target: !!document.querySelector('.cell--target'),
            paths: document.querySelectorAll('.cue-path').length,
            hand: document.querySelectorAll('.cue-hand').length
        }), 700);
    })""")
    record("Sel target berdenyut", cue["target"] is True, json.dumps(cue))
    record("Garis lintasan beranimasi tampil", cue["paths"] >= 1, json.dumps(cue))
    record("Kursor hantu memperagakan gerakan", cue["hand"] == 1, json.dumps(cue))

    print("\n31. Ketuk-ketuk (tap-and-tap) di perkalian")
    tap = page.evaluate("""() => new Promise(resolve => {
        const mats = document.querySelectorAll('.matrix');
        const a = mats[0].querySelectorAll('.cell')[0];
        const b = mats[1].querySelectorAll('.cell')[0];
        const target = mats[2].querySelectorAll('.cell')[0];

        a.click();   // ketukan 1
        const armed = {
            selected: a.dataset.tapSelected === 'true',
            bodyArmed: document.body.classList.contains('is-tap-armed'),
            litTargets: document.querySelectorAll('[data-tap-target="true"]').length
        };

        target.click();   // ketukan 2 -> memicu animasi yang sama
        setTimeout(() => {
            b.click();
            target.click();
            setTimeout(() => resolve({
                armed,
                work: (document.querySelector('.workstrip') || {}).textContent || '',
                cellText: target.textContent.trim()
            }), 2600);
        }, 1700);
    })""")
    record("Ketukan 1 memilih sumber", tap["armed"]["selected"] is True, json.dumps(tap["armed"]))
    record("Tujuan yang sah ikut menyala", tap["armed"]["litTargets"] >= 1, json.dumps(tap["armed"]))
    record("Ketukan 2 memicu merge (hasil masuk sel)", tap["cellText"] not in ("", "?"), json.dumps(tap))

    print("\n32. Sarrus: garis coret permanen")
    page.goto(f"{BASE}/#/belajar/03_determinan_invers/determinan_3x3")
    page.reload()
    page.wait_for_timeout(800)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(800)
    copy = page.query_selector("button:has-text('Salin Dua Kolom')")
    if copy:
        copy.click()
        page.wait_for_timeout(1500)
    # Fase 8: diagonal dipilih dengan KETUK-KETUK, bukan tarik-garis.
    # Garis coretnya digambar setelah ketiga elemen yang benar diketuk.
    strike = page.evaluate("""() => new Promise(resolve => {
        const grid = document.querySelector('.matrix__grid--sarrus');
        const cells = [...grid.querySelectorAll('.cell')];
        // Diagonal turun pertama pada grid 3x5: indeks 0, 6, 12.
        [cells[0], cells[6], cells[12]].forEach(el => el.click());
        setTimeout(() => resolve({
            layer: document.querySelectorAll('.strike-layer').length,
            lines: document.querySelectorAll('.strike-line').length,
            struck: document.querySelectorAll('.cell--struck').length,
            leftoverTrace: document.querySelectorAll('.diag-trace').length
        }), 2800);
    })""")
    record("Garis coret permanen tergambar", strike["lines"] >= 1, json.dumps(strike))
    record("Sel yang dilalui ditandai", strike["struck"] == 3, json.dumps(strike))
    record("Garis sementara tidak tersisa", strike["leftoverTrace"] == 0, json.dumps(strike))



    # ============================================================
    # Fase 7 — poles akhir dan tanpa-scroll sejati
    # ============================================================
    print("\n34. Kebijakan tanpa-scroll global")
    page.goto(f"{BASE}/#/")
    page.reload()
    page.wait_for_timeout(700)
    lock = page.evaluate("""() => {
        const h = getComputedStyle(document.documentElement);
        const b = getComputedStyle(document.body);
        return {
            htmlOverflow: h.overflow,
            bodyOverflow: b.overflow,
            bodyPosition: b.position,
            bodyScrolls: document.body.scrollHeight > document.body.clientHeight + 1,
            appFits: document.getElementById('app').getBoundingClientRect().height <= window.innerHeight + 1
        };
    }""")
    record("html & body overflow hidden", lock["htmlOverflow"] == "hidden" and lock["bodyOverflow"] == "hidden", json.dumps(lock))
    record("Body tidak pernah menggulir", lock["bodyScrolls"] is False, json.dumps(lock))
    record("Shell aplikasi muat 100vh", lock["appFits"] is True, json.dumps(lock))

    print("\n35. Footer hak cipta & streak dihapus")
    meta = page.evaluate("""() => ({
        footer: (document.querySelector('.app-footer__text') || {}).textContent || '',
        streak: document.querySelectorAll('.streak-chip, [data-role="streak"]').length,
        fontUI: getComputedStyle(document.documentElement).getPropertyValue('--font-ui').trim()
    })""")
    expected = "© Penta Putra Purnomo, S.Pd., Gr. | SMAS YPVDP Bontang."
    record("Teks hak cipta persis", expected in meta["footer"], meta["footer"])
    record("Fitur streak hilang dari UI", meta["streak"] == 0, json.dumps(meta))
    record("Tipografi judul Montserrat", "Montserrat" in meta["fontUI"], meta["fontUI"])

    print("\n36. Tidak ada pergeseran tata letak saat sukses")
    page.goto(f"{BASE}/#/belajar/01_konsep_dasar/transpose")
    page.reload()
    page.wait_for_timeout(800)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(900)

    before = page.evaluate("""() => {
        const s = document.querySelector('.stage').getBoundingClientRect();
        return { top: Math.round(s.top), height: Math.round(s.height) };
    }""")

    for _ in range(3):
        b = page.query_selector("button:has-text('Pindahkan Baris')")
        if not b:
            break
        try:
            b.click(timeout=3000)
        except Exception:
            break
        page.wait_for_timeout(2400)

    page.wait_for_timeout(1500)   # tunggu animasi mendarat benar-benar reda
    after = page.evaluate("""() => {
        const s = document.querySelector('.stage').getBoundingClientRect();
        return {
            top: Math.round(s.top), height: Math.round(s.height),
            overlay: document.querySelectorAll('.sim__done-overlay').length,
            inflow: [...document.querySelectorAll('.sim__done-banner')]
                        .filter(n => getComputedStyle(n).display !== 'none').length,
            done: !!document.querySelector('.sim--done'),
            scrolls: document.body.scrollHeight > document.body.clientHeight + 1
        };
    }""")
    record("Panggung tidak bergeser vertikal", abs(after["top"] - before["top"]) <= 1,
           f"{before} -> {after}")
    record("Panggung tidak berubah tinggi", abs(after["height"] - before["height"]) <= 1,
           f"{before} -> {after}")
    record("Simulasi benar-benar selesai", after["done"] is True, json.dumps(after))
    record("Pesan sukses berupa overlay", after["overlay"] == 1 and after["inflow"] == 0, json.dumps(after))
    record("Tetap tanpa scroll setelah sukses", after["scrolls"] is False, json.dumps(after))

    print("\n37. Mathpad: batas 2 digit & papan huruf")
    # Lab Maya sudah dicabut, jadi isian angka diuji lewat Mini Kuis dan
    # papan hurufnya lewat layar masuk — dua tempat yang memang tersisa.
    open_fresh(page, "#/kuis/latihan_bab/03_determinan_invers")
    pad = page.evaluate("""() => new Promise(resolve => {
        const press = el => el && el.dispatchEvent(new PointerEvent('pointerdown',
            { bubbles: true, cancelable: true, composed: true, pointerId: 1,
              pointerType: 'mouse', button: 0, isPrimary: true }));
        const field = document.querySelector('.numfield');
        if (!field) return resolve({ skipped: true });
        const b = field.getBoundingClientRect();
        field.dispatchEvent(new PointerEvent('pointerdown',
            { bubbles: true, cancelable: true, composed: true, clientX: b.left + 8, clientY: b.top + 8,
              pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true }));
        setTimeout(() => {
            const keys = [...document.querySelectorAll('.mp-key')];
            ['1', '2', '3', '4'].forEach(d => press(keys.find(k => k.textContent.trim() === d)));
            resolve({
                skipped: false,
                twoDigits: document.querySelector('.mathpad__preview').textContent.trim(),
                readOnly: field.readOnly,
                inputMode: field.getAttribute('inputmode'),
            });
        }, 260);
    })""")
    if pad.get("skipped"):
        record("Batas dua digit ditegakkan", False, "tidak ada .numfield di bank soal ini")
        record("Field angka menolak keyboard OS", False, "tidak ada .numfield")
    else:
        record("Batas dua digit ditegakkan", pad["twoDigits"] == "12", json.dumps(pad))
        record("Field angka menolak keyboard OS",
               pad["readOnly"] is True and pad["inputMode"] == "none", json.dumps(pad))
    dismiss_pad(page)

    print("\n39. Perkalian matriks: langkah demi langkah")
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/perkalian_matriks")
    page.reload()
    page.wait_for_timeout(800)
    btn = page.query_selector("button:has-text('Mulai Simulasi')")
    if btn:
        btn.click()
        page.wait_for_timeout(900)

    steps = page.evaluate("""() => new Promise(resolve => {
        const mats = document.querySelectorAll('.matrix');
        const target = mats[2].querySelectorAll('.cell')[0];
        const invitesBefore = document.querySelectorAll('.cell--invite').length;

        target.click();                       // Langkah A
        setTimeout(() => {
            const pulsing = target.classList.contains('cell--target');
            mats[0].querySelectorAll('.cell')[0].click();   // ketuk sumber baris
            target.click();                                 // jatuhkan
            setTimeout(() => {
                const afterFirst = (target.textContent || '').trim();
                mats[1].querySelectorAll('.cell')[0].click();  // elemen kolom
                target.click();
                setTimeout(() => {
                    const afterPair = (target.textContent || '').trim();
                    const confirmHiddenMid = document.querySelector('.workstrip__confirm').hidden;
                    // pasangan kedua
                    mats[0].querySelectorAll('.cell')[1].click();
                    target.click();
                    setTimeout(() => {
                        mats[1].querySelectorAll('.cell')[2].click();
                        target.click();
                        setTimeout(() => {
                            const expr = (target.textContent || '').trim();
                            const confirmBtn = document.querySelector('.workstrip__confirm');
                            const confirmShown = !confirmBtn.hidden;
                            if (confirmShown) confirmBtn.click();
                            setTimeout(() => resolve({
                                invitesBefore, pulsing, afterFirst, afterPair,
                                confirmHiddenMid, expr, confirmShown,
                                finalText: (target.textContent || '').trim(),
                                isDone: target.classList.contains('cell--done')
                            }), 1400);
                        }, 1500);
                    }, 1500);
                }, 1500);
            }, 1500);
        }, 600);
    })""")
    record("Sel hasil mengundang untuk diklik", steps["invitesBefore"] >= 1, json.dumps(steps))
    record("Sel target berdenyut setelah dipilih", steps["pulsing"] is True, json.dumps(steps))
    record("Elemen pertama tampil sendirian di sel", steps["afterFirst"] not in ("", "?"), json.dumps(steps))
    record("Pasangan tampil sebagai (a×b)", "×" in steps["afterPair"], json.dumps(steps))
    record("Tombol hitung belum muncul di tengah jalan", steps["confirmHiddenMid"] is True, json.dumps(steps))
    record("Ekspresi bertambah dengan +", "+" in steps["expr"], json.dumps(steps))
    record("Tombol hitung muncul saat lengkap", steps["confirmShown"] is True, json.dumps(steps))
    record("Klik hitung menyelesaikan sel", steps["isDone"] is True, json.dumps(steps))

    print("\n40. Perkalian skalar pecahan tetap pecahan")
    frac = page.evaluate("""async () => {
        const mod = await import('/js/engine/rational.js');
        const half = mod.parseRational('1/2');
        const twoThirds = mod.mulR(mod.parseRational('2/3'), mod.parseRational('1'));
        const product = mod.mulR(half, mod.parseRational('3'));
        const simplify = mod.mulR(mod.parseRational('2/4'), mod.parseRational('2'));
        return {
            half: mod.toText(half),
            twoThirds: mod.toText(twoThirds),
            product: mod.toText(product),
            simplified: mod.toText(simplify),
            latex: mod.toLatexR(product)
        };
    }""")
    record("Pecahan tidak jadi desimal", frac["product"] == "3/2", json.dumps(frac))
    record("Hasil otomatis disederhanakan", frac["simplified"] == "1", json.dumps(frac))
    record("LaTeX pecahan memakai \\frac", "frac" in frac["latex"], json.dumps(frac))

    print("\n41. Artefak UI kategori jenis matriks bersih")
    open_fresh(page, "#/belajar/01_konsep_dasar/jenis_matriks")
    art = page.evaluate("""() => {
        const cards = [...document.querySelectorAll('.typecard')];
        const figs = [...document.querySelectorAll('.typecard__figure')];
        if (!cards.length) return { found: false };
        return {
            found: true,
            cardScrolls: cards.some(c => c.scrollWidth > c.clientWidth + 1),
            figScrolls: figs.some(f => f.scrollWidth > f.clientWidth + 1),
            // Tidak ada scrollbar mendatar yang TERLIHAT di bawah rumus.
            visibleBar: [...document.querySelectorAll('.typecard .katex-display')]
                .some(k => k.scrollWidth > k.clientWidth + 1
                        && getComputedStyle(k).scrollbarWidth !== 'none'),
        };
    }""")
    record("Kartu jenis tidak menggulir mendatar", art.get("cardScrolls") is False, json.dumps(art))
    record("Figur rumus tidak menggulir mendatar", art.get("figScrolls") is False, json.dumps(art))
    record("Tidak ada scrollbar terlihat di bawah matriks contoh",
           art.get("visibleBar") is False, json.dumps(art))

    print("\n42. Potret menampilkan pengunci orientasi")
    # Fase 9 mengunci aplikasi ke lanskap. Di potret, isi aplikasi
    # DISEMBUNYIKAN dan digantikan pesan yang menyuruh memutar perangkat.
    page.set_viewport_size({"width": 390, "height": 844})
    for route in ["#/", "#/belajar/02_operasi_aljabar/perkalian_matriks", "#/kuis"]:
        page.goto(f"{BASE}/{route}")
        page.reload()
        page.wait_for_timeout(700)
        lock = page.evaluate("""() => {
            const el = document.querySelector('.rotate-lock');
            const app = document.getElementById('app');
            if (!el || !app) return { found: false };
            const cs = getComputedStyle(el);
            const as = getComputedStyle(app);
            const r = el.getBoundingClientRect();
            return {
                found: true,
                shown: cs.display !== 'none',
                z: Number(cs.zIndex),
                blurs: cs.backdropFilter !== 'none' || cs.webkitBackdropFilter !== 'none',
                appHidden: as.visibility === 'hidden',
                covers: Math.round(r.width) >= window.innerWidth
                        && Math.round(r.height) >= window.innerHeight,
                text: (document.querySelector('.rotate-lock__text') || {}).textContent.trim(),
                hasIcon: !!document.querySelector('.rotate-lock__icon svg'),
                bodyScrolls: document.body.scrollHeight > document.body.clientHeight + 1,
            };
        }""")
        tag = route
        record(f"Pengunci orientasi tampil di potret: {tag}",
               bool(lock.get("found")) and lock["shown"] is True, json.dumps(lock)[:200])
        record(f"Isi aplikasi disembunyikan: {tag}", lock.get("appHidden") is True, json.dumps(lock)[:200])

    record("Pengunci menutup seluruh layar", lock.get("covers") is True, json.dumps(lock)[:200])
    record("Pengunci berada di z-index 9999", lock.get("z") == 9999, json.dumps(lock)[:200])
    record("Latarnya diburamkan", lock.get("blurs") is True, json.dumps(lock)[:200])
    record("Ada ikon putar perangkat", lock.get("hasIcon") is True, json.dumps(lock)[:200])
    record("Pesannya persis seperti yang diminta",
           lock.get("text") == "Mohon putar perangkat Anda ke mode Landscape untuk pengalaman belajar terbaik.",
           json.dumps(lock)[:220])

    # Di lanskap, pengunci harus benar-benar menyingkir.
    page.set_viewport_size({"width": 844, "height": 390})
    page.goto(f"{BASE}/#/")
    page.reload()
    page.wait_for_timeout(700)
    unlocked = page.evaluate("""() => ({
        lockShown: getComputedStyle(document.querySelector('.rotate-lock')).display !== 'none',
        appVisible: getComputedStyle(document.getElementById('app')).visibility === 'visible',
        bodyScrolls: document.body.scrollHeight > document.body.clientHeight + 1,
    })""")
    record("Lanskap: pengunci menyingkir", unlocked["lockShown"] is False, json.dumps(unlocked))
    record("Lanskap: aplikasi terlihat", unlocked["appVisible"] is True, json.dumps(unlocked))
    record("Lanskap: body tetap tidak menggulir", unlocked["bodyScrolls"] is False, json.dumps(unlocked))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n43. Bilah aksi tersemat di luar area scroll")
    for vp in ({"width": 1280, "height": 800}, {"width": 844, "height": 390}):
        page.set_viewport_size(vp)
        page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/perkalian_matriks")
        page.reload()
        page.wait_for_timeout(900)
        geo = page.evaluate("""() => {
            const bar = document.querySelector('.workspace__actions .actionbar');
            const foot = document.querySelector('.app-footer');
            const body = document.querySelector('.workspace__body');
            if (!bar || !foot) return { found: false };
            const r = bar.getBoundingClientRect();
            // Footer disembunyikan di lanskap pendek; elemen display:none
            // melaporkan rect nol, jadi batas bawahnya adalah tepi viewport.
            const f = foot.getBoundingClientRect();
            const limit = f.height > 0 ? f.top : window.innerHeight;
            return {
                found: true,
                insideScroll: !!(body && body.contains(bar)),
                clipped: r.bottom > limit + 1,
                visible: r.top >= 0 && r.height > 0
            };
        }""")
        tag = f'{vp["width"]}x{vp["height"]}'
        record(f"Bilah aksi terlihat penuh @{tag}",
               bool(geo.get("found")) and geo["visible"] and not geo["clipped"], json.dumps(geo))
        record(f"Bilah aksi bukan bagian area scroll @{tag}",
               bool(geo.get("found")) and geo["insideScroll"] is False, json.dumps(geo))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n45. Tidak ada luapan horizontal di layar sempit")
    # Lanskap ponsel — ukuran tersempit yang masih dilayani aplikasi.
    page.set_viewport_size({"width": 667, "height": 375})
    for route in ["#/", "#/belajar/02_operasi_aljabar/perkalian_matriks", "#/tka", "#/kuis"]:
        page.goto(f"{BASE}/{route}")
        page.reload()
        page.wait_for_timeout(900)
        ovf = page.evaluate("""() => {
            const vw = window.innerWidth;
            const bad = [];
            document.querySelectorAll('.app-header, .screen-host, .container, .workspace, .workspace__bar, .app-footer, .content-card').forEach((n) => {
                const r = n.getBoundingClientRect();
                if (r.width > vw + 1) bad.push(n.className + '=' + Math.round(r.width));
            });
            return { vw, docScrollW: document.documentElement.scrollWidth, bad };
        }""")
        record(f"Lebar terkunci viewport: {route}",
               not ovf["bad"] and ovf["docScrollW"] <= ovf["vw"] + 1, json.dumps(ovf))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n46. Hak cipta terbaca utuh di ponsel")
    page.set_viewport_size({"width": 844, "height": 390})
    page.goto(f"{BASE}/#/")
    page.reload()
    page.wait_for_timeout(700)
    foot = page.evaluate("""() => {
        const n = document.querySelector('.app-footer__text');
        if (!n) return { found: false };
        return {
            found: true,
            text: n.textContent.trim(),
            truncated: n.scrollWidth > n.clientWidth + 1
        };
    }""")
    record("Teks hak cipta lengkap & tidak terpotong",
           bool(foot.get("found"))
           and foot["text"] == "© Penta Putra Purnomo, S.Pd., Gr. | SMAS YPVDP Bontang."
           and not foot["truncated"], json.dumps(foot))
    page.set_viewport_size({"width": 1280, "height": 860})

    # ============================================================
    # Fase 8 — perbaikan tata letak, ingatan sesi, mesin interaksi baru
    # ============================================================

    print("\n47. Subjudul menu utama")
    page.set_viewport_size({"width": 1280, "height": 860})
    open_fresh(page, "#/")
    lead = page.evaluate("""() => {
        const n = document.querySelector('.menu__lead');
        if (!n) return { found: false };
        const cs = getComputedStyle(n);
        return {
            found: true,
            text: n.textContent.trim(),
            visible: cs.display !== 'none' && n.getBoundingClientRect().height > 0,
        };
    }""")
    record("Subjudul berbunyi persis",
           lead.get("text") == "Belajar matriks secara visual dan menyenangkan", json.dumps(lead))
    record("Subjudul terlihat di layar laptop", lead.get("visible") is True, json.dumps(lead))

    print("\n48. Simulasi singular tidak merender HTML mentah")
    open_fresh(page, "#/belajar/03_determinan_invers/singular_nonsingular")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    raw = page.evaluate("""() => new Promise(resolve => {
        // Jawab kedua pilihan; salah satunya pasti benar dan memunculkan vonis.
        const btns = [...document.querySelectorAll('.stage__row .btn')];
        btns.forEach(x => x.click());
        setTimeout(() => {
            const host = document.querySelector('.stage');
            const text = host ? host.innerText : '';
            resolve({
                // Penanda bug lama: markup tampil sebagai teks biasa.
                rawMarkup: /<div|<span|style="|&lt;div/.test(text),
                panel: !!document.querySelector('.verdict-panel'),
                iconIsSvg: !!document.querySelector('.verdict-panel__icon svg'),
            });
        }, 900);
    })""")
    record("Tidak ada string HTML tampil sebagai teks", raw.get("rawMarkup") is False, json.dumps(raw))
    record("Vonis dibangun sebagai node DOM", raw.get("panel") is True, json.dumps(raw))
    record("Ikon vonis benar-benar SVG", raw.get("iconIsSvg") is True, json.dumps(raw))

    print("\n49. Contoh matriks Jenis Matriks terlihat, bukan sekadar ada")
    for vp in ({"width": 1280, "height": 860}, {"width": 844, "height": 390}):
        page.set_viewport_size(vp)
        open_fresh(page, "#/belajar/01_konsep_dasar/jenis_matriks")
        vis = page.evaluate("""() => {
            const fig = document.querySelector('.typecard__figure');
            if (!fig) return { found: false };
            const r = fig.getBoundingClientRect();
            const k = fig.querySelector('.katex-html');
            const kr = k ? k.getBoundingClientRect() : null;
            return {
                found: true,
                h: Math.round(r.height),
                katexW: kr ? Math.round(kr.width) : 0,
                // Benar-benar berada di dalam viewport, bukan cuma ada di DOM.
                inView: r.top >= 0 && r.bottom <= window.innerHeight + 1 && r.height > 20,
            };
        }""")
        tag = f'{vp["width"]}x{vp["height"]}'
        record(f"Contoh matriks punya tinggi & rumus @{tag}",
               bool(vis.get("found")) and vis["h"] > 20 and vis["katexW"] > 10, json.dumps(vis))
        record(f"Contoh matriks berada dalam viewport @{tag}", vis.get("inView") is True, json.dumps(vis))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n50. Lanskap: satu kolom terpusat, halaman tetap 100vh")
    page.set_viewport_size({"width": 1280, "height": 720})
    open_fresh(page, "#/belajar/01_konsep_dasar/pengertian_letak")
    col = page.evaluate("""() => {
        const card = document.querySelector('.materi-card');
        const materi = document.querySelector('.materi');
        const body = document.querySelector('.workspace__body');
        const app = document.getElementById('app');
        if (!card || !materi) return { found: false };
        const cs = getComputedStyle(card);
        const r = card.getBoundingClientRect();
        const b = body.getBoundingClientRect();
        return {
            found: true,
            // Kolom TUNGGAL: paginasi berkolom Fase 8 sudah dibuang.
            columns: document.querySelectorAll('.materi-col, .materi-page').length,
            cardW: Math.round(r.width),
            maxW: 1000,
            gap: Math.round(Math.abs((r.left - b.left) - (b.right - r.right))),
            cardScrolls: cs.overflowY === 'auto',
            stageScrolls: (() => {
                const st = document.querySelector('.ws-stage > .workspace__body');
                return st ? getComputedStyle(st).overflowY === 'auto' : false;
            })(),
            scrollbarAtEdge: (() => {
                const st = document.querySelector('.ws-stage > .workspace__body');
                if (!st) return null;
                return Math.round(window.innerWidth - st.getBoundingClientRect().right);
            })(),
            appH: Math.round(app.getBoundingClientRect().height),
            vh: window.innerHeight,
            bodyScrolls: document.body.scrollHeight > document.body.clientHeight + 1,
        };
    }""")
    record("Materi mengalir satu kolom", col.get("columns") == 0, json.dumps(col))
    # Toleransi 6px: area gulir menyisakan padding-right 4px untuk scrollbar,
    # jadi selisih sisi kiri-kanan tidak pernah persis nol.
    record("Lebar baca dibatasi & terpusat",
           col.get("cardW", 9999) <= col.get("maxW", 1000) + 2 and col.get("gap", 99) <= 30,
           json.dumps(col))
    # Fase 10 memindahkan gulir dari KARTU ke KOLOM PANGGUNG, supaya
    # scrollbar-nya memeluk tepi layar dan bukan tepi kartu.
    record("Teori panjang menggulir di kolom panggung",
           col.get("stageScrolls") is True, json.dumps(col))
    record("Scrollbar menempel tepi kanan layar",
           col.get("scrollbarAtEdge") == 0, json.dumps(col))
    record("Pembungkus halaman tetap setinggi layar",
           abs(col.get("appH", 0) - col.get("vh", 1)) <= 1, json.dumps(col))
    record("Body tidak pernah menggulir", col.get("bodyScrolls") is False, json.dumps(col))

    print("\n51. Lanskap ponsel: aksi tetap terjangkau")
    page.set_viewport_size({"width": 844, "height": 390})
    open_fresh(page, "#/belajar/01_konsep_dasar/pengertian_letak")
    reach = page.evaluate("""() => {
        const bar = document.querySelector('.workspace__actions .actionbar');
        const fab = document.querySelector('.fs-btn');
        if (!bar || !fab) return { found: false };
        const b = bar.getBoundingClientRect();
        const f = fab.getBoundingClientRect();
        // Titik tengah tombol aksi paling kanan harus benar-benar bisa diklik,
        // bukan tertutup tombol layar penuh yang mengambang.
        const buttons = [...bar.querySelectorAll('button')];
        const last = buttons[buttons.length - 1];
        const lr = last ? last.getBoundingClientRect() : null;
        const hit = lr ? document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2) : null;
        return {
            found: true,
            overlapsFab: lr ? !(lr.right < f.left || lr.left > f.right
                                || lr.bottom < f.top || lr.top > f.bottom) : false,
            hitIsAction: !!(hit && last && (last === hit || last.contains(hit))),
            barVisible: b.top >= 0 && b.height > 0,
        };
    }""")
    record("Tombol aksi tidak tertutup tombol layar penuh",
           reach.get("overlapsFab") is False, json.dumps(reach))
    record("Titik tengah tombol aksi benar-benar bisa diklik",
           reach.get("hitIsAction") is True, json.dumps(reach))
    record("Bilah aksi terlihat di lanskap ponsel", reach.get("barVisible") is True, json.dumps(reach))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n52. Tidak ada pergeseran: vonis ordo & pembahasan kuis")
    open_fresh(page, "#/belajar/01_konsep_dasar/ordo_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    shift = page.evaluate("""() => new Promise(resolve => {
        const slot = document.querySelector('.reserved-slot--verdict');
        const grid = document.querySelector('.matrix__bracket');
        if (!slot || !grid) return resolve({ found: false });
        const reserved = Math.round(slot.getBoundingClientRect().height);

        // Setel slider LEBIH DULU. Mengubah ordo memang menumbuhkan matriks —
        // itu bukan pergeseran yang sedang diuji. Posisi awal diambil setelah
        // grid-nya mantap, supaya yang terukur murni efek munculnya vonis.
        const ranges = [...document.querySelectorAll('input[type=range]')];
        ranges.forEach(r => { r.value = '2'; r.dispatchEvent(new Event('input', { bubbles: true })); });

        setTimeout(() => {
            const before = Math.round(grid.getBoundingClientRect().top);
            const cek = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Cek Ordo'));
            if (cek) cek.click();
            setTimeout(() => resolve({
                found: true, before, reserved,
                after: Math.round(grid.getBoundingClientRect().top),
            }), 700);
        }, 250);
    })""")
    record("Ruang vonis ordo dipesan sejak awal",
           bool(shift.get("found")) and shift["reserved"] >= 60, json.dumps(shift))
    record("Matriks tidak bergeser saat vonis muncul",
           bool(shift.get("found")) and abs(shift["after"] - shift["before"]) <= 1, json.dumps(shift))

    feedback = page.evaluate("""() => {
        const n = document.querySelector('.quiz__feedback');
        return { exists: !!n };
    }""")
    open_fresh(page, "#/kuis/latihan_bab/01_konsep_dasar")
    quiz_shift = page.evaluate("""() => new Promise(resolve => {
        const host = document.querySelector('.quiz__feedback');
        const prompt = document.querySelector('.quiz__prompt');
        if (!host || !prompt) return resolve({ found: false });
        const reserved = Math.round(host.getBoundingClientRect().height);
        const before = Math.round(prompt.getBoundingClientRect().top);
        const opt = document.querySelector('.option');
        if (opt) opt.click();
        const submit = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Periksa'));
        if (submit) submit.click();
        setTimeout(() => resolve({
            found: true, reserved, before,
            after: Math.round(prompt.getBoundingClientRect().top),
            scrolls: getComputedStyle(host).overflowY,
        }), 800);
    })""")
    record("Ruang pembahasan kuis dipesan sejak awal",
           bool(quiz_shift.get("found")) and quiz_shift["reserved"] >= 90, json.dumps(quiz_shift))
    record("Soal tidak bergeser saat pembahasan muncul",
           bool(quiz_shift.get("found")) and abs(quiz_shift["after"] - quiz_shift["before"]) <= 1,
           json.dumps(quiz_shift))

    print("\n53. Ingatan sesi: kembali ke tempat terakhir")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    # Mundur ke menu utama, lalu masuk lagi ke sub-topik yang sama.
    page.goto(f"{BASE}/#/")
    page.wait_for_timeout(600)
    page.goto(f"{BASE}/#/belajar/02_operasi_aljabar/perkalian_matriks")
    page.reload()
    page.wait_for_timeout(1000)
    resumed = page.evaluate("""() => {
        const active = document.querySelector('.steps__item[data-state="active"]');
        const idx = active ? [...active.parentElement.children].indexOf(active) : -1;
        return {
            step: idx,
            onSim: !!document.querySelector('.sim'),
            saved: (() => { try { return sessionStorage.getItem('matriksLab.session.v1'); } catch (e) { return null; } })(),
        };
    }""")
    record("Kembali ke langkah Simulasi, bukan Materi",
           resumed["step"] == 1 and resumed["onSim"] is True, json.dumps(resumed)[:220])
    record("Posisi tersimpan di sessionStorage", bool(resumed.get("saved")), json.dumps(resumed)[:220])

    # Nomor soal kuis juga diingat.
    open_fresh(page, "#/kuis/latihan_bab/01_konsep_dasar")
    moved = page.evaluate("""() => new Promise(resolve => {
        const opt = document.querySelector('.option');
        if (opt) opt.click();
        const submit = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Periksa'));
        if (submit) submit.click();
        setTimeout(() => {
            const next = [...document.querySelectorAll('button')]
                .find(b => b.textContent.includes('Soal Berikutnya'));
            if (next) next.click();
            setTimeout(() => resolve({
                counter: (document.querySelector('.quiz-nav__count') || {}).textContent,
            }), 700);
        }, 900);
    })""")
    page.goto(f"{BASE}/#/")
    page.wait_for_timeout(500)
    page.goto(f"{BASE}/#/kuis/latihan_bab/01_konsep_dasar")
    page.reload()
    page.wait_for_timeout(900)
    back = page.evaluate("() => (document.querySelector('.quiz-nav__count') || {}).textContent")
    record("Kuis kembali ke nomor soal terakhir",
           back == moved.get("counter") and back not in (None, ""),
           f"sebelum: {moved.get('counter')} · sesudah: {back}")

    print("\n54. Kesamaan matriks: dua ketukan, jawaban tidak dibocorkan")
    open_fresh(page, "#/belajar/01_konsep_dasar/kesamaan_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    eq2 = page.evaluate("""() => new Promise(resolve => {
        const m = document.querySelectorAll('.matrix');
        const L = [...m[0].querySelectorAll('.cell')];
        const R = [...m[1].querySelectorAll('.cell')];
        L[3].click();                                  // sel bervariabel 2q
        const lit = R.filter(c => c.classList.contains('cell--pulse')).length;
        const litIsPartner = R[3].classList.contains('cell--pulse');
        const panelBefore = !!document.querySelector('.equation-panel');
        setTimeout(() => {
            R[1].click();                              // pasangan SALAH
            const wrongToast = document.querySelectorAll('.toast--error').length;
            setTimeout(() => {
                R[3].click();                          // pasangan benar
                setTimeout(() => resolve({
                    lit, litIsPartner, panelBefore, wrongToast,
                    panel: !!document.querySelector('.equation-panel'),
                    eq: (document.querySelector('.equation-panel__slot') || {}).textContent || '',
                    asks: !!document.querySelector('.equation-panel__ask .numfield'),
                    cellStillVariable: L[3].textContent.trim().includes('q'),
                }), 2600);
            }, 500);
        }, 300);
    })""")
    record("Ketukan 1 hanya menyalakan pasangan seletak",
           eq2["lit"] == 1 and eq2["litIsPartner"] is True, json.dumps(eq2)[:220])
    record("Pasangan keliru ditolak dengan Toast", eq2["wrongToast"] >= 1, json.dumps(eq2)[:220])
    record("Persamaan baru muncul SETELAH ketukan kedua",
           eq2["panelBefore"] is False and eq2["panel"] is True, json.dumps(eq2)[:220])
    record("Nilai variabel diisi siswa, bukan dibocorkan",
           eq2["asks"] is True and eq2["cellStillVariable"] is True, json.dumps(eq2)[:220])

    print("\n55. Penjumlahan: langkah demi langkah + sel lain dikunci")
    open_fresh(page, "#/belajar/02_operasi_aljabar/penjumlahan_pengurangan")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    page.evaluate("""() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Coba Jumlahkan'));
        if (b) b.click();
    }""")
    page.wait_for_timeout(900)
    page.evaluate("""() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Paham'));
        if (b) b.click();
    }""")
    page.wait_for_timeout(900)
    add = page.evaluate("""() => new Promise(resolve => {
        const m = document.querySelectorAll('.matrix');
        const A = [...m[0].querySelectorAll('.cell')];
        const B = [...m[1].querySelectorAll('.cell')];
        const C = [...m[2].querySelectorAll('.cell')];
        A[0].click();
        const state = {
            partnerLit: B[0].classList.contains('cell--pulse'),
            mutedB: B.filter(c => c.classList.contains('cell--muted')).length,
            mutedA: A.filter(c => c.classList.contains('cell--muted')).length,
            confirmHidden: document.querySelector('.workstrip__confirm').hidden,
        };
        setTimeout(() => {
            B[1].click();                             // pasangan tidak seletak
            const wrongToast = document.querySelectorAll('.toast--error').length;
            setTimeout(() => {
                B[0].click();
                setTimeout(() => {
                    const expr = (C[0].querySelector('.cell__expr') || {}).textContent || '';
                    const shown = !document.querySelector('.workstrip__confirm').hidden;
                    document.querySelector('.workstrip__confirm').click();
                    setTimeout(() => resolve({
                        ...state, wrongToast, expr, shown,
                        value: C[0].textContent.trim(),
                        done: C[0].classList.contains('cell--done'),
                    }), 1400);
                }, 1600);
            }, 500);
        }, 300);
    })""")
    record("Pasangan seletak menyala setelah ketukan di A", add["partnerLit"] is True, json.dumps(add))
    record("Sel lain dikunci selama satu urutan",
           add["mutedA"] >= 3 and add["mutedB"] >= 3, json.dumps(add))
    record("Tombol hitung belum ada sebelum pasangan lengkap",
           add["confirmHidden"] is True, json.dumps(add))
    record("Pasangan tidak seletak ditolak dengan Toast", add["wrongToast"] >= 1, json.dumps(add))
    record("Sel menampilkan bentuk (6+1) dulu", add["expr"] == "(6+1)", json.dumps(add))
    record("Tombol hitung muncul setelah lengkap", add["shown"] is True, json.dumps(add))
    record("Hasil 7 mendarat di matriks C",
           add["value"].startswith("7") and add["done"] is True, json.dumps(add))

    print("\n56. Determinan 2x2: ketuk-ketuk, urutan bebas")
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    det = page.evaluate("""() => new Promise(resolve => {
        const cells = () => [...document.querySelectorAll('.sim .matrix .cell')];
        const c = cells();
        c[1].click();                                  // bukan diagonal utama
        const wrongToast = document.querySelectorAll('.toast--error').length;
        const linesBefore = document.querySelectorAll('.strike-line').length;
        c[3].click(); c[0].click();                    // urutan TERBALIK, harus sah
        setTimeout(() => {
            const after = {
                wrongToast, linesBefore,
                lines1: document.querySelectorAll('.strike-line').length,
                blue: (document.querySelector('.det-expr__term--blue') || {}).textContent,
            };
            const c2 = cells();
            c2[2].click(); c2[1].click();
            setTimeout(() => resolve({
                ...after,
                lines2: document.querySelectorAll('.strike-line').length,
                result: (document.querySelector('.scalar-result__value') || {}).textContent,
                done: !!document.querySelector('.sim--done'),
            }), 3000);
        }, 2600);
    })""")
    record("Ketukan di luar diagonal ditolak dengan Toast", det["wrongToast"] >= 1, json.dumps(det))
    record("Garis baru digambar SETELAH pilihan tepat",
           det["linesBefore"] == 0 and det["lines1"] == 1, json.dumps(det))
    record("Urutan ketukan bebas tetap diterima", det["blue"] == "30", json.dumps(det))
    record("Dua diagonal menghasilkan dua garis", det["lines2"] == 2, json.dumps(det))
    record("Determinan 6x5-2x4 = 22", det["result"] == "22", json.dumps(det))
    record("Simulasi determinan selesai", det["done"] is True, json.dumps(det))

    print("\n57. Invers 2x2 ditangguhkan dengan jujur")
    # Fase 12: engine invers 2x2 DICABUT dan diganti placeholder. Panggung
    # kosong tidak bisa dibedakan dari aplikasi yang rusak, jadi ia harus
    # mengatakan apa adanya — dan tidak boleh ikut mengunci Mini Kuis.
    open_fresh(page, "#/belajar/03_determinan_invers/invers_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    soon2 = page.evaluate(PANEL_SEGERA_HADIR)
    record("Panel 'Segera Hadir' tampil di invers 2x2", soon2["panel"] is True, json.dumps(soon2)[:200])
    record("Judulnya berbunyi 'Segera Hadir'", soon2["title"] == "Segera Hadir", json.dumps(soon2)[:200])
    record("Struktur .stage tetap standar", soon2["stage"] is True, json.dumps(soon2)[:200])
    record("Mini Kuis invers 2x2 tetap terbuka", soon2["nextEnabled"] is True, json.dumps(soon2)[:200])
    record("Tidak ada isian yang menyesatkan di invers 2x2",
           soon2["numfields"] == 0, json.dumps(soon2)[:200])

    print("\n58. Invers 3x3 ditangguhkan dengan jujur")
    open_fresh(page, "#/belajar/03_determinan_invers/invers_3x3")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    wip = page.evaluate(PANEL_SEGERA_HADIR)
    record("Panel 'Segera Hadir' tampil di invers 3x3", wip["panel"] is True, json.dumps(wip)[:200])
    record("Struktur .stage tetap standar", wip["stage"] is True, json.dumps(wip)[:200])
    record("Siswa tetap bisa lanjut ke Mini Kuis", wip["nextEnabled"] is True, json.dumps(wip)[:200])
    record("Tidak ada isian kofaktor yang menyesatkan", wip["numfields"] == 0, json.dumps(wip)[:200])

    print("\n59. Layar 'Sub-topik selesai' besar & terpusat")
    # Diuji pada layar penutup SUNGGUHAN: Mini Kuis dikerjakan sampai tuntas,
    # lalu geometrinya diukur. Menguji kelas CSS lewat elemen tiruan pernah
    # membuat uji ini lolos/gagal karena patokannya, bukan karena tampilannya.
    for vp in ({"width": 1280, "height": 800}, {"width": 844, "height": 390}):
        page.set_viewport_size(vp)
        tag = f'{vp["width"]}x{vp["height"]}'

        # Kosongkan penyimpanan lalu RELOAD. Tanpa reload, cache progressStore
        # yang masih hidup di memori akan menulis ulang state lama ke
        # localStorage saat sub-topik dibuka — sub-topiknya terbuka dalam mode
        # review, dan layar penutup memang tidak pernah muncul di sana.
        page.goto(f"{BASE}/#/")
        page.wait_for_timeout(300)
        page.evaluate("() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }")
        page.reload()
        page.wait_for_timeout(500)

        page.goto(f"{BASE}/#/belajar/01_konsep_dasar/transpose")
        page.wait_for_timeout(400)

        # Masuk langsung ke Mini Kuis lewat ingatan sesi — jalur yang memang
        # disediakan Fase 8, jadi ujinya tidak perlu mengarang pintasan.
        # Sub-topik "transpose" dipilih karena kedua soalnya pilihan ganda.
        page.evaluate("""() => {
            const state = {};
            state['lesson:01_konsep_dasar/transpose'] = { step: 2, simulationDone: true };
            sessionStorage.setItem('matriksLab.session.v1', JSON.stringify(state));
        }""")
        page.reload()
        page.wait_for_timeout(900)

        # Mini Kuis mewajibkan jawaban BENAR untuk lanjut, jadi opsi ditelusuri
        # satu per satu sampai ketemu — persis yang dilakukan siswa yang
        # mengulang, dan tanpa perlu menanam kunci jawaban di dalam uji.
        for attempt in range(24):
            done = page.evaluate("""(k) => {
                if (document.querySelector('.lesson-done')) return true;
                const opts = [...document.querySelectorAll('.option:not(.option--locked)')];
                if (opts.length) opts[k % opts.length].click();
                const btn = [...document.querySelectorAll('button')].find(b => {
                    const t = b.textContent;
                    return !b.disabled && (t.includes('Periksa Jawaban')
                        || t.includes('Soal Berikutnya') || t.includes('Selesai')
                        || t.includes('Coba Lagi'));
                });
                if (btn) btn.click();
                return false;
            }""", attempt)
            page.wait_for_timeout(420)
            if done:
                break

        geo = page.evaluate("""() => {
            const panel = document.querySelector('.lesson-done');
            const card = document.querySelector('.lesson-done__card');
            if (!panel || !card) return { found: false };
            const p = panel.getBoundingClientRect();
            const r = card.getBoundingClientRect();
            return {
                found: true,
                // Terpusat DI DALAM panelnya sendiri — itulah wadah yang benar.
                leftGap: Math.round(r.left - p.left),
                rightGap: Math.round(p.right - r.right),
                cardW: Math.round(r.width),
                cardH: Math.round(r.height),
                panelW: Math.round(p.width),
                panelH: Math.round(p.height),
                barH: (() => {
                    const bar = panel.querySelector('.actionbar');
                    return bar ? Math.round(bar.getBoundingClientRect().height) : 0;
                })(),
                inView: r.top >= 0 && r.bottom <= window.innerHeight + 1,
                title: (document.querySelector('.lesson-done__title') || {}).textContent || '',
            };
        }""")

        record(f"Layar penutup benar-benar muncul @{tag}",
               bool(geo.get("found")) and "selesai" in geo.get("title", "").lower(), json.dumps(geo))

        if geo.get("found"):
            record(f"Layar penutup terpusat sempurna @{tag}",
                   abs(geo["leftGap"] - geo["rightGap"]) <= 2, json.dumps(geo))
            # "Terlalu kecil" adalah keluhan aslinya: kartu harus memakai
            # lebar yang tersedia (sampai batas keterbacaan 760px) dan
            # mengisi tinggi panelnya, bukan mengambang kecil di tengah.
            record(f"Layar penutup memakai lebar yang ada @{tag}",
                   geo["cardW"] >= min(geo["panelW"], 760) - 4, json.dumps(geo))
            record(f"Layar penutup mengisi baris kartunya @{tag}",
                   geo["cardH"] >= geo["panelH"] - geo["barH"] - 32, json.dumps(geo))
            record(f"Layar penutup utuh dalam viewport @{tag}",
                   geo["inView"] is True, json.dumps(geo))
        else:
            for label in ("terpusat sempurna", "memakai lebar yang ada",
                          "mengisi baris kartunya", "utuh dalam viewport"):
                record(f"Layar penutup {label} @{tag}", False, json.dumps(geo))

    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n60. Hasil sifat determinan terpusat & lebih besar")
    open_fresh(page, "#/belajar/03_determinan_invers/sifat_determinan")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    # Fase 12: interaksinya KETUK, bukan seret — jadi kartunya diketuk
    # satu per satu sampai ada yang diterima.
    rule = page.evaluate("""() => new Promise(resolve => {
        const cards = [...document.querySelectorAll('.hots__card')];
        const zone = document.querySelector('.dropzone');
        if (!cards.length || !zone) return resolve({ found: false });
        let i = 0;
        const tapNext = () => {
            if (i >= cards.length) return;
            cards[i].dispatchEvent(new MouseEvent('click',
                { bubbles: true, clientX: 1, clientY: 1 }));
            i += 1;
            if (!document.querySelector('.rule-result')) setTimeout(tapNext, 220);
        };
        tapNext();
        setTimeout(() => {
            const res = document.querySelector('.rule-result');
            if (!res) return resolve({ found: true, filled: false });
            const cs = getComputedStyle(res);
            const ans = document.querySelector('.rule-result__answer');
            const r = res.getBoundingClientRect();
            const host = res.parentElement.getBoundingClientRect();
            resolve({
                found: true, filled: true,
                justify: cs.justifyItems,
                align: cs.textAlign,
                answerFs: ans ? parseFloat(getComputedStyle(ans).fontSize) : 0,
                centered: Math.abs((r.left - host.left) - (host.right - r.right)) <= 3,
            });
        }, 1200);
    })""")
    if rule.get("filled"):
        record("Hasil sifat determinan dipusatkan",
               rule["justify"] == "center" and rule["align"] == "center", json.dumps(rule))
        record("Hasil sifat determinan wadahnya terpusat", rule["centered"] is True, json.dumps(rule))
        record("Ukuran huruf hasil dinaikkan", rule["answerFs"] >= 17, json.dumps(rule))
    else:
        record("Hasil sifat determinan dipusatkan", False, json.dumps(rule))
        record("Hasil sifat determinan wadahnya terpusat", False, json.dumps(rule))
        record("Ukuran huruf hasil dinaikkan", False, json.dumps(rule))

    print("\n61. Lanskap: simulasi tidak pernah menggulirkan halaman")
    # Panggung boleh menggulir DI DALAM dirinya sendiri kalau simulasinya
    # memang lebih tinggi dari layar lanskap, tapi halamannya tidak boleh —
    # bilah aksi harus selalu terlihat tanpa siswa menggulir apa pun.
    for vp in ({"width": 844, "height": 390}, {"width": 1024, "height": 600}):
        page.set_viewport_size(vp)
        tag = f'{vp["width"]}x{vp["height"]}'
        worst = None
        for route in ["01_konsep_dasar/kesamaan_matriks",
                      "02_operasi_aljabar/penjumlahan_pengurangan",
                      "02_operasi_aljabar/perkalian_matriks",
                      "03_determinan_invers/determinan_3x3",
                      "03_determinan_invers/invers_2x2",
                      "04_pemodelan_tka/analisis_multi_kondisi"]:
            open_fresh(page, f"#/belajar/{route}")
            b = page.query_selector("button:has-text('Mulai Simulasi')")
            if b:
                b.click()
                page.wait_for_timeout(700)
            geo = page.evaluate("""() => {
                const body = document.querySelector('.workspace__body');
                const bar = document.querySelector('.workspace__actions .actionbar');
                const foot = document.querySelector('.app-footer');
                if (!body || !bar) return { found: false };
                const r = bar.getBoundingClientRect();
                // Di lanskap pendek footer memang disembunyikan; elemen
                // display:none melaporkan rect nol, jadi batas bawahnya adalah
                // tepi viewport — bukan angka 0 yang menyesatkan.
                const fr = foot ? foot.getBoundingClientRect() : null;
                const limit = (fr && fr.height > 0) ? fr.top : window.innerHeight;
                return {
                    found: true,
                    pageScrolls: document.body.scrollHeight > document.body.clientHeight + 1,
                    appExact: (() => {
                        const app = document.getElementById('app');
                        return Math.abs(Math.round(app.getBoundingClientRect().height)
                                        - window.innerHeight) <= 1;
                    })(),
                    barBottom: Math.round(r.bottom),
                    limit: Math.round(limit),
                    barVisible: r.top >= 0 && r.bottom <= limit + 1 && r.height > 0,
                };
            }""")
            # Fase 10: `.workspace__body` ADALAH wadah gulir panggung, jadi
            # luapannya bukan lagi tanda bug. Yang harus tetap benar: halaman
            # sendiri tidak menggulir, dan bilah aksi tetap terlihat.
            if (not geo.get("found") or geo["pageScrolls"]
                    or not geo["appExact"] or not geo["barVisible"]):
                worst = {"route": route, **geo}
                break
        record(f"Simulasi tidak menggulirkan halaman @{tag}", worst is None,
               json.dumps(worst) if worst else "")
        record(f"Bilah aksi simulasi selalu terlihat @{tag}", worst is None,
               json.dumps(worst) if worst else "")
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n62. Kartu simulasi yang menggulir, panggung tetap terbaca")
    # Fase 9 membalik kebijakan Fase 8. Dulu panggung dipaksa menyusut supaya
    # muat; akibatnya sel matriks mengecil sampai sulit diketuk. Sekarang
    # KARTUNYA yang menggulir, dan panggung mempertahankan tinggi bacanya.
    page.set_viewport_size({"width": 844, "height": 390})
    open_fresh(page, "#/belajar/04_pemodelan_tka/analisis_multi_kondisi")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    absorb = page.evaluate("""() => {
        const body = document.querySelector('.ws-stage > .workspace__body');
        const stage = document.querySelector('.stage');
        const side = document.querySelector('.ws-side');
        if (!body || !stage || !side) return { found: false };
        const cs = getComputedStyle(body);
        return {
            found: true,
            bodyH: body.clientHeight,
            stageScrolls: cs.overflowY === 'auto',
            sideFits: Math.round(side.getBoundingClientRect().bottom)
                      <= Math.round(body.getBoundingClientRect().bottom) + 2,
            stageH: Math.round(stage.getBoundingClientRect().height),
            cellH: (() => {
                const c = document.querySelector('.cell');
                return c ? Math.round(c.getBoundingClientRect().height) : 0;
            })(),
        };
    }""")
    record("Kolom panggung yang menggulir", absorb.get("stageScrolls") is True, json.dumps(absorb))
    record("Panel kendali tidak ikut meluap", absorb.get("sideFits") is True, json.dumps(absorb))
    record("Panggung tetap punya tinggi baca",
           absorb.get("stageH", 0) >= 150, json.dumps(absorb))
    record("Sel matriks tetap cukup besar untuk diketuk",
           absorb.get("cellH", 0) >= 30, json.dumps(absorb))
    page.set_viewport_size({"width": 1280, "height": 860})

    # ============================================================
    # Fase 9 — pivot: media terkunci lanskap, layar masuk, tiga kasus
    # ============================================================

    print("\n63. Lab Maya benar-benar dicabut")
    page.set_viewport_size({"width": 1280, "height": 860})
    open_fresh(page, "#/")
    purge = page.evaluate("""() => ({
        labNodes: document.querySelectorAll('.lab-card, .lab__grid, .lab__intro, .wb__canvas').length,
        menuCards: [...document.querySelectorAll('.mode-card__title')].map(t => t.textContent.trim()),
    })""")
    record("Tidak ada sisa markup Lab Maya", purge["labNodes"] == 0, json.dumps(purge))
    record("Menu utama berisi dua kartu mode",
           purge["menuCards"] == ["Belajar", "Kuis"], json.dumps(purge))

    page.goto(f"{BASE}/#/whiteboard")
    page.wait_for_timeout(700)
    gone = page.evaluate("""() => ({
        lab: document.querySelectorAll('.lab-card').length,
        // Rute yang sudah dihapus jatuh ke penanganan "tidak ditemukan".
        empty: !!document.querySelector('.empty-state'),
    })""")
    record("Rute #/whiteboard tidak lagi memuat Lab Maya",
           gone["lab"] == 0, json.dumps(gone))

    print("\n64. Layar masuk & papan huruf kustom")
    # "Keluar" kini berarti membuang identitas dari localStorage.
    page.evaluate("() => { try { localStorage.removeItem('matriksLab.identity.v1'); sessionStorage.clear(); } catch (e) {} }")
    page.goto(f"{BASE}/#/login")
    page.reload()
    page.wait_for_timeout(900)
    login = page.evaluate("""() => {
        const nama = document.querySelector('#login-nama');
        const sekolah = document.querySelector('#login-sekolah');
        if (!nama || !sekolah) return { found: false };
        return {
            found: true,
            // Keyboard OS TIDAK BOLEH bisa muncul di kedua isian.
            namaReadOnly: nama.readOnly,
            namaInputMode: nama.getAttribute('inputmode'),
            sekolahReadOnly: sekolah.readOnly,
            sekolahInputMode: sekolah.getAttribute('inputmode'),
            hasSubmit: !!document.querySelector('.login__submit'),
        };
    }""")
    record("Layar masuk punya isian Nama & Asal Sekolah", login.get("found") is True, json.dumps(login))
    record("Kedua isian menolak keyboard OS",
           login.get("namaReadOnly") is True and login.get("namaInputMode") == "none"
           and login.get("sekolahReadOnly") is True and login.get("sekolahInputMode") == "none",
           json.dumps(login))

    typed = page.evaluate("""() => new Promise(resolve => {
        const press = el => el && el.dispatchEvent(new PointerEvent('pointerdown',
            { bubbles: true, cancelable: true, composed: true, pointerId: 1,
              pointerType: 'mouse', button: 0, isPrimary: true }));
        const nama = document.querySelector('#login-nama');
        const b = nama.getBoundingClientRect();
        nama.dispatchEvent(new PointerEvent('pointerdown',
            { bubbles: true, cancelable: true, composed: true, clientX: b.left + 8, clientY: b.top + 8,
              pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true }));
        setTimeout(() => {
            const pad = document.querySelector('.mathpad');
            const letters = [...document.querySelectorAll('.mp-abc[data-letter]')];
            const opened = {
                padOpen: pad && pad.dataset.open === 'true',
                textMode: pad && pad.classList.contains('mathpad--text'),
                letterCount: letters.length,
                hasSpace: !!document.querySelector('.mp-abc--space'),
                numpadHidden: getComputedStyle(document.querySelector('.mathpad__grid')).display === 'none',
            };
            const pick = ch => press(letters.find(l => l.dataset.letter === ch));
            ['B', 'U', 'D', 'I'].forEach(pick);
            press(document.querySelector('.mp-abc--space'));
            pick('S');
            setTimeout(() => resolve({
                ...opened,
                value: nama.value,
                preview: document.querySelector('.mathpad__preview').textContent.trim(),
            }), 200);
        }, 320);
    })""")
    record("Ketuk isian membuka papan huruf, bukan keyboard OS",
           typed.get("padOpen") is True and typed.get("textMode") is True, json.dumps(typed))
    record("Papan huruf memuat 26 huruf + spasi",
           typed.get("letterCount") == 26 and typed.get("hasSpace") is True, json.dumps(typed))
    record("Tombol angka disembunyikan di mode teks",
           typed.get("numpadHidden") is True, json.dumps(typed))
    record("Huruf yang diketuk masuk ke isian",
           typed.get("value") == "BUDI S", json.dumps(typed))
    dismiss_pad(page)

    saved = page.evaluate("""() => new Promise(resolve => {
        const press = el => el && el.dispatchEvent(new PointerEvent('pointerdown',
            { bubbles: true, cancelable: true, composed: true, pointerId: 1,
              pointerType: 'mouse', button: 0, isPrimary: true }));
        const nama = document.querySelector('#login-nama');
        const sekolah = document.querySelector('#login-sekolah');
        nama.value = 'Budi Santoso';
        sekolah.value = 'SMAS YPVDP Bontang';
        document.querySelector('.login__submit').click();
        setTimeout(() => {
            let stored = null;
            try { stored = JSON.parse(localStorage.getItem('matriksLab.identity.v1')); } catch (e) {}
            resolve({
                hash: location.hash,
                stored,
                greet: (document.querySelector('.menu__title') || {}).textContent || '',
                school: (document.querySelector('.menu__greet') || {}).textContent || '',
            });
        }, 900);
    })""")
    record("Identitas tersimpan di localStorage",
           bool(saved.get("stored")) and saved["stored"].get("nama") == "Budi Santoso",
           json.dumps(saved))
    record("Menu utama menyapa dengan nama depan",
           "Budi" in saved.get("greet", ""), json.dumps(saved))
    record("Asal sekolah ikut ditampilkan",
           "YPVDP" in saved.get("school", ""), json.dumps(saved))

    empty = page.evaluate("""() => new Promise(resolve => {
        try { localStorage.removeItem('matriksLab.identity.v1'); } catch (e) {}
        sessionStorage.clear();
        location.hash = '#/login';
        setTimeout(() => {
            document.querySelector('.login__submit').click();
            setTimeout(() => resolve({
                hash: location.hash,
                toast: (document.querySelector('.toast--error') || {}).textContent || '',
                invalid: document.querySelectorAll('.login__input.is-invalid').length,
            }), 400);
        }, 700);
    })""")
    record("Isian kosong ditolak dengan penjelasan",
           "#/login" in empty.get("hash", "") and "Nama" in empty.get("toast", ""),
           json.dumps(empty)[:220])

    print("\n65. Tombol layar penuh global")
    open_fresh(page, "#/")
    fs = page.evaluate("""() => {
        const btn = document.querySelector('.fs-btn[data-role="fullscreen"]');
        if (!btn) return { found: false };
        const cs = getComputedStyle(btn);
        const r = btn.getBoundingClientRect();
        return {
            found: true,
            fixed: cs.position === 'fixed',
            z: Number(cs.zIndex),
            outsideApp: !document.getElementById('app').contains(btn),
            label: btn.textContent.trim(),
            inView: r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1,
        };
    }""")
    record("Tombol layar penuh mengambang tetap",
           fs.get("fixed") is True and fs.get("z", 0) >= 50, json.dumps(fs))
    record("Hidup di luar #app agar tak ikut dibongkar",
           fs.get("outsideApp") is True, json.dumps(fs))
    record("Berlabel 'Layar Penuh' dan utuh di layar",
           "Layar Penuh" in fs.get("label", "") and fs.get("inView") is True, json.dumps(fs))

    print("\n66. Perkalian matriks: tiga kasus, ordo berbeda")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    cases = page.evaluate("""() => ({
        chips: document.querySelectorAll('.case-chip').length,
        ordos: [...document.querySelectorAll('.case-chip span')].map(x => x.textContent.trim()),
        sliders: document.querySelectorAll('.slider__nav').length,
        stages: document.querySelectorAll('.stage').length,
        cells: document.querySelectorAll('.cell').length,
    })""")
    record("Tersedia tiga kasus perkalian", cases["chips"] == 3, json.dumps(cases))
    record("Ordonya benar-benar berbeda",
           cases["ordos"] == ["2×2 · 2×2", "2×3 · 3×1", "3×3 · 3×3"], json.dumps(cases))
    record("Kasus 1 memakai 12 sel (2×2 · 2×2 · 2×2)", cases["cells"] == 12, json.dumps(cases))

    switched = page.evaluate("""() => new Promise(resolve => {
        document.querySelectorAll('.case-chip')[1].click();
        setTimeout(() => {
            const state2 = {
                cells: document.querySelectorAll('.cell').length,
                sliders: document.querySelectorAll('.slider__nav').length,
                stages: document.querySelectorAll('.stage').length,
                span: document.querySelector('.stage').dataset.span,
            };
            document.querySelectorAll('.case-chip')[2].click();
            setTimeout(() => resolve({
                case2: state2,
                case3: {
                    cells: document.querySelectorAll('.cell').length,
                    sliders: document.querySelectorAll('.slider__nav').length,
                    stages: document.querySelectorAll('.stage').length,
                    span: document.querySelector('.stage').dataset.span,
                    steps: document.querySelectorAll('.slider-dot').length,
                },
            }), 900);
        }, 900);
    })""")
    # 2×3 · 3×1 -> 6 + 3 + 2 = 11 sel; 3×3 · 3×3 -> 9 + 9 + 9 = 27 sel.
    record("Kasus 2 menskalakan ke 2×3 · 3×1",
           switched["case2"]["cells"] == 11, json.dumps(switched["case2"]))
    record("Kasus 3 menskalakan ke 3×3 · 3×3",
           switched["case3"]["cells"] == 27, json.dumps(switched["case3"]))
    record("Matriks lebar diberi penanda skala",
           switched["case3"]["span"] == "wide", json.dumps(switched["case3"]))
    record("Sembilan langkah sel untuk kasus 3×3",
           switched["case3"]["steps"] == 9, json.dumps(switched["case3"]))

    print("\n67. Teardown bersih: tidak ada elemen kembar")
    record("Pindah kasus tidak menggandakan slider",
           switched["case2"]["sliders"] == 1 and switched["case3"]["sliders"] == 1,
           json.dumps(switched))
    record("Pindah kasus tidak menggandakan panggung",
           switched["case2"]["stages"] == 1 and switched["case3"]["stages"] == 1,
           json.dumps(switched))

    bounce = page.evaluate("""() => new Promise(resolve => {
        // Bolak-balik Materi -> Simulasi -> Materi -> Simulasi.
        const tabs = () => [...document.querySelectorAll('.steps__item')];
        const back = [...document.querySelectorAll('.actionbar button')]
            .find(x => x.textContent.includes('Materi'));
        if (back) back.click();
        setTimeout(() => {
            const go = [...document.querySelectorAll('.actionbar button')]
                .find(x => x.textContent.includes('Mulai Simulasi'));
            if (go) go.click();
            setTimeout(() => resolve({
                sliders: document.querySelectorAll('.slider__nav').length,
                stages: document.querySelectorAll('.stage').length,
                caseBars: document.querySelectorAll('.case-bar').length,
                sims: document.querySelectorAll('.sim').length,
                cards: document.querySelectorAll('.content-card--tight').length,
                ghosts: document.querySelectorAll('.fly-chip, .drag-ghost, .diag-trace').length,
            }), 1100);
        }, 800);
    })""")
    record("Bolak-balik layar tidak menyisakan slider kembar",
           bounce["sliders"] == 1, json.dumps(bounce))
    record("Hanya ada satu panggung & satu bilah kasus",
           bounce["stages"] == 1 and bounce["caseBars"] == 1, json.dumps(bounce))
    record("Hanya ada satu instans simulasi", bounce["sims"] == 1, json.dumps(bounce))
    record("Tidak ada chip terbang yang tertinggal", bounce["ghosts"] == 0, json.dumps(bounce))

    print("\n68. Navigasi Mini Kuis: maju, mundur, pelacak progres")
    open_fresh(page, "#/kuis/latihan_bab/01_konsep_dasar")
    nav = page.evaluate("""() => new Promise(resolve => {
        const count = () => (document.querySelector('.quiz-nav__count') || {}).textContent.trim();
        const prev = document.querySelector('.quiz-nav .btn:first-child');
        const next = document.querySelector('.quiz-nav .btn:last-child');
        const start = {
            count: count(),
            prevDisabled: prev.disabled,
            nextDisabled: next.disabled,
            steps: document.querySelectorAll('.quiz-nav__step').length,
        };
        // Jawab soal pertama supaya soal kedua terbuka. Soal pertama tiap bank
        // bertipe isian angka, jadi jawabannya diketuk lewat Mathpad —
        // benar atau salah sama saja, yang diuji navigasinya.
        const press = el => el && el.dispatchEvent(new PointerEvent('pointerdown',
            { bubbles: true, cancelable: true, composed: true, pointerId: 1,
              pointerType: 'mouse', button: 0, isPrimary: true }));
        const opt = document.querySelector('.option');
        if (opt) {
            opt.click();
        } else {
            const field = document.querySelector('.numfield');
            if (field) {
                const fb = field.getBoundingClientRect();
                field.dispatchEvent(new PointerEvent('pointerdown',
                    { bubbles: true, cancelable: true, composed: true,
                      clientX: fb.left + 8, clientY: fb.top + 8,
                      pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true }));
            }
        }
        setTimeout(() => {
            if (!opt) {
                const keys = [...document.querySelectorAll('.mp-key')];
                press(keys.find(k => k.textContent.trim() === '2'));
                press(document.querySelector('.mp-key--confirm'));
            }
            const check = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Periksa'));
            if (check) check.click();
            setTimeout(() => {
            const go = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Soal Berikutnya'));
            if (go) go.click();
            setTimeout(() => {
                const onTwo = count();
                document.querySelector('.quiz-nav .btn:first-child').click();
                setTimeout(() => resolve({ start, onTwo, backToOne: count() }), 600);
            }, 700);
            }, 900);
        }, 400);
    })""")
    record("Pelacak menulis 'Soal 1 dari N'",
           nav["start"]["count"].startswith("Soal 1 dari"), json.dumps(nav))
    record("Tombol mundur mati di soal pertama",
           nav["start"]["prevDisabled"] is True, json.dumps(nav))
    record("Tombol maju terkunci sebelum dijawab",
           nav["start"]["nextDisabled"] is True, json.dumps(nav))
    record("Pelacak punya satu langkah per soal",
           nav["start"]["steps"] >= 2, json.dumps(nav))
    record("Maju ke soal berikutnya", nav["onTwo"].startswith("Soal 2 dari"), json.dumps(nav))
    record("Mundur kembali ke soal sebelumnya",
           nav["backToOne"].startswith("Soal 1 dari"), json.dumps(nav))

    print("\n69. Mekanik ketuk-ketuk tetap jalan di lanskap")
    page.set_viewport_size({"width": 1280, "height": 720})

    # (a) Penjumlahan
    open_fresh(page, "#/belajar/02_operasi_aljabar/penjumlahan_pengurangan")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    page.evaluate("""() => {
        const x = [...document.querySelectorAll('button')].find(n => n.textContent.includes('Coba Jumlahkan'));
        if (x) x.click();
    }""")
    page.wait_for_timeout(800)
    page.evaluate("""() => {
        const x = [...document.querySelectorAll('button')].find(n => n.textContent.includes('Paham'));
        if (x) x.click();
    }""")
    page.wait_for_timeout(800)
    add = page.evaluate("""() => new Promise(resolve => {
        const m = document.querySelectorAll('.matrix');
        const A = [...m[0].querySelectorAll('.cell')];
        const B = [...m[1].querySelectorAll('.cell')];
        const C = [...m[2].querySelectorAll('.cell')];
        A[0].click();
        const lit = B[0].classList.contains('cell--pulse');
        setTimeout(() => {
            B[0].click();
            setTimeout(() => {
                const expr = (C[0].querySelector('.cell__expr') || {}).textContent || '';
                const btn = document.querySelector('.workstrip__confirm');
                if (btn && !btn.hidden) btn.click();
                setTimeout(() => resolve({ lit, expr, value: C[0].textContent.trim() }), 1300);
            }, 1500);
        }, 300);
    })""")
    record("Penjumlahan: ketukan menyalakan pasangan seletak", add["lit"] is True, json.dumps(add))
    record("Penjumlahan: bentuk (6+1) lalu hasil 7",
           add["expr"] == "(6+1)" and add["value"].startswith("7"), json.dumps(add))

    # (b) Determinan
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    det = page.evaluate("""() => new Promise(resolve => {
        const cells = () => [...document.querySelectorAll('.sim .matrix .cell')];
        const c = cells();
        c[3].click(); c[0].click();
        setTimeout(() => {
            const c2 = cells();
            c2[2].click(); c2[1].click();
            setTimeout(() => resolve({
                lines: document.querySelectorAll('.strike-line').length,
                result: (document.querySelector('.scalar-result__value') || {}).textContent,
                done: !!document.querySelector('.sim--done'),
            }), 3000);
        }, 2600);
    })""")
    record("Determinan: ketuk-ketuk urutan bebas tetap sah",
           det["lines"] == 2 and det["result"] == "22", json.dumps(det))
    record("Determinan: simulasi selesai", det["done"] is True, json.dumps(det))

    # (c) Perkalian — satu sel dituntaskan lewat ketukan
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    mul = page.evaluate("""() => new Promise(resolve => {
        const tap = el => {
            const r = el.getBoundingClientRect();
            const o = { bubbles: true, cancelable: true, composed: true,
                        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
                        pointerId: 4, pointerType: 'mouse', button: 0, isPrimary: true };
            el.dispatchEvent(new PointerEvent('pointerdown', o));
            document.dispatchEvent(new PointerEvent('pointerup', o));
            el.click();
        };
        const m = document.querySelectorAll('.matrix');
        const A = [...m[0].querySelectorAll('.cell')];
        const B = [...m[1].querySelectorAll('.cell')];
        const C = [...m[2].querySelectorAll('.cell')];
        C[0].click();                       // pilih sel hasil c11
        setTimeout(() => {
            tap(A[0]); tap(C[0]);           // a11 -> c11
            setTimeout(() => {
                tap(B[0]); tap(C[0]);       // b11 -> c11
                setTimeout(() => {
                    tap(A[1]); tap(C[0]);   // a12 -> c11
                    setTimeout(() => {
                        tap(B[2]); tap(C[0]);   // b21 -> c11
                        setTimeout(() => {
                            const btn = document.querySelector('.workstrip__confirm');
                            const shown = btn && !btn.hidden;
                            if (shown) btn.click();
                            setTimeout(() => resolve({
                                shown, value: C[0].textContent.trim(),
                            }), 1300);
                        }, 1400);
                    }, 1400);
                }, 1400);
            }, 1400);
        }, 600);
    })""")
    # A = [[2,1],[0,3]], B = [[4,-1],[2,5]] -> c11 = 2*4 + 1*2 = 10
    record("Perkalian: tombol hitung muncul setelah pasangan lengkap",
           mul.get("shown") is True, json.dumps(mul))
    record("Perkalian: c11 = 2×4 + 1×2 = 10",
           mul.get("value", "").startswith("10"), json.dumps(mul))
    page.set_viewport_size({"width": 1280, "height": 860})

    # ============================================================
    # Fase 10 — arsitektur Sidebar & Stage, identitas, poles presisi
    # ============================================================

    print("\n70. Identitas aplikasi: Ruang Matriks")
    page.set_viewport_size({"width": 1280, "height": 800})
    open_fresh(page, "#/")
    ident = page.evaluate("""() => ({
        title: document.title,
        brand: (document.querySelector('.brand__title') || {}).textContent.trim(),
        sub: (document.querySelector('.brand__sub') || {}).textContent.trim(),
        desc: (document.querySelector('meta[name=description]') || {}).content || '',
        rotateHint: (document.querySelector('.rotate-lock__hint') || {}).textContent.trim(),
        oldName: document.documentElement.innerHTML.includes('Matriks Lab'),
    })""")
    record("Judul dokumen memakai nama baru",
           ident["title"].startswith("Ruang Matriks"), json.dumps(ident)[:220])
    record("Header menampilkan 'Ruang Matriks'", ident["brand"] == "Ruang Matriks", json.dumps(ident)[:220])
    record("Subjudul header persis seperti diminta",
           ident["sub"] == "Matematika Tingkat Lanjut - Kelas 11", json.dumps(ident)[:220])
    record("Nama lama tidak tersisa di DOM", ident["oldName"] is False, json.dumps(ident)[:220])

    print("\n71. Layar masuk & hak cipta")
    page.evaluate("() => { try { localStorage.removeItem('matriksLab.identity.v1'); sessionStorage.clear(); } catch (e) {} }")
    page.goto(f"{BASE}/#/login")
    page.reload()
    page.wait_for_timeout(800)
    greet = page.evaluate("""() => ({
        title: (document.querySelector('.login__title') || {}).textContent.trim(),
        lead: (document.querySelector('.login__lead') || {}).textContent.trim(),
        eyebrow: (document.querySelector('.login__eyebrow') || {}).textContent.trim(),
    })""")
    record("Sapaan masuk elegan: 'Selamat Datang'",
           greet["title"] == "Selamat Datang", json.dumps(greet, ensure_ascii=False))
    record("Sub-teks masuk terdengar profesional",
           "identitas" in greet["lead"].lower() and "namamu" not in greet["lead"].lower(),
           json.dumps(greet, ensure_ascii=False))

    open_fresh(page, "#/")
    foot = page.evaluate("""() => {
        const n = document.querySelector('.app-footer__text');
        const f = document.querySelector('.app-footer');
        if (!n || !f) return { found: false };
        const r = n.getBoundingClientRect();
        const fr = f.getBoundingClientRect();
        return {
            found: true,
            text: n.textContent.trim(),
            usesSymbol: n.textContent.trim().startsWith('©'),
            hasWord: n.textContent.includes('Copyright'),
            // Terpusat sempurna: jarak kiri dan kanan sama.
            offset: Math.round(Math.abs((r.left - fr.left) - (fr.right - r.right))),
        };
    }""")
    record("Hak cipta memakai simbol ©",
           foot.get("usesSymbol") is True and foot.get("hasWord") is False, json.dumps(foot, ensure_ascii=False))
    record("Hak cipta terpusat sempurna", foot.get("offset", 99) <= 2, json.dumps(foot, ensure_ascii=False))

    print("\n72. Header: progres di tengah, layar penuh di kanan atas")
    layout = page.evaluate("""() => {
        const ring = document.querySelector('.progress-ring');
        const fab = document.querySelector('.fs-btn');
        const brand = document.querySelector('.brand');
        if (!ring || !fab || !brand) return { found: false };
        const r = ring.getBoundingClientRect();
        const f = fab.getBoundingClientRect();
        const b = brand.getBoundingClientRect();
        const vw = window.innerWidth;
        return {
            found: true,
            ringCenterOffset: Math.round(Math.abs((r.left + r.width / 2) - vw / 2)),
            fabTop: Math.round(f.top),
            fabRightGap: Math.round(vw - f.right),
            fabInTopHalf: f.bottom < window.innerHeight / 2,
            // Tidak boleh bertabrakan dengan identitas di kiri atas.
            clashesBrand: !(b.right < f.left || b.left > f.right
                            || b.bottom < f.top || b.top > f.bottom),
            clashesRing: !(r.right < f.left || r.left > f.right
                           || r.bottom < f.top || r.top > f.bottom),
        };
    }""")
    record("Progress ring benar-benar di tengah atas",
           layout.get("ringCenterOffset", 99) <= 3, json.dumps(layout))
    record("Tombol layar penuh di sudut kanan atas",
           layout.get("fabTop", 999) <= 24 and layout.get("fabRightGap", 999) <= 24
           and layout.get("fabInTopHalf") is True, json.dumps(layout))
    record("Tidak bertabrakan dengan identitas & progres",
           layout.get("clashesBrand") is False and layout.get("clashesRing") is False,
           json.dumps(layout))

    # Tombol kembali (kiri atas area kerja) juga tidak boleh tertimpa.
    open_fresh(page, "#/belajar/01_konsep_dasar/pengertian_letak")
    noclash = page.evaluate("""() => {
        const back = document.querySelector('.ws-side__back');
        const fab = document.querySelector('.fs-btn');
        if (!back || !fab) return { found: false };
        const b = back.getBoundingClientRect();
        const f = fab.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return {
            found: true,
            overlap: !(b.right < f.left || b.left > f.right || b.bottom < f.top || b.top > f.bottom),
            clickable: !!(hit && (hit === back || back.contains(hit))),
        };
    }""")
    record("Tombol kembali bebas dari tombol layar penuh",
           noclash.get("overlap") is False and noclash.get("clickable") is True, json.dumps(noclash))

    print("\n73. Arsitektur Sidebar & Stage")
    for vp in ({"width": 1280, "height": 720}, {"width": 1600, "height": 900}, {"width": 844, "height": 390}):
        page.set_viewport_size(vp)
        tag = f'{vp["width"]}x{vp["height"]}'
        open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
        b = page.query_selector("button:has-text('Mulai Simulasi')")
        if b:
            b.click()
            page.wait_for_timeout(800)
        split = page.evaluate("""() => {
            const ws = document.querySelector('.workspace--split');
            const side = document.querySelector('.ws-side');
            const stage = document.querySelector('.ws-stage');
            if (!ws || !side || !stage) return { found: false };
            const w = ws.getBoundingClientRect();
            const s = side.getBoundingClientRect();
            const t = stage.getBoundingClientRect();
            return {
                found: true,
                cols: getComputedStyle(ws).gridTemplateColumns.split(' ').length,
                sidePct: Math.round(100 * s.width / w.width),
                stagePct: Math.round(100 * t.width / w.width),
                sideLeftOfStage: s.right <= t.left + 1,
                sameRow: Math.abs(s.top - t.top) <= 2,
                // Kendali ada di kiri…
                hasBack: !!side.querySelector('.ws-side__back'),
                hasTitle: !!side.querySelector('.workspace__title'),
                hasSteps: !!side.querySelector('.steps'),
                hasHint: !!side.querySelector('.ws-side__hint'),
                hasPrompt: !!side.querySelector('.sim__prompt'),
                hasActions: !!side.querySelector('.actionbar'),
                // …dan panggung hanya berisi kanvas.
                stageHasMatrix: !!stage.querySelector('.matrix'),
                stageHasSteps: !!stage.querySelector('.steps'),
                stageHasPrompt: !!stage.querySelector('.sim__prompt'),
                stageHasActions: !!stage.querySelector('.actionbar'),
            };
        }""")
        record(f"Dua kolom, sidebar kiri & panggung kanan @{tag}",
               split.get("cols") == 2 and split.get("sideLeftOfStage") is True
               and split.get("sameRow") is True, json.dumps(split)[:260])
        record(f"Lebar sidebar 25–30% @{tag}",
               24 <= split.get("sidePct", 0) <= 31, json.dumps(split)[:260])
        record(f"Panggung mendapat 69–76% @{tag}",
               68 <= split.get("stagePct", 0) <= 77, json.dumps(split)[:260])
        record(f"Kendali lengkap di sidebar @{tag}",
               all(split.get(k) is True for k in
                   ("hasBack", "hasTitle", "hasSteps", "hasHint", "hasPrompt", "hasActions")),
               json.dumps(split)[:260])
        record(f"Panggung murni kanvas @{tag}",
               split.get("stageHasMatrix") is True
               and split.get("stageHasSteps") is False
               and split.get("stageHasPrompt") is False
               and split.get("stageHasActions") is False, json.dumps(split)[:260])

    print("\n74. Matriks 3×3 bernapas di panggung")
    for vp in ({"width": 1280, "height": 720}, {"width": 844, "height": 390}):
        page.set_viewport_size(vp)
        tag = f'{vp["width"]}x{vp["height"]}'
        open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
        b = page.query_selector("button:has-text('Mulai Simulasi')")
        if b:
            b.click()
            page.wait_for_timeout(800)
        page.evaluate("() => document.querySelectorAll('.case-chip')[2].click()")
        page.wait_for_timeout(900)
        big = page.evaluate("""() => {
            const row = document.querySelector('.stage__row--equation');
            const stage = document.querySelector('.ws-stage');
            const cell = document.querySelector('.cell');
            if (!row || !stage || !cell) return { found: false };
            const r = row.getBoundingClientRect();
            const s = stage.getBoundingClientRect();
            const mats = [...row.querySelectorAll(':scope > .matrix')];
            const tops = mats.map(m => Math.round(m.getBoundingClientRect().top));
            return {
                found: true,
                cells: document.querySelectorAll('.cell').length,
                cellH: Math.round(cell.getBoundingClientRect().height),
                rowFits: r.width <= s.width + 1,
                // Satu baris: A × B = C tidak boleh membungkus.
                singleLine: tops.length > 1 && Math.max(...tops) - Math.min(...tops) <= 2,
            };
        }""")
        record(f"Kasus 3×3 punya 27 sel @{tag}", big.get("cells") == 27, json.dumps(big))
        record(f"Persamaan tetap satu baris @{tag}", big.get("singleLine") is True, json.dumps(big))
        record(f"Sel 3×3 tetap nyaman diketuk @{tag}", big.get("cellH", 0) >= 34, json.dumps(big))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n75. Ordo & operator presisi")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    precise = page.evaluate("""() => {
        const row = document.querySelector('.stage__row--equation');
        const mid = el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
        const ordo = document.querySelector('.matrix__ordo');
        const bracket = ordo ? ordo.closest('.matrix__bracket') : null;
        if (!row || !ordo || !bracket) return { found: false };
        const orb = ordo.getBoundingClientRect();
        const brb = bracket.getBoundingClientRect();
        const ops = [...row.querySelectorAll(':scope > .op-glyph')].map(mid);
        const grids = [...row.querySelectorAll(':scope > .matrix .matrix__grid')].map(mid);
        const all = [...ops, ...grids];
        const marker = getComputedStyle(ordo, '::before').display;
        return {
            found: true,
            ordoText: ordo.textContent.trim(),
            hasHyphen: /[-–—]/.test(ordo.textContent),
            markerHidden: marker === 'none',
            // Bawah-tengah: pusat ordo sejajar pusat kurung, dan ia di bawahnya.
            ordoOffset: Math.round(Math.abs((orb.left + orb.width / 2) - (brb.left + brb.width / 2))),
            below: orb.top >= brb.bottom - 4,
            // Operator dan grid berbagi pusat vertikal yang sama.
            spread: Math.round(Math.max(...all) - Math.min(...all)),
        };
    }""")
    record("Ordo tanpa tanda hubung",
           precise.get("hasHyphen") is False and precise.get("markerHidden") is True,
           json.dumps(precise, ensure_ascii=False))
    record("Ordo di bawah-tengah matriks",
           precise.get("ordoOffset", 99) <= 2 and precise.get("below") is True,
           json.dumps(precise, ensure_ascii=False))
    record("Operator sejajar sempurna dengan matriks",
           precise.get("spread", 99) <= 1, json.dumps(precise, ensure_ascii=False))

    print("\n76. Animasi tetap akurat di tata letak dua kolom")
    open_fresh(page, "#/belajar/02_operasi_aljabar/penjumlahan_pengurangan")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    page.evaluate("""() => { const x = [...document.querySelectorAll('button')]
        .find(n => n.textContent.includes('Coba Jumlahkan')); if (x) x.click(); }""")
    page.wait_for_timeout(800)
    page.evaluate("""() => { const x = [...document.querySelectorAll('button')]
        .find(n => n.textContent.includes('Paham')); if (x) x.click(); }""")
    page.wait_for_timeout(800)
    fly = page.evaluate("""() => new Promise(resolve => {
        const m = document.querySelectorAll('.matrix');
        const A = [...m[0].querySelectorAll('.cell')];
        const B = [...m[1].querySelectorAll('.cell')];
        const C = [...m[2].querySelectorAll('.cell')];
        A[0].click();
        setTimeout(() => {
            B[0].click();
            // Tangkap chip di tengah penerbangan.
            setTimeout(() => {
                const chip = document.querySelector('.fly-chip');
                const stage = document.querySelector('.ws-stage').getBoundingClientRect();
                const cr = chip ? chip.getBoundingClientRect() : null;
                const inside = cr
                    ? cr.left >= stage.left - 40 && cr.right <= stage.right + 40
                      && cr.top >= stage.top - 40 && cr.bottom <= stage.bottom + 40
                    : null;
                setTimeout(() => resolve({
                    chipSeen: !!cr,
                    chipInsideStage: inside,
                    expr: (C[0].querySelector('.cell__expr') || {}).textContent || '',
                    leftovers: document.querySelectorAll('.fly-chip, .drag-ghost').length,
                }), 1600);
            }, 250);
        }, 300);
    })""")
    record("Chip terbang muncul di dalam panggung",
           fly.get("chipSeen") is True and fly.get("chipInsideStage") is True,
           json.dumps(fly, ensure_ascii=False))
    record("Koordinat mendarat tepat: (6+1) terbentuk",
           fly.get("expr") == "(6+1)", json.dumps(fly, ensure_ascii=False))
    record("Tidak ada chip tertinggal setelah animasi",
           fly.get("leftovers") == 0, json.dumps(fly, ensure_ascii=False))

    # Garis coret determinan digambar relatif terhadap grid; kalau
    # koordinatnya meleset ia akan keluar dari kotak matriksnya.
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    strike = page.evaluate("""() => new Promise(resolve => {
        const cells = () => [...document.querySelectorAll('.ws-stage .matrix .cell')];
        const c = cells();
        c[3].click(); c[0].click();
        setTimeout(() => {
            const g = document.querySelector('.ws-stage .matrix__grid');
            const l = document.querySelector('.strike-line');
            const gr = g ? g.getBoundingClientRect() : null;
            const lr = l ? l.getBoundingClientRect() : null;
            resolve({
                lines: document.querySelectorAll('.strike-line').length,
                blue: (document.querySelector('.det-expr__term--blue') || {}).textContent,
                insideGrid: (gr && lr)
                    ? lr.left >= gr.left - 6 && lr.right <= gr.right + 6
                      && lr.top >= gr.top - 6 && lr.bottom <= gr.bottom + 6
                    : null,
                leftovers: document.querySelectorAll('.fly-chip, .diag-trace').length,
            });
        }, 3200);
    })""")
    record("Garis coret jatuh tepat di atas selnya",
           strike.get("lines") == 1 and strike.get("insideGrid") is True, json.dumps(strike))
    record("Hasil kali diagonal benar (6×5 = 30)",
           strike.get("blue") == "30", json.dumps(strike))
    record("Panggung bersih setelah animasi determinan",
           strike.get("leftovers") == 0, json.dumps(strike))

    print("\n16. Sistem desain TRANSFORMASI konsisten")
    page.set_viewport_size({"width": 1280, "height": 860})
    open_fresh(page, "#/")
    ds = page.evaluate("""() => {
        const root = getComputedStyle(document.documentElement);
        const card = document.querySelector('.mode-card') || document.querySelector('.hero__panel');
        const cardBg = card ? getComputedStyle(card).backgroundColor : '';
        const body = getComputedStyle(document.body).backgroundColor;
        return {
            paper: root.getPropertyValue('--paper').trim(),
            royal: root.getPropertyValue('--royal').trim(),
            cyan: root.getPropertyValue('--cyan').trim(),
            yellow: root.getPropertyValue('--yellow').trim(),
            magenta: root.getPropertyValue('--magenta').trim(),
            display: root.getPropertyValue('--display').trim(),
            bodyFont: root.getPropertyValue('--body').trim(),
            cardBg, body,
            distinct: cardBg !== body,
            noThemeToggle: document.querySelectorAll('[data-role="theme"]').length,
        };
    }""")
    record("Palet TRANSFORMASI terpasang",
           ds["paper"].upper() == "#EFF4FF" and ds["royal"].upper() == "#1D4ED8"
           and ds["cyan"].upper() == "#06B6D4" and ds["yellow"].upper() == "#FFC800"
           and ds["magenta"].upper() == "#EC0F8C", json.dumps(ds))
    record("Montserrat untuk judul, Roboto untuk isi",
           "Montserrat" in ds["display"] and "Roboto" in ds["bodyFont"], json.dumps(ds))
    record("Kartu putih berbeda dari kertas latar", ds["distinct"] is True, json.dumps(ds))
    record("Pengalih tema gelap sudah dicabut", ds["noThemeToggle"] == 0, json.dumps(ds))

    # ==========================================================
    # FASE 11 — REGRESI SEMBILAN BUG QA MANUAL
    #
    # Peringatan yang sama seperti di HANDOFF SS0.4 berlaku di sini:
    # bagian-bagian ini adalah JARING PENGAMAN, bukan bukti utama.
    # Sembilan bug ini dulu lolos dari suite 300/300 yang hijau karena
    # pengujian DOM tidak bisa melihat elemen yang saling menimpa atau
    # skala yang terasa salah. Perbaikannya diverifikasi lebih dulu
    # dengan pengukuran di peramban; pengujian di bawah hanya menjaga
    # agar bug yang sama tidak kembali diam-diam.
    # ==========================================================

    print("\n77. Fase 11 - Isu 7: slider langkah tidak pernah kembar")
    # Fase 12 mencabut slider dari Penjumlahan (urutannya bebas), jadi penjaga
    # ini dipindah ke Perkalian — engine multi-kasus yang memang masih memakai
    # slider, dan justru di sanalah slider kembar pertama kali ditemukan.
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    dup = page.evaluate(RENDER_ULANG_SLIDER)
    record("Bangun ulang kasus 4x tetap menyisakan satu slider",
           dup["sliders"] == 1 and dup["dots"] == 1, json.dumps(dup))

    print("\n78. Fase 11 - Isu 8: Jumlah/Kurang murni ketuk-ketuk")
    # Bagian ini dulu menumpang halaman yang ditinggalkan bagian 77. Sejak
    # bagian 77 pindah ke Perkalian (Fase 12), ia harus membuka rutenya sendiri
    # — menumpang keadaan bagian lain membuat urutan uji jadi rapuh.
    open_fresh(page, "#/belajar/02_operasi_aljabar/penjumlahan_pengurangan")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    tap = page.evaluate(KETUK_KETUK_JUMLAH)
    record("Tidak ada elemen yang bisa diseret di Jumlah/Kurang",
           tap["draggables"] == 0, json.dumps(tap)[:220])
    record("Tidak ada drop-zone di Jumlah/Kurang",
           tap["dropzones"] == 0, json.dumps(tap)[:220])
    record("Setiap sel sumber bisa diketuk", tap["tappables"] >= 8, json.dumps(tap)[:220])
    record("Ketuk A menyalakan pasangan seletak di B dan meredupkan sisanya",
           tap["partnerLit"] is True and tap["muted"] > 0, json.dumps(tap)[:220])
    record("Ketuk pasangan di B langsung membentuk (6+1) di sel hasil",
           "(" in tap["expr"] and "+" in tap["expr"] and tap["building"] is True,
           json.dumps(tap)[:220])

    print("\n79. Fase 11 - Isu 5: gerak benar-benar mati saat pindah layar")
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    killed = page.evaluate(BUNUH_GERAK)
    record("Tween GSAP dibunuh saat pindah layar",
           killed["before"]["tweens"] > 0 and killed["tweens"] == 0, json.dumps(killed))
    record("Chip terbang & hantu seret ikut dibersihkan",
           killed["chips"] == 0 and killed["ghosts"] == 0, json.dumps(killed))
    record("Kelas is-tap-armed tidak tertinggal di body",
           killed["armed"] is False, json.dumps(killed))

    print("\n80. Fase 11 - Isu 5: timer tertunda ikut dibatalkan")
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    timers = page.evaluate(TIMER_BERJEJAK)
    record("this.later() terdaftar sebagai timer berjejak",
           timers["pending"] == 1, json.dumps(timers))
    record("Timer tertunda tidak pernah menyala setelah destroy()",
           timers["fired"] is False and timers["after"] == 0, json.dumps(timers))

    print("\n81. Fase 11 - Isu 3: perkalian multi-kasus mengingat kemajuannya")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    multi = page.evaluate(MULTI_KASUS)
    record("Sel pertama Kasus 1 selesai dihitung",
           "10" in multi["solvedText"], json.dumps(multi)[:260])
    record("Seret/ketuk MASIH hidup setelah pindah kasus",
           multi["targetPicked"] is True and multi["termsInCase2"] == 1,
           json.dumps(multi)[:260])
    record("Pindah kasus tidak menggandakan slider",
           multi["slidersInCase2"] == 1, json.dumps(multi)[:260])
    record("Pindah kasus ditolak selama sel masih setengah dikerjakan",
           multi["refusedMidBuild"] is True, json.dumps(multi)[:260])
    record("Kasus 2 bisa diselesaikan sampai tuntas setelah pindah",
           multi["case2Solved"] is True and multi["backToCase1"] is True,
           json.dumps(multi)[:260])
    record("Kemajuan Kasus 1 utuh saat dikunjungi ulang",
           "10" in multi["restoredText"] and multi["restoredDone"] is True
           and multi["restoredInvite"] is False, json.dumps(multi)[:260])
    record("Kemajuan per-kasus dititipkan ke sessionStorage",
           bool((multi.get("saved") or {}).get("simState", {}).get("cases")),
           json.dumps(multi.get("saved"))[:260])

    print("\n82. Fase 11 - Isu 3: hanya 'Ulangi Simulasi' yang menghapus kemajuan")
    reset = page.evaluate(ULANGI_SIMULASI)
    record("Ulangi Simulasi mengosongkan kemajuan semua kasus",
           reset["found"] is True and reset["emptyCells"] == 0
           and not reset.get("simState"), json.dumps(reset)[:240])

    print("\n83. Fase 11 - Isu 4: layar masuk tidak punya pintu belakang")
    # Halaman TERPISAH, tanpa semaian identitas. `page` utama menyemai
    # identitas lewat add_init_script di setiap dokumen baru, jadi ia tidak
    # bisa dipakai untuk menguji pengunjung yang belum memperkenalkan diri —
    # setiap reload akan mengembalikan identitasnya.
    anon_ctx = page.context.browser.new_context(
        viewport={"width": 1280, "height": 860})
    anon = anon_ctx.new_page()
    anon.goto(BASE + "/#/")
    anon.wait_for_selector('[data-app-ready="true"]', timeout=10000)
    anon.wait_for_timeout(600)
    guard = anon.evaluate(PENJAGA_MASUK)
    anon_ctx.close()
    routes = ["#/", "#/belajar", "#/kuis", "#/tka", "#/belajar/01_konsep_dasar"]
    record("Tanpa identitas, aplikasi mendarat di #/login",
           guard["bootHash"] == "#/login", json.dumps(guard)[:240])
    record("Tombol rumah dimatikan & disembunyikan di layar masuk",
           guard["homeDisabled"] is True and guard["homeHidden"] is True,
           json.dumps(guard)[:240])
    record("Cincin progres disembunyikan di layar masuk",
           guard["ringHidden"] is True, json.dumps(guard)[:240])
    record("Klik tombol rumah tidak menembus ke menu",
           guard["afterHomeClick"] == "#/login", json.dumps(guard)[:240])
    record("Deep-link manual ke rute mana pun dialihkan ke #/login",
           all(guard.get("deep" + r) == "#/login" for r in routes),
           json.dumps(guard)[:240])

    print("\n84. Fase 11 - Isu 6: daftar bab & sub-topik bisa digulir sampai habis")
    page.set_viewport_size({"width": 844, "height": 390})
    for route, label in [("#/belajar", "daftar bab"),
                         ("#/belajar/03_determinan_invers", "daftar sub-topik"),
                         ("#/kuis", "menu kuis")]:
        open_fresh(page, route)
        sc = page.evaluate(GULIR_DAFTAR)
        record(label + " bisa digulir @844x390",
               sc.get("overflowY") == "auto", json.dumps(sc)[:220])
        record("Item terakhir " + label + " terlihat DAN bisa ditekan",
               sc.get("lastVisible") is True and sc.get("lastClickable") is True,
               json.dumps(sc)[:220])
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n85. Fase 11 - Isu 1 & 9: skala tumbuh di layar besar, kartu tetap di tengah")
    measured = []
    for w, h in [(1280, 720), (1920, 1080), (2560, 1440)]:
        page.set_viewport_size({"width": w, "height": h})
        open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
        bb = page.query_selector("button:has-text('Mulai Simulasi')")
        if bb:
            bb.click()
            page.wait_for_timeout(800)
        m = page.evaluate(UKUR_PANGGUNG)
        m["viewport"] = str(w) + "x" + str(h)
        measured.append(m)

        page.goto(BASE + "/#/kuis/latihan/01_konsep_dasar")
        page.wait_for_timeout(1100)
        c = page.evaluate(UKUR_KARTU_KUIS)
        label = "@" + str(w) + "x" + str(h)
        record("Kartu kuis terpusat terhadap layar " + label + " (selisih <=2px)",
               c.get("found") is True and c.get("skew", 99) <= 2, json.dumps(c))
        record("Tidak ada luapan horizontal " + label,
               m["hOverflow"] is False, json.dumps(m))

    record("Lebar sel matriks TUMBUH dari 1280 ke 1920 ke 2560",
           measured[2]["cellW"] > measured[1]["cellW"] > measured[0]["cellW"],
           json.dumps(measured))
    record("Ukuran huruf sel ikut tumbuh",
           measured[2]["font"] > measured[1]["font"] > measured[0]["font"],
           json.dumps(measured))
    record("Tinggi panggung ikut tumbuh",
           measured[2]["stageH"] > measured[0]["stageH"], json.dumps(measured))
    record("Ambang sentuh 44px tetap dijaga di semua ukuran",
           all(x["cellW"] >= 44 and x["cellH"] >= 42 for x in measured),
           json.dumps(measured))
    page.set_viewport_size({"width": 1280, "height": 860})

    print("\n86. Fase 11 - Isu 2: denyut mengubah SELURUH latar sel")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    pulse = page.evaluate(DENYUT_LATAR)
    for role in ("blue", "magenta", "amber"):
        got = pulse.get(role)
        record("Denyut " + role + " menganimasikan latar, bukan hanya tepi",
               bool(got) and str(got.get("name", "")).endswith("Fill"),
               json.dumps(got))
        record("Teks tetap terbaca di puncak denyut " + role + " (>=4.5:1)",
               bool(got) and got.get("contrast", 0) >= 4.5, json.dumps(got))

    # ==========================================================
    # FASE 12 — REGRESI
    # ==========================================================

    print("\n87. Fase 12 - Isu 1: Transpose diajarkan sebelum Jenis-Jenis Matriks")
    urutan = page.evaluate("""() => fetch('data/lessons.json', {cache:'no-cache'})
        .then(r => r.json())
        .then(d => (d.chapters.find(c => c.id === '01_konsep_dasar') || {}).subtopicOrder)""")
    record("Transpose mendahului Jenis-Jenis Matriks",
           urutan.index("transpose") < urutan.index("jenis_matriks"), json.dumps(urutan))
    record("Sub-topik Bab 1 tetap lima dan tidak ada yang hilang",
           sorted(urutan) == sorted(["pengertian_letak", "ordo_matriks", "transpose",
                                     "jenis_matriks", "kesamaan_matriks"]), json.dumps(urutan))

    print("\n88. Fase 12 - Isu 3: panggung 'Tempel Label' tidak lagi bertumpuk")
    open_fresh(page, "#/belajar/01_konsep_dasar/jenis_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    lay = page.evaluate(TATA_LETAK_LABEL)
    record("Rak label tidak menimpa matriks", lay["overlap"] is False, json.dumps(lay)[:220])
    record("Rak label berada DI BAWAH matriks", lay["shelfBelow"] is True, json.dumps(lay)[:220])
    record("Kartu label membungkus, bukan satu lajur panjang",
           lay["poolRows"] >= 2 and lay["poolFits"] is True, json.dumps(lay)[:220])
    record("Setiap kartu label memenuhi ambang sentuh 44px",
           lay["minChipHeight"] >= 44, json.dumps(lay)[:220])

    print("\n89. Fase 12 - Isu 5: toast terpusat ke KOLOM PANGGUNG, bukan jendela")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    anchor = page.evaluate(TAMBATAN_TOAST)
    record("Toast muncul saat interaksi ditolak", anchor["toasts"] >= 1, json.dumps(anchor))
    record("Toast terpusat ke panggung (selisih <=2px)",
           anchor["offsetFromStage"] <= 2, json.dumps(anchor))
    record("Pusat panggung memang berbeda dari pusat jendela",
           anchor["stageVsWindow"] > 20, json.dumps(anchor))
    record("Toast tidak melebar melewati panggung", anchor["withinStage"] is True, json.dumps(anchor))

    print("\n90. Fase 12 - Isu 6: bilah progres kartu bab benar-benar sebuah track")
    open_fresh(page, "#/belajar")
    bars = page.evaluate("""() => [...document.querySelectorAll('.chapter-item .progressbar')]
        .map(b => { const r = b.getBoundingClientRect();
            return { w: Math.round(r.width), h: Math.round(r.height),
                     display: getComputedStyle(b).display }; })""")
    record("Setiap kartu bab punya bilah progres", len(bars) >= 4, json.dumps(bars)[:200])
    record("Bilah progres melebar penuh, bukan sliver 2px",
           all(x["w"] > 100 for x in bars), json.dumps(bars)[:200])
    record("Tinggi bilah progres sesuai rancangan (8px)",
           all(x["h"] == 8 and x["display"] == "block" for x in bars), json.dumps(bars)[:200])

    print("\n91. Fase 12 - Isu 8: simulasi urutan-bebas memakai teks progres, bukan slider")
    for route, unit in [("02_operasi_aljabar/penjumlahan_pengurangan", "sel"),
                        ("01_konsep_dasar/kesamaan_matriks", "pasangan")]:
        open_fresh(page, f"#/belajar/{route}")
        b = page.query_selector("button:has-text('Mulai Simulasi')")
        if b:
            b.click()
            page.wait_for_timeout(800)
        if "penjumlahan" in route:
            page.evaluate("""() => { const s = window.__matriksLab.state.activeView.simulation;
                s.ordoUnderstood = true; s.slide = 1; s.renderSlide(); }""")
            page.wait_for_timeout(600)
        prog = page.evaluate("""() => ({
            sliders: document.querySelectorAll('.slider__nav').length,
            text: (document.querySelector('.sim-progress') || {}).innerText || '',
            resumable: typeof (window.__matriksLab.state.activeView.simulation.stepJump),
        })""")
        nama = route.split("/")[1]
        record(f"Tidak ada slider langkah di {nama}", prog["sliders"] == 0, json.dumps(prog))
        record(f"Teks progres tampil di {nama}",
               "dari" in prog["text"] and unit in prog["text"], json.dumps(prog))

    print("\n92. Fase 12 - Isu 9: kasus yang tuntas tidak mengunci kasus lain")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    kasus = page.evaluate(MULTI_KASUS_TUNTAS)
    record("Kasus 1 bisa diselesaikan sampai tuntas",
           kasus["case1Complete"] is True, json.dumps(kasus)[:240])
    record("Mini Kuis terbuka setelah kasus pertama tuntas",
           kasus["finished"] is True, json.dumps(kasus)[:240])
    record("Panggung TIDAK dikunci selama masih ada kasus tersisa",
           kasus["lockedAfterCase1"] is False, json.dumps(kasus)[:240])
    record("Sel sumber Kasus 2 masih bisa disentuh",
           kasus["case2PointerEvents"] == "auto" and kasus["case2HitTest"] is True,
           json.dumps(kasus)[:240])
    record("Interaksi Kasus 2 benar-benar hidup (suku terbentuk)",
           kasus["case2Terms"] >= 1, json.dumps(kasus)[:240])
    record("Kembali ke Kasus 1: hasilnya utuh dan tetap terlihat",
           kasus["backComplete"] == 4 and kasus["backCellDone"] is True, json.dumps(kasus)[:240])

    print("\n93. Fase 12 - Isu 10 & 11: denyut salinan Sarrus, kunci, dan eliminasi")
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_3x3")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    sar = page.evaluate(SARRUS_SALINAN)
    record("Kolom salinan berhenti jadi 'hantu' setelah disalin",
           sar["stillGhost"] == 0 and sar["marked"] == 6, json.dumps(sar)[:220])
    record("Salinan Sarrus ikut berdenyut sama seperti matriks asli",
           sar["sameAnimation"] is True, json.dumps(sar)[:220])
    record("Salinan tampil pekat penuh saat disorot",
           sar["opacity"] == "1", json.dumps(sar)[:220])

    open_fresh(page, "#/belajar/01_konsep_dasar/kesamaan_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    kunci = page.evaluate(KUNCI_KESAMAAN)
    record("Sel sumber lain dikunci saat satu pasangan aktif",
           kunci["lockedWhilePending"] == kunci["totalLeft"] - 1, json.dumps(kunci))
    record("Sisi kanan tetap bisa diketuk agar salah pasang tetap dijelaskan",
           kunci["rightAlive"] is True, json.dumps(kunci))
    record("Ketuk ulang sel yang sama membatalkan dan membuka kuncinya",
           kunci["lockedAfterCancel"] == 0 and kunci["pendingCleared"] is True, json.dumps(kunci))

    open_fresh(page, "#/belajar/02_operasi_aljabar/ordo_perkalian")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    spam = page.evaluate(ANTI_SPAM)
    record("Semua tombol pilihan mati setelah jawaban benar",
           spam["allDisabled"] is True, json.dumps(spam))
    record("Klik beruntun tidak melompati kasus",
           spam["advancedOnce"] is True, json.dumps(spam))

    open_fresh(page, "#/belajar/03_determinan_invers/sifat_determinan")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    hots = page.evaluate(HOTS_KETUK)
    record("Soal HOTS ditulis di panggung, bukan hanya di panel kiri",
           hots["questionOnStage"] is True and len(hots["questionText"]) > 10,
           json.dumps(hots)[:220])
    record("Kartu sifat diketuk, bukan diseret",
           hots["draggables"] == 0 and hots["dropzones"] == 0, json.dumps(hots)[:220])
    record("Kartu yang salah disingkirkan agar tidak bisa dipilih lagi",
           hots["cardsAfterWrong"] == hots["cardsBefore"] - 1, json.dumps(hots)[:220])
    record("Penolakan tetap disertai Toast penjelas",
           hots["errorToast"] is True, json.dumps(hots)[:220])

    # ==========================================================
    # FASE 13 — KUNCI SISTEMIK & KONSISTENSI ENGINE
    # ==========================================================

    print("\n94. Fase 13 - Klik beruntun tidak pernah menggandakan evaluasi")
    # Bagian ini menyapu SELURUH sub-topik, bukan hanya yang dilaporkan.
    # Tiap elemen yang bisa ditekan di panggung diklik enam kali beruntun
    # dalam frame yang sama, lalu diperiksa dua hal: node hasil tidak
    # tergandakan, dan penunjuk langkah tidak melompat lebih dari satu.
    semua_rute = []
    for bab, subs in [
        ("01_konsep_dasar", ["pengertian_letak", "ordo_matriks", "transpose",
                             "jenis_matriks", "kesamaan_matriks"]),
        ("02_operasi_aljabar", ["penjumlahan_pengurangan", "perkalian_skalar",
                                "kombinasi_operasi", "ordo_perkalian",
                                "perkalian_matriks", "sifat_operasi"]),
        ("03_determinan_invers", ["determinan_2x2", "determinan_3x3",
                                  "singular_nonsingular", "sifat_determinan",
                                  "persamaan_matriks"]),
        ("04_pemodelan_tka", ["translasi_data", "spldv_matriks", "spltv_matriks",
                              "analisis_multi_kondisi"]),
    ]:
        for sub in subs:
            semua_rute.append((bab, sub))

    korban = []
    for bab, sub in semua_rute:
        open_fresh(page, f"#/belajar/{bab}/{sub}")
        b = page.query_selector("button:has-text('Mulai Simulasi')")
        if b:
            b.click()
            page.wait_for_timeout(700)
        r = page.evaluate(KLIK_BERUNTUN)
        lompat = [(a, c) for a, c in zip(r["before"], r["after"]) if a >= 0 and c - a > 1]
        if r["dupes"] or lompat or r["explains"] > 1:
            korban.append({"sub": sub, "dupes": r["dupes"],
                           "lompat": lompat, "explains": r["explains"]})
    record("Tidak ada node hasil yang tergandakan di 20 sub-topik",
           not [k for k in korban if k["dupes"]],
           json.dumps([k for k in korban if k["dupes"]], ensure_ascii=False)[:300])
    record("Tidak ada penunjuk langkah yang melompat",
           not [k for k in korban if k["lompat"]],
           json.dumps([k for k in korban if k["lompat"]], ensure_ascii=False)[:300])

    print("\n95. Fase 13 - Kunci pilihan pada dua modul yang dilaporkan")
    open_fresh(page, "#/belajar/03_determinan_invers/singular_nonsingular")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    sing = page.evaluate(SPAM_SINGULAR)
    record("Vonis singular hanya muncul SATU kali walau diklik enam kali",
           sing["panels"] == 1, json.dumps(sing))
    record("Tombol pilihan singular terkunci setelah klik pertama",
           sing["allLocked"] is True, json.dumps(sing))
    record("Kasus singular hanya maju satu langkah",
           sing["advanced"] <= 1, json.dumps(sing))

    open_fresh(page, "#/belajar/02_operasi_aljabar/sifat_operasi")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(700)
    sif = page.evaluate(SPAM_SIFAT)
    record("Pembuktian sifat operasi tidak menumpuk",
           sif["proofs"] <= 1, json.dumps(sif))
    record("Chip simbol terkunci setelah jawaban benar",
           sif["chipsLocked"] is True, json.dumps(sif))

    print("\n96. Fase 13 - Kombinasi Skalar memakai mesin ketuk-ketuk yang sama")
    open_fresh(page, "#/belajar/02_operasi_aljabar/kombinasi_operasi")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    combo = page.evaluate(KOMBINASI_HIBRIDA)
    record("Titik temu tetap tidak ada di panggung",
           combo["meetPoints"] == 0, json.dumps(combo)[:260])

    # --- TAHAP 1 harus terasa seperti Perkalian Skalar ---
    record("Tahap 1 punya chip skalar yang bisa diseret",
           combo["chipDraggable"] == "true" and combo["chipText"] == "2",
           json.dumps(combo)[:260])
    record("Tahap 1 menjadikan tiap elemen A sebuah drop-zone",
           combo["dropzonesPhase1"] == 4 and combo["awaitingPhase1"] == 4,
           json.dumps(combo)[:260])
    record("Tahap 1 menerima SERETAN chip ke elemen",
           combo["dragResult"] == "8", json.dumps(combo)[:260])
    record("Tahap 1 juga menerima KETUKAN chip lalu sel",
           combo["tapResult"] == "0" and combo["doneAfterTap"] == 2,
           json.dumps(combo)[:260])
    record("Chip skalar tidak habis dipakai",
           combo["chipReusable"] is True, json.dumps(combo)[:260])

    # --- Peralihan harus membongkar tahap 1 dengan tuntas ---
    record("Drop-zone tahap 1 dilepas seluruhnya saat tahap 2 mulai",
           combo["dropzonesAfterPhase1"] == 0 and combo["cleanupsLeft"] == 0,
           json.dumps(combo)[:260])
    record("Chip skalar dimatikan setelah tugasnya selesai",
           combo["chipLocked"] is True and combo["chipPointerEvents"] == "none",
           json.dumps(combo)[:260])
    record("Tidak ada sel yang tertinggal dalam keadaan 'menunggu'",
           combo["awaitingAfterPhase1"] == 0, json.dumps(combo)[:260])
    record("Matriks A benar-benar terskalakan", combo["scaledA"] == "8,0,-2,4",
           json.dumps(combo)[:260])

    # --- TAHAP 2 harus terasa seperti Penjumlahan biasa ---
    record("Tahap 2 memakai mesin PairwiseTapSim yang sama dengan Penjumlahan",
           combo["usesPairEngine"] is True and combo["phase"] == 1,
           json.dumps(combo)[:260])
    record("Tahap 2: ketuk A menyalakan pasangan seletak di B",
           combo["partnerLit"] is True and combo["muted"] > 0, json.dumps(combo)[:260])
    record("Bentuk (8+1) muncul sebelum angkanya",
           combo["expr"] == "(8+1)", json.dumps(combo)[:260])
    record("Hasil 9 mendarat, dan tombol hitung kebal klik beruntun",
           combo["cellText"].startswith("9") and combo["completed"] == 1,
           json.dumps(combo)[:260])

    print("\n97. Fase 13 - Pemusatan tepat terhadap isi panggung")
    open_fresh(page, "#/belajar/02_operasi_aljabar/perkalian_matriks")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    pusat = page.evaluate(PUSAT_PANGGUNG)
    record("Banner 'Simulasi selesai' terpusat tepat di panggung",
           pusat["overlayOffset"] <= 1, json.dumps(pusat))
    record("Banner tidak meluber keluar panggung",
           pusat["overlayInside"] is True, json.dumps(pusat))
    record("Toast terpusat tepat di kotak ISI panggung",
           pusat["toastOffset"] <= 1, json.dumps(pusat))
    record("Sumbu isi memang berbeda dari sumbu kolom (talang scrollbar)",
           pusat["contentVsColumn"] >= 2, json.dumps(pusat))

    # ==========================================================
    # FASE 14 — LAYAR MUAT & SESI LINTAS-TAB
    # ==========================================================

    print("\n98. Fase 14 - Layar muat & munculnya aplikasi")
    boot = page.evaluate(LAYAR_MUAT)
    record("Layar muat ada di HTML, bukan dibuat JavaScript",
           boot["adaDiHtml"] is True, json.dumps(boot)[:240])
    record("Bentuknya matriks 2x2 di dalam kurung siku",
           boot["sel"] == 4 and boot["kurung"] == 2, json.dumps(boot)[:240])
    record("Teksnya 'Memuat Ruang Matriks...'",
           boot["teks"].startswith("Memuat Ruang Matriks"), json.dumps(boot)[:240])
    record("Denyutnya memakai ketiga warna merek",
           boot["warna"]["royal"] == "rgb(29, 78, 216)"
           and boot["warna"]["cyan"] == "rgb(6, 182, 212)"
           and boot["warna"]["yellow"] == "rgb(255, 200, 0)", json.dumps(boot)[:240])
    record("Setelah siap, layar muat dibuang dan #app tampil penuh",
           boot["sesudahLoaderHilang"] is True and boot["sesudahAppOpacity"] == "1",
           json.dumps(boot)[:240])

    print("\n99. Fase 14 - Identitas bertahan lintas muat-ulang & tab")
    persist = page.evaluate(PERSISTENSI_IDENTITAS)
    record("Identitas disimpan di localStorage, bukan sessionStorage",
           persist["diLocal"] is True and persist["diSession"] is False, json.dumps(persist))
    record("Muat ulang tidak memaksa masuk lagi",
           persist["hashSetelahMuatUlang"] == "#/", json.dumps(persist))
    # Namanya sengaja tidak dipatok: `add_init_script` menyemai ulang identitas
    # di SETIAP dokumen baru (termasuk iframe ini), jadi yang bisa dibuktikan
    # adalah identitasnya BERTAHAN — mendarat di menu dengan sapaan, bukan
    # dilempar ke layar masuk.
    record("Sapaan nama tetap muncul setelah muat ulang",
           persist["sapaan"].startswith("Halo,"), json.dumps(persist))

    print("\n100. Fase 14 - Tombol 'Ganti Akun'")
    # Tombolnya hanya ada di menu utama, jadi ke sana dulu.
    open_fresh(page, "#/")
    ganti = page.evaluate(GANTI_AKUN)
    record("Tombol Ganti Akun ada di sebelah sapaan nama",
           ganti["ada"] is True and ganti["dekatNama"] is True, json.dumps(ganti)[:240])
    record("Tombol punya label aksesibilitas yang jelas",
           bool(ganti["aria"]) and "Keluar" in ganti["aria"], json.dumps(ganti)[:240])
    record("Konfirmasi memakai modal aplikasi, bukan confirm() bawaan",
           ganti["modalTampil"] is True and ganti["dialogBawaan"] == 0,
           json.dumps(ganti)[:240])
    record("Tidak ada tag HTML mentah di badan modal",
           ganti["tagMentah"] is False, json.dumps(ganti)[:240])
    record("Membatalkan tidak menghapus identitas",
           ganti["identitasSetelahBatal"] is True, json.dumps(ganti)[:240])
    record("Mengonfirmasi menghapus identitas dan kembali ke #/login",
           ganti["identitasSetelahKonfirmasi"] is False
           and ganti["hashAkhir"] == "#/login", json.dumps(ganti)[:240])
    record("Posisi belajar siswa sebelumnya ikut dibuang",
           ganti["posisiTerhapus"] is True, json.dumps(ganti)[:240])
    record("Pencapaian di perangkat TIDAK ikut terhapus",
           ganti["progresBertahan"] is True, json.dumps(ganti)[:240])

    # ==========================================================
    # FASE 15 — PAPAN CORET
    # ==========================================================

    print("\n101. Fase 15 - Papan coret: tombol, bilah alat, dan mesin gambar")
    # Bagian 100 sengaja MENGELUARKAN siswa, jadi identitasnya dipasang lagi di
    # sini. Tanpa ini, penjaga rute melempar bagian ini ke #/login dan
    # `.ws-stage` — tempat papan coret menempel — tidak pernah ada.
    page.evaluate("""() => { try {
        localStorage.setItem('matriksLab.identity.v1',
            JSON.stringify({ nama: 'Uji Otomatis', sekolah: 'SMAS YPVDP Bontang' }));
    } catch (e) {} }""")
    open_fresh(page, "#/belajar/03_determinan_invers/determinan_3x3")
    page.wait_for_selector('.ws-stage', timeout=10000)
    pad = page.evaluate(PAPAN_DASAR)
    record("Tombol mengambang ada di sudut kanan-bawah panggung",
           pad["fabAda"] is True and pad["diDalamPanggung"] is True, json.dumps(pad)[:260])
    record("Tombol mengambang memenuhi ambang sentuh 44px",
           pad["fabUkuran"][0] >= 44 and pad["fabUkuran"][1] >= 44, json.dumps(pad)[:260])
    record("Papan tertutup sampai tombolnya ditekan",
           pad["tertutupDiAwal"] is True, json.dumps(pad)[:260])
    record("Bilah alat lengkap: alat, warna, ketebalan, tindakan, tampilan",
           pad["grup"] == ["Alat", "Warna", "Ketebalan", "Tindakan", "Tampilan"],
           json.dumps(pad)[:260])
    record("Empat warna tersedia (hitam, merah, biru, kuning)",
           pad["warna"] == 4, json.dumps(pad)[:260])
    record("Tiga ketebalan tersedia", pad["tebal"] == 3, json.dumps(pad)[:260])
    record("Bilah alat muat satu baris dan terpusat di panggung",
           pad["satuBaris"] is True and pad["barTerpusat"] is True, json.dumps(pad)[:260])
    record("Kanvas memakai lineCap & lineJoin bulat",
           pad["lineCap"] == "round" and pad["lineJoin"] == "round", json.dumps(pad)[:260])
    record("Kanvas memblokir gulir sentuh (touch-action: none)",
           pad["touchAction"] == "none", json.dumps(pad)[:260])
    record("Buffer kanvas cocok dengan kotak CSS x devicePixelRatio",
           pad["bufferBenar"] is True, json.dumps(pad)[:260])
    record("Menggambar dengan Pointer Events meninggalkan tinta",
           pad["tintaSetelahGambar"] > 200 and pad["strokes"] == 1, json.dumps(pad)[:260])

    print("\n102. Fase 15 - Urungkan/Ulangi, penghapus, dan batas 20 goresan")
    riwayat = page.evaluate(PAPAN_RIWAYAT)
    record("Urungkan menghapus goresan terakhir",
           riwayat["undoMengurangi"] is True, json.dumps(riwayat)[:260])
    record("Ulangi mengembalikannya persis",
           riwayat["redoMengembalikan"] is True, json.dumps(riwayat)[:260])
    record("Penghapus benar-benar melubangi, bukan mengecat putih",
           riwayat["penghapusMengurangi"] is True, json.dumps(riwayat)[:260])
    record("Hapus semua mengosongkan kanvas",
           riwayat["hapusSemuaBersih"] is True, json.dumps(riwayat)[:260])
    # Batas riwayat: 25 goresan, undo hanya boleh mundur 20.
    record("Undo dibatasi tepat 20 goresan terakhir",
           riwayat["undoSejauh"] == 20, json.dumps(riwayat)[:260])
    record("Goresan lama tetap tergambar, tidak ikut lenyap",
           riwayat["goresanLamaSelamat"] is True, json.dumps(riwayat)[:260])

    print("\n103. Fase 15 - Mengintip, ubah ukuran, dan isolasi rute")
    intip = page.evaluate(PAPAN_INTIP)
    record("Menahan ikon mata menyembunyikan kanvas DAN bilah alat",
           intip["saatDitahan"]["canvas"] == "0"
           and intip["saatDitahan"]["bar"] == "0", json.dumps(intip)[:280])
    record("Menggambar dimatikan selama mengintip",
           intip["gambarDiabaikan"] is True, json.dumps(intip)[:280])
    record("Melepas tekanan memunculkannya kembali seketika",
           intip["setelahLepas"]["canvas"] == "1"
           and intip["setelahLepas"]["bar"] == "1", json.dumps(intip)[:280])
    record("Menggambar hidup lagi setelah dilepas",
           intip["gambarHidupLagi"] is True, json.dumps(intip)[:280])

    # --- Ubah ukuran: gambar tidak boleh hilang ---
    page.evaluate(PAPAN_SIAP_RESIZE)
    sebelum = page.evaluate("() => ({strokes: window.__padS.state.strokes, ink: window.__padInk(),"
                            " buf: [window.__padCv.width, window.__padCv.height]})")
    page.set_viewport_size({"width": 900, "height": 1000})
    page.wait_for_timeout(800)
    sesudah = page.evaluate("() => ({strokes: window.__padS.state.strokes, ink: window.__padInk(),"
                            " buf: [window.__padCv.width, window.__padCv.height]})")
    page.set_viewport_size({"width": 1280, "height": 860})
    page.wait_for_timeout(500)
    record("Ubah ukuran menghitung ulang ruang koordinat kanvas",
           sesudah["buf"] != sebelum["buf"],
           json.dumps({"sebelum": sebelum, "sesudah": sesudah}))
    record("Ubah ukuran TIDAK menghancurkan gambarnya",
           sesudah["strokes"] == sebelum["strokes"] and sesudah["ink"] > 0,
           json.dumps({"sebelum": sebelum, "sesudah": sesudah}))

    # --- Isolasi rute ---
    page.evaluate("""() => { const v = window.__matriksLab.state.activeView;
        v.step = 1; v.renderStep(); }""")
    page.wait_for_timeout(700)
    langkah = page.evaluate("""() => ({
        strokes: window.__matriksLab.state.activeView.scratchpad.state.strokes,
        instances: document.querySelectorAll('.pad').length })""")
    record("Pindah langkah dalam satu sub-topik TIDAK menghapus coretan",
           langkah["strokes"] > 0 and langkah["instances"] == 1, json.dumps(langkah))

    open_fresh(page, "#/belajar/01_konsep_dasar/transpose")
    rute = page.evaluate(PAPAN_RUTE_BARU)
    record("Pindah sub-topik memberi papan yang BERSIH",
           rute["strokes"] == 0 and rute["ink"] == 0, json.dumps(rute))
    record("Tidak ada papan/tombol yang menumpuk antar-rute",
           rute["instances"] == 1 and rute["fabs"] == 1, json.dumps(rute))

    # ==========================================================
    # FASE 15.5 — POLES PAPAN CORET
    # (melanjutkan papan yang baru dibuka di rute transpose)
    # ==========================================================

    print("\n104. Fase 15.5 - Garis bersambung, penghapus goresan, kanvas padat")

    sapu = page.evaluate(PAPAN55_SAPU)
    # Satu peristiwa gerak membawa 7 titik. Algoritma lama hanya menggambar
    # ruas TERAKHIR, menyisakan celah ratusan piksel — terukur 288px saat
    # dibandingkan langsung. Yang benar tidak menyisakan celah sama sekali.
    record("Sapuan cepat (titik gabungan) menghasilkan garis tanpa celah",
           sapu["celahPx"] <= 2, json.dumps(sapu)[:260])
    record("Seluruh lintasan sapuan cepat tergambar, bukan ruas terakhirnya saja",
           sapu["bertinta"] >= sapu["lebarPindai"] - 4, json.dumps(sapu)[:260])
    record("Sapuan cepat tetap tercatat sebagai SATU goresan",
           sapu["strokes"] == 1, json.dumps(sapu)[:260])

    hapus = page.evaluate(PAPAN55_HAPUS)
    record("Penghapus di ruang kosong tidak membuang goresan apa pun",
           hapus["ketukKosong"]["strokes"] == 2
           and hapus["ketukKosong"]["barisA"] == hapus["awal"]["barisA"],
           json.dumps(hapus)[:300])
    record("Satu ketukan penghapus membuang SATU goresan utuh",
           hapus["ketukDiGoresan"]["strokes"] == 1
           and hapus["ketukDiGoresan"]["barisA"] == 0,
           json.dumps(hapus)[:300])
    record("Goresan lain tidak ikut terhapus",
           hapus["ketukDiGoresan"]["barisB"] == hapus["awal"]["barisB"],
           json.dumps(hapus)[:300])
    record("Urungkan mengembalikan goresan yang dihapus, utuh",
           hapus["setelahUndo"]["strokes"] == 2
           and hapus["setelahUndo"]["barisA"] == hapus["awal"]["barisA"],
           json.dumps(hapus)[:300])
    record("Satu sapuan penghapus bisa membuang beberapa goresan sekaligus",
           hapus["sebelumSapu"] == 3 and hapus["setelahSapu"] == 0,
           json.dumps(hapus)[:300])
    record("Sapuan penghapus itu satu langkah undo, bukan tiga",
           hapus["setelahSatuUndo"] == 3, json.dumps(hapus)[:300])
    record("Penghapus tidak meninggalkan goresan bayangan di tumpukan",
           hapus["penghapusTidakMenambahGoresan"] is True, json.dumps(hapus)[:300])

    padat = page.evaluate(PAPAN55_PADAT)
    # `rgb(...)` tanpa alfa = benar-benar padat. `rgba(...)` apa pun berarti
    # soal di bawahnya masih menembus, dan itulah yang dikeluhkan UAT.
    record("Kanvas papan coret berlatar PADAT, bukan tembus pandang",
           padat["latar"] == "rgb(255, 255, 255)", json.dumps(padat)[:260])
    record("Latar kanvas memakai pola titik kertas berpetak",
           padat["adaPetak"] is True, json.dumps(padat)[:260])
    record("Transisi mengintip 0.2s ease-in-out",
           padat["durasi"].startswith("0.2s") and "ease-in-out" in padat["easing"],
           json.dumps(padat)[:260])

    intip55 = page.evaluate(PAPAN55_INTIP)
    record("Mengintip MEMUDAR, bukan berpindah seketika",
           0.05 < intip55["diTengahTransisi"] < 0.95, json.dumps(intip55)[:300])
    record("Tombol mata tetap menerima pointer selama mengintip",
           intip55["saatDitahan"]["peeking"] is True
           and intip55["saatDitahan"]["tombolPe"] == "auto", json.dumps(intip55)[:300])
    record("Melepas DI TOMBOL mata mengakhiri mengintip",
           intip55["lepasDiTombol"]["peeking"] is False
           and intip55["lepasDiTombol"]["opacity"] == "1", json.dumps(intip55)[:300])
    record("pointerleave pada tombol mata juga mengakhiri mengintip",
           intip55["lepasPointerleave"] is False, json.dumps(intip55)[:300])
    record("pointercancel pada tombol mata juga mengakhiri mengintip",
           intip55["lepasPointercancel"] is False, json.dumps(intip55)[:300])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true", help="nyalakan server statis sendiri")
    parser.add_argument("--headed", action="store_true", help="tampilkan jendela browser")
    args = parser.parse_args()

    server = None
    if args.serve:
        server = subprocess.Popen(
            [sys.executable, "-m", "http.server", "5173", "--directory", str(ROOT)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        time.sleep(1.5)

    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=not args.headed)
            page = browser.new_page(viewport={"width": 1280, "height": 860})

            # Fase 9 mengalihkan pengunjung tanpa identitas ke #/login.
            # Sebagian besar uji tidak sedang menguji layar masuk, jadi
            # identitasnya disemai lebih dulu di setiap navigasi.
            #
            # Sejak Fase 14 identitas tinggal di localStorage supaya siswa
            # tidak dipaksa masuk ulang tiap membuka tab baru.
            page.add_init_script("""
                try {
                    localStorage.setItem('matriksLab.identity.v1',
                        JSON.stringify({ nama: 'Uji Otomatis', sekolah: 'SMAS YPVDP Bontang' }));
                } catch (e) {}
            """)

            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))

            run(page, errors)
            browser.close()
    finally:
        if server:
            server.terminate()

    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"\n{'=' * 52}\nHASIL: {passed}/{total} lolos")
    if passed < total:
        print("\nYang gagal:")
        for name, ok, detail in results:
            if not ok:
                print(f"  - {name}: {detail}")
    print("=" * 52)

    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
