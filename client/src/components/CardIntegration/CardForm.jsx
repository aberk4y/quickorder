import React, { useState } from 'react';
import CardScanner from './CardScanner';

const CardForm = () => {
  const [formData, setFormData] = useState({
    cardHolder: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [nfcStatus, setNfcStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Kameradan kart bilgisi başarıyla geldiğinde tetiklenen fonksiyon
  const handleScanSuccess = (scannedData) => {
    setFormData(prev => ({
      ...prev,
      cardNumber: scannedData.cardNumber,
      expiryDate: scannedData.expiryDate || prev.expiryDate 
    }));
    setIsScannerOpen(false); // Modalı kapatır
  };

  // NFC ile İstanbulkart / RFID Okuma Sistemi
  const handleNFCScan = async () => {
    setNfcStatus('NFC aktif. Kartınızı cihazın arkasına yaklaştırın...');
    try {
      if (!('NDEFReader' in window)) {
        throw new Error('NotSupportedError');
      }

      const ndef = new NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ serialNumber }) => {
        setFormData(prev => ({ ...prev, cardNumber: `Transit ID: ${serialNumber}` }));
        setNfcStatus('Kart NFC ile başarıyla okundu!');
        setTimeout(() => setNfcStatus(''), 3000);
      });

    } catch (error) {
      console.error("NFC Bağlantı Hatası:", error);
      setNfcStatus('');
      
      if (error.name === 'NotSupportedError' || error.message === 'NotSupportedError') {
        alert("Bu tarayıcı veya cihaz Web NFC standartlarını desteklemiyor. Lütfen 'Kamera ile Tara' seçeneğini kullanın.");
      } else {
        // Banka kartı dokundurulduğunda EMV blokajı sebebiyle bu catch bloğu çalışır
        alert("Banka kartları yüksek güvenlik protokolleri (EMV) sebebiyle NFC ile doğrudan okunamaz. Lütfen 'Kamera ile Tara' butonunu kullanın.");
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl text-white">
      <h2 className="text-2xl font-bold mb-2 text-slate-100">Ödeme ve Kart Tanımlama</h2>
      <p className="text-sm text-slate-400 mb-6">Kart bilgilerinizi hızlıca eklemek için aşağıdaki yöntemlerden birini seçebilirsiniz.</p>

      {/* Yan Yana İki Şık Hızlı Giriş Butonu */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        
        {/* NFC Butonu */}
        <button
          type="button"
          onClick={handleNFCScan}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-2xl hover:border-blue-500 transition-all group active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <span className="font-semibold text-sm">NFC ile Okut</span>
          <span className="text-[11px] text-slate-400 mt-0.5">İstanbulkart & RFID</span>
        </button>

        {/* Kamera Butonu */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-2xl hover:border-emerald-500 transition-all group active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">Kamera ile Tara</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Banka & Kredi Kartı</span>
        </button>
      </div>

      {/* NFC Durum Mesajı */}
      {nfcStatus && (
        <div className="mb-4 p-2.5 bg-blue-950/40 border border-blue-900/50 rounded-xl text-center text-xs text-blue-400 animate-pulse">
          {nfcStatus}
        </div>
      )}

      {/* Standart Giriş Formu */}
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Kart Sahibi</label>
          <input
            type="text"
            name="cardHolder"
            value={formData.cardHolder}
            onChange={handleInputChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Ad Soyad"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Kart Numarası</label>
          <input
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleInputChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono tracking-widest text-lg"
            placeholder="0000 0000 0000 0000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Son Kullanma</label>
            <input
              type="text"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono"
              placeholder="AA/YY"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">CVV / CVC</label>
            <input
              type="text"
              name="cvv"
              value={formData.cvv}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-center font-mono"
              placeholder="***"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl tracking-wide transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99]"
        >
          Sisteme Tanımla ve Devam Et
        </button>
      </form>

      {/* Kamera Modali */}
      {isScannerOpen && (
        <CardScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};

export default CardForm;