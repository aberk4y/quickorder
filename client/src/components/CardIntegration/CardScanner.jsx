import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

// İşçiyi bileşenin dışında tanımlıyoruz ki her renderda sıfırdan kurulup kilitlenmesin
let globalWorker = null;

const CardScanner = ({ onScanSuccess, onClose }) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false); // Motor hazır mı kontrolü
  const [statusMessage, setStatusMessage] = useState("Tarama motoru yükleniyor, lütfen bekleyin...");

  // Bileşen ilk açıldığında OCR motorunu arka planda hemen hazır hale getiriyoruz
  useEffect(() => {
    const initTesseract = async () => {
      try {
        if (!globalWorker) {
          globalWorker = await createWorker('eng');
          await globalWorker.setParameters({
            tessedit_char_whitelist: '0123456789/', // Sadece rakam ve tarih çizgisi
          });
        }
        setIsEngineReady(true);
        setStatusMessage("Tarama motoru hazır! Kartınızı hizalayıp 'Şimdi Tara'ya basın.");
      } catch (err) {
        console.error("OCR Başlatma Hatası:", err);
        setStatusMessage("Motor yüklenirken hata oluştu. Lütfen internetinizi kontrol edin.");
      }
    };

    initTesseract();

    // Bileşen kapanırken işçiyi hemen öldürmüyoruz ki bir sonraki açılışta havuzdan hızlı gelsin
    return () => {
      setIsProcessing(false);
    };
  }, []);

  const captureAndRecognize = async () => {
    if (!webcamRef.current || !isEngineReady || !globalWorker) {
      setStatusMessage("Sistem henüz hazır değil veya kamera başlatılamadı.");
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage("Görüntü çözümleniyor, lütfen kamerayı oynatmayın...");
    
    // Yüksek çözünürlüklü anlık görüntü alıyoruz
    const imageSrc = webcamRef.current.getScreenshot({ width: 1280, height: 720 });
    
    if (!imageSrc) {
      setStatusMessage("Kameradan görüntü alınamadı. İzinleri kontrol edin.");
      setIsProcessing(false);
      return;
    }

    try {
      // Arka planda Tesseract analizini başlatıyoruz
      const ret = await globalWorker.recognize(imageSrc);
      const text = ret.data && ret.data.text ? ret.data.text : "";
      
      console.log("Kameradan Okunan Ham Metin:", text); // Debug için konsola basıyoruz

      // Metindeki boşluk ve tireleri temizle
      const cleanText = text.replace(/[\s-]/g, '');
      
      // RegEx filtreleri
      const cardNumberMatch = cleanText.match(/\d{16}/);
      const expiryMatch = text.match(/(0[1-9]|1[0-2])\/([0-9]{2,4})/);

      if (cardNumberMatch) {
        setIsSuccess(true);
        setStatusMessage("Kart başarıyla algılandı! Aktarılıyor...");
        
        const formattedCardNumber = cardNumberMatch[0].replace(/(\d{4})/g, '$1 ').trim();
        
        setTimeout(() => {
          onScanSuccess({
            cardNumber: formattedCardNumber,
            expiryDate: expiryMatch ? expiryMatch[0] : ""
          });
        }, 1000);

      } else {
        setStatusMessage("Kart numarası tespit edilemedi. Işığı ayarlayıp tekrar deneyin.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Tarama Esnasında Hata Yapılandırıldı:", err);
      setStatusMessage("Analiz esnasında teknik bir hata oluştu.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-white" style={{ textAlign: 'left' }}>
        
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-bold text-slate-100 mb-1">Kamera ile Kart Tara</h3>
        <p className={`text-sm mb-4 font-medium ${
          isSuccess ? 'text-emerald-400' : isProcessing ? 'text-amber-400 animate-pulse' : 'text-slate-400'
        }`}>
          {statusMessage}
        </p>

        <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-700">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment", width: 1280, height: 720 }}
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className={`w-full aspect-[1.58/1] border-2 rounded-xl transition-all duration-300 ${
              isSuccess 
                ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.8)]' 
                : isProcessing 
                  ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
                  : 'border-slate-400/60'
            }`}>
              <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] px-3 py-0.5 rounded-full backdrop-blur-sm border transition-colors ${
                isSuccess ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500' : 'bg-slate-950/80 text-slate-200 border-slate-800'
              }`}>
                {isSuccess ? "Başarıyla Algılandı!" : "Kredi Kartınızı Buraya Hizalayın"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={captureAndRecognize}
            disabled={isProcessing || !isEngineReady || isSuccess}
            className={`flex-1 py-3 px-4 font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 ${
              isSuccess 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white'
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
            ) : !isEngineReady ? (
              "Yükleniyor..."
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