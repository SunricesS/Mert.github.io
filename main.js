// main.js - Tüm site mantığı burada çalışır

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // BÖLÜM 1: ÜRÜNLERİ DİNAMİK YERLEŞTİRME
    // ==========================================
    
    // urunler.js dosyasından gelen 'urunler' objesini döngüye alıyoruz
    if (typeof urunler !== 'undefined') {
        Object.keys(urunler).forEach(key => {
            const urun = urunler[key];

            // Ürünün kategorisine göre HTML'deki doğru kutuyu bul (örn: id="koltuk" içindeki .urun-grid)
            // Not: urunler.js içindeki kategori ismi ile HTML ID'si birebir aynı olmalı (küçük harf)
            const hedefContainer = document.querySelector(`#${urun.kategori} .urun-grid`);

            // Eğer HTML'de böyle bir alan yoksa (örn: yanlış kategori ismi), hata verme geç
            if (!hedefContainer) return;

            // Kart HTML şablonunu oluştur
            const urunHTML = `
                <a href="urun-detay.html?id=${key}" class="urun" style="text-decoration: none;">
                    <img src="${urun.resimler[0]}" alt="${urun.baslik}">
                    <h4>${urun.baslik}</h4>
                    <p class="fiyat">${urun.fiyat}</p>
                </a>
            `;

            // HTML'i kutunun içine ekle
            hedefContainer.innerHTML += urunHTML;
        });
    } else {
        console.error("Hata: urunler.js dosyası bulunamadı veya yüklenmedi!");
    }

    // ==========================================
    // BÖLÜM 2: ANA SAYFA SLAYT (SLIDER) AYARLARI
    // ==========================================

    const slides = document.querySelectorAll('.slayt img');
    // Eğer sayfada slayt yoksa (örneğin detay sayfasındaysak) bu kodları çalıştırma
    if (slides.length > 0) {
        const dots = document.querySelectorAll('.dot');
        const nextBtn = document.querySelector('.next');
        const prevBtn = document.querySelector('.prev');
        let slideIndex = 0;
        let slideInterval; 

        // Slaydı gösteren fonksiyon
        function showSlide(index) {
            if (index >= slides.length) slideIndex = 0;
            else if (index < 0) slideIndex = slides.length - 1;
            else slideIndex = index;

            // Resimleri güncelle
            slides.forEach(slide => slide.classList.remove('active'));
            slides[slideIndex].classList.add('active');

            // Noktaları güncelle (eğer nokta varsa)
            if(dots.length > 0) {
                dots.forEach(dot => dot.classList.remove('active'));
                dots[slideIndex].classList.add('active');
            }
        }

        function nextSlide() { showSlide(slideIndex + 1); }
        function prevSlide() { showSlide(slideIndex - 1); }

        // Otomatik geçiş başlat
        function startAutoSlide() {
            slideInterval = setInterval(nextSlide, 5000); 
        }

        // Kullanıcı müdahale edince sayacı sıfırla
        function resetTimer() {
            clearInterval(slideInterval);
            startAutoSlide();
        }

        // Buton Tıklamaları
        if(nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetTimer(); });
        if(prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetTimer(); });

        // Nokta Tıklamaları
        if(dots.length > 0) {
            dots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    showSlide(i);
                    resetTimer();
                });
            });
        }

        // Başlat
        startAutoSlide();
    }

    // ==========================================
    // BÖLÜM 3: NAVİGASYON VE SCROLL İŞLEMLERİ
    // ==========================================

    // Menüdeki "Katalog" linkine tıklayınca yumuşak kaydırma
    const katalogLink = document.querySelector('nav a[href*="urunler"]'); // Href içinde urunler geçen linki bul
    if (katalogLink) {
        katalogLink.addEventListener('click', (e) => {
            // Eğer ana sayfadaysak kaydır, değilsek normal link gibi çalışsın (index.html'e gitsin)
            if(window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/")) {
                e.preventDefault();
                const hedef = document.querySelector('#urunler');
                if(hedef) hedef.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // "Salon", "Koltuk" butonlarına tıklayınca ilgili bölüme kaydırma
    document.querySelectorAll('.kategori-butonlar button').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target'); // data-target="salon" verisini al
            const targetBolum = document.getElementById(targetId);
            
            if (targetBolum) {
                targetBolum.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ==========================================
    // BÖLÜM 4: ÜRÜN ARAMA İŞLEMİ
    // ==========================================

    const aramaInput = document.getElementById('aramaInput');
    const aramaSonuclari = document.getElementById('aramaSonuclari');
    const tumKategoriler = document.getElementById('tum-kategoriler');

    if (aramaInput) {
        aramaInput.addEventListener('input', (e) => {
            const arananKelime = e.target.value.toLowerCase().trim();

            // Eğer arama kutusu boşsa: Kategorileri göster, sonuçları gizle
            if (arananKelime === "") {
                tumKategoriler.style.display = "block";
                aramaSonuclari.style.display = "none";
                aramaSonuclari.innerHTML = ""; // İçini temizle
                return;
            }

            // Arama kutusu doluysa: Kategorileri gizle, sonuçları göster
            tumKategoriler.style.display = "none";
            aramaSonuclari.style.display = "flex"; // urun-grid flex yapısını kullanır
            aramaSonuclari.innerHTML = ""; // Önceki sonuçları temizle

            let sonucBulundu = false;

            // urunler objesi içinde dön
            Object.keys(urunler).forEach(key => {
                const urun = urunler[key];
                // Ürün başlığı aranan kelimeyi içeriyor mu?
                if (urun.baslik.toLowerCase().includes(arananKelime)) {
                    sonucBulundu = true;
                    
                    // Kart HTML şablonunu oluştur (Bölüm 1'deki ile aynı yapı)
                    const urunHTML = `
                        <a href="urun-detay.html?id=${key}" class="urun" style="text-decoration: none;">
                            <img src="${urun.resimler[0]}" alt="${urun.baslik}">
                            <h4>${urun.baslik}</h4>
                            <p class="fiyat">${urun.fiyat}</p>
                        </a>
                    `;
                    aramaSonuclari.innerHTML += urunHTML;
                }
            });

            // Eğer hiç ürün bulunamadıysa mesaj göster
            if (!sonucBulundu) {
                aramaSonuclari.innerHTML = "<p style='width:100%; text-align:center;'>Aradığınız kriterlere uygun ürün bulunamadı.</p>";
            }
        });
    }

});