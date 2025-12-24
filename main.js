// ==========================================
// AYARLAR
// ==========================================

// Docs linki buraya
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFoMSGGsZ-mM9K-XtN9Bi1paGdMJhulBt2hY7vUa5y3OCg8tgYmNW87f9BTLldo48ihIvdEC89fPu5/pub?output=csv";

var urunler = {}; 

// ==========================================
// Docstaki şeyleri çekme
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    Papa.parse(GOOGLE_SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            verileriIsle(results.data);
            siteyiBaslat(); 
        },
        error: function(err) {
            console.error("Veri hatası:", err);
        }
    });
});

function verileriIsle(data) {
    data.forEach(satir => {
        // hücre boşsa sg et
        if (!satir.id || satir.id.trim() === "") return;

        let renklerObjesi = {};

        // --- RENK 1---
        if (satir.renk1_ad && satir.renk1_resimler) {
            // Linkleri virgüle göre ayırıp temizle
            const resimler = satir.renk1_resimler.split(',').map(r => r.trim()).filter(r => r !== "");
            if (resimler.length > 0) {
                renklerObjesi[satir.renk1_ad] = resimler;
            }
        }

        // --- RENK 2  ---
        if (satir.renk2_ad && satir.renk2_resimler) {
            const resimler = satir.renk2_resimler.split(',').map(r => r.trim()).filter(r => r !== "");
            if (resimler.length > 0) {
                renklerObjesi[satir.renk2_ad] = resimler;
            }
        }

        // --- RENK 3 ---
        if (satir.renk3_ad && satir.renk3_resimler) {
            const resimler = satir.renk3_resimler.split(',').map(r => r.trim()).filter(r => r !== "");
            if (resimler.length > 0) {
                renklerObjesi[satir.renk3_ad] = resimler;
            }
        }

        // renk yoksa merte renk yoksa ilk renge standart girmeli de
        if (Object.keys(renklerObjesi).length === 0) {
            //
            const standartResimler = [satir.resim1, satir.resim2, satir.resim3].filter(r => r && r.trim() !== "");
            
            if (standartResimler.length > 0) {
                renklerObjesi["Standart"] = standartResimler;
            } else {
                renklerObjesi["Standart"] = ["Resimler/varsayilan.jpg"];
            }
        }

        // Ürün objesini oluştur
        urunler[satir.id] = {
            baslik: satir.baslik,
            fiyat: satir.fiyat,
            aciklama: satir.aciklama,
            kategori: satir.kategori,
            renkler: renklerObjesi, // Artık renkler objesi dolu
            // Ana sayfada görünecek kapak resmi (İlk rengin ilk resmi)
            kapakResmi: Object.values(renklerObjesi)[0][0] 
        };
    });
}


function siteyiBaslat() {
    
    // Hangi sayfadayız? Kontrol edelim.
    const detayBaslik = document.getElementById("urunBaslik");
    
    if (detayBaslik) {
        // DETAY SAYFASINDAYIZ
        detaySayfasiniYukle();
    } else {
        // ANA SAYFADAYIZ (Veya katalogdayız)
        anaSayfayiYukle();
    }
}

// ------------------------------------------
// DETAY SAYFASI İŞLEMLERİ Aİ sağolsun
// ------------------------------------------
function detaySayfasiniYukle() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const urun = urunler[id];

    if (!urun) {
        document.querySelector(".urun-bilgi").innerHTML = "<h2>Ürün bulunamadı.</h2>";
        return;
    }

    // Yazıları doldur
    document.getElementById("urunBaslik").textContent = urun.baslik;
    document.getElementById("urunAciklama").textContent = urun.aciklama;
    document.getElementById("urunFiyat").textContent = urun.fiyat;

    // --- RENK BUTONLARINI OLUŞTURMA KISMI (BURASI EKLENDİ) ---
    const renkContainer = document.getElementById("renkSecenekleri");
    renkContainer.innerHTML = ""; // Önce temizle (önceki kalıntıları sil)
    
    // "Renk Seçenekleri:" başlığını ekleyelim (Opsiyonel)
    if (Object.keys(urun.renkler).length > 0) {
        const baslikSpan = document.createElement("span");
        baslikSpan.textContent = "Renk Seçeneği: ";
        baslikSpan.style.fontWeight = "bold";
        baslikSpan.style.marginRight = "10px";
        renkContainer.appendChild(baslikSpan);
    }

    // Her renk için bir buton oluştur
    Object.keys(urun.renkler).forEach((renkAdi, index) => {
        const btn = document.createElement("button");
        btn.textContent = renkAdi;
        btn.className = "renk-btn"; // CSS'deki sınıfı kullan
        
        // İlk buton varsayılan olarak seçili olsun
        if (index === 0) btn.classList.add("active");

        // Butona tıklayınca ne olacak?
        btn.addEventListener("click", () => {
            // 1. Diğer butonlardan active sınıfını kaldır, buna ekle
            document.querySelectorAll(".renk-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // 2. Slaytı bu rengin resimleriyle güncelle
            slaytiGuncelle(urun.renkler[renkAdi]);
        });

        renkContainer.appendChild(btn);
    });

    // Sayfa ilk açıldığında ilk rengin resimlerini yükle
    const ilkRenkAdi = Object.keys(urun.renkler)[0];
    if (ilkRenkAdi) {
        slaytiGuncelle(urun.renkler[ilkRenkAdi]);
    }

    // Detay sayfası slayt buton (oklar) mantığı
    detaySlaytMantigi();
}

// Resimleri değiştiren yardımcı fonksiyon
function slaytiGuncelle(resimListesi) {
    const slaytContainer = document.getElementById("urunSlayt");
    
    // Sadece img etiketlerini temizle (prev/next butonlarına dokunma)
    const eskiResimler = slaytContainer.querySelectorAll("img");
    eskiResimler.forEach(img => img.remove());

    // Yeni resimleri ekle
    resimListesi.forEach((src, index) => {
        const img = document.createElement("img");
        img.src = src;
        if (index === 0) img.classList.add("active");
        
        // Ok butonlarının önüne ekle ki butonlar resmin üstünde kalsın
        const prevBtn = slaytContainer.querySelector(".prev");
        if(prevBtn) {
            slaytContainer.insertBefore(img, prevBtn);
        } else {
            slaytContainer.appendChild(img);
        }
    });
}

function detaySlaytMantigi() {
    const slaytContainer = document.getElementById("urunSlayt");
    const prev = slaytContainer.querySelector(".prev");
    const next = slaytContainer.querySelector(".next");
    let index = 0;

    function show(i) {
        const imgs = slaytContainer.querySelectorAll("img");
        if(imgs.length === 0) return;
        
        if(i >= imgs.length) index = 0;
        else if(i < 0) index = imgs.length - 1;
        else index = i;

        imgs.forEach(img => img.classList.remove("active"));
        imgs[index].classList.add("active");
    }

    if(next) next.addEventListener("click", () => show(index + 1));
    if(prev) prev.addEventListener("click", () => show(index - 1));
}

// ------------------------------------------
// ANA SAYFA İŞLEMLERİ
// ------------------------------------------
function anaSayfayiYukle() {
    
    // Ürünleri Listele
    Object.keys(urunler).forEach(key => {
        const urun = urunler[key];
        const hedefContainer = document.querySelector(`#${urun.kategori} .urun-grid`);
        
        if (hedefContainer) {
            
            // Yeni sistemde kapak resmi hazır geliyor
            let gosterilecekResim = urun.kapakResmi || "Resimler/varsayilan.jpg";

            const urunHTML = `
                <a href="urun-detay.html?id=${key}" class="urun" style="text-decoration: none;">
                    <img src="${gosterilecekResim}" alt="${urun.baslik}" onerror="this.src='Resimler/hata.png'">
                    <h4>${urun.baslik}</h4>
                    <p class="fiyat">${urun.fiyat}</p>
                </a>
            `;
            hedefContainer.innerHTML += urunHTML;
        }
    });

    const aramaInput = document.getElementById('aramaInput');
    const aramaSonuclari = document.getElementById('aramaSonuclari');
    const tumKategoriler = document.getElementById('tum-kategoriler');

    if (aramaInput) {
        aramaInput.addEventListener('input', (e) => {
            const kelime = e.target.value.toLowerCase().trim();
            
            if (kelime === "") {
                tumKategoriler.style.display = "block";
                aramaSonuclari.style.display = "none";
                aramaSonuclari.innerHTML = "";
                return;
            }

            tumKategoriler.style.display = "none";
            aramaSonuclari.style.display = "flex";
            aramaSonuclari.innerHTML = "";
            let bulundu = false;

            Object.keys(urunler).forEach(key => {
                const urun = urunler[key];

                const arananKucuk = kelime;  
                const urunBaslik = urun.baslik.toLowerCase();
                const urunFiyat = urun.fiyat.toString().toLowerCase(); 

                if (urunBaslik.includes(arananKucuk) || urunFiyat.includes(arananKucuk)) {
                    bulundu = true;
                    aramaSonuclari.innerHTML += `
                        <a href="urun-detay.html?id=${key}" class="urun" style="text-decoration: none;">
                            <img src="${urun.kapakResmi}" alt="${urun.baslik}" onerror="this.src='Resimler/hata.png'">
                            <h4>${urun.baslik}</h4>
                            <p class="fiyat">${urun.fiyat}</p>
                        </a>
                    `;
                }
            });

            if (!bulundu) aramaSonuclari.innerHTML = "<p>Ürün bulunamadı.</p>";
        });
    }

    // Ana Sayfa Büyük Slider Mantığı
    anaSliderMantigi();
}

const kategoriButonlari = document.querySelectorAll('.kategori-butonlar button');

    kategoriButonlari.forEach(btn => {
        btn.addEventListener('click', () => {
            const hedefId = btn.getAttribute('data-target');
            const hedefBolum = document.getElementById(hedefId);

            if (hedefBolum) {
                hedefBolum.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

function anaSliderMantigi() {
    const slides = document.querySelectorAll('.slayt > img'); // Sadece slayt class'ı altındaki resimler
    if(slides.length === 0) return;

    let index = 0;
    const nextBtn = document.querySelector('.slayt .next');
    const prevBtn = document.querySelector('.slayt .prev');

    function show(i) {
        if(i >= slides.length) index = 0;
        else if(i < 0) index = slides.length - 1;
        else index = i;
        
        slides.forEach(img => img.classList.remove("active"));
        slides[index].classList.add("active");
    }

    if(nextBtn) nextBtn.addEventListener("click", () => show(index + 1));
    if(prevBtn) prevBtn.addEventListener("click", () => show(index - 1));
    
    // Otomatik geçiş
    setInterval(() => show(index + 1), 5000);
}