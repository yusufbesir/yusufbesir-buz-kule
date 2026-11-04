#!/usr/bin/env python3
# description: Buz Kule Rust çekirdeğini (core/) wasm32'ye derler, bellek dışa aktarımını sözleşmedeki "bellek" adına çevirir, uygulama/src/varlik/core.wasm'a yazar ve SHA256 verir. Sahip: Yusuf; yazan: Claude. Çalıştır: python3 arac/rust-derle.py
import hashlib, pathlib, subprocess, sys
kok = pathlib.Path(__file__).resolve().parent.parent
subprocess.run(["cargo", "build", "--release"], cwd=kok / "core", check=True)
ham = (kok / "core/target/wasm32-unknown-unknown/release/buz_kule_core.wasm").read_bytes()
eski, yeni = b"\x06memory", b"\x06bellek"  # aynı uzunluk: ikili yama güvenli
if ham.count(eski) != 1:
    sys.exit("memory dışa aktarımı bulunamadı ya da birden fazla")
cikti = ham.replace(eski, yeni)
hedef = kok / "uygulama/src/varlik/core.wasm"
hedef.write_bytes(cikti)
print(hedef, len(cikti), "bayt", "SHA256", hashlib.sha256(cikti).hexdigest())
