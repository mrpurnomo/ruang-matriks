# -*- coding: utf-8 -*-
"""Bangun arsip soal (hardcopy guru) dari `data/quizzes.json`.

    python tests/archive_soal.py

Menghasilkan dua berkas di `content/`:

  · QUIZ_ARCHIVE.md — seluruh bank soal per bab
  · TKA_ARCHIVE.md  — set Latihan Soal TKA (10 soal, urutan tetap)

⚠️ Kedua berkas itu DIBANGKITKAN, bukan ditulis tangan. Menyuntingnya
langsung akan hilang pada pembangkitan berikutnya — ubah `data/quizzes.json`,
lalu jalankan ulang skrip ini. Dengan begitu arsip guru tidak akan pernah
menyimpang dari soal yang benar-benar dilihat siswa.
"""
import io
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIZZES = os.path.join(ROOT, "data", "quizzes.json")
LESSONS = os.path.join(ROOT, "data", "lessons.json")
OUT_DIR = os.path.join(ROOT, "content")

HURUF = "ABCDEFGHIJ"

TIPE = {
    "single_choice": "Pilihan ganda (satu jawaban benar)",
    "multi_select": "Pilih semua jawaban benar",
    "mathpad": "Isian angka (papan angka)",
    "matrix_input": "Isian matriks",
}


def matriks_tex(m):
    baris = " \\\\ ".join(" & ".join(str(v) for v in row) for row in m)
    return f"\\begin{{pmatrix}} {baris} \\end{{pmatrix}}"


def tulis_soal(out, nomor, q):
    """Satu soal lengkap dengan opsi dan kunci jawabannya."""
    judul = f"### Soal {nomor}"
    if q.get("source"):
        judul += f" · {q['source']}"
    out.append(judul)
    out.append("")
    out.append(f"- **ID:** `{q['id']}`")
    out.append(f"- **Tipe:** {TIPE.get(q['input_type'], q['input_type'])}")
    if q.get("subtopic"):
        out.append(f"- **Sub-topik:** `{q['subtopic']}`")
    out.append("")
    out.append(q["prompt"])
    out.append("")

    if q.get("table"):
        t = q["table"]
        out.append("| " + " | ".join(t["headers"]) + " |")
        out.append("|" + "---|" * len(t["headers"]))
        for row in t["rows"]:
            out.append("| " + " | ".join(str(c) for c in row) + " |")
        out.append("")

    if q.get("tex"):
        out.append(f"$$ {q['tex']} $$")
        out.append("")

    if q.get("after"):
        out.append(q["after"])
        out.append("")

    # --- Opsi ---
    if q["input_type"] in ("single_choice", "multi_select"):
        for i, opt in enumerate(q["options"]):
            isi = f"${opt['tex']}$" if opt.get("tex") else opt.get("label", "")
            out.append(f"{HURUF[i]}. {isi}")
        out.append("")

    # --- Kunci ---
    if q["input_type"] == "single_choice":
        i = q["answerIndex"]
        opt = q["options"][i]
        isi = f"${opt['tex']}$" if opt.get("tex") else opt.get("label", "")
        kunci = f"**{HURUF[i]}** — {isi}"
    elif q["input_type"] == "multi_select":
        huruf = ", ".join(HURUF[i] for i in q["answerIndices"])
        kunci = f"**{huruf}**"
    elif q["input_type"] == "matrix_input":
        kunci = f"${matriks_tex(q['answer'])}$"
    else:
        kunci = f"**{q['answer']}**"

    out.append(f"> **KUNCI JAWABAN:** {kunci}")
    out.append("")

    if q.get("explanation"):
        out.append("**Pembahasan.** " + q["explanation"].replace("\n\n", " "))
        out.append("")

    if q.get("perOptionFeedback"):
        out.append("**Penjelasan per opsi:**")
        out.append("")
        for i, fb in enumerate(q["perOptionFeedback"]):
            out.append(f"- **{HURUF[i]}.** {fb}")
        out.append("")

    out.append("---")
    out.append("")


def main():
    q = json.load(io.open(QUIZZES, encoding="utf-8"))
    lessons = json.load(io.open(LESSONS, encoding="utf-8"))
    judul_bab = {c["id"]: f"Bab {c['number']}: {c['title']}" for c in lessons["chapters"]}

    index = {}
    for bank in q["banks"].values():
        for item in bank:
            index[item["id"]] = item

    # ------------------------------------------------------------
    # 1. QUIZ_ARCHIVE.md — seluruh bank per bab
    # ------------------------------------------------------------
    out = [
        "# Arsip Soal — Ruang Matriks",
        "",
        "Salinan cetak seluruh bank soal beserta **kunci jawabannya**, untuk pegangan guru.",
        "",
        "> ⚠️ **Berkas ini DIBANGKITKAN dari `data/quizzes.json`.** Jangan disunting",
        "> langsung — suntinganmu akan hilang saat dibangkitkan ulang. Ubah JSON-nya,",
        "> lalu jalankan `python tests/archive_soal.py`.",
        "",
        "Seluruh kunci di bawah sudah diverifikasi ulang secara matematis"
        " (Fase 18, bagian QA).",
        "",
        "---",
        "",
    ]

    total = 0
    for bank_id, items in q["banks"].items():
        if bank_id == "tka_2025":
            continue                      # punya berkasnya sendiri
        out.append(f"## {judul_bab.get(bank_id, bank_id)}")
        out.append("")
        out.append(f"*{len(items)} soal.*")
        out.append("")
        for i, item in enumerate(items, 1):
            tulis_soal(out, i, item)
            total += 1

    out.append(f"*Total {total} soal latihan per bab.*")
    out.append("")

    path1 = os.path.join(OUT_DIR, "QUIZ_ARCHIVE.md")
    io.open(path1, "w", encoding="utf-8", newline="\r\n").write("\n".join(out))
    print(f"QUIZ_ARCHIVE.md  : {total} soal dari {len(q['banks']) - 1} bank")

    # ------------------------------------------------------------
    # 2. TKA_ARCHIVE.md — set Latihan Soal TKA
    # ------------------------------------------------------------
    cfg = q["tkaSimulation"]
    urutan = cfg.get("questionOrder", [])

    out = [
        "# Arsip Latihan Soal TKA — Ruang Matriks",
        "",
        f"Set **{len(urutan)} soal** yang dipakai mode *Latihan Soal TKA*, urut sesuai",
        "yang dilihat siswa. Empat soal pertama adalah **soal asli TKA Matematika",
        "Lanjut 2025**; enam sisanya dipilih tangan sebagai penutup bergaya HOTS.",
        "",
        "> ⚠️ **Berkas ini DIBANGKITKAN dari `data/quizzes.json`.** Jangan disunting",
        "> langsung — jalankan `python tests/archive_soal.py` setelah mengubah JSON-nya.",
        "",
        "**Sumber soal 1–4:** `docs/TKA Matriks 2025.pdf` (Soal Asli TKA Matematika",
        "Lanjut Tahun 2025). Ditranskrip apa adanya; kuncinya dihitung ulang dan",
        "diverifikasi dengan `js/engine/matrix.js`.",
        "",
        "---",
        "",
    ]

    for i, qid in enumerate(urutan, 1):
        item = index.get(qid)
        if not item:
            out.append(f"### Soal {i}")
            out.append("")
            out.append(f"> ⚠️ Soal `{qid}` tidak ditemukan di bank mana pun.")
            out.append("")
            out.append("---")
            out.append("")
            continue
        tulis_soal(out, i, item)

    out.append("## Ringkasan Kunci Jawaban")
    out.append("")
    out.append("| No | ID | Tipe | Kunci |")
    out.append("|---|---|---|---|")
    for i, qid in enumerate(urutan, 1):
        item = index.get(qid)
        if not item:
            out.append(f"| {i} | `{qid}` | — | tidak ditemukan |")
            continue
        t = item["input_type"]
        if t == "single_choice":
            k = HURUF[item["answerIndex"]]
        elif t == "multi_select":
            k = ", ".join(HURUF[x] for x in item["answerIndices"])
        elif t == "matrix_input":
            k = str(item["answer"])
        else:
            k = str(item["answer"])
        out.append(f"| {i} | `{qid}` | {TIPE.get(t, t)} | **{k}** |")
    out.append("")

    path2 = os.path.join(OUT_DIR, "TKA_ARCHIVE.md")
    io.open(path2, "w", encoding="utf-8", newline="\r\n").write("\n".join(out))
    print(f"TKA_ARCHIVE.md   : {len(urutan)} soal")


if __name__ == "__main__":
    main()
