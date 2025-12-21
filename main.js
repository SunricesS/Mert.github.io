// ==========================================
// AYARLAR
// ==========================================

// KENDİ CSV LİNKİNİ BURAYA YAPIŞTIR
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTFoMSGGsZ-mM9K-XtN9Bi1paGdMJhulBt2hY7vUa5y3OCg8tgYmNW87f9BTLldo48ihIvdEC89fPu5/pub?output=csv";

var urunler = {}; 

// ==========================================
// VERİLERİ ÇEKME
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
        if (!satir.id || satir.id.trim() === "") return;
        
        // Resim sütunlarını temizle
        const resimListesi = [satir.resim1, satir.resim2, satir.resim3].filter(r => r && r.trim() !== "");
        
        urunler[satir.id] = {
            baslik: satir.baslik,
            fiyat: satir.fiyat,
            aciklama: satir.aciklama,
            kategori: satir.kategori,
            resimler: resimListesi.length > 0 ? resimListesi : ["Resimler/varsayilan.jpg"]
        };
    });
}

// ==========================================
// ANA YÖNETİM FONKSİYONU
// ==========================================

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
// DETAY SAYFASI İŞLEMLERİ
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

    // Galeriyi Kur (Resimler)
    const slaytContainer = document.getElementById("urunSlayt");
    
    // Eski resimleri temizle (butonlar hariç)
    const eskiResimler = slaytContainer.querySelectorAll("img");
    eskiResimler.forEach(img => img.remove());

    // Yeni resimleri ekle
    urun.resimler.forEach((src, index) => {
        const img = document.createElement("img");
        img.src = src;
        if (index === 0) img.classList.add("active");
        
        // Ok butonlarının önüne ekle
        const prevBtn = slaytContainer.querySelector(".prev");
        if(prevBtn) {
            slaytContainer.insertBefore(img, prevBtn);
        } else {
            slaytContainer.appendChild(img);
        }
    });

    // Detay sayfası slayt buton mantığı
    detaySlaytMantigi();
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
            const urunHTML = `
                <a href="urun-detay.html?id=${key}" class="urun" style="text-decoration: none;">
                    <img src="${urun.resimler[0]}" alt="${urun.baslik}">
                    <h4>${urun.baslik}</h4>
                    <p class="fiyat">${urun.fiyat}</p>
                </a>
            `;
            hedefContainer.innerHTML += urunHTML;
        }
    });

    // Arama Kutusu Mantığı
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
                if (urun.baslik.toLowerCase().includes(kelime)) {
                    bulundu = true;
                    aramaSonuclari.innerHTML += `
                        <a href="urun-detay.html?id=${key}" class="urun" style="text-decoration: none;">
                            <img src="${urun.resimler[0]}">
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