//! Buz Kule Rust çekirdeği, aşama 1: PRNG (mulberry32) + kat üretimi.
//! src/hayalet.js (katRnd) ve src/kat.js (katUret) ile bit düzeyinde aynı sonucu verir.
//! Bağımlılıksız; yalnız + − × ÷ floor kullanılır. Sözleşme: PLAN-buz-kule.md "Aşama 1 sözleşmesi".
#![no_std]

const SATIR_KARO: u32 = 30;
const KAT_ARALIK_ALAN: usize = 9;

#[panic_handler]
fn panik(_: &core::panic::PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

static mut CIKIS: [f64; KAT_ARALIK_ALAN] = [0.0; KAT_ARALIK_ALAN];

#[inline]
fn floor(x: f64) -> f64 {
    // x >= 0 olduğundan kesme = floor; f64 → u64 → f64 (2^53 altında kesin)
    (x as u64) as f64
}

struct Rnd(u32);
impl Rnd {
    fn sonraki(&mut self) -> f64 {
        self.0 = self.0.wrapping_add(0x6D2B79F5);
        let a = self.0;
        let mut t = (a ^ (a >> 15)).wrapping_mul(1 | a);
        t = t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t)) ^ t;
        ((t ^ (t >> 14)) as f64) / 4294967296.0
    }
}

fn kat_rnd(tohum: u32, n: u32) -> Rnd {
    Rnd(tohum ^ n.wrapping_add(1).wrapping_mul(0x9E3779B1))
}

fn genislik(kat: u32, r: &mut Rnd) -> u32 {
    if kat > 0 && kat % 50 == 0 {
        return SATIR_KARO;
    }
    let h = (300.0 - kat as f64) / 30.0;
    let ham = floor(h + 0.5); // Math.round (h negatifse 1'e sıkıştırılır)
    let aralik = if h + 0.5 < 0.0 || ham < 1.0 { 1.0 } else { ham };
    let w = 6 + floor(r.sonraki() * aralik) as u32;
    let ust = if kat < 100 { SATIR_KARO } else { let d = 6i64 - (kat / 100) as i64; if d < 2 { 2 } else { d as u32 } };
    let m = if w < ust { w } else { ust };
    if m < 2 { 2 } else { m }
}

#[no_mangle]
pub extern "C" fn cikis_adresi() -> u32 {
    core::ptr::addr_of!(CIKIS) as u32
}

#[no_mangle]
pub extern "C" fn kat_uret(tohum: u32, n: u32) {
    let mut r = kat_rnd(tohum, n);
    let w = genislik(n, &mut r);
    let bas = 5 + if w == SATIR_KARO { 0 } else { floor(r.sonraki() * (SATIR_KARO - w + 1) as f64) as u32 };
    let kristal = n > 0 && r.sonraki() < 0.3;
    let kristal_x = r.sonraki();
    let guc_zar = r.sonraki();
    let guc = if n > 4 && !kristal && guc_zar < 0.07 { if guc_zar < 0.035 { 1.0 } else { 2.0 } } else { 0.0 };
    let tur_zar = r.sonraki();
    let tur = if n >= 15 && n % 10 != 0 && w < SATIR_KARO {
        if tur_zar < 0.08 { 1.0 } else if tur_zar < 0.14 { 2.0 } else { 0.0 }
    } else { 0.0 };
    unsafe {
        let c = &mut *core::ptr::addr_of_mut!(CIKIS);
        c[0] = n as f64;
        c[1] = bas as f64;
        c[2] = w as f64;
        c[3] = if n % 10 == 0 { 1.0 } else { 0.0 };
        c[4] = (n / 100) as f64;
        c[5] = if kristal { 1.0 } else { 0.0 };
        c[6] = kristal_x;
        c[7] = guc;
        c[8] = tur;
    }
}

// ---- Aşama 2: fizik (src/fizik.js ile bit düzeyinde aynı; yalnız + − × ÷ ve karşılaştırma) ----
const MAKS_VX: f64 = 12.2;
const MAKS_DUSME: f64 = 12.2;
const YERCEKIMI: f64 = 0.8;
const SURTUNME: f64 = 0.9;
const IVME: f64 = 0.3;
const TERS_YON_CARPAN: f64 = 0.7;
const DUVAR_SOL: f64 = 85.0;
const DUVAR_SAG: f64 = 555.0;
const SEKME: f64 = -0.9;

#[inline]
fn kucuk(a: f64, b: f64) -> f64 { if a < b { a } else { b } } // Math.min (NaN gelmez)
#[inline]
fn buyuk(a: f64, b: f64) -> f64 { if a > b { a } else { b } } // Math.max

#[no_mangle]
pub extern "C" fn yatay_guncelle(vx: f64, sol: u32, sag: u32) -> f64 {
    let dir = (if sag != 0 { 1.0 } else { 0.0 }) - (if sol != 0 { 1.0 } else { 0.0 });
    if dir == 0.0 { return vx * SURTUNME; }
    let mut v = vx;
    if v * dir < 0.0 { v *= TERS_YON_CARPAN; }
    v += dir * IVME;
    buyuk(-MAKS_VX, kucuk(MAKS_VX, v))
}

#[no_mangle]
pub extern "C" fn zipla(vx: f64) -> f64 {
    let m = if vx < 0.0 { -vx } else { vx }; // Math.abs
    kucuk(-2.0 * m, -MAKS_VX)
}

#[no_mangle]
pub extern "C" fn dikey_guncelle(vy: f64) -> f64 { kucuk(vy + YERCEKIMI, MAKS_DUSME) }

// Sonuç çıkış tamponunda: [0] = x, [1] = vx
#[no_mangle]
pub extern "C" fn duvar_sekmesi(x: f64, vx: f64) {
    let (nx, nvx) = if x < DUVAR_SOL { (DUVAR_SOL, vx * SEKME) } else if x > DUVAR_SAG { (DUVAR_SAG, vx * SEKME) } else { (x, vx) };
    unsafe { let c = &mut *core::ptr::addr_of_mut!(CIKIS); c[0] = nx; c[1] = nvx; }
}
