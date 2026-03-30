/**
 * Currency Management & Converter Component
 * Handles multi-currency support and exchange rates
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CurrencyManagement = () => {
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [schoolCurrency, setSchoolCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('converter');

  // Converter state
  const [fromCurrency, setFromCurrency] = useState('KES');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState(1);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [rate, setRate] = useState(0);

  const API_BASE = 'http://localhost:8000/api/v1';

  useEffect(() => {
    fetchCurrencyData();
  }, []);

  useEffect(() => {
    if (amount && rate) {
      setConvertedAmount((amount * rate).toFixed(2));
    }
  }, [amount, rate]);

  const fetchCurrencyData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      };

      // Fetch currencies
      const currRes = await axios.get(`${API_BASE}/currencies/`, { headers });
      setCurrencies(currRes.data.results || currRes.data);

      // Fetch exchange rates
      const ratesRes = await axios.get(`${API_BASE}/exchange-rates/`, { headers });
      setExchangeRates(ratesRes.data.results || ratesRes.data);

      // Fetch school currency config
      const schoolRes = await axios.get(`${API_BASE}/school-currencies/`, { headers });
      if (schoolRes.data.results?.length > 0) {
        setSchoolCurrency(schoolRes.data.results[0]);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching currency data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    try {
      if (fromCurrency === toCurrency) {
        setConvertedAmount(amount);
        setRate(1);
        return;
      }

      const endpoints = exchangeRates.filter(
        r => r.from_currency_code === fromCurrency && r.to_currency_code === toCurrency
      );

      if (endpoints.length > 0) {
        const latestRate = endpoints[0].rate;
        setRate(latestRate);
      } else {
        alert('Exchange rate not available. Please try again later.');
      }
    } catch (err) {
      console.error('Error converting:', err);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  if (loading) return <div className="p-8 text-center">Loading currencies...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">💱 Currency Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('converter')}
          className={`px-6 py-3 font-medium ${activeTab === 'converter' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          💱 Converter
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-6 py-3 font-medium ${activeTab === 'rates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          📊 Exchange Rates
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 font-medium ${activeTab === 'config' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          ⚙️ Configuration
        </button>
      </div>

      {/* Currency Converter */}
      {activeTab === 'converter' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="space-y-6">
              {/* From Currency */}
              <div>
                <label className="block text-sm font-medium mb-2">From Currency</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapCurrencies}
                  className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                  title="Swap currencies"
                >
                  ⇅
                </button>
              </div>

              {/* To Currency */}
              <div>
                <label className="block text-sm font-medium mb-2">To Currency</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
              >
                Convert
              </button>

              {/* Results */}
              {rate > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
                  <p className="text-2xl font-bold mb-3">
                    {amount} {fromCurrency} = {convertedAmount} {toCurrency}
                  </p>
                  <p className="text-sm text-gray-600">
                    1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exchange Rates Table */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">From</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exchangeRates.map(rate => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{rate.from_currency_code}</td>
                    <td className="px-6 py-4 font-medium">{rate.to_currency_code}</td>
                    <td className="px-6 py-4">{rate.rate.toFixed(6)}</td>
                    <td className="px-6 py-4 text-sm">{new Date(rate.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{rate.source || 'API'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {exchangeRates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No exchange rates available
            </div>
          )}
        </div>
      )}

      {/* Configuration */}
      {activeTab === 'config' && schoolCurrency && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">School Currency Config</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Currency</label>
                <p className="px-4 py-2 bg-gray-50 rounded-lg">{schoolCurrency.primary_currency_code}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Supported Currencies</label>
                <div className="flex flex-wrap gap-2">
                  {schoolCurrency.supported_currencies.map(curr => (
                    <span key={curr.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {curr.code}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Updated</label>
                <p className="text-sm text-gray-600">{new Date(schoolCurrency.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagement;
