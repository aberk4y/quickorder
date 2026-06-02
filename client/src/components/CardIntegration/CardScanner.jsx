import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

const CardScanner = ({ onScanSuccess, onClose }) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Kart başarıyla okundu mu?
  const [statusMessage, setStatusMessage] = useState("Kartınızı çerçeveye hizalayın ve 'Şimdi Tara' butonuna basın");

  const captureAndRecognize = useCallback(async () => {
    if (!webcamRef.current) {
      setStatusMessage("Kamera başlatılamadı.");
      return;
    }
    
    setIsProcessing(true);
    setIsSuccess(false);
    setStatusMessage("Görüntü analiz ediliyor, lütfen kamerayı sabit tutun...");
    
    // Tesseract'ın en iyi okuyabileceği formatta Base64 görüntüyü alıyoruz
    const imageSrc = webcamRef.current.getScreenshot({ width: 1280, height: 720 });
    
    if (!imageSrc) {
      setStatusMessage("Kameradan anlık görüntü alınamadı. İzinleri kontrol edin.");
      setIsProcessing(false);
      return;
    }

    let worker = null;
    try {
      // Tesseract İşçisini (Worker) başlatıyoruz
      worker = await createWorker('eng');
      
      // OCR motorunun sadece sayılara ve tarihteki eğik çizgiye odaklanmasını sağlayarak hızlandırıyoruz
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789/',
      });

      const ret = await worker.recognize(imageSrc);
      const text = ret.data && ret.data.text ? ret.data.text : "";
      
      // Metindeki tüm boşlukları, gizli karakterleri ve tireleri temizle
      const cleanText = text.replace(/[\s-]/g, '');
      
      // RegEx: Yan yana 16 haneli rakamı ara (Kart Numarası)
      const cardNumberMatch = cleanText.match(/\d{16}/);
      
      // RegEx: AA/YY veya AA/YYYY formatında tarihi ara (Son Kullanma Tarihi)
      const expiryMatch = text.match(/(0[1-9]|1[0-2])\/([0-9]{2,4})/);

      if (cardNumberMatch) {
        setIsSuccess(true); // Çerçevenin yeşil yanmasını tetikle
        setStatusMessage("Kart başarıyla okundu! Aktarılıyor...");
        
        // Kart numarasını kullanıcıya şık göstermek için 4'erli gruplara ayır (XXXX XXXX XXXX XXXX)
        const formattedCardNumber = cardNumberMatch[0].replace(/(\d{4})/g, '$1 ').trim();
        
        // 1 saniye başarı efektini gösterip ana sayfaya veriyi gönder
        setTimeout(() => {
          onScanSuccess({
            cardNumber: formattedCardNumber,
            expiryDate: expiryMatch ? expiryMatch[0] : ""
          });
        }, 1200);

      } else {
        setStatusMessage("Kart numarası net okunamadı. Lütfen ışığı ayarlayıp tekrar deneyin.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("OCR Tarama Hatası:", err);
      setStatusMessage("Tarama motoru başlatılamadı veya bir hata oluştu.");
      setIsProcessing(false);
    } finally {
      if (worker) {
        await worker.terminate(); // Bellek sızıntılarını önlemek için işçiyi her durumda kapat
      }
    }
  }, [webcamRef, onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md p-6 mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-white" style={{ textAlign: 'left' }}>
        
        {/* Kapatma Butonu */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-bold text-slate-100 mb-1">Kamera ile Kart Tara</h3>
        <p className={`text-sm mb-4 font-medium transition-colors ${
          isSuccess ? 'text-emerald-400' : isProcessing ? 'text-amber-400 animate-pulse' : 'text-slate-400'
        }`}>
          {statusMessage}
        </p>

        {/* Kamera Konteyneri */}
        <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment", width: 1280, height: 720 }}
            className="w-full h-full object-cover"
          />
          
          {/* Dinamik Tarama Çerçevesi */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className={`w-full aspect-[1.58/1] border-2 rounded-xl transition-all duration-300 ${
              isSuccess 
                ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.8)]' // Başarılı olunca parlayan yeşil çerçeve
                : isProcessing 
                  ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse' // Taranırken animasyonlu sarı çerçeve
                  : 'border-slate-400/60 shadow-[0_0_15px_rgba(255,255,255,0.1)]' // Bekleme modu nötr çerçeve
            }`}>
              
              {/* Çerçevenin ortasındaki kılavuz yazı */}
              <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] px-3 py-0.5 rounded-full backdrop-blur-sm border transition-colors ${
                isSuccess 
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500' 
                  : 'bg-slate-950/80 text-slate-200 border-slate-800'
              }`}>
                {isSuccess ? "Başarıyla Algılandı!" : "Kredi Kartınızı Buraya Hizalayın"}
              </div>

              {/* Köşe Süsleri (Daha kurumsal bir tarayıcı hissi için) */}
              <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 ${isSuccess ? 'border-emerald-400' : 'border-white/40'}`}></div>
              <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 ${isSuccess ? 'border-emerald-400' : 'border-white/40'}`}></div>
              <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 ${isSuccess ? 'border-emerald-400' : 'border-white/40'}`}></div>
              <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 ${isSuccess ? 'border-emerald-400' : 'border-white/40'}`}></div>
            </div>
          </div>
        </div>

        {/* Butonlar */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold rounded-xl transition-all active:scale-95"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={captureAndRecognize}
            disabled={isProcessing || isSuccess}
            className={`flex-1 py-3 px-4 font-semibold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isSuccess 
                ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-300 text-white shadow-indigo-600/20'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Okunuyor...
              </>
            ) : isSuccess ? (
              "Başarılı!"
            ) : (
              "Şimdi Tara"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CardScanner;