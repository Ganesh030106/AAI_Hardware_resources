import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdNRequest() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Options loaded from server
  const [formOptions, setFormOptions] = useState({
    items: [],
    models: [],
    supplierNames: [],
    sellerIds: [],
    itemModelsMap: {},
    vendorsByName: {}
  });

  // Form input states
  const [itemName, setItemName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [itemModel, setItemModel] = useState('');
  const [newItemModel, setNewItemModel] = useState('');
  const [itemSupplier, setItemSupplier] = useState('');
  const [newItemSupplier, setNewItemSupplier] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [arrivalDate, setArrivalDate] = useState('');

  // Mode toggles for new item/model/supplier inputs
  const [newItemMode, setNewItemMode] = useState(false);
  const [newModelMode, setNewModelMode] = useState(false);
  const [newSupplierMode, setNewSupplierMode] = useState(false);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }

    const loadOptions = async () => {
      try {
        const res = await fetch('/api/inventory/form-options');
        if (!res.ok) throw new Error('Failed to load form options');
        const data = await res.json();
        setFormOptions(data);
      } catch (err) {
        console.error('Error loading form options', err);
        alert('Failed to load form options');
      }
    };

    loadOptions();
  }, [user, navigate]);

  // Derived options based on selections
  const availableModels = newItemMode 
    ? [] 
    : formOptions.itemModelsMap[itemName] || formOptions.models || [];

  const handleItemNameChange = (val) => {
    setItemName(val);
    setItemModel('');
  };

  const handleSupplierChange = (supplierName) => {
    setItemSupplier(supplierName);

    const vendorInfo = formOptions.vendorsByName[supplierName];
    if (vendorInfo) {
      setSupplierPhone(vendorInfo.phone || '');
      setGstNumber(vendorInfo.gst_number || '');
      setSellerId(vendorInfo.seller_id || '');
    } else {
      setSupplierPhone('');
      setGstNumber('');
      setSellerId('');
    }
  };

  const generateNextSellerId = () => {
    if (!formOptions.sellerIds || formOptions.sellerIds.length === 0) {
      return 'S001';
    }
    const numbers = formOptions.sellerIds
      .map(id => {
        const match = id.match(/S(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    if (numbers.length === 0) return 'S001';

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    return `S${String(nextNumber).padStart(3, '0')}`;
  };

  const toggleNewSupplier = () => {
    const nextMode = !newSupplierMode;
    setNewSupplierMode(nextMode);
    setItemSupplier('');
    setNewItemSupplier('');
    setSupplierPhone('');
    setGstNumber('');

    if (nextMode) {
      // Auto-generate next seller ID
      const autoId = generateNextSellerId();
      setSellerId(autoId);
    } else {
      setSellerId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalItemName = newItemMode ? newItemName.trim() : itemName.trim();
    const finalModel = newModelMode ? newItemModel.trim() : itemModel.trim();
    const finalSupplier = newSupplierMode ? newItemSupplier.trim() : itemSupplier.trim();

    if (!finalItemName || !finalModel || !finalSupplier || !quantity) {
      alert('Please fill in all required fields marked with * (Item Name, Model, Supplier, Quantity).');
      return;
    }

    if (!sellerId) {
      alert('Seller ID is required. Please select an existing supplier or create a new one.');
      return;
    }

    if (quantity < 1) {
      alert('Quantity must be at least 1.');
      return;
    }

    try {
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: finalItemName,
          model: finalModel,
          supplier: finalSupplier,
          phone: supplierPhone.trim(),
          gst: gstNumber.trim(),
          seller_id: sellerId,
          quantity,
          arrival_date: arrivalDate
        })
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`✅ Success! ${result.data.totalItems} item(s) added to inventory.`, 'success');
        navigate('/html/Ad-inventory.html');
      } else {
        alert('❌ Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('❌ Failed to connect to the server. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:px-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl transform rounded-xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Inventory Item</h2>
          <button 
            onClick={() => navigate('/html/Ad-inventory.html')}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            
            {/* Item Name Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {!newItemMode ? (
                  <select 
                    value={itemName}
                    onChange={(e) => handleItemNameChange(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm outline-none"
                  >
                    <option value="">-- Select Item or Add New --</option>
                    {formOptions.items.map((item, idx) => (
                      <option key={idx} value={item}>{item}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Laptop"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 shadow-sm outline-none animate-slide-in"
                  />
                )}
                <button 
                  type="button" 
                  onClick={() => {
                    setNewItemMode(!newItemMode);
                    setItemName('');
                    setNewItemName('');
                  }}
                  className="px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {newItemMode ? 'remove' : 'add'}
                  </span>
                </button>
              </div>
            </div>

            {/* Model Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Brand - SKU Model <span class="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {!newModelMode ? (
                  <select 
                    value={itemModel}
                    onChange={(e) => setItemModel(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm outline-none"
                  >
                    <option value="">-- Select Model or Add New --</option>
                    {availableModels.map((model, idx) => (
                      <option key={idx} value={model}>{model}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={newItemModel}
                    onChange={(e) => setNewItemModel(e.target.value)}
                    placeholder="e.g. Dell Latitude 7490"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 shadow-sm outline-none animate-slide-in"
                  />
                )}
                <button 
                  type="button" 
                  onClick={() => {
                    setNewModelMode(!newModelMode);
                    setItemModel('');
                    setNewItemModel('');
                  }}
                  className="px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {newModelMode ? 'remove' : 'add'}
                  </span>
                </button>
              </div>
            </div>

            {/* Supplier Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Supplier Name <span class="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {!newSupplierMode ? (
                  <select 
                    value={itemSupplier}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm outline-none"
                  >
                    <option value="">-- Select Supplier or Add New --</option>
                    {formOptions.supplierNames.map((supplier, idx) => (
                      <option key={idx} value={supplier}>{supplier}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                    placeholder="e.g. Dell India"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 shadow-sm outline-none animate-slide-in"
                  />
                )}
                <button 
                  type="button" 
                  onClick={toggleNewSupplier}
                  className="px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {newSupplierMode ? 'remove' : 'add'}
                  </span>
                </button>
              </div>
            </div>

            {/* Supplier Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Supplier Phone
                <input 
                  type="number"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 shadow-sm outline-none"
                  placeholder="e.g. 9876543210" 
                />
              </label>
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                GST Number
                <input 
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 shadow-sm outline-none"
                  placeholder="e.g. 22AAAAA0000A1Z5" 
                />
              </label>
            </div>

            {/* Seller ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Seller ID <span class="text-red-500">*</span>
              </label>
              {!newSupplierMode ? (
                <select 
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm outline-none"
                >
                  <option value="">-- Select Seller ID --</option>
                  {formOptions.sellerIds.map((id, idx) => (
                    <option key={idx} value={id}>{id}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input 
                    type="text" 
                    value={sellerId} 
                    readOnly
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-2.5 text-sm shadow-sm cursor-not-allowed outline-none"
                    placeholder="Auto-generated" 
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Seller ID will be auto-generated for new supplier
                  </p>
                </>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Quantity <span class="text-red-500">*</span>
                <input 
                  type="number" 
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 placeholder:text-slate-400 shadow-sm outline-none"
                  placeholder="e.g. 10" 
                  required 
                />
              </label>
            </div>

            {/* Arrival Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Arrival Date
                <input 
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full mt-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 shadow-sm outline-none" 
                />
              </label>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 -mx-6 -mb-6 p-6 rounded-b-xl mt-4">
              <button 
                type="button"
                onClick={() => navigate('/html/Ad-inventory.html')}
                className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Item
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
