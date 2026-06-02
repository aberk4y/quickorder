import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { createWorker } from 'tesseract.js';

const CardScanner = ({ onScanSuccess, onClose }) => {
  const webcamRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Kartınızı yeşil çerçeveye hizalayın");

  const captureAndRecognize = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setIsProcessing(true);
    setStatusMessage("Görüntü analiz ediliyor, lütfen kamerayı sabit tutun...");
    
    // Kameradan anlık ekran görüntüsü alıyoruz (Base64 formatında)
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (imageSrc) {
      try {
        // Tesseract.js v5+ standartlarına uygun işçi (worker) kurulumu
        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(imageSrc);
        await worker.terminate(); // Belleği temizlemek için işçiyi hemen kapatıyoruz

        // Metindeki tüm boşlukları ve tireleri temizle, yan yana 16 haneli rakamı ara
        const cleanText = text.replace(/[\s-]/g, '');
        const cardNumberMatch = cleanText.match(/\d{16}/);
        
        // Son kullanma tarihi tespiti için temel regex (AA/YY veya AA/YYYY)
        const expiryMatch = text.match(/(0[1-9]|1[0-2])\/([0-9]{2,4})/);

        if (cardNumberMatch) {
          setStatusMessage("Kart başarıyla okundu!");
          
          // Kart numarasını kullanıcıya şık göstermek için 4'erli gruplara ayırıyoruz (0000 0000 0000 0000)
          const formattedCardNumber = cardNumberMatch[0].replace(/(\d{4})/g, '$1 ').trim();
          
          onScanSuccess({
            cardNumber: formattedCardNumber,
            expiryDate: expiryMatch ? expiryMatch[0] : ""
          });
          return;
        }
        
        setStatusMessage("Kart numarası net okunamadı. Lütfen ışığı ayarlayıp tekrar deneyin.");
      } catch (err) {
        console.error("OCR Hatası:", err);
        setStatusMessage("Tarama motoru başlatılamadı veya bir hata oluştu.");
      }
    } else {
      setStatusMessage("Kameradan görüntü alınamadı.");
    }
    setIsProcessing(false);
  }, [webcamRef, onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md p-6 mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-white">
        
        {/* Kapatma Butonu */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-bold text-slate-100 mb-1">Kamera ile Kart Tara</h3>
        <p className={`text-sm mb-4 font-medium ${isProcessing ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
          {statusMessage}
        </p>

        {/* Kamera Konteyneri ve Hizalama Çerçevesi */}
        <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }} // Mobil cihazlarda arka kamerayı önceler
            className="w-full h-full object-cover"
          />
          
          {/* Kart Yerleşim Kılavuzu */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className={`w-full aspect-[1.58/1] border-2 rounded-xl transition-all duration-300 ${
              isProcessing 
                ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse' 
                : 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}>
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] text-slate-200 bg-slate-950/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-slate-800 tesisat">
                Kartın Ön Yüzünü Hizalayın
              </div>
            </div>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all active:scale-95"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={captureAndRecognize}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Taranıyor...
              </>
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