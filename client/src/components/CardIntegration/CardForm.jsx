import React, { useState } from 'react';

const CardForm = ({ onSubmit, isProcessing, totalPrice }) => {
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
    } else if (name === 'expiry') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/').substring(0, 5);
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 3);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.cardNumber.length < 19 || formData.expiry.length < 5 || formData.cvv.length < 3) {
      alert('Lütfen kart bilgilerini eksiksiz doldurun.');
      return;
    }

    const [month, year] = formData.expiry.split('/');
    onSubmit({
      cardHolderName: formData.cardHolderName,
      cardNumber: formData.cardNumber,
      expiryMonth: month,
      expiryYear: '20' + year,
      cvv: formData.cvv
    });
  };

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', marginTop: '15px' }}>
      <div>
        <label style={{ fontSize: '12px', color: '#8e8e93', display: 'block', marginBottom: '6px' }}>Kart Sahibinin Adı Soyadı</label>
        <input
          type="text"
          name="cardHolderName"
          required
          placeholder="Ahmet Yılmaz"
          value={formData.cardHolderName}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', color: '#8e8e93', display: 'block', marginBottom: '6px' }}>Kart Numarası</label>
        <input
          type="text"
          name="cardNumber"
          required
          placeholder="0000 0000 0000 0000"
          value={formData.cardNumber}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#8e8e93', display: 'block', marginBottom: '6px' }}>S.K.T (AA/YY)</label>
          <input
            type="text"
            name="expiry"
            required
            placeholder="08/27"
            value={formData.expiry}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#8e8e93', display: 'block', marginBottom: '6px' }}>CVV</label>
          <input
            type="password"
            name="cvv"
            required
            placeholder="123"
            value={formData.cvv}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: isProcessing ? '#1c1c1e' : '#30d158',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          fontWeight: '600',
          fontSize: '16px',
          cursor: 'pointer',
          marginTop: '10px',
          transition: 'all 0.2s'
        }}
      >
        {isProcessing ? 'Ödeme Doğrulanıyor...' : `${totalPrice} ₺ Öde`}
      </button>
    </form>
  );
};

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid #2c2c2e',
  backgroundColor: '#000',
  color: '#fff',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box'
};

export default CardForm;