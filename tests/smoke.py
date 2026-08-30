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
    Buang ingatan posisi sesi (Fase 8).

    Sejak Fase 8 aplikasi mengingat langkah terakhir siswa di sessionStorage,
    jadi kunjungan berikutnya mendarat di sana — bukan di Materi. Bagian uji
    yang memang ingin memulai dari nol harus menyatakannya secara eksplisit.
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
    errs = page.evaluate("""() => new Promise(resolve => {
        const wrong = [...document.querySelectorAll('.stage__row .btn')];
        if (!wrong.length) return resolve({ skipped: true });
        wrong.forEach(b => b.click());
        setTimeout(() => resolve({
            skipped: false,
            errorToasts: document.querySelectorAll('.toast--error').length,
            locked: document.querySelectorAll('.is-failed').length
        }), 500);
    })""")
    if errs.get("skipped"):
        record("Toast error singleton", False, "tidak ada tombol untuk memicu error")
    else:
        record("Toast error singleton (maks 1)", errs["errorToasts"] <= 1, f"aktif: {errs['errorToasts']}")
        record("Opsi salah dinonaktifkan", errs["locked"] >= 1, f"terkunci: {errs['locked']}")

    print("\n19. Materi Jenis Matriks berbentuk carousel")
    open_fresh(page, "#/belajar/01_konsep_dasar/jenis_matriks")
    car = page.evaluate("""() => ({
        carousel: !!document.querySelector('.materi-carousel'),
        slides: document.querySelectorAll('.materi-carousel__slide').length
    })""")
    record("Carousel jenis matriks ada", car["carousel"] is True, json.dumps(car))
    record("Enam jenis dijelaskan satu per satu", car["slides"] == 6, json.dumps(car))

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

    print("\n41. Artefak UI carousel bersih")
    open_fresh(page, "#/belajar/01_konsep_dasar/jenis_matriks")
    art = page.evaluate("""() => {
        const c = document.querySelector('.materi-carousel');
        if (!c) return { found: false };
        const vp = c.querySelector('.materi-carousel__viewport');
        const slides = [...c.querySelectorAll('.materi-carousel__slide')];
        return {
            found: true,
            viewportScrolls: vp.scrollHeight > vp.clientHeight + 1 || vp.scrollWidth > vp.clientWidth + 1,
            slideScrolls: slides.some(s => s.scrollHeight > s.clientHeight + 1),
            overflow: getComputedStyle(vp).overflow
        };
    }""")
    record("Viewport carousel tidak menggulir", art.get("viewportScrolls") is False, json.dumps(art))
    record("Slide carousel tidak menggulir", art.get("slideScrolls") is False, json.dumps(art))

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
            const fig = document.querySelector('.materi-carousel__figure');
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

    print("\n57. Invers 2x2: tiga tahap dikerjakan siswa")
    open_fresh(page, "#/belajar/03_determinan_invers/invers_2x2")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    inv = page.evaluate("""() => new Promise(resolve => {
        const cells = () => [...document.querySelectorAll('.sim .matrix .cell')];
        const log = { steps: document.querySelectorAll('.checklist__item').length };
        // Tahap 1: determinan manual (K = [[3,5],[1,2]] -> det = 1)
        const c = cells(); c[0].click(); c[3].click();
        setTimeout(() => {
            const c2 = cells(); c2[1].click(); c2[2].click();
            setTimeout(() => {
                log.det = (document.querySelector('.scalar-result__value') || {}).textContent;
                log.before = cells().map(x => x.dataset.value).join(',');
                // Tahap 2a: tukar diagonal utama
                const c3 = cells(); c3[0].click(); c3[3].click();
                setTimeout(() => {
                    log.afterSwap = cells().map(x => x.dataset.value).join(',');
                    // Tahap 2b: balik tanda diagonal sekunder
                    cells()[1].click();
                    setTimeout(() => {
                        cells()[2].click();
                        setTimeout(() => {
                            log.adjoint = cells().map(x => x.dataset.value).join(',');
                            log.chip = !!document.querySelector('.scalar-chip--fraction');
                            log.invited = document.querySelectorAll('.cell--invite').length;
                            resolve(log);
                        }, 900);
                    }, 900);
                }, 1800);
            }, 3000);
        }, 3000);
    })""")
    record("Tiga tahap tercantum di checklist", inv.get("steps") == 3, json.dumps(inv))
    record("Determinan dihitung siswa lebih dulu", inv.get("det") == "1", json.dumps(inv))
    record("Diagonal utama benar-benar bertukar",
           inv.get("before") == "3,5,1,2" and inv.get("afterSwap") == "2,5,1,3", json.dumps(inv))
    record("Diagonal sekunder berbalik tanda",
           inv.get("adjoint") == "2,-5,-1,3", json.dumps(inv))
    record("Chip 1/det muncul di tahap 3", inv.get("chip") is True, json.dumps(inv))
    record("Setiap elemen jadi sasaran tersendiri", inv.get("invited") == 4, json.dumps(inv))

    print("\n58. Invers 3x3 ditangguhkan dengan jujur")
    open_fresh(page, "#/belajar/03_determinan_invers/invers_3x3")
    b = page.query_selector("button:has-text('Mulai Simulasi')")
    if b:
        b.click()
        page.wait_for_timeout(800)
    wip = page.evaluate("""() => ({
        card: !!document.querySelector('.wip-card'),
        title: (document.querySelector('.wip-card__title') || {}).textContent || '',
        stage: !!document.querySelector('.stage'),
        nextEnabled: !([...document.querySelectorAll('button')]
            .find(b => b.textContent.includes('Lanjut ke Mini Kuis')) || {}).disabled,
        noMathpadField: document.querySelectorAll('.sim .numfield').length,
    })""")
    record("Kartu 'sedang dibangun' tampil", wip["card"] is True, json.dumps(wip))
    record("Struktur .stage tetap standar", wip["stage"] is True, json.dumps(wip))
    record("Siswa tetap bisa lanjut ke Mini Kuis", wip["nextEnabled"] is True, json.dumps(wip))
    record("Tidak ada isian kofaktor yang menyesatkan", wip["noMathpadField"] == 0, json.dumps(wip))

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
    rule = page.evaluate("""() => new Promise(resolve => {
        const cards = [...document.querySelectorAll('.drag-card')];
        const zone = document.querySelector('.dropzone');
        if (!cards.length || !zone) return resolve({ found: false });
        // Jatuhkan tiap kartu sampai ada yang diterima.
        const drop = el => {
            const b = el.getBoundingClientRect();
            const z = zone.getBoundingClientRect();
            const o = (x, y) => ({ bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y,
                                   pointerId: 7, pointerType: 'mouse', button: 0, isPrimary: true });
            el.dispatchEvent(new PointerEvent('pointerdown', o(b.left + b.width/2, b.top + b.height/2)));
            document.dispatchEvent(new PointerEvent('pointermove', o(z.left + z.width/2, z.top + z.height/2)));
            document.dispatchEvent(new PointerEvent('pointerup', o(z.left + z.width/2, z.top + z.height/2)));
        };
        cards.forEach(drop);
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
    page.evaluate("() => { try { sessionStorage.clear(); } catch (e) {} }")
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
            try { stored = JSON.parse(sessionStorage.getItem('matriksLab.identity.v1')); } catch (e) {}
            resolve({
                hash: location.hash,
                stored,
                greet: (document.querySelector('.menu__title') || {}).textContent || '',
                school: (document.querySelector('.menu__greet') || {}).textContent || '',
            });
        }, 900);
    })""")
    record("Identitas tersimpan di sessionStorage",
           bool(saved.get("stored")) and saved["stored"].get("nama") == "Budi Santoso",
           json.dumps(saved))
    record("Menu utama menyapa dengan nama depan",
           "Budi" in saved.get("greet", ""), json.dumps(saved))
    record("Asal sekolah ikut ditampilkan",
           "YPVDP" in saved.get("school", ""), json.dumps(saved))

    empty = page.evaluate("""() => new Promise(resolve => {
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
    page.evaluate("() => { try { sessionStorage.clear(); } catch (e) {} }")
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
            page.add_init_script("""
                try {
                    sessionStorage.setItem('matriksLab.identity.v1',
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
